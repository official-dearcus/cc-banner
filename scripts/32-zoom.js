/* CC 배너 제너레이터 — 32-zoom
   미리보기 배율 (요청 2026-11-25) — [−] 00% [+] · [화면 맞춤] · [100%]

   전에는 15~50% 슬라이더 하나였다. 실제 크기(100%)로 볼 길이 없어서
   글자 겹침·잘림을 미리보기에서 확인할 수 없었다.

   · #zoom (range) 은 숨긴 채로 남긴다 — 값을 읽는 코드가 여러 곳이다
     (13-render-core · 21-bindings-boot). 여기서는 값을 넣고 input 이벤트만 쏜다.
   · 배율의 기준: 상세 860 · 썸네일 1080 · 피드 1080×1350 (출력 1x 크기 = 100%).
   · 화면 맞춤
       상세     폭에 맞춘다(세로는 스크롤). 100% 를 넘겨 키우지는 않는다.
       썸네일   한 장이 화면에 다 들어오게
       피드     한 장의 세로가 화면에 다 들어오게(옆 장은 가로 스크롤)
     맞춤 상태에서는 창 크기·패널 폭·출력 유형이 바뀌면 다시 맞춘다.
     [−][+][100%] 나 Ctrl+휠을 쓰면 맞춤이 풀리고 그 배율이 유지된다.
   switchFmt 를 감싼다 — 13-render-core 보다 뒤에 불러야 한다. */

      const ZOOM_STEPS = [10, 15, 20, 25, 33, 50, 67, 75, 100, 125, 150, 200];
      let ZOOM_FIT = true;

      function zoomGet() {
        return +document.getElementById("zoom").value;
      }
      function zoomApply(v) {
        const el = document.getElementById("zoom");
        v = Math.max(+el.min, Math.min(+el.max, Math.round(v)));
        el.value = v;
        el.dispatchEvent(new Event("input"));
        const fit = document.getElementById("zoomFit"),
          one = document.getElementById("zoom100");
        if (fit) fit.classList.toggle("on", ZOOM_FIT);
        if (one) one.classList.toggle("on", !ZOOM_FIT && v === 100);
        const out = document.getElementById("zoomOut"),
          inn = document.getElementById("zoomIn");
        if (out) out.disabled = v <= +el.min;
        if (inn) inn.disabled = v >= +el.max;
      }
      function zoomFitValue() {
        const center = document.querySelector("main.center");
        const stage = document.querySelector("main.center .stage:not([hidden])");
        if (!center || !stage || !center.clientWidth) return null;
        const cs = getComputedStyle(center),
          ss = getComputedStyle(stage);
        const padX = (el) =>
          parseFloat(el.paddingLeft) + parseFloat(el.paddingRight) +
          parseFloat(el.borderLeftWidth) + parseFloat(el.borderRightWidth);
        const padY = (el) =>
          parseFloat(el.paddingTop) + parseFloat(el.paddingBottom) +
          parseFloat(el.borderTopWidth) + parseFloat(el.borderBottomWidth);
        const availW = center.clientWidth - padX(cs) - padX(ss) - 2;
        const availH =
          window.innerHeight - stage.getBoundingClientRect().top -
          parseFloat(cs.paddingBottom) - padY(ss) - 2;
        if (availW <= 0) return null;
        let z;
        if (curFmt === "thumb") z = Math.min(availW / 1080, availH / 1080);
        else if (curFmt === "feed") z = Math.min(availW / 1080, (availH - 40) / 1350);
        else z = Math.min(availW / SHARED.W, 1);
        return Math.floor(z * 100);
      }
      function zoomFit() {
        ZOOM_FIT = true;
        const v = zoomFitValue();
        if (v != null) zoomApply(v);
      }
      function zoomManual(v) {
        ZOOM_FIT = false;
        zoomApply(v);
      }
      function zoomStep(dir) {
        const v = zoomGet();
        const next =
          dir > 0
            ? ZOOM_STEPS.find((s) => s > v)
            : [...ZOOM_STEPS].reverse().find((s) => s < v);
        if (next != null) zoomManual(next);
      }

      (function initZoom() {
        const start = () => {
          const $id = (i) => document.getElementById(i);
          if (!$id("zoom") || !$id("zoomFit")) return;
          $id("zoomOut").onclick = () => zoomStep(-1);
          $id("zoomIn").onclick = () => zoomStep(1);
          $id("zoomFit").onclick = () => zoomFit();
          $id("zoom100").onclick = () => zoomManual(100);

          const sw0 = switchFmt;
          switchFmt = function () {
            const r = sw0.apply(this, arguments);
            if (ZOOM_FIT) zoomFit();
            return r;
          };
          const center = document.querySelector("main.center");
          if (center) {
            /* Ctrl(⌘)+휠 — 브라우저 확대 대신 미리보기만 */
            center.addEventListener(
              "wheel",
              (e) => {
                if (!e.ctrlKey && !e.metaKey) return;
                e.preventDefault();
                zoomStep(e.deltaY < 0 ? 1 : -1);
              },
              { passive: false },
            );
            /* 창 크기·좌측 패널 폭이 바뀌거나, 설정 화면이 닫혀 처음 보일 때 */
            if (typeof ResizeObserver !== "undefined")
              new ResizeObserver(() => {
                if (ZOOM_FIT) zoomFit();
              }).observe(center);
          }
          window.addEventListener("resize", () => {
            if (ZOOM_FIT) zoomFit();
          });
          zoomFit();
        };
        if (document.readyState === "loading")
          document.addEventListener("DOMContentLoaded", start);
        else start();
      })();
