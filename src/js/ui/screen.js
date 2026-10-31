// 모니터 화면: 흑백 코딩 창, 빨간 알림, 편지 쓰기 창. 2D 캔버스에 그려 3D 모니터에 붙입니다.
import { S } from "../core/state.js";
import { camera } from "../core/renderer.js";
import { screenCanvas, screenTex } from "../world/room.js";
import { CODE, SCREEN } from "../content/letter.js";
import { wrap } from "../gfx/kit.js";

const SW = screenCanvas.width, SH = screenCanvas.height;
const sx = screenCanvas.getContext("2d");
const RED = "#e8322a";

function envelope(x, y, w, h, color) {
  sx.strokeStyle = color; sx.lineWidth = 2.4;
  sx.strokeRect(x, y, w, h);
  sx.beginPath(); sx.moveTo(x, y); sx.lineTo(x + w / 2, y + h * 0.6); sx.lineTo(x + w, y); sx.stroke();
}
function rr(x, y, w, h, r) { sx.beginPath(); sx.roundRect ? sx.roundRect(x, y, w, h, r) : sx.rect(x, y, w, h); }

export function drawScreen(t) {
  sx.fillStyle = "#0b0b0d"; sx.fillRect(0, 0, SW, SH);
  sx.fillStyle = "#141417"; sx.fillRect(0, 0, SW, 58);
  sx.font = '22px "Nanum Gothic Coding", ui-monospace, monospace';
  sx.fillStyle = "#6d6b67"; sx.textAlign = "center"; sx.fillText(SCREEN.file, SW / 2, 37); sx.textAlign = "left";
  envelope(26, 16, 34, 25, "#bdbab3");
  if (S.badge) {
    if (S.pulse) {
      const k = (t * 0.7) % 1;
      sx.strokeStyle = `rgba(232,50,42,${(1 - k) * 0.8})`; sx.lineWidth = 3;
      sx.beginPath(); sx.arc(66, 18, 13 + k * 26, 0, Math.PI * 2); sx.stroke();
    }
    sx.fillStyle = RED; sx.beginPath(); sx.arc(66, 18, 13, 0, Math.PI * 2); sx.fill();
    sx.fillStyle = "#fff"; sx.font = '500 17px "Jost", sans-serif'; sx.textAlign = "center"; sx.fillText("1", 66, 24); sx.textAlign = "left";
  }
  sx.font = '26px "Nanum Gothic Coding", ui-monospace, monospace';
  CODE.forEach(([line, dim], i) => {
    const y = 120 + i * 44;
    sx.fillStyle = "#3a3a3f"; sx.textAlign = "right"; sx.fillText(String(i + 1), 74, y); sx.textAlign = "left";
    sx.fillStyle = dim ? "#55534f" : "#8f8c86"; sx.fillText(line, 100, y);
  });
  if (!S.compose && Math.floor(t * 1.6) % 2 === 0) {
    const lastLine = CODE[CODE.length - 1][0];
    sx.fillStyle = "#bdbab3"; sx.fillRect(100 + sx.measureText(lastLine).width + 6, 120 + (CODE.length - 1) * 44 - 24, 13, 30);
  }
  if (S.compose) drawCompose(t);
  screenTex.needsUpdate = true;
}

function drawCompose(t) {
  const x0 = 104, y0 = 84, w = 1072, h = 690;
  sx.fillStyle = "rgba(17,17,20,0.985)"; rr(x0, y0, w, h, 14); sx.fill();
  sx.strokeStyle = "#2c2c31"; sx.lineWidth = 2; rr(x0, y0, w, h, 14); sx.stroke();
  sx.font = '400 24px "Noto Sans KR", sans-serif';
  sx.fillStyle = "#77746e"; sx.fillText(SCREEN.toLabel, x0 + 36, y0 + 54); sx.fillText(SCREEN.subjectLabel, x0 + 36, y0 + 118);
  sx.fillStyle = "#55534f"; sx.fillText(SCREEN.noSubject, x0 + 170, y0 + 118);
  sx.fillStyle = "#2a2a2e"; sx.fillRect(x0 + 24, y0 + 78, w - 48, 1.5); sx.fillRect(x0 + 24, y0 + 142, w - 48, 1.5);
  // on a tall phone the screen is small, so the letter gets bigger type and fewer rows
  const tall = camera.aspect < 0.8, fs = tall ? 58 : 40, lh = tall ? 84 : 62;
  sx.font = `400 ${fs}px "Noto Sans KR", sans-serif`;
  const rows = [];
  for (const l of S.done) rows.push(...wrap(sx, l, w - 96), "");
  rows.push(...wrap(sx, S.cur, w - 96));
  const view = rows.slice(-(tall ? 5 : 7));
  sx.fillStyle = "#e2dfd8";
  view.forEach((r, i) => sx.fillText(r, x0 + 48, y0 + 214 + i * lh));
  if (S.typing || Math.floor(t * 1.6) % 2 === 0) {
    const last = view[view.length - 1] ?? "";
    sx.fillRect(x0 + 48 + sx.measureText(last).width + 4, y0 + 214 + (view.length - 1) * lh - fs * 0.85, 3, fs * 1.1);
  }
  sx.font = '400 21px "Noto Sans KR", sans-serif';
  sx.fillStyle = "#55534f"; sx.fillText(SCREEN.saved, x0 + 36, y0 + h - 30);
  sx.strokeStyle = "#47464a"; sx.lineWidth = 2; rr(x0 + w - 150, y0 + h - 64, 112, 44, 22); sx.stroke();
  sx.fillStyle = "#77746e"; sx.textAlign = "center"; sx.fillText(SCREEN.send, x0 + w - 94, y0 + h - 34); sx.textAlign = "left";
}
