/* /api/img — 외부 이미지를 같은 출처로 중계한다.
 *
 *   GET /api/img?u=https%3A%2F%2Fec.cafe24.com%2F....jpg
 *
 * Apps Script 프록시와 다른 점
 *   - base64/JSON 으로 감싸지 않고 바이트를 그대로 돌려준다 (용량 33% 절감)
 *   - 같은 출처라 캔버스가 오염되지 않는다 → CORS 실패를 기다릴 필요가 없다
 *   - 진짜 URL 이므로 브라우저·CDN 캐시가 걸린다 (data: URI 는 캐시 불가)
 *
 * 선택 환경변수
 *   IMG_HOSTS  허용 도메인 목록(쉼표 구분). 예) cafe24.com,dearcus.com
 *              비워두면 공인 주소면 모두 허용한다. 운영 도메인이 확정되면
 *              설정해서 잠그는 것을 권장한다(외부인이 대역폭을 쓰는 것 방지).
 */

const MAX_BYTES = 25 * 1024 * 1024;
const TIMEOUT_MS = 15000;

/* 사내망·클라우드 메타데이터로의 요청 차단(SSRF) */
function isPrivateHost(host) {
  const h = host.toLowerCase().replace(/^\[|\]$/g, "");
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".internal"))
    return true;
  if (h === "::1" || h.startsWith("fc") || h.startsWith("fd")) return true;
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) || // 클라우드 메타데이터
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127)
  );
}

function hostAllowed(host) {
  const raw = (process.env.IMG_HOSTS || "").trim();
  if (!raw) return true; // 미설정 = 전체 허용
  const h = host.toLowerCase();
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase().replace(/^\*?\./, ""))
    .filter(Boolean)
    .some((d) => h === d || h.endsWith("." + d));
}

module.exports = async (req, res) => {
  const fail = (code, msg) => {
    res.status(code);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.end(msg);
  };

  const raw = (req.query && (req.query.u || req.query.url)) || "";
  if (!raw) return fail(400, "u 파라미터(이미지 주소)가 필요합니다");

  let target;
  try {
    target = new URL(String(raw));
  } catch (_) {
    return fail(400, "올바른 URL 이 아닙니다: " + String(raw).slice(0, 200));
  }
  if (target.protocol !== "https:" && target.protocol !== "http:")
    return fail(400, "http/https 주소만 중계합니다");
  if (isPrivateHost(target.hostname))
    return fail(403, "내부망 주소는 중계하지 않습니다");
  if (!hostAllowed(target.hostname))
    return fail(
      403,
      `허용되지 않은 도메인: ${target.hostname}\n` +
        `Vercel 환경변수 IMG_HOSTS 에 이 도메인을 추가하세요.`,
    );

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);

  try {
    const r = await fetch(target.toString(), {
      signal: ac.signal,
      redirect: "follow",
      headers: {
        /* 일부 쇼핑몰 CDN 은 UA/Referer 가 없으면 막는다 */
        "User-Agent": "Mozilla/5.0 (compatible; cc-banner/1.0)",
        Referer: target.origin + "/",
        Accept: "image/*,*/*;q=0.8",
      },
    });

    if (!r.ok)
      return fail(502, `원본 서버 응답 ${r.status} ${r.statusText}\n${target}`);

    const ctype = (r.headers.get("content-type") || "").toLowerCase();
    if (ctype && !ctype.startsWith("image/"))
      return fail(415, `이미지가 아닙니다 (${ctype})\n${target}`);

    const len = Number(r.headers.get("content-length") || 0);
    if (len > MAX_BYTES)
      return fail(413, `이미지가 너무 큽니다 (${Math.round(len / 1048576)}MB)`);

    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > MAX_BYTES) return fail(413, "이미지가 너무 큽니다");

    res.setHeader("Content-Type", ctype || "image/jpeg");
    res.setHeader("Content-Length", String(buf.length));
    /* 브라우저 1시간 / CDN 30일. 같은 주소의 이미지가 바뀌는 일은 드물다. */
    res.setHeader(
      "Cache-Control",
      "public, max-age=3600, s-maxage=2592000, stale-while-revalidate=86400",
    );
    res.status(200).end(buf);
  } catch (e) {
    if (e.name === "AbortError")
      return fail(504, `원본 서버 응답 없음 (${TIMEOUT_MS / 1000}초 초과)\n${target}`);
    return fail(502, `이미지 가져오기 실패: ${e.message}\n${target}`);
  } finally {
    clearTimeout(timer);
  }
};
