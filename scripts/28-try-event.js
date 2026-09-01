/* CC 배너 제너레이터 — 28-try-event
   "써볼래요 이벤트" — 인스타 피드 전용.

   기존 이벤트 배너(23-render-event)의 폼을 그대로 쓰고 두 가지만 다르다.
     ① 경품이 GiftMaster 가 아니라 "그 제품군의 제품" 중 하나다
        → 패널 드롭다운에 지금 제품군의 제품이 뜬다.
     ② 제목이 템플릿별 문구(GIFT/OPEN EVENT) 대신 "써볼래요 이벤트" 고정.
        Pretendard Bold 72px (요청 2026-09-01).

   상세페이지에는 안 들어간다 — 높이가 0 이라 섹션 목록에도 안 잡힌다. */

      const TRY_TITLE = "써볼래요 이벤트";
      const TRY_TITLE_FONT = "Pretendard";
      const TRY_TITLE_SIZE = 72;
      const TRY_TITLE_WEIGHT = 700;
      /* 문장에 쓰는 말. EventMaster 에 typeKey "try" 행이 있으면 그 값이 이긴다
         → 문구를 바꾸고 싶으면 시트에서 고치면 된다. */
      const TRY_TYPE_FALLBACK = { titleLabel: "써볼래요 이벤트", bodyLabel: "써볼래요" };
      function tryType() {
        const t = typeof evType === "function" ? evType("try") : null;
        return t || TRY_TYPE_FALLBACK;
      }

      /* 이 행사의 써볼래요 목록. 이벤트와 같은 자리에 둔다(행사 단위). */
      function tryList() {
        if (typeof SESSION !== "undefined" && SESSION && SESSION.tryEvents)
          return SESSION.tryEvents;
        return (state && state.tryEvents) || [];
      }
      function tryOn() { return tryList().length > 0; }

      /* 경품 후보 (2026-09-01 확장)
           row     이 제품군의 옵션 제품
           gift    GiftMaster 선물 목록 — 옵션에 없는 단품이 보통 여기 있다
           custom  직접 입력 — 이름과 사진 주소를 그 자리에서 넣는다
         값은 e.pick 에 {kind, …} 로 들어간다.
         ⚠ 예전 저장분은 e.rowIdx(숫자) 였다 → tryPick() 이 알아서 바꿔 준다. */
      function tryProducts() {
        const g = (typeof G === "function" && G()[state.group]) || {};
        const nm = (r) => (typeof rowName === "function" ? rowName(r) : r.name || "");
        const on = (g.rows || []).map((r, i) => ({
          kind: "row", i, name: nm(r), url: r.thumbUrl || "",
        }));
        /* enabled=FALSE 인 행 — 옵션엔 안 나오지만 경품으로는 쓴다.
           i 는 offRows 안의 번호라 kind 를 나눠 저장한다. */
        const off = (g.offRows || []).map((r, i) => ({
          kind: "off", i, name: nm(r), url: r.thumbUrl || "",
        }));
        return on.concat(off);
      }
      function tryGifts() {
        const list = typeof evGifts === "function" ? evGifts() : [];
        return list.map((x) => ({
          kind: "gift",
          key: x.giftKey,
          name: x.label || x.giftKey,
          url: x.url || "",
        }));
      }
      /* 드롭다운에 뜨는 전체 후보 */
      function tryCandidates() {
        return tryProducts().concat(tryGifts());
      }
      /* 저장값 → {kind,…} 로 정규화 (구형 rowIdx 호환) */
      function tryPick(e) {
        if (e && e.pick && e.pick.kind) return e.pick;
        return { kind: "row", i: (e && e.rowIdx) | 0 };
      }
      function tryPickKey(p) {
        if (p.kind === "gift") return `gift:${p.key}`;
        if (p.kind === "custom") return "custom";
        if (p.kind === "off") return `off:${p.i}`;
        return `row:${p.i}`;
      }
      /* 고른 값 → {name, url} */
      function tryProduct(e) {
        const p = tryPick(e);
        if (p.kind === "custom")
          return { name: p.name || "", url: p.url || "" };
        if (p.kind === "gift") {
          const hit = tryGifts().find((x) => x.key === p.key);
          return hit || { name: "", url: "" };
        }
        const list = tryProducts().filter((x) => x.kind === (p.kind === "off" ? "off" : "row"));
        return list[Math.max(0, Math.min(list.length - 1, p.i | 0))] || { name: "", url: "" };
      }
      /* 이벤트 렌더러가 알아듣는 모양으로 바꾼다.
         giftLabel / giftUrl 을 직접 넣으면 GiftMaster 를 안 본다. */
      function tryAsEvent(e) {
        const p = tryProduct(e);
        const t = tryType();
        return {
          typeKey: "try",
          num: e.num,
          qty: 1,
          giftLabel: (p && p.name) || "",
          giftUrl: (p && p.url) || "",
          _title: t.titleLabel,
          _body: t.bodyLabel,
        };
      }
      /* 문장 미리보기 — 배너와 같은 함수를 쓴다 */
      function trySentence(e) {
        const ev = tryAsEvent(e);
        if (typeof evSentence !== "function") return "";
        /* evSentence 는 evType(typeKey) 를 보므로, 시트에 try 가 없으면
           여기서 직접 조립한다(같은 문장 규칙). */
        if (typeof evType === "function" && evType("try")) return evSentence(ev);
        const par = typeof evPartOf === "function" ? evPartOf(ev) : "를";
        return `${ev._body} ${ev.num}명에게 ${ev.giftLabel}${par} 드립니다.`;
      }

      /* ── 피드 ── */
      const TRY_PER_SLIDE = 2; // 이벤트와 같은 규칙
      function tryFeedGroups() {
        const l = tryList();
        const out = [];
        for (let i = 0; i < l.length; i += TRY_PER_SLIDE)
          out.push(l.slice(i, i + TRY_PER_SLIDE));
        return out;
      }
      function tryFeedCount() { return tryOn() ? tryFeedGroups().length : 0; }
      function tryFeedSlide(ctx, evs, th) {
        if (typeof evFeedSlide !== "function") return;
        evFeedSlide(ctx, evs.map(tryAsEvent), th, {
          title: TRY_TITLE,
          titleFont: TRY_TITLE_FONT,
          titleSizeAbs: TRY_TITLE_SIZE, // 피드에 그려지는 실제 크기 (배율 안 먹임)
          titleWeight: TRY_TITLE_WEIGHT,
        });
      }
      /* 상세에는 안 들어간다 */
      function tryDetailH() { return 0; }

      /* ---------- 패널 UI ---------- */
      function tryTarget() {
        if (typeof SESSION !== "undefined" && SESSION)
          return SESSION.tryEvents || (SESSION.tryEvents = []);
        return state.tryEvents || (state.tryEvents = []);
      }
      function tryAdd() {
        const ps = tryCandidates();
        /* 후보가 하나도 없어도 직접 입력으로 시작할 수 있다 */
        tryTarget().push({
          num: 10,
          pick: ps.length ? { ...ps[0] } : { kind: "custom", name: "", url: "" },
        });
        renderTryEvents();
        if (typeof draw === "function") draw();
      }
      function renderTryEvents() {
        const box = document.getElementById("tryEvents");
        if (!box) return;
        const LIST = tryTarget();
        const all = tryProducts();
        const rows = all.filter((p) => p.kind === "row");
        const offs = all.filter((p) => p.kind === "off");
        const gifts = tryGifts();
        const hint = document.getElementById("tryHint");
        const add = document.getElementById("tryAdd");
        const cnt = document.getElementById("tryCount");
        if (cnt) cnt.textContent = LIST.length ? `${LIST.length}개` : "";
        if (add) add.disabled = false;
        if (hint)
          hint.innerHTML = LIST.length
            ? "인스타 피드에만 들어갑니다. 옵션 외 단품은 시트에서 <b>enabled=FALSE</b> 로 넣어두면 여기에 뜹니다."
            : "경품은 제품군의 제품·선물 목록에서 고르거나 직접 입력합니다. 인스타 피드 전용입니다.";

        const opt = (list, cur) =>
          list
            .map((p) => {
              const k = tryPickKey(p);
              return `<option value="${esc(k)}"${k === cur ? " selected" : ""}>${esc(p.name)}</option>`;
            })
            .join("");

        box.innerHTML = LIST.map((e, i) => {
          const p = tryPick(e);
          const cur = tryPickKey(p);
          const custom = p.kind === "custom";
          return `<div class="evrow" data-i="${i}">
      <span class="evdrag" title="끌어서 순서 변경">⠿</span>
      <div class="evnum"><input type="number" min="1" max="9999" data-f="num" data-i="${i}" value="${e.num}" /><span>명</span></div>
      <button class="evdel" data-i="${i}" title="삭제">×</button>
      <select class="evgift" data-i="${i}">
        ${rows.length ? `<optgroup label="제품군 제품">${opt(rows, cur)}</optgroup>` : ""}
        ${offs.length ? `<optgroup label="옵션 외 단품">${opt(offs, cur)}</optgroup>` : ""}
        ${gifts.length ? `<optgroup label="선물 목록">${opt(gifts, cur)}</optgroup>` : ""}
        <option value="custom"${custom ? " selected" : ""}>직접 입력…</option>
      </select>
      ${
        custom
          ? `<input class="trycus" data-f="cname" data-i="${i}" value="${esc(p.name || "")}" placeholder="경품 이름" />
             <input class="trycus" data-f="curl" data-i="${i}" value="${esc(p.url || "")}" placeholder="사진 주소 (선택)" />`
          : ""
      }
      <div class="evprev">${esc(trySentence(e))}</div>
    </div>`;
        }).join("");

        const after = () => { renderTryEvents(); if (typeof draw === "function") draw(); };
        /* 직접 입력은 타이핑 중 다시 그리면 커서가 튄다 → 캔버스만 갱신 */
        const live = () => { if (typeof draw === "function") draw(); };

        box.querySelectorAll('input[data-f="num"]').forEach((inp) => (inp.onchange = () => {
          LIST[+inp.dataset.i].num = Math.max(1, parseInt(inp.value, 10) || 1); after(); }));
        box.querySelectorAll(".evgift").forEach((s) => (s.onchange = () => {
          const e2 = LIST[+s.dataset.i];
          const v = s.value;
          if (v === "custom") e2.pick = { kind: "custom", name: "", url: "" };
          else {
            const hit = tryCandidates().find((p) => tryPickKey(p) === v);
            if (hit) e2.pick = { ...hit };
          }
          delete e2.rowIdx;
          after();
        }));
        box.querySelectorAll(".trycus").forEach((inp) => (inp.oninput = () => {
          const e2 = LIST[+inp.dataset.i];
          if (!e2.pick || e2.pick.kind !== "custom") return;
          e2.pick[inp.dataset.f === "cname" ? "name" : "url"] = inp.value;
          const pv = inp.closest(".evrow").querySelector(".evprev");
          if (pv) pv.textContent = trySentence(e2);
          live();
        }));
        box.querySelectorAll(".evdel").forEach((b) => (b.onclick = () => {
          LIST.splice(+b.dataset.i, 1); after(); }));

        /* 드래그 정렬 — 이벤트와 같은 방식 */
        let from = null;
        box.querySelectorAll(".evrow").forEach((el) => {
          const h = el.querySelector(".evdrag");
          if (h) h.onmousedown = () => { el.draggable = true; };
          el.ondragstart = (e) => {
            from = +el.dataset.i;
            el.classList.add("dragging");
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", String(from));
          };
          el.ondragend = () => {
            el.draggable = false; from = null;
            box.querySelectorAll(".evrow").forEach((x) =>
              x.classList.remove("dragging", "over-t", "over-b"));
          };
          el.ondragover = (e) => {
            if (from === null) return;
            e.preventDefault();
            const r = el.getBoundingClientRect();
            const aft = e.clientY - r.top > r.height / 2;
            el.classList.toggle("over-b", aft);
            el.classList.toggle("over-t", !aft);
          };
          el.ondragleave = () => el.classList.remove("over-t", "over-b");
          el.ondrop = (e) => {
            e.preventDefault();
            if (from === null) return;
            const r = el.getBoundingClientRect();
            const aft = e.clientY - r.top > r.height / 2;
            let to = +el.dataset.i + (aft ? 1 : 0);
            const item = LIST[from];
            LIST.splice(from, 1);
            if (from < to) to--;
            LIST.splice(to, 0, item);
            from = null;
            after();
          };
        });
      }
      (function initTryEvents() {
        const start = () => {
          const b = document.getElementById("tryAdd");
          if (b) b.onclick = tryAdd;
          renderTryEvents();
          /* 제품군을 바꾸면 경품 목록이 달라진다 */
          if (typeof draw === "function") {
            const _d = draw;
            draw = function () {
              const r = _d.apply(this, arguments);
              /* ⚠ 직접 입력 칸에 타이핑 중이면 다시 그리지 않는다 —
                 DOM 을 새로 만들면 커서가 맨 뒤로 튄다. */
              const a = document.activeElement;
              const box = document.getElementById("tryEvents");
              if (!(box && a && box.contains(a))) renderTryEvents();
              return r;
            };
          }
        };
        if (document.readyState === "loading")
          document.addEventListener("DOMContentLoaded", start);
        else start();
      })();
