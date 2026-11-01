// 장면 지휘: beats.js 의 한 줄을 읽어 카메라·화면·벽 글·창·호수·편지 접기·소리·카드를 맞춥니다.
import { BEATS } from "./content/beats.js";
import { LINES, LETTER, ENDING } from "./content/letter.js";
import { MOVE } from "./content/cameras.js";
import { LOOK } from "./content/look.js";
import { S, G } from "./core/state.js";
import { U } from "./core/uniforms.js";
import { tween, setCam, rig, clamp } from "./core/motion.js";
import { typer, finalOf } from "./core/typer.js";
import { sound } from "./audio/sound.js";
import { winSky, sitHead, ipad } from "./world/room.js";
import { fold } from "./world/lake.js";
import { ovU } from "./ui/overlay.js";
import { drawWall, wallText, sideText } from "./ui/walls.js";
import { el } from "./ui/dom.js";

const FOLD_AT = BEATS.findIndex((b) => b.fold);
const IPAD_AT = BEATS.findIndex((b) => b.ipad);
export const LAKE_AT = BEATS.findIndex((b) => b.world === "lake");
let timers = [];
const later = (fn, ms) => timers.push(setTimeout(fn, ms));

function startFold() {
  const F = LOOK.fold, t1 = 0.3, t2 = t1 + F.first + F.gap, t3 = t2 + F.second + F.gap;
  tween(fold, "f1", 1, F.first, t1);
  tween(fold, "f2", 1, F.second, t2);
  tween(fold, "tuck", 1, F.tuck, t3);
  later(() => sound.paper(), t1 * 1000);
  later(() => sound.paper(), t2 * 1000);
}

// the whole letter, read at the reader's own pace (a `read` beat): scroll, then press the button
function openRead(anim) {
  const r = el.read;
  el.readTitle.textContent = LETTER.title; el.readTitle.hidden = !LETTER.title;
  el.readSign.textContent = LETTER.sign; el.readSign.hidden = !LETTER.sign;
  el.readBody.replaceChildren(...LETTER.paragraphs.map((t) => Object.assign(document.createElement("p"), { textContent: t })));
  r.classList.remove("on", "scrolled"); r.classList.toggle("still", !anim);
  r.hidden = false; r.scrollTop = 0;
  const show = () => { r.classList.add("on"); r.focus({ preventScroll: true }); };
  if (anim) later(show, 800); else show();
}

function showText(b, text, done, anim) {
  S.cur = text; S.typing = !done; S.dirty = true;
  if (b.show === "wall") drawWall(wallText, text, !done);
  if (b.show === "side") drawWall(sideText, text, !done);
  if (b.show === "cap" || b.show === "capHigh") { el.cap.textContent = text; el.cap.classList.toggle("caret", !done); }
  if (b.show === "anchor") { el.anchor.textContent = text; el.anchor.classList.toggle("caret", !done); }
  if (done) {
    el.live.textContent = text;
    if (b.fold && anim) startFold(); // the last line is read: fold the letter
    if (b.ipad && anim) tween(ipad, "light", 1, 1.6, 0.2); // "...아이패드 배경화면으로": the iPad wakes
  }
}

export function applyBeat(n, animate) {
  n = clamp(n, 0, BEATS.length - 1);
  for (const t of timers) clearTimeout(t);
  timers = [];
  typer.cancel();
  const b = BEATS[n], prev = BEATS[G.k] || b;
  G.k = n;
  const anim = animate && !G.still;
  const world = b.world || "room";
  const crossWorld = (prev.world || "room") !== world;
  G.world = world;

  // camera: a cut when the world changes behind an opaque layer, otherwise a move
  const camDur = !anim || crossWorld || b.cam === rig.key ? 0 : b.cam === "into" ? MOVE.intoPainting : MOVE.normal;
  if (crossWorld && anim) later(() => setCam(b.cam, 0), 50);
  else setCam(b.cam, camDur, b.arc);

  // monitor
  S.compose = !!b.compose; S.badge = !b.compose; S.pulse = !!b.badge;
  S.done = b.compose ? BEATS.slice(0, n).filter((x) => x.line && x.compose).map((x) => finalOf(LINES[x.line])) : [];
  S.cur = ""; S.typing = false; S.dirty = true;

  // words on surfaces
  tween(wallText.mat, "opacity", b.show === "wall" ? 1 : 0, anim ? 0.8 : 0);
  tween(sideText.mat, "opacity", b.show === "side" ? 1 : 0, anim ? 0.8 : 0);
  if (b.show !== "wall") drawWall(wallText, "", false);
  if (b.show !== "side") drawWall(sideText, "", false);
  el.cap.hidden = !(b.show === "cap" || b.show === "capHigh");
  el.cap.className = "cap " + (b.show === "capHigh" ? "high" : "low");
  el.cap.textContent = "";
  el.anchor.hidden = b.show !== "anchor";
  el.anchor.textContent = "";

  // the window, the head, the colour coming in; in the lake the sky lights everything
  const [rev, sat] = b.sky || [0, 0];
  tween(winSky.uniforms.uReveal, "value", rev, anim ? 2.6 : 0);
  tween(winSky.uniforms.uSat, "value", sat, anim ? 3.2 : 0);
  tween(sitHead.rotation, "y", b.head ? 0.95 : 0, anim ? 2.4 : 0, anim ? 0.3 : 0);
  tween(sitHead.rotation, "x", b.head ? 0.12 : 0, anim ? 2.4 : 0, anim ? 0.3 : 0);
  if (world === "lake") {
    U.uWinPos.value.set(...LOOK.lake.light); U.uWinAtt.value = 0.012; U.uWinCol.value.setRGB(...LOOK.lake.rim);
    tween(U.uWinI, "value", LOOK.lake.lightPower, 0); tween(U.uColorMix, "value", 1, 0);
  } else {
    U.uWinPos.value.set(-2.35, 1.55, -0.9); U.uWinAtt.value = 0.3; U.uWinCol.value.setRGB(...LOOK.windowTint);
    tween(U.uWinI, "value", LOOK.nightWindow + LOOK.starryWindow * rev, anim ? 2.6 : 0);
    tween(U.uColorMix, "value", sat * 0.85, anim ? 3.2 : 0);
  }

  // the full-screen layer
  if (b.paint) {
    ovU.uMode.value = 0; ovU.uZoom.value = 0;
    tween(ovU.uOpacity, "value", 1, anim ? 1.6 : 0, anim ? 1.7 : 0);
    tween(ovU.uZoom, "value", 0.12, anim ? 14 : 0, anim ? 1.7 : 0);
  } else if (b.pov) {
    ovU.uMode.value = 1;
    const fadeIn = anim && !prev.pov;
    tween(ovU.uOpacity, "value", 1, fadeIn ? 1.8 : 0, fadeIn ? 1.0 : 0);
  } else if (crossWorld && anim) {
    ovU.uOpacity.value = 1; // step out of the painting into the lake
    tween(ovU.uOpacity, "value", 0, 2.4, 0.5);
  } else tween(ovU.uOpacity, "value", 0, anim ? 0.9 : 0);
  ovU.uSpark.value = 0;
  G.dropT = -1; ovU.uDrop.value = -1;
  if (b.drop) {
    ovU.uMaskMix.value = 0;
    if (anim) {
      later(() => { G.dropT = 0; sound.drop(); }, 2300);
      later(() => tween(ovU.uMaskMix, "value", 1, 1.4), 2700);
    } else ovU.uMaskMix.value = 1;
  } else ovU.uMaskMix.value = b.pov ? 1 : 0;

  // the iPad on the sill: dark until its line, lit after
  if (IPAD_AT >= 0) tween(ipad, "light", n > IPAD_AT || (n === IPAD_AT && !anim) ? 1 : 0, 0);

  // the letter in the grown-up's hands: open until it is read, folded after
  if (FOLD_AT >= 0) {
    const folded = n > FOLD_AT || (n === FOLD_AT && !anim);
    for (const key of ["f1", "f2", "tuck"]) tween(fold, key, folded ? 1 : 0, 0);
  }

  // sound
  sound.setMusic(!!b.music);
  if (b.chord != null) sound.setChord(b.chord);

  // the line
  if (b.line) {
    const ops = LINES[b.line];
    const out = (s, done) => showText(b, s, done, anim);
    if (anim) later(() => typer.run(ops, out, !!b.music), camDur > 0 ? Math.min(camDur * 550, 1300) : crossWorld ? 1600 : 250);
    else out(finalOf(ops), true);
  }

  // the whole letter to scroll through
  el.read.hidden = true; el.read.classList.remove("on");
  if (b.read) openRead(anim);

  // the last card
  el.card.hidden = true; el.card.classList.remove("away"); el.fin.hidden = true;
  if (b.end) startEnd(anim);

  G.hintOn = !!b.hint;
  el.num.textContent = String(n + 1).padStart(2, "0") + " / " + BEATS.length;
  el.lab.textContent = b.label;
  el.bar.classList.toggle("dim", n >= 2 && n < BEATS.length - 1);
  try { history.replaceState(null, "", n ? "#beat-" + n : location.pathname + location.search); } catch {}
}

function startEnd(anim) {
  el.card.hidden = false; el.send.disabled = true;
  el.to.textContent = ""; el.subj.textContent = "";
  el.note.textContent = ENDING.note; el.footer.textContent = ENDING.footer; el.send.textContent = ENDING.send;
  if (!anim) { el.to.textContent = ENDING.to; el.subj.textContent = ENDING.subject; el.send.disabled = false; return; }
  typer.run([["p", 900], ["t", ENDING.to]], (s, done) => {
    el.to.textContent = s; el.to.classList.toggle("caret", !done);
    if (done) typer.run([["p", 400], ["t", ENDING.subject]], (s2, d2) => {
      el.subj.textContent = s2; el.subj.classList.toggle("caret", !d2);
      if (d2) { el.send.disabled = false; el.send.focus({ preventScroll: true }); }
    }, true);
  }, false);
}

export function sendLetter() {
  sound.unlock();
  if (typer.busy) typer.finish();
  el.card.classList.add("away");
  const sp = document.createElement("div"); sp.className = "spark"; document.body.appendChild(sp);
  tween(ovU.uSpark, "value", 1.4, G.still ? 0 : 2.2, G.still ? 0 : 1.6);
  sound.drop();
  setTimeout(() => { el.card.hidden = true; sp.remove(); el.fin.hidden = false; el.again.focus({ preventScroll: true }); }, G.still ? 200 : 3600);
}

export function next() {
  sound.unlock();
  if (typer.finish()) return;
  if (BEATS[G.k].end) return;
  applyBeat(G.k + 1, true);
}
export function prev() { sound.unlock(); applyBeat(G.k - 1, false); }
