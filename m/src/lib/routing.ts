import { Hospital, RoutingRule, RoutingResult } from "@/types";
import { loadHospitals } from "@/data/hospitals";
import { routingRules } from "@/data/routingRules";

const ORS_API_KEY =
  "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjA5NDc5Yjg5YmE2NzRmYTRiYWRiMzg5YTMxZGMxODVmIiwiaCI6Im11cm11cjY0In0=";

// ─── Haversine ────────────────────────────────────────────────────────────────

export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Routing rule helpers ─────────────────────────────────────────────────────

export function getRoutingRule(caseType: string): RoutingRule | undefined {
  return routingRules.find((r) => r.Dispatch_Case_Type === caseType);
}

export function getAllCaseTypes(): string[] {
  return routingRules.map((r) => r.Dispatch_Case_Type);
}

function getCapabilityLabel(field: string): string {
  const labels: Record<string, string> = {
    Status: "Open Status",
    Diversion_Status: "Diversion Open",
    Cath_Lab_PCI: "Cath Lab / PCI",
    CT_Scan: "CT Scan",
    Thrombolysis_Capable: "Thrombolysis",
    Fibrinolytic_Capable: "Fibrinolytic",
    Pediatric_Emergency: "Pediatric Emergency",
    Obstetrics_Gynecology: "Obstetrics & Gynecology",
    Trauma_Specialty: "Trauma Specialty",
    Burns_Capability: "Burns Capability",
    Helipad: "Helipad",
    Emergency_Operating_Theatre: "Emergency OR",
  };
  return labels[field] || field;
}

// ─── ORS single-route fetch ───────────────────────────────────────────────────

interface ORSRouteResult {
  distanceKm: number;
  durationMin: number;
  geometry: [number, number][]; // [lat, lon] pairs
}

async function getORSRoute(
  incidentLat: number,
  incidentLon: number,
  hospitalLat: number,
  hospitalLon: number
): Promise<ORSRouteResult> {
  const response = await fetch(
    "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
    {
      method: "POST",
      headers: {
        Authorization: ORS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        coordinates: [
          [incidentLon, incidentLat],
          [hospitalLon, hospitalLat],
        ],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`ORS request failed: ${response.status}`);
  }

  const data = await response.json();
  const feature = data?.features?.[0];
  const summary = feature?.properties?.summary;
  const coords: [number, number][] = (feature?.geometry?.coordinates ?? []).map(
    ([lon, lat]: [number, number]) => [lat, lon] as [number, number]
  );

  if (!summary) {
    throw new Error("ORS returned no route summary");
  }

  return {
    distanceKm: summary.distance / 1000,
    durationMin: Math.round(summary.duration / 60),
    geometry: coords,
  };
}

// ─── Main routing engine ──────────────────────────────────────────────────────

/**
 * Optimised two-phase routing:
 *   Phase 1 – Haversine pre-filter: compute straight-line distance for all
 *             eligible hospitals, sort, keep nearest N candidates.
 *   Phase 2 – ORS road routing: call ORS only for those N candidates in
 *             parallel, fall back to haversine if ORS fails.
 *   Final   – Sort candidates by road travel time (or haversine proxy),
 *             assign ranks, return top 3.
 */
const ORS_CANDIDATE_COUNT = 6; // fetch road routes for the N nearest by haversine

export async function findEligibleHospitals(
  incidentLat: number,
  incidentLon: number,
  caseType: string
): Promise<{ results: RoutingResult[]; rule: RoutingRule | undefined; isManual: boolean }> {
  const rule = getRoutingRule(caseType);

  if (!rule || !rule.Route_Mode) {
    return { results: [], rule, isManual: false };
  }

  const isManual = rule.Route_Mode === "Manual";

  // Build requirement filters from rule
  const requirements: Array<{ field: string; value: string }> = [];
  if (rule.Required_Field_1 && rule.Required_Value_1) {
    requirements.push({ field: rule.Required_Field_1, value: rule.Required_Value_1 });
  }
  if (rule.Required_Field_2 && rule.Required_Value_2) {
    requirements.push({ field: rule.Required_Field_2, value: rule.Required_Value_2 });
  }
  if (rule.Required_Field_3 && rule.Required_Value_3) {
    requirements.push({ field: rule.Required_Field_3, value: rule.Required_Value_3 });
  }

  // Load and filter hospitals by capability requirements
  const hospitals = await loadHospitals();

  const eligible = hospitals.filter((hospital) =>
    requirements.every(({ field, value }) => {
      const hospitalValue = hospital[field as keyof Hospital];
      if (hospitalValue === undefined || hospitalValue === null) return false;
      return String(hospitalValue).trim() === value.trim();
    })
  );

  // Capability reason labels (exclude generic status fields)
  const matchedReasonFields = requirements
    .filter(({ field }) => field !== "Status" && field !== "Diversion_Status")
    .map(({ field }) => getCapabilityLabel(field));

  // ── Phase 1: Haversine sort, keep nearest N candidates ──────────────────

  const withHaversine = eligible
    .map((hospital) => ({
      hospital,
      haversineKm: haversineDistance(
        incidentLat,
        incidentLon,
        hospital.Latitude,
        hospital.Longitude
      ),
    }))
    .sort((a, b) => a.haversineKm - b.haversineKm)
    .slice(0, ORS_CANDIDATE_COUNT);

  console.log(
    `[Routing] ${eligible.length} eligible hospitals → ${withHaversine.length} ORS candidates selected by haversine`
  );

  // ── Phase 2: ORS road routing (parallel, max N calls) ───────────────────

  const rawResults = await Promise.all(
    withHaversine.map(async ({ hospital, haversineKm }): Promise<RoutingResult> => {
      try {
        const ors = await getORSRoute(
          incidentLat,
          incidentLon,
          hospital.Latitude,
          hospital.Longitude
        );
        console.log(`[ORS ✓] ${hospital.Hospital_Name}: ${ors.durationMin} min / ${ors.distanceKm.toFixed(1)} km`);
        return {
          hospital,
          distance: ors.distanceKm,
          duration: ors.durationMin,
          matchedReasons: matchedReasonFields,
          rank: 0,
          routeGeometry: ors.geometry,
          isFallback: false,
        };
      } catch (err) {
        console.warn(`[ORS ✗] ${hospital.Hospital_Name} – using haversine fallback:`, err);
        return {
          hospital,
          distance: haversineKm,
          duration: 0,
          matchedReasons: matchedReasonFields,
          rank: 0,
          routeGeometry: undefined,
          isFallback: true,
        };
      }
    })
  );

  // ── Final: sort by road time; fallbacks sort by straight-line distance ───
  // Use haversine * 10 as a time proxy for fallbacks so they don't unfairly
  // rank above hospitals with a confirmed road time.
  rawResults.sort((a, b) => {
    const aKey = a.duration > 0 ? a.duration : a.distance * 10;
    const bKey = b.duration > 0 ? b.duration : b.distance * 10;
    return aKey - bKey;
  });

  // Assign ranks and return top 3
  const top3 = rawResults.slice(0, 3);
  top3.forEach((r, i) => {
    r.rank = i + 1;
  });

  return { results: top3, rule, isManual };
}
