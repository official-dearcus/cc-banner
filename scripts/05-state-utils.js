/* CC 배너 제너레이터 — 05-state-utils
   원본 index.html 에서 기능별로 분리. 로드 순서가 곧 실행 순서다. */
      const state = {
        group: "bamboo500",
        tpl: "01",
        theme: "pink",
        hero: null,
        heroSrc: "",
        heroUrl: "",
        heroUpload: false,
        heroTainted: false,
        seller: "",
        t1: "",
        t2: "",
        d1: "",
        d2: "",
        copy: "",
        copyBold: "",
        series: "",
        rows: [],
        colorPick: {}, // { 줄키: [선택된 colorKey, ...] }
        notice: "", // 옵션 하단 안내 문구 (비우면 미표시)
        sizeInfoOn: true, // 사이즈 안내 이미지 표시 여부
      };

      /* ---------- 유틸 ---------- */
      const $ = (s) => document.querySelector(s);
      const won = (n) =>
        (isFinite(n) ? Math.round(n) : 0).toLocaleString("ko-KR") + "원";
      const parseNum = (v) => Number(String(v).replace(/[^\d]/g, "")) || 0;
      const DOW_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const LATIN = /^[\x20-\x7E]+$/;
      function fmtD01(iso) {
        if (!iso) return "";
        const d = new Date(iso + "T00:00:00");
        if (isNaN(d)) return "";
        return `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} (${DOW_EN[d.getDay()]})`;
      }
      function range01(a, b) {
        return fmtD01(a) && fmtD01(b)
          ? `${fmtD01(a)} - ${fmtD01(b)}`
          : "공구 기간 미입력";
      }
      /* 03 히어로 전용 — .fig "07.06 - 07.09" (요일 없음) */
      function range03(a, b) {
        const f = (iso) => {
          if (!iso) return "";
          const d = new Date(iso + "T00:00:00");
          if (isNaN(d)) return "";
          return `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
        };
        return f(a) && f(b) ? `${f(a)} - ${f(b)}` : "공구 기간 미입력";
      }
      function range02(a, b) {
        if (!a || !b) return "공구 기간 미입력";
        const s = new Date(a + "T00:00:00"),
          e = new Date(b + "T00:00:00");
        if (isNaN(s) || isNaN(e)) return "공구 기간 미입력";
        return `${s.getMonth() + 1}월 ${s.getDate()}일부터 ${e.getMonth() + 1}월 ${e.getDate()}일까지`;
      }
      const disc = (n, s) =>
        !n || n <= 0 ? null : s > n ? 0 : Math.round(((n - s) / n) * 100);
      /* 정상가와 혜택가가 같으면(할인 0%) 가격을 한 줄만 보여주고 % 배지는 숨긴다.
         추가구성 단품처럼 할인이 없는 항목이 "0%" 와 취소선 없는 같은 값 두 줄로
         나와 어색했다 (요청 2026-09-04). */
      /* 하단 카피에서 일반 문구와 볼드 문구 사이 한 칸.
         시트 값에 이미 공백이 있으면 중복하지 않는다.
         ⚠ 신형 상세에만 있었고 신형 피드·구형 상세·구형 피드 세 곳이 붙어 나왔다
           (2026-09-04 신고) → 한 함수로 묶어 네 곳이 같이 쓴다.
         호출 전에 ctx.font 가 "일반" 상태여야 공백 폭이 맞는다. */
      const copyGap = (ctx) =>
        /\s$/.test(state.copy || "") || /^\s/.test(state.copyBold || "")
          ? 0
          : ctx.measureText(" ").width;
      const flatPrice = (r) => {
        const d = disc(r && r.normal, r && r.sale);
        return d === 0;
      };
      /* 히어로 타이틀의 "00%" 를 지금 옵션들의 최대 할인율로 바꾼다 (요청 2026-10-23).
         시트 TemplateMaster.heroTitle 에 "Up To 00% Open." 처럼 적어 두면
         그릴 때마다 계산해서 넣는다 — 가격을 고치거나 옵션을 빼면 바로 따라간다.
         00 은 실제로 쓸 일이 없는 숫자라 자리표시로 삼았다. {할인}·{disc} 도 받는다.
         ⚠ 좌측 입력창에는 "00%" 가 그대로 남는다. 시트 원문을 지우면
           나중에 가격이 바뀌어도 숫자가 안 따라오기 때문이다. */
      /* 배너에 올린 옵션 카드 기준. 제목이 화면에 보이는 것과 달라지면 안 된다.
         ⚠ 아직 카드를 하나도 안 올렸으면 "할인이 없다"가 아니라 "아직 안 골랐다"다.
           그때만 시트의 그 제품군 목록으로 대신 본다 — 새 제품군을 만드는 중에
           제목이 비어 보이지 않도록 (2026-10-23 신고). */
      function maxDisc() {
        const pick = (list) => {
          let m = 0;
          for (const r of list || []) {
            const d = disc(r && r.normal, r && r.sale);
            if (d != null && d > m) m = d;
          }
          return m;
        };
        if ((state.rows || []).length) return pick(state.rows);
        const g = (typeof G === "function" && G()[state.group]) || {};
        return pick(g.rows);
      }
      /* ⚠ {할인} 뒤의 %는 바로 붙어 있을 때만 먹는다. \s*%? 로 두면
           "{할인} 할인" 의 공백까지 먹어 "60%할인" 으로 붙어 나왔다. */
      const HERO_FILL_RE = /\{\s*(?:disc|할인)\s*\}%?|\b00\s*%/gi;
      /* 할인이 하나도 없을 때 지울 덩어리 — 앞의 "Up To"·"~"·"최대" 까지 같이.
         예전엔 자리표시를 그대로 뒀더니 배너에 "{disc}" 가 글자로 찍혔다
         (2026-10-23 신고). 내보낸 이미지에 토큰이 남는 건 최악이라 지우는 쪽으로. */
      const HERO_DROP_RE =
        /(?:\bup\s*to\s*|~\s*|최대\s*)?(?:\{\s*(?:disc|할인)\s*\}%?|\b00\s*%)/gi;
      /* 자리표시가 들어 있나 (g 플래그 없음 — test 를 반복해도 안 어긋난다) */
      const HERO_HAS_RE = /\{\s*(?:disc|할인)\s*\}|\b00\s*%/i;
      const heroHasToken = (s) => HERO_HAS_RE.test(String(s ?? ""));
      function heroFill(s) {
        const t = String(s ?? "");
        if (!heroHasToken(t)) return t;
        const m = maxDisc();
        if (m) return t.replace(HERO_FILL_RE, m + "%");
        return t
          .replace(HERO_DROP_RE, "")
          .split(/\r?\n/)
          .map((l) => l.replace(/[ \t]{2,}/g, " ").trim())
          .join("\n")
          .replace(/\n{2,}/g, "\n")
          .trim();
      }
      const heroT1 = () => heroFill(state.t1);
      const heroT2 = () => heroFill(state.t2);
      const TH = () =>
        state.tpl
          ? themeTable(curFam(), state.tpl)[state.theme] ||
            Object.values(themeTable(curFam(), state.tpl))[0]
          : null;
      function loadImg(src, up) {
        return new Promise((res, rej) => {
          const i = new Image();
          if (!up) i.crossOrigin = "anonymous";
          i.onload = () => res(i);
          i.onerror = rej;
          i.src = src;
        });
      }

      /* Apps Script 프록시로 이미지를 base64 로 받아 data: URI 로 로드.
   data: URI 는 동일 출처로 취급되어 캔버스를 오염시키지 않는다. */
      let PROXY_ERR = null; // 마지막 프록시 실패 사유 (진단용)
      async function loadViaProxy(url) {
        const base = ($("#proxyUrl")?.value || "").trim();
        if (!base) throw new Error("프록시 URL 미입력");
        const full =
          base +
          (base.includes("?") ? "&" : "?") +
          "img=" +
          encodeURIComponent(url);
        let r;
        try {
          r = await fetch(full, { redirect: "follow" });
        } catch (e) {
          throw new Error(
            `CORS/네트워크 차단 — ${e.name}: ${e.message}. 배포 시 액세스 권한이 '모든 사용자'인지 확인하세요.`,
          );
        }
        if (!r.ok) throw new Error(`프록시 HTTP ${r.status} ${r.statusText}`);
        const txt = await r.text();
        if (/^\s*<!DOCTYPE|<html/i.test(txt))
          throw new Error(
            "HTML이 반환됨 — 로그인 페이지로 보입니다. 배포 액세스 권한을 '모든 사용자'로 바꾸고 '새 배포'를 만드세요.",
          );
        let j;
        try {
          j = JSON.parse(txt);
        } catch (e) {
          throw new Error("JSON 아님: " + txt.slice(0, 120));
        }
        if (!j.ok)
          throw new Error(`[${j.code || "?"}] ${j.message || "프록시 오류"}`);
        if (!j.data) throw new Error("응답에 이미지 데이터 없음");
        return await loadImg(`data:${j.mime};base64,${j.data}`, true);
      }

      /* URL → Promise<{img,tainted}> 캐시.
   제품군을 오갈 때 selectGroup 이 row.thumb 를 비우지만, 여기서 바로 돌려주므로
   네트워크를 다시 타지 않는다. 실패는 캐시하지 않는다(다음에 재시도 가능). */
      const IMG_CACHE = new Map();

      /* 이미지 로드 우선순위 (2026-07 개편)
   0) http(s) 가 아니면(업로드 data:/blob:) 그냥 직접 로드
   1) /api/img  서버 중계  → 같은 출처라 오염 없음 + 브라우저/CDN 캐시가 걸림
   2) CORS 허용 직접 로드   → 오염 없음
   3) Apps Script 프록시    → 구버전 폴백(설정돼 있을 때만)
   4) crossOrigin 없이 직접 → 미리보기는 되나 오염(PNG 저장 불가)

   이전에는 1순위가 (2)여서, CORS 를 안 여는 서버의 이미지는 매번
   "전부 받아서 버리는" 실패를 기다린 뒤에야 프록시로 넘어갔다. 그게 병목이었다. */
      const IMG_API = "/api/img?u=";
      /* 같은 주소에 사진만 새로 올렸을 때 옛 사진이 계속 나오는 걸 푸는 열쇠
         (요청 2026-10-22). /api/img 는 CDN 에 30일(s-maxage=2592000) 저장되고
         브라우저도 1시간 들고 있어서, 파일명을 안 바꾸면 한참 안 바뀐다.
         [시트 불러오기] 를 직접 누른 때만 시각을 넣어 주소를 다르게 만든다.
         ⚠ 캐시 열쇠(IMG_CACHE)와 state.heroUrl 비교는 원래 주소 그대로 쓴다 —
           주소를 바꿔 저장하면 "지금 고른 히어로" 판정이 어긋난다. */
      let IMG_BUST = "";
      function bustImg(url) {
        if (!IMG_BUST) return url;
        return url + (String(url).includes("?") ? "&" : "?") + "_v=" + IMG_BUST;
      }
      function setImgBust(v) {
        IMG_BUST = v ? String(v) : "";
        IMG_CACHE.clear();
      }
      async function loadImgSmart(url) {
        if (!/^https?:/i.test(String(url || "")))
          return { img: await loadImg(url, true), tainted: false };

        if (IMG_CACHE.has(url)) return IMG_CACHE.get(url);
        const net = bustImg(url); // 실제로 받아올 주소

        const p = (async () => {
          try {
            const i = await loadImg(IMG_API + encodeURIComponent(net), true);
            PROXY_ERR = null;
            return { img: i, tainted: false, viaProxy: true };
          } catch (e) {
            PROXY_ERR = `/api/img 실패 @ ${url}`;
          }
          try {
            const i = await loadImg(net, false);
            PROXY_ERR = null;
            return { img: i, tainted: false };
          } catch (e) {}
          if (($("#proxyUrl")?.value || "").trim()) {
            try {
              const i = await loadViaProxy(net);
              PROXY_ERR = null;
              return { img: i, tainted: false, viaProxy: true };
            } catch (e) {
              PROXY_ERR = String(e.message || e);
            } // 사유 보존 → 경고 패널에 노출
          }
          return { img: await loadImg(net, true), tainted: true };
        })();

        IMG_CACHE.set(url, p);
        p.catch(() => IMG_CACHE.delete(url));
        return p;
      }
      function anyTainted() {
        return !!(state.heroTainted || state.rows.some((r) => r.thumbTainted));
      }

      /* 템플릿 02 썸네일 — 히어로 타이틀 첫 줄만 조금 작게 (요청 2026-10-12).
         신형(nvfHero02 + NVF.th02)과 구형(drawThumb 02)이 같은 값을 쓰도록
         여기 한 곳에 둔다. 글자 크기와 줄 높이에 같이 곱한다 —
         글자만 줄이면 아랫줄과의 간격이 떠 보인다.
         ⚠ 썸네일에만 적용한다. 인스타 피드 히어로는 그대로다. */
      const T1_SCALE_02_THUMB = 0.8;
