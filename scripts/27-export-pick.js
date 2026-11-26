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
      /* 고른 항목이 하나도 없으면 다운로드를 막는다.
         secs 를 넘기면 다시 계산하지 않는다(renderDlPick 이 이미 갖고 있다). */
      function dlCount(pre) {
        const secs = (pre || dlSections()).map((s) => s.key);
        return dlPick().filter(
          (k) =>
            DL_DEFAULT.includes(k) ||
            (k.startsWith("sec:") && secs.includes(k.split(":")[1])),
        ).length;
      }

      /* ---------- 제품군 고르기 (요청 2026-11-26) ----------
         행사에 제품군이 둘 이상이면 어느 제품군을 받을지도 고른다.
         "욕실화만 먼저" · "나머지만 묶어서" 처럼 나눠 받을 때 쓴다.
         끈 것만 기억한다(DL_GROUP_OFF) → 새로 넣은 제품군은 기본으로 켜져 있다.
         받을 항목(상세·썸네일·피드)은 전처럼 모든 제품군에 같이 적용된다. */
      const DL_GROUP_OFF = {};
      function dlSessionGroups() {
        return typeof SESSION !== "undefined" && SESSION && SESSION.started
          ? SESSION.groups || []
          : [];
      }
      /* 받을 제품군 — 19-export 의 buildSessionImages 가 이 목록만 돈다 */
      function dlGroups() {
        return dlSessionGroups().filter((k) => !DL_GROUP_OFF[k]);
      }
      function dlGroupLabel(k) {
        const g = typeof G === "function" && G()[k];
        return (g && g.label) || k;
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
        const sg = dlSessionGroups();
        const pickG = dlGroups();
        const grpHtml =
          sg.length > 1
            ? `<div class="dlgrp">제품군</div>` +
              sg
                .map(
                  (k) =>
                    `<label class="dlrow"><input type="checkbox" data-dg="${esc(k)}"${
                      DL_GROUP_OFF[k] ? "" : " checked"
                    } /> ${esc(dlGroupLabel(k))}</label>`,
                )
                .join("") +
              `<div class="dlacts dlgacts">
                 <button type="button" id="dlGAll">전체</button>
                 <button type="button" id="dlGCur">지금 제품군만</button>
               </div>`
            : "";
        box.innerHTML =
          grpHtml +
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
        box.querySelectorAll("input[data-dg]").forEach((c) => {
          c.onchange = () => {
            if (c.checked) delete DL_GROUP_OFF[c.dataset.dg];
            else DL_GROUP_OFF[c.dataset.dg] = true;
            renderDlPick();
          };
        });
        const g1 = box.querySelector("#dlGAll");
        const g2 = box.querySelector("#dlGCur");
        if (g1)
          g1.onclick = () => {
            sg.forEach((k) => delete DL_GROUP_OFF[k]);
            renderDlPick();
          };
        if (g2)
          g2.onclick = () => {
            sg.forEach((k) => {
              if (k === state.group) delete DL_GROUP_OFF[k];
              else DL_GROUP_OFF[k] = true;
            });
            renderDlPick();
          };
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
        const n = dlCount(secs);
        const tog = document.getElementById("dlPickBtn");
        const part = sg.length > 1 && pickG.length < sg.length;
        if (tog)
          tog.textContent =
            sg.length > 1
              ? `받을 항목 (${n}) · 제품군 ${pickG.length}/${sg.length}`
              : `받을 항목 (${n})`;
        const dl = document.getElementById("dlBtn");
        /* 만드는 중에는 19-export 가 버튼 글자("○○ 생성 중…")를 쥐고 있다 — 건드리지 않는다 */
        if (dl && !dl.dataset.busy) {
          const noG = sg.length > 1 && pickG.length === 0;
          dl.disabled = n === 0 || noG;
          dl.textContent = noG
            ? "받을 제품군을 고르세요"
            : n === 0
              ? "받을 항목을 고르세요"
              : part
                ? `다운로드 (ZIP) · ${pickG.length}개 제품군`
                : "다운로드 (ZIP)";
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
              /* 목록 안의 버튼([전체]·[전부] 등)은 누르는 순간 목록이 새로 그려져
                 DOM 에서 빠진다 → "바깥"으로 보여 닫히던 것을 막는다 */
              if (!document.contains(e.target)) return;
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
