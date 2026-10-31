// 전체 화면 층: (0) 그림을 가까이서, (1) 호수를 내려다본 장면.
// 물속에 비치는 사람은 3D 인물(world/people.js)을 따로 렌더한 그림입니다. A = 올려다보는 어른, B = 손 흔드는 아이.
import * as THREE from "three";
import { OV_V, OV_F } from "../gfx/shaders.js";
import { paintTex, IMG_ASPECT } from "../gfx/painting.js";
import { U } from "../core/uniforms.js";
import { LOOK } from "../content/look.js";
import { poseLookingUp, poseWaving } from "../world/people.js";

// 2:1, so a waving hand beside the head stays in frame
const rtA = new THREE.WebGLRenderTarget(1024, 512, { samples: 4 });
const rtB = new THREE.WebGLRenderTarget(1024, 512, { samples: 4 });

export const ovU = {
  uPaint: { value: paintTex }, uMaskA: { value: rtA.texture }, uMaskB: { value: rtB.texture },
  uTime: { value: 0 }, uMode: { value: 0 }, uOpacity: { value: 0 }, uAspect: { value: 1 }, uImg: { value: IMG_ASPECT },
  uDrop: { value: -1 }, uDropC: { value: new THREE.Vector2(0.5, 0.62) }, uMaskMix: { value: 0 }, uZoom: { value: 0 }, uSpark: { value: 0 },
  uGlow: { value: LOOK.childGlow },
};
export const ovScene = new THREE.Scene();
export const ovCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
ovScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
  uniforms: ovU, transparent: true, depthTest: false, depthWrite: false, vertexShader: OV_V, fragmentShader: OV_F,
})));

/* ---------- the people in the water, rendered on their own and laid into the lake ---------- */
// They stand where the lake's starlight (U.uWinPos) falls on them from behind, facing a camera above and in front.
const water = new THREE.Scene();
const AT = new THREE.Vector3(LOOK.lake.x, 0, -3);
let adultUp = null, child = null;
const camA = new THREE.PerspectiveCamera(34, 2, 0.05, 30), camB = new THREE.PerspectiveCamera(34, 2, 0.05, 30);
// frame head and shoulders: centre `drop` m below the head, `half` m above and below it, seen from `tilt` rad above
function frameOn(cam, p, { drop, half, tilt }) {
  const head = p.bones.head.getWorldPosition(new THREE.Vector3());
  const target = new THREE.Vector3(AT.x, head.y - drop, AT.z);
  const dist = half / Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
  cam.position.copy(target).add(new THREE.Vector3(0, Math.sin(tilt) * dist, Math.cos(tilt) * dist));
  cam.lookAt(target);
  cam.updateMatrixWorld(true);
}
export function placeWaterPeople(a, c) {
  adultUp = a; child = c;
  for (const p of [a, c]) { p.root.position.copy(AT); water.add(p.root); p.root.updateMatrixWorld(true); }
  poseLookingUp(a); poseWaving(c, null);
  frameOn(camA, a, LOOK.people.waterFrame.adult);
  frameOn(camB, c, LOOK.people.waterFrame.child);
}
const camSave = new THREE.Vector3();
function draw(renderer, target, show, cam) {
  adultUp.root.visible = show === adultUp;
  child.root.visible = show === child;
  renderer.setRenderTarget(target);
  renderer.setClearColor(0x000000, 0);
  renderer.clear();
  U.uCam.value.copy(cam.position); // the pen-hatching rim is seen from this camera
  renderer.render(water, cam);
}

let lastWave = -1;
export function updateOverlay(t, motion, renderer) {
  ovU.uTime.value = t * motion;
  if (!adultUp || ovU.uMode.value < 0.5 || ovU.uOpacity.value < 0.01) return;
  // the water layer is on screen: pose and draw the two figures (about 30 times a second while the child waves)
  if (t - lastWave < 0.033) return;
  lastWave = t;
  camSave.copy(U.uCam.value);
  poseLookingUp(adultUp);
  poseWaving(child, motion ? t : null);
  draw(renderer, rtA, adultUp, camA);
  draw(renderer, rtB, child, camB);
  renderer.setRenderTarget(null);
  renderer.setClearColor(0x050506, 1);
  U.uCam.value.copy(camSave);
}
