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
      function drawLogo(ctx, x, cy, w, h) {
        if (LOGO.img) {
          ctx.drawImage(LOGO.img, x, cy - h / 2, w, h);
          return;
        }
        ctx.save();
        ctx.fillStyle = "#fff";
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
