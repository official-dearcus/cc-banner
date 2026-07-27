/* CC 배너 제너레이터 — 22-setup-flow
   [1] 행사 정보 화면 + [2] 제품군 탭.

   설계 메모
   - 기존 화면/렌더러를 고치지 않고 "위에 얹는" 레이어다.
     index.html 에서 이 파일과 styles/06-setup.css 만 빼면 예전 UI 그대로다.
   - 제품군 N개는 state 구조를 바꾸지 않고 슬롯 스냅샷으로 오간다.
     20-history-share.js 의 snap()/restore() 와 같은 발상이되,
     이미지 객체(hero/thumb)를 참조 그대로 들고 있어 탭 전환에 재로드가 없다.
   - 로드 순서상 가장 마지막이라 앞 파일의 전역 함수를 감쌀 수 있다.
*/

/* ============================================================
   세션 (= 셀러 1명의 행사 1건)
   ============================================================ */
const SESSION = {
  groups: [], // 선택한 제품군 키 목록
  theme: "", // 공통 테마 (탭에서 개별 변경 가능)
  sellerKo: "",
  sellerEn: "",
  d1: "",
  d2: "",
  slots: {}, // { groupKey: 스냅샷 }
  started: false,
};

const SES_KEY = "cc-banner-session-v1";

/* 셀러 최근 목록 — SellerMaster 탭이 생기면 이 자리를 대체하면 된다 */
const SELLER_KEY = "cc-banner-sellers-v1";
function loadSellers() {
  try {
    return JSON.parse(localStorage.getItem(SELLER_KEY) || "[]");
  } catch (e) {
    return [];
  }
}
function rememberSeller(ko, en) {
  if (!ko && !en) return;
  try {
    const list = loadSellers().filter((s) => s.ko !== ko);
    list.unshift({ ko, en });
    localStorage.setItem(SELLER_KEY, JSON.stringify(list.slice(0, 30)));
  } catch (e) {}
}

/* 템플릿 01 은 High Summit(영문 전용)로 셀러명을 그린다.
   그래서 템플릿에 따라 한글/영문을 자동으로 골라 넣는다.
   (예전에는 한글을 넣으면 검증에서 에러가 났다) */
function sellerFor(tpl) {
  const ko = SESSION.sellerKo,
    en = SESSION.sellerEn;
  return String(tpl) === "01" ? en || ko : ko || en;
}
function syncSellerField() {
  if (!SESSION.started) return;
  const v = sellerFor(state.tpl);
  state.seller = v;
  const el = $("#seller");
  if (el) el.value = v;
  if (typeof checkSeller === "function") checkSeller();
}

/* ============================================================
   슬롯 스냅샷 — 제품군 하나의 작업 상태 전체
   ============================================================ */
const SLOT_FIELDS = [
  "tpl",
  "theme",
  "t1",
  "t2",
  "copy",
  "copyBold",
  "series",
  "notice",
  "sizeInfoOn",
  "hero",
  "heroSrc",
  "heroUrl",
  "heroUpload",
  "heroTainted",
];
function slotSnap() {
  const o = {};
  SLOT_FIELDS.forEach((f) => (o[f] = state[f]));
  o.rows = state.rows; // 참조 유지 → 썸네일 이미지가 살아있다
  o.colorPick = JSON.parse(JSON.stringify(state.colorPick || {}));
  return o;
}
function slotApply(s) {
  SLOT_FIELDS.forEach((f) => (state[f] = s[f]));
  state.rows = s.rows;
  state.colorPick = JSON.parse(JSON.stringify(s.colorPick || {}));
}

/* 화면 전체 갱신 — 탭을 옮긴 뒤 좌/중/우를 현재 state 로 맞춘다 */
function refreshPanels() {
  renderGroupButtons($("#groupSearch") ? $("#groupSearch").value : "");
  $("#seller").value = state.seller || "";
  $("#t1").value = state.t1 || "";
  $("#t2").value = state.t2 || "";
  $("#d1").value = state.d1 || "";
  $("#d2").value = state.d2 || "";
  $("#copy").value = state.copy || "";
  $("#copyBold").value = state.copyBold || "";
  $("#series").value = state.series || "";
  if (typeof renderNvBlocks === "function") renderNvBlocks();
  renderTplList();
  renderThemes();
  renderRows();
  syncTplUI();
  if (typeof renderHeroList === "function") renderHeroList();
  if (typeof dateHint === "function") dateHint();
  draw();
}

/* ============================================================
   제품군 탭
   ============================================================ */
function gotoGroup(key) {
  if (!SESSION.groups.includes(key)) return;
  if (state.group && SESSION.slots[state.group])
    SESSION.slots[state.group] = slotSnap();

  const prev = SESSION.slots[key];
  state.group = key;
  if (prev) {
    slotApply(prev);
    refreshPanels();
  } else {
    selectGroup(key); // 최초 진입 — 기존 초기화 경로를 그대로 탄다
    if (SESSION.theme && themesFor(state.tpl)[SESSION.theme])
      state.theme = SESSION.theme;
    syncSellerField();
    SESSION.slots[key] = slotSnap();
    renderThemes();
    draw();
  }
  renderGroupTabs();
  saveSession();
}

function renderGroupTabs() {
  const el = $("#gnav");
  if (!el) return;
  if (!SESSION.started || SESSION.groups.length === 0) {
    el.hidden = true;
    return;
  }
  el.hidden = false;
  const gs = G();
  const items = SESSION.groups
    .map((k, i) => {
      const s = k === state.group ? slotSnap() : SESSION.slots[k];
      const th = s && s.theme;
      const off = th && SESSION.theme && th !== SESSION.theme;
      return (
        `<button class="gt ${k === state.group ? "on" : ""}" data-g="${k}">` +
        `<span class="idx">${i + 1}</span>` +
        `<span class="nm">${(gs[k] && gs[k].label) || k}</span>` +
        (off ? `<span class="off">${th}</span>` : "") +
        `</button>`
      );
    })
    .join("");
  el.innerHTML =
    `<div class="cap">제품군 <span class="spacer"></span>${SESSION.groups.length}개</div>` +
    `<div class="list">${items}</div>` +
    `<div class="acts">` +
    `<button id="gtReset">테마 통일 (${SESSION.theme || "-"})</button>` +
    `<button id="gtBack">행사 정보 수정</button>` +
    `</div>`;

  el.querySelectorAll(".gt").forEach(
    (b) => (b.onclick = () => gotoGroup(b.dataset.g)),
  );
  const rs = $("#gtReset");
  if (rs)
    rs.onclick = () => {
      SESSION.groups.forEach((k) => {
        const s = k === state.group ? null : SESSION.slots[k];
        if (s && SESSION.theme && themeOkFor(s.tpl, SESSION.theme))
          s.theme = SESSION.theme;
      });
      if (SESSION.theme && themeOkFor(state.tpl, SESSION.theme)) {
        state.theme = SESSION.theme;
        SESSION.slots[state.group] = slotSnap();
        renderThemes();
        draw();
      }
      renderGroupTabs();
      status(`테마를 ${SESSION.theme} 로 통일했습니다.`);
    };
  const bk = $("#gtBack");
  if (bk) bk.onclick = () => openSetup(false);
}
function themeOkFor(tpl, key) {
  try {
    return !!themesFor(tpl)[key];
  } catch (e) {
    return false;
  }
}


/* ============================================================
   공구 기간 — 2클릭 범위 달력
   첫 클릭 = 시작일, 둘째 클릭 = 종료일. 시작보다 앞을 누르면 시작이 옮겨간다.
   숨은 #suD1/#suD2 에 값을 넣어 기존 코드와 그대로 맞물린다.
   ============================================================ */
const DOW = ["일", "월", "화", "수", "목", "금", "토"];
let CAL_BASE = new Date();
let CAL = { d1: "", d2: "", half: false };

function ymd(d) {
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}
function fromYmd(s) {
  const m = String(s || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
}
function monthCells(y, m) {
  const first = new Date(y, m, 1);
  const start = new Date(y, m, 1 - first.getDay());
  const out = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    out.push(d);
  }
  return out;
}
function calPick(s) {
  if (!CAL.half || !CAL.d1 || s < CAL.d1) {
    CAL.d1 = s;
    CAL.d2 = "";
    CAL.half = true;
  } else {
    CAL.d2 = s;
    CAL.half = false;
  }
  $("#suD1").value = CAL.d1;
  $("#suD2").value = CAL.d2;
  renderCal();
  updateSetupBar();
}
function monthHtml(y, m) {
  const cells = monthCells(y, m);
  const has = CAL.d1 && CAL.d2;
  const body = cells
    .map((d) => {
      const s = ymd(d);
      const out = d.getMonth() !== m;
      const isS1 = s === CAL.d1;
      const isS2 = s === CAL.d2;
      const inR = has && s > CAL.d1 && s < CAL.d2;
      const cls = [
        out ? "out" : "",
        isS1 ? "s1" : "",
        isS2 ? "s2" : "",
        inR ? "in" : "",
        has ? "has-range" : "",
      ]
        .filter(Boolean)
        .join(" ");
      return `<button class="${cls}" data-d="${s}"${out ? " disabled" : ""}>${out ? "" : d.getDate()}</button>`;
    })
    .join("");
  return (
    `<div class="cal-m"><div class="mh">${y}년 ${m + 1}월</div><div class="cal-grid">` +
    DOW.map((w, i) => `<div class="dw${i === 0 ? " sun" : ""}">${w}</div>`).join("") +
    body +
    `</div></div>`
  );
}
function renderCal() {
  const el = $("#suCal");
  if (!el) return;
  const y = CAL_BASE.getFullYear(),
    m = CAL_BASE.getMonth();
  const n = new Date(y, m + 1, 1);
  const label = CAL.d1
    ? `${CAL.d1} ~ ${CAL.d2 || "<span class='ph'>종료일 선택</span>"}`
    : `<span class="ph">시작일을 클릭하세요</span>`;
  el.innerHTML =
    `<div class="cal-head">` +
    `<button class="nav" id="calPrev" type="button">‹</button>` +
    `<button class="nav" id="calNext" type="button">›</button>` +
    `<span class="picked">${label}</span><span class="spacer"></span></div>` +
    `<div class="cal-months">${monthHtml(y, m)}${monthHtml(n.getFullYear(), n.getMonth())}</div>` +
    `<div class="cal-foot"><span>날짜 두 번이면 끝납니다.</span><span class="spacer"></span>` +
    `<button type="button" id="calClear">지우기</button></div>`;
  el.querySelectorAll(".cal-grid button:not([disabled])").forEach(
    (b) => (b.onclick = () => calPick(b.dataset.d)),
  );
  $("#calPrev").onclick = () => {
    CAL_BASE = new Date(y, m - 1, 1);
    renderCal();
  };
  $("#calNext").onclick = () => {
    CAL_BASE = new Date(y, m + 1, 1);
    renderCal();
  };
  $("#calClear").onclick = () => {
    CAL = { d1: "", d2: "", half: false };
    $("#suD1").value = "";
    $("#suD2").value = "";
    renderCal();
    updateSetupBar();
  };
}
function calSet(d1, d2) {
  CAL = { d1: d1 || "", d2: d2 || "", half: false };
  $("#suD1").value = CAL.d1;
  $("#suD2").value = CAL.d2;
  const b = fromYmd(CAL.d1);
  if (b) CAL_BASE = new Date(b.getFullYear(), b.getMonth(), 1);
  renderCal();
}

/* ============================================================
   [1] 행사 정보 화면
   ============================================================ */
let SETUP_PICK = [];
let SETUP_THEME = "";

function allThemeKeys() {
  /* 패밀리가 섞여도 여섯 색 키는 공통이다. 교집합을 쓴다. */
  const gs = G();
  let keys = null;
  for (const k of SETUP_PICK.length ? SETUP_PICK : Object.keys(gs)) {
    const g = gs[k];
    const tpl = (g && g.templates && g.templates[0]) || null;
    const id = tpl ? tpl.templateId || tpl.id || tpl : null;
    let t = {};
    try {
      t = themesForKey(k, id) || {};
    } catch (e) {}
    const ks = Object.keys(t);
    if (!ks.length) continue;
    keys = keys === null ? ks : keys.filter((x) => ks.includes(x));
  }
  return keys && keys.length ? keys : ["green", "blue", "pink", "yellow", "orange", "mint"];
}

function renderSetupGroups() {
  const el = $("#suGroups");
  if (!el) return;
  const gs = G();
  const keys = Object.keys(gs);
  if (!keys.length) {
    el.innerHTML = `<div class="empty">시트를 불러오는 중입니다…</div>`;
    return;
  }
  el.innerHTML = keys
    .map((k) => {
      const g = gs[k];
      const n = (g.rows || []).length;
      const noTpl = !(g.templates || []).length;
      return (
        `<button class="${SETUP_PICK.includes(k) ? "on" : ""} ${noTpl ? "dim" : ""}" data-g="${k}"${noTpl ? " disabled" : ""}>` +
        `${g.label || k}<span class="sub">${noTpl ? "템플릿 미등록" : `옵션 ${n}개`}</span></button>`
      );
    })
    .join("");
  el.querySelectorAll("button").forEach(
    (b) =>
      (b.onclick = () => {
        const k = b.dataset.g;
        const i = SETUP_PICK.indexOf(k);
        if (i >= 0) SETUP_PICK.splice(i, 1);
        else {
          SETUP_PICK.push(k);
          prefetchGroup(k); // 체크하는 순간 이미지를 미리 받아둔다
        }
        renderSetupGroups();
        renderSetupThemes();
        updateSetupBar();
      }),
  );
}

/* 선택 즉시 이미지 프리페치 — 셀러명·기간을 입력하는 동안 뒤에서 받는다.
   IMG_CACHE 에 얹히므로 [2] 로 넘어가면 네트워크를 다시 타지 않는다. */
function prefetchGroup(key) {
  const g = G()[key];
  if (!g || typeof loadImgSmart !== "function") return;
  const urls = new Set();
  (g.rows || []).forEach((r) => r.thumbUrl && urls.add(r.thumbUrl));
  if (g.heroUrl) urls.add(g.heroUrl);
  (g.colors || []).forEach((c) => c.url && urls.add(c.url));
  Object.values(g.gridByTpl || {}).forEach((a) =>
    (a || []).forEach((u) => u && urls.add(u)),
  );
  if (g.sizeInfoUrl) urls.add(g.sizeInfoUrl);
  Object.values(g.sizeInfoByTpl || {}).forEach((u) => u && urls.add(u));
  urls.forEach((u) => {
    loadImgSmart(u).catch(() => {});
  });
}

function renderSetupThemes() {
  const el = $("#suThemes");
  if (!el) return;
  const keys = allThemeKeys();
  if (!keys.includes(SETUP_THEME)) SETUP_THEME = keys[0] || "";
  const pal = typeof THEMES_NUVOLA !== "undefined" ? THEMES_NUVOLA : {};
  el.innerHTML = keys
    .map((k) => {
      const c = (pal[k] && pal[k].accent) || "#999";
      const lb = (pal[k] && pal[k].label) || k;
      return `<button class="${k === SETUP_THEME ? "on" : ""}" data-t="${k}"><span class="dot" style="background:${c}"></span>${lb}</button>`;
    })
    .join("");
  el.querySelectorAll("button").forEach(
    (b) =>
      (b.onclick = () => {
        SETUP_THEME = b.dataset.t;
        renderSetupThemes();
      }),
  );
}

function renderSellerList() {
  const dl = $("#suSellerList");
  if (!dl) return;
  dl.innerHTML = loadSellers()
    .map((s) => `<option value="${(s.ko || "").replace(/"/g, "&quot;")}">`)
    .join("");
}

function updateSetupBar() {
  const ko = ($("#suSellerKo") || {}).value || "";
  const en = ($("#suSellerEn") || {}).value || "";
  const d1 = ($("#suD1") || {}).value || "";
  const d2 = ($("#suD2") || {}).value || "";
  const probs = [];
  if (!SETUP_PICK.length) probs.push("제품군");
  if (!ko.trim() && !en.trim()) probs.push("셀러명");
  if (!d1 || !d2) probs.push("공구 기간");
  else if (new Date(d2) < new Date(d1)) probs.push("기간 순서");

  const n = SETUP_PICK.length;
  const sum = $("#suSum");
  if (sum)
    sum.textContent = probs.length
      ? `${probs.join(" · ")} 을(를) 입력하세요`
      : `제품군 ${n}개 — 상세 ${n}장 · 썸네일 ${n}장 · 피드 ${n}세트`;
  const go = $("#suGo");
  if (go) go.disabled = probs.length > 0;
}

function openSetup(reset) {
  if (reset) {
    SETUP_PICK = [];
    SETUP_THEME = "";
  } else {
    SETUP_PICK = SESSION.groups.slice();
    SETUP_THEME = SESSION.theme;
    $("#suSellerKo").value = SESSION.sellerKo || "";
    $("#suSellerEn").value = SESSION.sellerEn || "";
  }
  calSet(
    reset ? "" : SESSION.d1 || state.d1 || "",
    reset ? "" : SESSION.d2 || state.d2 || "",
  );
  renderSellerList();
  renderSetupGroups();
  renderSetupThemes();
  updateSetupBar();
  $("#setup").hidden = false;
}

function startSession() {
  const keep = SESSION.slots;
  SESSION.groups = SETUP_PICK.slice();
  SESSION.theme = SETUP_THEME;
  SESSION.sellerKo = $("#suSellerKo").value.trim();
  SESSION.sellerEn = $("#suSellerEn").value.trim();
  SESSION.d1 = $("#suD1").value;
  SESSION.d2 = $("#suD2").value;
  SESSION.started = true;
  /* 빠진 제품군의 슬롯은 버린다 */
  SESSION.slots = {};
  SESSION.groups.forEach((k) => {
    if (keep[k]) SESSION.slots[k] = keep[k];
  });

  state.d1 = SESSION.d1;
  state.d2 = SESSION.d2;
  $("#d1").value = SESSION.d1;
  $("#d2").value = SESSION.d2;
  rememberSeller(SESSION.sellerKo, SESSION.sellerEn);

  $("#setup").hidden = true;
  const first = SESSION.groups[0];
  state.group = null; // gotoGroup 이 이전 슬롯을 저장하지 않도록
  gotoGroup(first);
  syncSellerField();
  draw();
  status(`${SESSION.sellerKo || SESSION.sellerEn} — 제품군 ${SESSION.groups.length}개로 시작합니다.`);
}

/* ---------- 이어하기 ---------- */
function saveSession() {
  try {
    localStorage.setItem(
      SES_KEY,
      JSON.stringify({
        groups: SESSION.groups,
        theme: SESSION.theme,
        sellerKo: SESSION.sellerKo,
        sellerEn: SESSION.sellerEn,
        d1: SESSION.d1,
        d2: SESSION.d2,
        at: Date.now(),
      }),
    );
  } catch (e) {}
}
function lastSession() {
  try {
    const o = JSON.parse(localStorage.getItem(SES_KEY) || "null");
    if (!o || !o.groups || !o.groups.length) return null;
    if (Date.now() - (o.at || 0) > 7 * 864e5) return null; // 일주일 지나면 버림
    return o;
  } catch (e) {
    return null;
  }
}

/* ============================================================
   기존 함수 감싸기
   ============================================================ */
/* 템플릿이 바뀌면 셀러명(한글/영문)을 다시 고른다 */
const _applyTplDefaults = applyTplDefaults;
applyTplDefaults = function () {
  const r = _applyTplDefaults.apply(this, arguments);
  syncSellerField();
  return r;
};

/* 좌측 제품군 버튼으로 세션 밖 제품군을 누르면 탭에 편입한다 */
const _selectGroup = selectGroup;
selectGroup = function (key) {
  if (SESSION.started && !SESSION.groups.includes(key)) {
    SESSION.groups.push(key);
    SETUP_PICK = SESSION.groups.slice();
  }
  const r = _selectGroup.apply(this, arguments);
  if (SESSION.started) {
    if (SESSION.theme && themeOkFor(state.tpl, SESSION.theme))
      state.theme = SESSION.theme;
    syncSellerField();
    SESSION.slots[key] = slotSnap();
    renderGroupTabs();
    saveSession();
  }
  return r;
};

/* ============================================================
   부팅
   ============================================================ */
(function initSetupFlow() {
  /* 셀러 입력 → 세션에 반영 */
  ["suSellerKo", "suSellerEn"].forEach((id) => {
    const el = $("#" + id);
    if (el) el.oninput = updateSetupBar;
  });
  const koEl = $("#suSellerKo");
  if (koEl)
    koEl.onchange = () => {
      const hit = loadSellers().find((s) => s.ko === koEl.value.trim());
      if (hit && hit.en && !$("#suSellerEn").value) $("#suSellerEn").value = hit.en;
      updateSetupBar();
    };
  const go = $("#suGo");
  if (go) go.onclick = startSession;

  /* 좌측 패널의 셀러 입력을 직접 고치면 세션 값도 따라간다 */
  const sel = $("#seller");
  if (sel)
    sel.addEventListener("input", () => {
      if (!SESSION.started) return;
      if (String(state.tpl) === "01") SESSION.sellerEn = sel.value.trim();
      else SESSION.sellerKo = sel.value.trim();
    });

  /* 시트 로딩이 끝난 뒤 제품군 목록을 다시 그린다 */
  const _initGroups = initGroups;
  initGroups = function () {
    const r = _initGroups.apply(this, arguments);
    if (!$("#setup").hidden) {
      renderSetupGroups();
      renderSetupThemes();
      updateSetupBar();
    }
    return r;
  };

  /* 최초 진입 — 이전 세션이 있으면 채워서 보여준다 */
  const last = lastSession();
  if (last) {
    SESSION.sellerKo = last.sellerKo || "";
    SESSION.sellerEn = last.sellerEn || "";
    SESSION.theme = last.theme || "";
    SESSION.d1 = last.d1 || "";
    SESSION.d2 = last.d2 || "";
    SESSION.groups = (last.groups || []).slice();
  }
  openSetup(!last);
  renderGroupTabs();
})();
