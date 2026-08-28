/* CC 배너 제너레이터 — 26-section-order
   상세페이지 섹션 순서를 드래그로 바꾼다.

   그리기는 12-render-nuvola 의 nvDetail 이 이 목록을 따라 돈다.
   각 섹션은 "높이 함수 + 그리기 함수" 한 쌍이라, 순서를 바꿔도
   높이 합계는 그대로다(캔버스 길이는 안 변한다).

   ⚠ 누볼라 렌더러(01·02·03 과 신형 제품군) 전용이다.
     뱀부 01·02 는 구형 렌더러(13-render-core)라 아직 순서 고정이다. */

      /* 섹션 정의 — key 는 저장에 쓰이므로 바꾸지 말 것 */
      const SEC_DEFS = [
        { key: "main", label: "히어로" },
        { key: "option", label: "옵션" },
        { key: "scent", label: "향 안내" },
        { key: "color", label: "컬러 안내" },
        { key: "event", label: "이벤트" },
      ];
      const SEC_DEFAULT = SEC_DEFS.map((s) => s.key);
      function secLabel(k) {
        const d = SEC_DEFS.find((s) => s.key === k);
        return d ? d.label : k;
      }
      /* 저장된 순서를 정리한다 — 모르는 키는 버리고, 빠진 키는 뒤에 붙인다.
         섹션이 새로 생겨도(향 안내처럼) 예전 설정이 깨지지 않는다. */
      function secOrder() {
        const saved = Array.isArray(state.secOrder) ? state.secOrder : [];
        const out = saved.filter((k) => SEC_DEFAULT.includes(k));
        for (const k of SEC_DEFAULT) if (!out.includes(k)) out.push(k);
        return out;
      }
      function setSecOrder(list) {
        state.secOrder = list.slice();
        renderSecOrder();
        if (typeof draw === "function") draw();
      }
      function resetSecOrder() { setSecOrder(SEC_DEFAULT); }

      /* ---------- 패널 UI ---------- */
      function renderSecOrder() {
        const box = document.getElementById("secOrder");
        if (!box) return;
        const blk = document.getElementById("secBlock");
        /* 구형 렌더러(뱀부 01·02)에서는 순서를 못 바꾼다 → 섹션 자체를 숨긴다 */
        const on = typeof nvIsOn === "function" && nvIsOn();
        if (blk) blk.hidden = !on;
        if (!on) return;
        const order = secOrder();
        /* 지금 화면에 실제로 나오는 섹션만 보여준다 (높이 0 이면 회색으로) */
        const h = {
          main: () => (typeof NV !== "undefined" ? NV.MAIN_H : 1),
          option: () => (typeof nvOptionH === "function" ? nvOptionH() : 0),
          scent: () => (typeof nvScentH === "function" ? nvScentH() : 0),
          color: () => (typeof nvColorH === "function" ? nvColorH() : 0),
          event: () => (typeof nvEventH === "function" ? nvEventH() : 0),
        };
        box.innerHTML = order
          .map((k, i) => {
            const live = (h[k] ? h[k]() : 0) > 0;
            return `<div class="secrow${live ? "" : " off"}" data-i="${i}" data-k="${k}">
        <span class="secdrag" title="끌어서 순서 변경">⠿</span>
        <span class="secno">${i + 1}</span>
        <span class="secname">${esc(secLabel(k))}</span>
        ${live ? "" : `<span class="secoff">안 쓰임</span>`}
      </div>`;
          })
          .join("");

        let from = null;
        box.querySelectorAll(".secrow").forEach((el) => {
          const hd = el.querySelector(".secdrag");
          if (hd) hd.onmousedown = () => { el.draggable = true; };
          el.ondragstart = (e) => {
            from = +el.dataset.i;
            el.classList.add("dragging");
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", String(from));
          };
          el.ondragend = () => {
            el.draggable = false; from = null;
            box.querySelectorAll(".secrow").forEach((x) =>
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
            const list = secOrder();
            const item = list[from];
            list.splice(from, 1);
            if (from < to) to--;
            list.splice(to, 0, item);
            from = null;
            setSecOrder(list);
          };
        });
        const rs = document.getElementById("secReset");
        if (rs) {
          const same = order.join() === SEC_DEFAULT.join();
          rs.disabled = same;
          rs.onclick = resetSecOrder;
        }
      }
      (function initSecOrder() {
        const start = () => {
          renderSecOrder();
          /* 템플릿·제품군을 바꾸면 쓰이는 섹션이 달라진다 → 다시 그린다 */
          if (typeof draw === "function") {
            const _d = draw;
            draw = function () {
              const r = _d.apply(this, arguments);
              renderSecOrder();
              return r;
            };
          }
        };
        if (document.readyState === "loading")
          document.addEventListener("DOMContentLoaded", start);
        else start();
      })();
