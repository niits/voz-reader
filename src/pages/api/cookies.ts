import type { APIRoute } from 'astro';
import { vozFetch } from '../../lib/voz';

export const POST: APIRoute = async ({ request, cookies }) => {
  let body: { cookies?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, message: 'Invalid JSON.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const userCookies = body.cookies?.trim();
  if (!userCookies) {
    return new Response(JSON.stringify({ ok: false, message: 'Cookie trống.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    await vozFetch('/', userCookies);
    cookies.set('voz_session', userCookies, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 2, // 2 giờ
      secure: true,
    });
    return new Response(JSON.stringify({ ok: true, message: 'Cookie hoạt động!' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown';
    if (msg === 'CLOUDFLARE_BLOCKED') {
      return new Response(
        JSON.stringify({ ok: false, message: 'Cookie bị Cloudflare chặn. Thử lấy cookie mới.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } },
      );
    }
    return new Response(JSON.stringify({ ok: false, message: `Lỗi: ${msg}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = ({ cookies }) => {
  cookies.delete('voz_session', { path: '/' });
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
