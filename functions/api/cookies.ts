import { vozFetch, jsonOk, jsonError } from "../lib/voz";

export const onRequestGet: PagesFunction = async () => {
  return jsonOk({ ok: true });
};

export const onRequestPost: PagesFunction = async ({ request }) => {
  const userCookies = request.headers.get("X-Voz-Cookies") || "";
  try {
    await vozFetch("/", userCookies);
    return jsonOk({ ok: true, message: "Cookie hoạt động!" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg === "CLOUDFLARE_BLOCKED") {
      return new Response(
        JSON.stringify({
          ok: false,
          message: "Cookie bị Cloudflare chặn. Thử lấy cookie mới.",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
    return jsonError(`Lỗi: ${msg}`, 500);
  }
};
