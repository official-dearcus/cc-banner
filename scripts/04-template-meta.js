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
                 /* 템플릿 01 컬러 섹션 글자 (제목·키즈/성인·칩 이름 전부).
                    이벤트 배너 01 제목도 같은 키를 쓴다 → 위아래가 항상 같은 색.
                    green 은 2026-08-12 요청으로 accent(#65812d) → #445523.
                    (흰색으로 갔다가 짙은 톤으로 되돌린 것 — 흰색은 blue·orange·mint) */
                 t01ColorInk: "#445523",
                 /* 템플릿 03 전용 — 카드 테두리·size_info 선·컬러섹션 배경 / OPTION 배지 */
                 t03Frame: "#f0f3dd", t03Badge: "#65812d",
                 /* 03 전용 잉크 — 히어로 텍스트 · 혜택가 · 컬러섹션 제목 */
                 t03Ink: "#448122", t03Date: "#91a36e",
                 t03OptInk: "#ffffff", t03ChipLabel: "#65812d" },
        blue: { label: "블루", accent: "#2d6181", badgeBorder: "#b3c7da", gridShadow: "#c5cddd",
                noticeBg: "#dbe6ee", colorBg: "#7d9eca", colorBgLight: "#eaf3f6",
                pillBg: "#6e89a3", titleColor: "#1d5a80", mainBg: "#f6f9fe",
                t01ColorInk: "#ffffff",
                t03Frame: "#eeeeee", t03Badge: "#337fe3",
                t03Ink: "#337fe3", t03Date: "#7d9eca",
                t03OptInk: "#ffffff", t03ChipLabel: "#888888" },
        pink: { label: "핑크", accent: "#7c6055", badgeBorder: "#d4bab4", gridShadow: "#ddc5c6",
                noticeBg: "#f0dedb", colorBg: "#edcac4", colorBgLight: "#f6ecea",
                pillBg: "#d8b8ab", titleColor: "#6b4a3e", mainBg: "#fffdfd",
                t01ColorInk: "#7c6055",
                t03Frame: "#f3e7e7", t03Badge: "#c57f80",
                /* pink 는 옵션 섹션 배경이 밝아 글자가 어둡다 (.fig) */
                t03Ink: "#633e3e", t03Date: "#c57f80",
                t03OptInk: "#633e3e", t03ChipLabel: "#c57f80" },
        yellow: { label: "옐로우", accent: "#b08a1e", badgeBorder: "#e6d38f",
                  noticeBg: "#f0e5bd", colorBg: "#e3cf7e", colorBgLight: "#faf3dc",
                  pillBg: "#c9ae5a", titleColor: "#96731a", mainBg: "#fdfbef",
                  t01ColorInk: "#b08a1e" },
        orange: { label: "오렌지", accent: "#c26a2b", badgeBorder: "#eec3a0",
                  noticeBg: "#f5ddc5", colorBg: "#e8a86f", colorBgLight: "#fbeadb",
                  pillBg: "#d99a68", titleColor: "#a85520", mainBg: "#fff9f3",
                  t01ColorInk: "#ffffff" },
        mint: { label: "민트", accent: "#2f8a76", badgeBorder: "#a6d8ca",
                noticeBg: "#cfe9e1", colorBg: "#8fcbbb", colorBgLight: "#e3f4ef",
                pillBg: "#6cb3a2", titleColor: "#1f7562", mainBg: "#f2fbf8",
                t01ColorInk: "#ffffff" },
      };
      /* 템플릿 ID → { fam, key }.  "nuvolafamily_03" → {fam:"nuvola", key:"03"}

         패밀리 = 어느 렌더러로 그릴지.
           bamboo : 구형 렌더러 (13·14·15·16) — 01·02 만 있다
           nuvola : 신형 렌더러 (12)          — 01·02·03 이 다 있다
         bamboo* 로 시작하는 제품군만 구형이고, 새로 등록하는 제품라인은
         전부 신형이다. 그래야 새 라인이 템플릿 3개를 그대로 받는다.
         (예전 규칙은 "nuvola* 만 신형, 나머지 구형" 이었는데, 그러면 새 라인이
          03 없는 구형으로 떨어졌다. bamboo500 은 아래 규칙에서도 그대로 구형이다.) */
      const LEGACY_FAM_RE = /^bamboo/i;
      function tplParts(id) {
        const m = String(id || "").match(/^(.*)_(\d+)$/);
        if (!m) return { fam: "bamboo", key: "01" };
        return { fam: LEGACY_FAM_RE.test(m[1]) ? "bamboo" : "nuvola", key: m[2] };
      }
      function tplIdToFam(id) { return tplParts(id).fam; }
      /* 패밀리별 테마 표.
         03 은 구형 렌더러에 없던 템플릿이라 THEMES 에 "03" 항목 자체가 없다.
         03 은 패밀리와 무관하게 신형(누볼라) 레이아웃으로 그리므로 테마도 같이 쓴다.
         → 뱀부 제품군도 03 을 고를 수 있고, 색·배지가 누볼라 03 과 똑같이 나온다. */
      function themeTable(fam, key) {
        if (key === "03") return THEMES_NUVOLA;
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
        /* 03 은 패밀리와 무관하게 신형 레이아웃이므로 설명도 신형 것을 쓴다 */
        if (key === "03") return TPL_META_NUVOLA["03"];
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
