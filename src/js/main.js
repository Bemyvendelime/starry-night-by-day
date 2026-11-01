// 시작점: 글꼴과 그림을 기다렸다가 첫 장면을 열고, 매 프레임 그립니다.
import * as THREE from "three";
import { renderer, scene, camera } from "./core/renderer.js";
import { U } from "./core/uniforms.js";
import { G, S } from "./core/state.js";
import { clock, stepTweens, stepCam, rig, refitCam } from "./core/motion.js";
import { finalOf, typer } from "./core/typer.js";
import { BEATS } from "./content/beats.js";
import { LINES, LETTER, ENDING, OPENING, HINTS } from "./content/letter.js";
import { LOOK } from "./content/look.js";
import { paintReady, paintImg } from "./gfx/painting.js";
import { updateRoom, sitter, HEAD_C, monitorWorld, badgeWorld, drawIpad, seatPerson, bodyMaterial } from "./world/room.js";
import { updateLake, setPointScale, drawPaper, ADULT_HEAD, placeReader, adultMat } from "./world/lake.js";
import { loadPeople, makePerson, poseSitter } from "./world/people.js";
import { hatch } from "./gfx/kit.js";
import { drawScreen } from "./ui/screen.js";
import { ovU, ovScene, ovCam, updateOverlay, placeWaterPeople } from "./ui/overlay.js";
import { el, place, setLoader, makeGrain, fillA11y } from "./ui/dom.js";
import { applyBeat } from "./director.js";
import { initInput, par } from "./input.js";
import { initDev, devFrame } from "./dev.js";

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  ovU.uAspect.value = w / h;
  refitCam();
}

const look = new THREE.Vector3();
let last = performance.now(), lastDraw = -1;
function frame(ts) {
  const dt = Math.min(0.05, (ts - last) / 1000);
  last = ts; clock.now += dt;
  const t = clock.now, motion = G.still ? 0 : 1;
  stepTweens();
  stepCam();

  if (!devFrame()) {
    par.x += (par.tx - par.x) * 0.04; par.y += (par.ty - par.y) * 0.04;
    camera.position.copy(rig.p).add(look.set(Math.sin(t * 0.31) * 0.008 * motion, Math.sin(t * 0.23) * 0.006 * motion, 0));
    camera.fov = rig.fov; camera.updateProjectionMatrix();
    camera.lookAt(look.copy(rig.t).add(new THREE.Vector3(par.x * 0.05 * motion, -par.y * 0.03 * motion, 0)));
  }
  U.uCam.value.copy(camera.position);
  U.uMonI.value = G.world === "lake" ? 0 : LOOK.monitorPower * (1 + Math.sin(t * 7.3) * LOOK.monitorFlicker * 0.6 + Math.sin(t * 1.7) * LOOK.monitorFlicker);
  setPointScale((innerHeight * renderer.getPixelRatio()) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))));

  updateRoom(t, motion, G.world !== "lake" ? poseSitter : null, S.typing && BEATS[G.k].compose);
  updateLake(t, motion, G.world === "lake");
  updateOverlay(t, motion, renderer);
  if (G.dropT >= 0) { G.dropT += dt; ovU.uDrop.value = G.dropT; if (G.dropT > 9) { G.dropT = -1; ovU.uDrop.value = -1; } }

  // the monitor is redrawn only when its words change, or a few times a second for the caret and the badge
  if (G.world !== "lake") {
    const gap = t - lastDraw;
    if (S.dirty || (S.pulse && gap > 0.05) || ((S.compose || G.k === 0) && gap > 0.3)) { drawScreen(t); S.dirty = false; lastDraw = t; }
  }
  // looking at the screen we are the person at the desk, so their body steps out of the way
  sitter.visible = !(rig.key === "screen" && !rig.tw) && camera.position.distanceTo(HEAD_C) > 0.5;

  if (G.hintOn && !typer.busy) {
    el.hint.style.opacity = 1;
    if (G.k === 0) { el.hintTxt.textContent = HINTS.room; place(el.hint, monitorWorld, 40, -10); }
    else { if (G.badgeMisses === 0) el.hintTxt.textContent = HINTS.badge; place(el.hint, badgeWorld, 30, -9); }
  } else el.hint.style.opacity = 0;
  if (!el.anchor.hidden) place(el.anchor, ADULT_HEAD, 26, -40);

  renderer.clear();
  if (ovU.uOpacity.value < 0.999) renderer.render(scene, camera);
  if (ovU.uOpacity.value > 0.001) renderer.render(ovScene, ovCam);
  requestAnimationFrame(frame);
}

(async () => {
  setLoader(0.25);
  const allText = Object.values(LINES).map(finalOf).join("") + Object.values(ENDING).join("") + "받는사람제목(없음)임시저장됨오후보내기나를설명하는법보관함";
  const fonts = Promise.all([
    document.fonts.load('400 40px "Noto Sans KR"', allText),
    document.fonts.load('300 17px "Noto Sans KR"', allText),
    document.fonts.load('26px "Nanum Gothic Coding"', "starry.js 나를설명하는법"),
    document.fonts.load('22px "Gaegu"', ENDING.to),
    document.fonts.load('500 17px "Jost"', "1"),
    document.fonts.load('300 86px "Jost"', "11:47"),
  ]).catch(() => {});
  await Promise.race([Promise.all([fonts, paintReady()]), new Promise((r) => setTimeout(r, 4000))]);
  setLoader(0.55);
  try {
    // one rigged person, cloned four times: at the desk, by the lake, and the two in the water
    await loadPeople();
    const H = LOOK.people;
    seatPerson(makePerson({ height: H.adultHeight, mat: bodyMaterial }));
    placeReader(makePerson({ height: H.adultHeight, mat: adultMat }));
    const inWater = hatch({ rim: 1.8, base: 0.02, seed: 13, sp: 0.016, gain: 0.45 });
    placeWaterPeople(makePerson({ height: H.adultHeight, mat: inWater }), makePerson({ height: H.childHeight, mat: inWater, headScale: H.childHeadScale, kid: true }));
  } catch (e) { console.error("people", e); }
  setLoader(0.8);
  drawPaper();
  drawIpad(paintImg);
  makeGrain();
  fillA11y({ BEATS, LINES, LETTER, ENDING, OPENING, finalOf });
  initInput();
  initDev();
  addEventListener("resize", resize);
  resize();
  const m = /^#beat-(\d+)$/.exec(location.hash);
  applyBeat(m ? Number(m[1]) : 0, false);
  requestAnimationFrame((ts) => { last = ts; frame(ts); });
  setLoader(1);
  if (new URLSearchParams(location.search).has("shot")) { el.loader.remove(); document.body.classList.add("shot"); } // still screenshots in tests
  else setTimeout(() => el.loader.classList.add("done"), 250);
})();
