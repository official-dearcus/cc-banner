/* CC 배너 제너레이터 — 06-config-store
   원본 index.html 에서 기능별로 분리. 로드 순서가 곧 실행 순서다. */
      /* ============================================================
   시트 연동 (§1.1 조회/캐시/동기화)
   ============================================================ */
      /* 렌더러가 구현된 템플릿 ID 목록.
         여기 없는 templateId 는 E302 로 걸러진다(잘못된 레이아웃 방지).
         누볼라 02·03 은 렌더러 구현 후 추가할 것. */
      const KNOWN_TPL = [
        "bamboo500_01", "bamboo500_02",
        "nuvolafamily_01", "nuvolafamily_02", "nuvolafamily_03",
      ];
      const src = { mode: "sample", csv: "auto", syncedAt: null };

      /* ---- 접속 설정 저장 (§1.1.1 환경설정) ----
   localStorage 는 환경에 따라 막힐 수 있으므로 항상 try/catch. 실패해도 동작에는 지장 없음. */
      /* ============================================================
   기본 접속 설정 (배포용)
   ------------------------------------------------------------
   여기에 값이 있으면 열자마자 자동으로 시트를 불러오고 프록시를 적용한다.
   운영자가 화면에서 바꾸면 그 값이 브라우저에 저장되어 기본값보다 우선한다.
   시트/프록시 주소가 바뀌면 이 블록만 수정하면 된다.
   ============================================================ */
      const PRESET = {
        /* Vercel 서버 함수(/api/sheet)가 비공개 시트를 읽어 CSV 로 돌려준다.
           시트를 "웹에 게시"할 필요가 없고, 주소가 노출되지도 않는다.
           시트가 바뀌면 이 파일이 아니라 Vercel 환경변수 SHEET_ID 를 고친다. */
        csv: {
          ProductMaster: "/api/sheet?tab=ProductMaster",
          TemplateMaster: "/api/sheet?tab=TemplateMaster",
          HeroMaster: "/api/sheet?tab=HeroMaster",
          ColorMaster: "/api/sheet?tab=ColorMaster",
        },
        proxy:
          "https://script.google.com/macros/s/AKfycbxKjJ78pLc7Pj1VYNPCGwJ0eRC_AsEAo6-aBNDpEgYGcCjGEa9wwTTeJtK8rRJwcVr8/exec",
      };

      /* v2: 게시 CSV → /api/sheet 전환. 옛 저장값을 버리고 새 기본값을 쓰게 한다. */
      const CFG_KEY = "cc-banner-cfg-v2";
      const CFG_FIELDS = [
        "docId",
        "tabP",
        "tabT",
        "tabH",
        "tabC",
        "urlP",
        "urlT",
        "urlH",
        "urlC",
        "gasUrl",
        "proxyUrl",
      ];
      let CFG_OK = null; // localStorage 사용 가능 여부

      /* 설정은 출처(scheme+host+port)별로 저장된다.
   Live Server 포트가 5500→5501 로 바뀌거나 localhost↔127.0.0.1 이 달라지면
   어제 저장한 설정이 보이지 않는다. 그래서 저장 위치를 화면에 노출한다. */
      function cfgProbe() {
        try {
          localStorage.setItem("__t", "1");
          localStorage.removeItem("__t");
          CFG_OK = true;
        } catch (e) {
          CFG_OK = false;
        }
        return CFG_OK;
      }
      function saveCfg() {
        try {
          const o = {
            mode: src.mode,
            csv: src.csv,
            seller: state.seller,
            d1: state.d1,
            d2: state.d2,
          };
          CFG_FIELDS.forEach((f) => {
            const el = $("#" + f);
            if (el) o[f] = el.value;
          });
          localStorage.setItem(CFG_KEY, JSON.stringify(o));
          CFG_OK = true;
        } catch (e) {
          CFG_OK = false;
          cfgHint();
        }
      }
      function cfgHint() {
        const el = $("#cfgWhere");
        if (!el) return;
        if (CFG_OK === false) {
          el.className = "warnbox err";
          el.innerHTML = `<b>설정을 저장할 수 없습니다</b>브라우저가 저장소를 막고 있습니다(시크릿 모드 등). 매번 입력해야 합니다.`;
          return;
        }
        const saved = (() => {
          try {
            return !!localStorage.getItem(CFG_KEY);
          } catch (e) {
            return false;
          }
        })();
        el.className = "hint";
        el.innerHTML = `설정 저장 위치: <b>${location.origin}</b> ${saved ? "— 저장됨 ✓" : "— 아직 없음"}<br/>
    ⚠️ <b>포트가 바뀌면 설정이 사라집니다.</b> (localhost:5500 ↔ 5501 은 서로 다른 저장소)
    항상 같은 주소로 여세요.`;
      }
      function loadCfg() {
        try {
          const o = JSON.parse(localStorage.getItem(CFG_KEY) || "null");
          if (!o) return null;
          CFG_FIELDS.forEach((f) => {
            const el = $("#" + f);
            if (el && o[f] != null) el.value = o[f];
          });
          /* 저장된 설정에 없는 항목은 배포 기본값(PRESET)으로 채운다.
             새 탭(ColorMaster 등)이 추가돼도 기존 사용자가 자동으로 받아가게 하기 위함. */
          if (PRESET && PRESET.csv) {
            const fill = {
              urlP: PRESET.csv.ProductMaster,
              urlT: PRESET.csv.TemplateMaster,
              urlH: PRESET.csv.HeroMaster,
              urlC: PRESET.csv.ColorMaster,
              proxyUrl: PRESET.proxy,
            };
            for (const [id, v] of Object.entries(fill)) {
              const el = $("#" + id);
              if (el && !el.value && v) {
                el.value = v;
                o[id] = v;
              }
            }
          }
          return o;
        } catch (e) {
          return null;
        }
      }
      function clearCfg() {
        try {
          localStorage.removeItem(CFG_KEY);
        } catch (e) {}
      }

      function tplIdToKey(id) {
        return tplParts(id).key;
      }
