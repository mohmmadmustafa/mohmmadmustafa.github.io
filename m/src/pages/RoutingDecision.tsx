import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Navigation, MapPin, AlertTriangle, Search, Info, ChevronDown, Loader2 } from "lucide-react";
import { getAllCaseTypes, findEligibleHospitals, getRoutingRule } from "@/lib/routing";
import { RoutingResult } from "@/types";
import HospitalCard from "@/components/features/HospitalCard";

const RoutingDecision = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [caseType, setCaseType] = useState("");
  const [results, setResults] = useState<RoutingResult[]>([]);
  const [isManual, setIsManual] = useState(false);
  const [ruleNotes, setRuleNotes] = useState("");
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasFallback, setHasFallback] = useState(false);

  const caseTypes = getAllCaseTypes();

  // Pre-fill coordinates if coming back from MapPicker
  useEffect(() => {
    const state = location.state as { pickedLat?: number; pickedLon?: number } | null;
    if (state?.pickedLat !== undefined && state?.pickedLon !== undefined) {
      setLat(String(state.pickedLat));
      setLon(String(state.pickedLon));
      // Clear state so it doesn't re-apply on future navigations
      window.history.replaceState({}, "");
    }
  }, [location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);

    if (isNaN(latNum) || isNaN(lonNum)) {
      setError("Please enter valid latitude and longitude coordinates.");
      return;
    }
    if (!caseType) {
      setError("Please select a dispatch case type.");
      return;
    }

    const rule = getRoutingRule(caseType);
    if (!rule) {
      setError("No routing rule found for this case type.");
      return;
    }

    if (!rule.Route_Mode) {
      setSearched(true);
      setResults([]);
      setIsManual(false);
      setRuleNotes(rule.Rule_Notes || "");
      return;
    }

    setLoading(true);
    setSearched(false);

    const { results: routingResults, isManual: manual } = await findEligibleHospitals(
      latNum,
      lonNum,
      caseType
    );

    setResults(routingResults);
    setIsManual(manual);
    setRuleNotes(rule.Rule_Notes || "");
    setHasFallback(routingResults.some((r) => r.isFallback));
    setSearched(true);
    setLoading(false);
  };

  const handleViewMap = (result: RoutingResult) => {
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    navigate("/map", {
      state: {
        incidentLat: latNum,
        incidentLon: lonNum,
        results,
        selectedId: result.hospital.Hospital_ID,
      },
    });
  };

  const handleViewAllOnMap = () => {
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    navigate("/map", {
      state: {
        incidentLat: latNum,
        incidentLon: lonNum,
        results,
        selectedId: results[0]?.hospital.Hospital_ID,
      },
    });
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--bg))]">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Navigation className="w-5 h-5 text-[hsl(var(--brand))]" />
            <h1 className="text-white font-bold text-xl">New Routing Decision</h1>
          </div>
          <p className="text-[hsl(var(--text-muted))] text-sm">
            Enter the incident coordinates and case type to identify the best hospital destination.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border-strong))] rounded-xl p-5 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Location Row */}
            <div>
              <label className="block text-xs font-bold text-[hsl(var(--text-muted))] uppercase tracking-wider mb-2">
                <MapPin className="w-3 h-3 inline mr-1" />
                Incident Location
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[hsl(var(--text-muted))] mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    placeholder="e.g. 25.3548"
                    className="w-full bg-[hsl(var(--bg))] border border-[hsl(var(--border-strong))] rounded-lg px-3 py-2.5 text-white text-sm placeholder-[hsl(var(--text-muted))] focus:outline-none focus:border-[hsl(var(--brand))] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[hsl(var(--text-muted))] mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={lon}
                    onChange={(e) => setLon(e.target.value)}
                    placeholder="e.g. 55.4050"
                    className="w-full bg-[hsl(var(--bg))] border border-[hsl(var(--border-strong))] rounded-lg px-3 py-2.5 text-white text-sm placeholder-[hsl(var(--text-muted))] focus:outline-none focus:border-[hsl(var(--brand))] transition-colors"
                  />
                </div>
              </div>
              <p className="text-[10px] text-[hsl(var(--text-muted))] mt-1.5 flex items-center gap-1">
                <Info className="w-3 h-3" />
                UAE coordinates: Lat 22–26°N, Lon 51–57°E
              </p>

              <button
  type="button"
  onClick={() => navigate("/map-picker")}
  className="mt-3 w-full border border-[hsl(var(--border-strong))] bg-[hsl(var(--surface-dark))] text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 hover:border-[hsl(var(--brand))] transition-colors text-sm"
>
  <MapPin className="w-4 h-4" />
  Pick Incident Location on Map
</button>

            </div>

            {/* Case Type */}
            <div>
              <label className="block text-xs font-bold text-[hsl(var(--text-muted))] uppercase tracking-wider mb-2">
                Dispatch Case Type
              </label>
              <div className="relative">
                <select
                  value={caseType}
                  onChange={(e) => setCaseType(e.target.value)}
                  className="w-full bg-[hsl(var(--bg))] border border-[hsl(var(--border-strong))] rounded-lg px-3 py-2.5 text-white text-sm appearance-none focus:outline-none focus:border-[hsl(var(--brand))] transition-colors pr-8"
                >
                  <option value="" disabled className="text-[hsl(var(--text-muted))]">
                    Select case type...
                  </option>
                  {caseTypes.map((ct) => (
                    <option key={ct} value={ct} className="bg-[hsl(var(--surface-dark))]">
                      {ct}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--text-muted))] pointer-events-none" />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span className="text-red-300 text-sm">{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[hsl(var(--brand))] text-black font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-[hsl(var(--brand-hover))] transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Calculating road routes…
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Find Destination
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        {searched && (
          <div>
            {/* Manual Warning Banner */}
            {isManual && (
              <div className="flex items-start gap-3 bg-amber-500/10 border-2 border-amber-500/50 rounded-xl p-4 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-amber-300 font-bold text-sm">Manual Confirmation Required</div>
                  <div className="text-amber-400/80 text-xs mt-1">
                    This case type requires manual dispatcher confirmation before destination selection.
                    {ruleNotes && ` ${ruleNotes}.`}
                  </div>
                </div>
              </div>
            )}

            {/* Rule Notes */}
            {ruleNotes && !isManual && (
              <div className="flex items-start gap-2 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
                <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <span className="text-blue-300 text-xs">{ruleNotes}</span>
              </div>
            )}

            {/* Fallback Notice */}
            {hasFallback && (
              <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-4">
                <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span className="text-amber-300/80 text-xs">
                  Some routes could not be retrieved from the road routing service. Distances marked "est." are straight-line estimates.
                </span>
              </div>
            )}

            {/* No Results */}
            {results.length === 0 && (
              <div className="bg-[hsl(var(--surface))] border border-red-500/30 rounded-xl p-8 text-center">
                <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                <h3 className="text-white font-bold text-lg mb-2">No Eligible Hospital Found</h3>
                <p className="text-[hsl(var(--text-muted))] text-sm">
                  No hospitals match the requirements for this case type.
                  Please escalate to manual review and contact medical direction.
                </p>
              </div>
            )}

            {/* Hospital Cards */}
            {results.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-white font-bold">
                    {results.length} Eligible Hospital{results.length !== 1 ? "s" : ""} Found
                  </h2>
                  <button
                    onClick={handleViewAllOnMap}
                    className="text-xs text-[hsl(var(--brand))] hover:text-[hsl(var(--brand-hover))] font-medium transition-colors flex items-center gap-1"
                  >
                    <MapPin className="w-3 h-3" />
                    View All on Map
                  </button>
                </div>
                <div className="space-y-4">
                  {results.map((result) => (
                    <HospitalCard
                      key={result.hospital.Hospital_ID}
                      result={result}
                      isPrimary={result.rank === 1}
                      onViewMap={() => handleViewMap(result)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoutingDecision;
