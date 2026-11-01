// Taps, keys, wheel, swipes (thresholds from Every Joule: swipe 70px in 350ms, wheel 90 with a 300ms lock).
import * as THREE from "three";
import { canvas, camera } from "./core/renderer.js";
import { G, store } from "./core/state.js";
import { sound } from "./audio/sound.js";
import { screenMesh, BADGE_UV } from "./world/room.js";
import { HINTS } from "./content/letter.js";
import { el } from "./ui/dom.js";
import { next, prev, applyBeat, sendLetter, LAKE_AT } from "./director.js";
import { BEATS } from "./content/beats.js";

export const par = { x: 0, y: 0, tx: 0, ty: 0 }; // mouse parallax
const reading = () => !!BEATS[G.k]?.read; // the letter panel is open: the reader sets the pace

export function initInput() {
  const ray = new THREE.Raycaster();
  let down = null;
  canvas.addEventListener("pointerdown", (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; sound.unlock(); });
  canvas.addEventListener("pointerup", (e) => {
    if (!down || G.freeCam || reading()) { down = null; return; }
    const dx = e.clientX - down.x, dy = e.clientY - down.y, dt = performance.now() - down.t;
    down = null;
    if (dt < 350 && Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy)) { dx < 0 ? next() : prev(); return; }
    if (Math.hypot(dx, dy) > 10) return;
    if (G.k === 1) { // the red badge has to be pressed; after two misses it opens anyway
      const r = canvas.getBoundingClientRect();
      ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
      const hit = ray.intersectObject(screenMesh)[0];
      if (hit && hit.uv.x < BADGE_UV.hitU && hit.uv.y > BADGE_UV.hitV) return next();
      if (++G.badgeMisses < 2) { el.hintTxt.textContent = HINTS.badgeMiss; return; }
    }
    next();
  });
  let wheelSum = 0, wheelLock = false, wheelTimer = 0;
  addEventListener("wheel", (e) => {
    if (G.freeCam || reading() || e.target.closest?.(".bar, .card, .info, .fin, .dev, .read")) return;
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => { wheelSum = 0; wheelLock = false; }, 300);
    if (wheelLock) return;
    wheelSum += Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(wheelSum) > 90) { wheelSum > 0 ? next() : prev(); wheelSum = 0; wheelLock = true; }
  }, { passive: true });
  addEventListener("keydown", (e) => {
    if (e.target.closest?.("button, input, textarea, select") && (e.key === " " || e.key === "Enter")) return;
    if (reading() && [" ", "PageDown", "PageUp", "ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
      if (!el.read.contains(document.activeElement)) { // focus left the panel (a tap on the lake): scroll it by hand
        e.preventDefault();
        const h = el.read.clientHeight * 0.85, d = { " ": h, PageDown: h, PageUp: -h, ArrowDown: 60, ArrowUp: -60, Home: -1e6, End: 1e6 }[e.key];
        el.read.scrollBy({ top: e.shiftKey && e.key === " " ? -d : d, behavior: G.still ? "auto" : "smooth" });
      }
      return; // inside the panel the browser scrolls it natively
    }
    if (["ArrowRight", "PageDown", " ", "Enter"].includes(e.key)) { e.preventDefault(); next(); }
    if (["ArrowLeft", "PageUp"].includes(e.key)) { e.preventDefault(); prev(); }
    if (e.key === "Escape") { el.info.hidden = true; el.infoBtn.setAttribute("aria-expanded", "false"); }
  });
  addEventListener("pointermove", (e) => {
    if (e.pointerType === "mouse") { par.tx = (e.clientX / innerWidth) * 2 - 1; par.ty = (e.clientY / innerHeight) * 2 - 1; }
  });

  el.readDone.addEventListener("click", next);
  el.read.addEventListener("scroll", () => el.read.classList.toggle("scrolled", el.read.scrollTop > 8), { passive: true });
  el.next.addEventListener("click", next);
  el.prev.addEventListener("click", prev);
  el.send.addEventListener("click", sendLetter);
  el.again.addEventListener("click", () => applyBeat(0, false));
  el.replay.addEventListener("click", () => applyBeat(LAKE_AT, true));
  el.snd.setAttribute("aria-pressed", String(sound.on));
  el.still.setAttribute("aria-pressed", String(G.still));
  el.snd.addEventListener("click", () => { sound.unlock(); sound.setOn(!sound.on); el.snd.setAttribute("aria-pressed", String(sound.on)); });
  el.still.addEventListener("click", () => { G.still = !G.still; store.set("byeolbam:still", G.still ? "1" : "0"); el.still.setAttribute("aria-pressed", String(G.still)); });
  el.infoBtn.addEventListener("click", () => { el.info.hidden = !el.info.hidden; el.infoBtn.setAttribute("aria-expanded", String(!el.info.hidden)); });
}
