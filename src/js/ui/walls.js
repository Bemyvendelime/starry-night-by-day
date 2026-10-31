// 벽에 놓이는 글: 뒷벽(wall)과 창 옆 벽(side). 어두운 그림자를 먼저 깔고 흰 글씨를 얹어 펜 선 위에서도 읽히게 합니다.
import { wallText, sideText } from "../world/room.js";
import { wrap } from "../gfx/kit.js";

export const WALL_FONT = '400 60px "Noto Sans KR", sans-serif';

export function drawWall(tp, text, caret) {
  const { x, c } = tp;
  x.clearRect(0, 0, c.width, c.height);
  x.font = WALL_FONT;
  const lines = wrap(x, text, c.width - 90);
  x.fillStyle = "rgba(6,6,7,0.92)"; x.shadowColor = "rgba(0,0,0,1)"; x.shadowBlur = 30;
  for (let pass = 0; pass < 2; pass++) lines.forEach((l, i) => x.fillText(l, 44, 92 + i * 88));
  x.fillStyle = "#ece8e0"; x.shadowColor = "rgba(255,255,255,0.25)"; x.shadowBlur = 12;
  lines.forEach((l, i) => x.fillText(l, 44, 92 + i * 88));
  if (caret) {
    const last = lines[lines.length - 1] ?? "";
    x.fillRect(44 + x.measureText(last).width + 6, 92 + (lines.length - 1) * 88 - 50, 3, 62);
  }
  x.shadowBlur = 0;
  tp.tex.needsUpdate = true;
}

export { wallText, sideText };
