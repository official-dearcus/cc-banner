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
        /* 고른 항목만 만든다 (27-export-pick). 안 고른 건 그리지도 않는다. */
        const want = (k) => (typeof dlHas === "function" ? dlHas(k) : true);

        // 상세: 기존 draw 는 #preview 를 쓰므로 오프스크린으로 재현
        //  ⚠ drawDetailTo(ctx, W, th) — W 를 빼먹으면 히어로 좌표가 전부 NaN 이 되어
        //    createLinearGradient 가 non-finite 로 터진다(미리보기는 W 를 넘기므로 멀쩡).
        if (want("detail"))
          out.push({
            channel: "Detail",
            name: `${baseName()}_Detail.png`,
            canvas: renderOff(SHARED.W, canvasH(), (ctx) =>
              drawDetailTo(ctx, SHARED.W, TH()),
            ),
          });
        // 썸네일
        if (want("thumb"))
          out.push({
            channel: "Detail",
            name: `${baseName()}_Thumb.png`,
            canvas: renderOff(1080, 1080, (ctx) => drawThumb(ctx, th)),
          });
        // 피드 N장
        if (want("feed")) {
          const n = feedCount();
          for (let i = 0; i < n; i++)
            out.push({
              channel: "Insta",
              name: `${baseName()}_Feed${i + 1}.png`,
              canvas: renderOff(1080, 1350, (ctx) => drawFeedSlide(ctx, i, th)),
            });
        }
        out.push(...buildSectionImages(th, want));
        return out;
      }

      /* ---------- 섹션별 이미지 ----------
         상세 한 장을 통째로 받는 대신, 이벤트 안내만 따로 쓰고 싶을 때가 있다.
         섹션 목록(26-section-order)을 그대로 쓰므로 순서를 바꿔도 따라간다. */
      function exportSections() {
        const legacy = !(typeof nvIsOn === "function" && nvIsOn());
        const order = legacy
          ? (typeof legacySecOrder === "function" ? legacySecOrder() : [])
          : (typeof nvSecOrder === "function" ? nvSecOrder() : []);
        const defs = {};
        if (!legacy && typeof NV_SECTIONS !== "undefined")
          for (const k of Object.keys(NV_SECTIONS)) defs[k] = NV_SECTIONS[k];
        if (legacy && typeof LEGACY_SECTIONS !== "undefined")
          for (const k of Object.keys(LEGACY_SECTIONS)) defs[k] = LEGACY_SECTIONS[k];
        /* ⚠ 예전엔 키마다 feedPlanBySection() 을 다시 계산했다.
             섹션이 6개면 전체 피드 계획을 6번 만든 셈이라
             "받을 항목" 을 그릴 때만 글자 폭 계산이 3천 번 넘게 돌았다.
             한 번만 만들어 놓고 찾아 쓴다. */
        let plan = [];
        try {
          if (typeof feedPlanBySection === "function") plan = feedPlanBySection();
        } catch (e) {
          plan = [];
        }
        const feedN = (k) => {
          const g = plan.find((x) => x.key === k);
          return g ? g.idxs.length : 0;
        };
        /* 피드 전용 섹션(써볼래요)은 상세 높이가 0 이라 여기서 걸러지면 안 된다 */
        return order
          .map((k) => ({ key: k, def: defs[k], detailH: (defs[k] && defs[k].h()) || 0, feedN: feedN(k) }))
          .filter((s) => s.def && (s.detailH > 0 || s.feedN > 0));
      }
      const SEC_FILE = {
        main: "Hero", option: "Option", scent: "Scent",
        color: "Color", event: "Event", try: "TryEvent",
      };
      function buildSectionImages(th, want) {
        const out = [];
        const W = SHARED.W;
        /* 상세 — 섹션 하나씩 */
        for (const s of exportSections()) {
          if (!want(`sec:${s.key}:d`)) continue;
          const h = Math.round(s.detailH);
          if (h <= 0) continue; // 피드 전용 섹션은 상세 파일이 없다
          out.push({
            channel: "Sections",
            name: `${baseName()}_Detail_${SEC_FILE[s.key] || s.key}.png`,
            canvas: renderOff(W, h, (ctx) => s.def.draw(ctx, W, th)),
          });
        }
        /* 피드 — 섹션이 차지하는 장들. 한 섹션이 여러 장일 수 있다(옵션·이벤트) */
        const plan = typeof feedPlanBySection === "function" ? feedPlanBySection() : [];
        for (const g of plan) {
          if (!want(`sec:${g.key}:f`)) continue;
          g.idxs.forEach((idx, i) => {
            out.push({
              channel: "Sections",
              name:
                `${baseName()}_Feed_${SEC_FILE[g.key] || g.key}` +
                (g.idxs.length > 1 ? i + 1 : "") + ".png",
              canvas: renderOff(1080, 1350, (ctx) => drawFeedSlide(ctx, idx, th)),
            });
          });
        }
        return out;
      }

      /* ---------- 세션(셀러 1명) 전체 빌드 ----------
   선택한 제품군을 하나씩 열어 이미지를 만든다.
   ⚠ 검증이 중요하다: warnings() 는 "지금 열려 있는 제품군"만 본다.
      탭을 안 열어본 제품군은 검증 없이 ZIP 에 들어갈 뻔했다. */
      function inSession() {
        return (
          typeof SESSION !== "undefined" &&
          SESSION.started &&
          SESSION.groups.length > 0
        );
      }
      async function buildSessionImages(onStep) {
        const back = state.group;
        const files = [];
        const bad = [];
        const gs = G();
        for (let i = 0; i < SESSION.groups.length; i++) {
          const k = SESSION.groups[i];
          const label = (gs[k] && gs[k].label) || k;
          if (onStep) onStep(label, i + 1, SESSION.groups.length);
          gotoGroup(k);
          await loadSheetImages(); // 탭을 안 열어봤다면 여기서 이미지가 들어온다
          if (!warnings()) {
            bad.push(label);
            continue;
          }
          const imgs = await buildAllImages();
          imgs.forEach((it) => files.push(it));
        }
        gotoGroup(back);
        return { files, bad };
      }

      function sessionZipName() {
        const who = safe(SESSION.sellerKo || SESSION.sellerEn || "seller");
        const p =
          SESSION.d1 && SESSION.d2
            ? `${SESSION.d1.replace(/-/g, "")}-${SESSION.d2.replace(/-/g, "")}`
            : "nodate";
        return `${who}_${p}.zip`;
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
        /* 단일 제품군일 때만 여기서 미리 막는다.
           세션 모드는 제품군마다 따로 검증한다. */
        if (!inSession() && !warnings()) return;
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
          const multi = inSession();
          let imgs, bad = [], zipName;
          if (multi) {
            const r = await buildSessionImages((label, i, n) => {
              btn.textContent = `${label} 생성 중… (${i}/${n})`;
            });
            imgs = r.files;
            bad = r.bad;
            zipName = sessionZipName();
            if (bad.length) {
              const sum = $("#dlSum");
              if (sum)
                sum.innerHTML =
                  `<b>${bad.join(", ")}</b> 제품군에 오류가 있어 제외했습니다. ` +
                  `해당 탭을 열어 경고를 확인하세요.`;
            }
            if (!imgs.length) {
              status("모든 제품군에 오류가 있어 만들 수 있는 이미지가 없습니다", 1);
              return;
            }
          } else {
            imgs = await buildAllImages();
            zipName = `${baseName()}_전체.zip`;
          }

          const zip = new JSZip();
          for (const it of imgs) {
            const b64 = it.canvas.toDataURL("image/png").split(",")[1];
            /* 채널이 바깥 폴더: Detail/ 에 상세·썸네일, Insta/ 에 피드 */
            const path = it.channel ? `${it.channel}/${it.name}` : it.name;
            zip.file(path, b64, { base64: true });
          }
          const blob = await zip.generateAsync({ type: "blob" });
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = zipName;
          a.click();
          setTimeout(() => URL.revokeObjectURL(a.href), 4000);
          pushHist();
          status(
            `ZIP 다운로드 완료 — ${imgs.length}장 (${EXPORT_SCALE}x)` +
              (bad.length ? ` · 오류 ${bad.length}건 제외` : ""),
          );
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
