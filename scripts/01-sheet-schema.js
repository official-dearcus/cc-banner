/* CC 배너 제너레이터 — 01-sheet-schema
   원본 index.html 에서 기능별로 분리. 로드 순서가 곧 실행 순서다. */
      /* ===== Google Sheet 데이터 레이어 (명세서 §1) ===== */
      /* ============================================================
   Google Sheet 데이터 레이어 (명세서 §1)
   ============================================================ */

      /* ---- §1.2.2 오류 코드 표준화 ----
   user: 요청자용 문구 / admin: 관리자용 상세 */
      const ERR = {
        E101: {
          user: "시트에 연결할 수 없습니다. 관리자에게 문의하세요.",
          admin: "HTTP 요청 실패 (네트워크/URL 오류)",
        },
        E102: {
          user: "시트에 접근할 수 없습니다. 공유 설정을 확인해 주세요.",
          admin: "403/404 — 문서 미게시 또는 권한 없음",
        },
        E103: {
          user: "시트 형식을 읽을 수 없습니다.",
          admin: "CSV 파싱 실패 또는 빈 응답",
        },
        E104: {
          user: "브라우저 보안(CORS)에 막혀 시트를 읽지 못했습니다.",
          admin:
            "fetch 자체가 차단됨 — 응답 헤더 없음. 해당 URL이 CORS를 허용하지 않거나 file:// 에서 실행 중",
        },
        E110: { user: "시트 탭을 찾을 수 없습니다.", admin: "gid/탭명 불일치" },
        E201: {
          user: "필수 항목이 비어 있는 행이 있습니다.",
          admin: "필수 컬럼 누락",
        },
        E202: {
          user: "가격이 숫자가 아닌 행이 있습니다.",
          admin: "숫자 타입 변환 실패",
        },
        E203: {
          user: "이미지 주소 형식이 올바르지 않습니다.",
          admin: "URL 형식 위반 (http/https 아님)",
        },
        E204: {
          user: "판매가가 정상가보다 큰 행이 있습니다.",
          admin: "salePrice > normalPrice",
        },
        E205: {
          user: "시트에 필요한 열이 없습니다.",
          admin: "헤더에 필수 컬럼 없음",
        },
        E206: {
          user: "허용되지 않은 값이 입력된 행이 있습니다.",
          admin: "enum 허용값 위반",
        },
        E301: {
          user: "이 제품군에 사용할 템플릿이 없습니다.",
          admin: "TemplateMaster에 매핑 없음 또는 enabled=FALSE",
        },
        E302: {
          user: "등록되지 않은 템플릿이 지정됐습니다.",
          admin: "templateId가 design.md에 없음",
        },
        E303: {
          user: "색상 데이터에 문제가 있습니다.",
          admin: "ColorMaster 행 확인 필요",
        },
      };
      function mkErr(code, detail, row) {
        const e = ERR[code] || { user: "알 수 없는 오류", admin: code };
        return {
          code,
          user: e.user,
          admin: e.admin + (detail ? ` — ${detail}` : ""),
          row: row ?? null,
        };
      }

      /* ---- 스키마 정의 (§1.2.1) ---- */
      const SCHEMA = {
        ProductMaster: {
          required: ["groupKey", "normalPrice", "salePrice"], // 제품명은 name 또는 name1 (아래에서 검증)
          columns: {
            groupKey: { type: "string" },
            // 그룹 레벨 필드 — 시트에서 첫 행에만 적는 게 일반적이므로 행 단위로는 optional.
            // 대신 buildGroups()에서 그룹 단위로 검증한다.
            groupLabel: { type: "string", group: true, optional: true },
            seriesTitle: { type: "string", group: true, optional: true }, // 01 한글 헤딩
            optionTitleEn: { type: "string", group: true, optional: true }, // 02 영문 헤딩
            heroUrl: { type: "url", group: true, optional: true },
            normalLabel: {
              type: "string",
              group: true,
              optional: true,
              default: "정상가",
            },
            saleLabel: {
              type: "string",
              group: true,
              optional: true,
              default: "혜택가",
            }, // 특가 / 라리홈 특가 등
            // 이 제품이 어느 색상 줄을 쓰는지 (ColorMaster.line 과 같은 값).
            // 지정하면 옵션 카드의 Color 줄이 "선택한 색상"으로 자동 채워진다.
            colorLine: { type: "string", optional: true },
            // ── 누볼라 계열 전용(선택) ──
            noticeText: { type: "string", group: true, optional: true }, // 옵션 하단 안내 문구
            sizeInfoUrl: { type: "url", group: true, optional: true }, // 사이즈 안내 이미지
            colorTitle: { type: "string", group: true, optional: true }, // 컬러 섹션 제목(그룹 공통 폴백) — 템플릿별은 TemplateMaster 사용
            sortOrder: { type: "number", optional: true },
            // 제품명 = 텍스트 노드 1개. 피그마에서 폭 안에서 자동 줄바꿈됨.
            // name 권장. 구 시트 호환을 위해 name1/name2 가 있으면 공백으로 합침.
            name: { type: "string", optional: true },
            name1: { type: "string", optional: true },
            name2: { type: "string", optional: true },
            // 옵션 상세 — 0~N개 블록. 셀 안에서 줄바꿈(Alt+Enter)으로 구분.
            //   "1롤당 663원"                        -> 라벨 없는 한 줄
            //   "Color: 화이트 | 핑크 | 딥그린 | 블랙"  -> 라벨 + 값
            optionInfo: { type: "attrs", optional: true },
            normalPrice: { type: "number" },
            salePrice: { type: "number" },
            thumbUrl: { type: "url", optional: true },
            badge: {
              type: "enum",
              values: ["none", "renewal", "new"],
              optional: true,
              default: "none",
            },
          },
        },
        TemplateMaster: {
          required: ["groupKey", "templateId"],
          columns: {
            groupKey: { type: "string" },
            templateId: { type: "string" }, // bamboo500_01 | bamboo500_02
            templateLabel: { type: "string", optional: true },
            themes: { type: "list", optional: true }, // "pink,blue"
            // 히어로 타이틀은 템플릿마다 다름 (01=영문 세리프 / 02=한글 그라데이션)
            // 셀 안 줄바꿈(Alt+Enter)으로 2줄 지정
            heroTitle: { type: "lines", optional: true },
            bottomCopy: { type: "string", optional: true }, // 02 하단 카피 바
            bottomCopyBold: { type: "string", optional: true }, // 굵게 처리할 뒷부분
            gridUrls: { type: "list", optional: true }, // 03 상단 이미지 4컷 (쉼표 구분)
            noticeText: { type: "string", optional: true }, // 옵션 하단 안내 문구
            sizeInfoUrl: { type: "url", optional: true }, // 사이즈 안내 이미지
            optionTitle: { type: "string", optional: true }, // 옵션 섹션 제목 (템플릿마다 다름)
            colorTitle: { type: "string", optional: true }, // 컬러 섹션 제목 (템플릿마다 다름)
            previewUrl: { type: "url", optional: true },
            enabled: { type: "bool", optional: true, default: true },
            sortOrder: { type: "number", optional: true },
          },
        },
        /* 히어로 이미지 라이브러리 — 템플릿마다 필요한 이미지 성격이 다름
     01 = 연출컷(화면 전체 cover) / 02 = 누끼컷(그라데이션 위에 얹힘) */
        /* 색상 라이브러리 — 제품군별 선택 가능한 색상 목록
           line: 줄 구분 키(자유값). 같은 값끼리 한 줄로 묶인다.
                 비워두면 전부 한 줄. 예) kids/adult, 또는 그냥 비움
           lineLabel: 줄 앞에 굵게 붙는 이름. 비우면 kids→키즈, adult→성인 자동 */
        ColorMaster: {
          required: ["groupKey", "colorKey", "label", "url"],
          columns: {
            groupKey: { type: "string" },
            line: { type: "string", optional: true },
            lineLabel: { type: "string", optional: true },
            colorKey: { type: "string" },
            label: { type: "string" },
            url: { type: "url" },
            enabled: { type: "bool", optional: true, default: true },
            sortOrder: { type: "number", optional: true },
          },
        },
        HeroMaster: {
          required: ["groupKey", "url"],
          columns: {
            groupKey: { type: "string" },
            templateId: { type: "string", optional: true }, // 비우면 해당 제품군 전체 템플릿에서 선택 가능
            label: { type: "string", optional: true },
            url: { type: "url" },
            enabled: { type: "bool", optional: true, default: true },
            sortOrder: { type: "number", optional: true },
          },
        },
      };

      /* ---- CSV 파서 (따옴표/줄바꿈/콤마 처리) ---- */
      function parseCSV(text) {
        if (!text || !text.trim()) return [];
        const rows = [];
        let row = [],
          cell = "",
          q = false;
        for (let i = 0; i < text.length; i++) {
          const c = text[i],
            n = text[i + 1];
          if (q) {
            if (c === '"' && n === '"') {
              cell += '"';
              i++;
            } else if (c === '"') {
              q = false;
            } else cell += c;
          } else {
            if (c === '"') q = true;
            else if (c === ",") {
              row.push(cell);
              cell = "";
            } else if (c === "\r") {
              /* skip */
            } else if (c === "\n") {
              row.push(cell);
              rows.push(row);
              row = [];
              cell = "";
            } else cell += c;
          }
        }
        if (cell.length || row.length) {
          row.push(cell);
          rows.push(row);
        }
        return rows.filter((r) => r.some((c) => String(c).trim() !== ""));
      }

      /* ---- 옵션 상세 파서 ----
   셀 안 줄바꿈으로 블록 구분. "라벨: 값" 이면 라벨 있는 블록, 콜론 없으면 값만.
     "1롤당 663원"                        -> [{label:null, value:"1롤당 663원"}]
     "Color: 화이트 | 핑크\nSize: 170mm"   -> [{label:"Color",...},{label:"Size",...}] */
      function parseAttrs(raw) {
        const s = String(raw ?? "").trim();
        if (!s) return [];
        return s
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean)
          .map((line) => {
            const m = line.match(/^([^:：]{1,20})[:：]\s*(.+)$/);
            return m
              ? { label: m[1].trim(), value: m[2].trim() }
              : { label: null, value: line };
          });
      }

      /* ---- 타입 캐스팅/검증 ---- */
      const isUrl = (v) => /^https?:\/\/[^\s]+$/i.test(String(v).trim());
      function castValue(raw, def, colName, rowNo, errs) {
        const v = String(raw ?? "").trim();
        if (v === "") {
          if (def.optional)
            return def.default !== undefined
              ? def.default
              : def.type === "list" ||
                  def.type === "attrs" ||
                  def.type === "lines"
                ? []
                : "";
          errs.push(mkErr("E201", `${colName} 비어 있음`, rowNo));
          return null;
        }
        switch (def.type) {
          case "attrs":
            return parseAttrs(v);
          case "lines":
            return v
              .split(/\r?\n/)
              .map((x) => x.trim())
              .filter(Boolean);
          case "number": {
            const n = Number(v.replace(/[,\s원]/g, ""));
            if (!isFinite(n)) {
              errs.push(mkErr("E202", `${colName}="${v}"`, rowNo));
              return null;
            }
            return n;
          }
          case "url":
            if (!isUrl(v)) {
              errs.push(mkErr("E203", `${colName}="${v}"`, rowNo));
              return null;
            }
            return v;
          case "bool":
            return !/^(false|0|no|n|아니오|미사용)$/i.test(v);
          case "list":
            return v
              .split(/[,|]/)
              .map((s) => s.trim())
              .filter(Boolean);
          case "enum": {
            const lv = v.toLowerCase();
            if (!def.values.includes(lv)) {
              errs.push(
                mkErr(
                  "E206",
                  `${colName}="${v}" (허용: ${def.values.join("/")})`,
                  rowNo,
                ),
              );
              return def.default;
            }
            return lv;
          }
          default:
            return v;
        }
      }

      /* ---- 시트 → 레코드 ---- */
      function parseSheet(csvText, schemaName) {
        const S = SCHEMA[schemaName],
          errs = [],
          out = [];
        const rows = parseCSV(csvText);
        if (!rows.length) {
          errs.push(mkErr("E103", `${schemaName} 빈 시트`));
          return { rows: [], errors: errs };
        }
        const header = rows[0].map((h) => String(h).trim());
        const missing = S.required.filter((c) => !header.includes(c));
        if (missing.length) {
          errs.push(
            mkErr("E205", `${schemaName} 누락 컬럼: ${missing.join(", ")}`),
          );
          return { rows: [], errors: errs };
        }
        const idx = {};
        header.forEach((h, i) => (idx[h] = i));

        rows.slice(1).forEach((r, i) => {
          const rowNo = i + 2; // 시트 실제 행번호 (헤더=1)
          const rec = {},
            rowErrs = [];
          for (const [col, def] of Object.entries(S.columns)) {
            if (!(col in idx)) {
              rec[col] =
                def.default !== undefined
                  ? def.default
                  : def.type === "list"
                    ? []
                    : "";
              continue;
            }
            const v = castValue(r[idx[col]], def, col, rowNo, rowErrs);
            rec[col] = v;
          }
          if (schemaName === "ProductMaster") {
            // name 없으면 name1+name2 합성 (구 시트 호환)
            if (!rec.name)
              rec.name = [rec.name1, rec.name2]
                .filter(Boolean)
                .join(" ")
                .trim();
            if (!rec.name)
              rowErrs.push(mkErr("E201", "name (또는 name1) 비어 있음", rowNo));
          }
          if (
            schemaName === "ProductMaster" &&
            rec.normalPrice != null &&
            rec.salePrice != null &&
            rec.salePrice > rec.normalPrice
          ) {
            rowErrs.push(
              mkErr("E204", `${rec.salePrice} > ${rec.normalPrice}`, rowNo),
            );
          }
          if (rowErrs.length) {
            errs.push(...rowErrs);
          } else {
            rec._row = rowNo;
            out.push(rec);
          }
        });
        return { rows: out, errors: errs };
      }

      /* ---- §1.1.2 제품군 기준 조회 ---- */
      function buildGroups(products, templates, knownTemplateIds, heroes, colors) {
        const errs = [],
          groups = {};
        for (const p of products) {
          const k = p.groupKey;
          if (!groups[k])
            groups[k] = {
              key: k,
              label: "",
              seriesTitle: "",
              optionTitleEn: "",
              heroUrl: "",
              normalLabel: "",
              saleLabel: "",
              noticeText: "",
              sizeInfoUrl: "",
              colorTitle: "",
              templates: [],
              rows: [],
              heroes: [],
              colors: [],
            };
          const g = groups[k];
          // group 레벨 필드: 첫 비어있지 않은 값 채택 (시트 비정규화 허용)
          for (const f of [
            "groupLabel",
            "seriesTitle",
            "optionTitleEn",
            "heroUrl",
            "normalLabel",
            "saleLabel",
            "noticeText",
            "sizeInfoUrl",
            "colorTitle",
          ]) {
            const t = f === "groupLabel" ? "label" : f;
            if (!g[t] && p[f]) g[t] = p[f];
          }
          g.rows.push(p);
        }
        for (const g of Object.values(groups)) {
          g.rows.sort(
            (a, b) =>
              (a.sortOrder || 0) - (b.sortOrder || 0) || a._row - b._row,
          );
        }
        for (const t of templates) {
          const g = groups[t.groupKey];
          if (!g) continue; // 제품 없는 템플릿은 무시
          if (t.enabled === false) continue;
          if (knownTemplateIds && !knownTemplateIds.includes(t.templateId)) {
            errs.push(mkErr("E302", `templateId="${t.templateId}"`, t._row));
            continue;
          }
          g.templates.push(t);
        }
        for (const g of Object.values(groups)) {
          g.templates.sort(
            (a, b) =>
              (a.sortOrder || 0) - (b.sortOrder || 0) || a._row - b._row,
          );
        }
        /* 히어로 라이브러리 매핑 */
        for (const h of heroes || []) {
          const g = groups[h.groupKey];
          if (!g) continue;
          if (h.enabled === false) continue;
          if (
            h.templateId &&
            knownTemplateIds &&
            !knownTemplateIds.includes(h.templateId)
          ) {
            errs.push(
              mkErr("E302", `HeroMaster templateId="${h.templateId}"`, h._row),
            );
            continue;
          }
          g.heroes.push(h);
        }
        for (const g of Object.values(groups)) {
          g.heroes.sort(
            (a, b) =>
              (a.sortOrder || 0) - (b.sortOrder || 0) || a._row - b._row,
          );
        }
        /* 색상 라이브러리 매핑 — line 은 자유값(빈칸 허용) */
        for (const c of colors || []) {
          const g = groups[c.groupKey];
          if (!g) continue;
          if (c.enabled === false) continue;
          g.colors.push({
            ...c,
            line: String(c.line || "").trim(),
            lineLabel: String(c.lineLabel || "").trim(),
          });
        }
        for (const g of Object.values(groups)) {
          g.colors.sort(
            (a, b) =>
              (a.sortOrder || 0) - (b.sortOrder || 0) || a._row - b._row,
          );
        }

        /* 그룹 레벨 검증 — 헤딩 필드는 '그 템플릿을 실제로 쓸 때만' 필수 (§1.2.1) */
        for (const g of Object.values(groups)) {
          if (!g.label) {
            errs.push(mkErr("E201", `groupKey="${g.key}" groupLabel 없음`));
            g.label = g.key; // 표시용 폴백
          }
          if (!g.normalLabel) g.normalLabel = "정상가";
          if (!g.saleLabel) g.saleLabel = "혜택가";
          if (!g.templates.length) {
            errs.push(mkErr("E301", `groupKey="${g.key}"`));
            continue;
          }
          const uses01 = g.templates.some((t) => t.templateId.endsWith("_01"));
          const uses02 = g.templates.some((t) => t.templateId.endsWith("_02"));
          if (uses01 && !g.seriesTitle)
            errs.push(
              mkErr(
                "E201",
                `groupKey="${g.key}" seriesTitle 없음 (템플릿 01에 필요)`,
              ),
            );
          if (uses02 && !g.optionTitleEn)
            errs.push(
              mkErr(
                "E201",
                `groupKey="${g.key}" optionTitleEn 없음 (템플릿 02에 필요)`,
              ),
            );
        }
        return { groups, errors: errs };
      }

      /* ---- 시트 URL 빌더 (§1.1.1) ---- */
      function sheetCsvUrl(docId, tabName) {
        return `https://docs.google.com/spreadsheets/d/${docId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;
      }

      if (typeof module !== "undefined")
        module.exports = {
          ERR,
          SCHEMA,
          parseCSV,
          parseSheet,
          buildGroups,
          sheetCsvUrl,
          mkErr,
          isUrl,
          parseAttrs,
        };
