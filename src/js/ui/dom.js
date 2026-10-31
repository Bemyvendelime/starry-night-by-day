// HTML around the canvas: captions, the hint, the last card, the bar, the loader, the text version.
import * as THREE from "three";
import { camera } from "../core/renderer.js";

const $ = (s) => document.querySelector(s);
export const el = {
  cap: $("#cap"), anchor: $("#anchor"), hint: $("#hint"), hintTxt: $("#hint .txt"),
  card: $("#card"), to: $("#to"), subj: $("#subj"), note: $("#cardNote"), footer: $("#cardFooter"), send: $("#send"),
  fin: $("#fin"), again: $("#again"), replay: $("#replay"),
  bar: $("#bar"), num: $("#num"), lab: $("#lab"), prev: $("#prev"), next: $("#next"), snd: $("#snd"), still: $("#still"),
  info: $("#info"), infoBtn: $("#infoBtn"), loader: $("#loader"), a11y: $("#a11y"), live: $("#live"), grain: $("#grain"),
};

// put an HTML element on top of a point in the 3D world
const tmp = new THREE.Vector3();
export function place(node, world, dx, dy) {
  tmp.copy(world).project(camera);
  const ok = tmp.z < 1 && Math.abs(tmp.x) < 1.2 && Math.abs(tmp.y) < 1.2;
  node.style.transform = ok ? `translate(${((tmp.x + 1) / 2) * innerWidth + dx}px, ${((1 - tmp.y) / 2) * innerHeight + dy}px)` : "translate(-9999px,0)";
}

export const setLoader = (p) => el.loader.style.setProperty("--p", p);

export function makeGrain() {
  const g = document.createElement("canvas"); g.width = g.height = 160;
  const gx = g.getContext("2d"), gd = gx.createImageData(160, 160);
  for (let i = 0; i < gd.data.length; i += 4) { const v = Math.random() * 255; gd.data[i] = gd.data[i + 1] = gd.data[i + 2] = v; gd.data[i + 3] = 255; }
  gx.putImageData(gd, 0, 0);
  el.grain.style.backgroundImage = `url(${g.toDataURL()})`;
}

// the whole letter as plain text, for screen readers
export function fillA11y({ BEATS, LINES, ENDING, OPENING, finalOf }) {
  const esc = (s) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
  let h = `<h1>${esc(ENDING.subject)}</h1><p>${esc(OPENING)}</p><ol>`;
  for (const b of BEATS) if (b.line) h += `<li>${esc(finalOf(LINES[b.line]))}</li>`;
  h += `</ol><p>받는 사람: ${esc(ENDING.to)}</p>`;
  el.a11y.innerHTML = h;
}
