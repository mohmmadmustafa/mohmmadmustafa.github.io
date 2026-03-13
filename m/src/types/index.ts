export interface Hospital {
  Hospital_ID: string;
  Emirate: string;
  Hospital_Name: string;
  Google_Link?: string;
  Latitude: number;
  Longitude: number;
  Sector: string;
  Emergency_Contact_Number?: string;
  Operating_Hours: string;
  Helipad: string;
  Emergency_Operating_Theatre: string;
  Cath_Lab_PCI: string;
  Thrombolysis_Capable: string;
  CT_Scan: string;
  Fibrinolytic_Capable: string;
  Pediatric_Emergency: string;
  Obstetrics_Gynecology: string;
  Trauma_Specialty: string;
  Burns_Capability: string;
  Resus_Room_Count: string;
  ER_Bed_Count: string;
  ICU_Bed_Count: string;
  Exclusion?: string;
  Specialties_Available?: string;
  Status: string;
  Diversion_Status: string;
  Review_Notes?: string;
  Original_Row?: string | number;
}

export interface RoutingRule {
  Dispatch_Case_Type: string;
  Route_Mode: string;
  Required_Field_1?: string;
  Required_Value_1?: string;
  Required_Field_2?: string;
  Required_Value_2?: string;
  Required_Field_3?: string;
  Required_Value_3?: string;
  Preferred_Sort?: string;
  Rule_Notes?: string;
}

export interface RoutingResult {
  hospital: Hospital;
  distance: number;        // road distance in km (falls back to haversine)
  duration: number;        // travel time in minutes (0 if fallback)
  matchedReasons: string[];
  rank: number;
  routeGeometry?: [number, number][]; // [lat, lon] pairs for road path
  isFallback?: boolean;    // true if haversine was used instead of ORS
}
