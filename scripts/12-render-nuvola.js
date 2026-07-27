/* CC 배너 제너레이터 — 12-render-nuvola
   원본 index.html 에서 기능별로 분리. 로드 순서가 곧 실행 순서다. */
      /* ============================================================
   렌더러
   ============================================================ */
      /* 카드 높이는 제품명 줄 수에 따라 달라짐(피그마도 360/428 2종). 누적 계산. */
      function cardTops() {
        const out = [];
        let y = 0;
        for (const r of state.rows) {
          const h =
            cardMetrics(r, state.tpl === "01" ? 82 : 80).cardH -
            (state.tpl === "02" ? 6 : 0);
          out.push({ top: y, h });
          y += h + 20;
        }
        return { tops: out, total: y };
      }
      /* ══════════════ 누볼라 패밀리 렌더러 ══════════════
         .fig(CC자동화-배너_템플릿_nuvola) auto-layout 실측.
         뱀부 렌더러와 완전히 분리 — 서로 영향을 주지 않는다.
         구조: section-main(1080) + section-option(가변) + section-color(1080) */
      const NV = {
        MAIN_H: 1080,
        main: {
          tx: 55, ty: 101, tw: 751, gap: 8,
          subH: 63, subGap: 16, sellerSize: 44, xSize: 40, logoW: 116, logoH: 19,
          titleSize: 80, titleLineH: 100,
          barY: 1000, barH: 80, dateSize: 40,
        },
        opt: {
          padTop: 150, padBottom: 80, bodyX: 60, bodyW: 740,
          eyebrowSize: 36, eyebrowLineH: 40, headGap: 28, headingSize: 56,
          headToList: 80, listGap: 20,
          // .fig 기본 360 → 위아래 여유를 위해 410 (이미지도 함께 확대)
          cardH: 410, imgX: 10, imgY: 10, imgW: 320, imgH: 390,
          optX: 366, optW: 342, optGap: 36,
          badgeH: 36, badgeW: 120, badgeSize: 20, nameGap: 16,
          nameSize: 32, nameLineH: 40, txtOptW: 250, txtOptGap: 24,
          vlLabelW: 48, vlColGap: 8, vlValW: 194, vlRowH: 48, vlRowGap: 8, vlSize: 18,
          discD: 80, discSize: 28,
          priceH: 82, priceRowH: 36, priceGap: 10,
          normalSize: 20, saleSize: 28,
          noticeH: 80, noticeSize: 24, sizeInfoH: 552,
        },
        color: {
          H: 1080, txtY: 120, txtGap: 28,
          eyebrowSize: 36, eyebrowLineH: 40, headingSize: 56,
          listLineH: 40, listGap: 4, listSize: 28, listLabelGap: 10,
          optY: 416, optW: 780, rowGap: 38, chipGap: 12,
          chipMaxW: 120, chipLabelH: 40, chipLabelGap: 4, chipLabelSize: 24,
        },
      };
      /* 템플릿별 헤딩 서체 (.fig 실측) — 01 검증 완료, 02·03 은 해당 템플릿 작업 시 확정 */
      const NV_TPL = {
        // main: photo(01) / grad(02) / grid(03)
        // optDark: 옵션 섹션이 진한 배경인가 · colorDark: 컬러 섹션이 진한 배경인가
        // colorBox: 컬러 칩을 흰 컨테이너로 감싸는가 · chipLabel: 칩 이름 색
        "01": { main: "photo", optDark: false, colorDark: true, colorBox: false,
                chipLabel: "#ffffff", noticeKey: "noticeBg",
                optEyebrow: 36, optEyebrowLH: 40, optHeading: 56,
                colEyebrow: 36, colEyebrowLH: 40, colHeading: 56 },
        "02": { main: "grad", optDark: true, colorDark: false, colorBox: false,
                chipLabel: "accent", noticeKey: "white",
                optEyebrow: 48, optEyebrowLH: 53, optHeading: 56,
                colEyebrow: 48, colEyebrowLH: 53, colHeading: 56 },
        "03": { main: "grid", optDark: true, colorDark: false, colorBox: true,
                chipLabel: "#666666", noticeKey: "colorBgLight",
                optEyebrow: 48, optEyebrowLH: 53, optHeading: 80,
                colEyebrow: 48, colEyebrowLH: 53, colHeading: 72 },
      };
      /* 섹션 배경 헬퍼 */
      function nvOptBg(th) {
        const C = nvCfg();
        return C.optDark ? th.colorBg : th.colorBgLight;
      }
      function nvColorBg(th) {
        const C = nvCfg();
        return C.colorDark ? th.colorBg : th.colorBgLight;
      }
      function nvOnDark(which) {
        const C = nvCfg();
        return which === "color" ? C.colorDark : C.optDark;
      }
      function nvChipLabel(th) {
        const c = nvCfg().chipLabel;
        return c === "accent" ? th.accent : c;
      }
      function nvNoticeBg(th) {
        const k = nvCfg().noticeKey;
        return k === "white" ? "#f4f4f4" : th[k] || "#eee";
      }
      function nvCfg() { return NV_TPL[state.tpl] || NV_TPL["01"]; }
      /* 섹션 제목: 템플릿별(TemplateMaster) → 그룹 공통 → 폴백 */
      function nvTitle(kind) {
        const g = nvG();
        const byTpl = kind === "option" ? g.optionTitleByTpl : g.colorTitleByTpl;
        return (
          (byTpl && byTpl[state.tpl]) ||
          (kind === "option" ? state.series || g.seriesTitle : g.colorTitle) ||
          (kind === "option" ? "" : `${g.label || ""} 컬러 안내`)
        );
      }
      function nvIsOn() { return curFam() === "nuvola"; }
      function nvG() { return G()[state.group] || {}; }

      /* ── 높이 계산 (auto-layout 합산) ── */
      function nvOptionListH() {
        const O = NV.opt;
        let n = state.rows.length, h = n * O.cardH;
        if (state.notice) { h += O.noticeH; n++; }
        if (state.sizeInfoOn && nvSizeInfoImg()) { h += O.sizeInfoH; n++; }
        if (n > 1) h += (n - 1) * O.listGap;
        return h;
      }
      function nvOptionH() {
        const O = NV.opt, C = nvCfg();
        const head = C.optEyebrowLH + O.headGap + C.optHeading; // 01 = 124
        return O.padTop + head + O.headToList + nvOptionListH() + O.padBottom;
      }
      function nvCanvasH() { return NV.MAIN_H + nvOptionH() + nvColorMetrics().H; }

      /* ── section-main : 01 사진형 / 02 그라데이션형 / 03 그리드형 ── */
      const NVM = {
        // 공통 타이틀 블록 위치
        tx: 55, ty: 100, tw: 751,
        // 02·03 공통 pill
        pill: { h: 48, r: 24, padL: 20, padR: 20, gap: 16,
                sellerSize: 28, xSize: 36, logoW: 114, logoH: 19 },
        blockGap: 40, titleGap: 8, dateSize: 34,
        t02: { size: 80, lineH: 80 },
        t03: { size1: 60, size2: 80, lineH: 80 },
        bar: { y: 1000, h: 80, copySize: 32 },
        grid: { x: 65, y: 397, w: 740, h: 600, pad: 20, cw: 345, ch: 260, gx: 10, gy: 10 },
      };
      /* pill (셀러 × 로고) — 02·03 공용. 그린 배경 알약 */
      function nvPill(ctx, x, y, th) {
        const P = NVM.pill;
        const seller = state.seller || "seller";
        ctx.font = `400 ${P.sellerSize}px Pretendard`;
        const sw = ctx.measureText(seller).width;
        ctx.font = `400 ${P.xSize}px 'Playfair Display'`;
        const xw = ctx.measureText("×").width;
        const w = P.padL + sw + P.gap + xw + P.gap + P.logoW + P.padR;
        ctx.fillStyle = th.pillBg || th.accent;
        roundRect(ctx, x, y, w, P.h, P.h / 2);
        ctx.fill();
        ctx.textBaseline = "middle"; ctx.textAlign = "left"; ctx.fillStyle = "#fff";
        let cx = x + P.padL, cy = y + P.h / 2;
        ctx.font = `400 ${P.sellerSize}px Pretendard`;
        ctx.fillText(seller, cx, cy); cx += sw + P.gap;
        ctx.font = `400 ${P.xSize}px 'Playfair Display'`;
        ctx.fillText("×", cx, cy); cx += xw + P.gap;
        drawLogo(ctx, cx, cy, P.logoW, P.logoH);
        ctx.textBaseline = "alphabetic";
        return P.h;
      }
      function nvMain(ctx, W, th) {
        const H = NV.MAIN_H, C = nvCfg();
        if (C.main === "photo") return nvMain01(ctx, W, H, th);
        if (C.main === "grad") return nvMain02(ctx, W, H, th);
        return nvMain03(ctx, W, H, th);
      }
      /* 01 — 배경 사진 + 중앙 흰 타이틀 + 날짜 바 */
      function nvMain01(ctx, W, H, th) {
        const M = NV.main;
        if (state.hero)
          clipRect(ctx, 0, 0, W, H, () => cover(ctx, state.hero, 0, 0, W, H));
        else { ctx.fillStyle = "#c9c9c9"; ctx.fillRect(0, 0, W, H); }
        const og = ctx.createLinearGradient(0, 0, 0, H);
        og.addColorStop(0, "rgba(0,0,0,.30)");
        og.addColorStop(0.5, "rgba(0,0,0,.06)");
        og.addColorStop(1, "rgba(0,0,0,.02)");
        ctx.fillStyle = og; ctx.fillRect(0, 0, W, H);

        const cx = M.tx + M.tw / 2;
        ctx.textBaseline = "middle"; ctx.fillStyle = "#fff";
        const seller = state.seller || "seller";
        ctx.font = `400 ${M.sellerSize}px 'High Summit'`;
        const sw = ctx.measureText(seller).width;
        ctx.font = `400 ${M.xSize}px 'Playfair Display'`;
        const xw = ctx.measureText("×").width;
        const subW = sw + M.subGap + xw + M.subGap + M.logoW;
        let sx = cx - subW / 2;
        const scy = M.ty + M.subH / 2;
        ctx.textAlign = "left";
        ctx.font = `400 ${M.sellerSize}px 'High Summit'`;
        ctx.fillText(seller, sx, scy); sx += sw + M.subGap;
        ctx.font = `400 ${M.xSize}px 'Playfair Display'`;
        ctx.fillText("×", sx, scy); sx += xw + M.subGap;
        drawLogo(ctx, sx, scy, M.logoW, M.logoH);

        const ty = M.ty + M.subH + M.gap;
        ctx.textAlign = "center";
        ctx.font = `400 ${M.titleSize}px 'Playfair Display'`;
        [state.t1, state.t2].filter(Boolean).forEach((l, i) =>
          trk(ctx, l, cx, ty + M.titleLineH / 2 + i * M.titleLineH, -1.6, "center"),
        );
        ctx.fillStyle = th.accent;
        ctx.fillRect(0, M.barY, W, M.barH);
        ctx.fillStyle = "#fff"; ctx.textAlign = "center";
        ctx.font = `400 ${M.dateSize}px 'Playfair Display'`;
        trk(ctx, range01(state.d1, state.d2), W / 2, M.barY + M.barH / 2, -0.8, "center");
        ctx.textBaseline = "alphabetic";
      }
      /* 02 — 사진 + 그라데이션 타이틀 + 하단 카피 바 */
      function nvMain02(ctx, W, H, th) {
        const M = NVM;
        // .fig: main-img 는 그라데이션 + 사진. 사진이 없으면 그라데이션만 보인다.
        const a = (141.81 * Math.PI) / 180,
          len = Math.abs(W * Math.cos(a)) + Math.abs(H * Math.sin(a));
        const bg = ctx.createLinearGradient(
          W / 2 - (Math.cos(a) * len) / 2, H / 2 - (Math.sin(a) * len) / 2,
          W / 2 + (Math.cos(a) * len) / 2, H / 2 + (Math.sin(a) * len) / 2);
        bg.addColorStop(0, th.colorBgLight || "#f0f3dd");
        bg.addColorStop(1, th.mainBg || "#ffffff");
        ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
        if (state.hero)
          clipRect(ctx, 0, 0, W, H, () => cover(ctx, state.hero, 0, 0, W, H));
        let y = M.ty;
        y += nvPill(ctx, M.tx, y, th) + M.blockGap;
        // 타이틀: 1줄(Regular) + gap8 + 나머지(Bold), 그라데이션
        ctx.textAlign = "left"; ctx.textBaseline = "middle";
        const g = ctx.createLinearGradient(M.tx, 0, M.tx + M.tw, 0);
        g.addColorStop(0, th.titleColor || th.accent);
        g.addColorStop(1, th.accent);
        const L1 = String(state.t1 || "").split(/\r?\n/).filter(Boolean);
        const L2 = String(state.t2 || "").split(/\r?\n/).filter(Boolean);
        L1.forEach((l, i) => {
          ctx.fillStyle = g; ctx.font = `400 ${M.t02.size}px Pretendard`;
          trk(ctx, l, M.tx, y + M.t02.lineH / 2 + i * M.t02.lineH, -1.6, "left");
        });
        y += L1.length * M.t02.lineH + (L1.length ? M.titleGap : 0);
        L2.forEach((l, i) => {
          ctx.fillStyle = g; ctx.font = `700 ${M.t02.size}px Pretendard`;
          trk(ctx, l, M.tx, y + M.t02.lineH / 2 + i * M.t02.lineH, -1.6, "left");
        });
        y += L2.length * M.t02.lineH + M.blockGap;
        ctx.fillStyle = th.accent;
        ctx.font = `400 ${M.dateSize}px Pretendard`;
        trk(ctx, range02(state.d1, state.d2), M.tx, y + M.dateSize / 2, -0.68, "left");
        // 하단 카피 바
        ctx.fillStyle = th.accent;
        ctx.fillRect(0, M.bar.y, W, M.bar.h);
        ctx.fillStyle = "#fff"; ctx.textAlign = "center";
        ctx.font = `400 ${M.bar.copySize}px Pretendard`;
        const c1 = trkWidth(ctx, state.copy, -0.64);
        ctx.font = `700 ${M.bar.copySize}px Pretendard`;
        const c2 = trkWidth(ctx, state.copyBold, -0.64);
        let bx = (W - (c1 + c2)) / 2, bcy = M.bar.y + M.bar.h / 2;
        ctx.textAlign = "left";
        ctx.font = `400 ${M.bar.copySize}px Pretendard`;
        trk(ctx, state.copy, bx, bcy, -0.64, "left");
        ctx.font = `700 ${M.bar.copySize}px Pretendard`;
        trk(ctx, state.copyBold, bx + c1, bcy, -0.64, "left");
        ctx.textBaseline = "alphabetic";
      }
      /* 03 — 밝은 배경 + 타이틀 + 제품 이미지 4컷 그리드 */
      function nvMain03(ctx, W, H, th) {
        const M = NVM, G = NVM.grid;
        ctx.fillStyle = th.mainBg || "#f8fbe1";
        ctx.fillRect(0, 0, W, H);
        if (state.hero) clipRect(ctx, 0, 0, W, H, () => cover(ctx, state.hero, 0, 0, W, H));
        let y = M.ty;
        y += nvPill(ctx, M.tx, y, th) + M.blockGap;
        ctx.textAlign = "left"; ctx.textBaseline = "middle";
        ctx.fillStyle = th.titleColor || th.accent;
        const L1 = String(state.t1 || "").split(/\r?\n/).filter(Boolean);
        const L2 = String(state.t2 || "").split(/\r?\n/).filter(Boolean);
        L1.forEach((l, i) => {
          ctx.font = `400 ${M.t03.size1}px Pretendard`;
          trk(ctx, l, M.tx, y + M.t03.lineH / 2 + i * M.t03.lineH, -1.2, "left");
        });
        y += L1.length * M.t03.lineH + (L1.length ? M.titleGap : 0);
        L2.forEach((l, i) => {
          ctx.font = `700 ${M.t03.size2}px Pretendard`;
          trk(ctx, l, M.tx, y + M.t03.lineH / 2 + i * M.t03.lineH, -1.6, "left");
        });
        y += L2.length * M.t03.lineH + M.blockGap;
        ctx.fillStyle = th.pillBg || th.accent;
        ctx.font = `400 ${M.dateSize}px Pretendard`;
        trk(ctx, range01(state.d1, state.d2), M.tx, y + M.dateSize / 2, -0.68, "left");
        // 이미지 4컷 그리드
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(G.x, G.y, G.w, G.h);
        const imgs = nvGridImgs();
        const pos = [
          [G.x + G.pad, G.y + G.pad],
          [G.x + G.pad + G.cw + G.gx, G.y + G.pad],
          [G.x + G.pad, G.y + G.pad + G.ch + G.gy],
          [G.x + G.pad + G.cw + G.gx, G.y + G.pad + G.ch + G.gy],
        ];
        pos.forEach(([px, py], i) => {
          ctx.fillStyle = "#f4f2ee";
          ctx.fillRect(px, py, G.cw, G.ch);
          const im = imgs[i];
          if (im) clipRect(ctx, px, py, G.cw, G.ch, () => cover(ctx, im, px, py, G.cw, G.ch));
        });
        ctx.textBaseline = "alphabetic";
      }

      /* ── 옵션 카드 (740×360) ── */
      function nvCard(ctx, r, x, top, th) {
        const O = NV.opt;
        ctx.fillStyle = "#fff"; ctx.fillRect(x, top, O.bodyW, O.cardH);
        ctx.fillStyle = "#f8f8f8";
        ctx.fillRect(x + O.imgX, top + O.imgY, O.imgW, O.imgH);
        if (r.thumb)
          drawThumbCover(ctx, r.thumb, x + O.imgX, top + O.imgY, O.imgW, O.imgH);

        const ix = x + O.optX;
        const badgeOn = r.badge !== "none";
        // 내용 측정 → 높이 계산
        _mc.font = `600 ${O.nameSize}px Pretendard`;
        const lns = [];
        for (const para of String(rowName(r)).split(/\r?\n/)) {
          const t = para.trim();
          if (t) lns.push(...wrapText(_mc, t, O.txtOptW, -0.64));
        }
        const attrs = cardAttrs(r);
        const rowHs = attrs.map((a) => {
          _mc.font = `400 ${O.vlSize}px Pretendard`;
          const vl = wrapText(_mc, String(a.value || ""), O.vlValW, -0.36);
          return Math.max(O.vlRowH, vl.length * 24);
        });
        const vlH = rowHs.length
          ? rowHs.reduce((a, b) => a + b, 0) + (rowHs.length - 1) * O.vlRowGap
          : 0;
        const txtOptH = lns.length * O.nameLineH + (vlH ? O.txtOptGap + vlH : 0);
        const boxTopH = Math.max(txtOptH, O.discD);
        const nameWrapH = (badgeOn ? O.badgeH + O.nameGap : 0) + boxTopH;
        const infoH = nameWrapH + O.optGap + O.priceH;
        const iy = top + (O.cardH - infoH) / 2;

        ctx.textAlign = "left"; ctx.textBaseline = "middle";
        let ny = iy;
        if (badgeOn) {
          const bt = r.badge === "renewal" ? "RENEWAL!" : "NEW!";
          ctx.font = `600 ${O.badgeSize}px Pretendard`;
          const bw = Math.max(O.badgeW, trkWidth(ctx, bt, -0.4) + 36);
          ctx.strokeStyle = th.badgeBorder || th.accent;
          ctx.lineWidth = 2;
          roundRect(ctx, ix, ny, bw, O.badgeH, O.badgeH / 2);
          ctx.stroke();
          ctx.fillStyle = th.accent;
          trk(ctx, bt, ix + bw / 2, ny + O.badgeH / 2, -0.4, "center");
          ny += O.badgeH + O.nameGap;
        }
        // box-top: [txt_option 250] gap12 [discount 80] — 둘 다 세로 중앙
        const btY = ny;
        const tY = btY + (boxTopH - txtOptH) / 2;
        ctx.fillStyle = "#333333";
        ctx.font = `600 ${O.nameSize}px Pretendard`;
        ctx.textAlign = "left";
        lns.forEach((l, i) =>
          trk(ctx, l, ix, tY + O.nameLineH / 2 + i * O.nameLineH, -0.64, "left"),
        );
        let vy = tY + lns.length * O.nameLineH + O.txtOptGap;
        attrs.forEach((a, i) => {
          // .fig: 라벨 18px Bold #666666 / 값 18px Regular #888888
          ctx.font = `700 ${O.vlSize}px Pretendard`;
          ctx.fillStyle = "#666666";
          trk(ctx, a.label || "", ix, vy + 12, -0.36, "left");
          ctx.fillStyle = "#888888";
          ctx.font = `400 ${O.vlSize}px Pretendard`; // 값은 Regular
          _mc.font = `400 ${O.vlSize}px Pretendard`;
          const vl = wrapText(_mc, String(a.value || ""), O.vlValW, -0.36);
          vl.forEach((t, k) =>
            trk(ctx, t, ix + O.vlLabelW + O.vlColGap, vy + 12 + k * 24, -0.36, "left"),
          );
          vy += rowHs[i] + O.vlRowGap;
        });
        // 할인율 원
        const d = disc(r.normal, r.sale);
        // .fig: discount_rate @(262,0) → box-top 상단 정렬 (제품명 첫 줄과 맞춤)
        const dx = ix + O.txtOptW + 12, dy = btY;
        ctx.fillStyle = th.accent;
        ctx.beginPath();
        ctx.arc(dx + O.discD / 2, dy + O.discD / 2, O.discD / 2, 0, 7);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = `700 ${O.discSize}px GmarketSans, Pretendard`;
        ctx.textAlign = "center";
        trk(ctx, d != null ? d + "%" : "—", dx + O.discD / 2, dy + O.discD / 2, -0.5, "center");
        // 가격
        const G0 = nvG();
        const py = iy + nameWrapH + O.optGap;
        const pcy = py + O.priceRowH / 2;
        ctx.textAlign = "left";
        ctx.fillStyle = "#666666";
        // .fig: 정상가 라벨 SemiBold / 값 Regular + 취소선
        ctx.font = `600 ${O.normalSize}px Pretendard`;
        trk(ctx, G0.normalLabel || "정상가", ix, pcy, -0.4, "left");
        ctx.font = `400 ${O.normalSize}px Pretendard`;
        const npTxt = won(r.normal);
        trk(ctx, npTxt, ix + O.optW, pcy, -0.4, "right");
        const npW = trkWidth(ctx, npTxt, -0.4);
        ctx.strokeStyle = "#666666";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(ix + O.optW - npW, pcy);
        ctx.lineTo(ix + O.optW, pcy);
        ctx.stroke();
        const py2 = py + O.priceRowH + O.priceGap;
        ctx.fillStyle = "#333333";
        ctx.font = `600 ${O.saleSize}px Pretendard`;
        trk(ctx, G0.saleLabel || "혜택가", ix, py2 + O.priceRowH / 2, -0.56, "left");
        ctx.font = `700 ${O.saleSize}px Pretendard`;
        trk(ctx, won(r.sale), ix + O.optW, py2 + O.priceRowH / 2, -0.56, "right");
        ctx.textBaseline = "alphabetic";
      }

      /* ── section-option ── */
      function nvOption(ctx, W, oy, th) {
        const O = NV.opt, g = nvG();
        // 배경: 01=연한 톤 / 02·03=진한 톤 (.fig 실측)
        ctx.fillStyle = nvOptBg(th) || "#f0f3dd";
        ctx.fillRect(0, oy, W, nvOptionH());
        const cx = W / 2;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        const C = nvCfg();
        const optInk = nvOnDark("option") ? "#ffffff" : th.accent;
        ctx.fillStyle = optInk;
        ctx.font = `400 ${C.optEyebrow}px 'Playfair Display'`;
        ctx.fillText("option info.", cx, oy + O.padTop + C.optEyebrowLH / 2);
        ctx.font = `600 ${C.optHeading}px Pretendard`;
        ctx.fillText(
          nvTitle("option"),
          cx,
          oy + O.padTop + C.optEyebrowLH + O.headGap + C.optHeading / 2,
        );
        ctx.textBaseline = "alphabetic";
        let y = oy + O.padTop + C.optEyebrowLH + O.headGap + C.optHeading + O.headToList;
        const x = O.bodyX;
        state.rows.forEach((r) => { nvCard(ctx, r, x, y, th); y += O.cardH + O.listGap; });
        if (state.notice) {
          ctx.fillStyle = nvNoticeBg(th);
          ctx.fillRect(x, y, O.bodyW, O.noticeH);
          ctx.fillStyle = th.accent;
          ctx.font = `400 ${O.noticeSize}px Pretendard`;
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          trk(ctx, state.notice, x + O.bodyW / 2, y + O.noticeH / 2, -0.48, "center");
          ctx.textBaseline = "alphabetic";
          y += O.noticeH + O.listGap;
        }
        const sImg = state.sizeInfoOn ? nvSizeInfoImg() : null;
        if (sImg) {
          clipRect(ctx, x, y, O.bodyW, O.sizeInfoH, () =>
            cover(ctx, sImg, x, y, O.bodyW, O.sizeInfoH),
          );
          y += O.sizeInfoH + O.listGap;
        }
      }

      /* ── section-color 치수 계산 (줄 수·색 개수에 따라 가변) ── */
      function nvColorMetrics() {
        const K = NV.color;
        const lines = colorLines();
        const rows = lines
          .map((l) => ({ label: l.label, list: pickedColors(l.key) }))
          .filter((r) => r.list.length);
        const L = Math.max(1, rows.length);
        const n = Math.max(1, ...rows.map((r) => r.list.length));
        const chipW = Math.min(K.chipMaxW, (K.optW - K.chipGap * (n - 1)) / n);
        const imgH = chipW / COLOR_RATIO;
        const chipH = imgH + K.chipLabelGap + K.chipLabelH;
        const C = nvCfg();
        const headH = C.colEyebrowLH + K.txtGap + C.colHeading; // 01 = 124
        const nameH = L * K.listLineH + (L - 1) * K.listGap;
        const txtEnd = K.txtY + headH + K.txtGap + nameH;
        const optY = txtEnd + 60; // .fig: txt-wrap 끝 → color_option 간격 60
        const optH = L * chipH + (L - 1) * K.rowGap;
        const H = Math.max(K.H, optY + optH + 98); // .fig 하단 여백 98
        return { rows, L, chipW, imgH, chipH, headH, nameH, txtEnd, optY, optH, H };
      }

      /* ── section-color (선택한 색만 출력) ── */
      function nvColor(ctx, W, top, th) {
        const K = NV.color, g = nvG(), M = nvColorMetrics();
        const onDark = nvOnDark("color");
        const ink = onDark ? "#ffffff" : th.accent;
        ctx.fillStyle = nvColorBg(th) || "#ddd";
        ctx.fillRect(0, top, W, M.H);
        // 03: 칩을 흰 컨테이너로 감싼다 (.fig color_option #ffffff)
        if (nvCfg().colorBox) {
          const bw = 800, bx = (W - bw) / 2;
          const bh = M.optH + 100;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(bx, top + M.optY - 40, bw, bh);
        }
        const cx = W / 2;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillStyle = ink;
        const C = nvCfg();
        ctx.fillStyle = ink;
        ctx.font = `400 ${C.colEyebrow}px 'Playfair Display'`;
        ctx.fillText("color info.", cx, top + K.txtY + C.colEyebrowLH / 2);
        ctx.font = `600 ${C.colHeading}px Pretendard`;
        ctx.fillText(
          nvTitle("color"),
          cx,
          top + K.txtY + C.colEyebrowLH + K.txtGap + C.colHeading / 2,
        );
        // 줄별 색상명
        let ly = top + K.txtY + M.headH + K.txtGap;
        for (const r of M.rows) {
          const names = r.list.map((c) => c.label).join(", ");
          ctx.font = `700 ${K.listSize}px Pretendard`;
          const lw = r.label ? ctx.measureText(r.label).width : 0;
          ctx.font = `400 ${K.listSize}px Pretendard`;
          const nw = ctx.measureText(names).width;
          const gap = r.label ? K.listLabelGap : 0;
          let lx = cx - (lw + gap + nw) / 2;
          ctx.textAlign = "left"; ctx.fillStyle = ink;
          if (r.label) {
            ctx.font = `700 ${K.listSize}px Pretendard`;
            ctx.fillText(r.label, lx, ly + K.listLineH / 2);
          }
          ctx.font = `400 ${K.listSize}px Pretendard`;
          ctx.fillText(names, lx + lw + gap, ly + K.listLineH / 2);
          ly += K.listLineH + K.listGap;
        }
        // 칩 그리드 — 모든 줄의 칩 폭을 같이 맞춘다
        let ry = top + M.optY;
        for (const r of M.rows) {
          const rowW = r.list.length * M.chipW + (r.list.length - 1) * K.chipGap;
          let rx = cx - rowW / 2;
          for (const c of r.list) {
            if (c.img) drawRatioFit(ctx, c.img, rx, ry, M.chipW, M.imgH, COLOR_RATIO);
            ctx.fillStyle = nvChipLabel(th);
            ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.font = `400 ${K.chipLabelSize}px Pretendard`;
            trk(ctx, c.label, rx + M.chipW / 2,
                ry + M.imgH + K.chipLabelGap + K.chipLabelH / 2, -0.48, "center");
            rx += M.chipW + K.chipGap;
          }
          ry += M.chipH + K.rowGap;
        }
        ctx.textBaseline = "alphabetic";
      }

      /* ══════ 누볼라 썸네일(1080²) · 인스타 피드(1080×1350) ══════
         .fig auto-layout 실측. 피드는 4장: 히어로 / 옵션 / 사이즈안내 / 컬러 */
      const NVF = {
        // 공통 타이틀 블록 (썸네일·피드 히어로 동일)
        title: { x: 77, y: 110, w: 926, gap: 10,
                 subH: 80, subGap: 20, sellerSize: 56, xSize: 48, logoW: 140, logoH: 23,
                 size: 96, lineH: 124 },
        thumbH: 1080,
        feedH: 1350,
        bar: { y: 1250, h: 100, dateSize: 44 },
        // 옵션 슬라이드
        opt: { headX: 60, headY: 100, headW: 960,
               eyebrow: 40, eyebrowLH: 53, headGap: 20, heading: 72, headingLH: 76,
               listX: 60, listY: 309, listW: 960, cardH: 468, listGap: 20,
               imgX: 10, imgY: 10, imgW: 416, imgH: 448,
               optX: 474, optW: 448, optGap: 47,
               badgeH: 49, badgeSize: 28, nameGap: 20, boxTopGap: 16,
               txtW: 324, txtGap: 24, nameSize: 40, nameLineH: 52,
               vlLabelW: 60, vlColGap: 8, vlValW: 256, vlSize: 24, vlRowH: 32, vlRowGap: 8,
               discD: 104, discSize: 36,
               priceRowH: 47, priceGap: 12, normalSize: 28, saleSize: 40 },
        // 사이즈 안내 슬라이드
        // boxX: .fig 는 40 이라 20px 틀어져 있어 가운데(60)로 보정
        size: { headY: 90, boxX: 60, boxY: 309, boxW: 960, boxH: 956,
                imgY: 20, imgH: 717, ntW: 880, ntH: 115, ntY: 801, ntSize: 32 },
        // 02·03 전용
        t02: { titleX: 88, titleY: 130, titleW: 900, blockGap: 48,
               pillH: 60, pillPadL: 24, pillGap: 20, sellerSize: 32, xSize: 44,
               logoW: 136, logoH: 23,
               size: 96, lineH: 104, titleGap: 8, dateSize: 40,
               barY: 1250, barH: 100, copySize: 44 },
        t03: { titleX: 60, titleY: 140, titleW: 960, blockGap: 48,
               pillH: 48, pillPadL: 20, pillGap: 16, sellerSize: 28, xSize: 36,
               logoW: 114, logoH: 19,
               size1: 60, size2: 120, lineH: 92, dateSize: 48,
               grid: { x: 60, y: 450, w: 960, h: 764, pad: 20, cw: 455, ch: 357, gx: 10, gy: 10 } },
        // 썸네일(1080²) 전용 좌표
        th02: { titleX: 59, titleY: 87, titleW: 900, blockGap: 48,
                pillH: 60, pillPadL: 24, pillGap: 20, sellerSize: 32, xSize: 44,
                logoW: 136, logoH: 23,
                size: 96, lineH: 104, titleGap: 8, dateSize: 40,
                barY: 980, barH: 100, copySize: 44 },
        th03: { titleX: 60, titleY: 120, titleW: 960, blockGap: 48,
                pillH: 48, pillPadL: 20, pillGap: 16, sellerSize: 28, xSize: 36,
                logoW: 114, logoH: 19,
                size1: 60, size2: 120, lineH: 92, dateSize: 48,
                grid: { x: 60, y: 430, w: 960, h: 570, pad: 20, cw: 455, ch: 260, gx: 10, gy: 10 } },
        // 02·03 옵션 슬라이드: 흰 컨테이너로 카드 감쌈
        optBox: { x: 60, y: 330, w: 960, pad: 20, cardW: 920, cardH: 460, gap: 20 },
        // 컬러 슬라이드
        color: { txtX: 40, txtY: 115, txtW: 1000, txtGap: 36,
                 eyebrow: 40, eyebrowLH: 53, headGap: 20, heading: 72, headingLH: 76,
                 listLineH: 48, listGap: 4, listSize: 36, listLabelGap: 12,
                 optY: 431, optPadTop: 75, optW: 1000, rowW: 938, rowGap: 48,
                 chipGap: 10, chipMaxW: 148, chipLabelH: 48, chipLabelSize: 30 },
      };

      /* 피드·썸네일용 pill (02·03) */
      function nvfPill(ctx, x, y, th, C) {
        const seller = state.seller || "seller";
        ctx.font = `400 ${C.sellerSize}px Pretendard`;
        const sw = ctx.measureText(seller).width;
        ctx.font = `400 ${C.xSize}px 'Playfair Display'`;
        const xw = ctx.measureText("×").width;
        const w = C.pillPadL * 2 + sw + C.pillGap + xw + C.pillGap + C.logoW;
        ctx.fillStyle = th.pillBg || th.accent;
        roundRect(ctx, x, y, w, C.pillH, C.pillH / 2);
        ctx.fill();
        ctx.textBaseline = "middle"; ctx.textAlign = "left"; ctx.fillStyle = "#fff";
        let cx = x + C.pillPadL, cy = y + C.pillH / 2;
        ctx.font = `400 ${C.sellerSize}px Pretendard`;
        ctx.fillText(seller, cx, cy); cx += sw + C.pillGap;
        ctx.font = `400 ${C.xSize}px 'Playfair Display'`;
        ctx.fillText("×", cx, cy); cx += xw + C.pillGap;
        drawLogo(ctx, cx, cy, C.logoW, C.logoH);
        ctx.textBaseline = "alphabetic";
        return C.pillH;
      }
      /* 4컷 그리드 (03 썸네일·피드) */
      function nvfGrid(ctx, G) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(G.x, G.y, G.w, G.h);
        const imgs = nvGridImgs();
        const pos = [
          [G.x + G.pad, G.y + G.pad],
          [G.x + G.pad + G.cw + G.gx, G.y + G.pad],
          [G.x + G.pad, G.y + G.pad + G.ch + G.gy],
          [G.x + G.pad + G.cw + G.gx, G.y + G.pad + G.ch + G.gy],
        ];
        pos.forEach(([px, py], i) => {
          ctx.fillStyle = "#f4f2ee";
          ctx.fillRect(px, py, G.cw, G.ch);
          const im = imgs[i];
          if (im) clipRect(ctx, px, py, G.cw, G.ch, () => cover(ctx, im, px, py, G.cw, G.ch));
        });
      }
      /* 히어로 + 타이틀 — 템플릿별 (01 사진 / 02 그라데이션 / 03 그리드) */
      function nvfHero(ctx, W, H, th, withBar, mode) {
        const kind = nvCfg().main;
        const isThumb = mode === "thumb";
        if (kind === "grad")
          return nvfHero02(ctx, W, H, th, withBar, isThumb ? NVF.th02 : NVF.t02);
        if (kind === "grid")
          return nvfHero03(ctx, W, H, th, isThumb ? NVF.th03 : NVF.t03);
        return nvfHero01(ctx, W, H, th, withBar);
      }
      function nvfHero01(ctx, W, H, th, withBar) {
        const T = NVF.title;
        if (state.hero)
          clipRect(ctx, 0, 0, W, H, () => cover(ctx, state.hero, 0, 0, W, H));
        else { ctx.fillStyle = "#c9c9c9"; ctx.fillRect(0, 0, W, H); }
        const og = ctx.createLinearGradient(0, 0, 0, H);
        og.addColorStop(0, "rgba(0,0,0,.30)");
        og.addColorStop(0.5, "rgba(0,0,0,.06)");
        og.addColorStop(1, "rgba(0,0,0,.02)");
        ctx.fillStyle = og; ctx.fillRect(0, 0, W, H);
        const cx = T.x + T.w / 2;
        ctx.textBaseline = "middle"; ctx.fillStyle = "#fff";
        const seller = state.seller || "seller";
        ctx.font = `400 ${T.sellerSize}px 'High Summit'`;
        const sw = ctx.measureText(seller).width;
        ctx.font = `400 ${T.xSize}px 'Playfair Display'`;
        const xw = ctx.measureText("×").width;
        const subW = sw + T.subGap + xw + T.subGap + T.logoW;
        let sx = cx - subW / 2;
        const scy = T.y + T.subH / 2;
        ctx.textAlign = "left";
        ctx.font = `400 ${T.sellerSize}px 'High Summit'`;
        ctx.fillText(seller, sx, scy); sx += sw + T.subGap;
        ctx.font = `400 ${T.xSize}px 'Playfair Display'`;
        ctx.fillText("×", sx, scy); sx += xw + T.subGap;
        drawLogo(ctx, sx, scy, T.logoW, T.logoH);
        const ty = T.y + T.subH + T.gap;
        ctx.textAlign = "center";
        ctx.font = `400 ${T.size}px 'Playfair Display'`;
        [state.t1, state.t2].filter(Boolean).forEach((l, i) =>
          trk(ctx, l, cx, ty + T.lineH / 2 + i * T.lineH, -1.9, "center"),
        );
        if (withBar) {
          const B = NVF.bar;
          ctx.fillStyle = th.accent;
          ctx.fillRect(0, B.y, W, B.h);
          ctx.fillStyle = "#fff"; ctx.textAlign = "center";
          ctx.font = `400 ${B.dateSize}px 'Playfair Display'`;
          trk(ctx, range01(state.d1, state.d2), W / 2, B.y + B.h / 2, -0.8, "center");
        }
        ctx.textBaseline = "alphabetic";
      }
      /* 02 — 그라데이션 배경 + 사진 + 알약 + 그라데이션 타이틀 + 카피 바 */
      function nvfHero02(ctx, W, H, th, withBar, CFG) {
        const C = CFG || NVF.t02;
        const a = (141.81 * Math.PI) / 180,
          len = Math.abs(W * Math.cos(a)) + Math.abs(H * Math.sin(a));
        const g = ctx.createLinearGradient(
          W / 2 - (Math.cos(a) * len) / 2, H / 2 - (Math.sin(a) * len) / 2,
          W / 2 + (Math.cos(a) * len) / 2, H / 2 + (Math.sin(a) * len) / 2);
        g.addColorStop(0, th.colorBgLight || "#f0f3dd");
        g.addColorStop(1, th.mainBg || "#ffffff");
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        if (state.hero) clipRect(ctx, 0, 0, W, H, () => cover(ctx, state.hero, 0, 0, W, H));
        let y = C.titleY;
        y += nvfPill(ctx, C.titleX, y, th, C) + C.blockGap;
        ctx.textAlign = "left"; ctx.textBaseline = "middle";
        const tg = ctx.createLinearGradient(C.titleX, 0, C.titleX + C.titleW, 0);
        tg.addColorStop(0, th.titleColor || th.accent);
        tg.addColorStop(1, th.accent);
        const L1 = String(state.t1 || "").split(/\r?\n/).filter(Boolean);
        const L2 = String(state.t2 || "").split(/\r?\n/).filter(Boolean);
        L1.forEach((l, i) => {
          ctx.fillStyle = tg; ctx.font = `400 ${C.size}px Pretendard`;
          trk(ctx, l, C.titleX, y + C.lineH / 2 + i * C.lineH, -1.9, "left");
        });
        y += L1.length * C.lineH + (L1.length ? C.titleGap : 0);
        L2.forEach((l, i) => {
          ctx.fillStyle = tg; ctx.font = `700 ${C.size}px Pretendard`;
          trk(ctx, l, C.titleX, y + C.lineH / 2 + i * C.lineH, -1.9, "left");
        });
        y += L2.length * C.lineH + C.blockGap;
        ctx.fillStyle = th.accent;
        ctx.font = `400 ${C.dateSize}px Pretendard`;
        trk(ctx, range02(state.d1, state.d2), C.titleX, y + C.dateSize / 2, -0.8, "left");
        if (withBar) {
          ctx.fillStyle = th.accent;
          ctx.fillRect(0, C.barY, W, C.barH);
          ctx.fillStyle = "#fff";
          ctx.textBaseline = "middle";
          ctx.font = `400 ${C.copySize}px Pretendard`;
          const c1 = trkWidth(ctx, state.copy, -0.88);
          ctx.font = `700 ${C.copySize}px Pretendard`;
          const c2 = trkWidth(ctx, state.copyBold, -0.88);
          let bx = (W - (c1 + c2)) / 2, bcy = C.barY + C.barH / 2;
          ctx.textAlign = "left";
          ctx.font = `400 ${C.copySize}px Pretendard`;
          trk(ctx, state.copy, bx, bcy, -0.88, "left");
          ctx.font = `700 ${C.copySize}px Pretendard`;
          trk(ctx, state.copyBold, bx + c1, bcy, -0.88, "left");
        }
        ctx.textBaseline = "alphabetic";
      }
      /* 03 — 사진 배경 + 알약 + 큰 타이틀 + 4컷 그리드 */
      function nvfHero03(ctx, W, H, th, CFG) {
        const C = CFG || NVF.t03;
        ctx.fillStyle = th.mainBg || "#f8fbe1";
        ctx.fillRect(0, 0, W, H);
        if (state.hero) clipRect(ctx, 0, 0, W, H, () => cover(ctx, state.hero, 0, 0, W, H));
        let y = C.titleY;
        y += nvfPill(ctx, C.titleX, y, th, C) + C.blockGap;
        ctx.textAlign = "left"; ctx.textBaseline = "middle";
        ctx.fillStyle = th.titleColor || th.accent;
        const L1 = String(state.t1 || "").split(/\r?\n/).filter(Boolean);
        const L2 = String(state.t2 || "").split(/\r?\n/).filter(Boolean);
        L1.forEach((l, i) => {
          ctx.font = `400 ${C.size1}px Pretendard`;
          trk(ctx, l, C.titleX, y + C.lineH / 2 + i * C.lineH, -1.2, "left");
        });
        y += L1.length * C.lineH;
        L2.forEach((l, i) => {
          ctx.font = `700 ${C.size2}px Pretendard`;
          trk(ctx, l, C.titleX, y + C.lineH / 2 + i * C.lineH, -2.4, "left");
        });
        y += L2.length * C.lineH + C.blockGap;
        ctx.fillStyle = th.pillBg || th.accent;
        ctx.font = `400 ${C.dateSize}px Pretendard`;
        trk(ctx, range01(state.d1, state.d2), C.titleX, y + C.dateSize / 2, -0.9, "left");
        nvfGrid(ctx, C.grid);
        ctx.textBaseline = "alphabetic";
      }

      /* 섹션 헤딩 (option info. / color info.) */
      function nvfHead(ctx, W, y, kind, th, onDark) {
        const O = NVF.opt;
        if (onDark === undefined) onDark = nvOnDark(kind);
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillStyle = onDark ? "#ffffff" : th.accent;
        ctx.font = `400 ${O.eyebrow}px 'Playfair Display'`;
        ctx.fillText(kind === "color" ? "color info." : "option info.", W / 2, y + O.eyebrowLH / 2);
        ctx.font = `600 ${O.heading}px Pretendard`;
        ctx.fillText(nvTitle(kind), W / 2, y + O.eyebrowLH + O.headGap + O.headingLH / 2);
        ctx.textBaseline = "alphabetic";
      }

      /* 피드 옵션 카드 (960×468) */
      function nvfCard(ctx, r, x, top, th, CW, CH) {
        const O = NVF.opt;
        CW = CW || O.listW; CH = CH || O.cardH;
        ctx.fillStyle = "#fff"; ctx.fillRect(x, top, CW, CH);
        const imgH2 = CH - O.imgY * 2;
        ctx.fillStyle = "#f8f8f8";
        ctx.fillRect(x + O.imgX, top + O.imgY, O.imgW, imgH2);
        if (r.thumb) drawThumbCover(ctx, r.thumb, x + O.imgX, top + O.imgY, O.imgW, imgH2);

        const ix = x + O.optX, IW = CW - O.optX - 38;
        const badgeOn = r.badge !== "none";
        // 내용 측정
        _mc.font = `600 ${O.nameSize}px Pretendard`;
        const lns = [];
        for (const para of String(rowName(r)).split(/\r?\n/)) {
          const t = para.trim();
          if (t) lns.push(...wrapText(_mc, t, O.txtW, -0.8));
        }
        const attrs = cardAttrs(r);
        const rowHs = attrs.map((a) => {
          _mc.font = `400 ${O.vlSize}px Pretendard`;
          const vl = wrapText(_mc, String(a.value || ""), O.vlValW, -0.48);
          return Math.max(O.vlRowH, vl.length * O.vlRowH);
        });
        const vlH = rowHs.length
          ? rowHs.reduce((a, b) => a + b, 0) + (rowHs.length - 1) * O.vlRowGap
          : 0;
        const txtH = lns.length * O.nameLineH + (vlH ? O.txtGap + vlH : 0);
        const boxTopH = Math.max(txtH, O.discD);
        const nameWrapH = (badgeOn ? O.badgeH + O.nameGap : 0) + boxTopH;
        const priceH = O.priceRowH * 2 + O.priceGap;
        const infoH = nameWrapH + O.optGap + priceH;
        const iy = top + Math.max(8, (CH - infoH) / 2);

        ctx.textAlign = "left"; ctx.textBaseline = "middle";
        let ny = iy;
        if (badgeOn) {
          const bt = r.badge === "renewal" ? "RENEWAL!" : "NEW!";
          ctx.font = `600 ${O.badgeSize}px Pretendard`;
          const bw = Math.max(188, trkWidth(ctx, bt, -0.4) + 32);
          ctx.strokeStyle = th.badgeBorder || th.accent;
          ctx.lineWidth = 2;
          roundRect(ctx, ix, ny, bw, O.badgeH, O.badgeH / 2);
          ctx.stroke();
          ctx.fillStyle = th.accent;
          trk(ctx, bt, ix + bw / 2, ny + O.badgeH / 2, -0.4, "center");
          ny += O.badgeH + O.nameGap;
        }
        // box-top: 좌 제품명블록 ┄ 우 할인원
        const btY = ny;
        const tY = btY + (boxTopH - txtH) / 2;
        ctx.fillStyle = "#333333";
        ctx.font = `600 ${O.nameSize}px Pretendard`;
        lns.forEach((l, i) =>
          trk(ctx, l, ix, tY + O.nameLineH / 2 + i * O.nameLineH, -0.8, "left"),
        );
        let vy = tY + lns.length * O.nameLineH + O.txtGap;
        attrs.forEach((a, i) => {
          ctx.font = `700 ${O.vlSize}px Pretendard`;
          ctx.fillStyle = "#666666";
          trk(ctx, a.label || "", ix, vy + O.vlRowH / 2, -0.48, "left");
          ctx.fillStyle = "#888888";
          ctx.font = `400 ${O.vlSize}px Pretendard`;
          _mc.font = `400 ${O.vlSize}px Pretendard`;
          const vl = wrapText(_mc, String(a.value || ""), O.vlValW, -0.48);
          vl.forEach((t, k) =>
            trk(ctx, t, ix + O.vlLabelW + O.vlColGap, vy + O.vlRowH / 2 + k * O.vlRowH, -0.48, "left"),
          );
          vy += rowHs[i] + O.vlRowGap;
        });
        // 할인원
        const d = disc(r.normal, r.sale);
        // .fig: discount_rate 상단 정렬
        const dcx = ix + IW - O.discD / 2, dcy = btY + O.discD / 2;
        ctx.fillStyle = th.accent;
        ctx.beginPath(); ctx.arc(dcx, dcy, O.discD / 2, 0, 7); ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = `700 ${O.discSize}px GmarketSans, Pretendard`;
        ctx.textAlign = "center";
        trk(ctx, d != null ? d + "%" : "—", dcx, dcy, -0.5, "center");
        // 가격
        const G0 = nvG();
        const py = iy + nameWrapH + O.optGap;
        const pcy = py + O.priceRowH / 2;
        ctx.textAlign = "left"; ctx.fillStyle = "#666666";
        ctx.font = `600 ${O.normalSize}px Pretendard`;
        trk(ctx, G0.normalLabel || "정상가", ix, pcy, -0.56, "left");
        ctx.font = `400 ${O.normalSize}px Pretendard`;
        const npT = won(r.normal);
        trk(ctx, npT, ix + IW, pcy, -0.56, "right");
        const npW = trkWidth(ctx, npT, -0.56);
        ctx.strokeStyle = "#666666"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(ix + IW - npW, pcy); ctx.lineTo(ix + IW, pcy); ctx.stroke();
        const pcy2 = py + O.priceRowH + O.priceGap + O.priceRowH / 2;
        ctx.fillStyle = "#333333";
        ctx.font = `600 ${O.saleSize}px Pretendard`;
        trk(ctx, G0.saleLabel || "혜택가", ix, pcy2, -0.8, "left");
        ctx.font = `700 ${O.saleSize}px Pretendard`;
        trk(ctx, won(r.sale), ix + IW, pcy2, -0.8, "right");
        ctx.textBaseline = "alphabetic";
      }

      /* 피드 컬러 슬라이드 */
      function nvfColor(ctx, W, H, th) {
        const K = NVF.color;
        const onDark = nvOnDark("color");
        const ink = onDark ? "#ffffff" : th.accent;
        ctx.fillStyle = nvColorBg(th) || "#b9ca7d";
        ctx.fillRect(0, 0, W, H);
        nvfHead(ctx, W, K.txtY, "color", th, onDark);
        // 줄별 색상명
        const rows = colorLines()
          .map((l) => ({ label: l.label, list: pickedColors(l.key) }))
          .filter((r) => r.list.length);
        let ly = K.txtY + K.eyebrowLH + K.headGap + K.headingLH + K.txtGap;
        ctx.textBaseline = "middle";
        for (const r of rows) {
          const names = r.list.map((c) => c.label).join(", ");
          ctx.font = `700 ${K.listSize}px Pretendard`;
          const lw = r.label ? ctx.measureText(r.label).width : 0;
          ctx.font = `400 ${K.listSize}px Pretendard`;
          const nw = ctx.measureText(names).width;
          const gap = r.label ? K.listLabelGap : 0;
          let lx = W / 2 - (lw + gap + nw) / 2;
          ctx.textAlign = "left"; ctx.fillStyle = ink;
          if (r.label) {
            ctx.font = `700 ${K.listSize}px Pretendard`;
            ctx.fillText(r.label, lx, ly + K.listLineH / 2);
          }
          ctx.font = `400 ${K.listSize}px Pretendard`;
          ctx.fillText(names, lx + lw + gap, ly + K.listLineH / 2);
          ly += K.listLineH + K.listGap;
        }
        // 칩
        const n = Math.max(1, ...rows.map((r) => r.list.length));
        const chipW = Math.min(K.chipMaxW, (K.rowW - K.chipGap * (n - 1)) / n);
        const imgH = chipW / COLOR_RATIO;
        const chipH = imgH + K.chipLabelH;
        let ry = K.optY + K.optPadTop;
        for (const r of rows) {
          const rw = r.list.length * chipW + (r.list.length - 1) * K.chipGap;
          let rx = W / 2 - rw / 2;
          for (const c of r.list) {
            if (c.img) drawRatioFit(ctx, c.img, rx, ry, chipW, imgH, COLOR_RATIO);
            ctx.fillStyle = nvChipLabel(th);
            ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.font = `400 ${K.chipLabelSize}px Pretendard`;
            trk(ctx, c.label, rx + chipW / 2, ry + imgH + K.chipLabelH / 2, -0.6, "center");
            rx += chipW + K.chipGap;
          }
          ry += chipH + K.rowGap;
        }
        ctx.textBaseline = "alphabetic";
      }

      /* 누볼라 썸네일 */
      function nvThumb(ctx, th) {
        const W = 1080, H = NVF.thumbH;
        ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, W, H);
        // 01 썸네일은 하단 바 없음 / 02 는 카피 바 있음 / 03 은 그리드
        nvfHero(ctx, W, H, th, nvCfg().main === "grad", "thumb");
      }

      /* 누볼라 피드 슬라이드 구성: [히어로, 옵션…, 사이즈?, 컬러?] */
      function nvFeedPlan() {
        const plan = [{ t: "hero" }];
        const per = 2;
        for (let i = 0; i < state.rows.length; i += per)
          plan.push({ t: "opt", rows: state.rows.slice(i, i + per) });
        if (state.sizeInfoOn && nvSizeInfoImg()) plan.push({ t: "size" });
        if (hasColors()) plan.push({ t: "color" });
        return plan;
      }
      function nvFeedCount() { return nvFeedPlan().length; }

      function nvFeedSlide(ctx, idx, th) {
        const W = 1080, H = NVF.feedH;
        const p = nvFeedPlan()[idx];
        if (!p) return;
        if (p.t === "hero") { nvfHero(ctx, W, H, th, true); return; }
        if (p.t === "color") { nvfColor(ctx, W, H, th); return; }
        ctx.fillStyle = nvOptBg(th) || "#f0f3dd";
        ctx.fillRect(0, 0, W, H);
        const O = NVF.opt, S = NVF.size;
        if (p.t === "opt") {
          nvfHead(ctx, W, O.headY, "option", th);
          if (nvCfg().optDark) {
            // 02·03: 진한 배경 위에 흰 컨테이너, 그 안에 카드
            const B = NVF.optBox;
            const bh = B.pad * 2 + p.rows.length * B.cardH + (p.rows.length - 1) * B.gap;
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(B.x, B.y, B.w, bh);
            let y = B.y + B.pad;
            for (const r of p.rows) {
              nvfCard(ctx, r, B.x + B.pad, y, th, B.cardW, B.cardH);
              y += B.cardH + B.gap;
            }
          } else {
            let y = O.listY;
            for (const r of p.rows) { nvfCard(ctx, r, O.listX, y, th); y += O.cardH + O.listGap; }
          }
          return;
        }
        // 사이즈 안내
        nvfHead(ctx, W, S.headY, "option", th);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(S.boxX, S.boxY, S.boxW, S.boxH);
        const sImg = nvSizeInfoImg();
        if (sImg)
          clipRect(ctx, S.boxX, S.boxY + S.imgY, S.boxW, S.imgH, () =>
            cover(ctx, sImg, S.boxX, S.boxY + S.imgY, S.boxW, S.imgH),
          );
        if (state.notice) {
          const nx = S.boxX + (S.boxW - S.ntW) / 2, ny = S.boxY + S.ntY;
          ctx.fillStyle = nvNoticeBg(th);
          ctx.fillRect(nx, ny, S.ntW, S.ntH);
          ctx.fillStyle = th.accent;
          ctx.font = `400 ${S.ntSize}px Pretendard`;
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          trk(ctx, state.notice, W / 2, ny + S.ntH / 2, -0.64, "center");
          ctx.textBaseline = "alphabetic";
        }
      }

      /* ── 누볼라 상세페이지 전체 ── */
      function nvDetail(ctx, W, th) {
        const H = nvCanvasH();
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = th.colorBgLight || "#ffffff";
        ctx.fillRect(0, 0, W, H);
        nvMain(ctx, W, th);
        const oy = NV.MAIN_H;
        nvOption(ctx, W, oy, th);
        nvColor(ctx, W, oy + nvOptionH(), th);
      }
