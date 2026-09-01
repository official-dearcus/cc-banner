/* CC 배너 제너레이터 — 07-sheet-sync
   원본 index.html 에서 기능별로 분리. 로드 순서가 곧 실행 순서다. */
      /* 시트 레코드 → 제너레이터 GROUPS 형태로 변환 */
      function applySheet(sheetGroups) {
        const out = {};
        for (const g of Object.values(sheetGroups)) {
          const tpls = g.templates
            .map((t) => {
              const pt = tplParts(t.templateId);
              const tbl = themeTable(pt.fam, pt.key);
              return {
                key: pt.key,
                fam: pt.fam,
                label: t.templateLabel || tplMeta(pt.fam, pt.key).label,
                themes:
                  t.themes && t.themes.length
                    ? t.themes.filter((x) => tbl[x])
                    : null,
                heroTitle: t.heroTitle || [],
                bottomCopy: t.bottomCopy || "",
                bottomCopyBold: t.bottomCopyBold || "",
                gridUrls: t.gridUrls || [],
                noticeText: t.noticeText || "",
                sizeInfoUrl: t.sizeInfoUrl || "",
                optionTitle: t.optionTitle || "",
                colorTitle: t.colorTitle || "",
              };
            })
            .filter((t) => Object.keys(themeTable(t.fam, t.key)).length);
          out[g.key] = {
            label: g.label,
            family: (tpls[0] && tpls[0].fam) || "bamboo",
            templates: tpls.map((t) => t.key),
            themeFilter: Object.fromEntries(tpls.map((t) => [t.key, t.themes])),
            labelOverride: Object.fromEntries(
              tpls.map((t) => [t.key, t.label]),
            ),
            titleByTpl: Object.fromEntries(
              tpls.map((t) => [t.key, t.heroTitle]),
            ),
            copyByTpl: Object.fromEntries(
              tpls.map((t) => [
                t.key,
                { c: t.bottomCopy, b: t.bottomCopyBold },
              ]),
            ),
            gridByTpl: Object.fromEntries(
              tpls.map((t) => [t.key, t.gridUrls]),
            ),
            noticeByTpl: Object.fromEntries(
              tpls.map((t) => [t.key, t.noticeText]),
            ),
            sizeInfoByTpl: Object.fromEntries(
              tpls.map((t) => [t.key, t.sizeInfoUrl]),
            ),
            scentByTpl: Object.fromEntries(tpls.map((t) => [t.key, t.scentUrl])),
            optionTitleByTpl: Object.fromEntries(
              tpls.map((t) => [t.key, t.optionTitle]),
            ),
            colorTitleByTpl: Object.fromEntries(
              tpls.map((t) => [t.key, t.colorTitle]),
            ),
            seriesTitle: g.seriesTitle,
            optionTitleEn: g.optionTitleEn,
            heroUrl: g.heroUrl,
            heroes: g.heroes || [],
            colors: g.colors || [],
            noticeText: g.noticeText || "",
            sizeInfoUrl: g.sizeInfoUrl || "",
            /* ⚠ 여기 빠뜨리면 ProductMaster 에 scentUrl 을 적어도 화면까지 안 온다.
               scentByTpl(TemplateMaster)만 넘기고 제품군 단위 값을 빠뜨렸었다. */
            scentUrl: g.scentUrl || "",
            colorRatio: g.colorRatio || 0,
            colorGrid: g.colorGrid || "",
            colorRowGap: g.colorRowGap || 0,
            colorTitle: g.colorTitle || "",
            series: g.seriesTitle,
            seller: "",
            t1: "",
            t2: "",
            t1_02: "",
            t2_02: "",
            copy: "",
            copyBold: "",
            /* enabled=FALSE 인 행은 옵션 카드에서 빼고 offRows 로 따로 넘긴다.
               써볼래요 이벤트 경품 후보로는 계속 쓴다 (2026-09-01). */
            rows: g.rows.filter((r) => r.enabled !== false).map(rowOut),
            offRows: g.rows.filter((r) => r.enabled === false).map(rowOut),
          };
        }
        return out;
      }

      function rowOut(r) {
        return {
          name: r.name,
          optionInfo: r.optionInfo || [],
          normal: r.normalPrice,
          sale: r.salePrice,
          badge: r.badge || "none",
          colorLine: r.colorLine || "",
          thumbUrl: r.thumbUrl || "",
          thumb: null,
          thumbSrc: "",
        };
      }

      function showSheetErrors(errors, okMsg) {
        const box = $("#sheetErr");
        if (!errors.length) {
          box.innerHTML = okMsg
            ? `<div class="warnbox ok"><b>${okMsg}</b></div>`
            : "";
          return;
        }
        // 같은 코드끼리 묶어 요청자 문구는 1번, 관리자 상세는 접어서
        const byCode = {};
        errors.forEach((e) => {
          (byCode[e.code] = byCode[e.code] || []).push(e);
        });
        box.innerHTML = Object.entries(byCode)
          .map(([code, list]) => {
            const isWarn = code === "E301";
            const rows = list.filter((e) => e.row).map((e) => e.row);
            const where = rows.length
              ? ` (${rows.length > 4 ? rows.slice(0, 4).join(", ") + " 외 " + (rows.length - 4) + "건" : "행 " + rows.join(", ")})`
              : "";
            return `<div class="warnbox ${isWarn ? "warn" : "err"}">
      <b>${list[0].user}${where}</b>
      <details><summary>관리자용 상세 [${code}]</summary>
        <div class="errdetail">${list.map((e) => `${e.row ? "행 " + e.row + ": " : ""}${e.admin}`).join("<br/>")}</div>
      </details></div>`;
          })
          .join("");
      }

      /* fetch 실패 원인 구분:
   - CORS/네트워크 차단 → TypeError (status 조회 불가) → E104
   - 서버 응답은 왔는데 권한/부재 → E102
   - 그 외 HTTP 오류 → E101 */
      async function safeFetch(url) {
        let r;
        try {
          r = await fetch(url, { redirect: "follow" });
        } catch (e) {
          throw mkErr("E104", `${e.name}: ${e.message} @ ${url}`);
        }
        if (!r.ok)
          throw mkErr(
            r.status === 403 || r.status === 404 ? "E102" : "E101",
            `HTTP ${r.status} ${r.statusText} @ ${url}`,
          );
        return r;
      }
      async function fetchCsv(url) {
        const r = await safeFetch(url);
        const t = await r.text();
        if (/^\s*<!DOCTYPE|<html/i.test(t))
          throw mkErr("E102", `HTML 반환 — 게시/공유 설정 확인 @ ${url}`);
        if (!t.trim()) throw mkErr("E103", `빈 응답 @ ${url}`);
        return t;
      }

      /* ---- 입력값 해석 (§1.1.1) ----
   아래 3가지를 모두 받아들인다:
     1) 게시 URL  : .../spreadsheets/d/e/2PACX-.../pubhtml
     2) 편집 URL  : .../spreadsheets/d/{docId}/edit
     3) 문서 ID   : {docId} 만
*/
      function parseSheetInput(v) {
        const s = String(v || "").trim();
        let m = s.match(/\/d\/e\/([A-Za-z0-9_-]+)/);
        if (m) return { mode: "pub", id: m[1] };
        m = s.match(/\/d\/([A-Za-z0-9_-]{20,})/);
        if (m) return { mode: "gviz", id: m[1] };
        if (/^2PACX-[A-Za-z0-9_-]+$/.test(s)) return { mode: "pub", id: s };
        if (/^[A-Za-z0-9_-]{20,}$/.test(s)) return { mode: "gviz", id: s };
        return null;
      }
      const pubHtmlUrl = (id) =>
        `https://docs.google.com/spreadsheets/d/e/${id}/pubhtml`;
      const pubCsvUrl = (id, gid) =>
        `https://docs.google.com/spreadsheets/d/e/${id}/pub?gid=${gid}&single=true&output=csv`;

      /* 게시 문서의 탭 목록(이름→gid) 조회 — pubhtml 의 sheet-menu 파싱 */
      async function fetchPubTabs(id) {
        const r = await safeFetch(pubHtmlUrl(id));
        const html = await r.text();
        const map = {};
        const re = /sheet-button-(\d+)"[^>]*>\s*<a[^>]*>([^<]+)<\/a>/g;
        let m;
        while ((m = re.exec(html))) map[m[2].trim()] = m[1];
        if (!Object.keys(map).length) {
          // 탭이 1개면 sheet-menu 가 없음 → gid=0 단일
          if (/<table/i.test(html)) return { _single: "0" };
          throw mkErr("E103", "pubhtml 에서 탭 목록을 찾지 못했습니다");
        }
        return map;
      }
      async function fetchPubTabCsv(id, tabs, name) {
        const gid =
          tabs[name] ??
          (tabs._single && Object.keys(tabs).length === 1
            ? tabs._single
            : null);
        if (gid == null)
          throw mkErr(
            "E110",
            `"${name}" 탭 없음 (게시된 탭: ${Object.keys(tabs)
              .filter((k) => k[0] !== "_")
              .join(", ")})`,
          );
        return fetchCsv(pubCsvUrl(id, gid));
      }
      function rowsToCsv(header, rows) {
        const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
        return [
          header.map(esc).join(","),
          ...rows.map((r) => r.map(esc).join(",")),
        ].join("\n");
      }

      async function syncSheet() {
        const btn = $("#syncBtn");
        btn.disabled = true;
        btn.textContent = "불러오는 중…";
        try {
          let pCsv,
            tCsv,
            hCsv = "",
            cCsv = "",
            eCsv = "",
            gCsv = "";
          /* 선택 탭은 없으면 조용히 넘어간다 — 이벤트 배너를 안 쓰는 시트도 그대로 동작 */
          const tryCsv = async (fn) => { try { return await fn(); } catch (e) { return ""; } };
          if (src.mode === "csv" && src.csv === "manual") {
            const uP = $("#urlP").value.trim(),
              uT = $("#urlT").value.trim(),
              uH = $("#urlH").value.trim(),
              uC = $("#urlC").value.trim();
            if (!uP || !uT)
              throw mkErr(
                "E101",
                "ProductMaster / TemplateMaster CSV URL을 입력하세요",
              );
            pCsv = await fetchCsv(uP);
            tCsv = await fetchCsv(uT);
            if (uH) {
              try {
                hCsv = await fetchCsv(uH);
              } catch (e) {
                hCsv = "";
              }
            }
            if (uC) {
              try {
                cCsv = await fetchCsv(uC);
              } catch (e) {
                cCsv = "";
              }
            }
            const uE = ($("#urlE") && $("#urlE").value.trim()) || "";
            const uG = ($("#urlG") && $("#urlG").value.trim()) || "";
            if (uE) eCsv = await tryCsv(() => fetchCsv(uE));
            if (uG) gCsv = await tryCsv(() => fetchCsv(uG));
          } else if (src.mode === "csv") {
            const inp = parseSheetInput($("#docId").value);
            if (!inp) throw mkErr("E101", "문서 ID 또는 게시 URL을 입력하세요");
            const nP = $("#tabP").value.trim() || "ProductMaster";
            const nT = $("#tabT").value.trim() || "TemplateMaster";
            const nH = $("#tabH").value.trim() || "HeroMaster";
            const nC = $("#tabC").value.trim() || "ColorMaster";
            const nE = "EventMaster";
            const nG = "GiftMaster";
            if (inp.mode === "pub") {
              const tabs = await fetchPubTabs(inp.id);
              pCsv = await fetchPubTabCsv(inp.id, tabs, nP);
              tCsv = await fetchPubTabCsv(inp.id, tabs, nT);
              try {
                hCsv = await fetchPubTabCsv(inp.id, tabs, nH);
              } catch (e) {
                hCsv = "";
              }
              try {
                cCsv = await fetchPubTabCsv(inp.id, tabs, nC);
              } catch (e) {
                cCsv = "";
              }
              eCsv = await tryCsv(() => fetchPubTabCsv(inp.id, tabs, nE));
              gCsv = await tryCsv(() => fetchPubTabCsv(inp.id, tabs, nG));
            } else {
              pCsv = await fetchCsv(sheetCsvUrl(inp.id, nP));
              tCsv = await fetchCsv(sheetCsvUrl(inp.id, nT));
              try {
                hCsv = await fetchCsv(sheetCsvUrl(inp.id, nH));
              } catch (e) {
                hCsv = "";
              }
              try {
                cCsv = await fetchCsv(sheetCsvUrl(inp.id, nC));
              } catch (e) {
                cCsv = "";
              }
              eCsv = await tryCsv(() => fetchCsv(sheetCsvUrl(inp.id, nE)));
              gCsv = await tryCsv(() => fetchCsv(sheetCsvUrl(inp.id, nG)));
            }
          } else {
            const u = $("#gasUrl").value.trim();
            if (!u) throw mkErr("E101", "Apps Script URL 미입력");
            const r = await fetch(u, { redirect: "follow" });
            if (!r.ok)
              throw mkErr(
                r.status === 401 || r.status === 403 ? "E102" : "E101",
                `HTTP ${r.status}`,
              );
            const j = await r.json();
            if (!j.ok)
              throw mkErr(j.code || "E101", j.message || "Apps Script 오류");
            pCsv = rowsToCsv(j.ProductMaster.header, j.ProductMaster.rows);
            tCsv = rowsToCsv(j.TemplateMaster.header, j.TemplateMaster.rows);
            if (j.HeroMaster && j.HeroMaster.header.length)
              hCsv = rowsToCsv(j.HeroMaster.header, j.HeroMaster.rows);
            if (j.ColorMaster && j.ColorMaster.header.length)
              cCsv = rowsToCsv(j.ColorMaster.header, j.ColorMaster.rows);
            if (j.EventMaster && j.EventMaster.header.length)
              eCsv = rowsToCsv(j.EventMaster.header, j.EventMaster.rows);
            if (j.GiftMaster && j.GiftMaster.header.length)
              gCsv = rowsToCsv(j.GiftMaster.header, j.GiftMaster.rows);
          }
          const P = parseSheet(pCsv, "ProductMaster");
          const T = parseSheet(tCsv, "TemplateMaster");
          const H = hCsv
            ? parseSheet(hCsv, "HeroMaster")
            : { rows: [], errors: [] };
          const C = cCsv
            ? parseSheet(cCsv, "ColorMaster")
            : { rows: [], errors: [] };
          /* 이벤트 마스터는 제품군과 무관한 전역 목록이라 buildGroups 를 안 탄다 */
          const E = eCsv ? parseSheet(eCsv, "EventMaster") : { rows: [], errors: [] };
          const GF = gCsv ? parseSheet(gCsv, "GiftMaster") : { rows: [], errors: [] };
          const srt = (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || a._row - b._row;
          EVENT_TYPES = E.rows.filter((r) => r.enabled !== false).sort(srt);
          GIFTS = GF.rows.filter((r) => r.enabled !== false).sort(srt);
          if (typeof renderSetupEvents === "function") renderSetupEvents();
          const B = buildGroups(P.rows, T.rows, KNOWN_TPL, H.rows, C.rows);
          const errs = [
            ...P.errors,
            ...T.errors,
            ...H.errors,
            ...C.errors,
            ...E.errors,
            ...GF.errors,
            ...B.errors,
          ];
          if (!Object.keys(B.groups).length) {
            showSheetErrors(
              errs.length ? errs : [mkErr("E103", "유효한 제품 행 없음")],
            );
            return;
          }
          SHEET_GROUPS = applySheet(B.groups);
          src.syncedAt = new Date();
          saveCfg();
          cfgHint();
          srcState();
          const first = Object.keys(SHEET_GROUPS)[0];
          initGroups(false);
          selectGroup(first);
          const hard = errs.filter((e) => e.code !== "E301");
          showSheetErrors(
            errs,
            hard.length
              ? null
              : `동기화 완료 — 제품군 ${Object.keys(SHEET_GROUPS).length}개 · 옵션 ${P.rows.length}행` +
                (C.rows.length ? ` · 색상 ${C.rows.length}개` : " · 색상 없음"),
          );
          srcHint();
        } catch (e) {
          const err = e.code ? e : mkErr("E101", String(e.message || e));
          // 자동(pubhtml) 경로가 CORS로 막히면 → 직접 URL 모드로 전환 안내
          if (err.code === "E104" && src.mode === "csv" && src.csv === "auto") {
            $("#csvManual").click();
            showSheetErrors([err]);
            $("#sheetErr").insertAdjacentHTML(
              "afterbegin",
              `<div class="warnbox warn"><b>[탭별 URL 직접]으로 전환했습니다</b>
         자동 탐색은 구글이 CORS를 막아 사용할 수 없습니다.<br/>
         <b>파일 → 공유 → 웹에 게시</b>에서 <b>탭을 하나씩 고르고 형식을 CSV</b>로 게시한 뒤,
         나오는 <code>...output=csv</code> 주소를 아래에 붙여넣으세요.</div>`,
            );
            return;
          }
          showSheetErrors([err]);
        } finally {
          btn.disabled = false;
          btn.textContent = "시트 불러오기";
        }
      }

      let SHEET_GROUPS = null;
      const G = () => SHEET_GROUPS || GROUPS;

      function srcState() {
        const el = $("#srcState");
        if (!el) return;
        el.textContent =
          src.mode === "sample"
            ? "내장 샘플"
            : src.syncedAt
              ? `연결됨 · ${src.syncedAt.toLocaleTimeString("ko-KR")}`
              : "미연결";
      }
      function srcHint() {
        const h = $("#srcHint");
        if (src.mode === "sample") {
          h.innerHTML = "코드에 내장된 뱀부500 데이터로 동작합니다.";
          return;
        }
        const t = src.syncedAt
          ? `마지막 동기화: ${src.syncedAt.toLocaleTimeString("ko-KR")}`
          : "아직 불러오지 않았습니다.";
        h.innerHTML =
          src.mode !== "csv"
            ? `${t}<br/>시트는 비공개로 유지됩니다. 조직 계정으로 로그인되어 있어야 합니다.`
            : src.csv === "manual"
              ? `${t}<br/><b>파일 → 공유 → 웹에 게시</b>에서 <b>탭 하나씩 선택 + 형식 CSV</b>로 게시하면 나오는 주소를 각각 붙여넣으세요.<br/>(<code>.../pub?gid=...&single=true&output=csv</code>)`
              : `${t}<br/>게시 URL 또는 문서 ID를 붙여넣으면 탭을 자동으로 찾습니다.<br/>실패하면 <b>[탭별 URL 직접]</b>을 쓰세요.`;
      }
      $("#srcSeg")
        .querySelectorAll("button")
        .forEach(
          (b) =>
            (b.onclick = () => {
              src.mode = b.dataset.s;
              $("#srcSeg")
                .querySelectorAll("button")
                .forEach((x) => x.classList.toggle("on", x === b));
              $("#srcCsv").hidden = src.mode !== "csv";
              $("#srcGas").hidden = src.mode !== "gas";
              $("#syncRow").hidden = src.mode === "sample";
              if (src.mode === "sample") {
                SHEET_GROUPS = null;
                showSheetErrors([]);
                initGroups(false);
                selectGroup("bamboo500");
              }
              srcHint();
            }),
        );
      $("#csvAuto").onclick = () => {
        src.csv = "auto";
        $("#csvAuto").classList.add("on");
        $("#csvManual").classList.remove("on");
        $("#csvAutoBox").hidden = false;
        $("#csvManualBox").hidden = true;
        srcHint();
      };
      $("#csvManual").onclick = () => {
        src.csv = "manual";
        $("#csvManual").classList.add("on");
        $("#csvAuto").classList.remove("on");
        $("#csvAutoBox").hidden = true;
        $("#csvManualBox").hidden = false;
        srcHint();
      };
      $("#proxyUrl").onchange = () => {
        saveCfg();
        cfgHint();
        state.rows.forEach((r) => {
          r.thumb = null;
          r.thumbTainted = false;
        });
        const u = state.heroUrl;
        state.hero = null;
        state.heroTainted = false;
        loadSheetImages().then(() => {
          if (u) pickHero(u);
        });
        status("이미지 프록시 설정을 적용했습니다.");
      };
      $("#proxyTest").onclick = async () => {
        const box = $("#proxyResult"),
          btn = $("#proxyTest");
        const base = $("#proxyUrl").value.trim();
        if (!base) {
          box.innerHTML = `<div class="warnbox err"><b>프록시 URL을 입력하세요</b></div>`;
          return;
        }
        const sample =
          heroesForTpl()[0]?.url ||
          state.heroUrl ||
          (state.rows.find((r) => r.thumbUrl) || {}).thumbUrl;
        if (!sample) {
          box.innerHTML = `<div class="warnbox warn"><b>테스트할 이미지 URL이 없습니다</b>HeroMaster에 이미지를 등록한 뒤 다시 시도하세요.</div>`;
          return;
        }
        btn.disabled = true;
        btn.textContent = "테스트 중…";
        box.innerHTML = `<div class="warnbox warn"><b>확인 중…</b>${esc(sample)}</div>`;
        try {
          await loadViaProxy(sample);
          box.innerHTML = `<div class="warnbox ok"><b>프록시 정상</b>이미지를 중계로 불러왔습니다. PNG 저장이 가능합니다.</div>`;
        } catch (e) {
          box.innerHTML = `<div class="warnbox err"><b>프록시 실패</b>
      <div class="errdetail">${esc(String(e.message || e))}</div>
      <div style="margin-top:6px">테스트 대상: ${esc(sample)}</div></div>`;
        } finally {
          btn.disabled = false;
          btn.textContent = "프록시 테스트";
        }
      };
