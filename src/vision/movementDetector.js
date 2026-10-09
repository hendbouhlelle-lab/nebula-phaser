import { angle, clamp } from './angleCalculator.js';
// MediaPipe indices: 11/12 shoulders, 23/24 hips, 25/26 knees, 27/28 ankles (L/R of the user)
export const NEUTRAL = { shift: 0, legRaise: false, raiseSide: null, hold: true, flexL: 0, flexR: 0 };
const flexPct = (a) => clamp(((180 - a) / 90) * 100, 0, 100); // 90° of flexion = 100% amplitude

export class MovementDetector {
  constructor() { this.base = null; this.shift = 0; this.lastCx = 0.5; }
  center = (lm) => (lm[23].x + lm[24].x + lm[11].x + lm[12].x) / 4;
  legsVisible(lm) {
    return [23, 24, 25, 26, 27, 28].every((i) => (lm[i].visibility ?? 1) > 0.5 && lm[i].y > 0 && lm[i].y < 1);
  }
  // Called when the child presses START: the current stance becomes the "neutral" position.
  calibrate() { this.base = this.lastCx; this.shift = 0; }

  process(lm) {
    const cx = this.center(lm); this.lastCx = cx;
    if (this.base == null) return NEUTRAL;
    // Webcam image is not mirrored: the child's right = smaller x. Hence (base - cx).
    const target = clamp((this.base - cx) / 0.1, -1, 1);
    this.shift += (target - this.shift) * 0.5; // smoothing against jitter
    // Leg raise: one ankle clearly higher than the other (relative to leg length => works at any distance)
    const legLen = (Math.abs(lm[23].y - lm[27].y) + Math.abs(lm[24].y - lm[28].y)) / 2;
    const dL = lm[28].y - lm[27].y; // >0 => left ankle higher (y axis goes down)
    const th = 0.14 * legLen;
    const raiseSide = dL > th ? 'L' : -dL > th ? 'R' : null;
    return {
      shift: this.shift, legRaise: !!raiseSide, raiseSide,
      hold: Math.abs(this.shift) < 0.35 && !raiseSide, // steady, centred, both feet down
      flexL: flexPct(angle(lm[23], lm[25], lm[27])), flexR: flexPct(angle(lm[24], lm[26], lm[28])),
    };
  }
}
