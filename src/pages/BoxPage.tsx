import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { fetchBox } from "../services/api";
import type { Thread, Pagination as PaginationType } from "../types";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";
import PaginationComponent from "../components/Pagination";

export default function BoxPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;

  const [title, setTitle] = useState("");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({ current: 1, last: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCfError, setIsCfError] = useState(false);

  const load = () => {
    if (!id) return;
    setLoading(true);
    setError("");
    setIsCfError(false);
    fetchBox(id, page)
      .then((res) => {
        setTitle(res.title);
        setThreads(res.threads);
        setPagination(res.pagination);
      })
      .catch((err) => {
        const cfBlocked = err?.response?.status === 403;
        setIsCfError(cfBlocked);
        setError(
          cfBlocked
            ? "Bị Cloudflare chặn."
            : "Không thể tải danh sách thread."
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

  const stickyThreads = threads.filter((t) => t.isSticky);
  const normalThreads = threads.filter((t) => !t.isSticky);

  return (
    <div className="box-page">
      <div className="page-header">
        <Link to="/" className="breadcrumb">← Trang chủ</Link>
        <h1 className="page-title">{title}</h1>
      </div>

      {stickyThreads.length > 0 && (
        <div className="thread-section">
          <h3 className="section-label">Ghim</h3>
          {stickyThreads.map((t) => (
            <ThreadRow key={t.id} thread={t} />
          ))}
        </div>
      )}

      <div className="thread-section">
        {normalThreads.map((t) => (
          <ThreadRow key={t.id} thread={t} />
        ))}
      </div>

      <PaginationComponent
        current={pagination.current}
        last={pagination.last}
        buildLink={(p) => `/box/${id}?page=${p}`}
      />
    </div>
  );
}

function ThreadRow({ thread }: { thread: Thread }) {
  return (
    <Link to={`/thread/${thread.id}`} className="thread-row">
      <div className="thread-row-main">
        {thread.isPrefix && <span className="thread-prefix">{thread.isPrefix}</span>}
        <span className="thread-title">{thread.title}</span>
      </div>
      <div className="thread-row-meta">
        <span className="thread-author">{thread.author}</span>
        <span className="thread-stats">
          {thread.replies && <span>{thread.replies} trả lời</span>}
          {thread.views && <span> · {thread.views} lượt xem</span>}
        </span>
      </div>
    </Link>
  );
}
