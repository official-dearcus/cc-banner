/* CC 배너 제너레이터 — 21-bindings-boot
   원본 index.html 에서 기능별로 분리. 로드 순서가 곧 실행 순서다. */
      /* ---------- 바인딩 ---------- */
      const _gs = $("#groupSearch");
      if (_gs) _gs.oninput = (e) => renderGroupButtons(e.target.value);
      $("#seller").oninput = (e) => {
        state.seller = e.target.value.trim();
        checkSeller();
        drawTplPreviews();
        draw();
        saveCfg();
      };
      $("#t1").oninput = (e) => {
        state.t1 = e.target.value;
        drawTplPreviews();
        draw();
      };
      $("#t2").oninput = (e) => {
        state.t2 = e.target.value;
        drawTplPreviews();
        draw();
      };
      $("#copy").oninput = (e) => {
        state.copy = e.target.value;
        draw();
      };
      $("#copyBold").oninput = (e) => {
        state.copyBold = e.target.value;
        draw();
      };
      $("#series").oninput = (e) => {
        state.series = e.target.value;
        draw();
      };
      function dateHint() {
        const h = $("#dateHint");
        if (state.d1 && state.d2 && new Date(state.d2) < new Date(state.d1)) {
          h.textContent = "종료일이 시작일보다 빠릅니다.";
          h.className = "hint err";
        } else {
          h.textContent =
            state.tpl === "01"
              ? range01(state.d1, state.d2)
              : range02(state.d1, state.d2);
          h.className = "hint";
        }
      }
      $("#d1").onchange = (e) => {
        state.d1 = e.target.value;
        dateHint();
        draw();
        saveCfg();
      };
      $("#d2").onchange = (e) => {
        state.d2 = e.target.value;
        dateHint();
        draw();
        saveCfg();
      };
      $("#heroUpload").onclick = () => $("#heroFile").click();
      $("#heroFile").onchange = (e) => {
        const f = e.target.files[0];
        if (!f) return;
        const r = new FileReader();
        r.onload = async () => {
          try {
            state.hero = await loadImg(r.result, true);
            state.heroSrc = r.result;
            state.heroUrl = "";
            state.heroUpload = true;
            state.heroTainted = false;
            renderHeroList();
            drawTplPreviews();
            draw();
          } catch (x) {
            status("이미지 로드 실패", 1);
          }
        };
        r.readAsDataURL(f);
      };
      $("#heroReset").onclick = () => {
        state.hero = null;
        state.heroSrc = "";
        state.heroUrl = "";
        state.heroUpload = false;
        state.heroTainted = false;
        renderHeroList();
        drawTplPreviews();
        draw();
      };
      $("#zoom").oninput = (e) => {
        const v = +e.target.value;
        $("#zoomVal").textContent = v + "%";
        $("#preview").style.width = (SHARED.W * v) / 100 + "px";
        $("#preview").style.height = "auto";
        renderFmt();
      };

      /* ---------- 시작 ---------- */
      async function boot() {
        const today = new Date(),
          end = new Date(Date.now() + 6 * 864e5);
        const iso = (d) => d.toISOString().slice(0, 10);
        state.d1 = iso(today);
        state.d2 = iso(end);
        $("#d1").value = state.d1;
        $("#d2").value = state.d2;

        cfgProbe();
        let cfg = loadCfg(); // 저장된 접속 설정 복원 (있으면 기본값보다 우선)
        if (!cfg && PRESET && PRESET.csv && PRESET.csv.ProductMaster) {
          // 저장된 게 없으면 배포 기본값 사용
          $("#urlP").value = PRESET.csv.ProductMaster || "";
          $("#urlT").value = PRESET.csv.TemplateMaster || "";
          $("#urlH").value = PRESET.csv.HeroMaster || "";
          $("#urlC").value = PRESET.csv.ColorMaster || "";
          $("#proxyUrl").value = PRESET.proxy || "";
          cfg = {
            mode: "csv",
            csv: "manual",
            urlP: PRESET.csv.ProductMaster,
            _preset: true,
          };
        }
        cfgHint();

        try {
          LOGO.img = await loadImg(LOGO.src, true);
        } catch (e) {
          /* 텍스트 폴백 */
        }

        initGroups();
        dateHint();
        $("#zoom").dispatchEvent(new Event("input"));
        draw();
        try {
          await Promise.all([
            document.fonts.load("400 44px 'High Summit'"),
            document.fonts.load("400 80px 'Playfair Display'"),
            document.fonts.load("600 32px Pretendard"),
            document.fonts.load("700 28px Pretendard"),
            document.fonts.load("700 28px GmarketSans"),
          ]);
          await document.fonts.ready;
          status("준비됨");
        } catch (e) {
          status("일부 폰트 로드 실패 — 대체 서체로 표시될 수 있습니다.", 1);
        }
        draw();
        drawTplPreviews();
        fromUrl();

        // 저장된 설정이 있으면 데이터 소스를 복원하고 자동으로 불러온다
        if (cfg && cfg.mode && cfg.mode !== "sample") {
          if (cfg.seller) {
            state.seller = cfg.seller;
            $("#seller").value = cfg.seller;
          }
          if (cfg.d1) {
            state.d1 = cfg.d1;
            $("#d1").value = cfg.d1;
          }
          if (cfg.d2) {
            state.d2 = cfg.d2;
            $("#d2").value = cfg.d2;
          }
          dateHint();
          const b = $("#srcSeg").querySelector(`[data-s="${cfg.mode}"]`);
          if (b) b.click();
          if (cfg.mode === "csv" && cfg.csv === "manual")
            $("#csvManual").click();
          const hasInput =
            (cfg.mode === "gas" && cfg.gasUrl) ||
            (cfg.csv === "manual" ? cfg.urlP : cfg.docId);
          if (hasInput) {
            status(
              cfg._preset
                ? "시트를 불러오는 중…"
                : "저장된 설정으로 불러오는 중…",
            );
            await syncSheet();
          }
        }
        srcState();
      }
      boot();
