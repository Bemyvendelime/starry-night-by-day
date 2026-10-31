# 수정 가이드 — 낮에도 별은 빛나니까

고치고 싶은 것 → 열 파일 → 바꿀 곳. 대부분은 `src/js/content/` 의 네 파일만 보면 됩니다.

| 고치고 싶은 것 | 파일 | 바꿀 곳 |
|---|---|---|
| 편지 문장, 망설임(지웠다 다시 쓰기) | `src/js/content/letter.js` | `LINES` 의 각 줄. `["t","글"]` 찍기, `["p",500]` 멈춤, `["d",3]` 지우기 |
| 마지막 카드(받는 사람, 제목, 보내기) | `src/js/content/letter.js` | `ENDING` |
| 모니터 코딩 창의 코드, 파일 이름 | `src/js/content/letter.js` | `CODE`, `SCREEN` |
| 손가락 안내 문구 | `src/js/content/letter.js` | `HINTS` |
| 장면 순서, 장면 추가·삭제, 어느 장면에 어느 줄 | `src/js/content/beats.js` | `BEATS` 한 줄 = 한 장면. 칸 설명은 파일 맨 위 |
| 글이 놓이는 자리(벽·자막·모니터) | `src/js/content/beats.js` | `show` 칸 |
| 창 속 별밤이 열리는 정도와 색 | `src/js/content/beats.js` | `sky: [열림, 색]` |
| 카메라 위치·화각 | `src/js/content/cameras.js` | `CAMERAS` (아래 '시점 맞추기' 참고) |
| 카메라 이동 시간 | `src/js/content/cameras.js` | `MOVE` |
| 펜 선 색·밝기, 모니터 빛, 창빛 | `src/js/content/look.js` | `ink`, `hatchLineBright`, `monitorPower`, `nightWindow`, `starryWindow` |
| 호숫가 그림 위치(마을이 보이나 하늘만 보이나) | `src/js/content/look.js` | `lake.horizon` |
| 공중을 도는 붓질 조각 수·진하기, 큰 별 수 | `src/js/content/look.js` | `lake.strokes`, `lake.strokeOpacity`, `lake.stars` |
| 아이 둘레 빛, 손 흔드는 빠르기 | `src/js/content/look.js` | `childGlow`, `waveSpeed` |
| 사람 모델 파일·키·아이 머리 크기·머리카락 | `src/js/content/look.js` | `people` (model, childModel, adultHeight, childHeight, childHeadScale, hair, hairFit) |
| 물속 아이가 손 흔드는 동작(클립 이름·손 드는 시간·되풀이 구간·멈춘 화면의 순간·손 뻗는 거리) | `src/js/content/look.js` | `people.wave` |
| 물속 사람을 비추는 화면 크기 | `src/js/content/look.js` | `people.waterFrame` |
| 창틀 아이패드가 켜지는 장면 | `src/js/content/beats.js` | `ipad: true` 를 단 장면 |
| 글자 찍는 속도 | `src/js/content/look.js` | `typing` |
| 편지 접는 속도 | `src/js/content/look.js` | `fold` |
| 소리 크기 | `src/js/content/look.js` | `sound` |
| 끝 화면 제목·이름·크레디트, 정보 창 문구 | `src/index.html` | `#fin`, `#info` |
| 색 토큰·글꼴·자막 크기 | `src/style.css` | 맨 위 `:root` |

## 장면 부품이 사는 곳 (그림을 바꿀 때)

| 부품 | 파일 |
|---|---|
| 방(책상·모니터·의자·창·벽 글자판·커튼·스탠드·화분·액자·11시 47분 시계·창틀 아이패드) | `src/js/world/room.js` |
| 사람(모델 불러오기·복제·머리카락·앉기·편지 들기·손 흔들기 자세) | `src/js/world/people.js` |
| 자세 잡기 도구(뼈 이름 찾기, 2관절 IK) | `src/js/gfx/rig.js` |
| 별밤 속 호숫가(그림 배경·호수·붓질·큰 별·편지 든 어른·편지 접기) | `src/js/world/lake.js` |
| 모니터 화면 그리기(코딩 창·빨간 알림·편지 창) | `src/js/ui/screen.js` |
| 벽에 쓰는 글씨 모양 | `src/js/ui/walls.js` |
| 그림 확대 화면, 내려다본 호수, 물속 어른·손 흔드는 아이 (3D 인물을 따로 렌더해 물에 깔기) | `src/js/ui/overlay.js` |
| 셰이더(펜 해칭·그림·수면·붓질·별·호수 화면) | `src/js/gfx/shaders.js` |
| 장면 지휘(카메라·빛·접기·카드를 언제 움직이나) | `src/js/director.js` |
| 탭·키·휠·스와이프 | `src/js/input.js` |
| 소리 | `src/js/audio/sound.js` |

사람 모델을 바꿀 때는 뼈대가 있는 glTF(.glb)를 `src/assets/models/` 에 넣고 `look.js` 의 `people.model`(어른)·`people.childModel`(물속 아이)을 바꿉니다. `people.js` 가 뼈 이름(Mixamo·Quaternius·언리얼식)을 찾아 같은 자세를 다시 잡습니다. 머리카락이 없는 마네킹 모델이면 `people.hair` 를 true 로. 출처는 `src/assets/models/CREDITS.json` 에 적습니다(제출 PDF 3쪽 크레디트가 여기서 채워짐).

지금 모델(2026-11-01 교체): 어른 = Quaternius 'Hoodie Character', 아이 = Quaternius 'Casual Character', 둘 다 CC0(퍼블릭 도메인)이라 공개 저장소에 그대로 둬도 됩니다. 처음에 쓴 three.js 예제 X Bot 은 Mixamo 모델이라 원본 파일 재배포가 막혀 있어 바꿨습니다. 아이 손 흔들기는 모델에 든 Wave 클립을 키프레임에서 바로 읽어 씁니다(AnimationMixer 는 값이 안 바뀐 뼈를 다시 쓰지 않아서, 그 위에 자세를 덧대면 멈춘 화면에서 손이 내려가 있었음).

## 시점 맞추기 (?dev)

1. 미리보기 주소 끝에 `?dev` 를 붙여 엽니다. 예: `http://127.0.0.1:8000/?dev#beat-12`
2. 왼쪽 위 DEV 상자에서 장면을 고르고 '자유 시점'을 켭니다. 끌면 돌고, 휠은 확대, 오른쪽 버튼으로 끌면 이동.
3. 마음에 들면 '이 시점 복사' → 나온 한 줄을 `cameras.js` 의 같은 이름 줄과 바꿉니다.

## 미리 보기, 만들기, 올리기

```
cd projects/jisikhyangyeon/sian
python -m http.server 8000 --directory src    # 고치면서 바로 보기: http://127.0.0.1:8000/  (만들기 없이 돌아감)
python build.py                               # 한 파일로 묶기 → docs/index.html, build/starry-letter.html
python deploy.py "무엇을 고쳤는지"             # 만들고 GitHub 에 올리기 → 1~2분 뒤 공개 주소에 반영
```

PC 없이도 고칠 수 있습니다. github.com 의 저장소에서 `src/js/content/letter.js` 를 열고 연필 버튼으로 문장을 고친 뒤 Commit 하면, GitHub Actions(`.github/workflows/build.yml`)가 자동으로 묶어서 1~3분 뒤 공개 주소에 반영합니다. 저장소의 Actions 탭에서 build 가 초록이면 끝, 빨강이면 문법(쉼표·따옴표)이 틀린 것입니다.

- 공개 주소: https://bemyvendelime.github.io/starry-night-by-day/
- 장면 바로 열기: 주소 끝에 `#beat-12` (0부터 셈)
- 움직임 줄이기·소리 끔은 화면 아래 막대에서. 브라우저에 기억됩니다.
