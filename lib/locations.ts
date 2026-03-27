export const SUPPORTED_ZONES = [
  "GSL",
  "Rawlings Park",
  "Ako Adjei Park",
  "Cantonements",
  "Heavy Industrial Area",
  "Mile 7",
  "Timber Market",
] as const;

export const ADMIN_LOCATION_FILTERS = ["All Locations", ...SUPPORTED_ZONES] as const;
