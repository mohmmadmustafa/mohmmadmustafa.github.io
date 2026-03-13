import { Hospital } from "@/types";

// Configure this to your Google Sheets published CSV export URL.
// Format: https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv&gid={GID}
const HOSPITALS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRYN_LEVjutjWel-uG6BvAC4KOsqD90a4e9uY8yHAXXG3-lmUDsQaXOQiBmBbDAfp4cn4Z_HM-VtzlR/pub?output=csv";

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function normaliseValue(v: string): string | undefined {
  const s = v.trim();
  if (!s || s.toLowerCase() === "nan" || s === "N/A") return undefined;
  return s;
}

function parseHospitalsCSV(csv: string): Hospital[] {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map((h) => h.trim());

  return lines.slice(1).flatMap((line): Hospital[] => {
    const cols = parseCSVLine(line);
    const get = (col: string): string =>
      normaliseValue(cols[headers.indexOf(col)] ?? "") ?? "";
    const getOpt = (col: string): string | undefined =>
      normaliseValue(cols[headers.indexOf(col)] ?? "");

    const lat = parseFloat(get("Latitude"));
    const lon = parseFloat(get("Longitude"));
    if (isNaN(lat) || isNaN(lon)) return [];

    return [
      {
        Hospital_ID: get("Hospital_ID"),
        Emirate: get("Emirate"),
        Hospital_Name: get("Hospital_Name"),
        Google_Link: getOpt("Google_Link"),
        Latitude: lat,
        Longitude: lon,
        Sector: get("Sector"),
        Emergency_Contact_Number: getOpt("Emergency_Contact_Number"),
        Operating_Hours: get("Operating_Hours") || "24/7",
        Helipad: get("Helipad") || "No",
        Emergency_Operating_Theatre: get("Emergency_Operating_Theatre") || "No",
        Cath_Lab_PCI: get("Cath_Lab_PCI") || "No",
        Thrombolysis_Capable: get("Thrombolysis_Capable") || "No",
        CT_Scan: get("CT_Scan") || "No",
        Fibrinolytic_Capable: get("Fibrinolytic_Capable") || "No",
        Pediatric_Emergency: get("Pediatric_Emergency") || "No",
        Obstetrics_Gynecology: get("Obstetrics_Gynecology") || "No",
        Trauma_Specialty: get("Trauma_Specialty") || "No",
        Burns_Capability: get("Burns_Capability") || "No",
        Resus_Room_Count: get("Resus_Room_Count") || "0",
        ER_Bed_Count: get("ER_Bed_Count") || "0",
        ICU_Bed_Count: get("ICU_Bed_Count") || "0",
        Exclusion: getOpt("Exclusion"),
        Specialties_Available: getOpt("Specialties_Available"),
        Status: get("Status") || "Open",
        Diversion_Status: get("Diversion_Status") || "Open",
        Review_Notes: getOpt("Review_Notes"),
        Original_Row: getOpt("Original_Row"),
      },
    ];
  });
}

export async function loadHospitals(): Promise<Hospital[]> {
  const response = await fetch(HOSPITALS_CSV_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch hospitals CSV: ${response.status} ${response.statusText}`);
  }
  const csv = await response.text();
  return parseHospitalsCSV(csv);
}
