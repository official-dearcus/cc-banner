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
      /* 문장 (요청 2026-09-02)
           이벤트에 선정되신 분께 [제품명] [개수][을/를] 증정드립니다.
         이벤트와 문장 구조가 달라 evTokens 에 _p1 / _tail 로 넘긴다.
         인원(num)은 문장에서 빠지고 제목의 "(N명)" 에만 남는다. */
      const TRY_LEAD = "이벤트에 선정되신 분께";
      const TRY_TAIL = "증정드립니다.";
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
           off     같은 제품군의 enabled=FALSE 행 (옵션엔 안 나오는 단품)
           xrow    다른 제품군의 옵션 제품 (요청 2026-10-28)
           custom  직접 입력 — 이름과 사진 주소를 그 자리에서 넣는다
         ⚠ GiftMaster 선물 목록은 드롭다운에 안 띄운다 (요청 2026-09-03).
           써볼래요 경품은 "그 제품군의 제품" 이라 이벤트 사은품과 섞이면 안 된다.
           예전에 gift 로 저장된 값은 tryProduct 가 그대로 읽어 준다(안 깨진다).
         값은 e.pick 에 {kind, …} 로 들어간다.
         ⚠ 예전 저장분은 e.rowIdx(숫자) 였다 → tryPick() 이 알아서 바꿔 준다. */
      function tryProducts() {
        const g = (typeof G === "function" && G()[state.group]) || {};
        const nm = (r) => (typeof rowName === "function" ? rowName(r) : r.name || "");
        const on = (g.rows || []).map((r, i) => ({
          kind: "row", i, name: nm(r),
          url: r.thumbUrl || "", feedUrl: r.feedThumbUrl || "",
        }));
        /* enabled=FALSE 인 행 — 옵션엔 안 나오지만 경품으로는 쓴다.
           i 는 offRows 안의 번호라 kind 를 나눠 저장한다. */
        const off = (g.offRows || []).map((r, i) => ({
          kind: "off", i, name: nm(r),
          url: r.thumbUrl || "", feedUrl: r.feedThumbUrl || "",
        }));
        return on.concat(off);
      }
      /* 다른 제품군의 제품 — 가격카드 추가와 같은 생각 (요청 2026-10-28).
         제품군키(g)를 같이 들고 있어야 나중에 어느 시트 행인지 찾을 수 있다.
         enabled=FALSE 단품은 넣지 않는다 — 제 제품군에서도 옵션 목록엔 안 뜨는 행이라
         남의 제품군 것까지 섞으면 목록이 걷잡을 수 없이 길어진다. */
      function tryOtherProducts() {
        const all = (typeof G === "function" && G()) || {};
        const nm = (r) => (typeof rowName === "function" ? rowName(r) : r.name || "");
        const out = [];
        for (const k of Object.keys(all)) {
          if (k === state.group) continue;
          const g = all[k] || {};
          (g.rows || []).forEach((r, i) =>
            out.push({
              kind: "xrow", g: k, gl: g.label || k, i, name: nm(r),
              url: r.thumbUrl || "", feedUrl: r.feedThumbUrl || "",
            }),
          );
        }
        return out;
      }
      /* 제품군별로 묶어서 돌려준다 — 드롭다운 optgroup 하나가 제품군 하나 */
      function tryOtherGrouped() {
        const by = new Map();
        for (const p of tryOtherProducts()) {
          if (!by.has(p.g)) by.set(p.g, { label: p.gl, list: [] });
          by.get(p.g).list.push(p);
        }
        return [...by.values()];
      }
      /* 목록에서 "다른 제품군"을 펼쳐 두었나. 목록을 닫으면 다시 접는다. */
      let TRY_OTHERS = false;
      /* 지금 경품 목록이 열려 있는 행 번호. -1 이면 전부 닫힘.
         기본 <select> 는 한 칸 고르면 창이 닫혀서 "펼치기"를 누르는 순간
         목록이 사라졌다 (2026-10-28 신고). 직접 만든 패널이라 열어 둘 수 있다. */
      let TRY_OPEN = -1;

      /* 드롭다운에는 안 뜨지만, 예전에 gift 로 저장된 값을 읽으려면 필요하다 */
      function tryGifts() {
        const list = typeof evGifts === "function" ? evGifts() : [];
        return list.map((x) => ({
          kind: "gift",
          key: x.giftKey,
          name: x.label || x.giftKey,
          url: x.url || "",
          feedUrl: x.feedUrl || "",
        }));
      }
      /* 고른 값을 되찾을 때 쓰는 전체 후보 — 선물 목록은 뺀다 (요청 2026-09-03).
         ⚠ 화면에 "접혀" 있어도 여기엔 다른 제품군을 넣어 둔다.
           접힌 상태에서 저장된 값을 못 찾으면 경품이 빈칸이 된다. */
      function tryCandidates() {
        return tryProducts().concat(tryOtherProducts());
      }
      /* 저장값 → {kind,…} 로 정규화 (구형 rowIdx 호환) */
      function tryPick(e) {
        if (e && e.pick && e.pick.kind) return e.pick;
        return { kind: "row", i: (e && e.rowIdx) | 0 };
      }
      function tryPickKey(p) {
        if (p.kind === "gift") return `gift:${p.key}`;
        if (p.kind === "custom") return "custom";
        if (p.kind === "xrow") return `xrow:${p.g}:${p.i}`;
        if (p.kind === "off") return `off:${p.i}`;
        return `row:${p.i}`;
      }
      /* 고른 값 → {name, url} */
      function tryProduct(e) {
        const p = tryPick(e);
        if (p.kind === "custom")
          return { name: p.name || "", url: p.url || "", feedUrl: p.feedUrl || "" };
        if (p.kind === "gift") {
          const hit = tryGifts().find((x) => x.key === p.key);
          return hit || { name: p.name || "", url: p.url || "", feedUrl: p.feedUrl || "" };
        }
        /* 다른 제품군 제품 — 저장된 제품군키로 시트를 다시 본다.
           이름·가격이 시트에서 바뀌면 배너도 따라간다. 행이 사라졌으면 저장값으로 버틴다. */
        if (p.kind === "xrow") {
          const g2 = (typeof G === "function" && G()[p.g]) || {};
          const r = (g2.rows || [])[p.i | 0];
          if (r)
            return {
              name: typeof rowName === "function" ? rowName(r) : r.name || "",
              url: r.thumbUrl || "", feedUrl: r.feedThumbUrl || "",
            };
          return { name: p.name || "", url: p.url || "", feedUrl: p.feedUrl || "" };
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
          qty: Math.max(1, parseInt(e.qty, 10) || 1),
          giftLabel: (p && p.name) || "",
          giftUrl: (p && p.url) || "",
          giftFeedUrl: (p && p.feedUrl) || "",
          _title: t.titleLabel,
          _body: t.bodyLabel,
          _p1: TRY_LEAD,
          _tail: TRY_TAIL,
        };
      }
      /* 문장 미리보기 — 배너와 같은 함수를 쓴다 */
      function trySentence(e) {
        const ev = tryAsEvent(e);
        const gift =
          typeof evGiftText === "function" ? evGiftText(ev) : ev.giftLabel;
        const par = typeof evPartOf === "function" ? evPartOf(ev) : "를";
        return `${TRY_LEAD} ${gift}${par} ${TRY_TAIL}`;
      }

      /* ── 피드 ── */
      /* 이벤트와 같은 규칙 — 한 장에 들어가는 만큼 담는다 (evFeedFit) */
      function tryFeedGroups() {
        const l = tryList();
        if (!l.length) return [];
        if (typeof evFeedFit !== "function") return [l];
        /* evFeedFit 은 이벤트 모양을 잰다 → 변환한 뒤 원본으로 되돌린다 */
        const conv = l.map(tryAsEvent);
        return evFeedFit(conv).map((g) => g.map((c) => l[conv.indexOf(c)]));
      }
      function tryFeedCount() { return tryOn() ? tryFeedGroups().length : 0; }
      function tryFeedSlide(ctx, evs, th) {
        if (typeof evFeedSlide !== "function") return;
        /* 배경·글자색을 옵션 피드 슬라이드와 통일한다 (요청 2026-09-02) */
        const skin =
          typeof evOptFeedSkin === "function" ? evOptFeedSkin(th) : {};
        evFeedSlide(ctx, evs.map(tryAsEvent), th, {
          bg: skin.bg,
          ink: skin.ink,
          title: TRY_TITLE,
          titleFont: TRY_TITLE_FONT,
          titleSizeAbs: TRY_TITLE_SIZE, // 피드에 그려지는 실제 크기
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
        const ps = tryProducts(); // 처음 값은 늘 제 제품군 것으로
        /* 후보가 하나도 없어도 직접 입력으로 시작할 수 있다 */
        tryTarget().push({
          num: 10,
          qty: 1,
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
        const others = tryOtherGrouped();

        const hint = document.getElementById("tryHint");
        const add = document.getElementById("tryAdd");
        const cnt = document.getElementById("tryCount");
        if (cnt) cnt.textContent = LIST.length ? `${LIST.length}개` : "";
        if (add) add.disabled = false;
        if (hint)
          hint.innerHTML = LIST.length
            ? "인스타 피드에만 들어갑니다. 옵션 외 단품은 <b>ProductMaster</b> 에 <b>enabled=FALSE</b> 로 넣어두면 여기에 뜹니다."
            : "경품은 이 제품군의 제품 중에서 고릅니다. 없으면 직접 입력하세요. 인스타 피드 전용입니다.";

        /* 가격카드 추가와 같은 생김새. 보조 줄은 안 넣는다 — 이름만 (요청 2026-10-28) */
        const pk = (list, cur) =>
          list
            .map((p) => {
              const k = tryPickKey(p);
              return `<div class="pk${k === cur ? " on" : ""}" data-v="${esc(k)}">
                <div class="pkname">${esc(p.name)}</div></div>`;
            })
            .join("");
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
      <div class="evnum evqty"><input type="number" min="1" max="20" data-f="qty" data-i="${i}" value="${e.qty || 1}" /><span>개</span></div>
      <button class="evdel" data-i="${i}" title="삭제">×</button>
      <button type="button" class="evgift trygiftbtn" data-i="${i}">
        <span>${esc(custom ? p.name || "직접 입력…" : tryProduct(e).name || "경품 선택")}</span>
        <span class="cv">${TRY_OPEN === i ? "닫기" : "변경"}</span>
      </button>
      ${
        TRY_OPEN === i
          ? `<div class="picker trypick">` +
            (rows.length ? `<div class="pkgroup">제품군 제품</div>${pk(rows, cur)}` : "") +
            (offs.length ? `<div class="pkgroup">옵션 외 단품</div>${pk(offs, cur)}` : "") +
            `<div class="pk custom${custom ? " on" : ""}" data-v="custom" data-i="${i}">
               <div class="pkname">+ 직접 입력</div>
               <div class="pkmeta">이름과 사진 주소를 넣습니다</div></div>` +
            (others.length
              ? `<div class="pk custom" data-v="${TRY_OTHERS ? "__less" : "__more"}" data-i="${i}">
                   <div class="pkname">${TRY_OTHERS ? "−" : "+"} 다른 제품군 추가</div>
                   <div class="pkmeta">${others.length}개 제품군${TRY_OTHERS ? "" : " · 눌러서 펼치기"}</div></div>` +
                (TRY_OTHERS
                  ? others
                      .map((o) => `<div class="pkgroup">${esc(o.label)}</div>${pk(o.list, cur)}`)
                      .join("")
                  : "")
              : "") +
            `</div>`
          : ""
      }
      ${
        custom
          ? `<input class="trycus" data-f="cname" data-i="${i}" value="${esc(p.name || "")}" placeholder="경품 이름" />
             <input class="trycus" data-f="curl" data-i="${i}" value="${esc(p.url || "")}" placeholder="사진 주소 — 상세용 (선택)" />
             <input class="trycus" data-f="cfeed" data-i="${i}" value="${esc(p.feedUrl || "")}" placeholder="사진 주소 — 피드용 (비우면 위와 동일)" />`
          : ""
      }
      <div class="evprev">${esc(trySentence(e))}</div>
    </div>`;
        }).join("");

        const after = () => { renderTryEvents(); if (typeof draw === "function") draw(); };
        /* 직접 입력은 타이핑 중 다시 그리면 커서가 튄다 → 캔버스만 갱신 */
        const live = () => { if (typeof draw === "function") draw(); };

        box.querySelectorAll('input[data-f="num"], input[data-f="qty"]').forEach(
          (inp) => (inp.onchange = () => {
            const f = inp.dataset.f;
            const cap = f === "qty" ? 20 : 9999;
            LIST[+inp.dataset.i][f] =
              Math.min(cap, Math.max(1, parseInt(inp.value, 10) || 1));
            after();
          }),
        );
        /* 목록 열기·닫기 */
        box.querySelectorAll(".trygiftbtn").forEach((b) => (b.onclick = () => {
          const i2 = +b.dataset.i;
          TRY_OPEN = TRY_OPEN === i2 ? -1 : i2;
          if (TRY_OPEN === -1) TRY_OTHERS = false; // 닫으면 다른 제품군도 접는다
          after();
        }));
        /* 목록에서 고르기 */
        box.querySelectorAll(".trypick .pk").forEach((el) => (el.onclick = () => {
          const v = el.dataset.v;
          /* 펼치기·접기는 경품을 고른 게 아니다 — 목록은 열어 둔 채 다시 그린다 */
          if (v === "__more" || v === "__less") {
            TRY_OTHERS = v === "__more";
            after();
            return;
          }
          const e2 = LIST[+(el.closest(".evrow").dataset.i)];
          if (v === "custom") e2.pick = { kind: "custom", name: "", url: "" };
          else {
            const hit = tryCandidates().find((p) => tryPickKey(p) === v);
            if (hit) e2.pick = { ...hit };
          }
          delete e2.rowIdx;
          TRY_OPEN = -1;
          TRY_OTHERS = false;
          after();
        }));
        box.querySelectorAll(".trycus").forEach((inp) => (inp.oninput = () => {
          const e2 = LIST[+inp.dataset.i];
          if (!e2.pick || e2.pick.kind !== "custom") return;
          const key =
            inp.dataset.f === "cname" ? "name"
            : inp.dataset.f === "cfeed" ? "feedUrl"
            : "url";
          e2.pick[key] = inp.value;
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
