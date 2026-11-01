// No WebGL (graphics acceleration switched off): the same story as still pictures instead of a stuck loader.
// Tap or → goes on, ← goes back; the lakeside beat still opens the whole letter to scroll through.
// Pictures: assets/fallback/b<beat>.jpg (shot with ?shot, the lake one with ?shot&noread). ?flat forces this mode.
import { BEATS } from "./content/beats.js";
import { LETTER } from "./content/letter.js";

function hasGL() {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; }
}

if (!hasGL() || new URLSearchParams(location.search).has("flat")) start();

function start() {
  document.documentElement.classList.add("nogl"); // main.js sees this and stays out of the way
  document.getElementById("loader")?.classList.add("done");
  const flat = document.createElement("div");
  flat.id = "flat";
  flat.innerHTML = '<img alt=""><p class="note">이 브라우저는 그래픽 가속(WebGL)이 꺼져 있어 장면을 그림으로 보여 드려요. 화면을 누르면 다음 장면으로 넘어갑니다.</p><p class="count"></p>';
  document.body.append(flat);
  const img = flat.querySelector("img"), count = flat.querySelector(".count");
  const read = document.getElementById("read"), body = document.getElementById("readBody");
  const title = document.getElementById("readTitle"), sign = document.getElementById("readSign");
  const pic = (n) => `assets/fallback/b${n}.jpg`;
  let k = 0;
  const reading = () => !!BEATS[k].read;

  function show(n) {
    k = Math.max(0, Math.min(BEATS.length - 1, n));
    img.src = pic(k); img.alt = BEATS[k].label;
    count.textContent = `${String(k + 1).padStart(2, "0")} / ${String(BEATS.length).padStart(2, "0")} · ${BEATS[k].label}`;
    if (k + 1 < BEATS.length) new Image().src = pic(k + 1);
    flat.classList.toggle("started", k > 0);
    read.hidden = !reading(); read.classList.toggle("on", reading());
    if (reading()) {
      title.textContent = LETTER.title; title.hidden = !LETTER.title;
      sign.textContent = LETTER.sign; sign.hidden = !LETTER.sign;
      body.replaceChildren(...LETTER.paragraphs.map((t) => Object.assign(document.createElement("p"), { textContent: t })));
      read.classList.add("still"); read.classList.remove("scrolled"); read.scrollTop = 0; read.focus({ preventScroll: true });
    }
  }

  flat.addEventListener("click", () => { if (!reading()) show(k + 1); });
  document.getElementById("readDone").addEventListener("click", (e) => { e.stopPropagation(); show(k + 1); });
  read.addEventListener("scroll", () => read.classList.toggle("scrolled", read.scrollTop > 8), { passive: true });
  addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "Enter" || (!reading() && (e.key === " " || e.key === "PageDown"))) { e.preventDefault(); show(k + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); show(k - 1); }
  });
  show(0);
}
