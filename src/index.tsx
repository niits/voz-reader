import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { html } from 'hono/html';
import { jsxRenderer } from 'hono/jsx-renderer';
import { cachedFetch } from './lib/cache';
import { vozFetch, parseForums, parseBox, parseThread } from './lib/voz';
import { HomePage } from './views/home';
import { BoxPage } from './views/box';
import { ThreadPage } from './views/thread';
import { SettingsPage } from './views/settings';

type Bindings = {
  ASSETS: Fetcher;
};

const app = new Hono<{ Bindings: Bindings }>();

// Home
app.get('/', async (c) => {
  const cookies = getCookie(c, 'voz_session') ?? '';
  let categories: Awaited<ReturnType<typeof parseForums>>['categories'] = [];
  let error = '';
  let isCfError = false;

  try {
    const data = await cachedFetch(
      'forums',
      'forums',
      async () => {
        const htmlStr = await vozFetch('/', cookies || undefined);
        return parseForums(htmlStr);
      },
      cookies || undefined,
    );
    categories = data.categories;
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown';
    isCfError = msg === 'CLOUDFLARE_BLOCKED';
    error = isCfError ? 'Bị Cloudflare chặn. Cần cập nhật cookie.' : 'Không thể tải danh sách box.';
  }

  return c.html('<!DOCTYPE html>' + (<HomePage categories={categories} error={error} isCfError={isCfError} />).toString());
});

// Box
app.get('/box/:id', async (c) => {
  const id = c.req.param('id');
  const page = Number(c.req.query('page')) || 1;
  const cookies = getCookie(c, 'voz_session') ?? '';

  type BoxData = Awaited<ReturnType<typeof parseBox>>;
  let boxData: BoxData | null = null;
  let error = '';
  let isCfError = false;

  try {
    boxData = await cachedFetch(
      `box:${id}:${page}`,
      'box',
      async () => {
        const htmlStr = await vozFetch(`/f/f.${id}/page-${page}`, cookies || undefined);
        return parseBox(htmlStr, page);
      },
      cookies || undefined,
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown';
    isCfError = msg === 'CLOUDFLARE_BLOCKED';
    error = isCfError ? 'Bị Cloudflare chặn.' : 'Không thể tải danh sách thread.';
  }

  const stickyThreads = boxData?.threads.filter((t) => t.isSticky) ?? [];
  const normalThreads = boxData?.threads.filter((t) => !t.isSticky) ?? [];
  const pagination = boxData?.pagination ?? { current: page, last: 1 };
  const title = boxData?.title ?? '';

  return c.html('<!DOCTYPE html>' + (<BoxPage id={id} title={title} stickyThreads={stickyThreads} normalThreads={normalThreads} pagination={pagination} error={error} isCfError={isCfError} />).toString());
});

// Thread
app.get('/thread/:id', async (c) => {
  const id = c.req.param('id');
  const page = Number(c.req.query('page')) || 1;
  const cookies = getCookie(c, 'voz_session') ?? '';

  type ThreadData = Awaited<ReturnType<typeof parseThread>>;
  let threadData: ThreadData | null = null;
  let error = '';
  let isCfError = false;

  try {
    threadData = await cachedFetch(
      `thread:${id}:${page}`,
      'thread',
      async () => {
        const htmlStr = await vozFetch(`/t/t.${id}/page-${page}`, cookies || undefined);
        return parseThread(htmlStr, page);
      },
      cookies || undefined,
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown';
    isCfError = msg === 'CLOUDFLARE_BLOCKED';
    error = isCfError ? 'Bị Cloudflare chặn.' : 'Không thể tải thread.';
  }

  const posts = threadData?.posts ?? [];
  const pagination = threadData?.pagination ?? { current: page, last: 1 };
  const title = threadData?.title ?? '';

  return c.html('<!DOCTYPE html>' + (<ThreadPage id={id} title={title} posts={posts} pagination={pagination} error={error} isCfError={isCfError} />).toString());
});

// Settings
app.get('/settings', (c) => {
  const cookieValue = getCookie(c, 'voz_session') ?? '';
  const hasCookies = !!cookieValue;
  const cookiePreview = hasCookies ? cookieValue.substring(0, 60) + '...' : '';
  return c.html('<!DOCTYPE html>' + (<SettingsPage hasCookies={hasCookies} cookiePreview={cookiePreview} />).toString());
});

// API: set cookies
app.post('/api/cookies', async (c) => {
  let body: { cookies?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ ok: false, message: 'Invalid JSON.' }, 400);
  }

  const userCookies = body.cookies?.trim();
  if (!userCookies) {
    return c.json({ ok: false, message: 'Cookie trống.' }, 400);
  }

  try {
    await vozFetch('/', userCookies);
    setCookie(c, 'voz_session', userCookies, {
      httpOnly: true,
      path: '/',
      sameSite: 'Lax',
      maxAge: 60 * 60 * 2,
      secure: true,
    });
    return c.json({ ok: true, message: 'Cookie hoạt động!' });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown';
    if (msg === 'CLOUDFLARE_BLOCKED') {
      return c.json({ ok: false, message: 'Cookie bị Cloudflare chặn. Thử lấy cookie mới.' }, 403);
    }
    return c.json({ ok: false, message: `Lỗi: ${msg}` }, 500);
  }
});

// API: delete cookies
app.delete('/api/cookies', (c) => {
  deleteCookie(c, 'voz_session', { path: '/' });
  return c.json({ ok: true });
});

export default app;
