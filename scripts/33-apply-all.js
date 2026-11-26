/* CC 배너 제너레이터 — 33-apply-all
   템플릿 탭 "다른 제품군에도 적용" (요청 2026-11-26)

   지금 제품군의 템플릿·컬러를, 체크한 다른 제품군에 한 번에 적용한다.
   설문에서 "전부 같게 맞춘다 / 제품군마다 다르게 / 욕실화만 따로" 가 다 나왔다 →
   전체 일괄도 아니고 하나씩도 아닌, 고른 것만.

   · 대상은 이 행사에 넣은 제품군(SESSION.groups) 중 지금 것을 뺀 나머지.
   · 적용되는 것: 템플릿(01·02·03) · 컬러.  히어로 이미지는 제품군마다 달라 넘기지 않는다
     — 템플릿이 바뀐 제품군은 평소 템플릿을 바꿀 때처럼 히어로를 새로 고른다(switchTpl).
   · 그 템플릿이 없는 제품군은 체크할 수 없다("03 없음"). 컬러가 없으면 템플릿만 바뀐다.
   · 가격 카드·문구 등 편집한 내용은 그대로 남는다.
   · 적용받은 제품군은 상단의 "확인 완료" 가 풀린다(31-flow-steps).
   하는 일: 대상 제품군을 하나씩 열어(gotoGroup) 평소 버튼과 같은 함수로 바꾸고 돌아온다.
   ⚠ 히어로 로드(pickHero)는 비동기다. 끝나기 전에 다른 제품군으로 넘어가면 그림이
     엉뚱한 제품군에 붙는다 → 그 사이에 불린 pickHero 를 모아 끝날 때까지 기다린다. */

      const APPLY_PICK = {}; // { groupKey: false } — 기본은 체크. 끈 것만 기억한다
      let APPLY_BUSY = false;
      let APPLY_MSG = "";

      function applyTargets() {
        const gs = (typeof SESSION !== "undefined" && SESSION.groups) || [];
        const all = typeof G === "function" ? G() : {};
        return gs
          .filter((k) => k !== state.group)
          .map((k) => {
            const g = all[k] || {};
            const slot = SESSION.slots && SESSION.slots[k];
            const hasTpl = (g.templates || []).includes(state.tpl);
            const th = hasTpl ? themesForKey(k, state.tpl) || {} : {};
            return {
              key: k,
              label: g.label || k,
              hasTpl,
              hasTheme: !!th[state.theme],
              same: !!slot && slot.tpl === state.tpl && slot.theme === state.theme,
              now: slot ? `${slot.tpl || "—"} · ${applyThemeLabel(k, slot.tpl, slot.theme)}` : "아직 안 열어봄",
            };
          });
      }
      function applyThemeLabel(k, tpl, theme) {
        const t = (tpl && themesForKey(k, tpl)) || {};
        return (t[theme] && t[theme].label) || theme || "—";
      }
      function renderApplyAll() {
        const blk = document.getElementById("applyBlock");
        const host = document.getElementById("applyList");
        if (!blk || !host) return;
        const list = state.tpl ? applyTargets() : [];
        blk.hidden = !list.length;
        if (!list.length) return;
        const curTxt = `${state.tpl} · ${applyThemeLabel(state.group, state.tpl, state.theme)}`;
        /* 고를 수 있는 것 = 그 템플릿이 있고, 아직 같은 조합이 아닌 제품군 */
        const able = list.filter((t) => t.hasTpl && !t.same);
        const on = able.filter((t) => APPLY_PICK[t.key] !== false);
        host.innerHTML =
          `<div class="hint">지금 제품군의 템플릿·컬러 <b>${esc(curTxt)}</b> 조합을 체크한 제품군에 적용합니다. 히어로 이미지·가격 카드는 넘기지 않습니다.</div>` +
          `<div class="applylist">` +
          list
            .map(
              (t) =>
                `<label class="applyrow${t.hasTpl && !t.same ? "" : " off"}"><input type="checkbox" data-k="${esc(t.key)}"${t.hasTpl && !t.same && APPLY_PICK[t.key] !== false ? " checked" : ""}${t.hasTpl && !t.same && !APPLY_BUSY ? "" : " disabled"} />` +
                `<span class="anm">${esc(t.label)}</span>` +
                `<span class="anow">${
                  !t.hasTpl
                    ? `템플릿 ${esc(state.tpl)} 없음`
                    : t.same
                      ? "이미 같음"
                      : esc(t.now) + (t.hasTheme ? "" : " · 이 컬러 없음(템플릿만)")
                }</span></label>`,
            )
            .join("") +
          `</div>` +
          `<div class="applyact"><button type="button" class="mini" id="applyAllChk"${APPLY_BUSY || !able.length ? " disabled" : ""}>${able.length && on.length === able.length ? "전체 해제" : "전체 선택"}</button>` +
          `<button type="button" class="btn primary" id="applyGo"${on.length && !APPLY_BUSY ? "" : " disabled"}>${APPLY_BUSY ? "적용 중…" : `선택한 ${on.length}개에 적용`}</button></div>` +
          (APPLY_MSG ? `<div class="hint applymsg">${esc(APPLY_MSG)}</div>` : "");
        host.querySelectorAll("input[data-k]").forEach((c) => {
          c.onchange = () => {
            APPLY_PICK[c.dataset.k] = c.checked;
            APPLY_MSG = "";
            renderApplyAll();
          };
        });
        const allBtn = document.getElementById("applyAllChk");
        if (allBtn)
          allBtn.onclick = () => {
            const allOn = able.every((t) => APPLY_PICK[t.key] !== false);
            able.forEach((t) => (APPLY_PICK[t.key] = !allOn));
            APPLY_MSG = "";
            renderApplyAll();
          };
        const go = document.getElementById("applyGo");
        if (go) go.onclick = () => applyToChecked(on.map((t) => t.key));
      }

      async function applyToChecked(keys) {
        if (APPLY_BUSY || !keys.length) return;
        const back = state.group,
          tpl = state.tpl,
          theme = state.theme;
        APPLY_BUSY = true;
        APPLY_MSG = "";
        renderApplyAll();
        /* 그 사이에 시작된 히어로 로드를 모은다 */
        const pend = [];
        const ph0 = pickHero;
        pickHero = function () {
          const p = ph0.apply(this, arguments);
          if (p && p.then) pend.push(p.catch(() => {}));
          return p;
        };
        const settle = async () => {
          const ps = pend.splice(0);
          if (!ps.length) return;
          await Promise.race([
            Promise.all(ps),
            new Promise((r) => setTimeout(r, 8000)),
          ]);
        };
        let n = 0;
        try {
          for (const k of keys) {
            gotoGroup(k);
            await settle();
            if (state.group !== k) continue;
            const g = G()[k] || {};
            if (!(g.templates || []).includes(tpl)) continue;
            if (state.tpl !== tpl) switchTpl(tpl);
            if (state.theme !== theme && themesFor(state.tpl)[theme]) {
              const sw = document.querySelector(`#themeSw .sw[data-k="${theme}"]`);
              if (sw) sw.click(); // 컬러 버튼과 같은 길(히어로 매핑 포함)
            }
            await settle();
            SESSION.slots[k] = slotSnap();
            if (typeof flowUnconfirm === "function") flowUnconfirm(k);
            n++;
          }
        } finally {
          pickHero = ph0;
          gotoGroup(back);
          APPLY_BUSY = false;
          APPLY_MSG = `${n}개 제품군에 적용했습니다.`;
          renderApplyAll();
          if (typeof flowRender === "function") flowRender();
        }
      }

      (function initApplyAll() {
        const start = () => {
          /* 템플릿·컬러·제품군이 바뀌면 목록을 다시 그린다 */
          const go0 = gotoGroup;
          gotoGroup = function () {
            const r = go0.apply(this, arguments);
            if (!APPLY_BUSY) {
              APPLY_MSG = "";
              renderApplyAll();
            }
            return r;
          };
          ["themeSw", "tplList"].forEach((id) => {
            const el = document.getElementById(id);
            if (el && typeof MutationObserver !== "undefined")
              new MutationObserver(() => {
                if (!APPLY_BUSY) renderApplyAll();
              }).observe(el, { childList: true });
          });
          renderApplyAll();
        };
        if (document.readyState === "loading")
          document.addEventListener("DOMContentLoaded", start);
        else start();
      })();
