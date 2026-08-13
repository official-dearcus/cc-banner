/* CC 배너 제너레이터 — 25-render-scent
   향(scent) 섹션 — .fig airbium_scent / airbium_scent_feed 실측

   구조는 두 산출물이 같고 치수만 다르다.
     bg          단색 배경 + 물결 무늬(SVG 패스 하나, 테마색으로 칠한다)
     deco        주변 글자 — 브랜드/부제/좌우 세로글씨/삼각형/코드/스탬프/푸터
     img         가운데 사진 한 장 (2×2 그리드가 통째로 사진이다)

   시트에 scentUrl 이 없으면 섹션 자체가 안 붙는다(높이 0).
   → 기존 제품군은 아무 것도 안 바뀐다. */

      /* ── SVG 장식 에셋 ──
         .fig 의 Vector 는 압축된 벡터 패스라 코드로 못 꺼낸다 → SVG 로 받았다.
           airbium-scent-pattern.svg  물결 무늬  (2026-08-13)
           dearcus-stamp.svg          도장+곡선글씨 (2026-08-13)
         둘 다 단색이라 fill 만 바꿔 data URL → Image 로 만든다.
         파일은 한 번만 읽고, 색마다 한 번만 그림을 만들어 캐시한다.
         viewBox 는 파일 것을 그대로 쓰되, 무늬는 패스 bbox 로 덮어쓴다
         (파일 viewBox 가 도형 범위와 달라서 그대로 쓰면 어긋난다). */
      const SCENT_ASSET = {
        pattern: {
          url: "assets/airbium-scent-pattern.svg",
          /* 패스 bbox — .fig 피드 Vector(1155×2218)와 일치, 상세와도 비율 동일 */
          viewBox: "-39.5 -1.5 1157 2221",
        },
        stamp: { url: "assets/dearcus-stamp.svg" },
      };
      const SCENT_SVG = {}; // key → {raw, vb} · raw 는 <path> 들만
      const SCENT_TINT = {}; // key|ink → {img}
      function scentAssetLoad(key) {
        if (SCENT_SVG[key] !== undefined) return;
        SCENT_SVG[key] = null;
        fetch(SCENT_ASSET[key].url)
          .then((r) => r.text())
          .then((s) => {
            const vbm = s.match(/viewBox="([^"]+)"/);
            const body = s.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>[\s\S]*$/, "");
            SCENT_SVG[key] = {
              raw: body,
              vb: SCENT_ASSET[key].viewBox || (vbm && vbm[1]) || "0 0 100 100",
            };
            if (typeof draw === "function") draw();
          })
          .catch(() => {});
      }
      function scentAsset(key, ink) {
        scentAssetLoad(key);
        const src = SCENT_SVG[key];
        if (!src) return null;
        const ck = key + "|" + String(ink).toLowerCase();
        if (SCENT_TINT[ck]) return SCENT_TINT[ck].img;
        const slot = { img: null };
        SCENT_TINT[ck] = slot;
        /* 단색이므로 fill 을 통째로 갈아끼운다 */
        const body = src.raw.replace(/fill="#[0-9a-fA-F]{3,8}"/g, `fill="${ink}"`);
        const svg =
          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${src.vb}">${body}</svg>`;
        const im = new Image();
        im.onload = () => {
          slot.img = im;
          if (typeof draw === "function") draw();
        };
        im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
        return null;
      }

      /* ── 색 ──
         .fig 에는 blue·green 두 벌만 있고 규칙이 서로 다르다.
           blue   글자 #7d9eca = colorBg   (중간톤이라 흰 배경에서 읽힌다)
           green  글자 #65812d = accent    (colorBg #b9ca7d 는 너무 흐리다)
         → 흰 배경 대비가 충분하면 colorBg, 아니면 accent 를 쓴다.
           blue·green 은 이 규칙으로도 .fig 와 같은 값이 나온다.
           나머지 4색(pink·yellow·orange·mint)은 .fig 근거가 없는 파생값이다.
         배경/무늬는 colorBg 를 흰색에 섞어 만든다(.fig 실측 비율 3% / 12%). */
      function scentMix(hex, ratio) {
        const h = String(hex || "#000000").replace("#", "");
        const n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h, 16);
        const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
        const m = (v) => Math.round(255 - (255 - v) * ratio);
        return (
          "#" + [m(r), m(g), m(b)].map((v) => v.toString(16).padStart(2, "0")).join("")
        );
      }
      function scentLum(hex) {
        const h = String(hex || "#000000").replace("#", "");
        const n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h, 16);
        const f = (v) => {
          v /= 255;
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        };
        return 0.2126 * f((n >> 16) & 255) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255);
      }
      /* 흰 배경 대비가 2.2 이상이면 colorBg 를 쓴다 (blue 2.4 · green 1.8) */
      const SCENT_MIN_CONTRAST = 2.2;
      /* .fig 에 실제로 그려진 두 벌은 값을 그대로 쓴다.
         섞기 비율(3%/12%)로는 근사만 되고 손으로 고른 색과 1~2 단위 어긋난다. */
      const SCENT_FIG = {
        blue: { ink: "#7d9eca", bg: "#ffffff", pat: "#f0f6ff", stamp: "#b3c7da" },
        green: { ink: "#65812d", bg: "#fefff6", pat: "#f8faea", stamp: "#b9ca7d" },
      };
      function scentTheme(th) {
        const fig = SCENT_FIG[state.theme];
        if (fig) return fig;
        const tbl = typeof THEMES_NUVOLA !== "undefined" ? THEMES_NUVOLA : null;
        const p = (tbl && (tbl[state.theme] || tbl.green)) || th || {};
        const cb = p.colorBg || p.accent || "#7d9eca";
        const contrast = 1.05 / (scentLum(cb) + 0.05);
        return {
          ink: contrast >= SCENT_MIN_CONTRAST ? cb : p.accent || cb,
          bg: scentMix(cb, 0.03),
          pat: scentMix(cb, 0.12),
          /* 도장은 글자보다 흐린 톤 — green 은 .fig 이 colorBg 를 그대로 썼다 */
          stamp: cb,
        };
      }

      /* ── 치수 (.fig 실측) ──
         deco 안의 좌표는 deco 원점 기준이다.
         rot:90 은 시계방향 90° — 글자가 아래로 흐르고 상자는 왼쪽으로 뻗는다. */
      const SCENT = {
        /* .fig 2026-08-13 개정 — 상세만 세로가 줄었다 (1298 → 1076).
           사진 740×787 = 0.940 으로 피드(940×1000)와 비율이 같아졌다
           → 한 장으로 양쪽 다 안 잘린다. 피드는 그대로다. */
        detail: {
          W: 860, H: 1076,
          pat: { x: -15, y: 19, w: 889, h: 1707 },
          deco: { x: 20, y: 49 },
          img: { x: 60, y: 159, w: 740, h: 787 },
          brand: { x: 52, y: 0, h: 64, size: 48 },
          sub: { x: 468, y: 24, h: 32, size: 24 },
          left: { x: 32, y: 110, h: 32, size: 24, rot: 90 },
          right: { x: 819, y: 110, h: 32, size: 24, rot: 90 },
          poly: { x: 796, y: 608, w: 10, h: 296 },
          code: { x: 822, y: 849, h: 37, size: 28, rot: 90 },
          stamp: { x: 673.86, y: 927.48, w: 122.43, h: 85.52 },
          foot: { x: 39, y: 920, h: 74, size: 28, lsPct: -2, lines: 2 },
          tag: { x: 431, y: 958, h: 32, size: 24, lsPct: -2 },
        },
        feed: {
          W: 1080, H: 1350,
          pat: { x: -38, y: 24, w: 1155, h: 2218 },
          deco: { x: 20, y: 64 },
          img: { x: 70, y: 191, w: 940, h: 1000 },
          brand: { x: 64, y: 0, h: 91, size: 68 },
          sub: { x: 626, y: 44, h: 37, size: 28 },
          left: { x: 43, y: 127, h: 43, size: 32, rot: 90 },
          right: { x: 1040, y: 127, h: 43, size: 32, rot: 90 },
          poly: { x: 1012, y: 766, w: 16, h: 370 },
          code: { x: 1047, y: 1069, h: 43, size: 32, rot: 90 },
          stamp: { x: 839.95, y: 1151.03, w: 157.52, h: 113.97 },
          foot: { x: 49, y: 1157, h: 86, size: 32, lsPct: -2, lines: 2 },
          tag: { x: 535, y: 1200, h: 43, size: 32, lsPct: -2 },
        },
      };
      const SCENT_FONT = "'Playfair Display'";
      /* 글자 기본값 (.fig). 시트 g.scent 로 덮어쓸 수 있다. */
      const SCENT_TXT = {
        brand: "Airbium.",
        sub: "Natural oil perfume blending",
        left: "Phytonecide & Lemon",
        right: "Odor Eliminator",
        code: "00A",
        foot: "Airbium\nOdor Eliminator",
        tag: "The little Specialness of my life",
      };
      function scentTxt(k) {
        const g = (typeof G === "function" && G()[state.group]) || {};
        const o = g.scent || {};
        return o[k] != null && String(o[k]).trim() ? String(o[k]) : SCENT_TXT[k];
      }

      /* ── 사진 ── */
      const SCENT_IMG = {};
      function scentUrl() {
        const g = (typeof G === "function" && G()[state.group]) || {};
        return (g.scentByTpl && g.scentByTpl[state.tpl]) || g.scentUrl || "";
      }
      function scentImg() {
        const u = scentUrl();
        if (!u) return null;
        if (SCENT_IMG[u] !== undefined) return SCENT_IMG[u];
        SCENT_IMG[u] = null;
        if (typeof loadImgSmart === "function")
          loadImgSmart(u)
            .then((r) => { SCENT_IMG[u] = r.img; draw(); })
            .catch(() => {});
        return null;
      }
      function scentOn() { return !!scentUrl(); }
      function scentH() { return scentOn() ? SCENT.detail.H : 0; }

      /* ── 그리기 ── */
      function scentText(ctx, C, key, ink, dx, dy) {
        const t = C[key];
        if (!t) return;
        const s = scentTxt(key);
        if (!s) return;
        ctx.fillStyle = ink;
        ctx.font = `400 ${t.size}px ${SCENT_FONT}`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        /* ⚠ .fig 의 letterSpacing 은 PERCENT 다 (units:"PERCENT").
           -2 를 픽셀로 쓰면 글자가 크게 좁아진다 — 상세 태그가 64px 좁아져
           도장과의 간격이 벌어졌다(2026-08-13 신고).
           px = 글자크기 × 퍼센트/100   → 24px 에서 -0.48, 32px 에서 -0.64
           검산: 자연폭 330.4 × 32/24 = 440.5 = 피드 실측과 일치. */
        const ls = t.lsPct != null ? (t.size * t.lsPct) / 100 : t.ls || 0;
        if (t.rot === 90) {
          /* 시계방향 90°: 로컬(0,0) → 전역(x,y), 로컬 +x 가 아래로 간다.
             글자를 로컬 (0, h/2) 에 놓으면 32px 띠의 한가운데에 온다. */
          ctx.save();
          ctx.translate(dx + t.x, dy + t.y);
          ctx.rotate(Math.PI / 2);
          trk(ctx, s, 0, t.h / 2, ls, "left");
          ctx.restore();
          return;
        }
        const lines = String(s).split("\n");
        const lh = t.h / (t.lines || lines.length || 1);
        lines.forEach((l, i) =>
          trk(ctx, l, dx + t.x, dy + t.y + lh * i + lh / 2, ls, "left"),
        );
      }
      function scentDraw(ctx, C, oy, th) {
        const K = scentTheme(th);
        const W = C.W, H = C.H;
        ctx.fillStyle = K.bg;
        ctx.fillRect(0, oy, W, H);
        /* 무늬는 섹션 밖으로 나가면 안 된다 */
        const pat = scentAsset("pattern", K.pat);
        if (pat)
          clipRect(ctx, 0, oy, W, H, () =>
            ctx.drawImage(pat, C.pat.x, oy + C.pat.y, C.pat.w, C.pat.h));

        const dx = C.deco.x, dy = oy + C.deco.y;
        ["brand", "sub", "left", "right", "code", "foot", "tag"].forEach((k) =>
          scentText(ctx, C, k, K.ink, dx, dy));
        /* 삼각형 — .fig REGULAR_POLYGON. 꼭짓점이 아래다.
           ⚠ 위로 그렸더니 아래쪽이 두꺼워져 "00A" 글자와 겹쳤다(2026-08-13 신고).
             .fig 은 삼각형(y 608~904)과 00A(y 849~901)가 세로로 겹치는데,
             꼭짓점이 아래라 그 구간에서 폭이 1.9px→0.1px 로 실오라기가 된다.
             꼭짓점이 위면 같은 구간이 8.1~9.9px 라 글자를 덮는다.
           상세·피드 둘 다 같은 계산이다. */
        const p = C.poly;
        ctx.fillStyle = K.ink;
        ctx.beginPath();
        ctx.moveTo(dx + p.x + p.w / 2, dy + p.y + p.h); // 꼭짓점 (아래)
        ctx.lineTo(dx + p.x + p.w, dy + p.y);
        ctx.lineTo(dx + p.x, dy + p.y);
        ctx.closePath();
        ctx.fill();
        /* 도장 (Dear.customer 곡선 글씨 포함) */
        const st = C.stamp;
        const stImg = scentAsset("stamp", K.stamp);
        if (stImg) ctx.drawImage(stImg, dx + st.x, dy + st.y, st.w, st.h);

        const im = scentImg();
        const g = C.img;
        if (im)
          clipRect(ctx, g.x, oy + g.y, g.w, g.h, () =>
            cover(ctx, im, g.x, oy + g.y, g.w, g.h));
        ctx.textBaseline = "alphabetic";
      }
      /* 상세 — 옵션 섹션 바로 아래 */
      function scentSection(ctx, W, oy, th) {
        if (!scentOn()) return;
        scentDraw(ctx, SCENT.detail, oy, th);
      }
      /* 피드 — 옵션 슬라이드 다음 장 */
      function scentFeedSlide(ctx, th) {
        scentDraw(ctx, SCENT.feed, 0, th);
      }
      function scentFeedCount() { return scentOn() ? 1 : 0; }
