// 사람: 뼈대가 있는 glTF 모델 하나를 불러와 복제해서, 앉아서 타이핑하는 나 · 편지를 든 어른 · 물속의 어른과 아이로 씁니다.
// 모델 파일·키·크기는 content/look.js 의 people 에서 바꿉니다. 자세는 gfx/rig.js 의 IK 로 잡습니다.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import { findBones, reach, aim, turn, snapshot, restore } from "../gfx/rig.js";
import { LOOK } from "../content/look.js";

const UP = new THREE.Vector3(0, 1, 0);
let source = null, kidSource = null; // the loaded glTFs: { scene, animations }

// the claude.ai preview can't serve .glb files, so its build inlines the models as base64 (see build.py)
async function loadGlb(loader, url, inlineId) {
  const inline = document.getElementById(inlineId);
  if (inline) {
    const bin = Uint8Array.from(atob(inline.textContent.trim()), (c) => c.charCodeAt(0));
    return loader.parseAsync(bin.buffer, "");
  }
  return loader.loadAsync(url);
}
export async function loadPeople() {
  const loader = new GLTFLoader();
  source = await loadGlb(loader, LOOK.people.model, "personGlb");
  kidSource = LOOK.people.childModel ? await loadGlb(loader, LOOK.people.childModel, "childGlb") : source;
}

// A clip's tracks bound to one cloned body, so a pose can be set straight from the keyframes at any time.
// (An AnimationMixer only writes a bone whose value changed since its last update, so posing on top of a clip
// every frame, at a time that doesn't move, would leave our own changes in place and pile them up.)
function bindClip(body, clip) {
  return clip.tracks.flatMap((track) => {
    const dot = track.name.lastIndexOf(".");
    const obj = body.getObjectByName(track.name.slice(0, dot)), prop = track.name.slice(dot + 1);
    // scale tracks are left out: the head and arm sizes set in makePerson must survive every clip
    return obj && obj[prop] && prop !== "scale" ? [{ obj, prop, at: track.createInterpolant() }] : [];
  });
}
function setClipPose(bound, time) {
  for (const { obj, prop, at } of bound) obj[prop].fromArray(at.evaluate(time));
}

// One person: a clone of the model scaled to `height` (m), feet at the root's origin, facing the root's +z.
export function makePerson({ height, mat, headScale = 1, kid = false }) {
  const src = kid ? kidSource : source;
  const root = new THREE.Group();
  const body = SkeletonUtils.clone(src.scene);
  body.traverse((o) => { if (o.isMesh) { o.material = mat; o.frustumCulled = false; } });
  root.add(body);
  // start from a natural standing frame of the model's idle clip if it has one (its rest pose may be a T-pose)
  const idle = src.animations.find((a) => new RegExp(LOOK.people.idleClip, "i").test(a.name));
  if (idle) setClipPose(bindClip(body, idle), LOOK.people.idleTime);
  // the whole idle pose, every bone: a clip played later only moves its own bones, the rest stay as here
  const idlePose = [];
  body.traverse((o) => { if (o.isBone) idlePose.push([o, o.position.clone(), o.quaternion.clone()]); });
  body.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(body);
  const s = height / (box.max.y - box.min.y);
  body.scale.setScalar(s);
  body.position.y = -box.min.y * s;
  const bones = findBones(body);
  root.updateMatrixWorld(true);
  // the crown is the model's top (height): its distance from the head bone sizes the hair when there is no head-top bone
  if (kid && LOOK.people.kidHair && bones.head) addKidHead(body, bones.head, mat, height);
  else if (LOOK.people.hair && bones.head) addHair(bones.head, mat, headScale !== 1, height);
  if (headScale !== 1 && bones.head) bones.head.scale.setScalar(headScale);
  // a child's arms are shorter and thinner: scaling the upper arm shrinks the whole arm, hand included
  const arm = kid ? LOOK.people.childArmScale ?? 1 : 1;
  if (arm !== 1) for (const b of [bones.upperArmL, bones.upperArmR]) if (b) b.scale.setScalar(arm);
  root.updateMatrixWorld(true);
  // a T-pose (hands level with the shoulders) needs its arms brought down; an idle pose already has them down
  const y = (b) => (b ? b.getWorldPosition(new THREE.Vector3()).y : 0);
  const tpose = Math.abs(y(bones.handL) - y(bones.upperArmL)) < 0.1 * (height / 1.7);
  return { root, body, bones, base: snapshot(bones), clips: src.animations, tpose, idlePose };
}

// The child model's own head carries hair tied back (it read as a ponytail in the water), so it is hidden and a
// round head with a bowl cut, level all round just above the brows, sits on the head bone instead.
function addKidHead(body, head, mat, crownY) {
  body.traverse((o) => { if (o.isMesh && /head/i.test(o.name)) o.visible = false; });
  head.updateMatrixWorld(true);
  const h = crownY - head.getWorldPosition(new THREE.Vector3()).y; // head bone (top of the neck) to the crown
  const ws = head.getWorldScale(new THREE.Vector3()).x;
  const { size, lift } = LOOK.people.kidHairFit;
  const r = (h * size) / ws;
  const g = new THREE.Group();
  g.position.set(0, (h * lift) / ws, 0);
  head.add(g);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 20), mat);
  skull.scale.set(0.92, 1, 0.98);
  g.add(skull);
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(r * 1.1, 32, 18, 0, Math.PI * 2, 0, Math.PI * 0.56), mat);
  bowl.position.set(0, r * 0.08, -r * 0.03);
  g.add(bowl);
}

// A bald mannequin reads as a doll; a cap of hair on the head bone reads as a person.
// The head bone's +y runs up through the skull (glTF bones point along +y).
function addHair(head, mat, child, crownY, fit = LOOK.people.hairFit) {
  head.updateMatrixWorld(true);
  const hp = head.getWorldPosition(new THREE.Vector3());
  const top = head.children.find((c) => /top/i.test(c.name));
  const h = top ? top.getWorldPosition(new THREE.Vector3()).distanceTo(hp) : crownY != null ? crownY - hp.y : 0.2;
  const ws = head.getWorldScale(new THREE.Vector3()).x;
  const { size, lift } = fit;
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
  if (!p.tpose) return;
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
// The model's own wave clip when it has one (a real wave: shoulder, elbow and wrist), then the head turned up to us.
// t = seconds, or null for a still frame. The clip raises the hand, waves and lowers it again; looping all of it would
// drop the hand every second, so after raising the hand it repeats only the waving part.
export function poseWaving(p, t) {
  const W = LOOK.people.wave;
  const wave = p.clips.find((a) => new RegExp(W.clip, "i").test(a.name));
  if (wave) {
    let ct = W.still;
    if (t !== null) {
      if (p.waveT0 === undefined || t - p.waveLast > 0.5) p.waveT0 = t; // shown again after a gap: raise the hand again
      p.waveLast = t;
      const s = (t - p.waveT0) * W.speed;
      ct = s < W.up ? s : W.up + ((s - W.up) % W.loop);
    }
    p.wave ??= bindClip(p.body, wave);
    // every bone back to the idle pose, then the wave clip moves only its own bones (arm, chest, head)
    for (const [b, pos, q] of p.idlePose) { b.position.copy(pos); b.quaternion.copy(q); }
    setClipPose(p.wave, ct);
    p.root.updateMatrixWorld(true);
    const ax = axes(p), B = p.bones;
    // the clip waves close beside the head; swing the whole arm out from the shoulder so the hand reads on its own
    const [side, sx] = pos(B.handL).y > pos(B.handR).y ? SIDES[0] : SIDES[1];
    const hand = pos(B["hand" + side]);
    aim(B["upperArm" + side], B["hand" + side], hand.addScaledVector(ax.right, sx * W.out).addScaledVector(UP, W.lift));
    turn(p.bones.neck, ax.right, 0.22);
    turn(p.bones.head, ax.right, 0.28);
    return;
  }
  const ax = start(p), B = p.bones;
  t = t ?? 0;
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
