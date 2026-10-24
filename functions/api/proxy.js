// カレンダー(ICS)やニュース(RSS)をサーバー側で取得して返す中継
export async function onRequestGet({ request }) {
  const raw = new URL(request.url).searchParams.get("url") || "";
  let u;
  try { u = new URL(raw.replace(/^webcal:/i, "https:")); } catch { return new Response("bad url", { status: 400 }); }
  const h = u.hostname;
  if (u.protocol !== "https:" || h === "localhost" || /^[\d.]+$/.test(h) || h.includes(":") || h.endsWith(".local") || h.endsWith(".internal")) {
    return new Response("blocked", { status: 403 });
  }
  const r = await fetch(u.toString(), { headers: { "User-Agent": "smart-display/1.0" }, cf: { cacheTtl: 300 } });
  const body = await r.text();
  if (body.length > 3_000_000) return new Response("too large", { status: 413 });
  return new Response(body, {
    status: r.status,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=300" },
  });
}
