// Typing with hesitation. ops: ["t", text] type · ["p", ms] pause · ["d", n] delete n characters.
import { LOOK } from "../content/look.js";
import { sound } from "../audio/sound.js";

export const finalOf = (ops) => {
  let s = "";
  for (const [o, v] of ops) { if (o === "t") s += v; else if (o === "d") s = s.slice(0, -v); }
  return s;
};

const T = LOOK.typing;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export const typer = {
  token: 0, busy: false, ops: null, out: null,
  async run(ops, out, music) {
    const my = ++this.token;
    this.busy = true; this.ops = ops; this.out = out;
    const alive = () => my === this.token;
    let s = "";
    for (const [o, v] of ops) {
      if (!alive()) return;
      if (o === "p") await wait(v);
      else if (o === "t") {
        for (const ch of v) {
          if (!alive()) return;
          s += ch; out(s, false); sound.key(ch, music);
          await wait(music ? T.music : ch === " " ? T.space : /[,.?!]/.test(ch) ? T.punct : T.min + Math.random() * T.jitter);
        }
      } else if (o === "d") {
        for (let i = 0; i < v; i++) { if (!alive()) return; await wait(T.del); s = s.slice(0, -1); out(s, false); sound.back(); }
        await wait(260);
      }
    }
    if (alive()) { this.busy = false; out(s, true); }
  },
  // a tap while typing shows the whole line at once
  finish() { if (!this.busy) return false; this.token++; this.busy = false; this.out(finalOf(this.ops), true); return true; },
  cancel() { this.token++; this.busy = false; },
};
