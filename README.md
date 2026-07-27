# CC 배너 제너레이터

구글 시트(ProductMaster / TemplateMaster / HeroMaster / ColorMaster) 데이터로
**상세페이지 · 썸네일(1080²) · 인스타 피드(1080×1350)** 배너를 브라우저에서 바로 렌더링하고
PNG(ZIP)로 내려받는 사내 도구입니다.

빌드 도구·서버·npm 설치가 **필요 없습니다.** 파일을 그대로 올리면 동작하는 정적 사이트입니다.

---

## 1. 폴더 구조

```
.
├─ index.html            ← 화면 마크업 + 로드 순서만 (13KB)
├─ api/
│  ├─ sheet.js           ← 비공개 구글 시트 → CSV (서비스 계정)
│  └─ img.js             ← 외부 이미지 중계 (같은 출처 + 캐시)
├─ vercel.json           ← 캐시·보안 헤더
├─ robots.txt            ← 검색엔진 색인 차단 (사내용)
├─ assets/
│  ├─ high-summit.woff2  ← 히어로 영문 서체 (자체 호스팅)
│  └─ logo.png           ← dear.cus 로고
├─ styles/               ← 캐스케이드 순서대로 로드
│  ├─ 01-tokens.css        색 변수 · @font-face · 기본 리셋
│  ├─ 02-layout.css        3단 레이아웃 · 헤더 · 리사이저 · 블록
│  ├─ 03-controls.css      인풋 · 세그먼트 · 탭 · 스와치
│  ├─ 04-panels.css        제품군/템플릿/컬러/히어로/가격카드 패널
│  └─ 05-stage.css         미리보기 무대 · 버튼 · 경고 · 이력
└─ scripts/              ← 번호 순서 = 실행 순서
   ├─ 01-sheet-schema.js       시트 스키마 · CSV 파서 · 오류코드 · buildGroups
   ├─ 02-design-tokens.js      캔버스 규격 상수 · THEMES · OPT · LOGO
   ├─ 03-sample-data.js        내장 샘플 데이터(GROUPS)
   ├─ 04-template-meta.js      템플릿 ID ↔ 패밀리/테마 매핑
   ├─ 05-state-utils.js        state · 포맷 유틸 · 이미지 로더(프록시 포함)
   ├─ 06-config-store.js       배포 기본값(PRESET) · localStorage 접속설정
   ├─ 07-sheet-sync.js         시트 불러오기 · 오류 표시 · 데이터소스 UI
   ├─ 08-panel-ui.js           CORS 진단 · 편집 패널 폭 조절 · 상단 바인딩
   ├─ 09-hero-color.js         히어로 이미지 라이브러리 · 컬러 선택
   ├─ 10-group-template-ui.js  제품군/템플릿/테마 선택 UI
   ├─ 11-rows-picker.js        가격 카드 편집 · 제품 선택 패널
   ├─ 12-render-nuvola.js      누볼라 패밀리 렌더러 (상세·썸네일·피드 전부)
   ├─ 13-render-core.js        draw() · 포맷 전환 · 미리보기
   ├─ 14-render-hero.js        기본 패밀리 히어로 01 / 02
   ├─ 15-render-thumb-feed.js  썸네일 · 피드 슬라이드 렌더러
   ├─ 16-render-cards.js       옵션 카드 렌더 · 줄바꿈/높이 계산
   ├─ 17-canvas-helpers.js     trk · cover · roundRect 등 캔버스 헬퍼
   ├─ 18-validate.js           경고/검증 패널
   ├─ 19-export.js             PNG 렌더 · ZIP 다운로드 (JSZip 지연 로드)
   ├─ 20-history-share.js      생성 이력 · 공유 코드
   └─ 21-bindings-boot.js      입력 바인딩 · boot()
```

### 어디를 고쳐야 하나

| 하고 싶은 일 | 열 파일 |
| --- | --- |
| 시트 컬럼 추가/이름 변경 | `scripts/01-sheet-schema.js` |
| 배포 기본 시트·프록시 URL 교체 | `scripts/06-config-store.js` 의 `PRESET` |
| 색상 테마 추가 | `scripts/02-design-tokens.js` 의 `THEMES` |
| 배너 그림이 잘못 나옴 (누볼라) | `scripts/12-render-nuvola.js` |
| 배너 그림이 잘못 나옴 (기본 01/02) | `scripts/14-render-hero.js`, `16-render-cards.js` |
| 화면 색·여백 | `styles/01-tokens.css` (변수) |

---

## 2. 중요 — 스크립트 순서를 바꾸지 마세요

`scripts/*.js` 는 **모듈이 아니라 일반 스크립트**입니다.
전역 스코프를 그대로 공유하기 때문에 원본 단일 파일과 동작이 완전히 같지만,
`index.html` 의 `<script defer>` **순서가 곧 실행 순서**입니다.

- 파일을 새로 추가하면 → `index.html` 아래쪽 스크립트 목록에도 추가해야 합니다.
- 번호 순서를 섞으면 초기화가 깨집니다.
- `type="module"` 로 바꾸면 전역 공유가 끊겨 전부 깨집니다.

---

## 2.5 서버 함수와 환경변수

| 환경변수 | 필수 | 용도 |
| --- | --- | --- |
| `GOOGLE_SA` | ✅ | 서비스 계정 JSON 전체 (base64 도 인식) |
| `SHEET_ID` | ✅ | 시트 주소의 `/d/` 와 `/edit` 사이 문자열 |
| `IMG_HOSTS` | 선택 | 이미지 중계를 허용할 도메인. 예 `cafe24.com,dearcus.com`. 비우면 전체 허용 |

환경변수를 바꾸면 **재배포해야 반영**됩니다.

직접 열어서 확인할 수 있습니다:

```
/api/sheet?tab=ProductMaster        → CSV 텍스트
/api/img?u=<이미지주소 URL인코딩>      → 이미지
```

실패하면 화면에 한글로 원인이 표시됩니다.

## 3. Vercel 배포

빌드가 없으므로 설정할 게 거의 없습니다.

1. 이 폴더의 내용을 GitHub 저장소 **루트**에 올립니다.
   (`index.html` 이 저장소 최상단에 보여야 합니다. 폴더 안에 한 겹 더 들어가면 안 됩니다.)
2. [vercel.com](https://vercel.com) → **Add New… → Project** → 해당 저장소 **Import**
3. 설정 화면에서
   - **Framework Preset:** `Other`
   - **Build Command:** 비움
   - **Output Directory:** 비움 (또는 `.`)
   - **Root Directory:** `./` — 저장소 안에 폴더가 한 겹 더 있다면 그 폴더를 지정
4. **Deploy** → 30초쯤 뒤 `https://프로젝트명.vercel.app` 발급

이후에는 GitHub 에 커밋할 때마다 자동 재배포됩니다. (main 브랜치 → 운영, 다른 브랜치 → 미리보기 URL)

### 배포 후 첫 확인

- 화면 우상단이 **"준비됨"** 으로 바뀌는지
- **⚙ 데이터 소스** 를 열어 시트가 자동으로 불러와지는지
  (`06-config-store.js` 의 `PRESET` 에 게시 CSV URL 이 들어 있어 자동 로드됩니다)
- **전체 다운로드(ZIP)** 가 되는지

### 도메인이 바뀌면 생기는 일

접속 설정(시트 URL·프록시 URL)은 **도메인별로** 브라우저에 저장됩니다.
`github.io` → `vercel.app` 으로 옮기면 저장된 값이 안 보입니다.
다만 코드에 `PRESET` 기본값이 있어 **처음 열어도 자동으로 시트를 불러옵니다.**

---

## 4. 이번 최적화에서 바뀐 것

| 항목 | 이전 | 이후 |
| --- | --- | --- |
| 파일 구성 | `index.html` 1개 (320KB, 6,786줄) | HTML 13KB + CSS 5 + JS 21 + 에셋 2 |
| 첫 화면 HTML 전송량 | 320KB (매번 전부) | 13KB |
| High Summit 폰트 | HTML 안에 base64 (50KB, 매번 재다운로드) | `.woff2` 37KB, **1년 캐시** |
| 로고 | JS 안에 base64 16KB | `logo.png` 12KB, **1년 캐시** |
| JSZip 94KB | 첫 화면에서 **동기 로드(파싱 차단)** | 다운로드 버튼 누를 때만 로드 |
| 한 줄 수정 시 재다운로드 | 320KB 전부 | 해당 파일만 |

렌더링 코드는 **한 글자도 바꾸지 않았습니다.** 캔버스 드로잉 4,786개 명령과
화면 DOM 을 원본과 비교해 완전히 동일함을 확인했습니다.

---

## 5. 알려진 제약

- 이미지 서버(카페24 EC 등)가 CORS 를 안 열어주면 Apps Script 프록시를 거쳐야 합니다.
  좌측 **⚙ 데이터 소스 → 이미지 프록시 URL** 에 설정합니다.
- Pretendard · Playfair Display · GmarketSans 는 외부 CDN 에서 받아옵니다. 오프라인이면 대체 서체로 표시됩니다.
- 저장소를 Public 으로 두면 `PRESET` 의 시트·프록시 URL 이 공개됩니다.
  민감하면 저장소를 Private 으로 두세요. (Vercel 은 Private 저장소도 무료로 배포합니다)
