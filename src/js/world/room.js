// 방: 책상, 모니터, 의자, 앉아서 코딩하는 사람, 창(별밤이 열리는 곳), 벽에 놓이는 글.
import * as THREE from "three";
import { scene } from "../core/renderer.js";
import { hatch, skyMat, box, limb, headOn, radialTex, textPlane } from "../gfx/kit.js";
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

// the person at the desk (placeholder built from capsules)
export const sitter = new THREE.Group();
room.add(sitter);
for (const s of [-1, 1]) {
  limb(sitter, [0.1 * s, 0.5, -0.95], [0.11 * s, 0.52, -1.4], 0.07, bodyMat);
  limb(sitter, [0.11 * s, 0.52, -1.4], [0.11 * s, 0.1, -1.44], 0.055, bodyMat);
  const foot = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.06, 0.22), bodyMat);
  foot.position.set(0.11 * s, 0.04, -1.5);
  sitter.add(foot);
  limb(sitter, [0.2 * s, 1.04, -1.06], [0.25 * s, 0.84, -1.28], 0.055, bodyMat);
  limb(sitter, [0.25 * s, 0.84, -1.28], [0.15 * s, 0.8, -1.56], 0.045, bodyMat);
  const hand = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 10), bodyMat);
  hand.position.set(0.15 * s, 0.79, -1.6);
  sitter.add(hand);
}
limb(sitter, [-0.12, 0.53, -0.96], [0.12, 0.53, -0.96], 0.12, bodyMat);
limb(sitter, [0, 0.6, -0.98], [0, 1.0, -1.06], 0.16, bodyMat);
limb(sitter, [-0.19, 1.05, -1.06], [0.19, 1.05, -1.06], 0.075, bodyMat);
limb(sitter, [0, 1.08, -1.07], [0, 1.17, -1.09], 0.05, bodyMat);
export const sitHead = headOn(sitter, [0, 1.17, -1.09], bodyMat);
export const HEAD_C = new THREE.Vector3(0, 1.27, -1.1);

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

export function updateRoom(t, motion) {
  winSky.uniforms.uTime.value = t * motion;
  winSky.uniforms.uMotion.value = motion;
}
