import { vozFetch, parseThread, jsonOk, handleVozError } from "../../lib/voz";

export const onRequestGet: PagesFunction = async ({ request, params }) => {
  const userCookies = request.headers.get("X-Voz-Cookies") || "";
  const id = params.id as string;
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page")) || 1;

  try {
    const html = await vozFetch(`/t/t.${id}/page-${page}`, userCookies);
    return jsonOk(parseThread(html, page), 30);
  } catch (e) {
    return handleVozError(e);
  }
};
