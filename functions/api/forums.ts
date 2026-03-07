import { vozFetch, parseForums, jsonOk, handleVozError } from "../lib/voz";

export const onRequestGet: PagesFunction = async ({ request }) => {
  const userCookies = request.headers.get("X-Voz-Cookies") || "";
  try {
    const html = await vozFetch("/", userCookies);
    return jsonOk(parseForums(html), 120);
  } catch (e) {
    return handleVozError(e);
  }
};
