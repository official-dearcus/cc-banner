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
          /* 시트의 배지 값 — 편집기에서 껐다 켤 때 "시트 값" 표시에 쓴다 (2026-11-23) */
          _badge0: c._badge0 ?? (c.badge || "none"),
          /* 시트(또는 처음 넣은) 제품명 — 줄바꿈을 고치다 되돌릴 기준 (2026-11-23) */
          _name0: c._name0 ?? (c.name || [c.n1, c.n2].filter(Boolean).join(" ")),
        };
      }
      /* 제품명이 배너(상세)에서 실제로 몇 줄로 그려지는지.
         사용자가 넣은 줄바꿈은 그대로 지키고, 한 줄이 폭을 넘으면 더 접힌다. */
      function bannerNameLineCount(r) {
        try {
          if (typeof nvIsOn === "function" && nvIsOn())
            return nvMeasureCard(r).lns.length;
          return nameLines(r).filter(Boolean).length;
        } catch (e) {
          return 0;
        }
      }
      function nameHintText(r) {
        const typed = String(rowName(r) || "")
          .split(/\r?\n/)
          .filter((s) => s.trim()).length;
        const drawn = bannerNameLineCount(r);
        /* 줄을 직접 나눴는데도 더 접히면 의도와 다른 것 → 눈에 띄게.
           한 줄로 둔 채 자동으로 접히는 건 정상이라 담담하게 알린다. */
        if (typed > 1 && drawn > typed)
          return `<b>폭을 넘는 줄이 있어 배너에서는 ${drawn}줄로 접힙니다.</b> 긴 줄을 한 번 더 나눠 보세요.`;
        if (drawn > 1 && typed <= 1)
          return `배너에서 ${drawn}줄로 자동 줄바꿈됩니다. 원하는 자리에서 Enter 를 치면 거기서 나뉩니다.`;
        return `Enter 로 줄을 나눕니다. 지금 배너에서 ${drawn || typed}줄.`;
      }
      function rowKey(r) {
        return `${rowName(r)}|${r.normal}|${r.sale}`;
      }
      function isAdded(c) {
        return state.rows.some((r) => rowKey(r) === rowKey(c));
      }

      let dragFrom = null;
      const BADGE_LABEL = { none: "", renewal: "리뉴얼", new: "NEW" };
      /* 배지 고르기 (요청 2026-11-23) — 카드마다 없음 / 리뉴얼 / NEW.
         시트에 적힌 배지는 처음부터 켜져 있고 여기서 끌 수 있다.
         시트가 빈칸인 제품도 여기서 붙일 수 있다. 시트 원본은 안 바뀐다.
         ⚠ 템플릿 03 은 이 배지 대신 "OPTION n." 번호 딱지를 쓴다 — 골라도 03 에는 안 나온다. */
      const BADGE_OPTS = [
        ["none", "없음"],
        ["renewal", "리뉴얼"],
        ["new", "NEW"],
        ["custom", "직접 입력"],
      ];
      /* 직접 입력 배지 — 5글자까지 (요청 2026-11-23). 배지 알약이 그 이상은 못 버틴다. */
      const BADGE_MAX = 5;
      function clipBadge(s) {
        return Array.from(String(s || "")).slice(0, BADGE_MAX).join("");
      }
      /* 배너에 찍힐 배지 글자. 빈 문자열이면 배지가 없다.
         렌더러(12-render-nuvola 의 상세·피드 카드)가 이 함수 하나만 본다.
         ⚠ "직접 입력"을 골랐는데 아직 글자가 없으면 배지를 안 그린다 —
           빈 알약이 배너에 찍히면 안 된다. */
      function badgeLabel(r) {
        const b = (r && r.badge) || "none";
        if (b === "renewal") return "RENEWAL!";
        if (b === "new") return "NEW!";
        if (b === "custom") return clipBadge(r.badgeText).trim();
        return "";
      }
      function badgePickHTML(r, i) {
        const cur = r.badge || "none";
        const sheet = r._badge0 ?? cur;
        const note =
          state.tpl === "03"
            ? `템플릿 03 은 OPTION 번호를 씁니다`
            : cur !== sheet
              ? `시트 값: ${BADGE_OPTS.find((o) => o[0] === sheet)?.[1] || "없음"}`
              : "";
        return (
          `<div class="robadgepick" data-bi="${i}"><span class="lb">배지</span>` +
          BADGE_OPTS.map(
            ([k, lb]) =>
              `<button type="button" data-b="${k}" class="${k === cur ? "on" : ""}">${lb}</button>`,
          ).join("") +
          (cur === "custom"
            ? `<input class="robadgetxt" data-bt="${i}" maxlength="${BADGE_MAX}" value="${esc(clipBadge(r.badgeText))}" placeholder="5글자까지" />`
            : "") +
          (note ? `<span class="nt">${note}</span>` : "") +
          `</div>`
        );
      }

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
              ? `<textarea class="ronameedit" data-ni="${i}" rows="1" placeholder="제품명" spellcheck="false">${esc(rowName(r))}</textarea>` +
                `<div class="ronamehint" data-nh="${i}">${nameHintText(r)}</div>` +
                (rowName(r) !== (r._name0 ?? rowName(r))
                  ? `<button class="revert ronamerev" data-nrev="${i}">제품명을 시트 값으로</button>`
                  : "")
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
          ${badgePickHTML(r, i)}
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
        /* (2026-11-23) 한 줄 input → 여러 줄 textarea.
           Enter 를 친 자리에서 배너의 제품명도 줄이 나뉜다. 렌더러는 원래부터
           제품명 안의 줄바꿈을 지켰다(시트의 Alt+Enter) — 편집기가 못 넣었을 뿐이다.
           예전 input 은 시트에서 온 줄바꿈까지 지워 버렸다. */
        box.querySelectorAll("textarea[data-ni]").forEach((inp) => {
          const grow = () => {
            inp.style.height = "auto";
            inp.style.height = inp.scrollHeight + 2 + "px";
          };
          grow();
          inp.oninput = () => {
            const r = state.rows[+inp.dataset.ni];
            /* rowName() 은 name → [n1,n2] 순으로 본다(16-render-cards).
               고치면 name 하나로 정리해서 옛 필드가 다시 이기지 않게 한다. */
            r.name = inp.value;
            delete r.n1;
            delete r.n2;
            grow();
            /* 입력 중에는 목록을 다시 그리지 않는다(커서가 튄다) — 안내 글만 바꾼다 */
            const h = box.querySelector(`[data-nh="${inp.dataset.ni}"]`);
            if (h) h.innerHTML = nameHintText(r);
            draw();
          };
          inp.onchange = () => renderRows(); // 되돌리기 버튼 노출 갱신
        });
        /* 배지 켜고 끄기 */
        box.querySelectorAll(".robadgepick button").forEach(
          (b) =>
            (b.onclick = () => {
              const r = state.rows[+b.parentElement.dataset.bi];
              r.badge = b.dataset.b;
              renderRows();
              draw();
              /* 직접 입력을 고르면 바로 칠 수 있게 칸에 커서를 둔다 */
              if (r.badge === "custom") {
                const inp = box.querySelector(
                  `.robadgetxt[data-bt="${b.parentElement.dataset.bi}"]`,
                );
                if (inp) inp.focus();
              }
            }),
        );
        /* 한글은 조합 중에 maxlength 를 넘길 수 있다 → 조합이 끝나면 한 번 더 자른다 */
        box.querySelectorAll(".robadgetxt").forEach((inp) => {
          const apply = (cut) => {
            const r = state.rows[+inp.dataset.bt];
            if (cut) inp.value = clipBadge(inp.value);
            r.badgeText = clipBadge(inp.value);
            draw();
          };
          inp.oninput = (e) => apply(!e.isComposing);
          inp.addEventListener("compositionend", () => apply(true));
          inp.onblur = () => apply(true);
        });
        box.querySelectorAll("[data-nrev]").forEach(
          (b) =>
            (b.onclick = () => {
              const r = state.rows[+b.dataset.nrev];
              r.name = r._name0;
              delete r.n1;
              delete r.n2;
              renderRows();
              draw();
              status("제품명을 시트 값으로 되돌렸습니다.");
            }),
        );
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
      /* [다른 제품군 추가] 를 펼쳤는지. 패널을 닫으면 다시 접는다. */
      let PK_OTHERS = false;
      /* 지금 제품군을 뺀 나머지 제품군의 제품 목록.
         요청 2026-10-22 — 한 배너에 다른 라인 제품을 같이 올릴 때 쓴다.
         시트에서 enabled=FALSE 인 행(offRows)은 옵션 카드로 파는 제품이
         아니므로 여기에도 넣지 않는다. 지금 제품군 목록과 같은 기준이다. */
      function otherCatalogs() {
        const all = (typeof G === "function" && G()) || {};
        return Object.keys(all)
          .filter((k) => k !== state.group)
          .map((k) => ({ key: k, label: (all[k] && all[k].label) || k, rows: (all[k] && all[k].rows) || [] }))
          .filter((g) => g.rows.length);
      }
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
        /* 다른 제품군 — 접었다 펴는 줄 + (펼쳤을 때) 제품군별 목록 */
        const others = otherCatalogs();
        const othersHead = others.length
          ? `<div class="pk custom" data-c="others">
       <div class="pkname">${PK_OTHERS ? "−" : "+"} 다른 제품군 추가</div>
       <div class="pkmeta">${others.length}개 제품군${PK_OTHERS ? "" : " · 눌러서 펼치기"}</div></div>`
          : "";
        const othersList =
          PK_OTHERS && others.length
            ? others
                .map(
                  (g) =>
                    `<div class="pkgroup">${esc(g.label)}</div>` +
                    g.rows
                      .map((c, i) => {
                        const added = isAdded(c), d = disc(c.normal, c.sale);
                        return `<div class="pk ${added ? "added" : ""}" data-x="${esc(g.key)}" data-i="${i}">
      <div class="pkname">${esc(rowName(c))}</div>
      <div class="pkmeta">${won(c.sale)} · ${d != null ? d + "%" : "—"}${added ? " · 이미 추가됨" : ""}</div></div>`;
                      })
                      .join(""),
                )
                .join("")
            : "";
        box.innerHTML =
          (cat.length
            ? items
            : `<div class="empty">이 제품군의 제품 목록이 없습니다.</div>`) +
          `<div class="pk custom" data-c="new"><div class="pkname">+ 빈 카드로 추가</div>
       <div class="pkmeta">직접 입력합니다</div></div>` +
          othersHead +
          othersList;
        box.querySelectorAll(".pk").forEach(
          (el) =>
            (el.onclick = () => {
              const v = el.dataset.c;
              /* 펼치기/접기만 하고 패널은 열어 둔다 */
              if (v === "others") {
                PK_OTHERS = !PK_OTHERS;
                renderPicker();
                return;
              }
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
              } else if (el.dataset.x) {
                /* 다른 제품군의 제품. 시트 행을 그대로 복사해 온다 —
                   값은 여기서 고칠 수 있고, 썸네일은 loadSheetImages 가
                   state.rows 전체를 훑으므로 제품군과 무관하게 불러온다. */
                const g = (G() || {})[el.dataset.x];
                const c = g && (g.rows || [])[+el.dataset.i];
                if (!c) return;
                state.rows.push(mkRow(c));
              } else {
                state.rows.push(mkRow(catalog()[+v]));
              }
              box.hidden = true;
              PK_OTHERS = false;
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
        if (box.hidden) PK_OTHERS = false; // 닫으면 다른 제품군은 접어 둔다
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
