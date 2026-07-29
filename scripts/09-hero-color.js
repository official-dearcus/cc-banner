/* CC 배너 제너레이터 — 09-hero-color
   원본 index.html 에서 기능별로 분리. 로드 순서가 곧 실행 순서다. */
      /* ---- 히어로 이미지 라이브러리 (HeroMaster) ---- */
      /* ───────── 색상 선택 ─────────
         line 은 시트 자유값. 같은 값끼리 한 줄로 묶이고, 등장 순서대로 표시된다.
         line 을 비워두면 전부 한 줄로 나온다. */
      const LINE_LABEL_DEFAULT = { kids: "키즈", adult: "성인" };
      function allColors() {
        const g = G()[state.group];
        return (g && g.colors) || [];
      }
      /* 시트 등장 순서대로 고유 줄 목록 */
      function colorLines() {
        const out = [];
        for (const c of allColors()) {
          const k = c.line || "";
          if (out.some((l) => l.key === k)) continue;
          out.push({
            key: k,
            label: c.lineLabel || LINE_LABEL_DEFAULT[k.toLowerCase()] || "",
          });
        }
        return out;
      }
      function colorsOf(line) {
        return allColors().filter((c) => (c.line || "") === line);
      }
      function hasColors() {
        return allColors().length > 0;
      }
      function pickedColors(line) {
        const sel = state.colorPick[line] || [];
        return colorsOf(line).filter((c) => sel.includes(c.colorKey));
      }
      /* 제품군 전환 시 기본 선택.
         전체 선택이던 것을 실제 운영에서 쓰는 색만 켜지도록 바꿨다(2026-07 요청).
         키즈  → 블랙 · 딥그린 · 핑크 · 화이트
         성인  → 위 + 그레이 (그레이는 성인 줄에만 존재)
         버터 · 아이스그레이 · 메론그린 은 꺼진 채로 시작하고 필요할 때 켠다.
         라벨 완전일치로 비교한다("아이스그레이"가 "그레이"에 걸리지 않도록).
         이 목록에 걸리는 색이 하나도 없으면(다른 제품군) 예전처럼 전체 선택. */
      const COLOR_DEFAULT_ON = ["블랙", "딥그린", "핑크", "화이트", "그레이"];
      function resetColorPick() {
        state.colorPick = {};
        colorLines().forEach((l) => {
          const all = colorsOf(l.key);
          const on = all.filter((c) =>
            COLOR_DEFAULT_ON.includes(String(c.label || "").trim()),
          );
          state.colorPick[l.key] = (on.length ? on : all).map((c) => c.colorKey);
        });
      }
      /* 옵션 카드에 표시할 속성 목록.
         colorLine 이 지정된 행은 Color 줄을 "현재 선택한 색상"으로 자동 생성한다.
         (시트 optionInfo 에 Color 줄이 남아 있어도 중복되지 않게 걸러낸다) */
      const COLOR_LABEL_RE = /^(color|colour|컬러|색상)$/i;
      function cardAttrs(r) {
        const base = rowAttrs(r);
        const line = (r.colorLine || "").trim();
        if (!line) return base;
        const picked = pickedColors(line);
        if (!picked.length) return base;
        const rest = base.filter((a) => !COLOR_LABEL_RE.test((a.label || "").trim()));
        const keep = base.find((a) => COLOR_LABEL_RE.test((a.label || "").trim()));
        return [
          { label: keep ? keep.label : "Color", value: picked.map((c) => c.label).join(", ") },
          ...rest,
        ];
      }

      /* 사이즈 안내 이미지 URL: 템플릿별 → 그룹 공통 */
      function nvSizeInfoUrl() {
        const g = G()[state.group];
        if (!g) return "";
        return (g.sizeInfoByTpl && g.sizeInfoByTpl[state.tpl]) || g.sizeInfoUrl || "";
      }
      const SIZE_IMG = {}; // url → Image 캐시
      const GRID_IMG = {}; // 03 상단 4컷 이미지 캐시
      function nvGridUrls() {
        const g = G()[state.group];
        if (!g) return [];
        return (g.gridByTpl && g.gridByTpl[state.tpl]) || [];
      }
      function nvGridImgs() {
        return nvGridUrls().map((u) => GRID_IMG[u] || null);
      }
      function nvSizeInfoImg() {
        const u = nvSizeInfoUrl();
        return u ? SIZE_IMG[u] : null;
      }

      /* 누볼라 전용 편집 블록: 안내 문구 + 사이즈 안내 + 컬러 선택 */
      function renderNvBlocks() {
        const wrap = $("#nvBlocks");
        if (!wrap) return;
        if (!nvIsOn()) { wrap.innerHTML = ""; renumberBlocks(); return; }
        let html = "";
        // 안내 문구 (비우면 배너에서 제거됨)
        html +=
          `<div class="block"><label class="h"><span class="num"></span> 안내 문구</label>` +
          `<input type="text" id="nvNotice" maxlength="60" value="${(state.notice || "").replace(/"/g, "&quot;")}" />` +
          `<div class="hint">옵션 카드 아래 띠. <b>비우면 배너에서 빠집니다.</b></div></div>`;
        // 사이즈 안내 이미지 on/off
        if (nvSizeInfoUrl()) {
          html +=
            `<div class="block"><label class="h"><span class="num"></span> 사이즈 안내</label>` +
            `<div class="seg"><button id="nvSizeOn" class="${state.sizeInfoOn ? "on" : ""}">넣기</button>` +
            `<button id="nvSizeOff" class="${state.sizeInfoOn ? "" : "on"}">빼기</button></div>` +
            `<div class="hint">템플릿에 등록된 사이즈 안내 이미지</div></div>`;
        }
        // 컬러 선택 (줄 단위)
        if (hasColors()) {
          for (const l of colorLines()) {
            const list = colorsOf(l.key);
            const sel = state.colorPick[l.key] || [];
            const title = l.label ? `${l.label} 컬러` : "컬러 선택";
            html +=
              `<div class="block"><label class="h"><span class="num"></span> ${title} ` +
              `<span class="cnt">${sel.length}/${list.length}</span></label>` +
              `<div class="colorpick" data-line="${l.key}">` +
              list
                .map(
                  (c) =>
                    `<button class="cchip ${sel.includes(c.colorKey) ? "on" : ""}" data-k="${c.colorKey}">${c.label}</button>`,
                )
                .join("") +
              `</div><div class="hint">이미지에 넣을 색상을 고르세요. 최소 1개.</div></div>`;
          }
        }
        wrap.innerHTML = html;
        const ni = $("#nvNotice");
        if (ni)
          ni.oninput = (e) => {
            state.notice = e.target.value;
            draw();
          };
        const on = $("#nvSizeOn"), off = $("#nvSizeOff");
        if (on) on.onclick = () => { state.sizeInfoOn = true; renderNvBlocks(); draw(); };
        if (off) off.onclick = () => { state.sizeInfoOn = false; renderNvBlocks(); draw(); };
        wrap.querySelectorAll(".colorpick").forEach((box) => {
          const line = box.dataset.line;
          box.querySelectorAll(".cchip").forEach(
            (b) => (b.onclick = () => toggleColor(line, b.dataset.k)),
          );
        });
        renumberBlocks();
      }
      /* 편집 패널 블록 번호를 화면 순서대로 다시 매긴다.
         (누볼라 컬러 블록이 중간에 끼거나 숨은 블록이 있어도 번호가 이어진다) */
      function renumberBlocks() {
        const panel = document.querySelector(".col.left");
        if (!panel) return;
        let n = 1;
        panel.querySelectorAll(".block").forEach((b) => {
          if (b.hidden || b.offsetParent === null) {
            const s0 = b.querySelector("label.h > .num");
            if (s0 && !b.hidden) s0.textContent = n; // 숨김 아님(레이아웃 미측정) 대비
            return;
          }
          const sp = b.querySelector("label.h > .num");
          if (sp) sp.textContent = n++;
        });
      }
      function toggleColor(line, key) {
        const sel = state.colorPick[line] || (state.colorPick[line] = []);
        const i = sel.indexOf(key);
        if (i >= 0) {
          if (sel.length <= 1) {
            status("최소 한 가지 색상은 선택해야 합니다.", 1);
            return;
          }
          sel.splice(i, 1);
        } else sel.push(key);
        renderNvBlocks();
        draw();
      }
      function heroesForTpl() {
        const g = G()[state.group];
        if (!g || !g.heroes || !state.tpl) return [];
        const tplId = `${state.group}_${state.tpl}`;
        const hit = g.heroes.filter((h) => {
          if (!h.templateId) return true; // 공용
          if (h.templateId === tplId) return true;
          // 이 제품군 전용 템플릿이 아직 등록 전이면 suffix 로 매칭(임시 대여).
          return (
            h.templateId.endsWith("_" + state.tpl) && !KNOWN_TPL.includes(tplId)
          );
        });
        // 이 템플릿용으로 지정된 게 하나도 없으면 같은 제품군 히어로를 모두 쓴다.
        // (HeroMaster 에 templateId 를 01 로만 채워둔 경우에도 02·03 에서 이미지가 뜬다)
        return hit.length ? hit : g.heroes;
      }
      function renderHeroList() {
        const box = $("#heroList"),
          list = heroesForTpl();
        if (!list.length) {
          box.innerHTML = `<div class="tplempty">등록된 히어로 이미지가 없습니다. 시트 <b>HeroMaster</b> 탭에 추가하거나 직접 업로드하세요.</div>`;
          return;
        }
        box.innerHTML =
          `<div class="herogrid">` +
          list
            .map(
              (h, i) => `
    <div class="hero ${state.heroUrl === h.url ? "on" : ""}" data-h="${i}" title="${esc(h.label || h.url)}">
      <img src="${esc(h.url)}" loading="lazy" onerror="this.classList.add('bad')"/>
      <span>${esc(h.label || "이미지 " + (i + 1))}</span>
    </div>`,
            )
            .join("") +
          `</div>`;
        box.querySelectorAll(".hero").forEach(
          (el) =>
            (el.onclick = () => {
              const h = heroesForTpl()[+el.dataset.h];
              pickHero(h.url);
            }),
        );
      }
      async function pickHero(url) {
        try {
          const r = await loadImgSmart(url);
          state.hero = r.img;
          state.heroTainted = r.tainted;
          state.heroUrl = url;
          state.heroUpload = false;
          renderHeroList();
          drawTplPreviews();
          draw();
          status(
            r.tainted
              ? "적용됨 — 단 이 이미지는 CORS 미허용이라 PNG 저장이 막힙니다."
              : r.viaProxy
                ? "히어로 이미지를 적용했습니다 (프록시 경유)."
                : "히어로 이미지를 적용했습니다.",
            r.tainted ? 1 : 0,
          );
        } catch (e) {
          state.hero = null;
          state.heroUrl = "";
          state.heroTainted = false;
          status("이미지 로드 실패 — URL이 잘못됐거나 만료됐습니다.", 1);
          renderHeroList();
          draw();
        }
      }
