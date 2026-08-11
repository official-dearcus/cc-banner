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
  events: [], // 이벤트 배너 — 행사 단위. 제품군과 무관하게 전부 같이 나간다
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

/* 상단 셀러 알약(pill)은 뱀부·누볼라 모든 템플릿에서 항상 영문이다.
   (2026-07 요청) 한글은 pill 이 아니라 히어로 타이틀 쪽에 들어간다. */
function sellerFor() {
  return SESSION.sellerEn || SESSION.sellerKo;
}

/* 히어로 타이틀의 "셀러 × 디어커스" 에서 앞부분을 한글 셀러명으로 바꾼다.
   피그마에서 seller_name 레이어가 "× 디어커스" 와 오토레이아웃으로 묶인 그 자리다.
   곱셈기호(×)가 없는 제목(예: NUVOLA FAMILY SET)은 건드리지 않는다. */
function titleWithSeller(s) {
  const ko = SESSION.sellerKo || SESSION.sellerEn;
  if (!ko || !s || s.indexOf("×") < 0) return s;
  return s.replace(/^[^×]*(?=×)/, ko + " ");
}
function applySellerToTitles() {
  if (!SESSION.started) return;
  state.t1 = titleWithSeller(state.t1);
  state.t2 = titleWithSeller(state.t2);
  const e1 = $("#t1"),
    e2 = $("#t2");
  if (e1) e1.value = state.t1 || "";
  if (e2) e2.value = state.t2 || "";
}

function syncSellerField() {
  if (!SESSION.started) return;
  const v = sellerFor();
  state.seller = v;
  const el = $("#seller");
  if (el) el.value = v;
  applySellerToTitles();
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
    /* 행사 테마를 먼저 넘긴다 — selectGroup 안에서 히어로를 고르기 때문에,
       나중에 덮으면 히어로가 엉뚱한 테마 기준으로 정해진다 */
    selectGroup(key, SESSION.theme || null);
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

/* ---------- 이벤트 (설정 [5]) ----------
   옵션 카드처럼 계속 추가한다. 한 줄 = {typeKey, num, giftKey}.
   종류·선물 목록은 시트(EventMaster / GiftMaster)에서 온다. */
let SETUP_EVENTS = [];
function renderSetupEvents() {
  const box = $("#suEvents");
  if (!box) return;
  const types = typeof evTypes === "function" ? evTypes() : [];
  const gifts = typeof evGifts === "function" ? evGifts() : [];
  const hint = $("#suEvHint");
  const add = $("#suEvAdd");
  if (!types.length || !gifts.length) {
    box.innerHTML = "";
    if (add) add.disabled = true;
    /* 아직 시트를 한 번도 안 불렀으면 "없다" 고 단정하지 않는다.
       예전에는 못 읽은 경우까지 "탭이 없습니다" 로 보여서 원인을 못 찾았다. */
    const synced = typeof src !== "undefined" && src && src.syncedAt;
    if (hint)
      hint.innerHTML = !synced
        ? `시트를 아직 안 불러왔습니다. 좌측 <b>데이터 소스</b>에서 동기화하면 이벤트 목록이 채워집니다.`
        : !types.length && !gifts.length
          ? `시트에서 <b>EventMaster</b> · <b>GiftMaster</b> 를 못 읽었습니다. 탭 이름과 열 이름(<b>typeKey/titleLabel</b>, <b>giftKey/label</b>)을 확인하세요. 이벤트 없이도 배너는 그대로 만들어집니다.`
          : !types.length
            ? `<b>EventMaster</b> 탭에 쓸 수 있는 행이 없습니다. <b>typeKey</b> · <b>titleLabel</b> 열과 <b>enabled=TRUE</b> 를 확인하세요.`
            : `<b>GiftMaster</b> 탭에 쓸 수 있는 행이 없습니다. <b>giftKey</b> · <b>label</b> 열과 <b>enabled=TRUE</b> 를 확인하세요.`;
    return;
  }
  if (add) add.disabled = false;
  if (hint)
    hint.innerHTML = SETUP_EVENTS.length
      ? `문장: <b>[종류][인원]명에게 [선물][을/를] 드립니다.</b> — 조사는 선물 이름에서 자동으로 고릅니다.`
      : `이벤트를 넣지 않으면 이벤트 섹션이 아예 안 붙습니다.`;
  const opt = (list, keyF, labF, cur) =>
    list.map((x) => `<option value="${esc(keyF(x))}"${keyF(x) === cur ? " selected" : ""}>${esc(labF(x))}</option>`).join("");
  box.innerHTML = SETUP_EVENTS.map((e, i) => {
    const g = gifts.find((x) => x.giftKey === e.giftKey);
    const t = types.find((x) => x.typeKey === e.typeKey);
    const par = typeof evGiftParticle === "function" ? evGiftParticle(g) : "를";
    const line = t && g
      ? `${t.bodyLabel || t.titleLabel}${e.num}명에게 ${g.label}${par} 드립니다.`
      : "";
    return `<div class="evrow" data-i="${i}">
      <select class="evtype" data-i="${i}">${opt(types, (x) => x.typeKey, (x) => x.titleLabel, e.typeKey)}</select>
      <div class="evnum"><input type="number" min="1" max="9999" data-i="${i}" value="${e.num}" /><span>명</span></div>
      <select class="evgift" data-i="${i}">${opt(gifts, (x) => x.giftKey, (x) => x.label, e.giftKey)}</select>
      <button class="evdel" data-i="${i}" title="삭제">×</button>
      <div class="evprev">${esc(line)}</div>
    </div>`;
  }).join("");
  box.querySelectorAll(".evtype").forEach((s) => (s.onchange = () => {
    SETUP_EVENTS[+s.dataset.i].typeKey = s.value; renderSetupEvents(); }));
  box.querySelectorAll(".evgift").forEach((s) => (s.onchange = () => {
    SETUP_EVENTS[+s.dataset.i].giftKey = s.value; renderSetupEvents(); }));
  box.querySelectorAll(".evnum input").forEach((inp) => (inp.onchange = () => {
    const n = Math.max(1, parseInt(inp.value, 10) || 1);
    SETUP_EVENTS[+inp.dataset.i].num = n; renderSetupEvents(); }));
  box.querySelectorAll(".evdel").forEach((b) => (b.onclick = () => {
    SETUP_EVENTS.splice(+b.dataset.i, 1); renderSetupEvents(); }));
}
function setupEventAdd() {
  const types = typeof evTypes === "function" ? evTypes() : [];
  const gifts = typeof evGifts === "function" ? evGifts() : [];
  if (!types.length || !gifts.length) return;
  /* 아직 안 쓴 종류를 먼저 권한다 — 같은 종류를 두 번 넣는 일이 드물어서 */
  const used = SETUP_EVENTS.map((e) => e.typeKey);
  const t = types.find((x) => !used.includes(x.typeKey)) || types[0];
  SETUP_EVENTS.push({ typeKey: t.typeKey, num: 10, giftKey: gifts[0].giftKey });
  renderSetupEvents();
}

const RAND_T = "__rand"; // 실제 테마 키와 겹치지 않는 값
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
    .join("")
    /* 맨 뒤 "랜덤" — 고르는 순간 여섯 색 중 하나로 정해진다.
       선택 상태로 남는 모드가 아니라 주사위다. 그래서 SESSION.theme 은
       늘 실제 색 키라, 제품군 탭의 "테마 통일"·불일치 뱃지가 그대로 동작한다. */
    + (keys.length > 1
      ? `<button class="rand" data-t="${RAND_T}" title="여섯 색 중 하나를 무작위로 고릅니다">🎲 랜덤</button>`
      : "");
  el.querySelectorAll("button").forEach(
    (b) =>
      (b.onclick = () => {
        if (b.dataset.t === RAND_T) {
          /* 지금 색은 후보에서 뺀다 — 다시 눌렀는데 그대로면 고장 난 줄 안다 */
          const pool = keys.filter((k) => k !== SETUP_THEME);
          SETUP_THEME = pool[Math.floor(Math.random() * pool.length)] || keys[0];
        } else {
          SETUP_THEME = b.dataset.t;
        }
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
  SETUP_EVENTS = reset ? [] : (SESSION.events || []).map((e) => ({ ...e }));
  renderSellerList();
  renderSetupGroups();
  renderSetupThemes();
  renderSetupEvents();
  updateSetupBar();
  $("#setup").hidden = false;
}

function startSession() {
  const keep = SESSION.slots;
  SESSION.groups = SETUP_PICK.slice();
  SESSION.theme = SETUP_THEME;
  SESSION.events = SETUP_EVENTS.map((e) => ({ ...e }));
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

  /* 한글 셀러명이 바뀌었으면 이미 열어본 제품군의 제목도 따라가야 한다 */
  Object.values(SESSION.slots).forEach((s) => {
    s.t1 = titleWithSeller(s.t1);
    s.t2 = titleWithSeller(s.t2);
  });

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
        events: SESSION.events,
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
  const evAdd = $("#suEvAdd");
  if (evAdd) evAdd.onclick = setupEventAdd;

  /* 좌측 패널의 셀러 입력을 직접 고치면 세션 값도 따라간다 */
  const sel = $("#seller");
  if (sel)
    sel.addEventListener("input", () => {
      if (!SESSION.started) return;
      SESSION.sellerEn = sel.value.trim(); // pill 은 항상 영문
    });

  /* 시트 로딩이 끝난 뒤 제품군 목록을 다시 그린다 */
  const _initGroups = initGroups;
  initGroups = function () {
    const r = _initGroups.apply(this, arguments);
    if (typeof renderSetupEvents === "function") renderSetupEvents();
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
    SESSION.events = Array.isArray(last.events) ? last.events : [];
    SESSION.d1 = last.d1 || "";
    SESSION.d2 = last.d2 || "";
    SESSION.groups = (last.groups || []).slice();
  }
  openSetup(!last);
  renderGroupTabs();
})();
