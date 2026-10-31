# 코드 구조 (갱신 2026-11-01, v2: 뼈대 인물·소품·자동 빌드)

```
sian/
  src/                        고치는 곳. 이대로 서버에 올려도 돌아감 (ES 모듈 + import map)
    index.html                DOM 뼈대, 끝 화면·정보 창 문구, import map(three.js CDN)
    style.css                 색 토큰·글꼴·자막·카드·막대·DEV 상자
    assets/starry.jpg         별이 빛나는 밤 1024px (퍼블릭 도메인)
    assets/og.jpg             링크 미리보기 그림
    assets/models/            사람 모델(person.glb)과 출처(CREDITS.json)
    js/
      content/letter.js       ✏️ 원고: LINES(편지 줄·망설임), ENDING(카드), SCREEN·CODE(모니터), HINTS, OPENING
      content/beats.js        ✏️ 장면 순서표 BEATS (15장면)
      content/cameras.js      ✏️ 카메라 CAMERAS, 이동 시간 MOVE, 모니터 맞춤 SCREEN_FIT
      content/look.js         ✏️ 색·빛·속도·소리 숫자 LOOK
      core/renderer.js        렌더러·장면·카메라
      core/state.js           S(모니터 상태), G(진행 상태), localStorage 래퍼
      core/uniforms.js        펜 해칭이 함께 쓰는 빛 U
      core/motion.js          트윈, 카메라 리그(camFor·setCam·stepCam)
      core/typer.js           한 글자씩 찍기·지우기, finalOf
      gfx/shaders.js          GLSL: 해칭·그림·수면·붓질·별·전체 화면
      gfx/kit.js              hatch()·skyMat()·box()·limb()·headOn()·textPlane()·wrap()
      gfx/painting.js         그림 텍스처
      gfx/rig.js              뼈 이름 찾기(findBones), 2관절 IK(reach), 월드 축 회전(turn)
      world/room.js           방 전체, 모니터 캔버스, 벽 글자판
      world/lake.js           별밤 속 호숫가, 편지 자리(placeReader), 편지 접기(fold)와 손이 편지를 따라감, 붓질·별
      world/people.js         glTF 인물 불러와 복제(makePerson), 머리카락, 자세: 앉기·편지 읽기·올려다보기·손 흔들기
      ui/screen.js            모니터 화면 그리기
      ui/walls.js             벽 글씨 그리기
      ui/overlay.js           그림 확대·내려다본 호수, 물속 어른·아이를 따로 렌더(2:1 렌더 타깃)해 물에 깖
      ui/dom.js               HTML 요소, 3D 위치에 붙이기(place), 글 판
      audio/sound.js          WebAudio 합성음
      director.js             applyBeat(장면 지휘), next/prev, sendLetter
      input.js                탭·키·휠·스와이프·버튼
      dev.js                  ?dev 시점 조정 도구
      main.js                 시작·로딩·프레임 루프
  bundle.mjs                  esbuild 설정: three 본체만 CDN, 애드온(GLTFLoader 등)은 node_modules 에서 묶음
  build.py                    bundle.mjs 로 묶어 docs/index.html(배포) + build/starry-letter.html(아티팩트)
  .github/workflows/build.yml src/ 가 바뀐 푸시마다 build.py 를 돌려 docs/ 를 다시 커밋 (github.com 에서 바로 고쳐도 반영)
  notes/                      장면별 원고·배포 문서 생성기 (구글 문서로 올림)
  deploy.py                   build → git commit → push (GitHub Pages: main /docs)
  docs/                       배포본 (손으로 고치지 않음)
  pdf/                        제출용 PDF 원본·빌더
  EDITING.md                  무엇을 고치려면 어디를 여나
```

## 데이터 흐름

입력(input.js) → `next()`/`prev()` (director.js) → `applyBeat(n)` 이 `BEATS[n]` 을 읽어
카메라(motion.setCam) · 모니터 상태(S) · 벽 글자판 · 창 하늘 · 머리 돌림 · 빛(U) · 전체 화면 층(ovU) · 물방울 · 편지 접기(fold) · 소리 · 카드를 맞춤
→ `typer.run(LINES[...])` 가 한 글자씩 `showText` 로 넘겨 모니터·벽·자막 중 `show` 자리에 그림 (줄이 끝나면 `fold` 장면은 접기 시작)
→ main.js `frame()` 이 트윈·카메라·셰이더 시간·모니터 다시 그리기·안내 위치를 갱신하고 3D 장면 → 전체 화면 층 순서로 렌더.

## 실행

`python -m http.server 8000 --directory src` → http://127.0.0.1:8000/ · 장면 바로 `#beat-12` · 시점 도구 `?dev` · 로더 없이 캡처 `?shot=1`.
