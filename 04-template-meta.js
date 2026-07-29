/* CC 배너 제너레이터 — 20-history-share
   원본 index.html 에서 기능별로 분리. 로드 순서가 곧 실행 순서다. */
      /* ---------- 이력 / 공유 ---------- */
      const hist = [];
      const snap = () => ({
        group: state.group,
        tpl: state.tpl,
        theme: state.theme,
        seller: state.seller,
        t1: state.t1,
        t2: state.t2,
        d1: state.d1,
        d2: state.d2,
        copy: state.copy,
        copyBold: state.copyBold,
        series: state.series,
        rows: state.rows.map((r) => ({
          name: rowName(r),
          optionInfo: rowAttrs(r),
          normal: r.normal,
          sale: r.sale,
          badge: r.badge,
          thumbUrl: r.thumbUrl || "",
        })),
        at: new Date().toLocaleString("ko-KR"),
      });
      function pushHist() {
        hist.unshift(snap());
        renderHist();
      }
      function renderHist() {
        const el = $("#histList");
        if (!hist.length) {
          el.innerHTML = `<div class="empty">다운로드하면 이력이 쌓입니다.</div>`;
          return;
        }
        el.innerHTML = hist
          .map(
            (
              h,
              i,
            ) => `<div class="hist" data-i="${i}"><div><b>${(G()[h.group] || { label: h.group }).label}</b> · ${h.tpl}/${h.theme}</div>
    <div class="s">${h.seller} · ${h.d1 || "-"} ~ ${h.d2 || "-"}<br/>${h.at}</div></div>`,
          )
          .join("");
        el.querySelectorAll(".hist").forEach(
          (x) => (x.onclick = () => restore(hist[+x.dataset.i])),
        );
      }
      function restore(h) {
        Object.assign(state, {
          group: h.group,
          tpl: h.tpl,
          theme: h.theme,
          seller: h.seller,
          t1: h.t1,
          t2: h.t2,
          d1: h.d1,
          d2: h.d2,
          copy: h.copy,
          copyBold: h.copyBold,
          series: h.series,
          rows: h.rows.map((r) => mkRow({ ...r, thumb: null, thumbSrc: "" })),
        });
        state.group = h.group; renderGroupButtons();
        $("#seller").value = h.seller;
        $("#t1").value = h.t1;
        $("#t2").value = h.t2;
        $("#d1").value = h.d1;
        $("#d2").value = h.d2;
        $("#copy").value = h.copy;
        $("#copyBold").value = h.copyBold;
        $("#series").value = h.series;
        renderTplList();
        renderThemes();
        renderRows();
        syncTplUI();
        dateHint();
        draw();
        status("이력에서 복구했습니다.");
      }
      $("#shareBtn").onclick = () => {
        const c = snap();
        delete c.at;
        const code = btoa(unescape(encodeURIComponent(JSON.stringify(c))));
        const url =
          location.origin +
          location.pathname +
          "?config=" +
          encodeURIComponent(code);
        if (navigator.clipboard) navigator.clipboard.writeText(url);
        status("공유 URL 복사됨 (이미지 제외)");
      };
      function fromUrl() {
        const p = new URLSearchParams(location.search).get("config");
        if (!p) return;
        try {
          const c = JSON.parse(decodeURIComponent(escape(atob(p))));
          c.at = "";
          restore(c);
        } catch (e) {
          status("공유 코드 해석 실패", 1);
        }
      }
