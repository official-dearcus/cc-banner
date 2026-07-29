/* /api/sheet — 비공개 구글 시트를 서버에서 읽어 CSV 로 돌려준다.
 *
 *   GET /api/sheet?tab=ProductMaster   →  text/csv
 *
 * 프론트(fetchCsv)는 "웹에 게시" CSV 를 읽던 것과 똑같은 형식을 받으므로
 * 06-config-store.js 의 PRESET.csv 주소만 바꾸면 된다.
 *
 * 필요한 환경변수 (Vercel → Settings → Environment Variables)
 *   GOOGLE_SA  서비스 계정 JSON 전체 (base64 로 넣어도 자동 인식)
 *   SHEET_ID   시트 주소의 /d/ 와 /edit 사이 문자열
 *
 * 외부 패키지를 쓰지 않는다. node 내장 crypto 로 JWT 를 직접 서명하므로
 * package.json / 빌드 과정이 필요 없다.
 */

const crypto = require("crypto");

/* 읽기 허용 탭. 여기 없는 이름은 거부한다(임의 탭 열람 방지). */
const TABS = ["ProductMaster", "TemplateMaster", "HeroMaster", "ColorMaster"];

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";

/* ---------- 서비스 계정 자격증명 읽기 ---------- */
function loadServiceAccount() {
  const raw = process.env.GOOGLE_SA;
  if (!raw) throw new Error("환경변수 GOOGLE_SA 가 없습니다");

  let text = raw.trim();
  /* base64 로 넣었으면 먼저 디코드 ('{' 로 시작하지 않으면 base64 로 간주) */
  if (!text.startsWith("{")) {
    try {
      text = Buffer.from(text, "base64").toString("utf8").trim();
    } catch (_) {
      /* 아래 JSON.parse 에서 잡힌다 */
    }
  }

  let sa;
  try {
    sa = JSON.parse(text);
  } catch (_) {
    throw new Error("GOOGLE_SA 값이 올바른 JSON 이 아닙니다 (키 파일 전체를 붙여넣었는지 확인)");
  }
  if (!sa.client_email || !sa.private_key)
    throw new Error("GOOGLE_SA 에 client_email / private_key 가 없습니다");

  /* 붙여넣기 과정에서 줄바꿈이 \n 문자열로 굳은 경우 복원 */
  if (sa.private_key.includes("\\n"))
    sa.private_key = sa.private_key.replace(/\\n/g, "\n");

  return sa;
}

/* ---------- 액세스 토큰 (JWT bearer) ---------- */
const b64url = (buf) =>
  Buffer.from(buf)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

let tokenCache = null; /* 워밍된 인스턴스에서 재사용 */

async function getAccessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  if (tokenCache && tokenCache.exp > now + 60) return tokenCache.token;

  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: sa.client_email,
    scope: SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  };
  const unsigned =
    b64url(JSON.stringify(header)) + "." + b64url(JSON.stringify(claim));

  let sig;
  try {
    sig = crypto.createSign("RSA-SHA256").update(unsigned).sign(sa.private_key);
  } catch (e) {
    throw new Error("private_key 서명 실패 — 키가 잘려서 저장됐을 수 있습니다");
  }
  const jwt = unsigned + "." + b64url(sig);

  const r = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const body = await r.text();
  if (!r.ok)
    throw new Error(`구글 토큰 발급 실패 (HTTP ${r.status}) ${body.slice(0, 300)}`);

  const j = JSON.parse(body);
  tokenCache = { token: j.access_token, exp: now + (j.expires_in || 3600) };
  return j.access_token;
}

/* ---------- 행 배열 → CSV ---------- */
function toCsv(rows) {
  if (!rows.length) return "";
  const width = Math.max(...rows.map((r) => r.length));
  return rows
    .map((r) => {
      const cells = [];
      for (let i = 0; i < width; i++) {
        const s = r[i] == null ? "" : String(r[i]);
        cells.push(/[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
      }
      return cells.join(",");
    })
    .join("\n");
}

/* ---------- 핸들러 ---------- */
module.exports = async (req, res) => {
  const send = (code, text) => {
    res.status(code);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end(text);
  };

  try {
    const tab = String((req.query && req.query.tab) || "").trim();
    if (!TABS.includes(tab))
      return send(400, `tab 파라미터가 필요합니다. 사용 가능: ${TABS.join(", ")}`);

    const sheetId = (process.env.SHEET_ID || "").trim();
    if (!sheetId) return send(500, "환경변수 SHEET_ID 가 없습니다");

    const sa = loadServiceAccount();
    const token = await getAccessToken(sa);

    const url =
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}` +
      `/values/${encodeURIComponent(tab)}` +
      `?majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE`;

    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const body = await r.text();

    if (!r.ok) {
      let hint = "";
      if (r.status === 403)
        hint =
          " — 시트를 서비스 계정 이메일에 공유했는지, Google Sheets API 를 사용 설정했는지 확인하세요";
      if (r.status === 404) hint = " — SHEET_ID 또는 탭 이름을 확인하세요";
      return send(502, `구글 시트 읽기 실패 (HTTP ${r.status})${hint}\n${body.slice(0, 500)}`);
    }

    const rows = (JSON.parse(body).values || []).filter((r0) =>
      r0.some((c) => String(c ?? "").trim() !== ""),
    );

    /* CDN 캐시 60초. 시트를 고친 뒤 최대 1분 늦게 반영될 수 있다. */
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=300",
    );
    res.status(200).end(toCsv(rows));
  } catch (e) {
    send(500, `서버 오류: ${e.message}`);
  }
};
