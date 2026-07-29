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
          /* .fig 실측 (node 72:42 option_01) — 2026-07 재확인
             card 720×360 = [box-img 320] gap36 [text 342], pb 20
             text 열: py28, 위 name-wrap / 아래 price-wrap (justify-between) */
          /* .fig 실측: 카드 360 높이, 세로 간격 380(=360+20).
             예전엔 410 이라 카드가 50px 씩 부풀고 간격도 벌어져 있었다. */
          cardH: 360, imgX: 10, imgY: 10, imgW: 320, imgH: 340,
          optX: 356, optW: 342, optGap: 36,
          badgeH: 36, badgeW: 120, badgeSize: 20, nameGap: 16,
          /* 제품명은 342 전체 폭을 쓴다. 예전엔 250 으로 좁혀놓고 그 옆에
             할인율 원을 그려서, 이름이 두 줄로 접히고 배지와 겹쳤다. */
          nameSize: 32, nameLineH: 40, txtOptW: 342, txtOptGap: 24,
          vlLabelW: 53, vlColGap: 8, vlValW: 281, vlRowH: 24, vlRowGap: 8, vlSize: 18,
          /* 할인율 — .fig 는 원이 아니라 80×80 정사각형.
             배경 = 테마 sectionBg(연한색), 글자 = 테마 accent(진한색), Gmarket Sans */
          discD: 80, discSize: 28,
          /* 가격줄 — .fig 에 "정상가/혜택가" 라벨은 없다.
             [할인율 80] gap20 [혜택가 Bold28] gap16 [정상가 Regular20 취소선] */
          priceH: 80, priceGapX: 20, priceNumGap: 16,
          priceRowH: 36, priceGap: 10,
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
                optEyebrow: 36, optEyebrowLH: 40, optHeading: 56, optHeadingLH: 56,
                colEyebrow: 36, colEyebrowLH: 40, colHeading: 56, colHeadingLH: 56,
                headToList: 80,
                /* .fig 58:570 — 01 은 Playfair + Pretendard SemiBold */
                eyeFont: "'Playfair Display'", headFont: "Pretendard", headWeight: 600 },
        "02": { main: "grad", optDark: true, colorDark: false, colorBox: false,
                chipLabel: "accent", noticeKey: "white",
                /* .fig 실측: eyebrow 박스 40 (53 아님), heading 박스 56 */
                optEyebrow: 48, optEyebrowLH: 40, optHeading: 56, optHeadingLH: 56,
                colEyebrow: 48, colEyebrowLH: 40, colHeading: 56, colHeadingLH: 56,
                headToList: 76,
                /* .fig 72:37 — 02 는 High Summit + Gmarket Sans Bold, 흰 글자에 그림자 */
                eyeFont: "'High Summit'", headFont: "GmarketSans, Pretendard",
                headWeight: 700, headShadow: true,
                /* .fig: 02 만 eyebrow 가 제목과 다른 색(#31522d)이다.
                   01·03 은 eyebrow 와 제목이 같은 색이라 이 키가 없다. */
                eyebrowInkKey: "eyebrowInk" },
        "03": { main: "grid", optDark: true, colorDark: false, colorBox: true,
                chipLabel: "#666666", noticeKey: "colorBgLight",
                /* 03 은 글자 크기만 크고(80/72) 박스 높이는 56 이다 */
                optEyebrow: 48, optEyebrowLH: 40, optHeading: 80, optHeadingLH: 56,
                colEyebrow: 48, colEyebrowLH: 40, colHeading: 72, colHeadingLH: 56,
                headToList: 76,
                /* .fig 79:553 — 03 은 Afacad Flux (index.html 에서 로드) */
                eyeFont: "'Afacad Flux', 'Playfair Display'",
                headFont: "'Afacad Flux', Pretendard", headWeight: 600,
                colorEyebrow: "color info." },  // 03 은 소문자 (02 는 "Color info.")
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
      /* 02 제목은 .fig 에 text-shadow 0 0 6.6px rgba(0,0,0,.25) 가 걸려 있다 */
      function nvHeadShadow(ctx, on) {
        if (!on) return;
        ctx.shadowColor = "rgba(0,0,0,0.25)";
        ctx.shadowBlur = 6.6;
      }
      function nvClearShadow(ctx) {
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
      }
      /* 옵션 카드 레이아웃은 템플릿마다 다르다 (.fig 실측)
         01 (58:574) : 이름 250폭 + 할인 '원' 이름 옆 오른쪽 위,
                       가격은 [정상가 라벨 … 값] / [혜택가 라벨 … 값] 2줄
         02 (72:42)  : 이름 342 전체폭 + 할인 '사각형' 이 가격줄 왼쪽,
                       가격은 [45%] [혜택가] [정상가취소선] 1줄 (라벨 없음)
         03          : 02 와 같은 방식
         ⚠ 하나로 통일하면 안 된다. 2026-07 에 02 기준으로 덮었다가 01 이 깨졌다. */
      const NV_CARD = {
        /* 카드 기하는 .fig 절대좌표에서 뽑았다 (섹션 왼쪽 기준)
           01 카드 x=60 w=740 · img +10,+10 320×340 · 텍스트 +366
           02 카드 x=70 w=720 · img  +0, +0 320×340 · 텍스트 +356
           03 카드 x=70 w=720 · img +380,+20 320×320 · 텍스트  +20 */
        "01": { style: "labels", txtOptW: 250, discGap: 12, priceH: 82,
                vlLabelW: 48, vlValW: 194, fTxtW: 324,
                /* 01 은 카드에 선이 없다 (.fig) */
                cardDX: 0, cardW: 740, imgDX: 10, imgDY: 10, imgH: 340, optDX: 366,
                textDY: 29, priceDY: 273,
                /* .fig feed(01): 카드 960×468, img card+10,+10 416×448, 텍스트 card+474 */
                fTextDY: 46, fPriceDY: 316, fImgDX: 10, fImgDY: 10,
                fImgW: 416, fImgH: 448, fOptDX: 474, fOptW: 448 },
        "02": { style: "inline", txtOptW: 342, priceH: 80,
                vlLabelW: 53, vlValW: 281, fTxtW: 456,
                discBgKey: "colorBgLight", discInk: null,
                saleInk: "#333333", normalInk: "#666666",
                /* .fig: 카드 아래 1px #d0dfb1 (badgeBorder). 마지막 카드 뒤에는 없다 */
                divKey: "badgeBorder", divW: 1, divFeedW: 1.33,
                cardDX: 10, cardW: 720, imgDX: 0, imgDY: 0, imgH: 340, optDX: 356,
                textDY: 28, priceDY: 232,
                /* .fig feed_02: 카드 920×460, img card+0,+0 426×440, 텍스트 card+464 456 */
                fTextDY: 28, fPriceDY: 304, fImgDX: 0, fImgDY: 0,
                fImgW: 426, fImgH: 440, fOptDX: 464, fOptW: 456 },
        /* 03 은 02 와 구조는 같지만 색과 이미지 위치가 다르다 (.fig 2026-07-29)
           - box-img 가 오른쪽(@380), 텍스트가 왼쪽
           - 할인율 배경 accent(#65812d) + 흰 글자   (02 는 연한 배경 + 진한 글자)
           - 혜택가 titleColor(#448122) / 정상가 #999999 */
        "03": { style: "inline", txtOptW: 342, priceH: 100,
                vlLabelW: 60, vlValW: 274, fTxtW: 456,
                /* .fig: 카드 사방 20px #f0f3dd 테두리 (선이 아니라 띠) */
                frameKey: "colorBgLight", frameW: 20,
                /* .fig: 03 의 discount_rate 는 반경 20 둥근 사각 (02 는 각짐) */
                discR: 20, fDiscR: 25.56,
                imgRight: true, discBgKey: "accent", discInk: "#ffffff",
                saleInk: "titleColor", normalInk: "#999999",
                cardDX: 10, cardW: 720, imgDX: 380, imgDY: 20, imgH: 320, optDX: 20,
                textDY: 76, priceDY: 260,
                /* .fig feed_02(03): 카드 920×460, 텍스트 card+20 437, img card+491,+26 409×409 */
                fTextDY: 96, fPriceDY: 334, fImgDX: 491, fImgDY: 26, fOptDX: 20,
                fImgW: 409, fImgH: 409, fOptW: 437 },
      };
      function nvCard5() { return NV_CARD[state.tpl] || NV_CARD["02"]; }

      /* 옵션 리스트는 .fig 에서 "컨테이너 + 패딩 + 간격" 구조다.
         예전 코드는 카드마다 흰 사각형을 따로 그려서 02 처럼 컨테이너가 흰
         템플릿에서 카드 사이에 배경색이 비쳤다.
           01 : option-list 투명, 패딩 0  — 카드마다 흰 배경
           02 : option-list #ffffff, 패딩 20 — 카드가 한 덩어리로 보인다
           03 : option-list 투명, 패딩 20 — 순서가 카드·사이즈·알림(전폭)
         (.fig 2026-07-29 실측) */
      const NV_LIST = {
        "01": { bodyX: 60, bodyW: 740, listTop: 204, pad: 0, gap: 20,
                listBg: null, order: ["cards", "notice", "size"],
                sizeH: 552, noticeFull: false, noticeH: 80 },
        "02": { bodyX: 50, bodyW: 760, listTop: 180, pad: 20, gap: 20,
                listBg: "#ffffff", order: ["cards", "notice", "size"],
                sizeH: 538, noticeFull: false, noticeH: 80 },
        "03": { bodyX: 50, bodyW: 760, listTop: 180, pad: 20, gap: 20,
                listBg: null, order: ["cards", "size", "notice"],
                sizeH: 538, noticeFull: true, noticeH: 100 },
      };
      function nvList() { return NV_LIST[state.tpl] || NV_LIST["02"]; }

      /* 리스트 안쪽 항목들의 높이 목록 (패딩 제외) */
      function nvListItems() {
        const L = nvList();
        const items = [];
        const sImg = state.sizeInfoOn ? nvSizeInfoImg() : null;
        for (const kind of L.order) {
          if (kind === "cards") state.rows.forEach((r) => items.push({ kind: "card", r, h: NV.opt.cardH }));
          else if (kind === "notice" && state.notice) items.push({ kind: "notice", h: L.noticeH });
          else if (kind === "size" && sImg) items.push({ kind: "size", img: sImg, h: L.sizeH });
        }
        return items;
      }
      function nvListH() {
        const L = nvList(), it = nvListItems();
        if (!it.length) return 0;
        const inner = it.reduce((a, b) => a + b.h, 0) + (it.length - 1) * L.gap;
        return inner + L.pad * 2;
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
      function nvOptionListH() { return nvListH(); }
      function nvOptionH() {
        const O = NV.opt, C = nvCfg();
        /* .fig: option-body y=150, 그 안에서 option-list 는 listTop 아래 */
        return O.padTop + nvList().listTop + nvOptionListH() + O.padBottom;
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
        /* .fig: txt-title 블록에 DROP_SHADOW blur8 rgba(0,0,0,0.32).
           배경 사진에는 걸리지 않고 글자에만 걸린다. */
        ctx.shadowColor = "rgba(0,0,0,0.32)";
        ctx.shadowBlur = 8;
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
        nvClearShadow(ctx);
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
        /* 일반 문구와 볼드 문구가 붙어 나오던 것 수정 —
           .fig 는 둘 사이에 한 칸 띈다. 시트 값에 공백이 있으면 중복하지 않는다. */
        const gap1 =
          /\s$/.test(state.copy || "") || /^\s/.test(state.copyBold || "")
            ? 0
            : ctx.measureText(" ").width;
        const c1 = trkWidth(ctx, state.copy, -0.64) + gap1;
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
      function nvCard(ctx, r, x, top, th, cardW, ownBg) {
        const O = NV.opt;
        const CS0 = nvCard5();
        const cx0 = x;
        const cw0 = cardW || CS0.cardW || O.bodyW;
        /* 컨테이너가 이미 흰색이면(02) 카드 배경을 또 칠하지 않는다 */
        if (ownBg !== false) { ctx.fillStyle = "#fff"; ctx.fillRect(cx0, top, cw0, O.cardH); }
        ctx.fillStyle = "#f8f8f8";
        const imgLeft = cx0 + (CS0.imgDX ?? O.imgX);
        const imgTop = top + (CS0.imgDY ?? O.imgY);
        const imgH0 = CS0.imgH || O.imgH;
        ctx.fillRect(imgLeft, imgTop, O.imgW, imgH0);
        if (r.thumb)
          drawThumbCover(ctx, r.thumb, imgLeft, imgTop, O.imgW, imgH0);

        const ix = cx0 + (CS0.optDX ?? O.optX);
        const badgeOn = r.badge !== "none";
        // 내용 측정 → 높이 계산
        _mc.font = `600 ${O.nameSize}px Pretendard`;
        const lns = [];
        for (const para of String(rowName(r)).split(/\r?\n/)) {
          const t = para.trim();
          if (t) lns.push(...wrapText(_mc, t, nvCard5().txtOptW, -0.64));
        }
        const attrs = cardAttrs(r);
        const rowHs = attrs.map((a) => {
          _mc.font = `400 ${O.vlSize}px Pretendard`;
          const vl = wrapText(_mc, String(a.value || ""), nvCard5().vlValW, -0.36);
          return Math.max(O.vlRowH, vl.length * 24);
        });
        const vlH = rowHs.length
          ? rowHs.reduce((a, b) => a + b, 0) + (rowHs.length - 1) * O.vlRowGap
          : 0;
        const txtOptH = lns.length * O.nameLineH + (vlH ? O.txtOptGap + vlH : 0);
        const boxTopH = Math.max(txtOptH, O.discD);
        const nameWrapH = (badgeOn ? O.badgeH + O.nameGap : 0) + boxTopH;
        /* .fig 는 카드 안에서 위(이름) / 아래(가격) 고정 배치다.
           예전엔 내용 높이로 세로 중앙정렬해서, 글자 길이에 따라 가격줄이 떠다녔다. */
        const infoH = nameWrapH + O.optGap + O.priceH;
        const iy = top + (CS0.textDY ?? (O.cardH - infoH) / 2);

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
          const vl = wrapText(_mc, String(a.value || ""), nvCard5().vlValW, -0.36);
          vl.forEach((t, k) =>
            trk(ctx, t, ix + nvCard5().vlLabelW + O.vlColGap, vy + 12 + k * 24, -0.36, "left"),
          );
          vy += rowHs[i] + O.vlRowGap;
        });
        /* 가격줄 — .fig node 72:53 option_price-wrap 그대로
           [discount_rate 80×80 사각] gap20 [혜택가 Bold28 #333] gap16 [정상가 Regular20 #666 취소선]
           예전 코드는 할인율을 제품명 옆 원으로 그리고 정상가/혜택가 라벨을 붙였는데,
           .fig 에는 그런 라벨이 없고 할인율도 가격줄 왼쪽 사각형이다. */
        const d = disc(r.normal, r.sale);
        const CS = nvCard5();
        const py = top + (CS0.priceDY ?? (iy - top) + nameWrapH + O.optGap);
        const G0 = nvG();

        if (CS.style === "labels") {
          /* ── 01 (.fig 58:586 / 58:588) ── */
          // 할인율: 이름 오른쪽 위, 원
          const dx = ix + CS.txtOptW + CS.discGap;
          ctx.fillStyle = th.accent;
          ctx.beginPath();
          ctx.arc(dx + O.discD / 2, btY + O.discD / 2, O.discD / 2, 0, 7);
          ctx.fill();
          ctx.fillStyle = "#fff";
          ctx.font = `700 ${O.discSize}px GmarketSans, Pretendard`;
          ctx.textAlign = "center";
          trk(ctx, d != null ? d + "%" : "—", dx + O.discD / 2, btY + O.discD / 2, -0.5, "center");
          // 가격: 라벨 왼쪽 / 값 오른쪽 정렬, 2줄
          const pcy = py + O.priceRowH / 2;
          ctx.textAlign = "left";
          ctx.fillStyle = "#666666";
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
          const pcy2 = py + O.priceRowH + O.priceGap + O.priceRowH / 2;
          ctx.fillStyle = "#333333";
          ctx.font = `600 ${O.saleSize}px Pretendard`;
          trk(ctx, G0.saleLabel || "혜택가", ix, pcy2, -0.56, "left");
          ctx.font = `700 ${O.saleSize}px Pretendard`;
          trk(ctx, won(r.sale), ix + O.optW, pcy2, -0.56, "right");
        } else {
          /* ── 02 · 03 (.fig 72:53) ── */
          const pcy = py + O.discD / 2;
          ctx.fillStyle = th[CS.discBgKey] || th.colorBgLight || "#f0f3dd";
          if (CS.discR) roundRect(ctx, ix, py, O.discD, O.discD, CS.discR), ctx.fill();
          else ctx.fillRect(ix, py, O.discD, O.discD);
          ctx.fillStyle = CS.discInk || th.discInk || th.accent;
          ctx.font = `700 ${O.discSize}px GmarketSans, Pretendard`;
          ctx.textAlign = "center";
          trk(ctx, d != null ? d + "%" : "—", ix + O.discD / 2, pcy, -0.56, "center");
          ctx.textAlign = "left";
          let px2 = ix + O.discD + O.priceGapX;
          ctx.fillStyle = th[CS.saleInk] || CS.saleInk || "#333333";
          ctx.font = `700 ${O.saleSize}px Pretendard`;
          const saleTxt = won(r.sale);
          trk(ctx, saleTxt, px2, pcy, -0.56, "left");
          px2 += trkWidth(ctx, saleTxt, -0.56) + O.priceNumGap;
          ctx.fillStyle = CS.normalInk || "#666666";
          ctx.font = `400 ${O.normalSize}px Pretendard`;
          const npTxt = won(r.normal);
          trk(ctx, npTxt, px2, pcy, -0.4, "left");
          const npW = trkWidth(ctx, npTxt, -0.4);
          ctx.strokeStyle = CS.normalInk || "#666666";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(px2, pcy);
          ctx.lineTo(px2 + npW, pcy);
          ctx.stroke();
        }
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
        const eyeInk = (C.eyebrowInkKey && th[C.eyebrowInkKey]) || optInk;
        ctx.fillStyle = eyeInk;
        ctx.font = `400 ${C.optEyebrow}px ${C.eyeFont}`;
        ctx.fillText("option info.", cx, oy + O.padTop + C.optEyebrowLH / 2);
        ctx.fillStyle = optInk; // 제목은 eyebrow 와 색이 다를 수 있다
        ctx.font = `${C.headWeight || 600} ${C.optHeading}px ${C.headFont}`;
        nvHeadShadow(ctx, C.headShadow);
        ctx.fillText(
          nvTitle("option"),
          cx,
          oy + O.padTop + C.optEyebrowLH + O.headGap + (C.optHeadingLH || C.optHeading) / 2,
        );
        nvClearShadow(ctx);
        ctx.textBaseline = "alphabetic";
        /* ── 리스트: 컨테이너 → 패딩 → 항목 순서 (.fig option-list) ── */
        const L = nvList();
        const CSD = nvCard5();
        const listX = L.bodyX;
        const listY = oy + O.padTop + L.listTop;
        const listH = nvListH();
        if (L.listBg) {
          ctx.fillStyle = L.listBg;
          ctx.fillRect(listX, listY, L.bodyW, listH);
        }
        const itemX = listX + L.pad;
        const itemW = L.bodyW - L.pad * 2;
        let y = listY + L.pad;
        const items = nvListItems();
        const lastCard = items.map((v) => v.kind).lastIndexOf("card");
        for (let i = 0; i < items.length; i++) {
          const it = items[i];
          if (it.kind === "card") {
            /* 03: 카드 사방 20px 띠 (.fig strokeAlign OUTSIDE) */
            if (CSD.frameKey && th[CSD.frameKey]) {
              const fw = CSD.frameW;
              ctx.fillStyle = th[CSD.frameKey];
              ctx.fillRect(itemX - fw, y - fw, itemW + fw * 2, it.h + fw * 2);
            }
            nvCard(ctx, it.r, itemX, y, th, itemW, !L.listBg);
            /* 02: 카드 아래 1px 구분선 — 마지막 카드 뒤에는 긋지 않는다 */
            if (CSD.divKey && th[CSD.divKey] && i !== lastCard) {
              ctx.fillStyle = th[CSD.divKey];
              ctx.fillRect(itemX, y + it.h, itemW, CSD.divW);
            }
          } else if (it.kind === "notice") {
            const nx = L.noticeFull ? listX : itemX;
            const nw = L.noticeFull ? L.bodyW : itemW;
            ctx.fillStyle = nvNoticeBg(th);
            ctx.fillRect(nx, y, nw, it.h);
            ctx.fillStyle = th.accent;
            ctx.font = `400 ${O.noticeSize}px Pretendard`;
            ctx.textAlign = "center"; ctx.textBaseline = "middle";
            trk(ctx, state.notice, nx + nw / 2, y + it.h / 2, -0.48, "center");
            ctx.textBaseline = "alphabetic";
          } else if (it.kind === "size") {
            clipRect(ctx, itemX, y, itemW, it.h, () =>
              cover(ctx, it.img, itemX, y, itemW, it.h),
            );
          }
          y += it.h + L.gap;
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
        const headH = C.colEyebrowLH + K.txtGap + (C.colHeadingLH || C.colHeading);
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
        ctx.fillStyle = (C.eyebrowInkKey && th[C.eyebrowInkKey]) || ink;
        ctx.font = `400 ${C.colEyebrow}px ${C.eyeFont}`;
        ctx.fillText(C.colorEyebrow || "Color info.", cx, top + K.txtY + C.colEyebrowLH / 2);
        ctx.fillStyle = ink;
        ctx.font = `${C.headWeight || 600} ${C.colHeading}px ${C.headFont}`;
        nvHeadShadow(ctx, C.headShadow);
        ctx.fillText(
          nvTitle("color"),
          cx,
          top + K.txtY + C.colEyebrowLH + K.txtGap + (C.colHeadingLH || C.colHeading) / 2,
        );
        nvClearShadow(ctx);
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
        /* .fig feed_02/03 실측 (2026-07-29)
           txt-section_title @(60,118) 960×152
             txt-sub  960×52 @(0,0)   High Summit 52px
             heading  960×72 @(0,80)  Gmarket Sans Bold 72px */
        opt: { headX: 60, headY: 118, headW: 960,
               eyebrow: 52, eyebrowLH: 52, headGap: 28, heading: 72, headingLH: 72,
               listX: 60, listY: 309, listW: 960, cardH: 468, listGap: 20,
               imgX: 10, imgY: 10, imgW: 416, imgH: 448,
               optX: 474, optW: 448, optGap: 47,
               badgeH: 49, badgeSize: 28, nameGap: 20, boxTopGap: 16,
               /* .fig node 80:886 — 제품명은 456 전체 폭. 324 로 좁혀놓고
                  그 옆에 할인 원을 그려서 배지가 이름을 덮고 있었다. */
               txtW: 456, txtGap: 12, nameSize: 40, nameLineH: 52,
               /* .fig value_list: 폭 458, 열 1fr:4fr, 열간격 4 → 91 / 4 / 363 */
               vlLabelW: 91, vlColGap: 4, vlValW: 363, vlSize: 24, vlRowH: 32, vlRowGap: 8,
               /* 할인율 — .fig 는 108×108 정사각형, Gmarket Sans 36 */
               discD: 108, discSize: 36, priceGapX: 24, priceNumGap: 20,
               priceRowH: 47, priceGap: 12, normalSize: 28, saleSize: 40 },
        /* 사이즈 안내 슬라이드 — .fig Frame6 @(60,330) 960×960 (흰 박스)
             size_info @(0,20)  960×717
             Frame 7   @(40,805) 880×115  bg #f4f4f4
           옵션 슬라이드와 박스 위치가 달라 두 장이 어긋나 보였다(309 vs 330). */
        size: { headY: 118, boxX: 60, boxY: 330, boxW: 960, boxH: 960,
                imgY: 20, imgH: 717, ntW: 880, ntH: 115, ntY: 805, ntSize: 32 },
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
        /* .fig feed 옵션 슬라이드
             02 : option-list rel(60,330) 960×960 #ffffff, 카드 920×460 @+20,+20, 간격 20
             03 : option-list rel(80,320) 920×944  투명,    카드 920×460 @+0,+0,  간격 24 */
        optBox: { x: 60, y: 330, w: 960, h: 960, pad: 20, cardW: 920, cardH: 460, gap: 20 },
        optBox03: { x: 80, y: 320, w: 920, h: 944, pad: 0, cardW: 920, cardH: 460, gap: 24, bg: null },
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
        const C = nvCfg();
        const headInk = onDark ? "#ffffff" : th.accent;
        ctx.fillStyle = (C.eyebrowInkKey && th[C.eyebrowInkKey]) || headInk;
        /* 상세와 같은 템플릿별 글꼴을 쓴다.
           여기만 Playfair 로 고정돼 있어서 02·03 피드가 01 글꼴로 나왔다. */
        ctx.font = `400 ${O.eyebrow}px ${C.eyeFont}`;
        const eyebrow =
          kind === "color" ? C.colorEyebrow || "Color info." : "option info.";
        ctx.fillText(eyebrow, W / 2, y + O.eyebrowLH / 2);
        ctx.fillStyle = headInk;
        ctx.font = `${C.headWeight || 600} ${O.heading}px ${C.headFont}`;
        nvHeadShadow(ctx, C.headShadow);
        ctx.fillText(nvTitle(kind), W / 2, y + O.eyebrowLH + O.headGap + O.headingLH / 2);
        nvClearShadow(ctx);
        ctx.textBaseline = "alphabetic";
      }

      /* 피드 옵션 카드 (960×468) */
      function nvfCard(ctx, r, x, top, th, CW, CH) {
        const O = NVF.opt;
        const CSF = nvCard5();
        CW = CW || O.listW; CH = CH || O.cardH;
        ctx.fillStyle = "#fff"; ctx.fillRect(x, top, CW, CH);
        /* 이미지·텍스트 위치는 템플릿마다 다르다 (.fig 실측).
           예전엔 NVF.opt 하나(01 기준)를 셋이 공유해서 02·03 이 어긋났다. */
        const fImgX = x + (CSF.fImgDX ?? O.imgX);
        const fImgY = top + (CSF.fImgDY ?? O.imgY);
        const fImgW = CSF.fImgW || O.imgW;
        const imgH2 = CSF.fImgH || CH - O.imgY * 2;
        ctx.fillStyle = "#f8f8f8";
        ctx.fillRect(fImgX, fImgY, fImgW, imgH2);
        if (r.thumb) drawThumbCover(ctx, r.thumb, fImgX, fImgY, fImgW, imgH2);

        const ix = x + (CSF.fOptDX ?? O.optX);
        const IW = CSF.fOptW || CW - O.optX - 38;
        const badgeOn = r.badge !== "none";
        // 내용 측정
        _mc.font = `600 ${O.nameSize}px Pretendard`;
        const lns = [];
        for (const para of String(rowName(r)).split(/\r?\n/)) {
          const t = para.trim();
          if (t) lns.push(...wrapText(_mc, t, nvCard5().fTxtW, -0.8));
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
        /* .fig 고정 배치 (예전엔 중앙정렬이라 가격줄이 글자 길이에 따라 떠다녔다) */
        const iy = top + (CSF.fTextDY ?? Math.max(8, (CH - infoH) / 2));

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
        /* 가격줄 — .fig node 80:897 option_price-wrap
           [할인율 108×108 사각] gap24 [혜택가 Bold40 #333] gap20 [정상가 Regular28 #666 취소선]
           상세 카드와 같은 구조다. 예전엔 여기만 옛 방식(원 + 정상가/혜택가 라벨)이 남아 있었다. */
        const d = disc(r.normal, r.sale);
        const CS = nvCard5();
        const G0 = nvG();
        const py = top + (CSF.fPriceDY ?? (iy - top) + nameWrapH + O.optGap);

        if (CS.style === "labels") {
          /* ── 01 피드: 할인 원 오른쪽 위 + 정상가/혜택가 2줄 ── */
          const dcx = ix + IW - O.discD / 2, dcy = btY + O.discD / 2;
          ctx.fillStyle = th.accent;
          ctx.beginPath(); ctx.arc(dcx, dcy, O.discD / 2, 0, 7); ctx.fill();
          ctx.fillStyle = "#fff";
          ctx.font = `700 ${O.discSize}px GmarketSans, Pretendard`;
          ctx.textAlign = "center";
          trk(ctx, d != null ? d + "%" : "—", dcx, dcy, -0.5, "center");
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
        } else {
          /* ── 02 · 03 피드 (.fig 80:897) ── */
          const pcy = py + O.discD / 2;
          ctx.fillStyle = th.colorBgLight || th.sectionBg || "#f0f3dd";
          ctx.fillRect(ix, py, O.discD, O.discD);
          ctx.fillStyle = th.discInk || th.accent;
          ctx.font = `700 ${O.discSize}px GmarketSans, Pretendard`;
          ctx.textAlign = "center";
          trk(ctx, d != null ? d + "%" : "—", ix + O.discD / 2, pcy, -0.72, "center");
          ctx.textAlign = "left";
          let fx = ix + O.discD + O.priceGapX;
          ctx.fillStyle = "#333333";
          ctx.font = `700 ${O.saleSize}px Pretendard`;
          const slT = won(r.sale);
          trk(ctx, slT, fx, pcy, -0.8, "left");
          fx += trkWidth(ctx, slT, -0.8) + O.priceNumGap;
          ctx.fillStyle = "#666666";
          ctx.font = `400 ${O.normalSize}px Pretendard`;
          const npT = won(r.normal);
          trk(ctx, npT, fx, pcy, -0.56, "left");
          const npW = trkWidth(ctx, npT, -0.56);
          ctx.strokeStyle = "#666666"; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(fx, pcy); ctx.lineTo(fx + npW, pcy); ctx.stroke();
        }
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
            const B = state.tpl === "03" ? NVF.optBox03 : NVF.optBox;
            /* .fig 는 높이 고정. 카드 수로 계산하면 사이즈 슬라이드와 어긋난다.
               03 은 컨테이너가 투명이라 칠하지 않는다. */
            if (B.bg !== null) { ctx.fillStyle = "#ffffff"; ctx.fillRect(B.x, B.y, B.w, B.h); }
            const CSD2 = nvCard5();
            let y = B.y + B.pad;
            p.rows.forEach((r, i) => {
              if (CSD2.frameKey && th[CSD2.frameKey]) {
                const fw = CSD2.frameW;
                ctx.fillStyle = th[CSD2.frameKey];
                ctx.fillRect(B.x + B.pad - fw, y - fw, B.cardW + fw * 2, B.cardH + fw * 2);
              }
              nvfCard(ctx, r, B.x + B.pad, y, th, B.cardW, B.cardH);
              if (CSD2.divKey && th[CSD2.divKey] && i < p.rows.length - 1) {
                ctx.fillStyle = th[CSD2.divKey];
                ctx.fillRect(B.x + B.pad, y + B.cardH, B.cardW, CSD2.divFeedW || CSD2.divW);
              }
              y += B.cardH + B.gap;
            });
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
