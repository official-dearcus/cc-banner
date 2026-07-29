<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light" />
    <meta name="robots" content="noindex, nofollow" />
    <meta name="description" content="구글 시트 데이터로 상세페이지·썸네일·인스타 피드 배너를 즉시 생성하는 사내 제너레이터" />
    <title>CC 배너 제너레이터</title>

    <!-- 외부 폰트 CDN — 조기 연결 -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin />

    <!-- 캔버스 첫 렌더에 반드시 필요한 자체 호스팅 폰트: 최우선 로드 -->
    <link
      rel="preload"
      href="assets/high-summit.woff2"
      as="font"
      type="font/woff2"
      crossorigin
    />

    <link
      href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&family=Afacad+Flux:wght@400;600&display=swap"
      rel="stylesheet"
    />
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css"
    />

    <!-- 스타일: 역할별 분리 (로드 순서 = 캐스케이드 순서) -->
    <link rel="stylesheet" href="styles/01-tokens.css" />
    <link rel="stylesheet" href="styles/02-layout.css" />
    <link rel="stylesheet" href="styles/03-controls.css" />
    <link rel="stylesheet" href="styles/04-panels.css" />
    <link rel="stylesheet" href="styles/05-stage.css" />
    <link rel="stylesheet" href="styles/06-setup.css" />

    <!--
      스크립트: 기능별 분리.
      classic script + defer 이므로 (1) 전역 스코프를 그대로 공유하고
      (2) 문서 파싱 후 이 순서대로 실행된다 → 원본 단일 파일과 실행 순서가 동일하다.
      순서를 바꾸면 초기화가 깨진다.
    -->
    <script defer src="scripts/01-sheet-schema.js"></script>
    <script defer src="scripts/02-design-tokens.js"></script>
    <script defer src="scripts/03-sample-data.js"></script>
    <script defer src="scripts/04-template-meta.js"></script>
    <script defer src="scripts/05-state-utils.js"></script>
    <script defer src="scripts/06-config-store.js"></script>
    <script defer src="scripts/07-sheet-sync.js"></script>
    <script defer src="scripts/08-panel-ui.js"></script>
    <script defer src="scripts/09-hero-color.js"></script>
    <script defer src="scripts/10-group-template-ui.js"></script>
    <script defer src="scripts/11-rows-picker.js"></script>
    <script defer src="scripts/12-render-nuvola.js"></script>
    <script defer src="scripts/13-render-core.js"></script>
    <script defer src="scripts/14-render-hero.js"></script>
    <script defer src="scripts/15-render-thumb-feed.js"></script>
    <script defer src="scripts/16-render-cards.js"></script>
    <script defer src="scripts/17-canvas-helpers.js"></script>
    <script defer src="scripts/18-validate.js"></script>
    <script defer src="scripts/19-export.js"></script>
    <script defer src="scripts/20-history-share.js"></script>
    <script defer src="scripts/21-bindings-boot.js"></script>
    <script defer src="scripts/22-setup-flow.js"></script>
  </head>
  <body>
    <!-- ============================================================
         [1] 행사 정보 — 셀러 1명의 행사 1건을 세팅한다.
         제품군을 먼저 고르게 해서, 셀러명·기간을 입력하는 동안
         이미지가 뒤에서 미리 받아지도록 순서를 잡았다.
         ============================================================ -->
    <div class="setup" id="setup" hidden>
      <div class="setup-inner">
        <h1>행사 정보</h1>
        <p class="lead">
          셀러 한 명의 행사 하나를 만듭니다. 제품군은 여러 개 고를 수 있습니다.
        </p>

        <div class="setup-step">
          <div class="h"><span class="num">1</span> 제품군 <span class="opt">복수 선택</span></div>
          <div class="pickgrid" id="suGroups"></div>
        </div>

        <div class="setup-step">
          <div class="h"><span class="num">2</span> 셀러</div>
          <div class="grid2">
            <div>
              <label class="f" for="suSellerKo">한글명</label>
              <input type="text" id="suSellerKo" maxlength="24" list="suSellerList" placeholder="오인스" />
              <datalist id="suSellerList"></datalist>
            </div>
            <div>
              <label class="f" for="suSellerEn">영문명</label>
              <input type="text" id="suSellerEn" maxlength="24" placeholder="oins" />
            </div>
          </div>
          <div class="hint">
            템플릿 01은 셀러명을 영문 서체(High Summit)로 그립니다. 템플릿에 따라 자동으로 골라 씁니다.
          </div>
        </div>

        <div class="setup-step">
          <div class="h">
            <span class="num">3</span> 공구 기간
            <span class="opt">시작일 · 종료일 순서로 두 번 클릭</span>
          </div>
          <div class="cal" id="suCal"></div>
          <!-- 값은 달력이 채운다. 기존 코드가 이 두 값을 읽는다. -->
          <input type="hidden" id="suD1" /><input type="hidden" id="suD2" />
        </div>

        <div class="setup-step">
          <div class="h"><span class="num">4</span> 테마 <span class="opt">전체 공통 · 나중에 제품군별로 바꿀 수 있습니다</span></div>
          <div class="themepick" id="suThemes"></div>
        </div>
      </div>
      <div class="setup-bar">
        <span class="sum" id="suSum"></span>
        <span class="spacer"></span>
        <button class="go" id="suGo" disabled>옵션 편집으로</button>
      </div>
    </div>
    <div class="app">
      <header class="top">
        <div class="logo">CC <b>배너</b> 제너레이터</div>
        <span class="tag" id="tplTag">뱀부500</span>
        <div class="spacer"></div>
        <span id="statusline">폰트 로딩 중…</span>
      </header>

      <aside class="col left">
        <!-- [2] 제품군 네비게이터 — 좌측 상단 고정 -->
        <nav class="gnav" id="gnav" hidden></nav>
        <div class="block">
          <label class="h" style="cursor: pointer" id="srcToggle">
            <span class="num">⚙</span> 데이터 소스
            <span id="srcState" class="cnt"></span>
          </label>
          <div id="srcBody" hidden>
            <div class="seg" id="srcSeg" style="margin-bottom: 8px">
              <button data-s="sample">내장 샘플</button>
              <button data-s="csv">게시 CSV</button>
              <button data-s="gas">Apps Script</button>
            </div>
            <div id="srcCsv" hidden>
              <div class="seg" style="margin-bottom: 6px">
                <button id="csvAuto" class="on" type="button">자동</button>
                <button id="csvManual" type="button">탭별 URL 직접</button>
              </div>
              <div id="csvAutoBox">
                <input
                  type="text"
                  id="docId"
                  placeholder="게시 URL 또는 문서 ID 붙여넣기"
                />
                <div class="row" style="margin-top: 6px">
                  <input
                    type="text"
                    id="tabP"
                    placeholder="ProductMaster"
                    value="ProductMaster"
                  />
                  <input
                    type="text"
                    id="tabT"
                    placeholder="TemplateMaster"
                    value="TemplateMaster"
                  />
                </div>
                <input
                  type="text"
                  id="tabH"
                  placeholder="HeroMaster (선택)"
                  value="HeroMaster"
                  style="margin-top: 6px"
                />
                <input
                  type="text"
                  id="tabC"
                  placeholder="ColorMaster (선택)"
                  value="ColorMaster"
                  style="margin-top: 6px"
                />
              </div>
              <div id="csvManualBox" hidden>
                <input
                  type="url"
                  id="urlP"
                  placeholder="ProductMaster 게시 CSV URL"
                />
                <input
                  type="url"
                  id="urlT"
                  placeholder="TemplateMaster 게시 CSV URL"
                  style="margin-top: 6px"
                />
                <input
                  type="url"
                  id="urlH"
                  placeholder="HeroMaster 게시 CSV URL (선택)"
                  style="margin-top: 6px"
                />
                <input
                  type="url"
                  id="urlC"
                  placeholder="ColorMaster 게시 CSV URL (선택)"
                  style="margin-top: 6px"
                />
              </div>
            </div>
            <div id="srcGas" hidden>
              <input
                type="url"
                id="gasUrl"
                placeholder="https://script.google.com/.../exec"
              />
            </div>
            <div class="imgpick" id="syncRow" hidden>
              <button id="syncBtn" style="flex: 2">시트 불러오기</button>
              <button id="cfgClear" title="저장된 접속 설정 삭제">
                설정 초기화
              </button>
            </div>
            <input
              type="url"
              id="proxyUrl"
              placeholder="이미지 프록시 URL (선택, Apps Script /exec)"
              style="margin-top: 8px"
            />
            <div class="imgpick">
              <button id="corsTest" style="flex: 1">이미지 CORS 진단</button>
              <button id="proxyTest" style="flex: 1">프록시 테스트</button>
            </div>
            <div class="hint">
              이미지 서버가 CORS를 안 열어줄 때(카페24 EC 등) Apps Script가
              중계합니다.
            </div>
            <div id="proxyResult"></div>
            <div class="hint" id="srcHint"></div>
            <div id="cfgWhere" class="hint"></div>
          </div>
          <div id="sheetErr"></div>
        </div>

        <div class="block">
          <label class="h"><span class="num">1</span> 제품군</label>
          <input type="text" id="groupSearch" class="groupsearch" placeholder="제품명 검색" />
          <div id="group" class="groupgrid"></div>
          <div class="hint">
            제품군을 바꾸면 템플릿·컬러·제품 옵션이 초기화됩니다.
          </div>
        </div>

        <div class="block">
          <label class="h"><span class="num">2</span> 셀러명</label>
          <input type="text" id="seller" maxlength="24" />
          <div class="hint" id="sellerHint"></div>
        </div>

        <div class="block">
          <label class="h"
            ><span class="num">3</span> 히어로 타이틀 (2줄)</label
          >
          <input type="text" id="t1" maxlength="40" placeholder="1줄" />
          <input
            type="text"
            id="t2"
            maxlength="40"
            placeholder="2줄"
            style="margin-top: 6px"
          />
        </div>

        <div class="block">
          <label class="h"><span class="num">4</span> 공구 기간</label>
          <div class="row">
            <input type="date" id="d1" /><input type="date" id="d2" />
          </div>
          <div class="hint" id="dateHint"></div>
        </div>

        <div class="block" id="copyBlock" hidden>
          <label class="h"
            ><span class="num">5</span> 하단 카피 (02 전용)</label
          >
          <input type="text" id="copy" maxlength="40" />
          <input
            type="text"
            id="copyBold"
            maxlength="20"
            placeholder="굵게 표시할 뒷부분"
            style="margin-top: 6px"
          />
        </div>

        <div class="block">
          <label class="h"
            ><span class="num">6</span>
            <span id="seriesLabel">시리즈 제목 (한글)</span></label
          >
          <input type="text" id="series" maxlength="30" />
        </div>

        <div id="nvBlocks"></div>

        <div class="block">
          <label class="h"
            ><span class="num">7</span> 가격 카드
            <span id="rowCount" class="cnt"></span
          ></label>
          <div id="rows"></div>
          <button class="mini" id="addRow" style="width: 100%">
            + 제품 추가
          </button>
          <div id="picker" class="picker" hidden></div>
          <div class="hint">
            카드 왼쪽 <b>⠿</b>를 끌어서 순서를 바꿀 수 있습니다.
          </div>
        </div>

        <div class="secdiv"><span>디자인 템플릿</span></div>

        <div class="block">
          <label class="h"><span class="num">8</span> 템플릿</label>
          <div id="tplList"></div>
          <div class="hint" id="tplHint"></div>
        </div>

        <div class="block" id="themeBlock">
          <label class="h"><span class="num">9</span> 컬러</label>
          <div class="swatches" id="themeSw"></div>
        </div>

        <div class="block">
          <label class="h"
            ><span class="num">10</span>
            <span id="imgLabel">히어로 이미지</span></label
          >
          <div id="heroList"></div>
          <div class="imgpick">
            <button id="heroUpload">직접 업로드</button>
            <button id="heroReset">지우기</button>
          </div>
          <input type="file" id="heroFile" accept="image/*" hidden />
          <div class="hint" id="imgHint"></div>
        </div>

      </aside>

      <div
        class="resizer"
        id="resizer"
        title="드래그하여 편집 패널 폭 조절"
      ></div>

      <main class="center">
        <div class="fmttabs" id="fmtTabs">
          <button data-f="detail" class="on">상세페이지</button>
          <button data-f="thumb">썸네일</button>
          <button data-f="feed">인스타 피드</button>
        </div>
        <div class="stage-bar">
          <div class="zoom">
            미리보기
            <input type="range" id="zoom" min="15" max="50" value="26" />
            <span id="zoomVal">26%</span>
          </div>
          <div class="actions">
            <div class="scalesel" id="scaleSel">
              <button data-x="1" class="on">1x</button>
              <button data-x="2">2x</button>
            </div>
            <button class="btn" id="shareBtn">공유 코드</button>
            <button class="btn primary" id="dlBtn">전체 다운로드 (ZIP)</button>
            <div class="dlsum" id="dlSum"></div>
          </div>
        </div>
        <div class="stage" id="stageDetail"><canvas id="preview"></canvas></div>
        <div class="stage" id="stageThumb" hidden>
          <canvas id="thumbCanvas"></canvas>
        </div>
        <div class="stage feedstage" id="stageFeed" hidden>
          <div id="feedScroll"></div>
        </div>
      </main>

      <aside class="col right">
        <div class="block">
          <label class="h">상태 · 경고</label>
          <div id="warnList"></div>
        </div>
        <div class="block">
          <label class="h">생성 이력</label>
          <div id="histList">
            <div class="empty">다운로드하면 이력이 쌓입니다.</div>
          </div>
        </div>
      </aside>
    </div>
  </body>
</html>
