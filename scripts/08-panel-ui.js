/* CC 배너 제너레이터 — 08-panel-ui
   원본 index.html 에서 기능별로 분리. 로드 순서가 곧 실행 순서다. */
      /* 이미지별 CORS 실측 — 캔버스가 요구하는 것과 동일한 조건(crossOrigin=anonymous)으로 확인 */
      function probeCors(url) {
        return new Promise((res) => {
          const t0 = performance.now();
          const i = new Image();
          i.crossOrigin = "anonymous";
          const done = (ok) =>
            res({ url, ok, ms: Math.round(performance.now() - t0) });
          i.onload = () => done(true);
          i.onerror = () => done(false);
          i.src = url + (url.includes("?") ? "&" : "?") + "_cc=" + Date.now(); // 캐시 우회
        });
      }
      $("#corsTest").onclick = async () => {
        const box = $("#proxyResult"),
          btn = $("#corsTest");
        const list = [];
        heroesForTpl().forEach((h) => list.push({ tag: "히어로", url: h.url }));
        state.rows.forEach((r) => {
          if (r.thumbUrl) list.push({ tag: "썸네일", url: r.thumbUrl });
        });
        if (!list.length) {
          box.innerHTML = `<div class="warnbox warn"><b>검사할 URL이 없습니다</b>시트에 이미지 URL을 넣고 불러오세요.</div>`;
          return;
        }
        btn.disabled = true;
        btn.textContent = "검사 중…";
        box.innerHTML = `<div class="warnbox warn"><b>${list.length}개 검사 중…</b></div>`;
        const out = [];
        for (const it of list) {
          const r = await probeCors(it.url);
          out.push({ ...it, ...r });
        }
        const okN = out.filter((o) => o.ok).length;
        const rows = out
          .map(
            (o) => `<tr><td>${o.ok ? "✅" : "❌"}</td><td>${o.tag}</td>
      <td style="word-break:break-all">${esc(o.url.replace(/^https?:\/\/[^/]+/, ""))}</td></tr>`,
          )
          .join("");

        // 프록시가 설정돼 있으면 직접 로드 실패는 치명적이지 않다 — 실제로 프록시로 되는지까지 확인
        const hasProxy = !!($("#proxyUrl").value || "").trim();
        let proxyOk = null;
        if (okN < out.length && hasProxy) {
          try {
            await loadViaProxy(out.find((o) => !o.ok).url);
            proxyOk = true;
          } catch (e) {
            proxyOk = false;
            PROXY_ERR = String(e.message || e);
          }
        }
        let kind, head, note;
        if (okN === out.length) {
          kind = "ok";
          head = "전부 CORS 통과 — PNG 저장 가능";
          note = "프록시 없이 직접 로드됩니다.";
        } else if (proxyOk === true) {
          kind = "ok";
          head = `직접 로드는 차단되지만 프록시로 해결됨 — PNG 저장 가능`;
          note =
            "서버에 CORS 헤더가 없어 아래는 전부 ❌지만, 프록시가 중계하므로 저장에 문제 없습니다.";
        } else if (proxyOk === false) {
          kind = "err";
          head = "차단 + 프록시도 실패 — PNG 저장 불가";
          note = `프록시 오류: ${esc(PROXY_ERR || "")}`;
        } else {
          kind = "err";
          head = `직접 로드 차단 (${okN}/${out.length} 통과)`;
          note =
            "서버가 CORS 헤더를 보내지 않습니다. <b>이미지 프록시 URL</b>을 설정하면 우회할 수 있습니다.";
        }
        box.innerHTML = `<div class="warnbox ${kind}"><b>${head}</b>
    <div style="margin-bottom:4px">${note}</div>
    <details><summary>파일별 직접 로드 결과 (${okN}/${out.length})</summary>
      <table class="corstbl">${rows}</table></details></div>`;
        btn.disabled = false;
        btn.textContent = "이미지 CORS 진단";
      };
      $("#srcToggle").onclick = () => {
        const b = $("#srcBody");
        b.hidden = !b.hidden;
      };
      $("#fmtTabs")
        .querySelectorAll("button")
        .forEach((b) => (b.onclick = () => switchFmt(b.dataset.f)));

      /* 편집 패널 폭 드래그 조절 (localStorage 유지) */
      (function () {
        const MIN = 380,
          MAX = 900,
          KEY = "cc-leftw";
        try {
          const w = +localStorage.getItem(KEY);
          if (w >= MIN && w <= MAX)
            document.documentElement.style.setProperty("--leftw", w + "px");
        } catch (e) {}
        const rz = $("#resizer");
        if (!rz) return;
        let dragging = false;
        const onMove = (e) => {
          if (!dragging) return;
          const x = e.touches ? e.touches[0].clientX : e.clientX;
          let w = Math.round(Math.min(MAX, Math.max(MIN, x)));
          document.documentElement.style.setProperty("--leftw", w + "px");
          renderFmt(); // 미리보기 폭 갱신
        };
        const end = () => {
          if (!dragging) return;
          dragging = false;
          rz.classList.remove("drag");
          document.body.style.userSelect = "";
          document.body.style.cursor = "";
          const w = parseInt(
            getComputedStyle(document.documentElement).getPropertyValue(
              "--leftw",
            ),
          );
          try {
            localStorage.setItem(KEY, w);
          } catch (e) {}
          draw();
          drawTplPreviews();
        };
        const start = (e) => {
          dragging = true;
          rz.classList.add("drag");
          document.body.style.userSelect = "none";
          document.body.style.cursor = "col-resize";
          e.preventDefault();
        };
        rz.addEventListener("mousedown", start);
        rz.addEventListener("touchstart", start, { passive: false });
        window.addEventListener("mousemove", onMove);
        window.addEventListener("touchmove", onMove, { passive: false });
        window.addEventListener("mouseup", end);
        window.addEventListener("touchend", end);
        // 더블클릭 = 기본값 복원
        rz.addEventListener("dblclick", () => {
          document.documentElement.style.setProperty("--leftw", "600px");
          try {
            localStorage.setItem(KEY, 600);
          } catch (e) {}
          draw();
          drawTplPreviews();
          renderFmt();
        });
      })();
      $("#syncBtn").onclick = syncSheet;
      $("#cfgClear").onclick = () => {
        clearCfg();
        CFG_FIELDS.forEach((f) => {
          const el = $("#" + f);
          if (el && !/^tab/.test(f)) el.value = "";
        });
        cfgHint();
        status("저장된 접속 설정을 지웠습니다.");
      };
