import * as cheerio from "cheerio";

const VOZ_BASE = "https://voz.vn";

const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
  DNT: "1",
  "Upgrade-Insecure-Requests": "1",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Sec-CH-UA": '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
  "Sec-CH-UA-Mobile": "?0",
  "Sec-CH-UA-Platform": '"macOS"',
};

// ── Helpers ──

function absUrl(href: string): string {
  if (!href) return "";
  if (href.startsWith("http")) return href;
  return `${VOZ_BASE}${href.startsWith("/") ? "" : "/"}${href}`;
}

function corsHeaders(origin?: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Voz-Cookies, If-None-Match",
    "Access-Control-Max-Age": "86400",
  };
}

async function generateETag(body: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(body);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hash));
  return '"' + hashArray.slice(0, 16).map(b => b.toString(16).padStart(2, "0")).join("") + '"';
}

function jsonResponse(data: unknown, status = 200, origin?: string | null): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(origin),
    },
  });
}

async function cachedJsonResponse(
  data: unknown,
  origin: string | null | undefined,
  request: Request,
  maxAge = 60,
): Promise<Response> {
  const body = JSON.stringify(data);
  const etag = await generateETag(body);

  const ifNoneMatch = request.headers.get("If-None-Match");
  if (ifNoneMatch && ifNoneMatch === etag) {
    return new Response(null, {
      status: 304,
      headers: {
        ETag: etag,
        "Cache-Control": `public, max-age=${maxAge}`,
        ...corsHeaders(origin),
      },
    });
  }

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      ETag: etag,
      "Cache-Control": `public, max-age=${maxAge}`,
      ...corsHeaders(origin),
    },
  });
}

async function vozFetch(path: string, userCookies?: string): Promise<string> {
  const url = `${VOZ_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
  const headers: Record<string, string> = { ...BROWSER_HEADERS };

  if (userCookies) {
    headers["Cookie"] = userCookies;
  }

  const res = await fetch(url, {
    headers,
    redirect: "follow",
  });

  if (res.status === 403) {
    throw new Error("CLOUDFLARE_BLOCKED");
  }
  if (!res.ok) {
    throw new Error(`HTTP_${res.status}`);
  }

  return await res.text();
}

// ── Parsers ──

function parseForums(html: string) {
  const $ = cheerio.load(html);

  const categories: {
    title: string;
    forums: {
      id: string;
      title: string;
      href: string;
      description: string;
      subForums: { id: string; title: string; href: string }[];
    }[];
  }[] = [];

  $(".block--category").each((_i, block) => {
    const catTitle =
      $(block).find(".block-header h2, .block-header a").first().text().trim() || "Khác";

    const forums: typeof categories[0]["forums"] = [];

    $(block)
      .find(".node--forum, .node--link")
      .each((_j, node) => {
        const $node = $(node);
        const titleEl = $node.find(".node-title a").first();
        const title = titleEl.text().trim();
        const href = titleEl.attr("href") || "";
        const id = href.match(/\.(\d+)\/?$/)?.[1] || "";
        const description = $node.find(".node-description").text().trim();

        const subForums: { id: string; title: string; href: string }[] = [];
        $node.find(".node-subNodeList a").each((_k, sub) => {
          const $sub = $(sub);
          const subHref = $sub.attr("href") || "";
          subForums.push({
            id: subHref.match(/\.(\d+)\/?$/)?.[1] || "",
            title: $sub.text().trim(),
            href: subHref,
          });
        });

        if (title) {
          forums.push({ id, title, href, description, subForums });
        }
      });

    if (forums.length > 0) {
      categories.push({ title: catTitle, forums });
    }
  });

  return { categories };
}

function parseBox(html: string, page: number) {
  const $ = cheerio.load(html);
  const forumTitle = $("h1.p-title-value").text().trim();

  const threads: {
    id: string;
    title: string;
    href: string;
    author: string;
    replies: string;
    views: string;
    lastDate: string;
    isSticky: boolean;
    isPrefix: string;
  }[] = [];

  $(".structItem--thread").each((_i, el) => {
    const $el = $(el);
    const titleEl = $el.find(".structItem-title a:not(.labelLink)").first();
    const title = titleEl.text().trim();
    const href = titleEl.attr("href") || "";
    const id = href.match(/\.(\d+)\/?$/)?.[1] || "";
    const author = $el.find(".structItem-minor .username").first().text().trim();
    const replies = $el.find("dl.pairs--justified:first-of-type dd").first().text().trim();
    const views = $el.find("dl.pairs--justified:nth-of-type(2) dd").first().text().trim();
    const lastDate =
      $el.find(".structItem-latestDate time").attr("datetime") ||
      $el.find(".structItem-latestDate").text().trim();
    const isSticky =
      $el.hasClass("is-sticky") || $el.find(".structItem-status--sticky").length > 0;
    const isPrefix = $el.find(".label, .labelLink").first().text().trim();

    if (title) {
      threads.push({ id, title, href, author, replies, views, lastDate, isSticky, isPrefix });
    }
  });

  const lastPage = $(".pageNav-main .pageNav-page:last-of-type a").text().trim() || "1";

  return {
    title: forumTitle,
    threads,
    pagination: { current: page, last: Number(lastPage) },
  };
}

function parseThread(html: string, page: number) {
  const $ = cheerio.load(html);
  const threadTitle = $("h1.p-title-value").text().trim();

  const posts: {
    id: string;
    author: string;
    avatar: string;
    date: string;
    contentHtml: string;
    reactions: string;
    postNumber: string;
  }[] = [];

  $("article.message").each((_i, el) => {
    const $el = $(el);
    const id = $el.attr("data-content")?.replace("post-", "") || "";
    const author = $el.find(".message-name a, .message-name span").first().text().trim();
    let avatar = $el.find(".message-avatar img").attr("src") || "";
    if (avatar && !avatar.startsWith("http")) avatar = absUrl(avatar);
    const date = $el.find("time.u-dt").attr("datetime") || $el.find("time").text().trim();
    const contentHtml = $el.find(".message-body .bbWrapper").first().html() || "";
    const reactions = $el.find(".reactionsBar").text().trim();
    const postNumber = $el.find(".message-attribution-opposite a:last-child").text().trim();

    posts.push({ id, author, avatar, date, contentHtml, reactions, postNumber });
  });

  const lastPage = $(".pageNav-main .pageNav-page:last-of-type a").text().trim() || "1";

  return {
    title: threadTitle,
    posts,
    pagination: { current: page, last: Number(lastPage) },
  };
}

// ── Router ──

function matchRoute(pathname: string): { handler: string; params: Record<string, string> } | null {
  let m;

  if (pathname === "/api/forums") {
    return { handler: "forums", params: {} };
  }

  m = pathname.match(/^\/api\/box\/(\d+)$/);
  if (m) return { handler: "box", params: { id: m[1] } };

  m = pathname.match(/^\/api\/thread\/(\d+)$/);
  if (m) return { handler: "thread", params: { id: m[1] } };

  if (pathname === "/api/cookies") {
    return { handler: "cookies", params: {} };
  }

  return null;
}

// ── Worker Entry ──

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    const route = matchRoute(url.pathname);
    if (!route) {
      return jsonResponse({ error: "Not found" }, 404, origin);
    }

    // Get user cookies from header (sent by frontend)
    const userCookies = request.headers.get("X-Voz-Cookies") || "";

    try {
      switch (route.handler) {
        case "cookies": {
          if (request.method === "POST") {
            // Test the cookies by fetching voz homepage
            try {
              await vozFetch("/", userCookies);
              return jsonResponse({ ok: true, message: "Cookie hoạt động!" }, 200, origin);
            } catch (e) {
              const msg = e instanceof Error ? e.message : "Unknown error";
              if (msg === "CLOUDFLARE_BLOCKED") {
                return jsonResponse(
                  { ok: false, message: "Cookie bị Cloudflare chặn. Thử lấy cookie mới." },
                  403,
                  origin
                );
              }
              return jsonResponse({ ok: false, message: `Lỗi: ${msg}` }, 500, origin);
            }
          }
          return jsonResponse({ ok: true }, 200, origin);
        }

        // ── Forum data ──
        case "forums": {
          const html = await vozFetch("/", userCookies);
          return cachedJsonResponse(parseForums(html), origin, request, 120);
        }

        case "box": {
          const page = Number(url.searchParams.get("page")) || 1;
          const html = await vozFetch(`/f/f.${route.params.id}/page-${page}`, userCookies);
          return cachedJsonResponse(parseBox(html, page), origin, request, 60);
        }

        case "thread": {
          const page = Number(url.searchParams.get("page")) || 1;
          const html = await vozFetch(`/t/t.${route.params.id}/page-${page}`, userCookies);
          return cachedJsonResponse(parseThread(html, page), origin, request, 30);
        }

        default:
          return jsonResponse({ error: "Not found" }, 404, origin);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      console.error(`Error [${route.handler}]:`, msg);

      if (msg === "CLOUDFLARE_BLOCKED") {
        return jsonResponse(
          {
            error: "Bị Cloudflare chặn. Vui lòng cập nhật cookie từ trình duyệt.",
            code: "CLOUDFLARE_BLOCKED",
          },
          403,
          origin
        );
      }
      return jsonResponse({ error: `Server error: ${msg}` }, 500, origin);
    }
  },
};
