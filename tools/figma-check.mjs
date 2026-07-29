#!/usr/bin/env node
/* figma-check — 피그마와 코드가 어긋난 곳을 찾아 표로 보여준다.
 *
 *   node tools/figma-check.mjs                 실제 피그마에서 받아와 검사
 *   node tools/figma-check.mjs --json out.json 받아온 원본을 파일로 저장
 *   node tools/figma-check.mjs --from out.json 저장해둔 파일로 검사(오프라인)
 *
 * 준비물 (한 번만)
 *   1. figma.com → 우측 상단 프로필 → 설정 → 보안 → 개인 액세스 토큰 생성
 *   2. 터미널에서   export FIGMA_TOKEN=figd_xxxxx
 *      (윈도우 PowerShell:  $env:FIGMA_TOKEN="figd_xxxxx"  )
 *
 * 고치지 않는다. 알려주기만 한다. 판단은 사람이 한다.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CFG = JSON.parse(
  fs.readFileSync(path.join(HERE, "figma-check.config.json"), "utf8"),
);

/* ---------------------------------------------------------------- 피그마 받기 */
async function fetchFigma(fileKey, token) {
  const r = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
    headers: { "X-Figma-Token": token },
  });
  if (!r.ok) {
    const body = await r.text();
    if (r.status === 403)
      throw new Error("토큰이 없거나 권한이 없습니다 (FIGMA_TOKEN 확인)");
    if (r.status === 404) throw new Error("파일을 찾을 수 없습니다 (fileKey 확인)");
    throw new Error(`피그마 응답 ${r.status}: ${body.slice(0, 200)}`);
  }
  return r.json();
}

/* ------------------------------------------------------------------ 트리 훑기 */
/* 모든 노드를 { name, type, x, y, w, h, parent, children } 로 평탄화 */
function flatten(doc) {
  const all = [];
  const walk = (node, parent, depth) => {
    const b = node.absoluteBoundingBox;
    const rec = {
      id: node.id,
      name: node.name,
      type: node.type,
      depth,
      parent,
      abs: b ? { x: b.x, y: b.y, w: b.width, h: b.height } : null,
      children: [],
    };
    /* 부모 기준 상대 좌표 — 피그마 UI 가 보여주는 값과 같다 */
    if (b && parent && parent.abs) {
      rec.rel = {
        x: round(b.x - parent.abs.x),
        y: round(b.y - parent.abs.y),
        w: round(b.width),
        h: round(b.height),
      };
    } else if (b) {
      rec.rel = { x: round(b.x), y: round(b.y), w: round(b.width), h: round(b.height) };
    }
    if (parent) parent.children.push(rec);
    all.push(rec);
    (node.children || []).forEach((c) => walk(c, rec, depth + 1));
    return rec;
  };
  (doc.children || []).forEach((page) => walk(page, null, 0));
  return all;
}
const round = (n) => Math.round(n * 100) / 100;

/* 최상위 섹션(= 템플릿-포맷 단위) 모으기 */
function sections(all) {
  return all.filter((n) => n.type === "SECTION" || (n.depth === 1 && n.type === "FRAME"));
}

/* "a > b > c" 경로로 노드 찾기 */
function byPath(all, spec) {
  const parts = spec.split(">").map((s) => s.trim());
  let cands = all.filter((n) => n.name === parts[0]);
  for (let i = 1; i < parts.length; i++) {
    const next = [];
    for (const c of cands) collectDesc(c, parts[i], next);
    cands = next;
  }
  return cands;
}
function collectDesc(node, name, out) {
  for (const c of node.children) {
    if (c.name === name) out.push(c);
    collectDesc(c, name, out);
  }
}

/* ============================================================
   검사 1 — 구조 (설정 없이 자동)
   ============================================================ */
function structureChecks(all, cfg) {
  const issues = [];
  const secs = sections(all);
  const named = secs.filter((s) => /-(detail|thumb|feed)(_\w+)?$/.test(s.name));

  /* (a) 같은 이름의 섹션이 둘 이상 = 복제해놓고 안 지운 것 */
  const seen = new Map();
  for (const s of named) seen.set(s.name, (seen.get(s.name) || 0) + 1);
  for (const [n, c] of seen) if (c > 1) issues.push(["중복", `섹션 "${n}" 이 ${c}개 있습니다`]);

  /* (b) 자식 이름이 부모 템플릿과 다름 = 다른 템플릿에서 복사하고 이름 안 고친 것 */
  for (const s of named) {
    const tpl = s.name.split("-")[0];
    for (const c of s.children) {
      const ctpl = String(c.name).split("-")[0];
      if (/^(bamboo500|nuvolafamily)/.test(ctpl) && ctpl !== tpl)
        issues.push(["이름", `${s.name} 안에 "${c.name}" — 다른 템플릿 이름입니다`]);
    }
  }

  /* (c) 슬라이드 번호 빠짐·중복 (_01 _02 _03 _04) */
  for (const s of named.filter((s) => s.name.endsWith("-feed"))) {
    const nums = s.children
      .map((c) => (String(c.name).match(/_(\d+)$/) || [])[1])
      .filter(Boolean);
    const dup = nums.filter((n, i) => nums.indexOf(n) !== i);
    if (dup.length) issues.push(["슬라이드", `${s.name}: _${dup.join(", _")} 가 중복입니다`]);
    const want = Number(cfg.feedSlides || 4);
    for (let i = 1; i <= want; i++) {
      const k = String(i).padStart(2, "0");
      if (!nums.includes(k)) issues.push(["슬라이드", `${s.name}: _${k} 가 없습니다`]);
    }
  }

  /* (d) 템플릿 × 포맷 × 테마 커버리지 */
  const cov = {};
  for (const s of named) {
    const m = s.name.match(/^(.*?)-(detail|thumb|feed)(?:_(\w+))?$/);
    if (!m) continue;
    ((cov[m[1]] ||= {})[m[2]] ||= []).push(m[3] || "—");
  }
  for (const tpl of cfg.templates) {
    for (const fmt of ["detail", "thumb", "feed"]) {
      if (!cov[tpl]?.[fmt]) issues.push(["없음", `${tpl}-${fmt} 이 피그마에 없습니다 (코드는 그립니다)`]);
    }
    const have = cov[tpl]?.detail || [];
    const miss = cfg.themes.filter((t) => !have.includes(t));
    if (have.length && miss.length)
      issues.push(["테마", `${tpl}-detail: ${miss.join(", ")} 원본이 없습니다 (코드가 파생시킨 색)`]);
  }

  /* (e) 이름이 기본값인 레이어 = 나중에 찾을 수 없다 */
  const generic = all.filter((n) => /^(Frame|Group|Rectangle|Ellipse|Vector)\s*\d*$/.test(n.name));
  if (generic.length)
    issues.push(["이름", `기본 이름 레이어 ${generic.length}개 (${[...new Set(generic.map((g) => g.name))].slice(0, 5).join(", ")}…)`]);

  return { issues, cov };
}

/* ============================================================
   검사 2 — 좌표 대조 (config 의 expect 와 비교)
   ============================================================ */
function coordChecks(all, cfg) {
  const rows = [];
  for (const chk of cfg.checks || []) {
    const hits = byPath(all, chk.node);
    if (!hits.length) {
      rows.push({ node: chk.node, field: "-", fig: "없음", code: "-", ok: false, note: chk.note });
      continue;
    }
    const n = hits[0];
    for (const [field, want] of Object.entries(chk.expect)) {
      const got = n.rel?.[field];
      const ok = got !== undefined && Math.abs(got - want) <= (cfg.tolerance ?? 0.5);
      rows.push({
        node: chk.node,
        field,
        fig: got === undefined ? "?" : String(got),
        code: String(want),
        ok,
        note: chk.note,
        diff: got === undefined ? "" : round(got - want),
      });
    }
  }
  return rows;
}

/* ---------------------------------------------------------------------- 출력 */
const pad = (s, n) => String(s) + " ".repeat(Math.max(0, n - [...String(s)].reduce((a, c) => a + (c.charCodeAt(0) > 0x2000 ? 2 : 1), 0)));

function report(struct, coords, cfg) {
  console.log("\n" + "=".repeat(64));
  console.log("  피그마 ↔ 코드 대조");
  console.log("=".repeat(64));

  console.log("\n■ 구조 검사");
  if (!struct.issues.length) console.log("  문제 없음 ✅");
  else
    for (const [kind, msg] of struct.issues) console.log(`  ❌ [${pad(kind, 8)}] ${msg}`);

  console.log("\n■ 좌표 대조");
  if (!coords.length) console.log("  (config 에 checks 가 없습니다)");
  else {
    console.log(`  ${pad("노드", 42)}${pad("항목", 8)}${pad("피그마", 10)}${pad("코드", 10)}차이`);
    console.log("  " + "-".repeat(76));
    let last = "";
    for (const r of coords) {
      const label = r.node === last ? "" : r.node;
      last = r.node;
      console.log(
        `  ${pad(label.slice(0, 40), 42)}${pad(r.field, 8)}${pad(r.fig, 10)}${pad(r.code, 10)}` +
          (r.ok ? "✅" : `❌ ${r.diff > 0 ? "+" : ""}${r.diff}`),
      );
    }
  }

  const bad = struct.issues.length + coords.filter((r) => !r.ok).length;
  console.log("\n" + "-".repeat(64));
  console.log(bad ? `  손볼 곳 ${bad}건` : "  전부 일치 ✅");
  console.log("-".repeat(64) + "\n");
  return bad;
}

/* ----------------------------------------------------------------------- 실행 */
const argv = process.argv.slice(2);
const argOf = (f) => {
  const i = argv.indexOf(f);
  return i >= 0 ? argv[i + 1] : null;
};

let doc;
const from = argOf("--from");
if (from) {
  doc = JSON.parse(fs.readFileSync(from, "utf8")).document;
} else {
  const token = process.env.FIGMA_TOKEN;
  if (!token) {
    console.error(
      "\nFIGMA_TOKEN 이 없습니다.\n" +
        "  figma.com → 프로필 → 설정 → 보안 → 개인 액세스 토큰\n" +
        "  export FIGMA_TOKEN=figd_xxxxx\n",
    );
    process.exit(2);
  }
  const raw = await fetchFigma(cfg_fileKey(), token);
  const save = argOf("--json");
  if (save) fs.writeFileSync(save, JSON.stringify(raw));
  doc = raw.document;
}
function cfg_fileKey() {
  return CFG.fileKey;
}

const all = flatten(doc);
const struct = structureChecks(all, CFG);
const coords = coordChecks(all, CFG);
process.exit(report(struct, coords, CFG) ? 1 : 0);
