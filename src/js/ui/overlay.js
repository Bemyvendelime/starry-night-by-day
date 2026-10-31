// 전체 화면 층: (0) 그림을 가까이서, (1) 호수를 내려다본 장면.
// 물속 모습은 실루엣 마스크 두 장입니다. A = 어른, B = 손 흔드는 아이 (매 프레임 팔을 다시 그림).
// 최종 그림을 코덱스로 뽑으면 drawAdult / drawChild 대신 이미지를 그려 넣으면 됩니다.
import * as THREE from "three";
import { OV_V, OV_F } from "../gfx/shaders.js";
import { paintTex, IMG_ASPECT } from "../gfx/painting.js";
import { LOOK } from "../content/look.js";

function maskCanvas() {
  const c = document.createElement("canvas"); c.width = c.height = 512;
  const tex = new THREE.CanvasTexture(c);
  return { c, x: c.getContext("2d"), tex };
}

// the grown-up seen in the water: head and broad shoulders
function drawAdult(x) {
  x.clearRect(0, 0, 512, 512);
  x.fillStyle = "#fff"; x.filter = "blur(2.5px)";
  x.beginPath(); x.moveTo(30, 512); x.bezierCurveTo(44, 404, 118, 352, 190, 340); x.lineTo(226, 330); x.lineTo(229, 288);
  x.lineTo(283, 288); x.lineTo(286, 330); x.lineTo(322, 340); x.bezierCurveTo(394, 352, 468, 404, 482, 512); x.closePath(); x.fill();
  x.beginPath(); x.ellipse(256, 226, 58, 72, 0, 0, Math.PI * 2); x.fill();
  x.beginPath(); x.ellipse(252, 188, 64, 46, -0.15, Math.PI, 0); x.fill();
  x.beginPath(); x.ellipse(196, 232, 10, 18, 0, 0, Math.PI * 2); x.ellipse(316, 232, 10, 18, 0, 0, Math.PI * 2); x.fill();
  x.filter = "none";
}

// the child looking up out of the water, waving one hand
function drawChild(x, t) {
  x.clearRect(0, 0, 512, 512);
  x.fillStyle = "#fff"; x.strokeStyle = "#fff"; x.lineCap = "round"; x.lineJoin = "round"; x.filter = "blur(2px)";
  x.beginPath(); x.moveTo(126, 512); x.bezierCurveTo(132, 448, 168, 414, 208, 404); x.lineTo(234, 398); x.lineTo(236, 368);
  x.lineTo(276, 368); x.lineTo(278, 398); x.lineTo(304, 404); x.bezierCurveTo(344, 414, 380, 448, 386, 512); x.closePath(); x.fill();
  // arm down
  x.lineWidth = 34; x.beginPath(); x.moveTo(196, 424); x.quadraticCurveTo(160, 470, 150, 512); x.stroke();
  // arm up, waving from the elbow
  const sh = [318, 420], el = [374, 350];
  x.beginPath(); x.moveTo(...sh); x.lineTo(...el); x.stroke();
  const a = -1.3 + Math.sin(t * LOOK.waveSpeed) * 0.38;
  const hx = el[0] + Math.cos(a) * 88, hy = el[1] + Math.sin(a) * 88;
  x.lineWidth = 28; x.beginPath(); x.moveTo(...el); x.lineTo(hx, hy); x.stroke();
  x.beginPath(); x.arc(hx, hy, 24, 0, Math.PI * 2); x.fill();
  for (let f = -2; f <= 2; f++) { // fingers spread
    const fa = a + f * 0.28;
    x.lineWidth = 9; x.beginPath(); x.moveTo(hx, hy); x.lineTo(hx + Math.cos(fa) * 36, hy + Math.sin(fa) * 36); x.stroke();
  }
  // round head, bowl cut, a cowlick
  x.beginPath(); x.arc(256, 300, 66, 0, Math.PI * 2); x.fill();
  x.beginPath(); x.moveTo(182, 302); x.bezierCurveTo(176, 214, 336, 214, 330, 302); x.lineTo(330, 314); x.lineTo(182, 314); x.closePath(); x.fill();
  x.beginPath(); x.moveTo(262, 232); x.quadraticCurveTo(276, 204, 294, 212); x.quadraticCurveTo(279, 218, 271, 238); x.closePath(); x.fill();
  x.filter = "none";
}

const A = maskCanvas(), B = maskCanvas();
drawAdult(A.x); A.tex.needsUpdate = true;
drawChild(B.x, 0); B.tex.needsUpdate = true;

export const ovU = {
  uPaint: { value: paintTex }, uMaskA: { value: A.tex }, uMaskB: { value: B.tex },
  uTime: { value: 0 }, uMode: { value: 0 }, uOpacity: { value: 0 }, uAspect: { value: 1 }, uImg: { value: IMG_ASPECT },
  uDrop: { value: -1 }, uDropC: { value: new THREE.Vector2(0.5, 0.56) }, uMaskMix: { value: 0 }, uZoom: { value: 0 }, uSpark: { value: 0 },
  uGlow: { value: LOOK.childGlow },
};
export const ovScene = new THREE.Scene();
export const ovCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
ovScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
  uniforms: ovU, transparent: true, depthTest: false, depthWrite: false, vertexShader: OV_V, fragmentShader: OV_F,
})));

let lastWave = -1;
export function updateOverlay(t, motion) {
  ovU.uTime.value = t * motion;
  // the child only waves while the lake is on screen; redraw the arm about 30 times a second
  if (ovU.uMode.value > 0.5 && ovU.uOpacity.value > 0.01 && ovU.uMaskMix.value > 0.01 && t - lastWave > 0.033) {
    drawChild(B.x, t * motion); B.tex.needsUpdate = true; lastWave = t;
  }
}
