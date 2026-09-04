/* CC 배너 제너레이터 — 24-panel-collapse
   좌측 편집 패널의 각 섹션을 접었다 폈다 한다.

   섹션 개수가 11개까지 늘어 한 화면에 안 들어온다. 헤더(label.h)를 눌러
   접으면 지금 손대는 곳만 펴 두고 쓸 수 있다.

   · 접힘 상태는 localStorage 에 남는다 — 새로고침해도 그대로.
   · 각 섹션은 안의 컨트롤이 아니라 헤더만 클릭 대상이다.
   · 키보드로도 열린다(Enter/Space). aria-expanded 로 상태를 알린다.
   · 블록이 나중에 생겨도(#nvBlocks 는 템플릿마다 다시 그려진다) 다시 붙인다. */

      const COLLAPSE_KEY = "ccb.collapsed.v1";
      let COLLAPSED = {};
      try {
        COLLAPSED = JSON.parse(localStorage.getItem(COLLAPSE_KEY) || "{}") || {};
      } catch (e) {
        COLLAPSED = {};
      }
      function saveCollapsed() {
        try {
          localStorage.setItem(COLLAPSE_KEY, JSON.stringify(COLLAPSED));
        } catch (e) {
          /* 사파리 프라이빗 모드 등 — 저장만 못 할 뿐 동작은 한다 */
        }
      }
      /* 섹션을 구분할 키. id 가 있으면 id, 없으면 헤더 글자를 쓴다.
         (헤더 글자는 템플릿에 따라 바뀔 수 있어 id 를 먼저 본다) */
      function blockKey(block, head) {
        if (block.id) return block.id;
        const num = head.querySelector(".num");
        if (num && num.textContent.trim()) return "n" + num.textContent.trim();
        return (head.textContent || "").trim().slice(0, 20);
      }
      function applyCollapse(block, on) {
        const head = block.querySelector(":scope > label.h");
        if (!head) return;
        block.classList.toggle("collapsed", !!on);
        head.setAttribute("aria-expanded", on ? "false" : "true");
      }
      function bindCollapse(root) {
        const scope = root || document;
        /* 좌·우 패널의 모든 토글이 대상이다 (화살표·동작 통일 2026-09-04) */
        scope.querySelectorAll(".block > label.h").forEach((head) => {
          if (head.dataset.clpBound) return;
          const block = head.parentElement;
          const key = blockKey(block, head);
          head.dataset.clpBound = "1";
          head.dataset.clpKey = key;
          head.setAttribute("role", "button");
          head.setAttribute("tabindex", "0");
          /* 화살표는 헤더 맨 뒤에 붙인다 — 기존 내용(번호·제목·개수)은 그대로 둔다 */
          if (!head.querySelector(".clp")) {
            const car = document.createElement("i");
            car.className = "clp";
            car.setAttribute("aria-hidden", "true");
            head.appendChild(car);
          }
          const toggle = () => {
            const now = !block.classList.contains("collapsed");
            /* ⚠ 예전엔 펼침을 지웠는데, 이제 기본이 "접힘"이라
                 지우면 다음에 다시 접힌다 → 양쪽 다 기록한다. */
            COLLAPSED[key] = now;
            saveCollapsed();
            applyCollapse(block, now);
          };
          head.addEventListener("click", toggle);
          head.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggle();
            }
          });
          /* 처음 보는 블록은 접어 둔다 (.fig 화면구성 — 줄 목록으로 보인다).
             제품군·순서 탭은 내용 자체가 목록이라 편다. 2026-09-03
             템플릿 탭도 펼쳐 둔다 — 항목이 셋뿐이고 고르는 화면이라
             접혀 있으면 매번 열어야 한다 (요청 2026-09-04). */
          const nav = block.dataset.nav;
          /* 우측 패널(상태·경고 · 생성 이력)도 접힌 채 시작한다 */
          const right = !!block.closest(".col.right");
          const startClosed = nav === "data" || right;
          const saved = COLLAPSED[key];
          applyCollapse(block, saved === undefined ? startClosed : !!saved);
        });
      }
      /* 전부 펴기 / 접기 */
      function setAllCollapsed(on) {
        document.querySelectorAll(".block > label.h").forEach((head) => {
          const block = head.parentElement;
          const key = head.dataset.clpKey || blockKey(block, head);
          if (on) COLLAPSED[key] = true;
          else delete COLLAPSED[key];
          applyCollapse(block, on);
        });
        saveCollapsed();
      }
      /* #nvBlocks 는 템플릿을 바꿀 때마다 새로 그려진다 → 다시 붙인다 */
      function watchPanelBlocks() {
        const host = document.getElementById("nvBlocks");
        if (!host || typeof MutationObserver === "undefined") return;
        new MutationObserver(() => bindCollapse(host)).observe(host, {
          childList: true,
        });
      }
      (function initCollapse() {
        const start = () => {
          bindCollapse(document);
          watchPanelBlocks();
          const all = document.getElementById("clpAll");
          if (all)
            all.onclick = () => {
              /* 하나라도 펴져 있으면 전부 접고, 다 접혀 있으면 전부 편다 */
              const anyOpen = [...document.querySelectorAll(".block")].some(
                (b) =>
                  b.querySelector(":scope > label.h") &&
                  !b.classList.contains("collapsed"),
              );
              setAllCollapsed(anyOpen);
              all.textContent = anyOpen ? "전부 펴기" : "전부 접기";
            };
        };
        if (document.readyState === "loading")
          document.addEventListener("DOMContentLoaded", start);
        else start();
      })();
