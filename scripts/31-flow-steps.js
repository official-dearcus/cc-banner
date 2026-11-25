/* CC 배너 제너레이터 — 31-flow-steps
   상단 진행 표시 (요청 2026-11-25) — "지금 몇 단계인지 · 다음에 무엇을 하는지".

     ① 행사 정보 → ② 데이터 → ③ 템플릿 → ④ 순서 → ⑤ 검수·다운로드     [다음: … →]

   · ①은 처음 화면(행사 설정). 편집 화면에 들어왔으면 끝난 단계다. 누르면 설정이 열린다.
   · ②③④는 좌측 탭과 같은 것이다 — 단계를 눌러도, 탭을 눌러도 같이 움직인다.
   · ⑤는 탭이 아니다. 우측 "상태 · 경고" 를 보라는 표시다(블록을 잠깐 강조한다).
   · ✓ 는 "이 제품군에서 그 단계를 한 번 열어 봤다"는 뜻이다. 내용이 맞는지는 모른다.
     제품군마다 따로 센다. 새로고침하면 지워진다(행사 설정부터 다시 시작하므로).
   · ⑤에서 오류가 없으면 아직 검수 안 한 제품군으로 넘어가는 버튼이 뜬다.

   navSet · gotoGroup 을 감싼다 — 30-nav · 22-setup-flow 보다 뒤에 불러야 한다. */

      const FLOW_STEPS = [
        { key: "setup", label: "행사 정보" },
        { key: "data", label: "데이터", hint: "제품군·가격 카드·이벤트 내용을 확인하세요" },
        { key: "tpl", label: "템플릿", hint: "템플릿·컬러·히어로 이미지를 고르세요" },
        { key: "order", label: "순서", hint: "상세페이지 섹션 순서를 확인하세요" },
        { key: "review", label: "검수 · 다운로드" },
      ];
      let FLOW_REVIEW = false; // ⑤ 단계를 보고 있는가
      const FLOW_SEEN = {}; // { groupKey: { data:true, tpl:true, order:true, review:true } }

      function flowCur() {
        return FLOW_REVIEW ? "review" : NAV_CUR;
      }
      function flowGroups() {
        return (typeof SESSION !== "undefined" && SESSION.groups) || [];
      }
      function flowLabel(k) {
        const g = typeof G === "function" && G()[k];
        return (g && g.label) || k;
      }
      function flowMark() {
        const g = state.group;
        if (!g) return;
        (FLOW_SEEN[g] = FLOW_SEEN[g] || {})[flowCur()] = true;
      }
      function flowErrCount() {
        return document.querySelectorAll("#warnList .warnbox.err").length;
      }
      /* 아직 ⑤까지 안 간 제품군 (지금 것 제외, 고른 순서대로) */
      function flowNextGroup() {
        return flowGroups().find(
          (k) => k !== state.group && !(FLOW_SEEN[k] && FLOW_SEEN[k].review),
        );
      }
      function flowGo(key) {
        if (key === "setup") return navGoSetup();
        if (key === "review") {
          FLOW_REVIEW = true;
          flowRender();
          const wb = document.getElementById("warnBlock");
          if (wb) {
            wb.scrollIntoView({ block: "nearest" });
            wb.classList.remove("flash");
            void wb.offsetWidth;
            wb.classList.add("flash");
          }
          return;
        }
        navSet(key); // 감싼 navSet 이 FLOW_REVIEW 를 끄고 다시 그린다
      }
      function flowRender() {
        const host = document.getElementById("flowSteps");
        if (!host) return;
        flowMark();
        const cur = flowCur();
        const seen = FLOW_SEEN[state.group] || {};
        const ci = FLOW_STEPS.findIndex((s) => s.key === cur);
        const steps = FLOW_STEPS.map((s, i) => {
          const done = s.key === "setup" || (seen[s.key] && s.key !== cur);
          const cls = s.key === cur ? "cur" : done ? "done" : "";
          return (
            (i ? '<i class="fsep"></i>' : "") +
            `<button type="button" class="fstep ${cls}" data-step="${s.key}"` +
            (s.key === cur ? ' aria-current="step"' : "") +
            `><span class="fnum">${done ? "✓" : i + 1}</span>${esc(s.label)}</button>`
          );
        }).join("");

        /* 다음 할 일 */
        let hint = "",
          btn = "";
        const groups = flowGroups();
        const gi = groups.indexOf(state.group);
        const gtxt =
          groups.length > 1 && gi >= 0
            ? `<span class="fgrp">제품군 ${gi + 1}/${groups.length} · ${esc(flowLabel(state.group))}</span>`
            : "";
        if (cur === "review") {
          const n = flowErrCount();
          const ng = flowNextGroup();
          if (n) {
            hint = `<span class="fhint err">오류 ${n}건 — 우측 상태·경고를 먼저 해결하세요</span>`;
          } else if (ng) {
            hint = `<span class="fhint">이 제품군은 오류가 없습니다</span>`;
            btn = `<button type="button" class="fnext" data-group="${esc(ng)}">다음 제품군: ${esc(flowLabel(ng))} →</button>`;
          } else {
            hint = `<span class="fhint ok">${groups.length > 1 ? "모든 제품군을 확인했습니다" : "오류가 없습니다"} — 우측 아래 [다운로드]</span>`;
          }
        } else {
          const s = FLOW_STEPS[ci] || FLOW_STEPS[1];
          const nx = FLOW_STEPS[ci + 1];
          hint = `<span class="fhint">${esc(s.hint || "")}</span>`;
          if (nx)
            btn = `<button type="button" class="fnext" data-step="${nx.key}">다음: ${esc(nx.label)} →</button>`;
        }
        host.innerHTML = `<div class="fsteps">${steps}</div><div class="fnextwrap">${gtxt}${hint}${btn}</div>`;
        host.querySelectorAll("[data-step]").forEach((b) => {
          b.onclick = () => flowGo(b.dataset.step);
        });
        const gb = host.querySelector("[data-group]");
        if (gb)
          gb.onclick = () => {
            /* 탭을 먼저 옮긴다 — 제품군을 먼저 바꾸면 새 제품군에 "순서 ✓" 가 찍힌다 */
            FLOW_REVIEW = false;
            navSet("data");
            gotoGroup(gb.dataset.group);
          };
      }

      (function initFlow() {
        const start = () => {
          /* 좌측 탭을 누르면 ⑤에서 빠져나온다 */
          const nav0 = navSet;
          navSet = function (key) {
            const t = NAV_TABS.find((x) => x.key === key);
            if (t && !t.setup) FLOW_REVIEW = false;
            const r = nav0.apply(this, arguments);
            flowRender();
            return r;
          };
          const go0 = gotoGroup;
          gotoGroup = function () {
            const before = state.group;
            const r = go0.apply(this, arguments);
            if (state.group !== before) FLOW_REVIEW = false;
            flowRender();
            return r;
          };
          /* 경고 목록이 바뀌면(가격 수정 등) 오류 건수·안내를 다시 맞춘다 */
          const wl = document.getElementById("warnList");
          if (wl && typeof MutationObserver !== "undefined")
            new MutationObserver(() => flowRender()).observe(wl, { childList: true });
          flowRender();
        };
        if (document.readyState === "loading")
          document.addEventListener("DOMContentLoaded", start);
        else start();
      })();
