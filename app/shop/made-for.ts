export const isMadeFor = (p: any): boolean => {
  if (!p) return false;
  const v = p.isMadeForProduct;
  return v === true || v === "true" || v === 1;
};