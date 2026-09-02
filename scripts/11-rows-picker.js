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

      /* ---------- 옵션 줄 직접 수정 (전 제품군 공통) ----------
         평소에는 읽기 전용으로 보여주고, [옵션 수정] 을 누른 카드만
         입력창으로 바뀐다. 편집 상태는 행 자체에 r._edit 로 들고 있어서
         순서를 바꾸거나 다시 그려도 열려 있던 카드가 그대로 열려 있다.
         값은 r.optionInfo 에 바로 들어가고 draw() 로 캔버스가 즉시 갱신된다. */
      const COLOR_LAB_RE = /^(color|colour|컬러|색상)$/i;
      /* 구형 unit 문자열(단일 값)로 들어온 행도 편집할 수 있게 배열로 맞춘다 */
      function normAttrs(r) {
        if (!Array.isArray(r.optionInfo)) {
          r.optionInfo = r.unit ? [{ label: null, value: String(r.unit) }] : [];
          delete r.unit;
        }
        return r.optionInfo;
      }
      function attrEditHTML(r, i) {
        const list = normAttrs(r);
        /* 컬러 줄은 아래 "컬러 선택"에서 고른 색으로 캔버스에 자동 표시된다.
           여기서 고쳐도 안 보이므로 미리 알려준다 (09-hero-color cardAttrs) */
        const autoColor =
          (r.colorLine || "").trim() &&
          list.some((a) => COLOR_LAB_RE.test((a.label || "").trim()));
        const rows = list
          .map(
            (a, k) => `<div class="rorow">
        <input class="rolab" data-ai="${i}" data-ak="${k}" data-af="label"
               value="${esc(a.label ?? "")}" placeholder="라벨" />
        <input class="roval" data-ai="${i}" data-ak="${k}" data-af="value"
               value="${esc(a.value ?? "")}" placeholder="값 (쉼표로 구분)" />
        <button class="mini rox" data-adel="${i}" data-ak="${k}" title="이 줄 삭제">×</button>
      </div>`,
          )
          .join("");
        return `<div class="roedit">
      ${rows || `<div class="roempty">옵션 줄이 없습니다. 아래에서 추가하세요.</div>`}
      <button class="mini roadd" data-aadd="${i}">+ 줄 추가</button>
      ${autoColor ? `<div class="ronote">Color 줄은 아래 <b>컬러 선택</b>에서 고른 색으로 표시됩니다. 여기 값은 배너에 안 나옵니다.</div>` : ""}
    </div>`;
      }
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
          ${
            r._edit
              ? `<input class="ronameedit" data-ni="${i}" value="${esc(rowName(r))}" placeholder="제품명" />`
              : `<div class="roname">${esc(rowName(r))}</div>`
          }
          ${
            r._edit
              ? attrEditHTML(r, i)
              : attrs.length
                ? `<div class="roattr">${attrs.map((a) => (a.label ? `<b>${esc(a.label)}</b> ${esc(a.value)}` : esc(a.value))).join("<br/>")}</div>`
                : `<div class="roattr roempty">옵션 줄 없음</div>`
          }
          <button class="mini roedit-btn${r._edit ? " on" : ""}" data-edit="${i}">${r._edit ? "수정 완료" : "옵션 수정"}</button>
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
        /* --- 옵션 수정 --- */
        box.querySelectorAll("[data-edit]").forEach(
          (b) =>
            (b.onclick = () => {
              const r = state.rows[+b.dataset.edit];
              if (!r._edit) normAttrs(r);
              r._edit = !r._edit;
              renderRows();
            }),
        );
        /* 제품명 — [옵션 수정] 을 눌렀을 때만 고칠 수 있다.
           ⚠ 빈 카드를 추가하면 "신규 제품" 이 글자로만 찍혀 바꿀 방법이 없었다
             (2026-09-02 신고). name1/name2 로 들어온 구형 행도 여기서 name 으로
             합쳐지므로 rowName() 과 결과가 어긋나지 않는다. */
        box.querySelectorAll("input[data-ni]").forEach((inp) => {
          inp.oninput = () => {
            const r = state.rows[+inp.dataset.ni];
            /* rowName() 은 name → [n1,n2] 순으로 본다(16-render-cards).
               고치면 name 하나로 정리해서 옛 필드가 다시 이기지 않게 한다. */
            r.name = inp.value;
            delete r.n1;
            delete r.n2;
            draw();
          };
        });
        /* 입력 중에는 다시 그리지 않는다 — 커서가 튀기 때문에 캔버스만 갱신 */
        box.querySelectorAll("input[data-af]").forEach((inp) => {
          inp.oninput = () => {
            const r = state.rows[+inp.dataset.ai];
            const a = normAttrs(r)[+inp.dataset.ak];
            if (!a) return;
            const v = inp.value;
            a[inp.dataset.af] = inp.dataset.af === "label" ? v.trim() || null : v;
            draw();
          };
        });
        box.querySelectorAll("[data-adel]").forEach(
          (b) =>
            (b.onclick = () => {
              normAttrs(state.rows[+b.dataset.adel]).splice(+b.dataset.ak, 1);
              renderRows();
              draw();
            }),
        );
        box.querySelectorAll("[data-aadd]").forEach(
          (b) =>
            (b.onclick = () => {
              normAttrs(state.rows[+b.dataset.aadd]).push({ label: "", value: "" });
              renderRows();
              draw();
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
