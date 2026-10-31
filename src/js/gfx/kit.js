// Building blocks: pen-hatched materials, boxes, capsule limbs, heads, text drawn on a plane.
import * as THREE from "three";
import { U } from "../core/uniforms.js";
import { HATCH_V, HATCH_F, SKY_V, SKY_F } from "./shaders.js";
import { paintTex } from "./painting.js";

// rim: glowing outline · base: flat fill under the lines · sp: line spacing (m) · gain: how much light becomes line
export function hatch({ rim = 0, base = 0.06, seed = 0, sp = 0.032, gain = 1 } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { ...U, uRim: { value: rim }, uBase: { value: base }, uSeed: { value: seed }, uSp: { value: sp }, uGain: { value: gain } },
    vertexShader: HATCH_V, fragmentShader: HATCH_F,
  });
}

// crop: [x, y, w, h] of the painting to show, in 0..1
export function skyMat(crop, bright = 1) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uPaint: { value: paintTex }, uTime: { value: 0 }, uReveal: { value: 0 }, uSat: { value: 0 }, uMotion: { value: 1 },
      uCrop: { value: new THREE.Vector4(...crop) }, uBright: { value: bright },
    },
    vertexShader: SKY_V, fragmentShader: SKY_F,
  });
}

export const inkLine = new THREE.LineBasicMaterial({ color: 0x7a776f, transparent: true, opacity: 0.5 });

export function box(w, h, d, x, y, z, mat, parent, edges = true) {
  const g = new THREE.BoxGeometry(w, h, d);
  const m = new THREE.Mesh(g, mat);
  m.position.set(x, y, z);
  if (edges) m.add(new THREE.LineSegments(new THREE.EdgesGeometry(g), inkLine));
  parent.add(m);
  return m;
}

const UPV = new THREE.Vector3(0, 1, 0);
export function limb(g, a, b, r, mat) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const d = B.clone().sub(A);
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(d.length(), 0.001), 4, 12), mat);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(UPV, d.normalize());
  g.add(m);
  return m;
}

export function headOn(g, at, mat, tilt = 0) {
  const head = new THREE.Group();
  head.position.set(...at);
  head.rotation.x = tilt;
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.105, 22, 16), mat);
  skull.position.set(0, 0.11, -0.01);
  skull.scale.set(0.92, 1.05, 1.0);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.113, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), mat);
  hair.position.set(0, 0.125, 0.005);
  head.add(skull, hair);
  g.add(head);
  return head;
}

export function radialTex(inner, outer) {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const x = c.getContext("2d");
  const g = x.createRadialGradient(64, 64, 4, 64, 64, 64);
  g.addColorStop(0, inner); g.addColorStop(1, outer);
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

// Words that sit on a surface in the room: a canvas drawn in 2D, used as a texture (Every Joule draws its pages this way).
export function textPlane(w, h, cw, ch) {
  const c = document.createElement("canvas"); c.width = cw; c.height = ch;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  return { c, x: c.getContext("2d"), tex, mat, mesh };
}

// Break Korean text into lines that fit maxW (by words, and by letters when one word is too long).
export function wrap(ctx, text, maxW) {
  const out = []; let line = "";
  for (const word of text.split(" ")) {
    const tryLine = line ? line + " " + word : word;
    if (ctx.measureText(tryLine).width <= maxW) { line = tryLine; continue; }
    if (line) out.push(line);
    line = "";
    let chunk = "";
    for (const ch of word) {
      if (ctx.measureText(chunk + ch).width > maxW) { out.push(chunk); chunk = ""; }
      chunk += ch;
    }
    line = chunk;
  }
  if (line || !out.length) out.push(line);
  return out;
}
