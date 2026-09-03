/* CC 배너 제너레이터 — 29-perf
   다시 그리기를 한 프레임으로 모은다.

   문제
     draw() 한 번이 하는 일이 크다 —
       상세 캔버스 전체(높이 3000~5000px)
       + 썸네일/피드 탭이 열려 있으면 그 슬라이드 전부(1080×1350 × N)
       + 패널 세 곳 다시 그리기(섹션 순서 · 받을 항목 · 써볼래요)
     그런데 이미지가 하나 로드될 때마다 draw() 를 부른다.
     선물 10개짜리 행사면 로딩 중에 draw() 가 10번 넘게 돈다.

   해결
     draw() 를 예약제로 바꾼다. 같은 프레임에 여러 번 불려도 실제 그리기는 한 번.
     ⚠ 이 파일은 맨 마지막에 로드돼야 한다 — 26·27·28 이 draw 를 감싸 놓았고,
       그 감싼 결과까지 통째로 예약 대상으로 잡아야 패널 재렌더도 같이 줄어든다.
     즉시 그려야 하는 곳(내보내기 직전 등)은 drawNow() 를 쓴다. */

      (function initDrawScheduler() {
        if (typeof draw !== "function") return;
        const real = draw;
        let queued = false;
        let raf = null;

        /* 예약된 그리기를 지금 당장 실행한다 */
        function flush() {
          raf = null;
          if (!queued) return;
          queued = false;
          real();
        }
        /* 예약을 건너뛰고 바로 그린다 (내보내기처럼 결과가 즉시 필요할 때) */
        window.drawNow = function () {
          queued = false;
          if (raf != null) {
            (window.cancelAnimationFrame || clearTimeout)(raf);
            raf = null;
          }
          real();
        };
        draw = function () {
          queued = true;
          if (raf != null) return;
          raf =
            typeof requestAnimationFrame === "function"
              ? requestAnimationFrame(flush)
              : setTimeout(flush, 16);
        };
        /* 내보내기는 화면이 아니라 오프스크린에 다시 그리므로 예약과 무관하지만,
           눌린 시점의 상태가 확실히 반영되도록 한 번 비워 준다. */
        const btn = document.getElementById("dlBtn");
        if (btn) btn.addEventListener("mousedown", () => window.drawNow(), true);
      })();

      /* 이미지 로드가 끝났을 때 부르는 공용 함수.
         지금은 draw() 가 이미 예약제라 draw 와 같지만, 호출부가
         "로딩 때문에 다시 그린다"는 뜻을 드러내도록 이름을 따로 둔다. */
      function redrawAfterLoad() {
        if (typeof draw === "function") draw();
      }
