// 별이 빛나는 밤 속 호숫가: 그림 하늘, 사이프러스, 공중을 도는 붓질, 큰 별, 호수,
// 그리고 편지를 다 읽고 접는 어른의 뒷모습.
import * as THREE from "three";
import { scene } from "../core/renderer.js";
import { U } from "../core/uniforms.js";
import { hatch, skyMat, box } from "../gfx/kit.js";
import { axes, poseReader } from "./people.js";
import { paintTex, IMG_ASPECT } from "../gfx/painting.js";
import { HATCH_V, WATER_F, STROKE_V, STROKE_F, STAR_V, STAR_F } from "../gfx/shaders.js";
import { LOOK } from "../content/look.js";
import { LINES } from "../content/letter.js";
import { finalOf } from "../core/typer.js";

const L = LOOK.lake;
export const lake = new THREE.Group();
lake.position.set(L.x, 0, 0);
scene.add(lake);

const bankMat = hatch({ base: 0.05, seed: 6, sp: 0.05 });
export const adultMat = hatch({ rim: 1.6, base: 0.0, seed: 7, sp: 0.018, gain: 0.3 });

// the bank, a few stones at the water's edge
box(L.backdropWidth, 0.3, 4.4, 0, 0, 2.25, bankMat, lake, false);
for (let i = 0; i < 9; i++) {
  const s = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12 + (i % 3) * 0.06, 0), bankMat);
  s.position.set(-3 + i * 0.75 + (i % 2) * 0.2, 0.12, 0.08 + (i % 3) * 0.05);
  s.rotation.set(i, i * 0.7, 0);
  lake.add(s);
}

// the painting behind the world; its hills sink below the water line so the swirls sit behind the person
const BW = L.backdropWidth, BH = BW / IMG_ASPECT;
const BACK = { y: BH / 2 - L.horizon * BH, z: -16.1 };
export const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(BW, BH), skyMat([0, 0, 1, 1], 0.95));
backdrop.material.uniforms.uReveal.value = 1;
backdrop.material.uniforms.uSat.value = 1;
backdrop.position.set(0, BACK.y, BACK.z);
lake.add(backdrop);

// the lake mirrors that painting
const waterMat = new THREE.ShaderMaterial({
  uniforms: { uPaint: { value: paintTex }, uTime: { value: 0 }, uCam: U.uCam,
    uPC: { value: new THREE.Vector3(L.x, BACK.y, BACK.z) }, uPS: { value: new THREE.Vector2(BW, BH) } },
  vertexShader: HATCH_V, fragmentShader: WATER_F,
});
const water = new THREE.Mesh(new THREE.PlaneGeometry(BW, 16.2), waterMat);
water.rotation.x = -Math.PI / 2;
water.position.set(0, 0, -7.95);
lake.add(water);

// the grown-up, seen from behind: a rigged person from world/people.js, put here by placeReader()
export const ADULT_HEAD = new THREE.Vector3(L.x + 0.35, 2.05, 0.3); // where the caption beside the person sits
const ADULT_AT = new THREE.Vector3(0, 0.15, 0.35); // feet, lake-local
let reader = null;
const UP = new THREE.Vector3(0, 1, 0);

/* ---------- the letter, folded twice: top half down, then the right half over ---------- */
const PW = 0.26, PH = 0.36;
const paperCanvas = document.createElement("canvas");
paperCanvas.width = 520; paperCanvas.height = 720;
export function drawPaper() {
  const x = paperCanvas.getContext("2d");
  x.fillStyle = "#efe6d1"; x.fillRect(0, 0, 520, 720);
  x.strokeStyle = "rgba(150,130,100,0.25)"; x.lineWidth = 1;
  for (let y = 70; y < 700; y += 30) { x.beginPath(); x.moveTo(36, y); x.lineTo(484, y); x.stroke(); }
  x.fillStyle = "#34323d"; x.font = '300 17px "Noto Sans KR", sans-serif';
  let y = 64;
  for (const key of Object.keys(LINES)) {
    if (key === "l11") continue;
    let line = "";
    for (const ch of finalOf(LINES[key])) {
      if (x.measureText(line + ch).width > 440) { x.fillText(line, 40, y); y += 30; line = ""; }
      line += ch;
    }
    x.fillText(line, 40, y); y += 30;
    if (y > 690) break;
  }
  paperTex.needsUpdate = true;
}
const paperTex = new THREE.CanvasTexture(paperCanvas);
paperTex.colorSpace = THREE.SRGBColorSpace;
const paperMat = new THREE.MeshBasicMaterial({ map: paperTex, side: THREE.DoubleSide, color: 0xd8d0bf, toneMapped: false });
function quad(u0, v0, u1, v1) {
  const g = new THREE.PlaneGeometry(PW / 2, PH / 2);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, u0 + uv.getX(i) * (u1 - u0), v0 + uv.getY(i) * (v1 - v0));
  return new THREE.Mesh(g, paperMat);
}
const paper = new THREE.Group();
lake.add(paper);
const leftHalf = new THREE.Group(), topL = new THREE.Group(), rightPivot = new THREE.Group(), topR = new THREE.Group();
paper.add(leftHalf, rightPivot);
const BL = quad(0, 0, 0.5, 0.5); BL.position.set(-PW / 4, -PH / 4, 0);
const TL = quad(0, 0.5, 0.5, 1); TL.position.set(-PW / 4, PH / 4, 0.001);
const BR = quad(0.5, 0, 1, 0.5); BR.position.set(PW / 4, -PH / 4, 0.002);
const TR = quad(0.5, 0.5, 1, 1); TR.position.set(PW / 4, PH / 4, 0.003);
leftHalf.add(BL, topL); topL.add(TL);
rightPivot.add(BR, topR); topR.add(TR);

// f1: top half folded down · f2: right half folded over · tuck: held against the chest
export const fold = { f1: 0, f2: 0, tuck: 0 };
const OPEN = { p: new THREE.Vector3(0.18, 1.7, -0.05), q: new THREE.Quaternion() };
const HELD = { p: new THREE.Vector3(0.1, 1.3, -0.05), q: new THREE.Quaternion() };

export function placeReader(p) {
  reader = p;
  p.root.rotation.y = Math.PI; // facing the water (-z)
  p.root.position.copy(ADULT_AT);
  lake.add(p.root);
  lake.updateMatrixWorld(true);
  // where the letter is held, taken from the person's own bones: before the face to read, against the chest once folded
  const ax = axes(p);
  const head = p.bones.head.getWorldPosition(new THREE.Vector3());
  const chest = (p.bones.chest || p.bones.spine).getWorldPosition(new THREE.Vector3());
  const eyes = head.clone().addScaledVector(ax.fwd, 0.09);
  const dummy = new THREE.Object3D();
  lake.add(dummy);
  dummy.position.copy(lake.worldToLocal(head.clone().addScaledVector(ax.right, 0.12).addScaledVector(UP, -0.12).addScaledVector(ax.fwd, 0.36)));
  dummy.lookAt(eyes);
  OPEN.p.copy(dummy.position); OPEN.q.copy(dummy.quaternion);
  const held = chest.clone().addScaledVector(ax.right, 0.05).addScaledVector(UP, -0.03).addScaledVector(ax.fwd, 0.25);
  dummy.position.copy(lake.worldToLocal(held.clone()));
  dummy.lookAt(held.clone().addScaledVector(UP, 1).addScaledVector(ax.fwd, -0.7));
  HELD.p.copy(dummy.position); HELD.q.copy(dummy.quaternion);
  lake.remove(dummy);
  ADULT_HEAD.copy(head).addScaledVector(ax.right, 0.4).addScaledVector(UP, 0.25);
}

const _q = new THREE.Quaternion(), _c = new THREE.Vector3();
function applyFold(posePerson) {
  topL.rotation.x = topR.rotation.x = fold.f1 * (Math.PI - 0.04);
  rightPivot.rotation.y = -fold.f2 * (Math.PI - 0.08);
  rightPivot.position.z = fold.f2 * 0.004;
  paper.position.lerpVectors(OPEN.p, HELD.p, fold.tuck);
  paper.quaternion.slerpQuaternions(OPEN.q, HELD.q, fold.tuck);
  if (!reader || !posePerson) return;
  // the hands hold the two side edges of whatever is left of the sheet after folding
  paper.updateMatrixWorld(true);
  paper.getWorldQuaternion(_q);
  const r = new THREE.Vector3(1, 0, 0).applyQuaternion(_q), u = new THREE.Vector3(0, 1, 0).applyQuaternion(_q);
  paper.getWorldPosition(_c).addScaledVector(r, -fold.f2 * PW / 4).addScaledVector(u, -fold.f1 * PH / 4);
  poseReader(reader, _c, r, u, (PW / 2) * (1 - 0.5 * fold.f2) - 0.01);
}

/* ---------- brush strokes going round the swirls, and big ringed stars ---------- */
const PALETTE = ["#f4e27a", "#e8c547", "#f6efc4", "#9fc0e8", "#5d86c9", "#2e4f9a", "#dfe8f2", "#7fa7d9"].map((h) => new THREE.Color(h));
const VORTEX = [[-5, 9, -12], [1, 11, -13], [7, 8.5, -11], [-9, 6.5, -10], [4, 5.5, -9], [10, 12, -13]];
let rnd = 7;
const rand = () => ((rnd = (rnd * 16807) % 2147483647) / 2147483647);
const N = L.strokes;
const g = new THREE.BufferGeometry();
const center = new Float32Array(N * 3), rad = new Float32Array(N), phase = new Float32Array(N), w = new Float32Array(N), col = new Float32Array(N * 3), size = new Float32Array(N);
for (let i = 0; i < N; i++) {
  const v = VORTEX[i % VORTEX.length];
  center.set([v[0] + (rand() - 0.5) * 3, v[1] + (rand() - 0.5) * 2, v[2] + (rand() - 0.5) * 3], i * 3);
  rad[i] = 0.4 + rand() * 3.6;
  phase[i] = rand() * Math.PI * 2;
  w[i] = (0.1 + rand() * 0.12) * (rad[i] < 1.2 ? 1.6 : 1);
  const c = PALETTE[Math.floor(rand() * PALETTE.length)];
  col.set([c.r, c.g, c.b], i * 3);
  size[i] = 0.5 + rand() * 0.6;
}
g.setAttribute("position", new THREE.BufferAttribute(center.slice(), 3));
g.setAttribute("aCenter", new THREE.BufferAttribute(center, 3));
g.setAttribute("aR", new THREE.BufferAttribute(rad, 1));
g.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
g.setAttribute("aW", new THREE.BufferAttribute(w, 1));
g.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
const strokeMat = new THREE.ShaderMaterial({
  uniforms: { uTime: { value: 0 }, uPx: { value: 600 }, uOpacity: { value: L.strokeOpacity } },
  vertexShader: STROKE_V, fragmentShader: STROKE_F, transparent: true, depthWrite: false,
});
const strokes = new THREE.Points(g, strokeMat);
strokes.frustumCulled = false;
lake.add(strokes);

const SP = [[-6, 11, -12], [-2, 13, -13], [3, 12.5, -12], [7, 10, -11], [10, 13, -13], [-9, 9, -11], [0, 9.5, -10], [5, 7.5, -9], [-4, 6.5, -8]].slice(0, L.stars);
const sg = new THREE.BufferGeometry();
sg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(SP.flat()), 3));
sg.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array(SP.map((_, i) => 1.4 + (i % 3) * 0.5)), 1));
sg.setAttribute("aSeed", new THREE.BufferAttribute(new Float32Array(SP.map((_, i) => i * 0.37)), 1));
const starMat = new THREE.ShaderMaterial({
  uniforms: { uTime: { value: 0 }, uPx: { value: 600 } },
  vertexShader: STAR_V, fragmentShader: STAR_F, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
});
const stars = new THREE.Points(sg, starMat);
stars.frustumCulled = false;
lake.add(stars);

// pixels per metre at distance 1, so strokes keep their size as the camera moves
export function setPointScale(px) { strokeMat.uniforms.uPx.value = px; starMat.uniforms.uPx.value = px; }

export function updateLake(t, motion, visible) {
  applyFold(visible);
  strokeMat.uniforms.uTime.value = t * motion;
  starMat.uniforms.uTime.value = t * motion;
  waterMat.uniforms.uTime.value = t * motion;
  backdrop.material.uniforms.uTime.value = t * motion;
  backdrop.material.uniforms.uMotion.value = motion;
}
