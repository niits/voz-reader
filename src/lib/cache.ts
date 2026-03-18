const CACHE_TTL: Record<string, number> = {
  forums: 3600,  // 1 giờ
  box: 300,      // 5 phút
  thread: 120,   // 2 phút
};

export async function cachedFetch<T>(
  cacheKey: string,
  kind: keyof typeof CACHE_TTL,
  fetcher: () => Promise<T>,
  userCookies?: string,
): Promise<T> {
  // Không cache request có cookies (nội dung cá nhân hoá)
  if (userCookies) return fetcher();

  const cache = caches.default;
  const url = `https://cache.internal/${cacheKey}`;
  const req = new Request(url);

  const cached = await cache.match(req);
  if (cached) {
    return cached.json() as Promise<T>;
  }

  const data = await fetcher();
  const res = new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": `public, max-age=${CACHE_TTL[kind]}`,
    },
  });
  await cache.put(req, res);
  return data;
}
