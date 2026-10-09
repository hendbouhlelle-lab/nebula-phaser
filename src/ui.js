import { fmtTime } from './data/sessionStore.js';
export const DISCLAIMER = 'These measurements are movement indicators and are not a medical diagnosis.';
const bar = (label, v) => `<div class="bar"><div class="bar-top"><span>${label}</span><b>${v == null ? '—' : v + '%'}</b></div><div class="track"><div class="fill" style="width:${v ?? 0}%"></div></div></div>`;

export const reportHTML = (r) => `<h2>MOVEMENT REPORT</h2><div class="grid">${[
  ['Avg. knee range of motion', r.knee + '%'], ['Accuracy', r.accuracy + '%'], ['Movement symmetry', r.symmetry == null ? '—' : r.symmetry + '%'],
  ['Avg. reaction time', r.reaction + ' s'], ['Successful movements', `${r.success} / ${r.total}`], ['Session duration', fmtTime(r.duration)],
].map(([k, v]) => `<div class="card"><small>${k}</small><strong>${v}</strong></div>`).join('')}</div><p class="note">${DISCLAIMER}</p>`;

export function therapistHTML(sessions) {
  const s = sessions[sessions.length - 1];
  return `<h2>👨‍⚕️ THERAPIST VIEW</h2>
  <div class="grid"><div class="card"><small>PATIENT / PLAYER</small><strong>Demo Player</strong></div><div class="card"><small>SESSION</small><strong>${s.date}</strong></div></div>
  ${bar('Knee movement', s.knee)}${bar('Left / Right symmetry', s.symmetry)}${bar('Accuracy', s.accuracy)}
  <p>Successful movements: <b>${s.success} / ${s.total}</b> · Reaction time: <b>${s.reaction} s</b></p>
  <h3>SESSION TREND (knee movement)</h3>
  <div class="trend">${sessions.map((x, i) => `<div class="tcol"><b>${x.knee}%</b><div class="tbar" style="height:${x.knee * 1.5}px"></div><small>Session ${i + 1}</small></div>`).join('')}</div>
  <p class="note">${DISCLAIMER}</p><button class="btn ghost" data-act="reset">Reset demo data</button>`;
}
