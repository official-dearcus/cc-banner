/* CC 배너 제너레이터 — 17-canvas-helpers
   원본 index.html 에서 기능별로 분리. 로드 순서가 곧 실행 순서다. */
      /* ---------- helpers ---------- */
      function trkWidth(ctx, text, tracking) {
        if (!text) return 0;
        const chars = [...text];
        return (
          chars.reduce((a, c) => a + ctx.measureText(c).width, 0) +
          tracking * (chars.length - 1)
        );
      }
      function trk(ctx, text, x, y, tracking, align) {
        if (!text) return;
        if (!tracking) {
          const sv = ctx.textAlign;
          ctx.textAlign = align;
          ctx.fillText(text, x, y);
          ctx.textAlign = sv;
          return;
        }
        const chars = [...text];
        const w = trkWidth(ctx, text, tracking);
        let cx = align === "center" ? x - w / 2 : align === "right" ? x - w : x;
        const sv = ctx.textAlign;
        ctx.textAlign = "left";
        for (const ch of chars) {
          ctx.fillText(ch, cx, y);
          cx += ctx.measureText(ch).width + tracking;
        }
        ctx.textAlign = sv;
      }
      /* 로고를 원하는 색으로 그린다.
         디어커스 로고는 단색 벡터라 fill 만 갈아끼우면 어느 색이든 나온다.
         PNG(assets/logo.png)를 source-in 으로 물들이던 방식은 확대하면 흐려졌다.
         SVG 를 data URL 로 만들어 Image 에 물리면 크기와 무관하게 선명하다.
         ink 를 안 주면 예전처럼 LOGO.img(PNG)를 그대로 쓴다. */
      const LOGO_SVG =
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 928.5714 154.2079"><g><g><path fill="__INK__" d="M533.8683,132.6975c-6.7571,9.1646-.4196,19.2428,8.6654,19.2428,6.4358,0,11.4935-5.0578,11.4935-11.2646,0-9.3762-11.2185-15.8245-20.1589-7.9782"/><path fill="__INK__" d="M533.8683,132.6975c-6.7571,9.1646-.4196,19.2428,8.6654,19.2428,6.4358,0,11.4935-5.0578,11.4935-11.2646,0-9.3762-11.2185-15.8245-20.1589-7.9782"/><path fill="__INK__" d="M150.9094,151.9397V2.2682h85.4113V15.6478c-7.4405-1.5884-17.2897-2.4946-26.9198-2.4946h-31.5718v54.6524h51.8702v10.8862h-51.8702v62.1352h31.3526c10.5053,0,19.9163-.6797,27.1389-2.2669v13.3796h-85.4113Z"/><path fill="__INK__" d="M315.241,36.4786l-21.9827,53.1162h42.8961l-20.9134-53.1162Zm11.0655-34.2109l61.7182,149.6715h-27.1389l-20.5723-51.5403h-50.9951l-11.3804,27.6829c-3.0636,7.8774-5.0342,15.3054-6.5653,23.8574h-18.1661L314.7069,2.2677h11.5995Z"/><path fill="__INK__" d="M446.7129,13.1526h-14.8821v63.4971h13.7879c25.8255,0,36.988-15.4199,36.988-33.1091,0-16.7818-9.6301-30.3879-35.8939-30.3879m12.0377-10.885c29.9833,0,51.6511,15.4211,51.6511,40.1401,0,23.357-19.6972,41.045-44.4285,41.726h-1.9693l56.028,67.8054h-31.2979l-56.9031-72.5682v72.5682h-26.9198V2.2677h53.8396Z"/><path fill="__INK__" d="M799.3982,2.2677h16.6335V96.1527c0,37.191-21.4487,58.0546-57.9985,58.0546-34.7985,0-60.6241-18.369-60.6241-58.9621V2.2677h26.9198V102.2761c0,25.172,15.5394,39.0048,37.425,39.0048,23.8563,0,40.0517-16.3274,40.0517-44.2207V30.161c0-9.9775-.8751-19.503-2.4075-27.8933"/><path fill="__INK__" d="M831.6168,110.8933c11.3803,19.7296,28.0139,31.522,45.5227,31.522,16.1967,0,26.9198-9.9787,26.9198-25.3998,0-17.2336-13.5688-24.9442-28.8892-28.7995-21.8857-5.2159-42.2401-19.503-42.2401-45.8091,0-25.3985,19.9163-42.4069,48.1493-42.4069,14.6631,0,28.014,4.5362,40.7078,13.8339v27.892c-10.0671-19.0486-23.8561-30.1601-39.6135-30.1601-14.2261,0-25.1683,9.0712-25.1683,23.357,0,16.7817,14.6631,24.7189,30.6394,28.5742,21.8857,5.4425,40.9267,18.3689,40.9267,44.4484,0,27.8932-20.3532,46.2622-52.3083,46.2622-17.0706,0-32.1718-5.2159-44.6464-14.968v-28.3464Z"/><path fill="__INK__" d="M27.8933,140.8277h12.9264c47.1684,0,64.4034-27.2136,64.4034-63.9501,0-37.4188-17.2349-63.7249-64.4034-63.7249h-12.9264v127.6751ZM52.1578,2.2677c49.4365,0,81.866,30.1614,81.866,74.8364s-32.4295,74.8351-81.866,74.8351H0V2.2677H52.1578Z"/><path fill="__INK__" d="M680.5237,111.3467v28.1198c-13.1531,9.5256-30.3879,14.7414-49.6645,14.7414-48.0759,0-80.0509-31.7485-80.0509-77.331C550.8082,31.7488,582.7832,.0002,630.4062,.0002c19.0486,0,36.2835,4.9893,49.8909,14.7402v28.1198c-13.1543-21.9976-30.3893-31.2941-49.6643-31.2941-31.2954,0-51.025,26.3048-51.025,64.1768,0,38.7781,21.318,66.2183,53.293,66.2183,19.2752,0,35.6039-9.0712,47.6229-30.6145"/></g></g></svg>`;
      const LOGO_INK = {}; // ink → {img, ready}
      function logoFor(ink) {
        const key = String(ink).toLowerCase();
        if (LOGO_INK[key]) return LOGO_INK[key];
        const slot = { img: null };
        LOGO_INK[key] = slot;
        try {
          const src = LOGO_SVG.split("__INK__").join(ink);
          const im = new Image();
          im.onload = () => {
            slot.img = im;
            if (typeof draw === "function") draw();
          };
          im.src =
            "data:image/svg+xml;charset=utf-8," + encodeURIComponent(src);
        } catch (e) {
          /* 그려질 때까지는 아래에서 글자로 대체된다 */
        }
        return slot;
      }
      function drawLogo(ctx, x, cy, w, h, ink) {
        /* 색 지정이 없거나 흰색이면 예전 경로(PNG) 그대로 */
        const plain = !ink || /^#?f{3}$|^#?f{6}$/i.test(String(ink).replace("#", ""));
        if (plain && LOGO.img) {
          ctx.drawImage(LOGO.img, x, cy - h / 2, w, h);
          return;
        }
        if (!plain) {
          const slot = logoFor(ink);
          if (slot.img) {
            ctx.drawImage(slot.img, x, cy - h / 2, w, h);
            return;
          }
          /* 아직 로딩 중 — PNG 라도 있으면 자리를 잡아 둔다 */
          if (LOGO.img) {
            ctx.drawImage(LOGO.img, x, cy - h / 2, w, h);
            return;
          }
        }
        ctx.save();
        ctx.fillStyle = ink || "#fff";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.font = `600 ${h}px 'Playfair Display'`;
        ctx.fillText("DEAR.CUS", x, cy);
        ctx.restore();
      }
      function cover(ctx, img, x, y, w, h) {
        const ir = img.width / img.height,
          r = w / h;
        let dw, dh, dx, dy;
        if (ir > r) {
          dh = h;
          dw = h * ir;
          dx = x - (dw - w) / 2;
          dy = y;
        } else {
          dw = w;
          dh = w / ir;
          dx = x;
          dy = y - (dh - h) / 2;
        }
        ctx.drawImage(img, dx, dy, dw, dh);
      }
      /* 제품 썸네일 전용 — 시트 이미지 표준 규격(960×1020) 비율로 항상 동일한 크기로 그린다.
         개별 이미지의 실제 비율을 쓰지 않으므로 제품마다 크기가 들쭉날쭉하지 않는다. */
      /* 지정 비율로 상자 안에 맞춰 그린다 (원본 비율 무시 → 항상 같은 크기) */
      function drawRatioFit(ctx, img, bx, by, bw, bh, ratio) {
        const r = bw / bh;
        let dw, dh;
        if (ratio > r) {
          dw = bw;
          dh = bw / ratio;
        } else {
          dh = bh;
          dw = bh * ratio;
        }
        ctx.drawImage(img, bx + (bw - dw) / 2, by + (bh - dh) / 2, dw, dh);
      }
      /* 상자를 꽉 채운다(cover). 표준 비율 기준이라 제품마다 크기가 흔들리지 않고,
         넘치는 부분만 잘린다. */
      function drawThumbCover(ctx, img, bx, by, bw, bh) {
        const r = bw / bh;
        let dw, dh;
        if (THUMB_RATIO > r) {
          dh = bh;
          dw = bh * THUMB_RATIO; // 좌우 잘림
        } else {
          dw = bw;
          dh = bw / THUMB_RATIO; // 위아래 잘림
        }
        ctx.save();
        ctx.beginPath();
        ctx.rect(bx, by, bw, bh);
        ctx.clip();
        ctx.drawImage(img, bx + (bw - dw) / 2, by + (bh - dh) / 2, dw, dh);
        ctx.restore();
      }
      const COLOR_RATIO = 240 / 440; // 색상 칩 이미지 규격
      const THUMB_RATIO = 960 / 1020;
      function drawThumbFit(ctx, img, bx, by, bw, bh) {
        const r = bw / bh;
        let dw, dh;
        if (THUMB_RATIO > r) {
          dw = bw;
          dh = bw / THUMB_RATIO;
        } else {
          dh = bh;
          dw = bh * THUMB_RATIO;
        }
        ctx.drawImage(img, bx + (bw - dw) / 2, by + (bh - dh) / 2, dw, dh);
      }
      function contain(ctx, img, x, y, w, h) {
        const ir = img.width / img.height,
          r = w / h;
        let dw, dh;
        if (ir > r) {
          dw = w;
          dh = w / ir;
        } else {
          dh = h;
          dw = h * ir;
        }
        ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
      }
      function ph(ctx, cx, cy) {
        ctx.fillStyle = "rgba(120,110,105,.35)";
        ctx.textAlign = "center";
        ctx.font = "400 18px Pretendard";
        ctx.fillText("썸네일", cx, cy);
      }
      function roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
      }
      function clipRect(ctx, x, y, w, h, fn) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.clip();
        fn();
        ctx.restore();
      }
