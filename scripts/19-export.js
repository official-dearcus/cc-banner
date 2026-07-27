/* CC 배너 제너레이터 — 19-export
   원본 index.html 에서 기능별로 분리. 로드 순서가 곧 실행 순서다. */
      /* ---------- 다운로드 ---------- */
      let EXPORT_SCALE = 1;
      const safe = (s) =>
        String(s)
          .replace(/[^\w가-힣]+/g, "-")
          .replace(/^-+|-+$/g, "");
      function fname() {
        const p =
          state.d1 && state.d2
            ? `${state.d1.replace(/-/g, "")}-${state.d2.replace(/-/g, "")}`
            : "nodate";
        const x = EXPORT_SCALE > 1 ? `_${EXPORT_SCALE}x` : "";
        return `${safe(G()[state.group].label)}_${state.tpl}_${state.theme}_${p}${x}.png`;
      }
      $("#scaleSel")
        .querySelectorAll("button")
        .forEach(
          (b) =>
            (b.onclick = () => {
              EXPORT_SCALE = +b.dataset.x;
              $("#scaleSel")
                .querySelectorAll("button")
                .forEach((x) => x.classList.toggle("on", x === b));
              const px = SHARED.W * EXPORT_SCALE;
              status(
                `내보내기 크기: ${px}×${Math.round(canvasH() * EXPORT_SCALE)}px`,
              );
            }),
        );
      function baseName() {
        const p =
          state.d1 && state.d2
            ? `${state.d1.replace(/-/g, "")}-${state.d2.replace(/-/g, "")}`
            : "nodate";
        return `${safe(G()[state.group].label)}_${state.tpl}_${state.theme}_${p}`;
      }

      /* 오프스크린에 한 포맷을 선택 배율로 렌더 → dataURL */
      function renderOff(w, h, drawFn) {
        const c = document.createElement("canvas");
        c.width = w * EXPORT_SCALE;
        c.height = h * EXPORT_SCALE;
        const ctx = c.getContext("2d");
        ctx.scale(EXPORT_SCALE, EXPORT_SCALE);
        drawFn(ctx);
        return c;
      }
      async function buildAllImages() {
        const th = curTheme(),
          out = [];
        /* 렌더러가 없는 제품군(템플릿 미등록)에서 눌리면 좌표가 전부 비어
           엉뚱한 곳에서 터진다. 여기서 먼저 끊고 이유를 알려준다. */
        if (!state.tpl || !TH())
          throw new Error(
            "이 제품군은 아직 템플릿이 등록되지 않았습니다 — 템플릿을 먼저 선택하세요",
          );
        // 상세: 기존 draw 는 #preview 를 쓰므로 오프스크린으로 재현
        //  ⚠ drawDetailTo(ctx, W, th) — W 를 빼먹으면 히어로 좌표가 전부 NaN 이 되어
        //    createLinearGradient 가 non-finite 로 터진다(미리보기는 W 를 넘기므로 멀쩡).
        const detailH = canvasH();
        out.push({
          name: `${baseName()}_상세.png`,
          canvas: renderOff(SHARED.W, detailH, (ctx) =>
            drawDetailTo(ctx, SHARED.W, TH()),
          ),
        });
        // 썸네일
        out.push({
          name: `${baseName()}_썸네일.png`,
          canvas: renderOff(1080, 1080, (ctx) => drawThumb(ctx, th)),
        });
        // 피드 N장
        const n = feedCount();
        for (let i = 0; i < n; i++) {
          const label = i === 0 ? "피드1_히어로" : `피드${i + 1}_옵션`;
          out.push({
            name: `${baseName()}_${label}.png`,
            canvas: renderOff(1080, 1350, (ctx) => drawFeedSlide(ctx, i, th)),
          });
        }
        return out;
      }

      /* JSZip 지연 로드 — 다운로드를 실제로 누를 때만 받아온다.
   (첫 화면 로드에서 94KB 를 덜 받는다) */
      const JSZIP_CDN =
        "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
      let _zipP = null;
      function ensureJSZip() {
        if (typeof JSZip !== "undefined") return Promise.resolve();
        if (_zipP) return _zipP;
        _zipP = new Promise((res, rej) => {
          const s = document.createElement("script");
          s.src = JSZIP_CDN;
          s.onload = () => res();
          s.onerror = () => {
            _zipP = null;
            rej(new Error("jszip load failed"));
          };
          document.head.appendChild(s);
        });
        return _zipP;
      }

      $("#dlBtn").onclick = async () => {
        if (!warnings()) return;
        try {
          await ensureJSZip();
        } catch (_) {
          status("압축 라이브러리 로드 실패 — 인터넷 연결 확인", 1);
          return;
        }
        const btn = $("#dlBtn");
        btn.disabled = true;
        const old = btn.textContent;
        btn.textContent = "이미지 생성 중…";
        try {
          const imgs = await buildAllImages();
          const zip = new JSZip();
          for (const it of imgs) {
            const b64 = it.canvas.toDataURL("image/png").split(",")[1];
            zip.file(it.name, b64, { base64: true });
          }
          const blob = await zip.generateAsync({ type: "blob" });
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = `${baseName()}_전체.zip`;
          a.click();
          setTimeout(() => URL.revokeObjectURL(a.href), 4000);
          pushHist();
          status(`ZIP 다운로드 완료 — ${imgs.length}장 (${EXPORT_SCALE}x)`);
        } catch (e) {
          console.error(e);
          /* 예전에는 무슨 오류든 "외부 이미지(CORS)" 로 뭉뚱그려서
             엉뚱한 곳을 찾게 만들었다. 원인별로 구분해서 보여준다. */
          const m = String(e && e.message ? e.message : e);
          let msg;
          if (e && (e.name === "SecurityError" || /[Tt]ainted/.test(m)))
            msg =
              "저장 실패 — 외부 이미지 보안(CORS) 문제입니다. 이미지가 /api/img 로 불러와졌는지 확인하세요";
          else if (/non-finite|NaN|Infinity/.test(m))
            msg = `저장 실패 — 좌표 계산 오류(렌더러 버그). 개발자 콘솔(F12)의 내용과 함께 알려주세요: ${m}`;
          else msg = `저장 실패 — ${m}`;
          status(msg, 1);
        } finally {
          btn.disabled = false;
          btn.textContent = old;
        }
      };
