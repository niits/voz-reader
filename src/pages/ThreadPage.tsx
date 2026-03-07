import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { fetchThread } from "../services/api";
import type { Post, Pagination as PaginationType } from "../types";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";
import PaginationComponent from "../components/Pagination";
import SwipeIndicator from "../components/SwipeIndicator";
import useSwipe from "../hooks/useSwipe";

export default function ThreadPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;

  const [title, setTitle] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({ current: 1, last: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCfError, setIsCfError] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  const hasPrev = pagination.current > 1;
  const hasNext = pagination.current < pagination.last;

  const { containerRef, swipeState } = useSwipe({
    onSwipeRight: hasPrev ? `/thread/${id}?page=${page - 1}` : undefined,
    onSwipeLeft: hasNext ? `/thread/${id}?page=${page + 1}` : undefined,
    enabled: !loading && !error,
  });

  const load = () => {
    if (!id) return;
    setLoading(true);
    setError("");
    setIsCfError(false);
    fetchThread(id, page)
      .then((res) => {
        setTitle(res.title);
        setPosts(res.posts);
        setPagination(res.pagination);
      })
      .catch((err) => {
        const cfBlocked = err?.response?.status === 403;
        setIsCfError(cfBlocked);
        setError(
          cfBlocked
            ? "Bị Cloudflare chặn."
            : "Không thể tải thread."
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    window.scrollTo(0, 0);
  }, [id, page]);

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} onRetry={load} isCloudflareError={isCfError} />;

  return (
    <div className="thread-page" ref={(el) => {
      // Assign to both refs
      (topRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
      (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    }}>
      <SwipeIndicator
        direction={swipeState.direction}
        offsetX={swipeState.offsetX}
        isSwiping={swipeState.isSwiping}
      />
      <div className="page-header">
        <button className="breadcrumb" onClick={() => window.history.back()}>
          ← Quay lại
        </button>
        <h1 className="page-title">{title}</h1>
        <div className="page-info">
          Trang {pagination.current}/{pagination.last}
        </div>
      </div>

      <PaginationComponent
        current={pagination.current}
        last={pagination.last}
        buildLink={(p) => `/thread/${id}?page=${p}`}
      />

      <div className="posts">
        {posts.map((post) => (
          <article key={post.id} className="post" id={`post-${post.id}`}>
            <div className="post-header">
              <div className="post-author-info">
                {post.avatar && (
                  <img
                    src={post.avatar}
                    alt={post.author}
                    className="post-avatar"
                    loading="lazy"
                  />
                )}
                <span className="post-author">{post.author}</span>
              </div>
              <div className="post-meta">
                <span className="post-number">{post.postNumber}</span>
                <time className="post-date">
                  {post.date
                    ? new Date(post.date).toLocaleString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}
                </time>
              </div>
            </div>
            <div
              className="post-content"
              dangerouslySetInnerHTML={{ __html: post.contentHtml }}
            />
            {post.reactions && (
              <div className="post-reactions">{post.reactions}</div>
            )}
          </article>
        ))}
      </div>

      <PaginationComponent
        current={pagination.current}
        last={pagination.last}
        buildLink={(p) => `/thread/${id}?page=${p}`}
      />
    </div>
  );
}
