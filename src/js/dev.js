// 시점 조정 도구: 주소 끝에 ?dev 를 붙이면 열립니다.
// '자유 시점'을 켜고 끌어서 둘러본 뒤 '이 시점 복사'를 누르면 cameras.js 에 붙여 넣을 한 줄이 나옵니다.
import { camera, canvas } from "./core/renderer.js";
import { G } from "./core/state.js";
import { rig } from "./core/motion.js";
import { BEATS } from "./content/beats.js";
import { applyBeat } from "./director.js";

let controls = null, readout = null, out = null;
const r2 = (v) => Math.round(v * 100) / 100;

export async function initDev() {
  if (!new URLSearchParams(location.search).has("dev")) return;
  const { OrbitControls } = await import("three/addons/controls/OrbitControls.js");
  controls = new OrbitControls(camera, canvas);
  controls.enabled = false;
  controls.enableDamping = true;

  const box = document.createElement("div");
  box.className = "dev";
  box.innerHTML = `
    <b>DEV</b>
    <label>장면 <select id="devBeat">${BEATS.map((b, i) => `<option value="${i}">${String(i + 1).padStart(2, "0")} ${b.label} · ${b.cam}</option>`).join("")}</select></label>
    <label><input type="checkbox" id="devFree"> 자유 시점 (끌어서 돌리기, 휠 확대, 오른쪽 끌기 이동)</label>
    <div id="devRead"></div>
    <button type="button" id="devCopy">이 시점 복사</button>
    <textarea id="devOut" rows="2" readonly></textarea>`;
  document.body.appendChild(box);
  readout = box.querySelector("#devRead");
  out = box.querySelector("#devOut");
  const sel = box.querySelector("#devBeat");
  sel.addEventListener("change", () => applyBeat(Number(sel.value), false));
  box.querySelector("#devFree").addEventListener("change", (e) => {
    G.freeCam = e.target.checked;
    controls.enabled = G.freeCam;
    if (G.freeCam) { camera.position.copy(rig.p); controls.target.copy(rig.t); controls.update(); }
  });
  box.querySelector("#devCopy").addEventListener("click", async () => {
    const p = G.freeCam ? camera.position : rig.p, t = G.freeCam ? controls.target : rig.t;
    const line = `${rig.key}: { p: [${r2(p.x)}, ${r2(p.y)}, ${r2(p.z)}], t: [${r2(t.x)}, ${r2(t.y)}, ${r2(t.z)}], fov: ${Math.round(camera.fov)} },`;
    out.value = line; out.select();
    try { await navigator.clipboard.writeText(line); } catch {}
  });
}

export function devFrame() {
  if (!controls) return false;
  const sel = document.getElementById("devBeat");
  if (sel && Number(sel.value) !== G.k) sel.value = String(G.k);
  const p = camera.position;
  readout.textContent = `${rig.key} · p ${r2(p.x)}, ${r2(p.y)}, ${r2(p.z)} · fov ${Math.round(camera.fov)}`;
  if (G.freeCam) { controls.update(); return true; }
  return false;
}
