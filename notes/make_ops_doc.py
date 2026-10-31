"""Write notes/배포운영.html: where everything lives, how the site is built and published, how to edit it,
what to check before submitting. Uploaded to Google Drive as a Google Doc.

  python notes/make_ops_doc.py
"""
import html
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
E = html.escape
CREDITS = json.loads((ROOT / "src" / "assets" / "models" / "CREDITS.json").read_text(encoding="utf-8")) \
    if (ROOT / "src" / "assets" / "models" / "CREDITS.json").exists() else []

SITE = "https://bemyvendelime.github.io/starry-night-by-day/"
REPO = "https://github.com/Bemyvendelime/starry-night-by-day"
TH = 'style="background:#efece6;text-align:left;padding:4pt"'
TD = 'style="vertical-align:top;padding:4pt"'


def table(head, rows):
    h = "".join(f"<th {TH}>{E(x)}</th>" for x in head)
    body = "".join("<tr>" + "".join(f"<td {TD}>{c}</td>" for c in r) + "</tr>" for r in rows)
    return f'<table border="1" style="border-collapse:collapse;width:100%"><tr>{h}</tr>{body}</table>'


def a(href, text=None):
    return f'<a href="{E(href)}">{E(text or href)}</a>'


out = ["<h1>낮에도 별은 빛나니까 · 배포와 운영</h1>"]
out.append(f"<p>작품은 GitHub Pages에 공개돼 있고, 누구나 {a(SITE, 'bemyvendelime.github.io/starry-night-by-day')} 에서 열 수 있습니다. "
           "문장이나 장면을 고치면 GitHub에 올리는 것만으로 1~2분 뒤 같은 주소에 반영됩니다. 이 문서는 무엇이 어디에 있고, 어떻게 고치고 올리는지, 제출 전에 무엇을 확인할지를 모았습니다.</p>")

out.append("<h2>제출 요강과 메일</h2>")
out.append("<p>신세계 지식향연 공식 홈페이지의 2026 「1차 미션 | CREATIVE 에세이」 요강 이미지에서 확인한 내용입니다(" + a("https://www.ssghero.com/user/knowledge/KnowledgeUserMissionOneView.do?_menu=306", "요강 페이지") + ", " + a("https://www.ssghero.com/assets/images/hero/2026/mission_01.png", "요강 이미지") + ").</p>")
out.append(table(["항목", "요강", "이 작품에서"], [
    ["과제", "키워드(빛·예술·인식·시선) 중 하나를 골라 자신만의 시각으로 해석과 답을 제시. 형식은 자유", "키워드 '빛'(제목 「낮에도 별은 빛나니까」). '시선'으로 바꾸려면 PDF 1·2쪽 한 단어씩"],
    ["형식", "프레젠테이션 과제를 원하는 형태의 창작물로: 영상·기획서·에세이·기타 창작물", "기타 창작물(인터랙티브 웹) + 설명 PDF"],
    ["제출", "운영국 이메일 hellossghero@gmail.com 개별 제출. 링크 칸은 따로 없음", "PDF 첨부 + 본문에 작품 주소"],
    ["파일명(필수)", "도전자 이름(지식향연 홈페이지 ID)_프레젠테이션 제목.확장자 · 예) 홍길동(honggildong)_Freedom Beyond.pptx", "허대훈(아이디)_낮에도 별은 빛나니까.pdf → '아이디'를 홈페이지 ID로 바꿔야 함"],
    ["마감", "2026. 11. 1 (일) 23:59, 시한 내 접수분만 평가", "오늘 밤"],
    ["평가(1차)", "문제의식 및 결론, 독창성 및 완결성", "PDF 2쪽에 문제의식·결론을 따로 둠"],
    ["용량", "명시 없음. Gmail 은 25MB 넘는 첨부를 드라이브 링크로 바꿈", "PDF 약 3~4MB"],
    ["다음 일정", "1차 발표 11.17(화) · 2차 남산 콘테스트 11.25~27 · 최종 12.18 · 그랜드투어 2027.1.25~2.3", ""],
]))
out.append("<p><b>보낼 메일(초안)</b></p>")
out.append("<p>받는 사람: hellossghero@gmail.com<br>제목: [1차 미션] 허대훈(아이디)_낮에도 별은 빛나니까<br>첨부: 허대훈(아이디)_낮에도 별은 빛나니까.pdf</p>")
out.append("<p>안녕하세요. 지식향연 2026 1차 미션 과제를 제출합니다.<br>이름: 허대훈 / 홈페이지 ID: (아이디) / 소속: (학교·학과)<br>키워드: 빛 / 형식: 기타 창작물(인터랙티브 웹 작품)<br>"
           "작품 주소: " + SITE + "<br>첨부한 PDF에 작품 설명과 링크·QR을 담았습니다. PC 크롬에서 소리를 켜고 화면을 눌러 감상해 주세요(15장면, 약 3~4분).<br>감사합니다.</p>")

out.append("<h2>어디에 무엇이 있나</h2>")
out.append(table(["무엇", "어디", "메모"], [
    ["공개 작품", a(SITE), "제출에 쓰는 주소. 휴대폰에서도 열림"],
    ["코드 저장소", a(REPO), "공개 저장소. 고치는 곳은 src/js/content/"],
    ["로컬 폴더", "C:\\Users\\hdh59\\projects\\jisikhyangyeon\\sian", "같은 저장소의 내 PC 사본"],
    ["제출 PDF", "드라이브 projects/jisikhyangyeon/제출/허대훈(아이디)_낮에도 별은 빛나니까.pdf", "A4 3쪽: 표지·키워드·링크·QR / 키워드 해석·문제의식·결론 / 장면·인상주의·만든 방법. '아이디'를 실제 ID로"],
    ["장면별 원고", a("https://docs.google.com/document/d/1FNBjfcaMQIItvKdO7fQRk7hmPy7rwWRnZE_z0Jx1Bgw/edit", "장면별 원고 (구글 문서)"), "구간마다 내 멘트·발표 멘트를 쓰는 표"],
    ["레퍼런스 모음", a("https://claude.ai/artifact/HoXxXhDDkyyvnsudKD16Qi", "레퍼런스 갤러리 52") + " · 드라이브 projects/jisikhyangyeon/레퍼런스/", "실제로 열리는 비슷한 작품들과 공모 요강"],
    ["비공개 미리보기", a("https://claude.ai/artifact/FVzwqmRJAb839TsTL6mEiT"), "claude.ai 아티팩트. 본인만 열림, 제출용 아님"],
    ["기획 페이지", a("https://claude.ai/artifact/MYSz6xrvRMyMAPNtHmK4yk"), "기획·검증·제출 탭"],
]))

out.append("<h2>어떻게 만들어지나</h2>")
out.append("<p>고치는 원본은 src/ 폴더입니다. src/ 는 그대로도 돌아가는 웹 페이지(ES 모듈)라서, 고치면서 바로 볼 수 있습니다. "
           "build.py 가 이것을 한 파일로 묶어 docs/index.html 을 만들고, GitHub Pages 는 저장소의 main 가지 docs/ 폴더를 그대로 공개합니다. "
           "three.js 본체는 CDN(jsdelivr)에서 받고, 3D 모델과 그림은 docs/assets/ 에 같이 올라갑니다.</p>")
out.append(table(["단계", "하는 일", "도구"], [
    ["1. 원본", "src/js/content/ 의 원고·장면·카메라·분위기 파일, src/js/world·ui·gfx 의 부품", "아무 편집기, 또는 github.com 의 연필 버튼"],
    ["2. 묶기", "src → docs/index.html (+ docs/assets), 아티팩트용 build/starry-letter.html", "python build.py (esbuild, node 필요)"],
    ["3. 올리기", "커밋하고 GitHub 에 푸시", "python deploy.py \"고친 내용\""],
    ["4. 자동 빌드", "src/ 가 바뀐 푸시가 오면 GitHub Actions 가 build.py 를 돌려 docs/ 를 다시 커밋", ".github/workflows/build.yml"],
    ["5. 공개", "GitHub Pages 가 docs/ 를 공개 주소로 내보냄", "1~2분 걸림"],
]))

out.append("<h2>고치는 세 가지 방법</h2>")
out.append(table(["방법", "순서", "언제 좋은가"], [
    ["Claude 에게 말하기", "'7장면 문장을 ○○로 바꿔 줘' 처럼 말하면 Claude 가 고치고, 확인하고, 올립니다.", "제일 쉬움. 여러 곳을 한 번에 바꿀 때"],
    ["github.com 에서 바로", f"{a(REPO)} → src/js/content/letter.js → 연필 버튼 → 문장 수정 → Commit changes. Actions 가 자동으로 빌드해 1~3분 뒤 반영.", "휴대폰·맥북 어디서든, 문장 몇 개만 바꿀 때"],
    ["내 PC 에서", "편집 → python -m http.server 8000 --directory src 로 미리 보기(http://127.0.0.1:8000/) → python deploy.py \"고친 내용\"", "카메라·색 같은 걸 보면서 맞출 때"],
]))
out.append("<p>어느 파일의 어느 칸을 고치는지는 저장소의 EDITING.md(드라이브 sian/수정가이드-EDITING.md)에 표로 있습니다. 카메라 시점은 주소 끝에 ?dev 를 붙여 자유 시점으로 맞춘 뒤 '이 시점 복사'로 한 줄을 받아 cameras.js 에 붙입니다. 장면 하나를 바로 열려면 주소 끝에 #beat-번호(0부터)를 붙입니다.</p>")

out.append("<h2>제출 PDF</h2>")
out.append("<p>sian/pdf/submission.html 이 원본이고, python pdf/make_pdf.py 로 다시 뽑습니다. 1쪽은 표지·키워드·링크·QR·감상 방법, 2쪽은 키워드 해석·문제의식·결론·작품 소개, 3쪽은 장면 6컷·인상주의와 잇는 세 가지·만든 방법입니다. 파일 이름은 요강 규칙대로 '이름(홈페이지 ID)_제목'이고, make_pdf.py 의 out 줄에서 아이디를 바꿉니다. "
           "장면 사진은 pdf/img/ 에 있고, 바꾸려면 주소에 ?shot=1#beat-번호 를 붙여 연 화면(아래 막대 없음)을 캡처해 같은 이름으로 넣습니다. QR 은 공개 주소를 가리킵니다.</p>")

out.append("<h2>라이선스와 출처</h2>")
rows = [
    ["그림", "빈센트 반 고흐, 「별이 빛나는 밤」(1889), 뉴욕 현대미술관 소장", "퍼블릭 도메인 이미지(Google Art Project, Wikimedia Commons)"],
    ["three.js", "3D 엔진 r160", "MIT"],
    ["글꼴", "Noto Sans KR, Gaegu, Nanum Gothic Coding, Jost, Bebas Neue (Google Fonts)", "SIL Open Font License"],
]
for c in CREDITS:
    rows.append([E(c["what"]), E(c["name"]) + " · " + a(c["url"], c["author"]), E(c["license"])])
rows.append(["코드·원고", "허대훈 (Claude 와 함께 작성)", "저장소 공개, 별도 라이선스 표기 없음"])
out.append(table(["무엇", "출처", "라이선스"], rows))

out.append("<h2>공개 범위와 비용</h2>")
out.append("<p>무료 GitHub 계정의 Pages 는 공개 저장소에서만 켜지므로 코드와 편지 원문도 공개입니다. 원문을 숨기고 싶으면 저장소를 비공개로 바꾸고 Netlify·Cloudflare Pages·Vercel 같은 무료 호스팅으로 옮기면 됩니다(주소가 바뀌니 PDF 의 링크와 QR 도 다시 뽑아야 함). 지금 구성의 비용은 0원입니다.</p>")

out.append("<h2>문제가 생기면</h2>")
out.append(table(["증상", "원인", "할 일"], [
    ["화면이 검게만 나옴", "브라우저나 기기에서 WebGL 이 꺼져 있음, 아주 오래된 기기", "PC 크롬 최신판으로 열기. 크롬 설정의 '하드웨어 가속' 켜기"],
    ["소리가 안 남", "브라우저는 화면을 한 번 누른 뒤에만 소리를 냄, 휴대폰 무음 모드", "한 번 누르기, 아래 막대의 스피커 버튼 확인, 무음 해제"],
    ["고쳤는데 그대로", "Pages 반영에 1~2분, 브라우저 캐시", f"저장소의 Actions 탭에서 build 가 초록인지 확인 → 강력 새로고침(Ctrl+Shift+R)"],
    ["Actions 가 빨강", "src 의 문법 오류(쉼표·따옴표 빠짐)", "Actions 의 오류 줄을 보고 그 파일을 고치거나 Claude 에게 오류를 붙여 주기"],
    ["폰에서 버벅임", "오래된 폰의 그래픽 성능", "아래 막대의 '움직임 줄이기' 켜기"],
    ["카톡 미리보기가 옛것", "카카오 링크 미리보기 캐시", "주소 끝에 ?v=2 처럼 붙여 보내기"],
]))

out.append("<h2>제출 전 점검</h2>")
out.append(table(["확인", "방법", "상태"], [
    ["PC 에서 처음부터 끝까지", "크롬으로 공개 주소를 열고 소리 켜고 15장면 끝까지, 마지막 보내기까지", "TODO: 직접 확인"],
    ["휴대폰에서 QR", "PDF 1쪽 QR 을 폰 카메라로 비춰 열리는지", "TODO: 직접 확인"],
    ["PDF 링크", "PDF 를 열어 링크를 눌러 열리는지", "TODO: 직접 확인"],
    ["파일명·메일", "PDF 이름의 '아이디'를 지식향연 홈페이지 ID로 바꾸고, 위 메일 초안으로 hellossghero@gmail.com 에 보내기", "TODO: 홈페이지 ID 필요"],
    ["마감", "2026. 11. 1 (일) 23:59", "오늘 밤"],
    ["문장 최종본", "장면별 원고 문서의 내 멘트 반영", "TODO"],
]))
doc = "<html><head><meta charset=\"utf-8\"></head><body>" + "\n".join(out) + "</body></html>"
target = ROOT / "notes" / "배포운영.html"
target.write_text(doc, encoding="utf-8")
print(target, len(doc))
