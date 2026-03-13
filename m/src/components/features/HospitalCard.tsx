import { RoutingResult } from "@/types";
import { MapPin, Bed, Activity, AlertTriangle, CheckCircle, Clock, Route } from "lucide-react";

interface HospitalCardProps {
  result: RoutingResult;
  isPrimary?: boolean;
  onViewMap?: () => void;
}

const rankLabels = ["Primary Destination", "Backup 1", "Backup 2"];
const rankColors = [
  "border-[hsl(var(--brand))] bg-[hsl(var(--brand))]/10",
  "border-blue-500/40 bg-blue-500/5",
  "border-slate-500/40 bg-slate-500/5",
];
const rankBadgeColors = [
  "bg-[hsl(var(--brand))] text-black",
  "bg-blue-500 text-white",
  "bg-slate-500 text-white",
];

const HospitalCard = ({ result, isPrimary = false, onViewMap }: HospitalCardProps) => {
  const { hospital, distance, duration, matchedReasons, rank, isFallback } = result;
  const idx = rank - 1;

  return (
    <div
      className={`rounded-lg border-2 p-4 transition-all ${rankColors[idx]} ${
        isPrimary ? "shadow-lg" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${rankBadgeColors[idx]}`}>
              {rankLabels[idx]}
            </span>
            <span className="text-[hsl(var(--text-muted))] text-xs font-mono">
              {hospital.Hospital_ID}
            </span>
          </div>
          <h3 className="text-white font-bold text-base leading-tight">{hospital.Hospital_Name}</h3>
          <div className="flex items-center gap-1 mt-1 text-[hsl(var(--text-muted))] text-xs">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span>{hospital.Emirate} · {hospital.Sector}</span>
          </div>
        </div>
        {/* Distance + Duration block */}
        <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
          <div className="flex items-baseline gap-1">
            <span className="text-[hsl(var(--brand))] font-bold text-xl leading-none">{distance.toFixed(1)}</span>
            <span className="text-[hsl(var(--text-muted))] text-xs">km</span>
          </div>
          {duration > 0 && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-[hsl(var(--text-muted))]" />
              <span className="text-[hsl(var(--text-muted))] text-xs font-medium">{duration} min</span>
            </div>
          )}
          {isFallback && (
            <span className="text-[10px] text-amber-400/70 flex items-center gap-0.5">
              <Route className="w-2.5 h-2.5" />
              est.
            </span>
          )}
        </div>
      </div>

      {/* Status Row */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <StatusPill label="Status" value={hospital.Status} />
        <StatusPill label="Diversion" value={hospital.Diversion_Status} />
        {hospital.Helipad === "Yes" && (
          <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded font-medium">
            🚁 Helipad
          </span>
        )}
      </div>

      {/* Bed Counts */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <BedStat label="Resus" value={hospital.Resus_Room_Count} icon={<Activity className="w-3 h-3" />} />
        <BedStat label="ER Beds" value={hospital.ER_Bed_Count} icon={<Bed className="w-3 h-3" />} />
        <BedStat label="ICU Beds" value={hospital.ICU_Bed_Count} icon={<Bed className="w-3 h-3" />} />
      </div>

      {/* Matched Capabilities */}
      {matchedReasons.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-[hsl(var(--text-muted))] mb-1 uppercase tracking-wider">Matched Capability</div>
          <div className="flex flex-wrap gap-1">
            {matchedReasons.map((reason) => (
              <span
                key={reason}
                className="text-xs bg-green-500/20 text-green-300 border border-green-500/30 px-2 py-0.5 rounded font-medium flex items-center gap-1"
              >
                <CheckCircle className="w-3 h-3" />
                {reason}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Exclusion Warning */}
      {hospital.Exclusion && hospital.Exclusion !== "NaN" && (
        <div className="flex items-start gap-1.5 bg-amber-500/10 border border-amber-500/30 rounded p-2 mb-3">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
          <span className="text-xs text-amber-300">{hospital.Exclusion}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {onViewMap && (
          <button
            onClick={onViewMap}
            className="flex-1 text-xs py-2 px-3 rounded border border-[hsl(var(--border-strong))] text-[hsl(var(--text-muted))] hover:text-white hover:border-white/40 transition-colors"
          >
            View on Map
          </button>
        )}
        {hospital.Emergency_Contact_Number && (
          <a
            href={`tel:${hospital.Emergency_Contact_Number}`}
            className="flex-1 text-xs py-2 px-3 rounded border border-[hsl(var(--border-strong))] text-[hsl(var(--text-muted))] hover:text-white hover:border-white/40 transition-colors text-center"
          >
            📞 Call
          </a>
        )}
      </div>
    </div>
  );
};

const StatusPill = ({ label, value }: { label: string; value: string }) => {
  const isOpen = value === "Open";
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded font-medium border ${
        isOpen
          ? "bg-green-500/20 text-green-300 border-green-500/30"
          : "bg-red-500/20 text-red-300 border-red-500/30"
      }`}
    >
      {label}: {value}
    </span>
  );
};

const BedStat = ({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) => (
  <div className="bg-white/5 rounded p-2 text-center">
    <div className="flex justify-center text-[hsl(var(--text-muted))] mb-1">{icon}</div>
    <div className="text-white font-bold text-sm leading-none">{value || "—"}</div>
    <div className="text-[hsl(var(--text-muted))] text-[10px] mt-0.5">{label}</div>
  </div>
);

export default HospitalCard;
