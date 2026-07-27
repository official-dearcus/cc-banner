/* CC 배너 제너레이터 — 18-validate
   원본 index.html 에서 기능별로 분리. 로드 순서가 곧 실행 순서다. */
      /* ---------- 검증 ---------- */
      function checkSeller() {
        const bad =
          state.tpl === "01" && state.seller && !LATIN.test(state.seller);
        $("#seller").classList.toggle("bad", bad);
        const h = $("#sellerHint");
        h.className = "hint" + (bad ? " err" : "");
        h.innerHTML = bad
          ? "템플릿 01의 셀러명 서체(High Summit)에는 <b>한글 글리프가 없습니다</b>. 영문으로 바꾸거나 템플릿 02를 사용하세요."
          : state.tpl === "01"
            ? "영문만 가능 (High Summit 손글씨체)"
            : "한글 가능 (Pretendard)";
        return !bad;
      }
      function warnings() {
        const w = [];
        if (!state.tpl) {
          w.push([
            "err",
            "템플릿 미등록",
            `${G()[state.group].label} 제품군에 등록된 템플릿이 없습니다.`,
          ]);
          $("#warnList").innerHTML = w
            .map(
              ([k, t, m]) => `<div class="warnbox ${k}"><b>${t}</b>${m}</div>`,
            )
            .join("");
          $("#dlBtn").disabled = true;
          return false;
        }
        if (!state.hero)
          w.push([
            "warn",
            state.tpl === "02" ? "제품 이미지 없음" : "히어로 이미지 없음",
            state.tpl === "02"
              ? "그라데이션만 표시됩니다."
              : "폴백 컬러로 표시됩니다.",
          ]);
        if (anyTainted()) {
          const which = [
            state.heroTainted ? "히어로" : null,
            state.rows.some((r) => r.thumbTainted) ? "썸네일" : null,
          ]
            .filter(Boolean)
            .join("·");
          const detail = PROXY_ERR
            ? `<b>프록시가 실패했습니다:</b><div class="errdetail">${esc(PROXY_ERR)}</div>`
            : `→ <b>이미지 프록시 URL</b>을 설정하거나, CORS 허용 스토리지로 옮기거나, <b>직접 업로드</b>를 쓰세요.`;
          w.push([
            "err",
            "PNG 저장 불가 — 이미지 CORS 미허용",
            `${which} 이미지 서버가 <b>Access-Control-Allow-Origin</b> 헤더를 주지 않습니다.<br/>${detail}`,
          ]);
        }
        if (state.tpl === "01" && state.seller && !LATIN.test(state.seller))
          w.push([
            "err",
            "셀러명 한글",
            "템플릿 01은 영문 전용입니다 (High Summit).",
          ]);
        if (!state.seller) w.push(["warn", "셀러명 미입력", ""]);
        if (!state.d1 || !state.d2) w.push(["warn", "공구 기간 미입력", ""]);
        else if (new Date(state.d2) < new Date(state.d1))
          w.push(["err", "기간 오류", "종료일이 시작일보다 빠릅니다."]);
        state.rows.forEach((r, i) => {
          if (r.sale > r.normal)
            w.push(["err", `카드 ${i + 1} 가격 오류`, "판매가 > 정상가"]);
          if (!r.normal) w.push(["err", `카드 ${i + 1} 정상가 없음`, ""]);
        });
        if (!state.rows.length) w.push(["err", "카드 없음", ""]);
        if (!w.length) w.push(["ok", "이상 없음", "다운로드 준비 완료."]);
        $("#warnList").innerHTML = w
          .map(([k, t, m]) => `<div class="warnbox ${k}"><b>${t}</b>${m}</div>`)
          .join("");
        const blocked = w.some((x) => x[0] === "err");
        $("#dlBtn").disabled = blocked;
        return !blocked;
      }
      function status(m, e) {
        const el = $("#statusline");
        el.textContent = m;
        el.style.color = e ? "var(--err)" : "var(--ink-soft)";
      }
