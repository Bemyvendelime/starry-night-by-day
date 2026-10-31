// ✏️ 분위기 숫자 — 색, 빛 세기, 글자 속도, 소리 크기.

export const LOOK = {
  // 방
  ink: [0.87, 0.86, 0.83], // 펜 선 색 (0~1 RGB)
  monitorPower: 2.4, // 모니터 빛 세기
  monitorFlicker: 0.015, // 모니터 깜빡임 (0이면 고정)
  nightWindow: 0.1, // 밤 창빛 (별밤 열리기 전)
  starryWindow: 1.3, // 별밤이 다 열렸을 때 더해지는 창빛
  windowTint: [0.55, 0.68, 1.0], // 별밤 창빛이 펜 선에 들이는 색
  hatchLineBright: 0.72, // 펜 선 밝기

  // 그림 속 호숫가
  lake: {
    x: 60, // 호숫가 세계가 놓인 x 위치 (cameras.js 와 같이 바꿈)
    light: [60, 6.5, -10], // 하늘빛이 오는 곳
    lightPower: 2.4,
    rim: [1.0, 0.86, 0.5], // 사람 윤곽에 도는 별빛 색
    backdropWidth: 38, // 배경 그림 폭(m)
    horizon: 0.37, // 그림의 몇 % 높이가 물 위 수평선에 오는지 (낮추면 마을이 보이고, 높이면 하늘만)
    strokes: 240, // 공중을 도는 붓질 조각 수
    strokeOpacity: 0.38,
    stars: 9, // 앞쪽에 떠 있는 큰 별 수
  },

  // 물에 비친 아이
  childGlow: 0.85, // 아이 둘레의 따뜻한 빛
  waveSpeed: 7.0, // 손 흔드는 빠르기

  // 글자 찍는 속도 (밀리초)
  typing: { min: 58, jitter: 45, space: 90, punct: 320, music: 120, del: 180 },

  // 편지 접기 (초)
  fold: { first: 1.4, second: 1.2, tuck: 1.0, gap: 0.25 },

  // 소리 크기 (0~1)
  sound: { master: 0.9, keys: 0.09, hum: 0.05, pad: 0.02, pluck: 0.05, paper: 0.12 },
};
