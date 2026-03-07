// CORS middleware for all /api/* routes
export const onRequest: PagesFunction = async (context) => {
  const origin = context.request.headers.get("Origin");

  // Preflight
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(origin),
    });
  }

  const response = await context.next();

  // Add CORS headers to response
  const newResponse = new Response(response.body, response);
  for (const [key, value] of Object.entries(corsHeaders(origin))) {
    newResponse.headers.set(key, value);
  }
  return newResponse;
};

function corsHeaders(origin?: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Voz-Cookies",
    "Access-Control-Max-Age": "86400",
  };
}
