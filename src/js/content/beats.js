// ✏️ 장면 순서표 — 위에서부터 한 장면씩 넘어갑니다. 순서를 바꾸거나 장면을 빼고 더해도 됩니다.
//
// 칸 설명
//   label    아래 막대에 보이는 장면 이름
//   cam      카메라 이름 (cameras.js)
//   line     이 장면에서 찍을 편지 줄 (letter.js 의 LINES 이름)
//   show     그 줄이 놓일 곳
//              "screen"  모니터 편지 창에만
//              "wall"    뒷벽            "side"    창 옆 벽
//              "cap"     화면 아래 자막   "capHigh" 화면 위 자막
//              "anchor"  호숫가 사람 옆
//   compose  모니터에 편지 쓰기 창을 띄움 (앞 장면들의 줄이 쌓여 보임)
//   badge    빨간 알림이 깜빡이고, 누르면 다음 장면
//   hint     손가락 안내 ("room" | "badge")
//   sky      창 속 별밤 [얼마나 열렸나 0~1, 색이 얼마나 들었나 0~1]
//   head     앉은 사람이 창을 돌아봄
//   ipad     줄이 다 찍히면 창틀의 아이패드가 별밤 배경화면으로 켜짐 (그 뒤 장면에서도 켜져 있음)
//   paint    그림이 화면을 가득 채움
//   world    "lake" 면 별이 빛나는 밤 속 호숫가
//   fold     줄이 다 찍히면 편지를 접음
//   pov      내려다본 호수 (전체 화면)
//   drop     물방울이 떨어지고 비친 모습이 손 흔드는 아이로 바뀜
//   read     편지 전문을 스크롤해서 읽는 창 (letter.js 의 LETTER); 끝의 버튼을 눌러야 다음 장면
//   end      받는 사람 카드와 보내기 버튼
//   music    타건음이 음악으로 바뀜 · chord 화음 번호 0~3
//   arc      카메라가 지나갈 때 휘는 정도 [x, y, z] (사람 머리를 피할 때)

export const BEATS = [
  { label: "어두운 방", cam: "wide", hint: "room" },
  { label: "임시보관함", cam: "screen", badge: true },
  { label: "편지", cam: "screen", compose: true, line: "l1", show: "screen" },
  { label: "편지", cam: "screen", compose: true, line: "l2", show: "screen" },
  { label: "창", cam: "window", compose: true, line: "l3", show: "side", sky: [0.5, 0.3], head: true, music: true, chord: 0, arc: [0.35, 0.18, 0.1] },
  { label: "창", cam: "window3", compose: true, line: "l4", show: "side", sky: [1, 1], head: true, ipad: true, music: true, chord: 2 },
  { label: "그림 속으로", cam: "into", sky: [1, 1], head: true, paint: true, music: true, chord: 3 },
  { label: "별밤 속", cam: "lakeBack", world: "lake", read: true, music: true, chord: 0 },
  { label: "다 읽고", cam: "lakeFold", world: "lake", fold: true, music: true, chord: 2 },
  { label: "내려다보면", cam: "lakeDown", world: "lake", line: "l5", show: "capHigh", pov: true, drop: true, music: true, chord: 1 },
  { label: "받는 사람", cam: "lakeDown", world: "lake", pov: true, end: true, music: true, chord: 0 },
];
