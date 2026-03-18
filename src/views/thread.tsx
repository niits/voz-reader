import type { FC } from 'hono/jsx';
import { Layout } from './layout';
import type { Post } from '../types';

interface Pagination {
  current: number;
  last: number;
}

interface ThreadProps {
  id: string;
  title: string;
  posts: Post[];
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

const Pager: FC<{ id: string; pagination: Pagination }> = ({ id, pagination }) => {
  if (pagination.last <= 1) return <></>;
  const pages = buildPages(pagination.current, pagination.last);
  const link = (p: number) => `/thread/${id}?page=${p}`;
  return (
    <nav class="pagination">
      {pagination.current > 1 && (
        <a href={link(pagination.current - 1)} class="pagination-btn">‹</a>
      )}
      {pages.map((p) =>
        p === '...'
          ? <span class="pagination-ellipsis">…</span>
          : <a href={link(p as number)} class={`pagination-btn${p === pagination.current ? ' active' : ''}`}>{p}</a>
      )}
      {pagination.current < pagination.last && (
        <a href={link(pagination.current + 1)} class="pagination-btn">›</a>
      )}
    </nav>
  );
};

export const ThreadPage: FC<ThreadProps> = ({
  id, title, posts, pagination, error, isCfError,
}) => (
  <Layout title={title || 'Thread'}>
    {error ? (
      <div class="error-container">
        <div class="error-icon">⚠️</div>
        <p class="error-text">{error}</p>
        {isCfError && (
          <p class="error-sub">
            Bạn cần <a href="/settings">cập nhật cookie</a> từ trình duyệt.
          </p>
        )}
        <a href={`/thread/${id}?page=${pagination.current}`} class="btn btn-primary">Thử lại</a>
      </div>
    ) : (
      <div class="thread-page">
        <div class="page-header">
          <button class="breadcrumb" onclick="window.history.back()">← Quay lại</button>
          <h1 class="page-title">{title}</h1>
          <div class="page-info">Trang {pagination.current}/{pagination.last}</div>
        </div>

        <Pager id={id} pagination={pagination} />

        <div class="posts">
          {posts.map((post) => (
            <article class="post" id={`post-${post.id}`}>
              <div class="post-header">
                <div class="post-author-info">
                  {post.avatar && (
                    <img src={post.avatar} alt={post.author} class="post-avatar" loading="lazy" />
                  )}
                  <span class="post-author">{post.author}</span>
                </div>
                <div class="post-meta">
                  <span class="post-number">{post.postNumber}</span>
                  <time class="post-date">
                    {post.date
                      ? new Date(post.date).toLocaleString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : ''}
                  </time>
                </div>
              </div>
              <div class="post-content" dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
              {post.reactions && <div class="post-reactions">{post.reactions}</div>}
            </article>
          ))}
        </div>

        <Pager id={id} pagination={pagination} />
      </div>
    )}
  </Layout>
);
