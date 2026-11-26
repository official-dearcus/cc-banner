/* CC 배너 제너레이터 — 34-color-chip
   가격 카드 사진 아래쪽에 겹쳐 놓는 컬러 칩 (요청 2026-11-26) — 템플릿 01·02·03, 상세·피드 공통

   색 이름 → 칩 모양은 시트의 ColorChip 탭(색 사전)에서 온다: label · hex · chipUrl · groupKey.
   카드의 색 이름은 두 길로 얻는다.
     ① ProductMaster.colorLine 이 있는 제품  → ColorMaster 에서 "지금 켜 둔 색"
        (편집기에서 색을 끄면 칩도 빠진다)
     ② 없는 제품                            → optionInfo 의 "Color: 화이트, 베이지" 줄
        (편집기에서 옵션 문구를 고치면 칩도 따라간다)
   · 사전에 없는 이름은 그 칩만 건너뛴다. 우측 상태·경고에 "컬러 칩 없음" 으로 알린다.
     단, 그 제품군의 색 이름이 사전에 하나도 없으면 "칩을 안 쓰는 제품군"으로 보고 조용히 넘어간다.
   · ColorChip 탭이 없거나 비어 있으면 칩은 하나도 안 그린다 — 전과 똑같이 나온다.

   배치 (상세 기준 px · 피드는 ×1.3)
     지름 24 · 칩 사이 8 · 줄 사이 6 · 사진 칸 아래에서 12 · 테두리 1(검정 14%)
     한 줄 최대 6개. 넘으면 줄을 나누되 고르게 나눈다: 7 → 4+3 · 8 → 4+4 · 12 → 6+6 · 13 → 5+4+4
     각 줄은 사진 칸 가로 가운데. 줄이 늘면 위로 쌓인다(맨 아랫줄 위치는 고정). */

      const CHIP = { d: 24, gap: 8, rowGap: 6, bottom: 12, stroke: 1, perRow: 6 };
      let COLOR_CHIPS = []; // [{ label, hex, chipUrl, img, groupKey }]

      const chipNorm = (s) => String(s || "").replace(/\s+/g, "").toLowerCase();
      const chipHex = (s) => {
        const v = String(s || "").trim();
        if (/^#?[0-9a-f]{3}([0-9a-f]{3})?$/i.test(v)) return v[0] === "#" ? v : "#" + v;
        return "";
      };
      /* 07-sheet-sync 가 시트를 읽을 때마다 부른다 */
      function setColorChips(rows) {
        COLOR_CHIPS = (rows || []).map((r) => ({
          label: r.label,
          hex: chipHex(r.hex),
          chipUrl: r.chipUrl || "",
          groupKey: r.groupKey || "",
          img: null,
        }));
        /* 무늬 칩 그림은 뒤에서 받고, 받는 대로 다시 그린다. 실패하면 hex 로 남는다. */
        COLOR_CHIPS.filter((c) => c.chipUrl).forEach(async (c) => {
          try {
            const r = await loadImgSmart(c.chipUrl);
            c.img = r.img;
            if (typeof draw === "function") draw();
          } catch (e) {}
        });
      }
      function chipLookup(name) {
        const n = chipNorm(name);
        if (!n) return null;
        const hit = (g) =>
          COLOR_CHIPS.find(
            (c) => chipNorm(c.label) === n && chipNorm(c.groupKey) === chipNorm(g),
          );
        return hit(state.group) || hit("") || null; // 제품군 전용 값이 먼저
      }
      function cardChipNames(r) {
        const line = (r.colorLine || "").trim();
        if (line) return pickedColors(line).map((c) => c.label);
        const attrs = typeof cardAttrsRaw === "function" ? cardAttrsRaw(r) : [];
        const a = attrs.find((x) =>
          /^(colou?r|컬러|색상)$/i.test(String(x.label || "").trim()),
        );
        if (!a) return [];
        return String(a.value || "")
          .split(/\s*[,·\/]\s*/)
          .map((s) => s.trim())
          .filter(Boolean);
      }
      function cardChips(r) {
        if (!COLOR_CHIPS.length) return [];
        return cardChipNames(r)
          .map(chipLookup)
          .filter((c) => c && (c.hex || c.img));
      }
      /* 지금 제품군의 카드에 적힌 색 이름 중 사전에 없는 것 (18-validate 가 경고로 쓴다) */
      function chipMissing() {
        if (!COLOR_CHIPS.length) return [];
        const names = [];
        (state.rows || []).forEach((r) =>
          cardChipNames(r).forEach((n) => {
            if (!names.some((x) => chipNorm(x) === chipNorm(n))) names.push(n);
          }),
        );
        const ok = (n) => {
          const c = chipLookup(n);
          return !!(c && (c.hex || c.chipUrl));
        };
        const miss = names.filter((n) => !ok(n));
        return miss.length === names.length ? [] : miss; // 하나도 없으면 칩을 안 쓰는 제품군
      }
      /* n 개를 한 줄 최대 perRow 로, 줄 수를 최소로 하되 고르게 (윗줄이 더 많다) */
      function chipRows(n, perRow) {
        const rows = Math.ceil(n / perRow);
        const out = [];
        let left = n;
        for (let i = 0; i < rows; i++) {
          const c = Math.ceil(left / (rows - i));
          out.push(c);
          left -= c;
        }
        return out;
      }
      /* (bx,by,bw,bh) = 카드의 사진 칸. k = 배율(상세 1 · 피드 1.3) */
      function drawCardChips(ctx, r, bx, by, bw, bh, k) {
        const list = cardChips(r);
        if (!list.length) return;
        k = k || 1;
        const d = CHIP.d * k,
          gap = CHIP.gap * k,
          rg = CHIP.rowGap * k;
        /* 사진 칸이 좁으면 한 줄 개수를 더 줄인다(좌우 12 여백) */
        const fit = Math.max(1, Math.floor((bw - 24 * k + gap) / (d + gap)));
        const rows = chipRows(list.length, Math.min(CHIP.perRow, fit));
        let cy =
          by + bh - CHIP.bottom * k - d / 2 - (rows.length - 1) * (d + rg);
        let i = 0;
        ctx.save();
        rows.forEach((cnt) => {
          const total = cnt * d + (cnt - 1) * gap;
          let x = bx + (bw - total) / 2;
          for (let j = 0; j < cnt; j++, i++) {
            const c = list[i];
            const cx = x + d / 2;
            ctx.beginPath();
            ctx.arc(cx, cy, d / 2, 0, Math.PI * 2);
            if (c.img) {
              ctx.save();
              ctx.clip();
              ctx.drawImage(c.img, x, cy - d / 2, d, d);
              ctx.restore();
            } else {
              ctx.fillStyle = c.hex;
              ctx.fill();
            }
            /* 흰색·밝은 색이 사진 배경에 묻히지 않게 얇은 테두리 */
            ctx.beginPath();
            ctx.arc(cx, cy, d / 2 - (CHIP.stroke * k) / 2, 0, Math.PI * 2);
            ctx.lineWidth = CHIP.stroke * k;
            ctx.strokeStyle = "rgba(0,0,0,0.14)";
            ctx.stroke();
            x += d + gap;
          }
          cy += d + rg;
        });
        ctx.restore();
      }
