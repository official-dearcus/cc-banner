/* CC 배너 제너레이터 — 23-render-event
   이벤트 배너 (.fig event_comp01·02·03 실측)

   구조   section  860 × 가변
            padTop 80
            txt-wrap   (셀러줄 + 제목)
            headGap
            event_list (카드 N장)
            padBottom 60

   한 장의 카드
     제목   [titleLabel] gap8 [(num명)]        40 Bold  #605a4b
     본문   [bodyLabel][num]명에게              32 Regular #555555
            [gift][을/를] gap8 드립니다.         gift 만 SemiBold
     이미지 240×240 (01·03 오른쪽 / 02 왼쪽)

   카드 높이는 문장 길이가 정한다. 선물 이름이 길면 "드립니다." 가
   다음 줄로 넘어가고 카드가 커진다 (.fig 280 → 320).

   이벤트가 하나도 없으면 섹션 자체를 그리지 않는다(높이 0). */

      /* ── 마스터 (시트) ── */
      let EVENT_TYPES = []; // {typeKey, titleLabel, bodyLabel}
      let GIFTS = []; // {giftKey, label, particle, url}
      const GIFT_IMG = {}; // url → Image 캐시

      function evTypes() { return EVENT_TYPES; }
      function evGifts() { return GIFTS; }
      function evType(k) {
        return EVENT_TYPES.find((t) => t.typeKey === k) || null;
      }
      function evGift(k) {
        return GIFTS.find((g) => g.giftKey === k) || null;
      }
      /* 지금 행사의 이벤트 목록. 행사 세션이 들고 있고 제품군과 무관하다. */
      function evList() {
        if (typeof SESSION !== "undefined" && SESSION && SESSION.events)
          return SESSION.events;
        return (state && state.events) || [];
      }
      function evOn() { return evList().length > 0; }

      /* ── 조사 을/를 ──
         받침이 있으면 "을", 없으면 "를".
         끝의 괄호는 떼고 판단한다 — "디퓨저(향 랜덤)" 는 디퓨저 기준. */
      const EV_DIGIT_JONG = {
        "0": 1, "1": 1, "2": 0, "3": 1, "4": 0,
        "5": 0, "6": 1, "7": 1, "8": 1, "9": 0,
      };
      function evParticle(word) {
        let s = String(word || "").trim();
        s = s.replace(/[\s]*[(（\[［{][^)）\]］}]*[)）\]］}][\s]*$/, "").trim();
        if (!s) return "를";
        const c = s[s.length - 1];
        const code = c.charCodeAt(0);
        if (code >= 0xac00 && code <= 0xd7a3)
          return (code - 0xac00) % 28 !== 0 ? "을" : "를";
        if (/[0-9]/.test(c)) return EV_DIGIT_JONG[c] ? "을" : "를";
        return "를";
      }
      function evGiftParticle(g) {
        if (!g) return "를";
        const p = String(g.particle || "").trim();
        return p || evParticle(g.label);
      }

      /* ── 치수 (.fig 실측) ── */
      const EV = {
        W: 860,
        padTop: 80,
        padBottom: 60,
        nameInk: "#605a4b",
        bodyInk: "#555555",
        card: {
          txtW: 424,
          imgD: 240,
          /* 패딩은 템플릿마다 네 변이 다르다 → EV_TPL 로 옮겼다 */
          nameSize: 40, nameH: 32, nameGap: 8,
          bodySize: 32, lineH: 32, rowGap: 16,
          txtGap: 24, // 제목 ↔ 본문
          txtPadTop: 48, txtPadBot: 48,
          particleGap: 8, // 조사 → "드립니다." 사이
          track: -2,
        },
      };
      /* 템플릿별 껍데기. 색은 테마 키로 받는다 (.fig green 실측값과 1:1) */
      /* 템플릿별 껍데기 (.fig 2026-08-12 실측).
         padT/padB/padL/padR 은 흰 카드 안쪽 여백이다. 네 변이 서로 다르다. */
      const EV_TPL = {
        /* event_comp01  860×1245 · 배경 colorBg */
        "01": { bgKey: "colorBg", bodyX: 60, bodyW: 740, headGap: 60,
                sub: "pill", subH: 53, subGap: 16,
                sellerSize: 32, sellerFont: "'Playfair Display'",
                xSize: 40, logoW: 116, logoH: 19, subItemGap: 16,
                /* 제목 색은 바로 위 컬러 섹션과 같은 키를 쓴다 (요청 2026-08-12).
                   한 키가 두 섹션을 정하므로 테마를 바꿔도 위아래가 안 어긋난다.
                   green 은 이 요청에 맞춰 t01ColorInk 를 흰색으로 바꿨다. */
                title: "GIFT EVENT", titleSize: 80, titleLH: 56,
                titleFont: "Pretendard", titleWeight: 600,
                titleInkKey: "t01ColorInk",
                listBgKey: null, listPad: 0,
                cardX: 0, cardW: 740, gap: 20,
                padT: 20, padB: 20, padL: 40, padR: 24, imgRight: true },
        /* event_comp02  860×1148 · 배경 colorBgLight · 흰 리스트 + 1px 구분선 */
        "02": { bgKey: "colorBgLight", bodyX: 50, bodyW: 760, headGap: 56,
                sub: "pair", subH: 40, subGap: 16,
                sellerSize: 36, sellerFont: "'High Summit'",
                tailSize: 36, tailFont: "'High Summit'",
                subTail: "& Dear.cus", subItemGap: 16, subInkKey: "colorBg",
                title: "OPEN EVENT", titleSize: 56, titleLH: 56,
                titleFont: "GmarketSans, Pretendard", titleWeight: 700,
                titleInkKey: "accent",
                listBg: "#ffffff", listPad: 0,
                cardX: 36, cardW: 688, gap: 20,
                padT: 0, padB: 0, padL: 0, padR: 0, imgRight: false, imgGap: 24,
                divKey: "colorBg", divW: 1, divGap: 20 },
        /* event_comp03  860×1245 · 배경 accent · colorBgLight 띠 */
        "03": { bgKey: "accent", bodyX: 50, bodyW: 760, headGap: 56,
                sub: "pair", subH: 53, subGap: 20,
                sellerSize: 44, sellerFont: "'Afacad Flux', Pretendard",
                tailSize: 40, tailFont: "'Afacad Flux', Pretendard",
                subTail: "& Dear.cus", subItemGap: 16, subInk: "#ffffff",
                title: "OPEN EVENT", titleSize: 92, titleLH: 72,
                titleFont: "'Afacad Flux', Pretendard", titleWeight: 600,
                titleInk: "#ffffff",
                listBgKey: "colorBgLight", listPad: 22,
                cardX: 22, cardW: 716, gap: 20,
                padT: 10, padB: 10, padL: 20, padR: 20, imgRight: true },
      };
      function evCfg() { return EV_TPL[state.tpl] || EV_TPL["01"]; }
      /* 이벤트 배너의 색.
         ⚠ event_comp 는 패밀리가 없는 단일 디자인이다. 그런데 구형(뱀부) 테마엔
           colorBg / colorBgLight 키가 아예 없어서(accent·circleBg·badgeBorder·
           sectionBg 넷뿐) 대체 키로 때웠더니, 뱀부 01 에서 위 섹션(sectionBg)과
           톤이 비슷해져 두 섹션이 한 덩어리로 보였다.
         → 테마 "키"만 받아 누볼라 팔레트에서 색을 꺼낸다. 어느 제품군이든
           .fig 와 같은 색이 나오고, 위 섹션과 확실히 갈린다.
             01 colorBg      중간톤   (blue #7d9eca)
             02 colorBgLight 연한톤   (blue #eaf3f6)
             03 accent       진한톤   (blue #2d6181) */
      function evPalette(th) {
        const tbl = typeof THEMES_NUVOLA !== "undefined" ? THEMES_NUVOLA : null;
        const k = state.theme;
        return (tbl && (tbl[k] || tbl.green)) || th || {};
      }
      function evColor(th, key, dflt) {
        const p = evPalette(th);
        return p[key] || (th && th[key]) || dflt || "#ffffff";
      }

      /* ── 문장 조립 ──
         토큰 하나 = 한 낱말. glue 는 앞 낱말과의 간격(px).
         br=false 인 토큰(조사)은 앞 낱말과 절대 안 떨어진다. */
      /* 선물 표기 — 수량이 2 이상이면 "수세미 2개".
         조사는 이 문자열 기준이라 자동으로 맞는다 ("2개" → 받침 없음 → 를). */
      function evGiftText(ev) {
        const g = evGift(ev.giftKey);
        const label = (g && g.label) || "";
        const q = Math.max(1, parseInt(ev.qty, 10) || 1);
        return q > 1 ? `${label} ${q}개` : label;
      }
      /* 완성 문장 — 패널 미리보기와 배너가 같은 결과를 쓴다 */
      function evSentence(ev) {
        const t = evType(ev.typeKey);
        if (!t) return "";
        const body = t.bodyLabel || t.titleLabel;
        const gift = evGiftText(ev);
        const par = evPartOf(ev);
        return `${body} ${ev.num}명에게 ${gift}${par} 드립니다.`;
      }
      /* 조사. 수량이 붙으면 "…2개" 기준으로 다시 고른다.
         GiftMaster.particle 은 수량이 없을 때만 존중한다 —
         "수세미를"로 적어둔 값이 "수세미 2개를"에서도 맞는다는 보장이 없다. */
      function evPartOf(ev) {
        const g = evGift(ev.giftKey);
        const q = Math.max(1, parseInt(ev.qty, 10) || 1);
        return q > 1 ? evParticle(evGiftText(ev)) : evGiftParticle(g);
      }
      function evTokens(ev) {
        const t = evType(ev.typeKey);
        const body = (t && (t.bodyLabel || t.titleLabel)) || "";
        const num = String(ev.num ?? "");
        const gift = evGiftText(ev);
        const par = evPartOf(ev);
        const sp = -1; // 공백 폭은 그릴 때 실제로 잰다
        const words = (s, w) =>
          String(s).split(/\s+/).filter(Boolean).map((x, i) => ({
            t: x, w, glue: i === 0 ? 0 : sp, br: i > 0,
          }));
        /* 1줄 — "구매 선착순 10명에게"
           ⚠ .fig 은 "구매 선착순"·"10"·"명에게" 를 간격 0 으로 붙여 놨지만
             (144 → 144 → 177) 붙여 읽히므로 요청(2026-08-12)대로 띄운다. */
        const p1 = words(`${body} ${num}명에게`, 400);
        /* 2줄 — "[선물][을] 드립니다." */
        const p2 = words(gift, 600);
        if (p2.length) p2[p2.length - 1] = { ...p2[p2.length - 1] };
        p2.push({ t: par, w: 400, glue: 0, br: false });
        p2.push({ t: "드립니다.", w: 400, glue: EV.card.particleGap, br: true });
        return { p1, p2, title: t ? t.titleLabel : "", num };
      }
      /* 낱말 단위 줄바꿈. 반환: [[{t,w,x}...], ...] */
      function evWrap(ctx, toks, maxW) {
        const C = EV.card;
        const wOf = (tk) => {
          ctx.font = `${tk.w} ${C.bodySize}px Pretendard`;
          return trkWidth(ctx, tk.t, C.track);
        };
        ctx.font = `400 ${C.bodySize}px Pretendard`;
        const spaceW = trkWidth(ctx, " ", C.track) || C.bodySize * 0.3;
        const lines = [];
        let line = [], x = 0;
        for (const tk of toks) {
          const glue = tk.glue === -1 ? spaceW : tk.glue;
          const w = wOf(tk);
          const g = line.length ? glue : 0;
          if (line.length && tk.br && x + g + w > maxW) {
            lines.push(line);
            line = []; x = 0;
            line.push({ ...tk, x: 0, wpx: w });
            x = w;
            continue;
          }
          line.push({ ...tk, x: x + g, wpx: w });
          x += g + w;
        }
        if (line.length) lines.push(line);
        return lines;
      }
      /* 카드 한 장의 치수 — 측정과 그리기가 같이 쓴다 */
      function evMeasure(ctx, ev) {
        const C = EV.card, S = evCfg();
        const tk = evTokens(ev);
        const lines = [...evWrap(ctx, tk.p1, C.txtW), ...evWrap(ctx, tk.p2, C.txtW)];
        const bodyH = lines.length
          ? lines.length * C.lineH + (lines.length - 1) * C.rowGap
          : 0;
        const txtH = C.txtPadTop + C.nameH + C.txtGap + bodyH + C.txtPadBot;
        const cardH = Math.max(C.imgD, txtH) + (S.padT ?? 0) + (S.padB ?? 0);
        return { tk, lines, bodyH, txtH, cardH };
      }
      /* 헤더(셀러줄 + 제목) 높이 */
      function evHeadH() {
        const S = evCfg();
        return S.subH + S.subGap + S.titleLH;
      }
      function evListH(ctx) {
        const S = evCfg(), evs = evList();
        if (!evs.length) return 0;
        let h = S.listPad * 2;
        evs.forEach((e, i) => {
          h += evMeasure(ctx, e).cardH;
          if (i < evs.length - 1) h += S.divKey ? S.divGap * 2 : S.gap;
        });
        return h;
      }
      function evSectionH() {
        if (!evOn()) return 0;
        return EV.padTop + evHeadH() + evCfg().headGap + evListH(_mc) + EV.padBottom;
      }

      /* ── 그리기 ── */
      /* 선물 이미지를 수량만큼 그린다.
         ⚠ .fig 에는 1개짜리 240×240 만 있다. 여러 장 배치는 디자인 근거가 없어
           2026-08-12 레퍼런스(사용자 조정본)에서 역산했다.
             step  0.42  가로 간격 / 각 장 크기      (3장 → 각 130 · 간격 55)
             slope 0.45  세로 낙차 / 가로 간격       45° 가 아니라 완만하게
             오른쪽 아래로 갈수록 앞 — 마지막 장이 맨 위에 온다
           가로가 항상 240 을 꽉 채우고(그래서 s 를 가로 기준으로 잡는다),
           세로는 그보다 낮으므로 칸 안에서 가운데로 맞춘다.
           카드 높이는 어떤 수량에서도 안 변한다.
           배치를 바꾸려면 EV_MULTI 세 값만 고치면 된다. */
      const EV_MULTI = { step: 0.42, slope: 0.45, max: 5 };
      function evGiftLayout(qty, D) {
        const n = Math.min(EV_MULTI.max, Math.max(1, parseInt(qty, 10) || 1));
        if (n <= 1) return [{ x: 0, y: 0, s: D }];
        const s = D / (1 + (n - 1) * EV_MULTI.step);
        const dx = EV_MULTI.step * s;
        const dy = dx * EV_MULTI.slope;
        const top = (D - (s + dy * (n - 1))) / 2; // 세로 가운데
        const out = [];
        for (let i = 0; i < n; i++)
          out.push({ x: dx * i, y: top + dy * i, s });
        return out;
      }
      /* 선물 이미지 캐시. 처음 부를 때 로딩을 걸고, 오면 draw() 로 다시 그린다. */
      function evGiftImg(url) {
        if (!url) return null;
        if (GIFT_IMG[url] !== undefined) return GIFT_IMG[url];
        GIFT_IMG[url] = null;
        if (typeof loadImgSmart === "function")
          loadImgSmart(url)
            .then((r) => { GIFT_IMG[url] = r.img; draw(); })
            .catch(() => {});
        return null;
      }
      function evDrawGift(ctx, ev, x, y, D) {
        const g = evGift(ev.giftKey);
        const im = g && evGiftImg(g.url);
        if (!im) return;
        /* 앞에서 뒤로 그린다 → 배열 마지막(오른쪽 아래)이 맨 위 */
        for (const p of evGiftLayout(ev.qty, D)) {
          const dx = x + p.x, dy = y + p.y, s = p.s;
          clipRect(ctx, dx, dy, s, s, () => cover(ctx, im, dx, dy, s, s));
        }
      }
      function evDrawCard(ctx, ev, x, top, th, S, m) {
        const C = EV.card;
        const cw = S.cardW, ch = m.cardH;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(x, top, cw, ch);
        /* 이미지와 글은 카드 안에서 각자 세로 가운데 (.fig) */
        const imgX = S.imgRight ? x + cw - S.padR - C.imgD : x + S.padL;
        const imgY = top + (ch - C.imgD) / 2;
        /* 이미지 자리는 흰색 — 카드와 같은 색이라 안 불러와도 안 튄다 (요청 2026-08-12) */
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(imgX, imgY, C.imgD, C.imgD);
        evDrawGift(ctx, ev, imgX, imgY, C.imgD);

        const tx = S.imgRight
          ? x + S.padL
          : x + S.padL + C.imgD + (S.imgGap || 24);
        let ty = top + (ch - m.txtH) / 2 + C.txtPadTop;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        /* 제목 — [titleLabel] gap8 [(N명)] */
        ctx.fillStyle = EV.nameInk;
        ctx.font = `700 ${C.nameSize}px Pretendard`;
        const t1 = m.tk.title;
        trk(ctx, t1, tx, ty + C.nameH / 2, C.track, "left");
        const w1 = trkWidth(ctx, t1, C.track);
        trk(ctx, `(${m.tk.num}명)`, tx + w1 + C.nameGap, ty + C.nameH / 2, C.track, "left");
        ty += C.nameH + C.txtGap;
        /* 본문 */
        ctx.fillStyle = EV.bodyInk;
        m.lines.forEach((ln, i) => {
          const ly = ty + i * (C.lineH + C.rowGap) + C.lineH / 2;
          ln.forEach((tok) => {
            ctx.font = `${tok.w} ${C.bodySize}px Pretendard`;
            trk(ctx, tok.t, tx + tok.x, ly, C.track, "left");
          });
        });
      }
      /* 셀러 줄 — 배율 k 를 받아 상세(1)와 피드(확대)가 같은 코드를 쓴다.
         .fig 2026-08-12
           01  [Playfair 32 셀러] 16 [Playfair 40 ×] 16 [로고 116×19]   흰색
           02  [High Summit 36 셀러] 16 [High Summit 36 & Dear.cus]     colorBg
           03  [Afacad 44 셀러] 16 [Afacad 40 & Dear.cus]               흰색 */
      function evDrawSub(ctx, W, y, th, S, k) {
        const R = (v) => Math.round(v * k);
        const cx = W / 2, scy = y + R(S.subH) / 2;
        const seller = state.seller || "Seller_name";
        const gap = R(S.subItemGap);
        ctx.textBaseline = "middle";
        ctx.textAlign = "left";
        if (S.sub === "pill") {
          /* 셀러 줄도 제목과 같은 색 (요청 2026-08-12).
             로고는 흰색 PNG 라 drawLogo 에 ink 를 넘겨 물들인다. */
          const ink = S.subInk || evColor(th, S.subInkKey || S.titleInkKey, "#ffffff");
          ctx.fillStyle = ink;
          ctx.font = `400 ${R(S.sellerSize)}px ${S.sellerFont}`;
          const sw = ctx.measureText(seller).width;
          ctx.font = `400 ${R(S.xSize)}px ${S.sellerFont}`;
          const xw = ctx.measureText("×").width;
          let sx = cx - (sw + gap + xw + gap + R(S.logoW)) / 2;
          ctx.font = `400 ${R(S.sellerSize)}px ${S.sellerFont}`;
          ctx.fillText(seller, sx, scy); sx += sw + gap;
          ctx.font = `400 ${R(S.xSize)}px ${S.sellerFont}`;
          ctx.fillText("×", sx, scy); sx += xw + gap;
          if (typeof drawLogo === "function")
            drawLogo(ctx, sx, scy, R(S.logoW), R(S.logoH), ink);
        } else {
          /* pair — [셀러] gap [& Dear.cus] */
          ctx.fillStyle = S.subInk || evColor(th, S.subInkKey, "#ffffff");
          ctx.font = `400 ${R(S.sellerSize)}px ${S.sellerFont}`;
          const sw = trkWidth(ctx, seller, -2);
          ctx.font = `400 ${R(S.tailSize)}px ${S.tailFont}`;
          const tw = trkWidth(ctx, S.subTail, -2);
          let sx = cx - (sw + gap + tw) / 2;
          ctx.font = `400 ${R(S.sellerSize)}px ${S.sellerFont}`;
          trk(ctx, seller, sx, scy, -2, "left"); sx += sw + gap;
          ctx.font = `400 ${R(S.tailSize)}px ${S.tailFont}`;
          trk(ctx, S.subTail, sx, scy, -2, "left");
        }
        ctx.textAlign = "center";
      }
      function evDrawTitle(ctx, W, y, th, S, k) {
        const R = (v) => Math.round(v * k);
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillStyle = S.titleInk || evColor(th, S.titleInkKey, "#ffffff");
        ctx.font = `${S.titleWeight} ${R(S.titleSize)}px ${S.titleFont}`;
        trk(ctx, evTitle(), W / 2, y + R(S.titleLH) / 2, -2, "center");
        ctx.textBaseline = "alphabetic";
      }
      function evDrawHead(ctx, W, y, th, S) {
        evDrawSub(ctx, W, y, th, S, 1);
        evDrawTitle(ctx, W, y + S.subH + S.subGap, th, S, 1);
      }
      /* 섹션 제목: 시트(TemplateMaster eventTitle) → 템플릿 기본값 */
      function evTitle() {
        const g = (typeof G === "function" && G()[state.group]) || {};
        const byTpl = g.eventTitleByTpl;
        return (byTpl && byTpl[state.tpl]) || evCfg().title;
      }
      /* 상세 마지막 섹션 */
      function evSection(ctx, W, oy, th) {
        if (!evOn()) return;
        const S = evCfg();
        const H = evSectionH();
        ctx.fillStyle = evColor(th, S.bgKey);
        ctx.fillRect(0, oy, W, H);
        evDrawHead(ctx, W, oy + EV.padTop, th, S);
        let y = oy + EV.padTop + evHeadH() + S.headGap;
        const listH = evListH(ctx);
        const listX = S.bodyX;
        if (S.listBg || S.listBgKey) {
          ctx.fillStyle = S.listBg || evColor(th, S.listBgKey);
          ctx.fillRect(listX, y, S.bodyW, listH);
        }
        let cy = y + S.listPad;
        const evs = evList();
        evs.forEach((e, i) => {
          const m = evMeasure(ctx, e);
          evDrawCard(ctx, e, listX + S.cardX, cy, th, S, m);
          cy += m.cardH;
          if (i < evs.length - 1) {
            if (S.divKey) {
              ctx.fillStyle = evColor(th, S.divKey, "#ddd");
              ctx.fillRect(listX + S.cardX, cy + S.divGap, S.cardW, S.divW);
              cy += S.divGap * 2;
            } else cy += S.gap;
          }
        });
      }

      /* ══════════════ 인스타 피드 (1080×1350) ══════════════
         .fig 에 피드용 event_comp 는 없다. 상세(860폭) 레이아웃을
         피드 본문 폭(960)에 맞춰 그대로 확대한다 — 다른 피드 슬라이드가
         본문 60 여백을 쓰는 것과 같은 규칙이다.
           k = 960 / 상세 bodyW   (01 은 1.297 · 02·03 은 1.263)
         카드는 슬라이드당 2장. 옵션 카드와 같은 규칙이고,
         3줄짜리 카드가 두 장 겹쳐도 1350 안에 들어간다. */
      const EVF = { W: 1080, H: 1350, bodyX: 60, bodyW: 960, perSlide: 2 };
      function evfK() { return EVF.bodyW / evCfg().bodyW; }
      /* 배율을 먹인 카드 치수 */
      function evfCard(ctx, ev, k) {
        const m = evMeasure(ctx, ev);
        return { ...m, cardH: Math.round(m.cardH * k), txtH: Math.round(m.txtH * k) };
      }
      function evFeedGroups() {
        const evs = evList();
        const out = [];
        for (let i = 0; i < evs.length; i += EVF.perSlide)
          out.push(evs.slice(i, i + EVF.perSlide));
        return out;
      }
      function evFeedCount() { return evOn() ? evFeedGroups().length : 0; }
      /* 슬라이드 하나 */
      function evFeedSlide(ctx, evs, th) {
        const S = evCfg(), C = EV.card, k = evfK();
        const W = EVF.W, H = EVF.H;
        ctx.fillStyle = evColor(th, S.bgKey);
        ctx.fillRect(0, 0, W, H);

        const ms = evs.map((e) => evfCard(ctx, e, k));
        const gapK = Math.round((S.divKey ? S.divGap * 2 : S.gap) * k);
        const listPadK = Math.round(S.listPad * k);
        const listH =
          listPadK * 2 + ms.reduce((a, m) => a + m.cardH, 0) + gapK * (ms.length - 1);
        const headH = Math.round(evHeadH() * k);
        const headGap = Math.round(S.headGap * k);
        /* 장수에 따라 내용 높이가 달라지므로 세로 가운데에 둔다 */
        const contentH = headH + headGap + listH;
        const top = Math.max(Math.round(EV.padTop * k), Math.round((H - contentH) / 2));

        evfHead(ctx, W, top, th, S, k);
        const listY = top + headH + headGap;
        if (S.listBg || S.listBgKey) {
          ctx.fillStyle = S.listBg || evColor(th, S.listBgKey);
          ctx.fillRect(EVF.bodyX, listY, EVF.bodyW, listH);
        }
        let cy = listY + listPadK;
        ms.forEach((m, i) => {
          evfDrawCard(ctx, evs[i], EVF.bodyX + Math.round(S.cardX * k), cy, th, S, m, k);
          cy += m.cardH;
          if (i < ms.length - 1) {
            if (S.divKey) {
              ctx.fillStyle = evColor(th, S.divKey, "#ddd");
              ctx.fillRect(EVF.bodyX + Math.round(S.cardX * k), cy + gapK / 2,
                Math.round(S.cardW * k), Math.max(1, Math.round(S.divW * k)));
            }
            cy += gapK;
          }
        });
      }
      function evfHead(ctx, W, y, th, S, k) {
        evDrawSub(ctx, W, y, th, S, k);
        evDrawTitle(ctx, W, y + Math.round(S.subH * k) + Math.round(S.subGap * k), th, S, k);
      }
      function evfDrawCard(ctx, ev, x, top, th, S, m, k) {
        const C = EV.card;
        const R = (v) => Math.round(v * k);
        const cw = R(S.cardW), ch = m.cardH, imgD = R(C.imgD);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(x, top, cw, ch);
        const imgX = S.imgRight ? x + cw - R(S.padR) - imgD : x + R(S.padL);
        const imgY = top + (ch - imgD) / 2;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(imgX, imgY, imgD, imgD);
        evDrawGift(ctx, ev, imgX, imgY, imgD);

        const tx = S.imgRight
          ? x + R(S.padL)
          : x + R(S.padL) + imgD + R(S.imgGap || 24);
        let ty = top + (ch - m.txtH) / 2 + R(C.txtPadTop);
        const nameH = R(C.nameH), lineH = R(C.lineH), rowGap = R(C.rowGap);
        ctx.textAlign = "left"; ctx.textBaseline = "middle";
        ctx.fillStyle = EV.nameInk;
        ctx.font = `700 ${R(C.nameSize)}px Pretendard`;
        const t1 = m.tk.title;
        trk(ctx, t1, tx, ty + nameH / 2, C.track, "left");
        const w1 = trkWidth(ctx, t1, C.track);
        trk(ctx, `(${m.tk.num}명)`, tx + w1 + R(C.nameGap), ty + nameH / 2, C.track, "left");
        ty += nameH + R(C.txtGap);
        ctx.fillStyle = EV.bodyInk;
        /* 줄바꿈 지점은 상세와 같게 유지하고 x 좌표만 확대한다 —
           피드에서만 다른 데서 접히면 두 산출물이 달라 보인다 */
        m.lines.forEach((ln, i) => {
          const ly = ty + i * (lineH + rowGap) + lineH / 2;
          ln.forEach((tok) => {
            ctx.font = `${tok.w} ${R(C.bodySize)}px Pretendard`;
            trk(ctx, tok.t, tx + Math.round(tok.x * k), ly, C.track, "left");
          });
        });
      }
