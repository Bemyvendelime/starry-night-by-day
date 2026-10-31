// Tweens and the camera rig. Cameras are named in content/cameras.js.
import * as THREE from "three";
import { CAMERAS, SCREEN_FIT } from "../content/cameras.js";
import { camera } from "./renderer.js";

export const clock = { now: 0 };
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const V = (a) => new THREE.Vector3(...a);

const tweens = new Set();
export function tween(obj, key, to, dur, delay = 0) {
  for (const t of tweens) if (t.obj === obj && t.key === key) tweens.delete(t);
  if (dur <= 0 && delay <= 0) { obj[key] = to; return; }
  tweens.add({ obj, key, from: null, to, t0: clock.now + delay, dur: Math.max(dur, 0.001) });
}
export function stepTweens() {
  for (const t of tweens) {
    if (clock.now < t.t0) continue;
    if (t.from === null) t.from = t.obj[t.key]; // start from wherever it is when the delay ends
    const p = clamp((clock.now - t.t0) / t.dur);
    t.obj[t.key] = t.from + (t.to - t.from) * ease(p);
    if (p >= 1) tweens.delete(t);
  }
}

export function camFor(key) {
  const c = CAMERAS[key];
  const a = camera.aspect;
  if (c.fit === "screen") {
    const th = Math.tan(THREE.MathUtils.degToRad(c.fov / 2));
    const dist = Math.max(SCREEN_FIT.h / (2 * th), SCREEN_FIT.w / (2 * th * a)) * SCREEN_FIT.margin;
    const ctr = V(SCREEN_FIT.center);
    return { p: ctr.clone().add(new THREE.Vector3(0, 0, dist)), t: ctr, fov: c.fov };
  }
  // tall phone screens see less sideways, so most shots open up a little
  const fov = c.widen === false || a >= 1 ? c.fov : Math.min(78, c.fov * (1 + (1 - a) * 0.75));
  return { p: V(c.p), t: V(c.t), fov };
}

export const rig = { p: new THREE.Vector3(), t: new THREE.Vector3(), fov: 50, tw: null, key: "wide" };
export function setCam(key, dur, arc) {
  const c = camFor(key);
  rig.key = key;
  if (dur <= 0) { rig.p.copy(c.p); rig.t.copy(c.t); rig.fov = c.fov; rig.tw = null; return; }
  rig.tw = { p0: rig.p.clone(), t0: rig.t.clone(), f0: rig.fov, c, s: clock.now, d: dur, arc: arc ? V(arc) : new THREE.Vector3(0.12, 0.08, 0) };
}
export function refitCam() {
  const c = camFor(rig.key);
  if (rig.tw) rig.tw.c = c;
  else { rig.p.copy(c.p); rig.t.copy(c.t); rig.fov = c.fov; }
}
export function stepCam() {
  const tw = rig.tw;
  if (!tw) return;
  const p = clamp((clock.now - tw.s) / tw.d), e = ease(p);
  rig.p.lerpVectors(tw.p0, tw.c.p, e).addScaledVector(tw.arc, Math.sin(Math.PI * e));
  rig.t.lerpVectors(tw.t0, tw.c.t, e);
  rig.fov = tw.f0 + (tw.c.fov - tw.f0) * e;
  if (p >= 1) rig.tw = null;
}
