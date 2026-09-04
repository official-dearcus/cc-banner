/* CC 배너 제너레이터 — 10-group-template-ui
   원본 index.html 에서 기능별로 분리. 로드 순서가 곧 실행 순서다. */
      /* ---------- 초기화 · 제품군 선택 (명세서 §2.1.1) ---------- */
      function renderGroupButtons(filter) {
        const q = (filter || "").trim().toLowerCase();
        const box = $("#group");
        const entries = Object.entries(G()).filter(
          ([k, g]) => !q || g.label.toLowerCase().includes(q),
        );
        box.innerHTML = entries
          .map(
            ([k, g]) =>
              `<button class="groupbtn ${k === state.group ? "on" : ""}" data-g="${k}"${g.templates.length ? "" : ' data-empty="1"'}>${g.label}${g.templates.length ? "" : " · 템플릿없음"}</button>`,
          )
          .join("");
        box.querySelectorAll(".groupbtn").forEach(
          (b) => (b.onclick = () => selectGroup(b.dataset.g)),
        );
      }
      /* select=false 면 버튼만 다시 그린다. 호출부에서 selectGroup 을 따로 부르는 경우
         제품군 선택이 두 번 실행돼 랜덤(템플릿·컬러·히어로)이 두 번 돌던 문제를 막는다. */
      function initGroups(select) {
        renderGroupButtons();
        if (select === false) return;
        const keys = Object.keys(G());
        selectGroup(keys.includes("bamboo500") ? "bamboo500" : keys[0]);
      }
      /* 히어로 상태 완전 초기화 (템플릿 전환·제품군 전환 시) */
      function clearHero() {
        state.hero = null;
        state.heroSrc = "";
        state.heroUrl = "";
        state.heroUpload = false;
        state.heroTainted = false;
      }
      /* 처음 진입 시 템플릿을 랜덤으로 고른다 — 선택 고민을 줄이되, 이후 수정 가능 */
      function pickInitialTpl(g) {
        if (!g.templates || !g.templates.length) return null;
        return g.templates[Math.floor(Math.random() * g.templates.length)];
      }
      /* 처음 진입 시 컬러도 랜덤 (템플릿 허용 컬러 중, 수정 가능) */
      /* 행사 세션이 진행 중이면 공통 테마가 랜덤보다 우선한다.
         ⚠ 예전 순서가 이랬다:
              selectGroup  ① 테마를 랜덤으로 잡고
                           ② 그 테마에 맞는 히어로를 고름
              gotoGroup    ③ 테마만 SESSION.theme 로 덮어씀
            ③ 이 히어로를 다시 안 골라서, 테마는 블루인데 사진은 ①의 색이었다.
            여기서 처음부터 공통 테마를 잡으면 ② 가 옳은 색으로 고른다. */
      function sessionTheme(key, tpl) {
        try {
          if (typeof SESSION === "undefined" || !SESSION || !SESSION.started)
            return null;
          const k = SESSION.theme;
          return k && themesForKey(key, tpl)[k] ? k : null;
        } catch (e) {
          return null;
        }
      }
      function pickInitialTheme(key, tpl) {
        if (!tpl) return null;
        const fixed = sessionTheme(key, tpl);
        if (fixed) return fixed;
        const keys = Object.keys(themesForKey(key, tpl));
        if (!keys.length) return null;
        return keys[Math.floor(Math.random() * keys.length)];
      }
      /* 처음 진입 시 히어로도 랜덤 (현재 템플릿의 히어로 중에서만, 수정 가능).
         async 로딩 중 템플릿이 바뀌면 적용하지 않아 01/02 히어로가 섞이지 않는다. */
      /* 히어로 자동 선택.
         HeroMaster 의 theme 열에 지금 테마가 적힌 행이 있으면 그걸 쓰고,
         없을 때만 랜덤이다.
         ⚠ 예전에는 제품군을 고를 때 무조건 랜덤이었다. 템플릿을 바꿀 때만
           theme 매핑을 봤기 때문에, 제품군 선택 직후에는 테마와 다른 사진이 떴다. */
      async function applyRandomHero(gen) {
        const tplAtPick = state.tpl;
        const list = heroesForTpl();
        if (!list.length) return;
        const mapped =
          typeof heroForTheme === "function" ? heroForTheme() : null;
        const h = mapped || list[Math.floor(Math.random() * list.length)];
        if (!h || !h.url) return;
        try {
          const r = await loadImgSmart(h.url);
          if (gen !== undefined && gen !== SEL_GEN) return; // 제품군이 바뀌었으면 폐기
          if (state.tpl !== tplAtPick) return; // 로딩 후에도 같은 템플릿일 때만 적용
          state.hero = r.img;
          state.heroTainted = r.tainted;
          state.heroUrl = h.url;
          state.heroUpload = false;
          renderHeroList();
          draw();
        } catch (e) {
          /* 실패 시 히어로 없이 진행 */
        }
      }
      let SEL_GEN = 0; // 제품군 선택 세대 — 비동기 로딩 경합 방지
      /* preferTheme — 행사 설정에서 정한 공통 테마.
         ⚠ 이 인자가 없으면 아래 applyRandomHero() 가 "랜덤으로 뽑힌 임시 테마"로
           히어로를 고른다. 호출부(gotoGroup)는 selectGroup 이 끝난 뒤에야
           state.theme 을 행사 테마로 덮었기 때문에, 색은 블루인데 히어로만
           초록인 상태가 나왔다. 테마를 먼저 확정하고 히어로를 고른다. */
      function selectGroup(key, preferTheme) {
        const gen = ++SEL_GEN;
        state.group = key;
        const g = G()[key];
        // 하위 선택 초기화 (§2.1.1)
        state.tpl = pickInitialTpl(g); // 처음엔 랜덤 (수정 가능)
        state.theme = pickInitialTheme(key, state.tpl); // 컬러도 랜덤 (수정 가능)
        if (preferTheme && themesForKey(key, state.tpl)[preferTheme])
          state.theme = preferTheme;
        clearHero();
        // 셀러명·공구기간은 운영자 입력값(가변값)이므로 제품군을 바꿔도 유지한다.
        Object.assign(state, {
          seller: state.seller || g.seller || "",
          copy: g.copy || "",
          copyBold: g.copyBold || "",
          series: g.series || g.seriesTitle || "",
          rows: (g.rows || []).map((r) =>
            mkRow({ ...r, thumb: null, thumbSrc: "" }),
          ),
        });
        applyTplDefaults();
        renderGroupButtons($("#groupSearch") ? $("#groupSearch").value : "");
        $("#seller").value = state.seller;
        $("#copy").value = state.copy;
        $("#copyBold").value = state.copyBold;
        // 누볼라 계열: 안내 문구·사이즈 이미지는 템플릿별 → 그룹 공통 순
        state.notice =
          (g.noticeByTpl && g.noticeByTpl[state.tpl]) || g.noticeText || "";
        state.sizeInfoOn = !!nvSizeInfoUrl();
        renderNvBlocks();
        $("#series").value = state.series;
        renderTplList();
        renderThemes();
        renderRows();
        syncTplUI();
        resetColorPick();
        renderNvBlocks();
        renderHeroList();
        draw();
        loadSheetImages(gen);
        applyRandomHero(gen);
      }
      function themesForKey(gk, tpl) {
        const g = G()[gk],
          all = themeTable((g && g.family) || "bamboo", tpl);
        const f = g && g.themeFilter && g.themeFilter[tpl];
        if (!f || !f.length) return all;
        const out = {};
        f.forEach((k) => {
          if (all[k]) out[k] = all[k];
        });
        return Object.keys(out).length ? out : all;
      }
      /* 시트의 thumbUrl / heroUrl 자동 로드 (§리스크: URL 만료·CORS) */
      /* 다섯 종류(썸네일·히어로·색상칩·상단4컷·사이즈안내)를 순차로 기다리던 것을
         한 번에 병렬로 바꿨다. 이제 전체 소요 = 가장 느린 이미지 1장. */
      async function loadSheetImages(gen) {
        const g = G()[state.group];
        if (!g) return;
        const fails = [];
        const jobs = [];
        const job = (url, label, apply) => {
          if (!url) return;
          jobs.push(
            loadImgSmart(url).then(
              (x) => apply(x),
              () => fails.push(label),
            ),
          );
        };

        /* 옵션 카드 썸네일 */
        state.rows.forEach((r) => {
          if (r.thumb) return;
          job(r.thumbUrl, rowName(r), (x) => {
            r.thumb = x.img;
            r.thumbTainted = x.tainted;
            r.thumbSrc = r.thumbUrl;
          });
        });

        /* 히어로 */
        if (!state.hero)
          job(g.heroUrl, "히어로", (x) => {
            state.hero = x.img;
            state.heroTainted = x.tainted;
            state.heroUpload = false;
          });

        /* 색상 칩 (누볼라 등) */
        (g.colors || []).forEach((c) => {
          if (c.img) return;
          job(c.url, "색상 " + (c.label || c.colorKey), (x) => {
            c.img = x.img;
            c.imgTainted = x.tainted;
          });
        });

        /* 03 상단 이미지 4컷 */
        const gUrls = new Set();
        Object.values(g.gridByTpl || {}).forEach((arr) =>
          (arr || []).forEach((u) => u && gUrls.add(u)),
        );
        gUrls.forEach((u) => {
          if (GRID_IMG[u]) return;
          job(u, "상단 이미지", (x) => {
            GRID_IMG[u] = x.img;
          });
        });

        /* 사이즈 안내 — 템플릿마다 다를 수 있어 URL 단위로 캐시 */
        const sUrls = new Set();
        if (g.sizeInfoUrl) sUrls.add(g.sizeInfoUrl);
        Object.values(g.sizeInfoByTpl || {}).forEach((u) => u && sUrls.add(u));
        sUrls.forEach((u) => {
          if (SIZE_IMG[u]) return;
          job(u, "사이즈 안내", (x) => {
            SIZE_IMG[u] = x.img;
          });
        });

        await Promise.all(jobs);
        /* 이미지가 도착한 뒤 카드에 반영 (한 번만) */
        _tplSig = "";
        schedTplPreviews(false);

        if (fails.length)
          status(
            `이미지 ${fails.length}건 로드 실패: ${fails.slice(0, 2).join(", ")}`,
            1,
          );
        if (gen !== undefined && gen !== SEL_GEN) return; // 이미 다른 제품군으로 넘어감
        renderRows();
        draw();
      }
      function applyTplDefaults() {
        const g = G()[state.group];
        if (!g || !state.tpl) return;
        // 히어로 타이틀: 시트(TemplateMaster.heroTitle) 우선 → 내장 샘플 → 기존 입력 유지
        const st = g.titleByTpl && g.titleByTpl[state.tpl];
        if (st && st.length) {
          // 1줄 = 윗줄, 2줄 이후는 모두 아랫줄로 합친다(줄바꿈 유지).
          // 3줄 이상 입력해도 잘리지 않는다.
          state.t1 = st[0] || "";
          state.t2 = st.slice(1).filter(Boolean).join("\n");
        } else if (state.tpl === "02") {
          state.t1 = g.t1_02 || g.t1 || state.t1 || "";
          state.t2 = g.t2_02 || g.t2 || state.t2 || "";
        } else {
          state.t1 = g.t1 || state.t1 || "";
          state.t2 = g.t2 || state.t2 || "";
        }
        // 하단 카피 (02)
        const sc = g.copyByTpl && g.copyByTpl[state.tpl];
        if (sc && (sc.c || sc.b)) {
          state.copy = sc.c || "";
          state.copyBold = sc.b || "";
        }
        $("#copy").value = state.copy;
        $("#copyBold").value = state.copyBold;
        state.series =
          state.tpl === "02"
            ? g.optionTitleEn || g.series || ""
            : g.seriesTitle || g.series || "";
        $("#t1").value = state.t1;
        $("#t2").value = state.t2;
        $("#series").value = state.series;
        const lab = $("#seriesLabel");
        if (lab)
          lab.textContent =
            state.tpl === "02" ? "옵션 제목 (영문)" : "시리즈 제목 (한글)";
        // 누볼라 계열: 안내 문구·사이즈 이미지는 템플릿마다 다르므로 전환 시 다시 반영
        if (nvIsOn()) {
          state.notice =
            (g.noticeByTpl && g.noticeByTpl[state.tpl]) || g.noticeText || "";
          state.sizeInfoOn = !!nvSizeInfoUrl();
        }
        renderNvBlocks();
      }
      /* 템플릿 목록 — 프리뷰 카드 (§2.1.2) */
      function renderTplList() {
        const g = G()[state.group],
          box = $("#tplList");
        if (!g.templates.length) {
          box.innerHTML = `<div class="tplempty">이 제품군은 <b>템플릿이 아직 등록되지 않았습니다.</b><br/>
      피그마에 템플릿을 만들고 design.md에 규격을 추가하면 여기 표시됩니다.</div>`;
          $("#tplHint").textContent = "";
          return;
        }
        box.innerHTML = g.templates
          .map(
            (t) => `
    <div class="tplcard ${t === state.tpl ? "on" : ""}" data-t="${t}">
      <canvas class="tplprev" data-prev="${t}" width="240" height="302"></canvas>
      <div class="tplmeta"><div class="tplname">${(G()[state.group]?.labelOverride?.[t]) || tplMeta(curFam(), t).label}</div>
        <div class="tpldesc">${tplMeta(curFam(), t).desc}</div></div>
    </div>`,
          )
          .join("");
        box.querySelectorAll(".tplcard").forEach(
          (el) =>
            (el.onclick = () => {
              const prev = state.tpl;
              state.tpl = el.dataset.t;
              if (state.tpl !== prev) clearHero(); // 템플릿마다 히어로 성격이 다르므로 초기화
              if (!themesForKey(state.group, state.tpl)[state.theme])
                state.theme = Object.keys(
                  themesForKey(state.group, state.tpl),
                )[0];
              applyTplDefaults();
              renderTplList();
              renderThemes();
              syncTplUI();
              /* 템플릿을 바꾸면 히어로를 비우기만 하고 끝나서 매번 다시 골라야 했다.
                 테마에 매핑된 히어로가 있으면 그걸, 없으면 해당 템플릿에서 랜덤으로. */
              if (state.tpl !== prev) {
                const mapped =
                  typeof heroForTheme === "function" ? heroForTheme() : null;
                if (mapped) pickHero(mapped.url);
                else applyRandomHero();
              }
              renderHeroList();
              draw();
            }),
        );
        /* ⚠ 여기서 캔버스가 새로 만들어져 내용이 비어 있다.
           서명 캐시를 반드시 지워야 한다. 안 그러면 "변화 없음"으로 건너뛰어
           카드가 빈 채로 남는다. */
        _tplSig = "";
        requestAnimationFrame(() => drawTplPreviews());
      }
      /* 각 템플릿 히어로를 축소 렌더 */
      /* 미리보기 갱신 요청을 한 프레임으로 합친다.
         셀러명·타이틀을 타이핑하면 글자마다 3장을 다시 그리고 있었다.
         onlyCurrent=true 면 지금 선택된 템플릿 카드 하나만 갱신한다
         (양옆 카드가 같이 바뀌어 헷갈리던 것도 없어진다). */
      let _tplReq = 0,
        _tplAll = false;
      function schedTplPreviews(onlyCurrent) {
        if (!onlyCurrent) _tplAll = true;
        if (_tplReq) return;
        _tplReq = requestAnimationFrame(() => {
          _tplReq = 0;
          const all = _tplAll;
          _tplAll = false;
          drawTplPreviews(all ? null : state.tpl);
        });
      }
      /* 템플릿 카드용 히어로 — 그 템플릿에 등록된 첫 히어로.
         없으면 제품군의 첫 히어로. 현재 선택 상태에 의존하지 않으므로
         히어로를 바꿔도 카드가 흔들리지 않는다. */
      const TPL_HERO = {};
      function tplHeroImg(t) {
        const g = G()[state.group];
        if (!g) return null;
        const save = state.tpl;
        state.tpl = t;
        let list = [];
        try { list = heroesForTpl() || []; } catch (e) {}
        state.tpl = save;
        const url = (list[0] || (g.heroes || [])[0] || {}).url;
        if (!url) return null;
        if (url in TPL_HERO) return TPL_HERO[url];
        TPL_HERO[url] = null; // 로딩 중
        if (typeof loadImgSmart === "function")
          loadImgSmart(url)
            .then((r) => {
              TPL_HERO[url] = r.img;
              _tplSig = ""; // 캐시 무효화 후 한 번만 다시 그린다
              schedTplPreviews(false);
            })
            .catch(() => {});
        return null;
      }

      /* 같은 제품군·템플릿·폭이면 다시 그리지 않는다.
         예전에는 셀러명 한 글자, 히어로 교체마다 카드를 새로 그려서
         카드가 계속 바뀌고 렉의 원인이 됐다. */
      let _tplSig = "";
      function drawTplPreviews(only) {
        const g = G()[state.group];
        if (!g.templates.length) return;
        const cv0 = document.querySelector("[data-prev]");
        const sig = [state.group, g.templates.join(","), state.theme, cv0 ? cv0.width : 0].join("|");
        if (!only && sig === _tplSig) return; // 바뀐 게 없으면 건너뛴다
        if (!only) _tplSig = sig;
        /* ⚠ 예전에는 THEMES[t] 를 직접 읽었다.
           THEMES 에는 "01","02" 밖에 없어서 누볼라 03 에서 undefined 가 되고
           THEMES["03"][state.theme] 가 TypeError 로 터졌다.
           그 예외가 pickHero 의 try 안에서 잡혀 "이미지 로드 실패"로 둔갑했다.
           패밀리에 맞는 테마표(themeTable)와 렌더러(nvMain)를 쓰도록 고쳤다. */
        const nv = typeof nvIsOn === "function" && nvIsOn();
        const H = nv && typeof NV !== "undefined" ? NV.MAIN_H : SHARED.HERO_H;
        const off = document.createElement("canvas");
        off.width = 860;
        off.height = H;
        const octx = off.getContext("2d");
        g.templates.forEach((t) => {
          if (only && t !== only) return; // 나머지 카드는 그대로 둔다
          const cv = document.querySelector(`[data-prev="${t}"]`);
          if (!cv) return;
          const tbl = themeTable(curFam(), t) || {};
          const keys = Object.keys(tbl);
          if (!keys.length) return; // 테마표가 없는 템플릿은 미리보기 생략
          const th = tbl[tbl[state.theme] ? state.theme : keys[0]];
          octx.clearRect(0, 0, 860, H);
          const saveT = state.tpl,
            saveHero = state.hero;
          state.tpl = t;
          const own = tplHeroImg(t);
          if (own) state.hero = own; // 없으면 현재 히어로로라도 그린다(빈 카드 방지)
          try {
            if (nv) nvMain(octx, 860, th);
            else t === "01" ? hero01(octx, 860, th) : hero02(octx, 860, th);
          } catch (e) {
            console.warn("템플릿 미리보기 실패", t, e);
          } finally {
            state.tpl = saveT; // 예외가 나도 현재 템플릿을 되돌린다
            state.hero = saveHero;
          }
          const c = cv.getContext("2d");
          c.clearRect(0, 0, cv.width, cv.height);
          c.drawImage(off, 0, 0, 860, H, 0, 0, cv.width, cv.height);
        });
      }
      function syncTplUI() {
        const has = !!state.tpl;
        $("#themeBlock").hidden = !has;
        /* 하단 카피는 02 에서만 쓴다.
           ⚠ nvIsOn() 을 붙여 신형(누볼라)에서는 아예 못 넣게 막고 있었다.
             그런데 nvMain02 / nvfHero02 가 state.copy·copyBold 를 실제로 그린다
             → 누볼라 02 도 입력이 필요하다(2026-09-04 신고). 패밀리 조건 제거. */
        $("#copyBlock").hidden = state.tpl !== "02";
        $("#tplTag").textContent =
          G()[state.group].label +
          (has ? " · " + tplMeta(curFam(), state.tpl).label : "");
        $("#tplHint").innerHTML = !has
          ? ""
          : state.tpl === "01"
            ? "<b>셀러명은 영문만</b> 가능합니다 (High Summit)."
            : "셀러명 한글 가능 (Pretendard).";
        renumberBlocks();
        $("#imgLabel").textContent =
          state.tpl === "02"
            ? "제품 이미지 (누끼컷)"
            : "히어로 이미지 (연출컷)";
        $("#imgHint").innerHTML =
          state.tpl === "02"
            ? "그라데이션 배경 위에 얹힙니다. <b>배경 제거된 누끼컷</b>을 넣으세요."
            : "화면 전체를 채웁니다. <b>글자 없는 연출컷</b>을 넣으세요.";
        checkSeller();
      }
      /* ⚠ 예전에는 THEMES[tpl] 을 직접 읽었다. THEMES 에는 "01","02" 뿐이라
         누볼라 03 에서 undefined 가 되고 .pink 를 읽다 터졌다.
         같은 일을 이미 제대로 하는 themesForKey 로 합친다(중복 제거). */
      function themesFor(tpl) {
        return themesForKey(state.group, tpl) || {};
      }
      function renderThemes() {
        if (!state.tpl) {
          $("#themeSw").innerHTML = "";
          return;
        }
        const t = themesFor(state.tpl);
        if (!t[state.theme]) state.theme = Object.keys(t)[0];
        $("#themeSw").innerHTML = Object.entries(t)
          .map(
            ([k, v]) => `
    <div class="sw ${k === state.theme ? "on" : ""}" data-k="${k}">
      <div class="dot" style="background:${v.accent}"></div><div class="nm">${v.label}</div></div>`,
          )
          .join("");
        $("#themeSw")
          .querySelectorAll(".sw")
          .forEach(
            (el) =>
              (el.onclick = () => {
                state.theme = el.dataset.k;
                renderThemes();
                /* HeroMaster 의 theme 열에 매핑된 히어로가 있으면 자동 교체 */
                if (typeof applyThemeHero === "function") applyThemeHero();
                schedTplPreviews(false); // 테마는 카드 색이 바뀌므로 전체 갱신
                draw();
              }),
          );
      }
