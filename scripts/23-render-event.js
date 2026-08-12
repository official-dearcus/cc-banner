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
          nameSize: 40, nameH: 32, nameGap: 8,
          bodySize: 32, lineH: 32, rowGap: 16,
          txtGap: 24, // 제목 ↔ 본문
          txtPadTop: 48, txtPadBot: 48,
          particleGap: 8, // 조사 → "드립니다." 사이
          track: -2,
        },
      };
      /* 템플릿별 껍데기. 색은 테마 키로 받는다 (.fig green 실측값과 1:1) */
      const EV_TPL = {
        /* .fig event_comp01 860×1255 · 배경 #b9ca7d(colorBg) */
        "01": { bgKey: "colorBg", bodyX: 60, bodyW: 740, headGap: 60,
                sub: "pill", subH: 63, subGap: 16,
                title: "GIFT EVENT", titleSize: 80, titleLH: 56,
                titleFont: "Pretendard", titleWeight: 600, titleInk: "#ffffff",
                listBgKey: null, listPad: 0,
                cardX: 0, cardW: 740, cardPad: 20, imgRight: true, gap: 20 },
        /* .fig event_comp02 860×1148 · 배경 #f0f3dd(colorBgLight) */
        "02": { bgKey: "colorBgLight", bodyX: 50, bodyW: 760, headGap: 56,
                sub: "text", subFont: "'High Summit'", subSize: 48, subLH: 40,
                subInkKey: "colorBg", subGap: 16,
                title: "OPEN EVENT", titleSize: 56, titleLH: 56,
                titleFont: "GmarketSans, Pretendard", titleWeight: 700,
                titleInkKey: "accent",
                listBg: "#ffffff", listPad: 0,
                cardX: 36, cardW: 688, cardPad: 0, imgRight: false, gap: 20,
                /* .fig: 카드 사이 1px #b9ca7d. 카드 끝에서 20 아래, 다음 카드까지 또 20 */
                divKey: "colorBg", divW: 1, divGap: 20 },
        /* .fig event_comp03 860×1245 · 배경 #65812d(accent) */
        "03": { bgKey: "accent", bodyX: 50, bodyW: 760, headGap: 56,
                sub: "afacad", subH: 53, subSize: 44, subTail: "& Dear.cus",
                subTailSize: 40, subTailGap: 16, subGap: 20,
                title: "OPEN EVENT", titleSize: 92, titleLH: 72,
                titleFont: "'Afacad Flux', Pretendard", titleWeight: 600,
                titleInk: "#ffffff",
                listBgKey: "colorBgLight", listPad: 22,
                cardX: 22, cardW: 716, cardPad: 10, imgRight: true, gap: 20 },
      };
      function evCfg() { return EV_TPL[state.tpl] || EV_TPL["01"]; }
      /* 테마 색 꺼내기.
         ⚠ 구형(뱀부) 테마에는 colorBg / colorBgLight 키가 없다
           (accent · circleBg · badgeBorder · sectionBg 네 개뿐).
         이벤트 배너는 두 패밀리 모두에 붙으므로 대체 키를 둔다.
           colorBg      → badgeBorder   (연한 테마색 띠)
           colorBgLight → sectionBg     (뱀부 green 은 #f0f3dd 로 값까지 같다) */
      const EV_FALLBACK = {
        colorBg: ["colorBg", "badgeBorder", "accent"],
        colorBgLight: ["colorBgLight", "sectionBg", "colorBg"],
        accent: ["accent"],
      };
      function evColor(th, key, dflt) {
        for (const k of EV_FALLBACK[key] || [key]) if (th && th[k]) return th[k];
        return dflt || "#ffffff";
      }

      /* ── 문장 조립 ──
         토큰 하나 = 한 낱말. glue 는 앞 낱말과의 간격(px).
         br=false 인 토큰(조사)은 앞 낱말과 절대 안 떨어진다. */
      function evTokens(ev) {
        const t = evType(ev.typeKey);
        const g = evGift(ev.giftKey);
        const body = (t && (t.bodyLabel || t.titleLabel)) || "";
        const num = String(ev.num ?? "");
        const gift = (g && g.label) || "";
        const par = evGiftParticle(g);
        const sp = -1; // 공백 폭은 그릴 때 실제로 잰다
        const words = (s, w) =>
          String(s).split(/\s+/).filter(Boolean).map((x, i) => ({
            t: x, w, glue: i === 0 ? 0 : sp, br: i > 0,
          }));
        /* 1줄 — "구매 선착순10명에게" (.fig 는 낱말 사이에 공백이 없다) */
        const p1 = words(`${body}${num}명에게`, 400);
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
        const cardH = Math.max(C.imgD, txtH) + S.cardPad * 2;
        return { tk, lines, bodyH, txtH, cardH };
      }
      /* 헤더(셀러줄 + 제목) 높이 */
      function evHeadH() {
        const S = evCfg();
        const subH = S.sub === "text" ? S.subLH : S.subH;
        return subH + S.subGap + S.titleLH;
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
      function evDrawCard(ctx, ev, x, top, th, S, m) {
        const C = EV.card;
        const cw = S.cardW, ch = m.cardH;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(x, top, cw, ch);
        /* 이미지와 글은 카드 안에서 각자 세로 가운데 (.fig) */
        const imgX = S.imgRight ? x + cw - S.cardPad - C.imgD : x + S.cardPad;
        const imgY = top + (ch - C.imgD) / 2;
        ctx.fillStyle = "#f2f2f2";
        ctx.fillRect(imgX, imgY, C.imgD, C.imgD);
        const g = evGift(ev.giftKey);
        const im = g && evGiftImg(g.url);
        if (im) clipRect(ctx, imgX, imgY, C.imgD, C.imgD, () =>
          cover(ctx, im, imgX, imgY, C.imgD, C.imgD));

        const tx = S.imgRight
          ? x + S.cardPad + (S.cardW === 740 ? 26 : 20)
          : x + S.cardPad + C.imgD + 24;
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
      function evDrawHead(ctx, W, y, th, S) {
        const cx = W / 2;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const seller = state.seller || "Seller_name";
        if (S.sub === "pill") {
          /* 01 — [셀러] × [로고], 흰 글자 (.fig 상세 히어로와 같은 줄) */
          ctx.fillStyle = "#ffffff";
          ctx.font = `400 44px 'High Summit'`;
          const sw = ctx.measureText(seller).width;
          ctx.font = `400 40px 'Playfair Display'`;
          const xw = ctx.measureText("×").width;
          const total = sw + 16 + xw + 16 + 116;
          let sx = cx - total / 2;
          const scy = y + S.subH / 2;
          ctx.textAlign = "left";
          ctx.font = `400 44px 'High Summit'`;
          ctx.fillText(seller, sx, scy); sx += sw + 16;
          ctx.font = `400 40px 'Playfair Display'`;
          ctx.fillText("×", sx, scy); sx += xw + 16;
          if (typeof drawLogo === "function") drawLogo(ctx, sx, scy, 116, 19);
          ctx.textAlign = "center";
        } else if (S.sub === "text") {
          ctx.fillStyle = evColor(th, S.subInkKey, th.accent);
          ctx.font = `400 ${S.subSize}px ${S.subFont}`;
          ctx.fillText(seller, cx, y + S.subLH / 2);
        } else {
          /* 03 — "Seller_name & Dear.cus" 한 줄, 전부 Afacad Flux 흰 글자 */
          ctx.fillStyle = "#ffffff";
          ctx.font = `400 ${S.subSize}px 'Afacad Flux', Pretendard`;
          const sw = trkWidth(ctx, seller, -2);
          ctx.font = `400 ${S.subTailSize}px 'Afacad Flux', Pretendard`;
          const tw = trkWidth(ctx, S.subTail, -2);
          let sx = cx - (sw + S.subTailGap + tw) / 2;
          const scy = y + S.subH / 2;
          ctx.font = `400 ${S.subSize}px 'Afacad Flux', Pretendard`;
          trk(ctx, seller, sx, scy, -2, "left"); sx += sw + S.subTailGap;
          ctx.font = `400 ${S.subTailSize}px 'Afacad Flux', Pretendard`;
          trk(ctx, S.subTail, sx, scy, -2, "left");
        }
        /* 제목 */
        const subH = S.sub === "text" ? S.subLH : S.subH;
        ctx.textAlign = "center";
        ctx.fillStyle = S.titleInk || evColor(th, S.titleInkKey, th.accent);
        ctx.font = `${S.titleWeight} ${S.titleSize}px ${S.titleFont}`;
        const title = evTitle();
        trk(ctx, title, cx, y + subH + S.subGap + S.titleLH / 2, -2, "center");
        ctx.textBaseline = "alphabetic";
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
        const cx = W / 2;
        const R = (v) => Math.round(v * k);
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        const seller = state.seller || "Seller_name";
        const subH = S.sub === "text" ? R(S.subLH) : R(S.subH);
        if (S.sub === "pill") {
          ctx.fillStyle = "#ffffff";
          ctx.font = `400 ${R(44)}px 'High Summit'`;
          const sw = ctx.measureText(seller).width;
          ctx.font = `400 ${R(40)}px 'Playfair Display'`;
          const xw = ctx.measureText("×").width;
          const total = sw + R(16) + xw + R(16) + R(116);
          let sx = cx - total / 2;
          const scy = y + subH / 2;
          ctx.textAlign = "left";
          ctx.font = `400 ${R(44)}px 'High Summit'`;
          ctx.fillText(seller, sx, scy); sx += sw + R(16);
          ctx.font = `400 ${R(40)}px 'Playfair Display'`;
          ctx.fillText("×", sx, scy); sx += xw + R(16);
          if (typeof drawLogo === "function") drawLogo(ctx, sx, scy, R(116), R(19));
          ctx.textAlign = "center";
        } else if (S.sub === "text") {
          ctx.fillStyle = evColor(th, S.subInkKey, th.accent);
          ctx.font = `400 ${R(S.subSize)}px ${S.subFont}`;
          ctx.fillText(seller, cx, y + subH / 2);
        } else {
          ctx.fillStyle = "#ffffff";
          ctx.font = `400 ${R(S.subSize)}px 'Afacad Flux', Pretendard`;
          const sw = trkWidth(ctx, seller, -2);
          ctx.font = `400 ${R(S.subTailSize)}px 'Afacad Flux', Pretendard`;
          const tw = trkWidth(ctx, S.subTail, -2);
          let sx = cx - (sw + R(S.subTailGap) + tw) / 2;
          const scy = y + subH / 2;
          ctx.font = `400 ${R(S.subSize)}px 'Afacad Flux', Pretendard`;
          trk(ctx, seller, sx, scy, -2, "left"); sx += sw + R(S.subTailGap);
          ctx.font = `400 ${R(S.subTailSize)}px 'Afacad Flux', Pretendard`;
          trk(ctx, S.subTail, sx, scy, -2, "left");
        }
        ctx.textAlign = "center";
        ctx.fillStyle = S.titleInk || evColor(th, S.titleInkKey, th.accent);
        ctx.font = `${S.titleWeight} ${R(S.titleSize)}px ${S.titleFont}`;
        trk(ctx, evTitle(), cx, y + subH + R(S.subGap) + R(S.titleLH) / 2, -2, "center");
        ctx.textBaseline = "alphabetic";
      }
      function evfDrawCard(ctx, ev, x, top, th, S, m, k) {
        const C = EV.card;
        const R = (v) => Math.round(v * k);
        const cw = R(S.cardW), ch = m.cardH, imgD = R(C.imgD), pad = R(S.cardPad);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(x, top, cw, ch);
        const imgX = S.imgRight ? x + cw - pad - imgD : x + pad;
        const imgY = top + (ch - imgD) / 2;
        ctx.fillStyle = "#f2f2f2";
        ctx.fillRect(imgX, imgY, imgD, imgD);
        const g = evGift(ev.giftKey);
        const im = g && evGiftImg(g.url);
        if (im) clipRect(ctx, imgX, imgY, imgD, imgD, () =>
          cover(ctx, im, imgX, imgY, imgD, imgD));

        const tx = S.imgRight
          ? x + pad + R(S.cardW === 740 ? 26 : 20)
          : x + pad + imgD + R(24);
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
