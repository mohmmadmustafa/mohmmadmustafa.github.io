import { useState, useMemo, useEffect } from "react";
import { BookOpen, Search, X, ChevronDown, ChevronUp, MapPin, Phone, Loader2, AlertTriangle } from "lucide-react";
import { loadHospitals } from "@/data/hospitals";
import { Hospital } from "@/types";

const EMIRATES = ["All", "Ajman", "Dubai", "Fujairah", "RAK", "Sharjah", "UAQ"];
const SECTORS = ["All", "EHS", "MOPA", "Private"];

interface Filters {
  emirate: string;
  sector: string;
  Cath_Lab_PCI: boolean;
  CT_Scan: boolean;
  Thrombolysis_Capable: boolean;
  Pediatric_Emergency: boolean;
  Trauma_Specialty: boolean;
  Burns_Capability: boolean;
}

const capabilityFilters: Array<{ key: keyof Filters; label: string }> = [
  { key: "Cath_Lab_PCI", label: "Cath Lab / PCI" },
  { key: "CT_Scan", label: "CT Scan" },
  { key: "Thrombolysis_Capable", label: "Thrombolysis" },
  { key: "Pediatric_Emergency", label: "Pediatric Emergency" },
  { key: "Trauma_Specialty", label: "Trauma Specialty" },
  { key: "Burns_Capability", label: "Burns Capability" },
];

const HospitalDirectory = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>({
    emirate: "All",
    sector: "All",
    Cath_Lab_PCI: false,
    CT_Scan: false,
    Thrombolysis_Capable: false,
    Pediatric_Emergency: false,
    Trauma_Specialty: false,
    Burns_Capability: false,
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingData(true);
    setLoadError(null);
    loadHospitals()
      .then((data) => {
        if (!cancelled) {
          setHospitals(data);
          setLoadingData(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Failed to load hospitals:", err);
          setLoadError("Failed to load hospital data. Please check the data source and try again.");
          setLoadingData(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  const filteredHospitals = useMemo(() => {
    return hospitals.filter((h) => {
      const searchLower = search.toLowerCase();
      if (
        search &&
        !h.Hospital_Name.toLowerCase().includes(searchLower) &&
        !h.Emirate.toLowerCase().includes(searchLower) &&
        !h.Sector.toLowerCase().includes(searchLower)
      )
        return false;
      if (filters.emirate !== "All" && h.Emirate !== filters.emirate) return false;
      if (filters.sector !== "All" && h.Sector !== filters.sector) return false;
      if (filters.Cath_Lab_PCI && h.Cath_Lab_PCI !== "Yes") return false;
      if (filters.CT_Scan && h.CT_Scan !== "Yes") return false;
      if (filters.Thrombolysis_Capable && h.Thrombolysis_Capable !== "Yes") return false;
      if (filters.Pediatric_Emergency && h.Pediatric_Emergency !== "Yes") return false;
      if (filters.Trauma_Specialty && h.Trauma_Specialty !== "Yes") return false;
      if (filters.Burns_Capability && h.Burns_Capability !== "Yes") return false;
      return true;
    });
  }, [hospitals, search, filters]);

  const activeFilterCount =
    (filters.emirate !== "All" ? 1 : 0) +
    (filters.sector !== "All" ? 1 : 0) +
    capabilityFilters.filter((f) => filters[f.key]).length;

  const resetFilters = () => {
    setFilters({
      emirate: "All",
      sector: "All",
      Cath_Lab_PCI: false,
      CT_Scan: false,
      Thrombolysis_Capable: false,
      Pediatric_Emergency: false,
      Trauma_Specialty: false,
      Burns_Capability: false,
    });
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--bg))]">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-5 h-5 text-[hsl(var(--brand))]" />
            <h1 className="text-white font-bold text-xl">Hospital Directory</h1>
          </div>
          <p className="text-[hsl(var(--text-muted))] text-sm">
            {loadingData
              ? "Loading hospital data…"
              : loadError
              ? "Data source unavailable."
              : `Browse all ${hospitals.length} registered hospitals across UAE emirates.`}
          </p>
        </div>

        {/* Loading State */}
        {loadingData && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 text-[hsl(var(--brand))] animate-spin" />
            <p className="text-[hsl(var(--text-muted))] text-sm">Loading hospital records…</p>
          </div>
        )}

        {/* Error State */}
        {!loadingData && loadError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-red-300 font-semibold text-sm mb-1">Unable to load hospitals</div>
              <div className="text-red-400/80 text-xs">{loadError}</div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!loadingData && !loadError && (
          <>
            {/* Search + Filter Toggle */}
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--text-muted))]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search hospital name, emirate, sector…"
                  className="w-full bg-[hsl(var(--surface))] border border-[hsl(var(--border-strong))] rounded-lg pl-9 pr-4 py-2.5 text-white text-sm placeholder-[hsl(var(--text-muted))] focus:outline-none focus:border-[hsl(var(--brand))] transition-colors"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--text-muted))] hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  activeFilterCount > 0
                    ? "bg-[hsl(var(--brand))]/10 border-[hsl(var(--brand))]/50 text-[hsl(var(--brand))]"
                    : "bg-[hsl(var(--surface))] border-[hsl(var(--border-strong))] text-[hsl(var(--text-muted))] hover:text-white"
                }`}
              >
                Filters
                {activeFilterCount > 0 && (
                  <span className="bg-[hsl(var(--brand))] text-black text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Filter Panel */}
            {filtersOpen && (
              <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border-strong))] rounded-xl p-4 mb-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {/* Emirate */}
                  <div>
                    <label className="block text-xs font-bold text-[hsl(var(--text-muted))] uppercase tracking-wider mb-2">
                      Emirate
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {EMIRATES.map((e) => (
                        <button
                          key={e}
                          onClick={() => setFilters((f) => ({ ...f, emirate: e }))}
                          className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                            filters.emirate === e
                              ? "bg-[hsl(var(--brand))] border-[hsl(var(--brand))] text-black font-bold"
                              : "border-[hsl(var(--border-strong))] text-[hsl(var(--text-muted))] hover:text-white"
                          }`}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sector */}
                  <div>
                    <label className="block text-xs font-bold text-[hsl(var(--text-muted))] uppercase tracking-wider mb-2">
                      Sector
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {SECTORS.map((s) => (
                        <button
                          key={s}
                          onClick={() => setFilters((f) => ({ ...f, sector: s }))}
                          className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                            filters.sector === s
                              ? "bg-[hsl(var(--brand))] border-[hsl(var(--brand))] text-black font-bold"
                              : "border-[hsl(var(--border-strong))] text-[hsl(var(--text-muted))] hover:text-white"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Capability Toggles */}
                <div>
                  <label className="block text-xs font-bold text-[hsl(var(--text-muted))] uppercase tracking-wider mb-2">
                    Required Capabilities
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {capabilityFilters.map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setFilters((f) => ({ ...f, [key]: !f[key] }))}
                        className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                          filters[key]
                            ? "bg-green-500/20 border-green-500/50 text-green-300"
                            : "border-[hsl(var(--border-strong))] text-[hsl(var(--text-muted))] hover:text-white"
                        }`}
                      >
                        {filters[key] ? "✓ " : ""}{label}
                      </button>
                    ))}
                  </div>
                </div>

                {activeFilterCount > 0 && (
                  <button
                    onClick={resetFilters}
                    className="mt-3 text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}

            {/* Results Count */}
            <div className="text-[hsl(var(--text-muted))] text-xs mb-3">
              Showing {filteredHospitals.length} of {hospitals.length} hospitals
            </div>

            {/* Hospital List */}
            <div className="space-y-2">
              {filteredHospitals.length === 0 ? (
                <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border-strong))] rounded-xl p-8 text-center">
                  <Search className="w-8 h-8 text-[hsl(var(--text-muted))] mx-auto mb-2" />
                  <p className="text-[hsl(var(--text-muted))]">No hospitals match your filters.</p>
                </div>
              ) : (
                filteredHospitals.map((hospital) => (
                  <HospitalRow
                    key={hospital.Hospital_ID}
                    hospital={hospital}
                    isExpanded={expandedId === hospital.Hospital_ID}
                    onToggle={() =>
                      setExpandedId(expandedId === hospital.Hospital_ID ? null : hospital.Hospital_ID)
                    }
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const HospitalRow = ({
  hospital,
  isExpanded,
  onToggle,
}: {
  hospital: Hospital;
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  const capabilities = [
    { label: "Cath Lab", active: hospital.Cath_Lab_PCI === "Yes" },
    { label: "CT Scan", active: hospital.CT_Scan === "Yes" },
    { label: "Thrombolysis", active: hospital.Thrombolysis_Capable === "Yes" },
    { label: "Pediatric", active: hospital.Pediatric_Emergency === "Yes" },
    { label: "OB/GYN", active: hospital.Obstetrics_Gynecology === "Yes" },
    { label: "Trauma", active: hospital.Trauma_Specialty === "Yes" },
    { label: "Burns", active: hospital.Burns_Capability === "Yes" },
    { label: "Helipad", active: hospital.Helipad === "Yes" },
  ].filter((c) => c.active);

  return (
    <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border-strong))] rounded-xl overflow-hidden transition-all">
      {/* Row Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-white font-semibold text-sm">{hospital.Hospital_Name}</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                hospital.Sector === "EHS"
                  ? "bg-blue-500/20 text-blue-300"
                  : hospital.Sector === "MOPA"
                  ? "bg-purple-500/20 text-purple-300"
                  : "bg-slate-500/20 text-slate-300"
              }`}
            >
              {hospital.Sector}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[hsl(var(--text-muted))] text-xs">
            <MapPin className="w-3 h-3" />
            <span>{hospital.Emirate}</span>
            <span>·</span>
            <span className={hospital.Status === "Open" ? "text-green-400" : "text-red-400"}>
              {hospital.Status}
            </span>
            <span>·</span>
            <span className={hospital.Diversion_Status === "Open" ? "text-green-400" : "text-amber-400"}>
              Div: {hospital.Diversion_Status}
            </span>
          </div>
        </div>

        {/* Capability pills preview */}
        <div className="hidden md:flex flex-wrap gap-1 max-w-[280px]">
          {capabilities.slice(0, 4).map((c) => (
            <span
              key={c.label}
              className="text-[10px] bg-[hsl(var(--brand))]/10 text-[hsl(var(--brand))] border border-[hsl(var(--brand))]/20 px-1.5 py-0.5 rounded"
            >
              {c.label}
            </span>
          ))}
          {capabilities.length > 4 && (
            <span className="text-[10px] text-[hsl(var(--text-muted))]">+{capabilities.length - 4}</span>
          )}
        </div>

        <div className="text-[hsl(var(--text-muted))] flex-shrink-0">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded Detail */}
      {isExpanded && (
        <div className="border-t border-[hsl(var(--border-strong))] p-4 space-y-4">
          {/* Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <InfoBlock label="Hospital ID" value={hospital.Hospital_ID} />
            <InfoBlock label="Operating Hours" value={hospital.Operating_Hours} />
            <InfoBlock label="Resus Rooms" value={hospital.Resus_Room_Count || "—"} />
            <InfoBlock label="ER Beds" value={hospital.ER_Bed_Count || "—"} />
            <InfoBlock label="ICU Beds" value={hospital.ICU_Bed_Count || "—"} />
            <InfoBlock label="Emergency OR" value={hospital.Emergency_Operating_Theatre} colored />
            <InfoBlock label="Helipad" value={hospital.Helipad} colored />
            <InfoBlock label="Fibrinolytic" value={hospital.Fibrinolytic_Capable} colored />
          </div>

          {/* All Capabilities */}
          <div>
            <div className="text-xs font-bold text-[hsl(var(--text-muted))] uppercase tracking-wider mb-2">
              All Capabilities
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "Cath Lab / PCI", val: hospital.Cath_Lab_PCI },
                { label: "CT Scan", val: hospital.CT_Scan },
                { label: "Thrombolysis", val: hospital.Thrombolysis_Capable },
                { label: "Fibrinolytic", val: hospital.Fibrinolytic_Capable },
                { label: "Pediatric ER", val: hospital.Pediatric_Emergency },
                { label: "OB / GYN", val: hospital.Obstetrics_Gynecology },
                { label: "Trauma Specialty", val: hospital.Trauma_Specialty },
                { label: "Burns Capability", val: hospital.Burns_Capability },
                { label: "Helipad", val: hospital.Helipad },
                { label: "Emergency OR", val: hospital.Emergency_Operating_Theatre },
              ].map(({ label, val }) => (
                <span
                  key={label}
                  className={`text-xs px-2 py-1 rounded border font-medium ${
                    val === "Yes"
                      ? "bg-green-500/15 border-green-500/30 text-green-300"
                      : "bg-white/5 border-white/10 text-[hsl(var(--text-muted))]"
                  }`}
                >
                  {val === "Yes" ? "✓" : "✗"} {label}
                </span>
              ))}
            </div>
          </div>

          {/* Exclusions */}
          {hospital.Exclusion && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
              <div className="text-xs font-bold text-amber-400 mb-1">Exclusions / Limitations</div>
              <div className="text-xs text-amber-300">{hospital.Exclusion}</div>
            </div>
          )}

          {/* Specialties */}
          {hospital.Specialties_Available && (
            <div>
              <div className="text-xs font-bold text-[hsl(var(--text-muted))] uppercase tracking-wider mb-1">
                Specialties Available
              </div>
              <p className="text-xs text-[hsl(var(--text-muted))] leading-relaxed">
                {hospital.Specialties_Available}
              </p>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex gap-2 pt-1">
            {hospital.Emergency_Contact_Number && (
              <a
                href={`tel:${hospital.Emergency_Contact_Number}`}
                className="flex items-center gap-1.5 text-xs bg-[hsl(var(--brand))]/10 border border-[hsl(var(--brand))]/30 text-[hsl(var(--brand))] px-3 py-2 rounded-lg hover:bg-[hsl(var(--brand))]/20 transition-colors"
              >
                <Phone className="w-3 h-3" />
                Emergency Contact
              </a>
            )}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${hospital.Latitude},${hospital.Longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs bg-white/5 border border-white/10 text-[hsl(var(--text-muted))] px-3 py-2 rounded-lg hover:text-white hover:border-white/30 transition-colors"
            >
              <MapPin className="w-3 h-3" />
              Google Maps
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

const InfoBlock = ({
  label,
  value,
  colored = false,
}: {
  label: string;
  value: string;
  colored?: boolean;
}) => (
  <div className="bg-[hsl(var(--bg))] rounded-lg p-2.5">
    <div className="text-[10px] text-[hsl(var(--text-muted))] uppercase tracking-wider mb-1">{label}</div>
    <div
      className={`text-sm font-semibold ${
        colored
          ? value === "Yes"
            ? "text-green-400"
            : "text-[hsl(var(--text-muted))]"
          : "text-white"
      }`}
    >
      {value}
    </div>
  </div>
);

export default HospitalDirectory;
