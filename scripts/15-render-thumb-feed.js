/* CC 배너 제너레이터 — 15-render-thumb-feed
   원본 index.html 에서 기능별로 분리. 로드 순서가 곧 실행 순서다. */
      /* ============================================================
   멀티 포맷 렌더러 — 썸네일(1080²) · 인스타 피드(1080×1350 ×N)
   .fig(CC자동화-배너_템플릿_bamboo) 실측 기반
   ============================================================ */
      const FMT = {
        detail: { w: 860, label: "상세페이지" },
        thumb: { w: 1080, h: 1080, label: "썸네일" },
        feed: { w: 1080, h: 1350, label: "인스타 피드" },
      };

      /* ---- 썸네일 1080×1080 : 상세 히어로를 정사각으로, 타이틀 96px ---- */
      function drawThumb(ctx, th) {
        if (nvIsOn()) { nvThumb(ctx, th); return; }
        const W = 1080,
          H = 1080;
        if (state.tpl === "01") {
          if (state.hero)
            clipRect(ctx, 0, 0, W, H, () => cover(ctx, state.hero, 0, 0, W, H));
          else {
            ctx.fillStyle = "#d9d9d9";
            ctx.fillRect(0, 0, W, H);
          }
          // txt-title 프레임 @(77,110) w926, cAlign=CENTER → 내부 요소 가로 중앙
          // 프레임 가로 중앙 = 77 + 926/2 = 540 = 화면 중앙
          const cx = 540,
            subH = HS_LH * 56,
            top = 110;
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#fff";
          const seller = state.seller || "seller";
          ctx.font = `400 56px 'High Summit'`;
          const sw = ctx.measureText(seller).width;
          ctx.font = `400 48px 'Playfair Display'`;
          const xw = ctx.measureText("×").width;
          const logoW = 140,
            gap = 18,
            subW = sw + gap + xw + gap + logoW;
          let sx = cx - subW / 2,
            scy = top + subH / 2;
          ctx.textAlign = "left";
          ctx.font = `400 56px 'High Summit'`;
          ctx.fillText(seller, sx, scy);
          sx += sw + gap;
          ctx.font = `400 48px 'Playfair Display'`;
          ctx.fillText("×", sx, scy);
          sx += xw + gap;
          drawLogo(ctx, sx, scy, logoW, 24);
          // title 96px lineH104 2줄, 가로 중앙
          const ty = top + subH + 10 + 90;
          ctx.textAlign = "center";
          ctx.font = `400 96px 'Playfair Display'`;
          [state.t1, state.t2]
            .filter(Boolean)
            .forEach((l, i) => trk(ctx, l, cx, ty + i * 104, -1.9, "center"));
          ctx.textBaseline = "alphabetic";
        } else {
          // 02 그라데이션 배경 + 제품 이미지 전체(STRETCH) + 필 + 그라데이션 타이틀 + 카피바
          const a = (141.81 * Math.PI) / 180,
            len = Math.abs(W * Math.cos(a)) + Math.abs(H * Math.sin(a));
          const g = ctx.createLinearGradient(
            W / 2 - (Math.cos(a) * len) / 2,
            H / 2 - (Math.sin(a) * len) / 2,
            W / 2 + (Math.cos(a) * len) / 2,
            H / 2 + (Math.sin(a) * len) / 2,
          );
          g.addColorStop(0.0136, th.gradFrom);
          g.addColorStop(0.8337, th.gradTo);
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, W, H);
          // main-img: 원본(1080 전체 채움)의 80% 크기 + 하단 120px 마진
          // if (state.hero) {
          //   const marginB = 10;
          //   const scale = 1,
          //     imgW = W * scale,
          //     imgH = H * scale;
          //   const ix = W - imgW; // 가로 중앙
          //   const iy = H - marginB - imgH; // 하단에서 120 띄우고 그 위로 이미지
          //   contain(ctx, state.hero, ix, iy, imgW, imgH);
          // }
          if (state.hero) {
            const maxH = H * 1.1;
            const ratio = state.hero.width / state.hero.height;
            const imgH = maxH,
              imgW = imgH * ratio; // 높이 기준, 실제 비율
            const ix = W - imgW; // 우측 정렬
            const iy = -70; // ← y좌표 직접 지정 (키우면 아래로, 줄이면 위로)
            ctx.drawImage(state.hero, ix, iy, imgW, imgH);
          }
          const left = 59,
            top = 87;
          // pill @(59,87)
          ctx.font = `400 32px Pretendard`;
          const sw = ctx.measureText(state.seller || "seller").width;
          ctx.font = `400 44px 'Playfair Display'`;
          const xw = ctx.measureText("×").width;
          const logoW = 130,
            gap = 16,
            ph = 64,
            pw = sw + gap + xw + gap + logoW + 48;
          ctx.fillStyle = th.pillBg;
          roundRect(ctx, left, top, pw, ph, ph / 2);
          ctx.fill();
          ctx.textBaseline = "middle";
          ctx.textAlign = "left";
          ctx.fillStyle = "#fff";
          let x = left + 24,
            cy = top + ph / 2;
          ctx.font = `400 32px Pretendard`;
          ctx.fillText(state.seller || "seller", x, cy);
          x += sw + gap;
          ctx.font = `400 44px 'Playfair Display'`;
          ctx.fillText("×", x, cy);
          x += xw + gap;
          drawLogo(ctx, x, cy, logoW, 22);
          // 타이틀 @(59, top+108) 96px lineH104
          const ty = top + ph + 44;
          ctx.textAlign = "left";
          [
            [state.t1, 400],
            [state.t2, 700],
          ]
            .filter((l) => l[0])
            .forEach((l, i) => {
              const tg = ctx.createLinearGradient(left, 0, left + 800, 0);
              tg.addColorStop(0, th.titleFrom);
              tg.addColorStop(1, th.titleTo);
              ctx.fillStyle = tg;
              ctx.font = `${l[1]} 96px Pretendard`;
              trk(ctx, l[0], left, ty + i * 104 + 52, -1.9, "left");
            });
          ctx.fillStyle = th.dateText;
          ctx.font = `400 40px Pretendard`;
          trk(
            ctx,
            range02(state.d1, state.d2),
            left,
            ty + 2 * 104 + 40 + 20,
            -0.8,
            "left",
          );
          // 카피바 @(0,980) h100
          ctx.fillStyle = th.accent;
          ctx.fillRect(0, 980, W, 100);
          ctx.fillStyle = "#fff";
          ctx.textBaseline = "middle";
          ctx.font = `400 44px Pretendard`;
          const c1 = trkWidth(ctx, state.copy, -0.88) + copyGap(ctx);
          ctx.font = `700 44px Pretendard`;
          const c2 = trkWidth(ctx, state.copyBold, -0.88);
          let bx = (W - (c1 + c2)) / 2;
          ctx.font = `400 44px Pretendard`;
          trk(ctx, state.copy, bx, 1030, -0.88, "left");
          ctx.font = `700 44px Pretendard`;
          trk(ctx, state.copyBold, bx + c1, 1030, -0.88, "left");
          ctx.textBaseline = "alphabetic";
        }
      }

      /* ---- 피드 슬라이드 분배 (2,2,... 홀수면 마지막 1) ---- */
      function feedSlides() {
        const n = state.rows.length;
        const groups = [];
        for (let i = 0; i < n; i += 2) groups.push(state.rows.slice(i, i + 2));
        // groups: [[2],[2],...,[1 or 2]]
        return groups; // 각 원소가 옵션면 1장
      }
      /* 구형 피드도 상세와 같은 순서를 따른다 (2026-08-28 요청).
         슬라이드 목록을 먼저 만들고 인덱스로 꺼내 쓴다. */
      /* 섹션 하나가 차지하는 슬라이드 묶음 (26-section-order 가 같이 쓴다) */
      function legacyFeedGroupsOf(k) {
        if (k === "main") return [{ t: "hero" }];
        if (k === "option") return feedSlides().map((s, i) => ({ t: "opt", i }));
        if (k === "event")
          return Array.from({ length: evFeedN() }, (_, i) => ({ t: "event", i }));
        if (k === "try")
          return typeof tryFeedCount === "function"
            ? Array.from({ length: tryFeedCount() }, (_, i) => ({ t: "try", i }))
            : [];
        return [];
      }
      function legacyFeedPlan() {
        const out = [];
        for (const k of (typeof legacySecOrder === "function"
          ? legacySecOrder()
          : ["main", "option", "event", "try"]))
          out.push(...legacyFeedGroupsOf(k));
        return out;
      }
      function feedCount() {
        if (nvIsOn()) return nvFeedCount();
        return legacyFeedPlan().length;
      }
      function evFeedN() {
        return typeof evFeedCount === "function" ? evFeedCount() : 0;
      }

      /* ---- 피드 옵션 카드 960×468 : 이미지 왼쪽 / 정보 오른쪽 ---- */
      function feedCard(ctx, r, x, top, th, CW) {
        CW = CW || 960;
        const CH = 468;
        const G0 = G()[state.group] || {};
        const d = disc(r.normal, r.sale);
        ctx.fillStyle = "#fff";
        ctx.fillRect(x, top, CW, CH);

        if (state.tpl === "02") {
          // ===== 템플릿 02 피드 카드 — .fig auto-layout(flex) 그대로 =====
          // 카드 940×468 = [box-img 426] + gap36 + [info 456], counter=CENTER(세로중앙)
          const imgW = 426,
            imgH = 440,
            imgY = (CH - imgH) / 2; // 카드 안 세로 중앙 (468-440)/2=14
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(x, top + imgY, imgW, imgH);
          if (r.thumb) drawThumbCover(ctx, r.thumb, x, top + imgY, imgW, imgH);

          // info 좌측 x = box-img(426) + gap36 = 462, 폭 456
          const ix = x + 462,
            IW = 456;
          const badgeOn = r.badge !== "none";

          /* ── auto-layout: 내용을 먼저 측정한 뒤 높이를 계산한다 (고정값 금지) ──
             name-wrap = [badge 48 + gap20] + box-top(제품명 n줄 + gap12 + 단위값)
             info      = name-wrap + gap48 + price-wrap(108)
             제품명이 2줄이든 3줄이든 아래 가격 덩어리와의 간격(48)이 항상 유지된다. */
          const LH = 52; // 제품명 줄높이
          const lns = [];
          _mc.font = `600 40px Pretendard`;
          for (const para of String(rowName(r)).split(/\r?\n/)) {
            const t = para.trim();
            if (t) lns.push(...wrapText(_mc, t, IW, -0.8));
          }
          const attrs = rowAttrs(r);
          const isSingleAttr = attrs.length === 1 && !attrs[0].label;
          const attrH = attrs.length
            ? isSingleAttr
              ? 48
              : attrs.length * 32
            : 0;
          const boxTopH = lns.length * LH + (attrH ? 12 + attrH : 0);
          const nameWrapH = (badgeOn ? 48 + 20 : 0) + boxTopH;
          const infoH = nameWrapH + 48 + 108;
          // primary=CENTER → 세로 중앙. 내용이 길면 위로 붙여 잘림 방지
          const iy = top + Math.max(8, (CH - infoH) / 2);

          ctx.textAlign = "left";
          let ny = iy;
          if (badgeOn) {
            const bt = r.badge === "renewal" ? "★리뉴얼★" : "★NEW★";
            ctx.fillStyle = th.accent;
            ctx.font = `600 32px Pretendard`;
            ctx.textBaseline = "middle";
            trk(ctx, bt, ix, ny + 24, -0.4, "left");
            ny += 48 + 20;
          }
          // box-top: 제품명(40px, lineH52) + gap12 + 단위값(24px)
          ctx.fillStyle = "#333333";
          ctx.font = `600 40px Pretendard`;
          ctx.textBaseline = "middle";
          lns.forEach((l, i) =>
            trk(ctx, l, ix, ny + 26 + i * LH, -0.8, "left"),
          );
          let vy = ny + lns.length * LH + 12;
          if (attrs.length) {
            ctx.fillStyle = "#605850";
            ctx.font = `400 24px Pretendard`;
            if (isSingleAttr) {
              trk(ctx, attrs[0].value, ix, vy + 24, -0.48, "left");
            } else
              attrs.forEach((a) => {
                trk(
                  ctx,
                  (a.label ? a.label + " " : "") + a.value,
                  ix,
                  vy + 16,
                  -0.48,
                  "left",
                );
                vy += 32;
              });
          }
          // price-wrap(가로 flex gap24, counter=CENTER) — name-wrap 아래 gap48
          const py = iy + nameWrapH + 48;
          const flat = flatPrice(r); // 할인 없으면 칩·정상가 생략 (2026-09-04)
          if (!flat) {
            ctx.fillStyle = th.chipBg || "#f0f3dd";
            ctx.fillRect(ix, py, 108, 108); // 정사각, radius 0
            ctx.fillStyle = th.chipText || "#254631";
            ctx.font = `700 36px GmarketSans, Pretendard`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            trk(ctx, d != null ? d + "%" : "—", ix + 54, py + 55, -0.6, "center");
          }
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          const px = flat ? ix : ix + 108 + 24,
            pcy = py + 54; // gap24, 가격 세로중앙
          ctx.fillStyle = "#333333";
          ctx.font = `700 40px Pretendard`;
          const sp = won(r.sale);
          trk(ctx, sp, px, pcy, -0.8, "left");
          if (!flat) {
            const spw = trkWidth(ctx, sp, -0.8);
            ctx.fillStyle = "#666666";
            ctx.font = `400 28px Pretendard`;
            const np2 = won(r.normal);
            trk(ctx, np2, px + spw + 20, pcy + 2, -0.56, "left");
            const npw2 = trkWidth(ctx, np2, -0.56);
            ctx.strokeStyle = "#666666";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(px + spw + 20, pcy + 2);
            ctx.lineTo(px + spw + 20 + npw2, pcy + 2);
            ctx.stroke();
          }
          ctx.textBaseline = "alphabetic";
          return CH;
        }

        // ===== 템플릿 01 피드 카드 — .fig auto-layout 그대로 =====
        // 카드 960×468 = [box-img 416] + gap48 + [option 448], C:CENTER(세로중앙)
        // box-img 416×448, 카드 세로중앙 (468-448)/2=10
        const imgW = 416,
          imgH = 448,
          imgY = (CH - imgH) / 2;
        ctx.fillStyle = "#f8f8f8";
        ctx.fillRect(x + 10, top + imgY, imgW, imgH);
        if (r.thumb) drawThumbCover(ctx, r.thumb, x + 10, top + imgY, imgW, imgH);

        // option 영역 x = 10(카드좌패딩) + 416 + gap48 = 474, 폭 448
        const ix = x + 474,
          IW = 448;
        /* option = 세로 flex, P:SPACE_EVENLY → name-wrap + price-wrap
           name-wrap = [badge 49 + gap20] + box-top
           box-top   = 가로 flex → 제품명블록(왼) ┄ 할인원 104(오른) 이므로
                       높이 = max(제품명 n줄 + gap13 + 단위값, 104)
           ※ 내용을 먼저 측정해 높이를 잡는다(고정값 금지). 제품명이 3줄이어도
              단위값과 가격줄 사이 간격이 유지된다. */
        const priceH = 106;
        const _lines = [];
        _mc.font = `600 40px Pretendard`;
        const _nameW = IW - 104 - 20;
        for (const para of String(rowName(r)).split(/\r?\n/)) {
          const t = para.trim();
          if (t) _lines.push(...wrapText(_mc, t, _nameW, -0.8));
        }
        const _attrs = rowAttrs(r);
        const _isSingleAttr = _attrs.length === 1 && !_attrs[0].label;
        const _attrH = _attrs.length
          ? _isSingleAttr
            ? 32
            : _attrs.length * 32
          : 0;
        const boxTopH = Math.max(
          _lines.length * 52 + (_attrH ? 13 + _attrH : 0),
          104,
        );
        const nameH = (r.badge !== "none" ? 49 + 20 : 0) + boxTopH;
        // name-wrap 과 price-wrap 사이는 고정 47(.fig gap). 전체를 세로 중앙에 둔다.
        // SPACE_EVENLY 로 나누면 이름이 3줄일 때 간격이 저절로 좁아지므로 고정으로 둔다.
        const BLOCK_GAP = 47;
        const infoH = nameH + BLOCK_GAP + priceH;
        let ny = top + Math.max(8, (CH - infoH) / 2);
        const _infoTop = ny;

        ctx.textAlign = "left";
        // --- name-wrap (세로 flex gap20, P:MIN) ---
        //   badge(49) + gap20 + box-top(165)
        if (r.badge !== "none") {
          const bt = r.badge === "renewal" ? "RENEWAL!" : "NEW!";
          ctx.font = `600 28px Pretendard`;
          const bw = trkWidth(ctx, bt, -0.4) + 40;
          ctx.strokeStyle = th.badgeBorder || th.accent;
          ctx.lineWidth = 2;
          roundRect(ctx, ix, ny, bw, 49, 24);
          ctx.stroke();
          ctx.fillStyle = th.accent;
          ctx.textBaseline = "middle";
          trk(ctx, bt, ix + bw / 2, ny + 25, -0.4, "center");
          ny += 49 + 20;
        }
        // --- box-top (가로 flex, P:SPACE_EVENLY) → 제품명(왼) ┄ 할인율(오른, 104×104) ---
        const boxTopY = ny;
        // 할인율 원 (실측 discount_rate 104×104, 01은 원형 초록)
        /* 할인이 없으면 원 배지를 안 그린다 (2026-09-04) */
        if (!flatPrice(r)) {
        ctx.fillStyle = th.circleBg || th.accent;
        ctx.beginPath();
        ctx.arc(ix + IW - 52, boxTopY + 52, 52, 0, 7);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = `700 36px GmarketSans, Pretendard`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        trk(
          ctx,
          d != null ? d + "%" : "—",
          ix + IW - 52,
          boxTopY + 53,
          -0.6,
          "center",
        );
        }
        // 제품명 40px lineH52 + 단위 24px (왼쪽, 할인원과 안 겹치게 폭 제한)
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#333333";
        ctx.font = `600 40px Pretendard`;
        _lines.forEach((l, i) =>
          trk(ctx, l, ix, boxTopY + 26 + i * 52, -0.8, "left"),
        );
        let vy = boxTopY + _lines.length * 52 + 13;
        if (_attrs.length) {
          ctx.fillStyle = "#605850";
          ctx.font = `400 24px Pretendard`;
          if (_isSingleAttr) {
            trk(ctx, _attrs[0].value, ix, vy + 12, -0.48, "left");
          } else
            _attrs.forEach((a) => {
              trk(
                ctx,
                (a.label ? a.label + " " : "") + a.value,
                ix,
                vy + 12,
                -0.48,
                "left",
              );
              vy += 32;
            });
        }

        // --- price-wrap (세로 flex gap12, P:CENTER) — name-wrap 아래 고정 간격 ---
        //   정상가줄(라벨┄값, 취소선) + 혜택가줄(라벨┄값)
        const py = _infoTop + nameH + BLOCK_GAP;
        ctx.textBaseline = "middle";
        // 정상가줄 (28px, muted, 값 취소선) — 할인 없으면 생략 (2026-09-04)
        const flat2 = flatPrice(r);
        if (!flat2) {
          ctx.fillStyle = SHARED.textMuted;
          ctx.font = `400 28px Pretendard`;
          trk(ctx, G0.normalLabel || "정상가", ix, py + 23, -0.56, "left");
          const np = won(r.normal),
            npw = trkWidth(ctx, np, -0.56);
          trk(ctx, np, ix + IW, py + 23, -0.56, "right");
          ctx.strokeStyle = SHARED.textMuted;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(ix + IW - npw, py + 23);
          ctx.lineTo(ix + IW, py + 23);
          ctx.stroke();
        }
        // 혜택가줄 (40px, strong)
        const sy2 = flat2 ? py + 23 : py + 47 + 20;
        ctx.fillStyle = "#333333";
        ctx.font = `600 40px Pretendard`;
        if (!flat2) trk(ctx, G0.saleLabel || "혜택가", ix, sy2, -0.8, "left");
        ctx.font = `700 40px Pretendard`;
        trk(ctx, won(r.sale), ix + IW, sy2, -0.8, "right");
        ctx.textBaseline = "alphabetic";
        return CH;
      }

      /* 피드 히어로 슬라이드 */
      function feedHero(ctx, th) {
        const W = 1080,
          H = 1350;
        if (state.tpl === "01") {
          if (state.hero)
            clipRect(ctx, 0, 0, W, H, () => cover(ctx, state.hero, 0, 0, W, H));
          else {
            ctx.fillStyle = "#b89a6a";
            ctx.fillRect(0, 0, W, H);
          }
          // txt-title @(77,110) 가로 중앙 (thumb과 동일 정렬)
          const cx = 540,
            subH = HS_LH * 56,
            top = 110;
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#fff";
          const seller = state.seller || "seller";
          ctx.font = `400 56px 'High Summit'`;
          const sw = ctx.measureText(seller).width;
          ctx.font = `400 48px 'Playfair Display'`;
          const xw = ctx.measureText("×").width;
          const logoW = 140,
            gap = 18,
            subW = sw + gap + xw + gap + logoW;
          let sx = cx - subW / 2,
            scy = top + subH / 2;
          ctx.textAlign = "left";
          ctx.font = `400 56px 'High Summit'`;
          ctx.fillText(seller, sx, scy);
          sx += sw + gap;
          ctx.font = `400 48px 'Playfair Display'`;
          ctx.fillText("×", sx, scy);
          sx += xw + gap;
          drawLogo(ctx, sx, scy, logoW, 24);
          const ty = top + subH + 10 + 90;
          ctx.textAlign = "center";
          ctx.font = `400 96px 'Playfair Display'`;
          [state.t1, state.t2]
            .filter(Boolean)
            .forEach((l, i) => trk(ctx, l, cx, ty + i * 104, -1.9, "center"));
          ctx.textBaseline = "alphabetic";
          // box-bottom @(0,1250) h100
          ctx.fillStyle = th.accent;
          ctx.fillRect(0, 1250, W, 100);
          ctx.fillStyle = "#fff";
          ctx.textBaseline = "middle";
          ctx.textAlign = "center";
          ctx.font = `400 44px 'Playfair Display'`;
          trk(ctx, range01(state.d1, state.d2), W / 2, 1300, -0.8, "center");
          ctx.textBaseline = "alphabetic";
        } else {
          const a = (141.81 * Math.PI) / 180,
            len = Math.abs(W * Math.cos(a)) + Math.abs(H * Math.sin(a));
          const g = ctx.createLinearGradient(
            W / 2 - (Math.cos(a) * len) / 2,
            H / 2 - (Math.sin(a) * len) / 2,
            W / 2 + (Math.cos(a) * len) / 2,
            H / 2 + (Math.sin(a) * len) / 2,
          );
          g.addColorStop(0.0136, th.gradFrom);
          g.addColorStop(0.8337, th.gradTo);
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, W, H);
          if (state.hero)
            clipRect(ctx, 0, 0, W, H, () => cover(ctx, state.hero, 0, 0, W, H));
          const left = 88,
            top = 130; // .fig txt-title @(88,130)
          ctx.font = `400 32px Pretendard`;
          const sw = ctx.measureText(state.seller || "seller").width;
          ctx.font = `400 44px 'Playfair Display'`;
          const xw = ctx.measureText("×").width;
          const ph = 64,
            pw = sw + 16 + xw + 16 + 130 + 48;
          ctx.fillStyle = th.pillBg;
          roundRect(ctx, left, top, pw, ph, ph / 2);
          ctx.fill();
          ctx.textBaseline = "middle";
          ctx.textAlign = "left";
          ctx.fillStyle = "#fff";
          let x = left + 24,
            cy = top + ph / 2;
          ctx.font = `400 32px Pretendard`;
          ctx.fillText(state.seller || "seller", x, cy);
          x += sw + 16;
          ctx.font = `400 44px 'Playfair Display'`;
          ctx.fillText("×", x, cy);
          x += xw + 16;
          drawLogo(ctx, x, cy, 130, 22);
          const ty = top + ph + 44;
          ctx.textAlign = "left";
          [
            [state.t1, 400],
            [state.t2, 700],
          ]
            .filter((l) => l[0])
            .forEach((l, i) => {
              const tg = ctx.createLinearGradient(left, 0, left + 800, 0);
              tg.addColorStop(0, th.titleFrom);
              tg.addColorStop(1, th.titleTo);
              ctx.fillStyle = tg;
              ctx.font = `${l[1]} 96px Pretendard`;
              trk(ctx, l[0], left, ty + i * 104 + 52, -1.9, "left");
            });
          ctx.fillStyle = th.dateText;
          ctx.font = `400 40px Pretendard`;
          trk(
            ctx,
            range02(state.d1, state.d2),
            left,
            ty + 2 * 104 + 40 + 20,
            -0.8,
            "left",
          );
          ctx.fillStyle = th.accent;
          ctx.fillRect(0, 1250, W, 100);
          ctx.fillStyle = "#fff";
          ctx.textBaseline = "middle";
          ctx.font = `400 44px Pretendard`;
          const c1 = trkWidth(ctx, state.copy, -0.88) + copyGap(ctx);
          ctx.font = `700 44px Pretendard`;
          const c2 = trkWidth(ctx, state.copyBold, -0.88);
          let bx = (W - (c1 + c2)) / 2;
          ctx.font = `400 44px Pretendard`;
          trk(ctx, state.copy, bx, 1300, -0.88, "left");
          ctx.font = `700 44px Pretendard`;
          trk(ctx, state.copyBold, bx + c1, 1300, -0.88, "left");
          ctx.textBaseline = "alphabetic";
        }
      }

      /* 피드 옵션면 헤더 (option info. + 시리즈/옵션명) */
      function feedOptHeader(ctx, W, th) {
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        // 01 = Playfair 40px accent / 02 = High Summit 52px eyebrowColor
        ctx.fillStyle =
          state.tpl === "02" ? th.eyebrowColor || th.accent : th.accent;
        ctx.font =
          state.tpl === "02"
            ? `400 52px 'High Summit'`
            : `400 40px 'Playfair Display'`;
        ctx.fillText("option info.", W / 2, 100 + 26);
        ctx.fillStyle = state.tpl === "02" ? "#ffffff" : th.accent;
        ctx.font =
          state.tpl === "02"
            ? `700 72px GmarketSans, Pretendard`
            : `600 72px Pretendard`;
        ctx.fillText(state.series || "", W / 2, 100 + 112);
        ctx.textBaseline = "alphabetic";
      }

      /* 피드 슬라이드 1장 (idx 0=히어로, 1~=옵션면) */
      function drawFeedSlide(ctx, idx, th) {
        if (nvIsOn()) { nvFeedSlide(ctx, idx, th); return; }
        const W = 1080,
          H = 1350;
        const plan = legacyFeedPlan();
        const p = plan[idx];
        if (!p) return;
        if (p.t === "hero") {
          feedHero(ctx, th);
          return;
        }
        if (p.t === "event") {
          evFeedSlide(ctx, evFeedGroups()[p.i], th);
          return;
        }
        if (p.t === "try") {
          tryFeedSlide(ctx, tryFeedGroups()[p.i], th);
          return;
        }
        const slides = feedSlides();
        /* 아래 코드는 idx 를 옵션면 번호로 쓴다 → 순서와 무관하게 맞춘다 */
        idx = p.i + 1;
        const cards = slides[idx - 1] || [];
        const isLastOdd = idx - 1 === slides.length - 1 && cards.length === 1;

        // 배경
        ctx.fillStyle =
          state.tpl === "02"
            ? th.sectionBg || "#b9ca7d"
            : th.sectionBg || "#f0f3dd";
        ctx.fillRect(0, 0, W, H);
        feedOptHeader(ctx, W, th);

        if (isLastOdd) {
          if (state.tpl === "01") {
            // 01: 카드 1장 + 하단 로고 박스 (히어로 box-bottom과 동일: accent색, 0/1250, W×100)
            feedCard(ctx, cards[0], 60, 319, th, 960);
            ctx.fillStyle = th.accent;
            ctx.fillRect(0, 1250, W, 100);
            drawLogo(ctx, W / 2 - 100, 1300, 200, 32);
          } else {
            // 02: 진한 배경 + 흰 컨테이너 카드 1장 + 하단 로고
            /* ⚠ x 를 60 으로 박아 놨는데 폭이 940 이라 오른쪽 여백이 80 이 됐다
                 (좌 60 / 우 80 → 10px 왼쪽으로 치우침, 2026-08-28 신고).
               폭에서 가운데를 계산한다. 01 은 x60 w960 이라 원래 가운데였다. */
            const listW = 940,
              listX = (W - listW) / 2,
              listY = 312;
            ctx.fillStyle = "#ffffff";
            roundRect(ctx, listX, listY, listW, 468 + 40, 0);
            ctx.fill();
            feedCard(ctx, cards[0], listX, listY + 20, th, 940);
            drawLogo(ctx, W / 2 - 100, 1270, 200, 32);
          }
          return;
        }

        // 일반 옵션면
        if (state.tpl === "02") {
          // .fig: option-list 컨테이너 940×988 @(60,312), pad20 gap12
          //       카드 940×468, 컨테이너 폭과 동일(좌우 여백 0), pitch 480
          const listW = 940,
            listX = (W - listW) / 2, // 가운데 (위 주석 참고)
            listY = 312;
          const listH = 20 + cards.length * 468 + (cards.length - 1) * 12 + 20;
          ctx.fillStyle = "#ffffff";
          roundRect(ctx, listX, listY, listW, listH, 0);
          ctx.fill();
          let cy = listY + 20;
          cards.forEach((r, i) => {
            feedCard(ctx, r, listX, cy, th, 940);
            // 카드 사이 구분선 (.fig: option_01 하단 border, cardBorder색)
            if (i < cards.length - 1) {
              ctx.strokeStyle = th.cardBorder || "#d0dfb1";
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(listX + 30, cy + 468);
              ctx.lineTo(listX + listW - 30, cy + 468);
              ctx.stroke();
            }
            cy += 480;
          });
        } else {
          // 01: 배경 위에 흰 카드 직접 (컨테이너 없음)
          let cy = 319;
          for (const r of cards) {
            feedCard(ctx, r, 60, cy, th, 960);
            cy += 488;
          }
        }
      }
