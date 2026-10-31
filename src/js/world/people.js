// 사람: 뼈대가 있는 glTF 모델 하나를 불러와 복제해서, 앉아서 타이핑하는 나 · 편지를 든 어른 · 물속의 어른과 아이로 씁니다.
// 모델 파일·키·크기는 content/look.js 의 people 에서 바꿉니다. 자세는 gfx/rig.js 의 IK 로 잡습니다.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import { findBones, reach, turn, snapshot, restore } from "../gfx/rig.js";
import { LOOK } from "../content/look.js";

const UP = new THREE.Vector3(0, 1, 0);
let source = null; // the loaded glTF: { scene, animations }

export async function loadPeople() {
  const loader = new GLTFLoader();
  // the claude.ai preview can't serve .glb files, so its build inlines the model as base64 (see build.py)
  const inline = document.getElementById("personGlb");
  if (inline) {
    const bin = Uint8Array.from(atob(inline.textContent.trim()), (c) => c.charCodeAt(0));
    source = await loader.parseAsync(bin.buffer, "");
  } else source = await loader.loadAsync(LOOK.people.model);
  return source;
}

// One person: a clone of the model scaled to `height` (m), feet at the root's origin, facing the root's +z.
export function makePerson({ height, mat, headScale = 1 }) {
  const root = new THREE.Group();
  const body = SkeletonUtils.clone(source.scene);
  body.traverse((o) => { if (o.isMesh) { o.material = mat; o.frustumCulled = false; } });
  root.add(body);
  // start from a natural standing frame of the model's idle clip if it has one (its rest pose may be a T-pose)
  const idle = source.animations.find((a) => new RegExp(LOOK.people.idleClip, "i").test(a.name));
  if (idle) {
    const mixer = new THREE.AnimationMixer(body);
    mixer.clipAction(idle).play();
    mixer.setTime(LOOK.people.idleTime);
  }
  body.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(body);
  const s = height / (box.max.y - box.min.y);
  body.scale.setScalar(s);
  body.position.y = -box.min.y * s;
  const bones = findBones(body);
  if (LOOK.people.hair && bones.head) addHair(bones.head, mat, headScale !== 1);
  if (headScale !== 1 && bones.head) bones.head.scale.setScalar(headScale);
  root.updateMatrixWorld(true);
  return { root, body, bones, base: snapshot(bones) };
}

// A bald mannequin reads as a doll; a cap of hair on the head bone reads as a person.
// The head bone's +y runs up through the skull (glTF bones point along +y).
function addHair(head, mat, child) {
  head.updateMatrixWorld(true);
  const hp = head.getWorldPosition(new THREE.Vector3());
  const top = head.children.find((c) => /top/i.test(c.name));
  const h = top ? top.getWorldPosition(new THREE.Vector3()).distanceTo(hp) : 0.2;
  const ws = head.getWorldScale(new THREE.Vector3()).x;
  const { size, lift } = LOOK.people.hairFit;
  const r = (h * size) / ws;
  if (new URLSearchParams(location.search).has("hairdebug")) mat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const hair = new THREE.Group();
  hair.position.set(0, (h * lift) / ws, 0);
  head.add(hair);
  // the cap: down to the brow for the child (a bowl cut), shorter and fuller at the back for the grown-up
  const cap = new THREE.Mesh(new THREE.SphereGeometry(r * 1.1, 28, 18, 0, Math.PI * 2, 0, Math.PI * (child ? 0.6 : 0.5)), mat);
  cap.scale.set(1.0, child ? 1.0 : 0.92, 1.06);
  cap.position.set(0, r * 0.06, -r * 0.04);
  hair.add(cap);
  const back = new THREE.Mesh(new THREE.SphereGeometry(r * 1.04, 20, 12, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.25), mat);
  back.position.set(0, -r * 0.05, -r * 0.12);
  hair.add(back);
  if (child) { // a cowlick
    const tuft = new THREE.Mesh(new THREE.ConeGeometry(r * 0.12, r * 0.55, 8), mat);
    tuft.position.set(r * 0.1, r * 1.15, -r * 0.2);
    tuft.rotation.set(-0.5, 0, -0.4);
    hair.add(tuft);
  }
}

const wq = new THREE.Quaternion();
// the person's own axes in world space (the model faces its +z, so its right hand is on its -x)
export function axes(p) {
  p.root.getWorldQuaternion(wq);
  return {
    right: new THREE.Vector3(-1, 0, 0).applyQuaternion(wq),
    fwd: new THREE.Vector3(0, 0, 1).applyQuaternion(wq),
  };
}
const pos = (b) => b.getWorldPosition(new THREE.Vector3());
const SIDES = [["L", -1], ["R", 1]]; // sign along the person's right axis

function start(p) {
  restore(p.bones, p.base);
  p.root.updateMatrixWorld(true);
  return axes(p);
}
// a point offset from `from` along the person's right / up / forward axes
const off = (from, ax, r, u, f) => from.clone().addScaledVector(ax.right, r).addScaledVector(UP, u).addScaledVector(ax.fwd, f);

function armsDown(p, ax) {
  const B = p.bones;
  for (const [side, sx] of SIDES) {
    if (!B["upperArm" + side]) continue;
    const sh = pos(B["upperArm" + side]);
    reach(B["upperArm" + side], B["lowerArm" + side], B["hand" + side], off(sh, ax, sx * 0.07, -0.5, 0.03), off(sh, ax, sx * 0.1, -0.3, -0.4));
  }
}

/* ---------- the person at the desk ----------
   T: world-space targets from the room: hand{L,R} on the keyboard, foot{L,R} on the floor.
   look: { yaw, pitch } turned by the director when the person looks round at the window. */
export function poseSitter(p, T, look) {
  const ax = start(p), B = p.bones;
  turn(B.spine, ax.right, -0.16); // lean toward the screen
  for (const [side, sx] of SIDES) {
    if (B["upperLeg" + side]) {
      const hip = pos(B["upperLeg" + side]);
      reach(B["upperLeg" + side], B["lowerLeg" + side], B["foot" + side], T["foot" + side], off(hip, ax, sx * 0.05, 0.3, 1.0));
    }
    if (B["upperArm" + side]) {
      const sh = pos(B["upperArm" + side]);
      reach(B["upperArm" + side], B["lowerArm" + side], B["hand" + side], T["hand" + side], off(sh, ax, sx * 0.45, -0.25, -0.25));
    }
  }
  turn(B.spine, UP, look.yaw * 0.2);
  turn(B.neck, UP, look.yaw * 0.45);
  turn(B.head, ax.right, look.pitch - 0.1);
  turn(B.head, UP, look.yaw * 0.45);
}

/* ---------- the grown-up reading by the lake ----------
   The hands hold the two side edges of the letter; c = its centre, r = its right edge direction, u = its up. */
export function poseReader(p, c, r, u, halfWidth) {
  const ax = start(p), B = p.bones;
  turn(B.neck, ax.right, -0.2);
  turn(B.head, ax.right, -0.3); // eyes on the letter
  for (const [side, sx] of SIDES) {
    if (!B["upperArm" + side]) continue;
    const hand = c.clone().addScaledVector(r, sx * halfWidth).addScaledVector(u, -0.04);
    const sh = pos(B["upperArm" + side]);
    reach(B["upperArm" + side], B["lowerArm" + side], B["hand" + side], hand, off(sh, ax, sx * 0.35, -0.55, -0.1));
  }
}

/* ---------- people seen in the water, looking up at us ---------- */
export function poseLookingUp(p) {
  const ax = start(p), B = p.bones;
  armsDown(p, ax);
  turn(B.neck, ax.right, 0.25);
  turn(B.head, ax.right, 0.3);
}
export function poseWaving(p, t) {
  const ax = start(p), B = p.bones;
  armsDown(p, ax);
  turn(B.neck, ax.right, 0.3);
  turn(B.head, ax.right, 0.32);
  turn(B.head, ax.fwd, Math.sin(t * 1.3) * 0.08);
  if (B.upperArmR) {
    // the right hand up beside the head, swinging from the elbow
    const head = pos(B.head), sh = pos(B.upperArmR);
    const hand = off(head, ax, 0.21 + Math.sin(t * LOOK.waveSpeed) * 0.08, 0.08, 0.08);
    reach(B.upperArmR, B.lowerArmR, B.handR, hand, off(sh, ax, 0.55, -0.35, -0.1));
  }
}
