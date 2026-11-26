/* CC 배너 제너레이터 — 31-flow-steps
   상단 진행 표시 — 제품군별 "확인 상태" (2026-11-26 재구성)

   2026-11-25 판은 ① 행사 정보 → ② 데이터 → ③ 템플릿 → ④ 순서 → ⑤ 검수 의 한 줄 순서였다.
   실사용자 설문(3명)에서 작업 순서가 사람마다, 제품군마다 달랐다
   ("욕실화는 따로, 나머지는 묶어서" · "한 번에" · "둘 다 무방").
   → 순서를 정해 주지 않는다. 무엇이 남았는지만 보여 준다.

     [누볼라 욕실화 ✓] [처마 ●] [에어비움 !2]            [확인 완료 · 다음: 에어비움 →]

   칩 상태
     todo   아직 확인 안 함 (회색 점)
     done   ✓ 사용자가 [확인 완료] 를 눌렀다
     err    ! N — 그 제품군을 마지막으로 열었을 때의 오류 건수
     cur    지금 열려 있는 제품군 (테두리)
   · 칩을 누르면 그 제품군으로 간다(편집 내용 유지 — gotoGroup).
   · [확인 완료] 는 오류가 0건일 때만 누를 수 있다. 누르면 아직 확인 안 한 다음 제품군으로 간다.
   · 확인한 제품군도 다시 열어 고칠 수 있다. [확인 취소] 로 되돌린다.
   · 템플릿·컬러를 일괄 적용(33-apply-all)받은 제품군은 확인이 풀린다 — 모양이 바뀌었으므로.
   · 새로고침하면 지워진다(행사 설정부터 다시 시작하므로).
   ⚠ 오류 건수는 "그 제품군을 열었을 때" 센 값이다. 안 열어본 제품군은 모른다(회색).
     다운로드는 전처럼 제품군을 하나씩 열어 다시 검증한다(19-export).

   좌측 탭(데이터·템플릿·순서)은 순서가 아니라 메뉴다 — 건드리지 않는다.
   gotoGroup 을 감싼다 — 22-setup-flow 보다 뒤에 불러야 한다. */

      const FLOW_DONE = {}; // { groupKey: true }
      const FLOW_ERR = {}; // { groupKey: 마지막으로 본 오류 건수 }

      function flowGroups() {
        return (typeof SESSION !== "undefined" && SESSION.groups) || [];
      }
      function flowLabel(k) {
        const g = typeof G === "function" && G()[k];
        return (g && g.label) || k;
      }
      function flowErrCount() {
        return document.querySelectorAll("#warnList .warnbox.err").length;
      }
      /* 아직 확인 안 한 제품군 — 지금 것 다음부터 한 바퀴 */
      function flowNextGroup() {
        const gs = flowGroups();
        const i = gs.indexOf(state.group);
        for (let n = 1; n < gs.length; n++) {
          const k = gs[(i + n) % gs.length];
          if (!FLOW_DONE[k]) return k;
        }
        return null;
      }
      function flowUnconfirm(k) {
        delete FLOW_DONE[k];
      }
      function flowFlashWarn() {
        const wb = document.getElementById("warnBlock");
        if (!wb) return;
        wb.scrollIntoView({ block: "nearest" });
        wb.classList.remove("flash");
        void wb.offsetWidth;
        wb.classList.add("flash");
      }
      function flowRender() {
        const host = document.getElementById("flowSteps");
        if (!host) return;
        const gs = flowGroups();
        const cur = state.group;
        if (!gs.length || !cur) {
          host.innerHTML = "";
          return;
        }
        const nErr = flowErrCount();
        FLOW_ERR[cur] = nErr;
        if (nErr) flowUnconfirm(cur); // 확인한 뒤에 오류가 생겼다

        const chips = gs
          .map((k) => {
            const e = FLOW_ERR[k] || 0;
            const st = e ? "err" : FLOW_DONE[k] ? "done" : "todo";
            const mark = e ? "!" : FLOW_DONE[k] ? "✓" : "";
            const tip = e
              ? `오류 ${e}건`
              : FLOW_DONE[k]
                ? "확인 완료"
                : "아직 확인 안 함";
            return (
              `<button type="button" class="fchip ${st}${k === cur ? " cur" : ""}" data-group="${esc(k)}" title="${esc(flowLabel(k))} — ${tip}"` +
              (k === cur ? ' aria-current="true"' : "") +
              `><span class="fdot">${mark}</span><span class="fname">${esc(flowLabel(k))}</span>${e ? `<span class="fcnt">${e}</span>` : ""}</button>`
            );
          })
          .join("");
        const nDone = gs.filter((k) => FLOW_DONE[k]).length;
        const count = `<span class="fcount">확인 ${nDone}/${gs.length}</span>`;

        const ng = flowNextGroup();
        let act = "";
        if (nErr) {
          act = `<button type="button" class="fnext err" data-act="warn">오류 ${nErr}건 — 먼저 해결하세요</button>`;
        } else if (!FLOW_DONE[cur]) {
          act = `<button type="button" class="fnext" data-act="done">확인 완료${ng ? ` · 다음: ${esc(flowLabel(ng))} →` : ""}</button>`;
        } else {
          act =
            `<button type="button" class="fundo" data-act="undo">확인 취소</button>` +
            (ng
              ? `<button type="button" class="fnext" data-act="next">다음: ${esc(flowLabel(ng))} →</button>`
              : `<span class="fhint ok">모두 확인했습니다 — 우측 아래 [다운로드]</span>`);
        }
        host.innerHTML = `<div class="fchips">${chips}</div><div class="fnextwrap">${count}${act}</div>`;

        host.querySelectorAll(".fchip").forEach((b) => {
          b.onclick = () => gotoGroup(b.dataset.group);
        });
        host.querySelectorAll("[data-act]").forEach((b) => {
          b.onclick = () => {
            const a = b.dataset.act;
            if (a === "warn") return flowFlashWarn();
            if (a === "undo") {
              flowUnconfirm(cur);
              return flowRender();
            }
            if (a === "done") FLOW_DONE[cur] = true;
            const to = flowNextGroup();
            if (to) gotoGroup(to);
            else flowRender();
          };
        });
        const c = host.querySelector(".fchip.cur");
        if (c && c.scrollIntoView) c.scrollIntoView({ block: "nearest", inline: "nearest" });
      }

      (function initFlow() {
        const start = () => {
          const go0 = gotoGroup;
          gotoGroup = function () {
            const r = go0.apply(this, arguments);
            flowRender();
            return r;
          };
          /* 경고 목록이 바뀌면(가격 수정 · 제품군 전환 등) 오류 건수를 다시 맞춘다 */
          const wl = document.getElementById("warnList");
          if (wl && typeof MutationObserver !== "undefined")
            new MutationObserver(() => flowRender()).observe(wl, { childList: true });
          flowRender();
        };
        if (document.readyState === "loading")
          document.addEventListener("DOMContentLoaded", start);
        else start();
      })();
