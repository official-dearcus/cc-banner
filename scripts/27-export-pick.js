/* CC 배너 제너레이터 — 27-export-pick
   무엇을 받을지 고른다.

   예전에는 [전체 다운로드] 하나뿐이라 이벤트 배너 한 장만 필요해도
   ZIP 을 통째로 받아 안에서 찾아야 했다.
   여기서 고른 것만 만들고 ZIP 에 담는다 — 안 고른 건 그리지도 않는다.

   항목
     detail  상세페이지 한 장 (전체)
     thumb   썸네일
     feed    인스타 피드 전체
     sec:<키>:d   섹션별 상세  (히어로·옵션·향·컬러·이벤트)
     sec:<키>:f   섹션별 피드
   섹션 목록은 26-section-order 를 그대로 쓰므로 순서를 바꾸면 따라간다. */

      const DL_BASE = [
        { key: "detail", label: "상세페이지" },
        { key: "thumb", label: "썸네일" },
        { key: "feed", label: "인스타 피드" },
      ];
      const DL_DEFAULT = ["detail", "thumb", "feed"];

      function dlPick() {
        if (!Array.isArray(state.dlPick)) state.dlPick = DL_DEFAULT.slice();
        return state.dlPick;
      }
      function dlHas(k) { return dlPick().includes(k); }
      function dlToggle(k, on) {
        const list = dlPick().filter((x) => x !== k);
        if (on) list.push(k);
        state.dlPick = list;
        renderDlPick();
      }
      /* 지금 제품군·템플릿에서 실제로 나오는 섹션만 (높이 0 이면 뺀다) */
      function dlSections() {
        try {
          return typeof exportSections === "function" ? exportSections() : [];
        } catch (e) {
          return [];
        }
      }
      /* 고른 항목이 하나도 없으면 다운로드를 막는다 */
      function dlCount() {
        const secs = dlSections().map((s) => s.key);
        return dlPick().filter(
          (k) =>
            DL_DEFAULT.includes(k) ||
            (k.startsWith("sec:") && secs.includes(k.split(":")[1])),
        ).length;
      }

      /* ---------- UI ---------- */
      function renderDlPick() {
        const box = document.getElementById("dlPickBox");
        if (!box) return;
        const secs = dlSections();
        const row = (k, label) =>
          `<label class="dlrow"><input type="checkbox" data-dk="${k}"${
            dlHas(k) ? " checked" : ""
          } /> ${esc(label)}</label>`;
        box.innerHTML =
          `<div class="dlgrp">기본</div>` +
          DL_BASE.map((b) => row(b.key, b.label)).join("") +
          /* 상세가 없는 섹션(써볼래요)은 상세 목록에서 뺀다 */
          (secs.some((s) => s.detailH > 0)
            ? `<div class="dlgrp">섹션별 · 상세</div>` +
              secs
                .filter((s) => s.detailH > 0)
                .map((s) => row(`sec:${s.key}:d`, secLabel(s.key)))
                .join("")
            : "") +
          (secs.some((s) => s.feedN > 0)
            ? `<div class="dlgrp">섹션별 · 피드</div>` +
              secs
                .filter((s) => s.feedN > 0)
                .map((s) => row(`sec:${s.key}:f`, secLabel(s.key)))
                .join("")
            : "") +
          `<div class="dlacts">
             <button type="button" id="dlAllOn">전부</button>
             <button type="button" id="dlAllOff">해제</button>
             <button type="button" id="dlReset">기본만</button>
           </div>`;
        box.querySelectorAll("input[data-dk]").forEach((c) => {
          c.onchange = () => dlToggle(c.dataset.dk, c.checked);
        });
        const setAll = (on) => {
          const all = DL_BASE.map((b) => b.key).concat(
            secs.flatMap((s) =>
              [s.detailH > 0 ? `sec:${s.key}:d` : null,
               s.feedN > 0 ? `sec:${s.key}:f` : null].filter(Boolean),
            ),
          );
          state.dlPick = on ? all : [];
          renderDlPick();
        };
        const b1 = box.querySelector("#dlAllOn");
        const b2 = box.querySelector("#dlAllOff");
        const b3 = box.querySelector("#dlReset");
        if (b1) b1.onclick = () => setAll(true);
        if (b2) b2.onclick = () => setAll(false);
        if (b3) b3.onclick = () => { state.dlPick = DL_DEFAULT.slice(); renderDlPick(); };

        /* 버튼 글자에 개수를 보여준다 — 열어보지 않아도 몇 개인지 안다 */
        const n = dlCount();
        const tog = document.getElementById("dlPickBtn");
        if (tog) tog.textContent = `받을 항목 (${n})`;
        const dl = document.getElementById("dlBtn");
        if (dl) {
          dl.disabled = n === 0;
          dl.textContent = n === 0 ? "받을 항목을 고르세요" : "다운로드 (ZIP)";
        }
      }
      (function initDlPick() {
        const start = () => {
          const tog = document.getElementById("dlPickBtn");
          const box = document.getElementById("dlPickBox");
          if (tog && box) {
            tog.onclick = (e) => {
              e.stopPropagation();
              box.hidden = !box.hidden;
              if (!box.hidden) renderDlPick();
            };
            /* 바깥을 누르면 닫힌다 */
            document.addEventListener("click", (e) => {
              if (box.hidden) return;
              if (box.contains(e.target) || e.target === tog) return;
              box.hidden = true;
            });
          }
          renderDlPick();
          /* 제품군·템플릿이 바뀌면 쓰이는 섹션이 달라진다 */
          if (typeof draw === "function") {
            const _d = draw;
            draw = function () {
              const r = _d.apply(this, arguments);
              renderDlPick();
              return r;
            };
          }
        };
        if (document.readyState === "loading")
          document.addEventListener("DOMContentLoaded", start);
        else start();
      })();
