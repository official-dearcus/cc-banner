/* CC 배너 제너레이터 — 30-nav
   좌측 세로 탭 (2026-09-03 재구성)

   패널 항목이 14개까지 늘어 한 화면에 안 들어온다. 네 갈래로 나눈다.
     제품군   제품군 목록 · 테마 통일 · 행사 정보 수정
     데이터   시트·셀러·기간·가격 카드·이벤트 등 내용을 채우는 것들
     템플릿   템플릿 · 컬러 · 히어로 이미지 — 보이는 방식
     순서     상세 섹션 순서

   각 블록은 index.html 의 data-nav 로 어디 속하는지 적혀 있다.
   ⚠ 블록을 숨기기만 한다 — 옮기지 않는다. 기존 코드가 id 로 찾아 쓰기 때문에
     DOM 에서 빼면 여기저기 깨진다. hidden 만 토글한다.
   번호는 renumberBlocks() 가 "보이는 것만" 세므로 탭마다 1부터 다시 매겨진다. */

      const NAV_TABS = [
        { key: "group", label: "제품군" },
        { key: "data", label: "데이터" },
        { key: "tpl", label: "템플릿" },
        { key: "order", label: "순서" },
      ];
      const NAV_KEY = "ccb.nav.v1";
      let NAV_CUR = "group";
      try {
        const s = localStorage.getItem(NAV_KEY);
        if (s && NAV_TABS.some((t) => t.key === s)) NAV_CUR = s;
      } catch (e) {}

      function navSet(key) {
        if (!NAV_TABS.some((t) => t.key === key)) return;
        NAV_CUR = key;
        try {
          localStorage.setItem(NAV_KEY, key);
        } catch (e) {}
        navApply();
      }
      function navApply() {
        const rail = document.getElementById("rail");
        if (rail)
          rail.querySelectorAll("button").forEach((b) =>
            b.classList.toggle("on", b.dataset.nav === NAV_CUR),
          );
        /* 제품군 목록은 "제품군" 탭에서만 */
        const gnav = document.getElementById("gnav");
        if (gnav) gnav.classList.toggle("navoff", NAV_CUR !== "group");
        /* 블록 보이기/숨기기 — 원래 hidden 이던 건 건드리지 않는다
           (하단 카피처럼 템플릿에 따라 스스로 숨는 블록이 있다) */
        document.querySelectorAll(".col.left .block[data-nav]").forEach((b) => {
          b.classList.toggle("navoff", b.dataset.nav !== NAV_CUR);
        });
        /* "디자인 템플릿" 구분선은 .fig 화면구성에 없다 — 탭으로 나뉘어 필요 없어졌다.
           [전부 접기] 버튼도 같이 사라진다(줄을 눌러 하나씩 연다). */
        document.querySelectorAll(".col.left .secdiv").forEach((d) => {
          d.classList.add("navoff");
        });
        /* 누볼라 추가 블록(#nvBlocks) — 안내 문구·사이즈 안내는 "내용"이라 데이터 탭.
           ⚠ 안쪽 .block 에도 표시해야 한다. 안 하면 다른 탭에서 번호만 먹고
             화면엔 안 보여서 번호가 건너뛴다(7번 실종, 2026-09-03 신고). */
        const nb = document.getElementById("nvBlocks");
        if (nb) {
          const off = NAV_CUR !== "data";
          nb.classList.toggle("navoff", off);
          nb.querySelectorAll(".block").forEach((b) =>
            b.classList.toggle("navoff", off),
          );
        }
        if (typeof renumberBlocks === "function") renumberBlocks();
        /* 탭 제목 (.fig 화면구성) — 데이터·템플릿 탭은 제목이 없다 */
        const ti = document.getElementById("navTitle");
        if (ti) {
          const n = (SESSION && SESSION.groups && SESSION.groups.length) || 0;
          /* 제품군 목록은 자기 제목("제품군 N개")을 이미 그린다 → 겹치지 않게 비운다 */
          ti.textContent = NAV_CUR === "order" ? "드래그로 이동" : "";
          ti.hidden = !ti.textContent;
        }
      }
      function navRender() {
        const rail = document.getElementById("rail");
        if (!rail) return;
        rail.innerHTML = NAV_TABS.map(
          (t) =>
            `<button type="button" data-nav="${t.key}">${esc(t.label)}</button>`,
        ).join("");
        rail.querySelectorAll("button").forEach((b) => {
          b.onclick = () => navSet(b.dataset.nav);
        });
        navApply();
      }
      (function initNav() {
        const start = () => {
          navRender();
          /* 제품군을 고르면 자연스럽게 데이터 탭으로 넘어간다 */
          const gnav = document.getElementById("gnav");
          if (gnav)
            gnav.addEventListener("click", (e) => {
              if (e.target.closest(".gt")) navSet("data");
            });
          /* 다른 코드가 블록을 새로 그리면(템플릿 전환 등) 다시 맞춘다 */
          const host = document.getElementById("nvBlocks");
          if (host && typeof MutationObserver !== "undefined")
            new MutationObserver(() => navApply()).observe(host, {
              childList: true,
            });
        };
        if (document.readyState === "loading")
          document.addEventListener("DOMContentLoaded", start);
        else start();
      })();
