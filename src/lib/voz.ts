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
  "Sec-CH-UA":
    '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
  "Sec-CH-UA-Mobile": "?0",
  "Sec-CH-UA-Platform": '"macOS"',
};

function absUrl(href: string): string {
  if (!href) return "";
  if (href.startsWith("http")) return href;
  return `${VOZ_BASE}${href.startsWith("/") ? "" : "/"}${href}`;
}

export async function vozFetch(
  path: string,
  userCookies?: string
): Promise<string> {
  const url = `${VOZ_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
  const headers: Record<string, string> = { ...BROWSER_HEADERS };

  if (userCookies) {
    headers["Cookie"] = userCookies;
  }

  const res = await fetch(url, { headers, redirect: "follow" });

  if (res.status === 403) throw new Error("CLOUDFLARE_BLOCKED");
  if (!res.ok) throw new Error(`HTTP_${res.status}`);

  return await res.text();
}

// ── Parsers ──

export function parseForums(html: string) {
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
      $(block).find(".block-header h2, .block-header a").first().text().trim() ||
      "Khác";

    const forums: (typeof categories)[0]["forums"] = [];

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

export function parseBox(html: string, page: number) {
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
    const titleEl = $el
      .find(".structItem-title a:not(.labelLink)")
      .first();
    const title = titleEl.text().trim();
    const href = titleEl.attr("href") || "";
    const id = href.match(/\.(\d+)\/?$/)?.[1] || "";
    const author = $el
      .find(".structItem-minor .username")
      .first()
      .text()
      .trim();
    const replies = $el
      .find("dl.pairs--justified:first-of-type dd")
      .first()
      .text()
      .trim();
    const views = $el
      .find("dl.pairs--justified:nth-of-type(2) dd")
      .first()
      .text()
      .trim();
    const lastDate =
      $el.find(".structItem-latestDate time").attr("datetime") ||
      $el.find(".structItem-latestDate").text().trim();
    const isSticky =
      $el.hasClass("is-sticky") ||
      $el.find(".structItem-status--sticky").length > 0;
    const isPrefix = $el.find(".label, .labelLink").first().text().trim();

    if (title) {
      threads.push({
        id, title, href, author, replies, views, lastDate, isSticky, isPrefix,
      });
    }
  });

  const lastPage =
    $(".pageNav-main .pageNav-page:last-of-type a").last().text().trim() || "1";

  return {
    title: forumTitle,
    threads,
    pagination: { current: page, last: Number(lastPage) },
  };
}

export function parseThread(html: string, page: number) {
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
    const author = $el
      .find(".message-name a, .message-name span")
      .first()
      .text()
      .trim();
    let avatar = $el.find(".message-avatar img").attr("src") || "";
    if (avatar && !avatar.startsWith("http")) avatar = absUrl(avatar);
    const date =
      $el.find("time.u-dt").attr("datetime") ||
      $el.find("time").text().trim();
    const contentHtml =
      $el.find(".message-body .bbWrapper").first().html() || "";
    const reactions = $el.find(".reactionsBar").text().trim();
    const postNumber = $el
      .find(".message-attribution-opposite a:last-child")
      .text()
      .trim();

    posts.push({ id, author, avatar, date, contentHtml, reactions, postNumber });
  });

  const lastPage =
    $(".pageNav-main .pageNav-page:last-of-type a").last().text().trim() || "1";

  return {
    title: threadTitle,
    posts,
    pagination: { current: page, last: Number(lastPage) },
  };
}
