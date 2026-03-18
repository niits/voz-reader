import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
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

function render(jsx: any): Response {
  return new Response('<!DOCTYPE html>' + jsx.toString(), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

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
        const html = await vozFetch('/', cookies || undefined);
        return parseForums(html);
      },
      cookies || undefined,
    );
    categories = data.categories;
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown';
    isCfError = msg === 'CLOUDFLARE_BLOCKED';
    error = isCfError ? 'Bị Cloudflare chặn. Cần cập nhật cookie.' : 'Không thể tải danh sách box.';
  }

  return render(<HomePage categories={categories} error={error} isCfError={isCfError} />);
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
        const html = await vozFetch(`/f/f.${id}/page-${page}`, cookies || undefined);
        return parseBox(html, page);
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

  return render(<BoxPage id={id} title={title} stickyThreads={stickyThreads} normalThreads={normalThreads} pagination={pagination} error={error} isCfError={isCfError} />);
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
        const html = await vozFetch(`/t/t.${id}/page-${page}`, cookies || undefined);
        return parseThread(html, page);
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

  return render(<ThreadPage id={id} title={title} posts={posts} pagination={pagination} error={error} isCfError={isCfError} />);
});

// Settings GET
app.get('/settings', (c) => {
  const cookieValue = getCookie(c, 'voz_session') ?? '';
  const hasCookies = !!cookieValue;
  const cookiePreview = hasCookies ? cookieValue.substring(0, 60) + '...' : '';
  const status = c.req.query('status') as 'ok' | 'error' | 'cleared' | undefined;
  const message = c.req.query('msg') ?? undefined;
  return render(<SettingsPage hasCookies={hasCookies} cookiePreview={cookiePreview} status={status} message={message} />);
});

// Settings POST — save cookie via HTML form
app.post('/settings', async (c) => {
  const body = await c.req.parseBody();
  const userCookies = (body['cookies'] as string)?.trim();

  if (!userCookies) {
    return c.redirect('/settings?status=error&msg=Cookie+trống.');
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
    return c.redirect('/settings?status=ok&msg=Cookie+hoạt+động!');
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown';
    if (msg === 'CLOUDFLARE_BLOCKED') {
      return c.redirect('/settings?status=error&msg=Cookie+bị+Cloudflare+chặn.');
    }
    return c.redirect(`/settings?status=error&msg=Lỗi:+${msg}`);
  }
});

// Settings clear cookie
app.post('/settings/clear', (c) => {
  deleteCookie(c, 'voz_session', { path: '/' });
  return c.redirect('/settings?status=cleared&msg=Đã+xoá+cookie.');
});

export default app;
