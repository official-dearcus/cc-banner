/* CC 배너 제너레이터 — 04-template-meta
   원본 index.html 에서 기능별로 분리. 로드 순서가 곧 실행 순서다. */
      /* ── 누볼라 패밀리 테마 ──────────────────────────────────────
         .fig 실측(green): accent #65812d · badgeBorder #d0dfb1
                          noticeBg #e1e5c6 · colorBg #b9ca7d
         나머지 5색은 뱀부 02 팔레트와 같은 톤으로 파생. */
      const THEMES_NUVOLA = {
        /* discInk = 할인율 글자색. green 만 .fig 실측값(#254631)이 있고
           나머지 5색은 피그마에 실물이 없어 accent 로 폴백한다. */
        green: { label: "그린", accent: "#65812d", badgeBorder: "#d0dfb1",
                 noticeBg: "#e1e5c6", colorBg: "#b9ca7d", colorBgLight: "#f0f3dd",
                 pillBg: "#91a36e", titleColor: "#448122", mainBg: "#f8fbe1",
                 discInk: "#254631",
                 /* 템플릿 02 의 "option info./Color info." 전용 색. .fig 실측(green).
                    나머지 5색은 피그마에 02 실물이 없어 제목 색으로 폴백한다. */
                 eyebrowInk: "#31522d", gridShadow: "#d0dfb1",
                 /* 템플릿 03 전용 — 카드 테두리·size_info 선·컬러섹션 배경 / OPTION 배지 */
                 t03Frame: "#f0f3dd", t03Badge: "#65812d" },
        blue: { label: "블루", accent: "#2d6181", badgeBorder: "#b3c7da", gridShadow: "#c5cddd",
                noticeBg: "#dbe6ee", colorBg: "#7d9eca", colorBgLight: "#eaf3f6",
                pillBg: "#6e89a3", titleColor: "#1d5a80", mainBg: "#f6f9fe",
                t03Frame: "#eeeeee", t03Badge: "#337fe3" },
        pink: { label: "핑크", accent: "#7c6055", badgeBorder: "#d4bab4", gridShadow: "#ddc5c6",
                noticeBg: "#f0dedb", colorBg: "#edcac4", colorBgLight: "#f6ecea",
                pillBg: "#d8b8ab", titleColor: "#6b4a3e", mainBg: "#fffdfd",
                t03Frame: "#f3e7e7", t03Badge: "#c57f80" },
        yellow: { label: "옐로우", accent: "#b08a1e", badgeBorder: "#e6d38f",
                  noticeBg: "#f0e5bd", colorBg: "#e3cf7e", colorBgLight: "#faf3dc",
                  pillBg: "#c9ae5a", titleColor: "#96731a", mainBg: "#fdfbef" },
        orange: { label: "오렌지", accent: "#c26a2b", badgeBorder: "#eec3a0",
                  noticeBg: "#f5ddc5", colorBg: "#e8a86f", colorBgLight: "#fbeadb",
                  pillBg: "#d99a68", titleColor: "#a85520", mainBg: "#fff9f3" },
        mint: { label: "민트", accent: "#2f8a76", badgeBorder: "#a6d8ca",
                noticeBg: "#cfe9e1", colorBg: "#8fcbbb", colorBgLight: "#e3f4ef",
                pillBg: "#6cb3a2", titleColor: "#1f7562", mainBg: "#f2fbf8" },
      };
      /* 템플릿 ID → { fam, key }.  "nuvolafamily_03" → {fam:"nuvola", key:"03"} */
      function tplParts(id) {
        const m = String(id || "").match(/^(.*)_(\d+)$/);
        if (!m) return { fam: "bamboo", key: "01" };
        return { fam: /^nuvola/i.test(m[1]) ? "nuvola" : "bamboo", key: m[2] };
      }
      function tplIdToFam(id) { return tplParts(id).fam; }
      /* 패밀리별 테마 표 */
      function themeTable(fam, key) {
        return fam === "nuvola" ? THEMES_NUVOLA : THEMES[key] || {};
      }
      /* 현재 제품군의 패밀리 */
      function curFam() {
        const g = G()[state.group];
        return (g && g.family) || "bamboo";
      }
      const TPL_META_NUVOLA = {
        "01": { label: "01 · 사진형", desc: "배경 사진 + 중앙 타이틀 + 날짜 바" },
        "02": { label: "02 · 사진형(큰 타이틀)", desc: "배경 사진 + 3줄 타이틀" },
        "03": { label: "03 · 그리드형", desc: "타이틀 + 제품 이미지 4컷" },
      };
      function tplMeta(fam, key) {
        const t = (fam === "nuvola" ? TPL_META_NUVOLA : TPL_META)[key];
        return t || { label: key, desc: "" };
      }
      const TPL_META = {
        "01": { label: "01 · 사진형", desc: "영문 세리프 타이틀 + 날짜 바" },
        "02": {
          label: "02 · 그라데이션형",
          desc: "한글 그라데이션 타이틀 + 카피 바",
        },
      };
