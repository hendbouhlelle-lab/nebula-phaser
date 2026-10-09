import './styles.css';
import Phaser from 'phaser';
import NebulaScene from './game/NebulaScene.js';
import { startCamera } from './vision/camera.js';
import { MovementDetector, NEUTRAL } from './vision/movementDetector.js';
import { buildReport, loadSessions, saveSession, resetSessions } from './data/sessionStore.js';
import { reportHTML, therapistHTML } from './ui.js';

const $ = (id) => document.getElementById(id);
const screen = $('screen'), camEl = $('cam'), root = $('game-root');
const detector = new MovementDetector();
let input = NEUTRAL;            // single input bus: camera OR keyboard writes here
let mode = 'camera', sessions = loadSessions(), stopCam = null, detachKeys = null, game = null;

const show = (html, { cam = false } = {}) => {
  screen.innerHTML = html; screen.classList.remove('hidden'); root.classList.add('hidden');
  camEl.className = 'cam' + (cam ? '' : ' hidden');
};
const killCam = () => { stopCam?.(); stopCam = null; };
const btn = (act, label, cls = '', extra = '') => `<button class="btn ${cls}" data-act="${act}" ${extra}>${label}</button>`;

// ---------- screens ----------
function home() {
  killCam(); detachKeys?.(); detachKeys = null; game?.destroy(true); game = null;
  show(`<h1>NEBULA RUN</h1><p>Travel between planets using your legs!</p>${btn('camera', '📷 Play with camera')}${btn('demo', '🎮 Demo Mode', 'alt')}${btn('therapist', '👨‍⚕️ Therapist view', 'ghost')}`);
}
const msgFor = (c) => c.error ? '⚠️ ' + c.error : c.loading ? 'Loading AI model...' : !c.body ? 'Stand in front of the camera' : !c.legs ? 'Step back: both legs must be visible' : 'Ready?';

function setup(m) {
  mode = m; input = NEUTRAL; killCam(); detachKeys?.(); detachKeys = null;
  const isCam = m === 'camera';
  show(`<h2 id="msg">${isCam ? 'Starting camera...' : 'Ready?'}</h2>
    ${isCam ? '' : '<p>🎮 Demo Mode — <b>←/→</b> shift weight · <b>↑</b> leg raise · <b>Space</b> hold position</p>'}
    <p class="note">Move slowly and gently. Stop at any sign of discomfort.</p>
    ${btn('start', '🚀 START MISSION', '', `id="startBtn" ${isCam ? 'disabled' : ''}`)}${btn('home', '← Back', 'ghost')}`, { cam: isCam });
  if (isCam) {
    stopCam = startCamera({ video: camEl.querySelector('video'), canvas: camEl.querySelector('canvas'), detector, setInput: (i) => (input = i),
      onStatus: (c) => { const e = $('msg'); if (e) e.textContent = msgFor(c); const b = $('startBtn'); if (b) b.disabled = !c.legs; } });
  } else detachKeys = attachDemoKeys();
}

// DEMO MODE: keyboard simulates movements
function attachDemoKeys() {
  const keys = {}; let side = 'L';
  const push = () => { input = { shift: (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0), legRaise: !!keys.ArrowUp, raiseSide: keys.ArrowUp ? side : null, hold: !!keys.Space, flexL: 60 + Math.random() * 25, flexR: 50 + Math.random() * 25 }; };
  const h = (down) => (e) => {
    const k = e.code === 'Space' ? 'Space' : e.key; if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space'].includes(k)) return;
    e.preventDefault(); if (down && k === 'ArrowUp' && !keys.ArrowUp) side = side === 'L' ? 'R' : 'L'; keys[k] = down; push();
  };
  const d = h(true), u = h(false); addEventListener('keydown', d); addEventListener('keyup', u);
  return () => { removeEventListener('keydown', d); removeEventListener('keyup', u); };
}

function play() {
  detector.calibrate(); // current stance = neutral position
  screen.classList.add('hidden'); root.classList.remove('hidden');
  if (mode === 'camera') camEl.className = 'cam cam-small';
  game = new Phaser.Game({
    type: Phaser.AUTO, parent: 'game-root', width: 960, height: 540, scene: [NebulaScene],
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }, transparent: true,
    callbacks: { preBoot: (g) => { g.registry.set('getInput', () => input); g.registry.set('onFinish', finish); } },
  });
}
function finish(stats, dur) {
  const r = buildReport(stats, dur); sessions = saveSession(r);
  killCam(); detachKeys?.(); detachKeys = null; setTimeout(() => { game?.destroy(true); game = null; }, 0);
  show(reportHTML(r) + btn('again', '↻ Play again') + btn('therapist', '👨‍⚕️ Therapist view', 'alt'));
}
const therapist = () => { killCam(); show(therapistHTML(sessions) + btn('home', '← Home', 'ghost')); };

const actions = { camera: () => setup('camera'), demo: () => setup('demo'), start: play, home, therapist, again: () => setup(mode),
  reset: () => { sessions = resetSessions(); therapist(); } };
screen.addEventListener('click', (e) => actions[e.target.dataset.act]?.());
home();
