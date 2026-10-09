const KEY = 'nebula-run-sessions';
// Simulated sessions so the dashboard is never empty during the demo
const SEED = [
  { id: 's1', date: '2026-09-22', knee: 58, accuracy: 55, symmetry: 49, reaction: 2.1, success: 13, total: 24, duration: 252 },
  { id: 's2', date: '2026-09-29', knee: 64, accuracy: 62, symmetry: 55, reaction: 1.9, success: 15, total: 24, duration: 261 },
  { id: 's3', date: '2026-10-03', knee: 72, accuracy: 68, symmetry: 59, reaction: 1.6, success: 16, total: 24, duration: 270 },
];
export function loadSessions() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s?.length) return s; } catch {}
  localStorage.setItem(KEY, JSON.stringify(SEED)); return SEED;
}
export const saveSession = (r) => { const all = [...loadSessions(), r]; localStorage.setItem(KEY, JSON.stringify(all)); return all; };
export const resetSessions = () => { localStorage.removeItem(KEY); return loadSessions(); };

const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
// Turns raw game stats into movement indicators (NOT a diagnosis)
export function buildReport(st, duration) {
  const L = avg(st.flexL), R = avg(st.flexR);
  return {
    id: 's' + Date.now(), date: new Date().toISOString().slice(0, 10),
    knee: Math.round(avg([...st.flexL, ...st.flexR])),
    accuracy: st.attempts ? Math.round((st.success / st.attempts) * 100) : 0,
    symmetry: st.flexL.length && st.flexR.length ? Math.round((Math.min(L, R) / Math.max(L, R)) * 100) : null, // null = only one side used
    reaction: +avg(st.react).toFixed(1), success: st.success, total: st.attempts, duration: Math.round(duration),
  };
}
export const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
