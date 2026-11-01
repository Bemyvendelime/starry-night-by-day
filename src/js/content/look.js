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
    strokes: 0, // 공중을 도는 붓질 조각 수 (0 = 원본 그림만)
    strokeOpacity: 0.38,
    stars: 0, // 앞쪽에 떠 있는 큰 별 수 (0 = 원본 그림만)
  },

  // 사람 모델 (뼈대가 있는 glTF 하나를 복제해 씀. 바꾸면 world/people.js 가 뼈 이름을 찾아 자세를 다시 잡음)
  people: {
    model: "assets/models/person.glb", // 어른 (Quaternius 'Business Man', CC0 — 정장 차림. 이전엔 'Hoodie Character')
    childModel: "assets/models/child.glb", // 물속 아이 (Quaternius 'Hoodie Character', CC0 — 후드티 차림을 아이 비율로 줄여 씀). 비우면 어른 모델을 줄여 씀
    idleClip: "Idle_Neutral$", // 서 있는 기본 자세를 가져올 애니메이션 이름 (없으면 모델의 기본 자세)
    idleTime: 0.5,
    // 물속 아이가 손 흔드는 애니메이션 (없으면 IK 로 흔듦): 처음 up 초 동안 손을 들고, 그 뒤 up~up+loop 구간을 되풀이.
    // still = 움직임 없는 화면(캡처·동작 줄이기)에서 멈춰 둘 순간. 이 숫자들은 Quaternius Wave 클립을 재서 정함
    // out·lift = 클립보다 손을 옆으로·위로 더 뻗는 거리(m)
    wave: { clip: "[|]Wave$|^Wave$", up: 0.67, loop: 0.41, still: 0.83, speed: 0.42, out: 0.1, lift: 0.05 },
    hair: false, // 머리카락이 없는 마네킹 모델이면 true: 머리뼈에 머리카락을 붙임
    kidHair: true, // 물속 아이: 모델의 머리카락 위에 바가지 머리(이마 위에서 수평으로 자른 둥근 머리)를 씌움
    // 바가지 머리: size·lift = 크기·높이(머리뼈~정수리 거리에 대한 비율), cut = 얼마나 내려오나(0.5 = 정수리 반구), w = 폭
    // 주소에 ?kidhair=none(모델 원래 머리) 또는 ?kidhair=0.5,0.36,0.55,0.93 을 붙이면 다시 빌드하지 않고 비교, ?hairdebug 는 빨갛게
    kidHairFit: { size: 0.5, lift: 0.36, cut: 0.55, w: 0.93 },
    childArmScale: 0.78, // 아이 팔 길이·굵기 (1 = 모델 그대로, 작을수록 짧고 가늘게)
    hairFit: { size: 0.66, lift: 0.62 }, // 머리 크기에 대한 머리카락 반지름·높이 비율 (주소에 ?hairdebug 를 붙이면 빨갛게 보임)
    adultHeight: 1.72, // 어른 키(m)
    childHeight: 1.0, // 아이 키(m)
    childHeadScale: 1.4, // 아이 머리를 몸에 비해 크게
    // 물속 인물 화면: 머리에서 drop(m) 아래를 가운데로, 위아래 half(m) 만큼, tilt(라디안) 위에서 내려다봄
    waterFrame: { adult: { drop: 0.13, half: 0.36, tilt: 0.35 }, child: { drop: 0.02, half: 0.4, tilt: 0.2 } },
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
