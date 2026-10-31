// Posing a rigged person without knowing how its bones are oriented:
// find the bones by name (Mixamo, Quaternius and Unreal-style names), then aim limbs at points in the world
// (two-bone IK for arms and legs) and turn the spine and head about world axes.
import * as THREE from "three";

// glTF loaders drop the "." in names ("UpperArm.L" arrives as "UpperArmL"), so the side suffix may have no separator
const ROLES = {
  hips: [/hips$/i, /pelvis/i, /^root$/i],
  spine: [/spine$/i, /spine_?0?1$/i, /abdomen/i],
  chest: [/spine_?0?2$/i, /spine2$/i, /chest/i, /torso/i, /spine1$/i],
  neck: [/neck/i],
  head: [/head$/i, /^head/i],
  upperArmL: [/left.*arm$/i, /upper_?arm[._]?l$/i, /l.*upper.?arm/i],
  lowerArmL: [/left.*fore.?arm/i, /lower_?arm[._]?l$/i, /fore.?arm[._]?l$/i],
  handL: [/left.*hand$/i, /hand[._]?l$/i, /wrist[._]?l$/i, /palm[._]?l$/i],
  upperArmR: [/right.*arm$/i, /upper_?arm[._]?r$/i, /r.*upper.?arm/i],
  lowerArmR: [/right.*fore.?arm/i, /lower_?arm[._]?r$/i, /fore.?arm[._]?r$/i],
  handR: [/right.*hand$/i, /hand[._]?r$/i, /wrist[._]?r$/i, /palm[._]?r$/i],
  upperLegL: [/left.*up.?leg/i, /upper_?leg[._]?l$/i, /thigh[._]?l$/i],
  lowerLegL: [/left.*leg$/i, /lower_?leg[._]?l$/i, /shin[._]?l$/i, /calf[._]?l$/i],
  footL: [/left.*foot$/i, /foot[._]?l$/i, /ankle[._]?l$/i],
  upperLegR: [/right.*up.?leg/i, /upper_?leg[._]?r$/i, /thigh[._]?r$/i],
  lowerLegR: [/right.*leg$/i, /lower_?leg[._]?r$/i, /shin[._]?r$/i, /calf[._]?r$/i],
  footR: [/right.*foot$/i, /foot[._]?r$/i, /ankle[._]?r$/i],
};

// role -> bone. Each role takes the first bone whose name matches, trying the patterns in order.
export function findBones(root) {
  const bones = [];
  root.traverse((o) => { if (o.isBone) bones.push(o); });
  const used = new Set();
  const out = {};
  for (const [role, pats] of Object.entries(ROLES)) {
    for (const re of pats) {
      const b = bones.find((x) => !used.has(x) && re.test(x.name.replace(/^mixamorig:?/i, "")));
      if (b) { out[role] = b; used.add(b); break; }
    }
  }
  return out;
}

const _qp = new THREE.Quaternion(), _qw = new THREE.Quaternion(), _q = new THREE.Quaternion();
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _d = new THREE.Vector3();

// apply a rotation given in world space to a bone, keeping its parent where it is
export function rotateWorld(bone, q) {
  bone.parent.getWorldQuaternion(_qp);
  bone.getWorldQuaternion(_qw);
  bone.quaternion.copy(_qp.invert().multiply(_q.copy(q).multiply(_qw)));
  bone.updateMatrixWorld(true);
}
export function turn(bone, axis, angle) {
  if (bone) rotateWorld(bone, new THREE.Quaternion().setFromAxisAngle(axis, angle));
}

// turn `bone` so that the direction to `child` points at `target` (all in world space)
export function aim(bone, child, target) {
  bone.getWorldPosition(_a);
  child.getWorldPosition(_b);
  const cur = _c.subVectors(_b, _a).normalize();
  const want = _d.subVectors(target, _a).normalize();
  rotateWorld(bone, new THREE.Quaternion().setFromUnitVectors(cur, want));
}

// two-bone IK: put the end of `lower` (its child `end`) on `target`, with the middle joint bending toward `pole`
const S = new THREE.Vector3(), E0 = new THREE.Vector3(), H0 = new THREE.Vector3(), E = new THREE.Vector3();
export function reach(upper, lower, end, target, pole) {
  upper.getWorldPosition(S); lower.getWorldPosition(E0); end.getWorldPosition(H0);
  const a = S.distanceTo(E0), b = E0.distanceTo(H0);
  const toT = new THREE.Vector3().subVectors(target, S);
  const d = THREE.MathUtils.clamp(toT.length(), Math.abs(a - b) + 1e-3, a + b - 1e-3);
  const u = toT.normalize();
  const w = new THREE.Vector3().subVectors(pole, S);
  w.addScaledVector(u, -w.dot(u));
  if (w.lengthSq() < 1e-8) w.set(0, -1, 0).addScaledVector(u, -u.y);
  w.normalize();
  const x = (a * a - b * b + d * d) / (2 * d), y = Math.sqrt(Math.max(a * a - x * x, 0));
  E.copy(S).addScaledVector(u, x).addScaledVector(w, y);
  aim(upper, lower, E);
  aim(lower, end, target);
}

// remember / restore the rest pose, so each frame poses from the same start
export function snapshot(bones) {
  return Object.fromEntries(Object.entries(bones).map(([k, b]) => [k, b.quaternion.clone()]));
}
export function restore(bones, snap) {
  for (const [k, b] of Object.entries(bones)) b.quaternion.copy(snap[k]);
}
