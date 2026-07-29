/* CC 배너 제너레이터 — 16-render-cards
   원본 index.html 에서 기능별로 분리. 로드 순서가 곧 실행 순서다. */
      const NAME_W = { "01": 250, "02": 342 }; // 피그마 txt_option 폭
      const ATTR_LH = 30,
        ATTR_GAP = 10; // ⚠️ 라벨 있는 블록의 행높이/간격 — 피그마 미확인(추정)

      /* 측정 전용 오프스크린 컨텍스트 */
      const _mc = document.createElement("canvas").getContext("2d");

      /* 폭 안에서 줄바꿈 — 공백 우선, 한 단어가 폭을 넘으면 글자 단위로 강제 분할 */
      function wrapText(ctx, text, maxW, tracking) {
        const t = String(text || "").trim();
        if (!t) return [];
        const words = t.split(/\s+/),
          lines = [];
        let line = "";
        const w = (s) => trkWidth(ctx, s, tracking || 0);
        for (const word of words) {
          const test = line ? line + " " + word : word;
          if (w(test) <= maxW) {
            line = test;
            continue;
          }
          if (line) {
            lines.push(line);
            line = "";
          }
          if (w(word) <= maxW) {
            line = word;
            continue;
          }
          // 단어 자체가 폭 초과 -> 글자 단위 분할
          let cur = "";
          for (const ch of word) {
            if (w(cur + ch) > maxW && cur) {
              lines.push(cur);
              cur = ch;
            } else cur += ch;
          }
          line = cur;
        }
        if (line) lines.push(line);
        return lines;
      }
      /* 제품명 줄 계산.
   - 셀 안 줄바꿈(Alt+Enter)은 **의도된 줄바꿈**으로 그대로 유지
   - 각 줄이 폭을 넘을 때만 자동으로 접음 → 어떤 경우에도 폭을 넘지 않음(원과 겹치지 않음) */
      function nameLines(r) {
        const nameW = NAME_W[state.tpl] || 250;
        _mc.font = `600 ${SHARED.name.size}px Pretendard`;
        const out = [];
        for (const para of String(rowName(r) || "").split(/\r?\n/)) {
          const t = para.trim();
          if (!t) continue;
          out.push(...wrapText(_mc, t, nameW, SHARED.name.tracking));
        }
        return out.length ? out : [""];
      }
      function rowName(r) {
        return r.name || [r.n1, r.n2].filter(Boolean).join(" ");
      }

      function attrsHeight(attrs) {
        if (!attrs || !attrs.length) return 0;
        // 라벨 없는 단일 블록 = 뱀부500 케이스 (피그마 검증값 36)
        if (attrs.length === 1 && !attrs[0].label) return SHARED.unit.lineH;
        return (
          attrs.reduce((a, b) => a + (b.label ? ATTR_LH : 0) + ATTR_LH, 0) +
          ATTR_GAP * (attrs.length - 1)
        );
      }
      function cardMetrics(r, priceH) {
        const lns = nameLines(r);
        const lines = lns.length || 1;
        const attrs = rowAttrs(r);
        const aH = attrsHeight(attrs);
        const txtH = lines * SHARED.name.lineH + (aH ? 10 + aH : 0);
        const boxTopH = Math.max(txtH, 80);
        const nameWrapH = (r.badge !== "none" ? 36 + 16 : 0) + boxTopH;
        const contentH = nameWrapH + 36 + priceH;
        // 피그마: 카드 1~4=360(콘텐츠 최대 296), 배지+3줄인 카드5는 428로 키움.
        // 콘텐츠가 360에 안 들어가면 피그마처럼 카드를 키운다.
        const cardH = Math.max(360, contentH + 64);
        return {
          lns,
          lines,
          attrs,
          aH,
          txtH,
          boxTopH,
          nameWrapH,
          contentH,
          cardH,
        };
      }
      /* 시트 optionInfo(배열) 또는 구 unit(문자열) 모두 지원 */
      function rowAttrs(r) {
        if (Array.isArray(r.optionInfo)) return r.optionInfo;
        if (r.unit) return [{ label: null, value: r.unit }];
        return [];
      }
      /* 옵션 상세 블록 렌더 → 끝난 y 반환 */
      function drawAttrs(ctx, attrs, x, y) {
        if (!attrs.length) return y;
        if (attrs.length === 1 && !attrs[0].label) {
          ctx.fillStyle = SHARED.textSub;
          ctx.font = `400 ${SHARED.unit.size}px Pretendard`;
          trk(
            ctx,
            attrs[0].value,
            x,
            y + SHARED.unit.lineH / 2,
            SHARED.unit.tracking,
            "left",
          );
          return y + SHARED.unit.lineH;
        }
        let cy = y;
        attrs.forEach((a, i) => {
          if (a.label) {
            ctx.fillStyle = SHARED.textStrong;
            ctx.font = `600 ${SHARED.unit.size}px Pretendard`;
            trk(
              ctx,
              a.label,
              x,
              cy + ATTR_LH / 2,
              SHARED.unit.tracking,
              "left",
            );
            cy += ATTR_LH;
          }
          ctx.fillStyle = SHARED.textSub;
          ctx.font = `400 ${SHARED.unit.size}px Pretendard`;
          trk(ctx, a.value, x, cy + ATTR_LH / 2, SHARED.unit.tracking, "left");
          cy += ATTR_LH;
          if (i < attrs.length - 1) cy += ATTR_GAP;
        });
        return cy;
      }
      function card01(ctx, r, x0, top, th) {
        const x = x0 + 10;
        const m = cardMetrics(r, 82);
        const CW = OPT["01"].cardW,
          CH = m.cardH,
          OH = CH - 72;
        ctx.fillStyle = "#fff";
        ctx.fillRect(x0, top, CW, CH);
        const T = SHARED.thumb;
        ctx.fillStyle = T.bg;
        ctx.fillRect(x, top + 10, T.w, CH - 20);
        if (r.thumb)
          drawThumbFit(
            ctx,
            r.thumb,
            x + (T.w * T.imgLeft) / 100,
            top + 10 + ((CH - 20) * T.imgTop) / 100,
            (T.w * T.imgW) / 100,
            ((CH - 20) * T.imgH) / 100,
          );
        else ph(ctx, x + T.w / 2, top + CH / 2);

        const ox = x + 356,
          OW = 342;
        let cy = top + 36 + (OH - m.contentH) / 2; // justify-center

        if (r.badge !== "none") {
          const txt = r.badge === "renewal" ? "RENEWAL!" : "NEW!";
          ctx.strokeStyle = th.badgeBorder;
          ctx.lineWidth = 2;
          roundRect(ctx, ox, cy, 120, 36, 18);
          ctx.stroke();
          ctx.fillStyle = th.accent;
          ctx.font = `600 20px Pretendard`;
          ctx.textBaseline = "middle";
          trk(ctx, txt, ox + 60, cy + 18, -0.4, "center");
          cy += 36 + 16;
        }
        const boxTop = cy;
        ctx.textBaseline = "middle";
        ctx.fillStyle = SHARED.textStrong;
        ctx.font = `600 32px Pretendard`;
        m.lns.forEach((l, i) =>
          trk(ctx, l, ox, boxTop + i * 40 + 20, -0.64, "left"),
        );
        if (m.aH) drawAttrs(ctx, m.attrs, ox, boxTop + m.lines * 40 + 10);
        // 할인 원
        const d = disc(r.normal, r.sale);
        ctx.fillStyle = th.circleBg;
        ctx.beginPath();
        ctx.arc(ox + 302, boxTop + 40, 40, 0, 7);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = `700 28px GmarketSans, Pretendard`;
        trk(
          ctx,
          d != null ? d + "%" : "—",
          ox + 302,
          boxTop + 41,
          -0.56,
          "center",
        );

        // 가격 2줄
        const py = boxTop + m.boxTopH + 36;
        const g = G()[state.group] || {};
        ctx.fillStyle = SHARED.textMuted;
        ctx.font = `600 20px Pretendard`;
        trk(ctx, g.normalLabel || "정상가", ox, py + 18, -0.4, "left");
        ctx.font = `400 20px Pretendard`;
        const np = won(r.normal);
        trk(ctx, np, ox + OW, py + 18, -0.4, "right");
        const npw = trkWidth(ctx, np, -0.4);
        ctx.strokeStyle = SHARED.textMuted;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(ox + OW - npw, py + 18);
        ctx.lineTo(ox + OW, py + 18);
        ctx.stroke();

        ctx.fillStyle = SHARED.textStrong;
        ctx.font = `600 28px Pretendard`;
        trk(ctx, g.saleLabel || "혜택가", ox, py + 46 + 18, -0.56, "left");
        ctx.font = `700 28px Pretendard`;
        trk(ctx, won(r.sale), ox + OW, py + 46 + 18, -0.56, "right");
        ctx.textBaseline = "alphabetic";
        return CH;
      }

      /* ---- 카드 02 : 텍스트 배지 + 사각칩 + 인라인 가격 (라벨 없음) ---- */
      function card02(ctx, r, x, top, th) {
        const m = cardMetrics(r, 80);
        const CW = OPT["02"].cardW,
          CH = m.cardH - 6,
          OH = CH - 72;
        ctx.fillStyle = "#fff";
        ctx.fillRect(x, top, CW, CH);
        ctx.strokeStyle = th.cardBorder;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, top + CH - 0.5);
        ctx.lineTo(x + CW, top + CH - 0.5);
        ctx.stroke();

        const T = SHARED.thumb;
        ctx.fillStyle = "#fff";
        ctx.fillRect(x, top + 7, T.w, CH - 14);
        if (r.thumb)
          drawThumbFit(
            ctx,
            r.thumb,
            x + (T.w * T.imgLeft) / 100,
            top + 7 + ((CH - 14) * T.imgTop) / 100,
            (T.w * T.imgW) / 100,
            ((CH - 14) * T.imgH) / 100,
          );
        else ph(ctx, x + T.w / 2, top + CH / 2);

        const ox = x + T.w + 36,
          OW = CW - T.w - 36;
        let cy = top + 36 + (OH - m.contentH) / 2;

        ctx.textBaseline = "middle";
        if (r.badge !== "none") {
          const txt = r.badge === "renewal" ? "★리뉴얼★" : "★NEW★";
          ctx.fillStyle = th.badgeText;
          ctx.font = `600 24px Pretendard`;
          trk(ctx, txt, ox, cy + 18, -0.48, "left");
          cy += 36 + 16;
        }
        const boxTop = cy;
        ctx.fillStyle = SHARED.textStrong;
        ctx.font = `600 32px Pretendard`;
        m.lns.forEach((l, i) =>
          trk(ctx, l, ox, boxTop + i * 40 + 20, -0.64, "left"),
        );
        if (m.aH) drawAttrs(ctx, m.attrs, ox, boxTop + m.lines * 40 + 10);

        // 가격줄: [칩 80] gap20 [혜택가] gap16 [정상가 취소선] — 라벨 없음
        const py = boxTop + m.boxTopH + 36;
        const d = disc(r.normal, r.sale);
        ctx.fillStyle = th.chipBg;
        ctx.fillRect(ox, py, 80, 80);
        ctx.fillStyle = th.chipText;
        ctx.font = `700 28px GmarketSans, Pretendard`;
        trk(ctx, d != null ? d + "%" : "—", ox + 40, py + 41, -0.56, "center");

        let px = ox + 80 + 20;
        ctx.fillStyle = SHARED.textStrong;
        ctx.font = `700 28px Pretendard`;
        const sp = won(r.sale);
        trk(ctx, sp, px, py + 40, -0.56, "left");
        px += trkWidth(ctx, sp, -0.56) + 16;
        ctx.fillStyle = SHARED.textMuted;
        ctx.font = `400 20px Pretendard`;
        const np = won(r.normal);
        trk(ctx, np, px, py + 40, -0.4, "left");
        const npw = trkWidth(ctx, np, -0.4);
        ctx.strokeStyle = SHARED.textMuted;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(px, py + 40);
        ctx.lineTo(px + npw, py + 40);
        ctx.stroke();
        ctx.textBaseline = "alphabetic";
        return CH;
      }
