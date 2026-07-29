/* CC 배너 제너레이터 — 13-render-core
   원본 index.html 에서 기능별로 분리. 로드 순서가 곧 실행 순서다. */
      function canvasH() {
        if (nvIsOn()) return nvCanvasH();
        const O = OPT[state.tpl] || OPT["01"];
        return (
          SHARED.HERO_H +
          O.body.y +
          O.list.y +
          O.list.pad * 2 +
          cardTops().total +
          60
        );
      }

      function draw() {
        const W = SHARED.W,
          S = SHARED.SCALE;
        const c = $("#preview");
        if (!state.tpl) {
          // 템플릿 미등록 제품군
          c.width = W * S;
          c.height = 600 * S;
          const ctx = c.getContext("2d");
          ctx.setTransform(S, 0, 0, S, 0, 0);
          ctx.fillStyle = "#f2f0f6";
          ctx.fillRect(0, 0, W, 600);
          ctx.fillStyle = "#8a86a0";
          ctx.textAlign = "center";
          ctx.font = "500 28px Pretendard";
          ctx.fillText(
            G()[state.group].label + " 템플릿이 등록되지 않았습니다",
            W / 2,
            290,
          );
          ctx.font = "400 20px Pretendard";
          ctx.fillText(
            "피그마에 템플릿을 추가한 뒤 design.md에 규격을 등록하세요.",
            W / 2,
            330,
          );
          warnings();
          return;
        }
        const H = canvasH(),
          th = TH();
        c.width = W * S;
        c.height = H * S;
        const ctx = c.getContext("2d");
        ctx.setTransform(S, 0, 0, S, 0, 0);
        drawDetailTo(ctx, W, th);
        warnings();
        if (curFmt !== "detail") renderFmt(); // 썸네일/피드 탭이 열려있으면 같이 갱신
      }

      /* 상세페이지 본체 — 미리보기·ZIP 공용. ctx 는 이미 배율 적용된 상태로 받는다. */
      function drawDetailTo(ctx, W, th) {
        th = th || TH();
        if (nvIsOn()) { nvDetail(ctx, W, th); return; }
        const H = canvasH();
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = th.sectionBg || "#fff";
        ctx.fillRect(0, 0, W, H);

        state.tpl === "01" ? hero01(ctx, W, th) : hero02(ctx, W, th);

        const O = OPT[state.tpl];
        const oy = SHARED.HERO_H;
        const by = oy + O.body.y;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = th.eyebrowColor || th.accent;
        ctx.font = `${O.eyebrow.weight} ${O.eyebrow.size}px ${O.eyebrow.font}`;
        ctx.fillText("option info.", W / 2, by + O.eyebrow.lineH / 2);
        ctx.fillStyle = O.heading.color || th.accent;
        ctx.font = `${O.heading.weight} ${O.heading.size}px ${O.heading.font}, Pretendard`;
        ctx.fillText(
          state.series || "",
          W / 2,
          by + O.title.h - O.heading.lineH / 2,
        );
        ctx.textBaseline = "alphabetic";

        const { tops, total } = cardTops();
        const listY = by + O.list.y,
          listX = O.body.x;
        if (O.list.bg) {
          ctx.fillStyle = O.list.bg;
          ctx.fillRect(
            listX,
            listY,
            O.list.w,
            total - O.list.gap + O.list.pad * 2,
          );
        }
        const startY = listY + O.list.pad;
        const cardX = listX + O.list.pad;
        state.rows.forEach((r, i) => {
          const top = startY + tops[i].top;
          state.tpl === "01"
            ? card01(ctx, r, cardX, top, th)
            : card02(ctx, r, cardX, top, th);
        });
      }

      /* ---- 멀티 포맷 미리보기 ---- */
      let curFmt = "detail";
      function curTheme() {
        return (
          themesForKey(state.group, state.tpl)[state.theme] ||
          Object.values(themesForKey(state.group, state.tpl))[0]
        );
      }
      function renderThumbPreview() {
        const c = $("#thumbCanvas");
        if (!c || !state.tpl) return;
        c.width = 1080;
        c.height = 1080;
        const ctx = c.getContext("2d");
        ctx.clearRect(0, 0, 1080, 1080);
        try {
          drawThumb(ctx, curTheme());
        } catch (e) {
          console.error(e);
        }
        c.style.width = (1080 * +$("#zoom").value) / 100 + "px";
        c.style.height = "auto";
      }
      function renderFeedPreview() {
        const wrap = $("#feedScroll");
        if (!wrap || !state.tpl) return;
        wrap.innerHTML = "";
        const n = feedCount(),
          z = +$("#zoom").value / 100;
        for (let i = 0; i < n; i++) {
          const c = document.createElement("canvas");
          c.width = 1080;
          c.height = 1350;
          c.className = "feedslide";
          c.style.width = 1080 * z + "px";
          c.style.height = "auto";
          try {
            drawFeedSlide(c.getContext("2d"), i, curTheme());
          } catch (e) {
            console.error(e);
          }
          wrap.appendChild(c);
        }
      }
      function renderFmt() {
        if (curFmt === "thumb") renderThumbPreview();
        else if (curFmt === "feed") renderFeedPreview();
      }
      function switchFmt(f) {
        curFmt = f;
        $("#fmtTabs")
          .querySelectorAll("button")
          .forEach((b) => b.classList.toggle("on", b.dataset.f === f));
        $("#stageDetail").hidden = f !== "detail";
        $("#stageThumb").hidden = f !== "thumb";
        $("#stageFeed").hidden = f !== "feed";
        renderFmt();
      }
