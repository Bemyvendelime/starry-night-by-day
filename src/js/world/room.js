// 방: 책상, 모니터, 의자, 앉아서 코딩하는 사람, 창(별밤이 열리는 곳), 벽에 놓이는 글.
import * as THREE from "three";
import { scene } from "../core/renderer.js";
import { hatch, skyMat, box, radialTex, textPlane } from "../gfx/kit.js";
import { SCREEN_FIT } from "../content/cameras.js";

export const room = new THREE.Group();
scene.add(room);

const wallMat = hatch({ base: 0.05, seed: 1, sp: 0.05 });
const floorMat = hatch({ base: 0.05, seed: 2, sp: 0.06 });
const woodMat = hatch({ base: 0.07, seed: 3, sp: 0.022 });
const darkMat = hatch({ base: 0.04, seed: 4, sp: 0.018 });
const bodyMat = hatch({ rim: 1.3, base: 0.0, seed: 5, sp: 0.018, gain: 0.35 });

// walls and floor
const back = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 3.2), wallMat);
back.position.set(0, 1.6, -2.2);
const left = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 3.2), wallMat);
left.rotation.y = Math.PI / 2;
left.position.set(-2.6, 1.6, 0.1);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), floorMat);
floor.rotation.x = -Math.PI / 2;
floor.position.set(0, 0, 0.3);
room.add(back, left, floor);

// desk, monitor, keyboard, mug, shelf with books
box(1.5, 0.04, 0.72, 0, 0.74, -1.82, woodMat, room);
for (const [x, z] of [[-0.7, -2.12], [0.7, -2.12], [-0.7, -1.52], [0.7, -1.52]]) box(0.04, 0.72, 0.04, x, 0.36, z, woodMat, room);
box(0.68, 0.44, 0.035, 0, 1.12, -1.97, darkMat, room);
box(0.05, 0.27, 0.03, 0, 0.9, -2.0, darkMat, room);
box(0.26, 0.015, 0.17, 0, 0.768, -1.99, darkMat, room);
box(0.44, 0.02, 0.14, 0, 0.77, -1.6, darkMat, room);
const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.037, 0.1, 16), woodMat);
mug.position.set(0.52, 0.81, -1.72);
room.add(mug);
box(0.9, 0.025, 0.22, 1.3, 1.55, -2.09, woodMat, room);
for (let i = 0; i < 7; i++) box(0.035 + (i % 3) * 0.008, 0.2 + (i % 2) * 0.04, 0.16, 0.95 + i * 0.07, 1.67 + (i % 2) * 0.02, -2.08, darkMat, room);

// chair
box(0.46, 0.06, 0.46, 0, 0.44, -0.95, darkMat, room);
const backrest = box(0.44, 0.5, 0.05, 0, 0.8, -0.71, darkMat, room);
backrest.rotation.x = -0.12;
box(0.05, 0.38, 0.05, 0, 0.22, -0.95, darkMat, room);
for (let i = 0; i < 5; i++) {
  const a = (i / 5) * Math.PI * 2;
  const leg = box(0.32, 0.03, 0.04, Math.cos(a) * 0.16, 0.04, -0.95 + Math.sin(a) * 0.16, darkMat, room, false);
  leg.rotation.y = -a;
}

// the person at the desk: a rigged model from world/people.js, seated with IK (hands on the keyboard, feet on the floor)
export const sitter = new THREE.Group();
room.add(sitter);
export const sitHead = { rotation: { x: 0, y: 0 } }; // the director turns this when the person looks at the window
export const HEAD_C = new THREE.Vector3(0, 1.27, -1.1);
const SEAT = { hipY: 0.56, hipZ: -0.93 };
// world-space targets: the person faces -z, so their left is -x
export const SIT_TARGETS = {
  handL: new THREE.Vector3(-0.13, 0.795, -1.57), handR: new THREE.Vector3(0.13, 0.795, -1.57),
  footL: new THREE.Vector3(-0.13, 0.07, -1.42), footR: new THREE.Vector3(0.13, 0.07, -1.42),
};
let seated = null;
export function seatPerson(p) {
  seated = p;
  p.root.rotation.y = Math.PI;
  sitter.add(p.root);
  // lower the person until the hips sit on the chair
  p.root.updateMatrixWorld(true);
  const hip = p.bones.hips.getWorldPosition(new THREE.Vector3());
  p.root.position.set(-hip.x, SEAT.hipY - hip.y, SEAT.hipZ - hip.z);
  p.root.updateMatrixWorld(true);
  p.bones.head.getWorldPosition(HEAD_C);
}
export const bodyMaterial = bodyMat;

// the window on the left wall; the painting shows through it (crop = the big swirl, no cypress)
export const winSky = skyMat([0.3, 0.33, 0.48, 0.67]);
const winPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.3), winSky);
winPlane.rotation.y = Math.PI / 2;
winPlane.position.set(-2.585, 1.5, -0.9);
room.add(winPlane);
const winFrame = new THREE.Group();
winFrame.position.set(-2.57, 1.5, -0.9);
room.add(winFrame);
box(0.05, 1.4, 0.06, 0, 0, -0.58, woodMat, winFrame);
box(0.05, 1.4, 0.06, 0, 0, 0.58, woodMat, winFrame);
box(0.05, 0.06, 1.22, 0, 0.68, 0, woodMat, winFrame);
box(0.05, 0.06, 1.22, 0, -0.68, 0, woodMat, winFrame);
box(0.04, 1.3, 0.035, 0, 0, 0, woodMat, winFrame);
box(0.04, 0.035, 1.1, 0, 0.12, 0, woodMat, winFrame);
box(0.16, 0.035, 1.3, 0.05, -0.72, 0, woodMat, winFrame);

// glow in front of the monitor
const glow = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.3),
  new THREE.MeshBasicMaterial({ map: radialTex("rgba(255,255,255,0.55)", "rgba(255,255,255,0)"), transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false }));
glow.position.set(0, 1.12, -1.93);
room.add(glow);

// the monitor screen; ui/screen.js draws on its canvas
export const screenCanvas = document.createElement("canvas");
screenCanvas.width = 1280; screenCanvas.height = 800;
export const screenTex = new THREE.CanvasTexture(screenCanvas);
screenTex.colorSpace = THREE.SRGBColorSpace;
screenTex.anisotropy = 8;
export const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN_FIT.w, SCREEN_FIT.h), new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }));
screenMesh.position.set(...SCREEN_FIT.center);
room.add(screenMesh);
export const BADGE_UV = { u: 0.045, v: 0.965, hitU: 0.15, hitV: 0.86 };
export const badgeWorld = new THREE.Vector3((BADGE_UV.u - 0.5) * SCREEN_FIT.w, 1.12 + (BADGE_UV.v - 0.5) * SCREEN_FIT.h, -1.95);
export const monitorWorld = new THREE.Vector3(0, 1.12, -1.95);

// words on the back wall, and on the wall beside the window
export const wallText = textPlane(1.9, 0.95, 1024, 512);
wallText.mesh.position.set(-1.38, 1.6, -2.185);
export const sideText = textPlane(1.3, 0.65, 1024, 512);
sideText.mesh.rotation.y = Math.PI / 2;
sideText.mesh.position.set(-2.585, 1.6, 0.38);
room.add(wallText.mesh, sideText.mesh);

/* ---------- props ---------- */
const clothMat = hatch({ base: 0.05, seed: 9, sp: 0.03 });
const metalMat = hatch({ base: 0.05, seed: 10, sp: 0.016 });

// curtains either side of the window: a plane folded with a few sine waves
function curtain(z, w) {
  const g = new THREE.PlaneGeometry(w, 1.75, 28, 1);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 26) * 0.025 + Math.sin(p.getX(i) * 9) * 0.012);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, clothMat);
  m.rotation.y = Math.PI / 2;
  m.position.set(-2.53, 1.45, z);
  room.add(m);
}
curtain(-1.62, 0.36);
curtain(-0.2, 0.32);
box(0.03, 0.03, 1.9, -2.5, 2.33, -0.9, metalMat, room); // rod

// desk lamp (off), mouse, a rug under the chair
{
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.02, 20), metalMat);
  base.position.set(0.6, 0.77, -2.0);
  const arm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.36, 8), metalMat);
  arm1.position.set(0.6, 0.94, -1.98); arm1.rotation.x = 0.25;
  const arm2 = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.3, 8), metalMat);
  arm2.position.set(0.6, 1.14, -1.86); arm2.rotation.x = -1.0;
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.13, 20, 1, true), metalMat);
  shade.position.set(0.6, 1.12, -1.72); shade.rotation.x = 2.4;
  room.add(base, arm1, arm2, shade);
  const mouse = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 10), metalMat);
  mouse.scale.set(1, 0.45, 1.6);
  mouse.position.set(0.3, 0.772, -1.6);
  room.add(mouse);
  const rug = new THREE.Mesh(new THREE.CircleGeometry(0.85, 40), hatch({ base: 0.05, seed: 11, sp: 0.022 }));
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0, 0.004, -1.0);
  room.add(rug);
}

// a plant in the corner: a pot and long leaves
{
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.1, 0.26, 20), woodMat);
  pot.position.set(1.85, 0.13, -1.85);
  room.add(pot);
  const leafMat = hatch({ base: 0.05, seed: 12, sp: 0.02 });
  for (let i = 0; i < 9; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), leafMat);
    const a = (i / 9) * Math.PI * 2;
    leaf.scale.set(0.35, 2.6 + (i % 3) * 0.6, 0.8);
    leaf.position.set(1.85 + Math.cos(a) * 0.08, 0.42 + (i % 3) * 0.05, -1.85 + Math.sin(a) * 0.08);
    leaf.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5);
    room.add(leaf);
  }
}

// a framed print over the shelf, a wall clock stopped at 11:47
box(0.52, 0.38, 0.02, 1.3, 2.05, -2.19, woodMat, room);
{
  const face = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.025, 32), woodMat);
  face.rotation.x = Math.PI / 2;
  face.position.set(-0.55, 2.38, -2.185);
  room.add(face);
  const hand = (len, ang, w) => {
    const h = new THREE.Mesh(new THREE.BoxGeometry(w, len, 0.006), metalMat);
    h.geometry.translate(0, len / 2, 0);
    h.position.set(-0.55, 2.38, -2.168);
    h.rotation.z = -ang;
    room.add(h);
  };
  hand(0.07, ((11 + 47 / 60) / 12) * Math.PI * 2, 0.012);
  hand(0.1, (47 / 60) * Math.PI * 2, 0.008);
}

// the iPad on the windowsill, its screen dark until the letter says "아이패드 배경화면으로"
export const ipad = { light: 0 };
const IPW = 0.25, IPH = 0.18;
const ipadCanvas = document.createElement("canvas");
ipadCanvas.width = 500; ipadCanvas.height = 360;
const ipadTex = new THREE.CanvasTexture(ipadCanvas);
ipadTex.colorSpace = THREE.SRGBColorSpace;
const ipadMat = new THREE.MeshBasicMaterial({ map: ipadTex, color: 0x0a0a0a, toneMapped: false });
{
  const g = new THREE.Group();
  g.position.set(-2.49, 0.885, -0.62);
  g.rotation.y = Math.PI / 2;
  const tilt = new THREE.Group();
  tilt.rotation.x = -0.22;
  g.add(tilt);
  box(IPW + 0.014, IPH + 0.014, 0.008, 0, 0, 0, darkMat, tilt);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(IPW, IPH), ipadMat);
  scr.position.z = 0.0045;
  tilt.add(scr);
  room.add(g);
}
const ipadGlow = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.55),
  new THREE.MeshBasicMaterial({ map: radialTex("rgba(150,180,255,0.5)", "rgba(150,180,255,0)"), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
ipadGlow.rotation.y = Math.PI / 2;
ipadGlow.position.set(-2.46, 0.9, -0.62);
room.add(ipadGlow);
export function drawIpad(img) {
  const x = ipadCanvas.getContext("2d"), W = ipadCanvas.width, H = ipadCanvas.height;
  x.fillStyle = "#000"; x.fillRect(0, 0, W, H);
  // the wallpaper: the painting cropped round the big swirl
  const sw = img.naturalWidth * 0.62, sh = sw * (H / W);
  x.drawImage(img, img.naturalWidth * 0.2, img.naturalHeight * 0.05, sw, sh, 0, 0, W, H);
  x.fillStyle = "rgba(255,255,255,0.92)"; x.textAlign = "center";
  x.font = '300 86px "Jost", sans-serif'; x.fillText("11:47", W / 2, 128);
  x.font = '400 22px "Noto Sans KR", sans-serif'; x.fillText("10월 31일 토요일", W / 2, 44);
  ipadTex.needsUpdate = true;
}

const HAND_REST = { L: SIT_TARGETS.handL.clone(), R: SIT_TARGETS.handR.clone() };
export function updateRoom(t, motion, posePerson, typing) {
  // while a line is being typed, the two hands tap the keys in turn
  const tap = (phase) => (typing && motion ? Math.max(0, Math.sin(t * 17 + phase)) * 0.014 : 0);
  SIT_TARGETS.handL.copy(HAND_REST.L).y += tap(0);
  SIT_TARGETS.handR.copy(HAND_REST.R).y += tap(Math.PI * 0.9);
  if (seated && posePerson) posePerson(seated, SIT_TARGETS, { yaw: sitHead.rotation.y, pitch: sitHead.rotation.x });
  winSky.uniforms.uTime.value = t * motion;
  winSky.uniforms.uMotion.value = motion;
  ipadMat.color.setScalar(0.012 + 0.988 * ipad.light);
  ipadGlow.material.opacity = 0.55 * ipad.light;
}
