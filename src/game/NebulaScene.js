import Phaser from 'phaser';
import { LEVELS } from './levels.js';
import { near, inWindow } from './collisionDetection.js';

const W = 960, H = 540, GY = H * 0.78;
const PRAISE = ['PERFECT! ⭐', 'AMAZING! 🚀', 'GOOD MOVE!', 'GREAT! 🌟'];
const rnd = (a) => a[Math.floor(Math.random() * a.length)];
const font = (s, c = '#fff') => ({ fontFamily: 'system-ui, sans-serif', fontSize: s + 'px', fontStyle: 'bold', color: c });
const emo = (s) => ({ fontFamily: 'system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif', fontSize: s + 'px' });

// One Phaser scene = the whole game. Input comes from registry 'getInput' (camera OR keyboard demo).
export default class NebulaScene extends Phaser.Scene {
  constructor() { super('nebula'); }

  create() {
    this.getInput = this.registry.get('getInput'); this.onFinish = this.registry.get('onFinish');
    this.t0 = performance.now(); this.score = 0; this.px = 0.5; this.jt = 1; this.lastRaise = false; this.finished = false;
    // stats feed the Movement Report
    this.stats = { attempts: 0, success: 0, react: [], flexL: [], flexR: [], holds: [] };
    this.bgG = this.add.graphics();
    for (let i = 0; i < 70; i++) { // twinkling stars (tweens)
      const s = this.add.rectangle(Math.random() * W, Math.random() * H, 2, 2, 0xffffff, 0.8);
      this.tweens.add({ targets: s, alpha: 0.1, duration: 600 + Math.random() * 1800, yoyo: true, repeat: -1 });
    }
    this.planet = this.add.text(W * 0.86, H * 0.24, '', emo(110)).setOrigin(0.5);
    this.add.rectangle(W / 2, (GY + H) / 2, W, H - GY, 0xffffff, 0.08);
    this.add.rectangle(W / 2, GY, W, 2, 0x6ee7ff, 0.5);
    this.ring = this.add.graphics();
    this.star = this.add.text(0, 0, '⭐', emo(64)).setOrigin(0.5).setVisible(false);
    this.rock = this.add.text(0, 0, '🪨', emo(70)).setOrigin(0.5).setVisible(false);
    this.player = this.add.text(W / 2, GY, '👨‍🚀', emo(84)).setOrigin(0.5);
    this.big = this.add.text(W / 2, H * 0.3, 'STABILIZE!', font(56)).setOrigin(0.5).setVisible(false);
    this.cnt = this.add.text(W / 2, H * 0.5, '', font(90, '#ffe066')).setOrigin(0.5);
    this.hudS = this.add.text(20, 18, '', font(28)); this.hudL = this.add.text(W / 2, 18, '', font(28)).setOrigin(0.5, 0);
    this.hudC = this.add.text(W - 20, 18, '', font(28)).setOrigin(1, 0);
    this.msg = this.add.text(W / 2, H * 0.2, '', font(50, '#ffe066')).setOrigin(0.5).setAlpha(0);
    this.ov = this.add.rectangle(W / 2, H / 2, W, H, 0x050819, 0.78).setDepth(10);
    this.ov1 = this.add.text(W / 2, H * 0.42, '', font(60)).setOrigin(0.5).setDepth(11);
    this.ov2 = this.add.text(W / 2, H * 0.56, '', { ...font(28), fontStyle: 'normal' }).setOrigin(0.5).setDepth(11);
    this.startLevel(0);
  }

  startLevel(i) {
    this.li = i; this.lv = LEVELS[i]; this.phase = 'intro'; this.pt = 2.5; this.n = 0; this.task = null; this.wait = 0.5; this.side = 1;
    const c = (h) => parseInt(h.slice(1), 16);
    this.bgG.clear().fillGradientStyle(c(this.lv.bg[0]), c(this.lv.bg[0]), c(this.lv.bg[1]), c(this.lv.bg[1]), 1).fillRect(0, 0, W, H);
    this.planet.setText(this.lv.emoji);
    this.ov1.setText(`${this.lv.emoji} ${this.lv.name}`); this.ov2.setText(this.lv.goal);
  }

  say(text) { // instant feedback with a small pop animation
    this.msg.setText(text).setAlpha(1).setScale(0.6);
    this.tweens.add({ targets: this.msg, scale: 1, duration: 200, ease: 'Back.Out' });
    this.tweens.add({ targets: this.msg, alpha: 0, delay: 800, duration: 500 });
  }
  burst(x, y) { // particles = small circles with tweens
    for (let i = 0; i < 22; i++) {
      const c = this.add.circle(x, y, 5, rnd([0xffe066, 0xff7ad9, 0x6ee7ff])).setDepth(5);
      this.tweens.add({ targets: c, x: x + (Math.random() - 0.5) * 320, y: y - 60 + Math.random() * 160, alpha: 0, duration: 700 + Math.random() * 400, onComplete: () => c.destroy() });
    }
  }
  success(x, y, react, pts = 100) {
    this.stats.success++; this.score += pts; if (react != null) this.stats.react.push(react);
    this.say(react != null && react < 1.5 ? PRAISE[0] : rnd(PRAISE)); this.burst(x * W, y); this.n++; this.task = null; this.wait = 0.9;
  }
  fail() { this.say('Almost! Next one 💪'); this.n++; this.task = null; this.wait = 0.9; }

  update(time, delta) {
    if (this.finished) return;
    const dt = Math.min(0.05, delta / 1000), inp = this.getInput(), k = this.task, T = time / 1000;
    this.jt += dt * 1.6;
    this.px += (0.5 + inp.shift * 0.3 - this.px) * Math.min(1, dt * 8);
    this.player.setPosition(this.px * W, GY + 5 - Math.sin(Math.PI * Math.min(1, this.jt)) * 110);
    this.hudS.setText(`⭐ ${this.score}`); this.hudL.setText(`LEVEL ${this.li + 1} · ${this.lv.name}`); this.hudC.setText(`${Math.min(this.n, this.lv.total)} / ${this.lv.total}`);
    this.ov.setVisible(this.phase !== 'play'); this.ov1.setVisible(this.phase !== 'play'); this.ov2.setVisible(this.phase !== 'play');

    if (this.phase === 'intro') { if ((this.pt -= dt) <= 0) this.phase = 'play'; return; }
    if (this.phase === 'travel') {
      if ((this.pt -= dt) <= 0) {
        if (this.li === LEVELS.length - 1) { this.finished = true; this.onFinish(this.stats, (performance.now() - this.t0) / 1000); }
        else this.startLevel(this.li + 1);
      }
      return;
    }
    if (this.n >= this.lv.total) {
      this.phase = 'travel'; this.pt = 2.5; this.task = null; this.star.setVisible(false); this.rock.setVisible(false); this.ring.clear(); this.big.setVisible(false); this.cnt.setText('');
      const nx = LEVELS[this.li + 1]; this.ov1.setText('MISSION COMPLETE! 🎉'); this.ov2.setText(nx ? `Flying to ${nx.name} ${nx.emoji} ...` : 'Great job, astronaut!'); return;
    }
    if (!this.task) { // spawn the next task after a calm pause (safe pacing for kids)
      if ((this.wait -= dt) > 0) return;
      this.stats.attempts++;
      if (this.li === 0) { this.side *= -1; this.task = { x: this.side > 0 ? 0.82 : 0.18, age: 0, near: 0 }; }
      if (this.li === 1) this.task = { x: 1.1, age: 0, alert: null };
      if (this.li === 2) this.task = { prog: 0, age: 0 };
    }
    const q = this.task; q.age += dt;

    if (this.li === 0) { // LEVEL 1: weight shifting toward the star
      q.near = near(this.px, q.x, 0.09) ? q.near + dt : 0;
      this.star.setVisible(true).setPosition(q.x * W, GY - 30).setScale(1 + Math.sin(T * 6) * 0.1);
      this.ring.clear().lineStyle(6, 0xffe066).beginPath().arc(q.x * W, GY - 48, 46, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, q.near / 0.35)).strokePath();
      if (q.near > 0.35) { this.star.setVisible(false); this.ring.clear(); this.success(q.x, GY - 40, q.age - 0.35); }
      else if (q.age > 9) { this.star.setVisible(false); this.ring.clear(); this.fail(); }
    }
    if (this.li === 1) { // LEVEL 2: raise a leg to hop over the rock
      q.x -= 0.18 * dt; // slow: ~5 s to cross the screen
      this.rock.setVisible(true).setPosition(q.x * W, GY);
      const inZone = inWindow(q.x, this.px, -0.05, 0.3);
      if (inZone && q.alert == null) q.alert = q.age;
      if (inZone && inp.legRaise && !this.lastRaise) { // rising edge = one repetition
        (inp.raiseSide === 'L' ? this.stats.flexL : this.stats.flexR).push(inp.raiseSide === 'L' ? inp.flexL : inp.flexR);
        this.jt = 0; this.rock.setVisible(false); this.success(q.x, GY, q.age - q.alert);
      } else if (q.x - this.px < -0.08) { this.rock.setVisible(false); this.fail(); }
    }
    if (this.li === 2) { // LEVEL 3: hold a stable position for 3 s
      q.prog = inp.hold ? q.prog + dt : Math.max(0, q.prog - dt * 2);
      this.big.setVisible(true); this.cnt.setText(q.prog > 0.05 ? `${Math.ceil(3 - q.prog)}...` : '3');
      this.ring.clear().lineStyle(8, 0x6ee7ff).beginPath().arc(this.px * W, GY - 40, 70, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, q.prog / 3)).strokePath();
      if (q.prog >= 3) { this.stats.holds.push(q.prog); this.big.setVisible(false); this.cnt.setText(''); this.ring.clear(); this.success(this.px, GY - 90, null, 150); }
      else if (q.age > 15) { this.big.setVisible(false); this.cnt.setText(''); this.ring.clear(); this.fail(); }
    }
    this.lastRaise = inp.legRaise;
  }
}
