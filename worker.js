// Cloudflare Workers 用: /api/proxy を中継し、それ以外は静的ファイル(public/)を返す
async function proxy(request) {
  const raw = new URL(request.url).searchParams.get("url") || "";
  let u;
  try { u = new URL(raw.replace(/^webcal:/i, "https:")); } catch { return new Response("bad url", { status: 400 }); }
  const h = u.hostname;
  if (u.protocol !== "https:" || h === "localhost" || /^[\d.]+$/.test(h) || h.includes(":") || h.endsWith(".local") || h.endsWith(".internal")) {
    return new Response("blocked", { status: 403 });
  }
  const r = await fetch(u.toString(), {
    headers: {
      "User-Agent": "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      "Accept": "application/rss+xml, application/xml, text/xml, text/calendar, */*",
      "Accept-Language": "ja-JP,ja;q=0.9",
    },
    redirect: "follow",
    cf: { cacheTtl: 300 },
  });
  if (!r.ok) return new Response("upstream:" + r.status, { status: 502, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  const body = await r.text();
  if (body.length > 3_000_000) return new Response("too large", { status: 413 });
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=300" } });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/proxy") return proxy(request);
    return env.ASSETS.fetch(request);
  },
};
