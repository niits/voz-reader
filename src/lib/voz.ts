import { parse } from 'node-html-parser';

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
  const root = parse(html);

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

  root.querySelectorAll(".block--category").forEach((block) => {
    const catTitleEl =
      block.querySelector(".block-header h2") ||
      block.querySelector(".block-header a");
    const catTitle = catTitleEl?.text.trim() || "Khác";

    const forums: (typeof categories)[0]["forums"] = [];

    block.querySelectorAll(".node--forum, .node--link").forEach((node) => {
      const titleEl = node.querySelector(".node-title a");
      const title = titleEl?.text.trim() || "";
      const href = titleEl?.getAttribute("href") || "";
      const id = href.match(/\.(\d+)\/?$/)?.[1] || "";
      const description = node.querySelector(".node-description")?.text.trim() || "";

      const subForums: { id: string; title: string; href: string }[] = [];
      node.querySelectorAll(".node-subNodeList a").forEach((sub) => {
        const subHref = sub.getAttribute("href") || "";
        subForums.push({
          id: subHref.match(/\.(\d+)\/?$/)?.[1] || "",
          title: sub.text.trim(),
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
  const root = parse(html);
  const forumTitle = root.querySelector("h1.p-title-value")?.text.trim() || "";

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

  root.querySelectorAll(".structItem--thread").forEach((el) => {
    const titleEl = el.querySelector(".structItem-title a:not(.labelLink)");
    const title = titleEl?.text.trim() || "";
    const href = titleEl?.getAttribute("href") || "";
    const id = href.match(/\.(\d+)\/?$/)?.[1] || "";
    const author = el.querySelector(".structItem-minor .username")?.text.trim() || "";

    const dls = el.querySelectorAll("dl.pairs--justified");
    const replies = dls[0]?.querySelector("dd")?.text.trim() || "";
    const views = dls[1]?.querySelector("dd")?.text.trim() || "";

    const lastDate =
      el.querySelector(".structItem-latestDate time")?.getAttribute("datetime") ||
      el.querySelector(".structItem-latestDate")?.text.trim() || "";

    const cls = el.getAttribute("class") || "";
    const isSticky =
      cls.includes("is-sticky") ||
      el.querySelector(".structItem-status--sticky") !== null;

    const isPrefix = el.querySelector(".label, .labelLink")?.text.trim() || "";

    if (title) {
      threads.push({ id, title, href, author, replies, views, lastDate, isSticky, isPrefix });
    }
  });

  const pageNavItems = root.querySelectorAll(".pageNav-main .pageNav-page");
  const lastPage =
    pageNavItems[pageNavItems.length - 1]?.querySelector("a")?.text.trim() || "1";

  return {
    title: forumTitle,
    threads,
    pagination: { current: page, last: Number(lastPage) },
  };
}

export function parseThread(html: string, page: number) {
  const root = parse(html);
  const threadTitle = root.querySelector("h1.p-title-value")?.text.trim() || "";

  const posts: {
    id: string;
    author: string;
    avatar: string;
    date: string;
    contentHtml: string;
    reactions: string;
    postNumber: string;
  }[] = [];

  root.querySelectorAll("article.message").forEach((el) => {
    const id = el.getAttribute("data-content")?.replace("post-", "") || "";
    const author =
      el.querySelector(".message-name a")?.text.trim() ||
      el.querySelector(".message-name span")?.text.trim() || "";
    let avatar = el.querySelector(".message-avatar img")?.getAttribute("src") || "";
    if (avatar && !avatar.startsWith("http")) avatar = absUrl(avatar);
    const date =
      el.querySelector("time.u-dt")?.getAttribute("datetime") ||
      el.querySelector("time")?.text.trim() || "";
    const rawHtml = el.querySelector(".message-body .bbWrapper")?.innerHTML || "";
    // Proxy voz.vn attachments — browser can't load them directly
    const contentHtml = rawHtml.replace(
      /data-src="(https:\/\/voz\.vn\/attachments\/[^"]+)"/g,
      (_, url) => `src="/proxy?url=${encodeURIComponent(url)}"`
    );
    const reactions = el.querySelector(".reactionsBar")?.text.trim() || "";
    const postNumber =
      el.querySelector(".message-attribution-opposite a:last-child")?.text.trim() || "";

    posts.push({ id, author, avatar, date, contentHtml, reactions, postNumber });
  });

  const pageNavItems = root.querySelectorAll(".pageNav-main .pageNav-page");
  const lastPage =
    pageNavItems[pageNavItems.length - 1]?.querySelector("a")?.text.trim() || "1";

  return {
    title: threadTitle,
    posts,
    pagination: { current: page, last: Number(lastPage) },
  };
}
