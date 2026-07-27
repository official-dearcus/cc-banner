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
      function range02(a, b) {
        if (!a || !b) return "공구 기간 미입력";
        const s = new Date(a + "T00:00:00"),
          e = new Date(b + "T00:00:00");
        if (isNaN(s) || isNaN(e)) return "공구 기간 미입력";
        return `${s.getMonth() + 1}월 ${s.getDate()}일부터 ${e.getMonth() + 1}월 ${e.getDate()}일까지`;
      }
      const disc = (n, s) =>
        !n || n <= 0 ? null : s > n ? 0 : Math.round(((n - s) / n) * 100);
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

      /* 이미지 로드 우선순위
   1) CORS 허용 직접 로드      → 오염 없음
   2) 프록시(설정된 경우)       → 오염 없음
   3) crossOrigin 없이 직접 로드 → 미리보기는 되나 오염(PNG 저장 불가) */
      async function loadImgSmart(url) {
        try {
          const i = await loadImg(url, false);
          PROXY_ERR = null;
          return { img: i, tainted: false };
        } catch (e) {}
        if (($("#proxyUrl")?.value || "").trim()) {
          try {
            const i = await loadViaProxy(url);
            PROXY_ERR = null;
            return { img: i, tainted: false, viaProxy: true };
          } catch (e) {
            PROXY_ERR = String(e.message || e);
          } // 사유 보존 → 경고 패널에 노출
        }
        return { img: await loadImg(url, true), tainted: true };
      }
      function anyTainted() {
        return !!(state.heroTainted || state.rows.some((r) => r.thumbTainted));
      }
