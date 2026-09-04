/* CC 배너 제너레이터 — 14-render-hero
   원본 index.html 에서 기능별로 분리. 로드 순서가 곧 실행 순서다. */
      /* ---- 히어로 01 : 사진 + 영문 세리프 + 날짜바 ---- */
      function hero01(ctx, W, th) {
        const H = SHARED.HERO_H;
        if (state.hero)
          clipRect(ctx, 0, 0, W, H, () => cover(ctx, state.hero, 0, 0, W, H));
        else {
          ctx.fillStyle = "#b89a6a";
          ctx.fillRect(0, 0, W, H);
          ctx.fillStyle = "rgba(255,255,255,.65)";
          ctx.textAlign = "center";
          ctx.font = "500 26px Pretendard";
          ctx.fillText("히어로 이미지를 업로드하세요", W / 2, H / 2);
        }
        // .fig 확인: 피그마 히어로에는 오버레이/그라데이션이 없음 → 사진 위에 바로 텍스트

        // txt-title: top100, flex-col gap8, center
        // subH = High Summit normal line-height(1.426) × 44px = 62.7 (폰트 메트릭 실측)
        const subH = HS_LH * 44,
          subCY = 100 + subH / 2;
        ctx.textBaseline = "middle";
        const seller = state.seller || "seller";
        ctx.font = `400 44px 'High Summit'`;
        const sw = ctx.measureText(seller).width;
        ctx.font = `400 40px 'Playfair Display'`;
        const xw = ctx.measureText("×").width;
        const logoW = 116,
          gap = 16,
          total = sw + gap + xw + gap + logoW;
        let x = (W - total) / 2;
        ctx.textAlign = "left";
        ctx.fillStyle = "#fff";
        ctx.font = `400 44px 'High Summit'`;
        ctx.fillText(seller, x, subCY);
        x += sw + gap;
        ctx.font = `400 40px 'Playfair Display'`;
        ctx.fillText("×", x, subCY);
        x += xw + gap;
        drawLogo(ctx, x, subCY, logoW, 19, "#fff");

        // headline: Playfair 80, lineH100, 2줄 — 각 line box 중앙에 배치
        const top = 100 + subH + 8;
        ctx.textAlign = "center";
        ctx.fillStyle = "#fff";
        ctx.font = `400 80px 'Playfair Display'`;
        [state.t1, state.t2].filter(Boolean).forEach((l, i) => {
          trk(ctx, l, W / 2, top + i * 100 + 50, -1.6, "center");
        });
        ctx.textBaseline = "alphabetic";

        // date bar
        ctx.fillStyle = th.accent;
        ctx.fillRect(0, 1000, W, 80);
        ctx.fillStyle = "#fff";
        ctx.font = `400 40px 'Playfair Display'`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        trk(ctx, range01(state.d1, state.d2), W / 2, 1040, -0.8, "center");
        ctx.textBaseline = "alphabetic";
      }

      /* ---- 히어로 02 : 그라데이션 배경 + 제품 누끼컷 + 한글 그라데이션 타이틀 + 카피바
   피그마 구조: main-img = 그라데이션 배경 프레임, 그 위에 제품 이미지가 얹힘.
   (사진을 cover로 깔고 그라데이션을 덮는 게 아님) ---- */
      function hero02(ctx, W, th) {
        const H = SHARED.HERO_H;
        // 그라데이션 배경 (141.81deg)
        const a = (141.81 * Math.PI) / 180,
          len = Math.abs(W * Math.cos(a)) + Math.abs(H * Math.sin(a));
        const cx = W / 2,
          cy = H / 2,
          dx = (Math.cos(a) * len) / 2,
          dy = (Math.sin(a) * len) / 2;
        const g = ctx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);
        g.addColorStop(0.0136, th.gradFrom);
        g.addColorStop(0.8337, th.gradTo);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
        // 제품 이미지 — 히어로 전체(860×1080)에 1:1 적용, 그라데이션 위에 얹힘
        // (.fig: main-img 의 IMAGE fill 이 프레임 전체를 채움)
        if (state.hero)
          clipRect(ctx, 0, 0, W, H, () => cover(ctx, state.hero, 0, 0, W, H));

        const left = (W - 751) / 2;
        // 셀러 필(pill) — px20, gap16, rounded
        ctx.font = `400 28px Pretendard`;
        const sw = ctx.measureText(state.seller || "seller").width;
        ctx.font = `400 36px 'Playfair Display'`;
        const xw = ctx.measureText("×").width;
        const logoW = 114,
          gap = 16,
          inner = sw + gap + xw + gap + logoW,
          pw = inner + 40,
          ph = PILL_H,
          py = 100;
        ctx.fillStyle = th.pillBg;
        roundRect(ctx, left, py, pw, ph, ph / 2);
        ctx.fill();
        ctx.textBaseline = "middle";
        ctx.textAlign = "left";
        ctx.fillStyle = "#fff";
        let x = left + 20,
          cy2 = py + ph / 2;
        ctx.font = `400 28px Pretendard`;
        ctx.fillText(state.seller || "seller", x, cy2);
        x += sw + gap;
        ctx.font = `400 36px 'Playfair Display'`;
        ctx.fillText("×", x, cy2);
        x += xw + gap;
        drawLogo(ctx, x, cy2, logoW, 19);

        // 타이틀 — 그라데이션 텍스트, 좌측정렬, lineH80 gap8
        const ht = py + ph + 40;
        ctx.textAlign = "left";
        const lines = [
          [state.t1, 400],
          [state.t2, 700],
        ].filter((l) => l[0]);
        lines.forEach((l, i) => {
          const y = ht + i * 88 + 40;
          const tg = ctx.createLinearGradient(left, 0, left + 751, 0);
          tg.addColorStop(0, th.titleFrom);
          tg.addColorStop(1, th.titleTo);
          ctx.fillStyle = tg;
          ctx.font = `${l[1]} 80px Pretendard`;
          trk(ctx, l[0], left, y, -1.6, "left");
        });

        // 기간 텍스트
        const dy2 = ht + (lines.length ? lines.length * 88 - 8 : 0) + 40 + 17;
        ctx.fillStyle = th.dateText;
        ctx.font = `400 34px Pretendard`;
        trk(ctx, range02(state.d1, state.d2), left, dy2, -0.68, "left");

        // 카피 바
        ctx.fillStyle = th.accent;
        ctx.fillRect(0, 1000, W, 80);
        ctx.fillStyle = "#fff";
        ctx.font = `400 32px Pretendard`;
        const w1 = trkWidth(ctx, state.copy, -0.64) + copyGap(ctx);
        ctx.font = `700 32px Pretendard`;
        const w2 = trkWidth(ctx, state.copyBold, -0.64);
        let bx2 = (W - (w1 + w2)) / 2;
        ctx.font = `400 32px Pretendard`;
        trk(ctx, state.copy, bx2, 1041, -0.64, "left");
        ctx.font = `700 32px Pretendard`;
        trk(ctx, state.copyBold, bx2 + w1, 1041, -0.64, "left");
        ctx.textBaseline = "alphabetic";
      }
