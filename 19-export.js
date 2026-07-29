/* CC 배너 제너레이터 — 11-rows-picker
   원본 index.html 에서 기능별로 분리. 로드 순서가 곧 실행 순서다. */
      /* ---------- 카드 편집 ---------- */
      /* 제품 카탈로그 = 시트(ProductMaster)의 해당 제품군 원본 목록 */
      function catalog() {
        const g = G()[state.group];
        return (g && g.rows) || [];
      }
      /* 시트 원본 가격 보존 → 되돌리기(§3.2) 기준 */
      function mkRow(c) {
        return {
          ...c,
          optionInfo: (c.optionInfo || []).map((a) => ({ ...a })),
          thumb: c.thumb || null,
          thumbSrc: c.thumbSrc || "",
          _normal0: c._normal0 ?? c.normal,
          _sale0: c._sale0 ?? c.sale,
        };
      }
      function rowKey(r) {
        return `${rowName(r)}|${r.normal}|${r.sale}`;
      }
      function isAdded(c) {
        return state.rows.some((r) => rowKey(r) === rowKey(c));
      }

      let dragFrom = null;
      const BADGE_LABEL = { none: "", renewal: "리뉴얼", new: "NEW" };
      function renderRows() {
        const box = $("#rows");
        box.innerHTML = "";
        $("#rowCount").textContent = state.rows.length
          ? `${state.rows.length}개`
          : "";
        state.rows.forEach((r, i) => {
          const d = disc(r.normal, r.sale);
          const attrs = rowAttrs(r);
          const el = document.createElement("div");
          el.className = "rowcard";
          el.dataset.i = i;
          const dirty = r.normal !== r._normal0 || r.sale !== r._sale0;
          el.innerHTML = `
      <div class="top">
        <span class="drag" title="끌어서 순서 변경">⠿</span>
        <span class="idx">${i + 1}</span><span class="pct">${d != null ? d + "%" : "—"}</span>
        <button class="mini" data-del="${i}" style="padding:3px 8px">삭제</button></div>
      <div class="ro">
        <img class="thumbprev" ${r.thumbSrc ? `src="${r.thumbSrc}"` : ""} />
        <div class="roinfo">
          <div class="roname">${esc(rowName(r))}</div>
          ${attrs.length ? `<div class="roattr">${attrs.map((a) => (a.label ? `<b>${esc(a.label)}</b> ${esc(a.value)}` : esc(a.value))).join("<br/>")}</div>` : ""}
          ${r.badge !== "none" ? `<span class="robadge">${BADGE_LABEL[r.badge]}</span>` : ""}
        </div>
      </div>
      <div class="prices">
        <div class="pf"><span>정상가</span>
          <input type="text" data-f="normal" data-i="${i}" value="${won(r.normal).replace("원", "")}"/></div>
        <div class="pf"><span>판매가</span>
          <input type="text" data-f="sale" data-i="${i}" value="${won(r.sale).replace("원", "")}"/></div>
      </div>
      ${dirty ? `<button class="revert" data-rev="${i}">시트 값으로 되돌리기 (${won(r._normal0)} → ${won(r._sale0)})</button>` : ""}
      <div class="rothumb"><button class="mini" data-thumb="${i}">썸네일 교체</button></div>`;
          box.appendChild(el);
        });

        /* --- 드래그 정렬 --- */
        box.querySelectorAll(".rowcard").forEach((el) => {
          const h = el.querySelector(".drag");
          h.onmousedown = () => {
            el.draggable = true;
          };
          el.ondragstart = (e) => {
            dragFrom = +el.dataset.i;
            el.classList.add("dragging");
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", String(dragFrom));
          };
          el.ondragend = () => {
            el.draggable = false;
            dragFrom = null;
            box
              .querySelectorAll(".rowcard")
              .forEach((x) =>
                x.classList.remove("dragging", "over-t", "over-b"),
              );
          };
          el.ondragover = (e) => {
            if (dragFrom === null) return;
            e.preventDefault();
            const r = el.getBoundingClientRect(),
              after = e.clientY - r.top > r.height / 2;
            el.classList.toggle("over-b", after);
            el.classList.toggle("over-t", !after);
          };
          el.ondragleave = () => el.classList.remove("over-t", "over-b");
          el.ondrop = (e) => {
            e.preventDefault();
            if (dragFrom === null) return;
            const r = el.getBoundingClientRect(),
              after = e.clientY - r.top > r.height / 2;
            let to = +el.dataset.i + (after ? 1 : 0);
            const item = state.rows[dragFrom];
            state.rows.splice(dragFrom, 1);
            if (dragFrom < to) to--;
            state.rows.splice(to, 0, item);
            dragFrom = null;
            renderRows();
            draw();
          };
        });

        /* --- 가격만 수정 가능 (§3.2) --- */
        box.querySelectorAll("input[data-f]").forEach((inp) => {
          const i = +inp.dataset.i,
            f = inp.dataset.f;
          inp.oninput = (e) => {
            const r = state.rows[i];
            r[f] = parseNum(e.target.value);
            e.target.value = won(r[f]).replace("원", "");
            const card = box.querySelectorAll(".rowcard")[i];
            const d = disc(r.normal, r.sale);
            card.querySelector(".pct").textContent = d != null ? d + "%" : "—";
            draw();
          };
          inp.onchange = () => renderRows(); // 되돌리기 버튼 노출 갱신
        });
        box.querySelectorAll("[data-rev]").forEach(
          (b) =>
            (b.onclick = () => {
              const r = state.rows[+b.dataset.rev];
              r.normal = r._normal0;
              r.sale = r._sale0;
              renderRows();
              draw();
              status("시트 값으로 되돌렸습니다.");
            }),
        );
        box
          .querySelectorAll("[data-thumb]")
          .forEach((b) => (b.onclick = () => pickThumb(+b.dataset.thumb)));
        box.querySelectorAll("[data-del]").forEach(
          (b) =>
            (b.onclick = () => {
              state.rows.splice(+b.dataset.del, 1);
              renderRows();
              draw();
            }),
        );
        renderPicker();
      }
      const esc = (s) =>
        String(s ?? "")
          .replace(/&/g, "&amp;")
          .replace(/"/g, "&quot;")
          .replace(/</g, "&lt;");

      /* --- 제품 선택 패널 (§2 제품 마스터에서 로드) --- */
      function renderPicker() {
        const box = $("#picker");
        if (box.hidden) return;
        const cat = catalog();
        const items = cat
          .map((c, i) => {
            const added = isAdded(c),
              d = disc(c.normal, c.sale);
            return `<div class="pk ${added ? "added" : ""}" data-c="${i}">
      <div class="pkname">${esc(rowName(c))}</div>
      <div class="pkmeta">${won(c.sale)} · ${d != null ? d + "%" : "—"}${added ? " · 이미 추가됨" : ""}</div></div>`;
          })
          .join("");
        box.innerHTML =
          (cat.length
            ? items
            : `<div class="empty">이 제품군의 제품 목록이 없습니다.</div>`) +
          `<div class="pk custom" data-c="new"><div class="pkname">+ 빈 카드로 추가</div>
       <div class="pkmeta">직접 입력합니다</div></div>`;
        box.querySelectorAll(".pk").forEach(
          (el) =>
            (el.onclick = () => {
              const v = el.dataset.c;
              if (v === "new") {
                state.rows.push(
                  mkRow({
                    name: "신규 제품",
                    optionInfo: [],
                    normal: 0,
                    sale: 0,
                    badge: "none",
                    thumbUrl: "",
                  }),
                );
              } else {
                state.rows.push(mkRow(catalog()[+v]));
              }
              box.hidden = true;
              $("#addRow").textContent = "+ 제품 추가";
              renderRows();
              draw();
              loadSheetImages();
            }),
        );
      }
      $("#addRow").onclick = () => {
        const box = $("#picker");
        box.hidden = !box.hidden;
        $("#addRow").textContent = box.hidden ? "+ 제품 추가" : "닫기";
        renderPicker();
      };
      function pickThumb(i) {
        const inp = document.createElement("input");
        inp.type = "file";
        inp.accept = "image/*";
        inp.onchange = () => {
          const f = inp.files[0];
          if (!f) return;
          const rd = new FileReader();
          rd.onload = async () => {
            try {
              state.rows[i].thumb = await loadImg(rd.result, true);
              state.rows[i].thumbSrc = rd.result;
              renderRows();
              draw();
            } catch (e) {
              status("썸네일 로드 실패", 1);
            }
          };
          rd.readAsDataURL(f);
        };
        inp.click();
      }
