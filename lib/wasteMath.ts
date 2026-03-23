export const KG_PER_BUCKET = {
  plastic: 0.5,
  organic: 0.4,
} as const;

export type WasteType = keyof typeof KG_PER_BUCKET;

export function computeQuantityKg(buckets: number, wasteType: WasteType) {
  const coeff = KG_PER_BUCKET[wasteType];
  return Number((buckets * coeff).toFixed(3));
}

