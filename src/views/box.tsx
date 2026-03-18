import type { FC } from 'hono/jsx';
import { Layout } from './layout';
import type { Thread } from '../types';

interface Pagination {
  current: number;
  last: number;
}

interface BoxProps {
  id: string;
  title: string;
  stickyThreads: Thread[];
  normalThreads: Thread[];
  pagination: Pagination;
  error: string;
  isCfError: boolean;
}

function buildPages(current: number, last: number): (number | '...')[] {
  const pages: (number | '...')[] = [1];
  if (current > 3) pages.push('...');
  for (let i = Math.max(2, current - 1); i <= Math.min(last - 1, current + 1); i++) {
    pages.push(i);
  }
  if (current < last - 2) pages.push('...');
  if (last > 1) pages.push(last);
  return pages;
}

export const BoxPage: FC<BoxProps> = ({
  id, title, stickyThreads, normalThreads, pagination, error, isCfError,
}) => (
  <Layout title={title || 'Box'}>
    {error ? (
      <div class="error-container">
        <div class="error-icon">⚠️</div>
        <p class="error-text">{error}</p>
        {isCfError && (
          <p class="error-sub">
            Bạn cần <a href="/settings">cập nhật cookie</a> từ trình duyệt.
          </p>
        )}
        <a href={`/box/${id}?page=${pagination.current}`} class="btn btn-primary">Thử lại</a>
      </div>
    ) : (
      <div class="box-page">
        <div class="page-header">
          <a href="/" class="breadcrumb">← Trang chủ</a>
          <h1 class="page-title">{title}</h1>
        </div>

        {stickyThreads.length > 0 && (
          <div class="thread-section">
            <h3 class="section-label">Ghim</h3>
            {stickyThreads.map((t) => <ThreadRow id={id} thread={t} />)}
          </div>
        )}

        <div class="thread-section">
          {normalThreads.map((t) => <ThreadRow id={id} thread={t} />)}
        </div>

        <Pager base={`/box/${id}`} pagination={pagination} />
      </div>
    )}
  </Layout>
);

const ThreadRow: FC<{ id: string; thread: Thread }> = ({ thread: t }) => (
  <a href={`/thread/${t.id}`} class="thread-row">
    <div class="thread-row-main">
      {t.isPrefix && <span class="thread-prefix">{t.isPrefix}</span>}
      <span class="thread-title">{t.title}</span>
    </div>
    <div class="thread-row-meta">
      <span class="thread-author">{t.author}</span>
      <span class="thread-stats">
        {t.replies && <span>{t.replies} trả lời</span>}
        {t.views && <span> · {t.views} lượt xem</span>}
      </span>
    </div>
  </a>
);

const Pager: FC<{ base: string; pagination: Pagination }> = ({ base, pagination }) => {
  if (pagination.last <= 1) return <></>;
  const pages = buildPages(pagination.current, pagination.last);
  return (
    <nav class="pagination">
      {pagination.current > 1 && (
        <a href={`${base}?page=${pagination.current - 1}`} class="pagination-btn">‹</a>
      )}
      {pages.map((p) =>
        p === '...'
          ? <span class="pagination-ellipsis">…</span>
          : <a href={`${base}?page=${p}`} class={`pagination-btn${p === pagination.current ? ' active' : ''}`}>{p}</a>
      )}
      {pagination.current < pagination.last && (
        <a href={`${base}?page=${pagination.current + 1}`} class="pagination-btn">›</a>
      )}
    </nav>
  );
};
