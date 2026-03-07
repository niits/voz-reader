// CORS + Cache middleware for all /api/* routes
export const onRequest: PagesFunction = async (context) => {
  const { request } = context;
  const origin = request.headers.get("Origin");

  // Preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(origin),
    });
  }

  const hasCookies = !!request.headers.get("X-Voz-Cookies");
  const cache = caches.default;
  // Use URL as cache key (only for anonymous GET requests)
  const cacheKey = new Request(request.url, { method: "GET" });

  if (!hasCookies && request.method === "GET") {
    const cached = await cache.match(cacheKey);
    if (cached) {
      const resp = new Response(cached.body, cached);
      for (const [key, value] of Object.entries(corsHeaders(origin))) {
        resp.headers.set(key, value);
      }
      return resp;
    }
  }

  const response = await context.next();

  // Add CORS headers to response
  const newResponse = new Response(response.body, response);
  for (const [key, value] of Object.entries(corsHeaders(origin))) {
    newResponse.headers.set(key, value);
  }

  // Cache successful anonymous GET responses
  if (!hasCookies && request.method === "GET" && newResponse.ok) {
    const toCache = new Response(newResponse.clone().body, newResponse);
    toCache.headers.set("Cache-Control", `public, max-age=${getCacheTtl(request.url)}`);
    context.waitUntil(cache.put(cacheKey, toCache));
  }

  return newResponse;
};

function getCacheTtl(url: string): number {
  if (url.includes("/api/forums")) return 3600;
  if (url.includes("/api/box/")) return 3600;
  if (url.includes("/api/thread/")) return 3600;
  return 3600;
}

function corsHeaders(origin?: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Voz-Cookies",
    "Access-Control-Max-Age": "86400",
  };
}
