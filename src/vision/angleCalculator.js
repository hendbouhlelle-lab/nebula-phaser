// Angle (degrees) at point b formed by a-b-c (2D). 180 = straight leg.
export function angle(a, b, c) {
  const r = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let d = Math.abs((r * 180) / Math.PI);
  return d > 180 ? 360 - d : d;
}
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
