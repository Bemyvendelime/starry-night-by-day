// Sound, all synthesised (no audio files): key clicks, room hum, a chord pad, one note per letter, paper, a drop.
// Unlocked on the first touch, since browsers only play sound after the viewer does something.
import { LOOK } from "../content/look.js";
import { store } from "../core/state.js";

const V = LOOK.sound;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const CHORDS = [[146.83, 220, 277.18, 329.63], [123.47, 185, 246.94, 293.66], [98, 146.83, 196, 246.94], [110, 164.81, 220, 277.18]];
const SCALE = [293.66, 329.63, 369.99, 440, 493.88, 587.33, 659.25, 739.99]; // D major pentatonic-ish

export const sound = {
  ctx: null, on: store.get("byeolbam:sound") !== "0", music: false, chordIdx: 0, pad: [], pi: 3,
  unlock() {
    if (this.ctx) { if (this.ctx.state === "suspended") this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const c = (this.ctx = new AC());
    this.master = c.createGain(); this.master.gain.value = this.on ? V.master : 0; this.master.connect(c.destination);
    const n = c.createBuffer(1, c.sampleRate, c.sampleRate); const d = n.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.noise = n;
    const b = c.createBuffer(1, c.sampleRate * 2, c.sampleRate); const bd = b.getChannelData(0); let last = 0;
    for (let i = 0; i < bd.length; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; bd[i] = last * 3.5; }
    const hum = c.createBufferSource(); hum.buffer = b; hum.loop = true;
    const hf = c.createBiquadFilter(); hf.type = "lowpass"; hf.frequency.value = 180;
    const hg = c.createGain(); hg.gain.value = V.hum;
    hum.connect(hf).connect(hg).connect(this.master); hum.start();
    this.lp = c.createBiquadFilter(); this.lp.type = "lowpass"; this.lp.frequency.value = 1500; this.lp.connect(this.master);
    this.bus = c.createGain(); this.bus.gain.value = this.music ? 1 : 0; this.bus.connect(this.lp);
    this.dl = c.createDelay(1); this.dl.delayTime.value = 0.33;
    const fb = c.createGain(); fb.gain.value = 0.3; this.dl.connect(fb).connect(this.dl);
    const wet = c.createGain(); wet.gain.value = 0.35; this.dl.connect(wet).connect(this.lp);
    this.setChord(this.chordIdx, true);
  },
  setOn(v) {
    this.on = v; store.set("byeolbam:sound", v ? "1" : "0");
    if (this.master) this.master.gain.setTargetAtTime(v ? V.master : 0, this.ctx.currentTime, 0.05);
  },
  burst(freq, q, peak, len, rate = 1) {
    const c = this.ctx, t = c.currentTime;
    const s = c.createBufferSource(); s.buffer = this.noise; s.playbackRate.value = rate;
    const f = c.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    s.connect(f).connect(g).connect(this.master); s.start(t, Math.random() * 0.5, len + 0.05);
  },
  key(ch, music) {
    if (!this.ctx) return;
    if (music) return this.pluck(ch);
    this.burst(ch === " " ? 900 : 2100 + Math.random() * 1400, 1.4, ch === " " ? V.keys * 1.4 : V.keys, 0.05, 0.8 + Math.random() * 0.5);
  },
  back() { if (this.ctx) this.burst(900, 1.4, V.keys * 1.4, 0.05); },
  paper() { if (this.ctx) { this.burst(1600, 0.6, V.paper, 0.22, 0.6); setTimeout(() => this.burst(2400, 0.8, V.paper * 0.6, 0.12, 0.7), 120); } },
  pluck(ch) {
    if (ch === " ") return;
    const c = this.ctx, t = c.currentTime;
    this.pi = clamp(this.pi + Math.round(Math.random() * 4 - 2), 0, SCALE.length - 1);
    const o = c.createOscillator(); o.type = "sine"; o.frequency.value = SCALE[this.pi];
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(V.pluck, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    o.connect(g); g.connect(this.lp); g.connect(this.dl); o.start(t); o.stop(t + 1);
  },
  setMusic(on) {
    this.music = on;
    if (this.ctx) this.bus.gain.setTargetAtTime(on ? 1 : 0, this.ctx.currentTime, 1.2);
  },
  setChord(i, force) {
    if (i === this.chordIdx && !force && this.pad.length) return;
    this.chordIdx = i;
    if (!this.ctx) return;
    const c = this.ctx, t = c.currentTime;
    for (const p of this.pad) { p.g.gain.setTargetAtTime(0.0001, t, 0.8); p.o.stop(t + 4); }
    this.pad = CHORDS[i % CHORDS.length].map((f, k) => {
      const o = c.createOscillator(); o.type = "triangle"; o.frequency.value = f; o.detune.value = k % 2 ? 5 : -5;
      const g = c.createGain(); g.gain.value = 0.0001; g.gain.setTargetAtTime(V.pad, t, 1.4);
      o.connect(g).connect(this.bus); o.start(t);
      return { o, g };
    });
  },
  drop() {
    if (!this.ctx) return;
    const c = this.ctx, t = c.currentTime;
    const o = c.createOscillator(); o.type = "sine";
    o.frequency.setValueAtTime(1400, t); o.frequency.exponentialRampToValueAtTime(360, t + 0.2);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.14, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    o.connect(g); g.connect(this.master); g.connect(this.dl); o.start(t); o.stop(t + 0.4);
  },
};
