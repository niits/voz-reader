import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchForums } from "../services/api";
import type { Category } from "../types";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCfError, setIsCfError] = useState(false);

  const load = () => {
    setLoading(true);
    setError("");
    setIsCfError(false);
    fetchForums()
      .then((res) => setCategories(res.categories))
      .catch((err) => {
        const cfBlocked = err?.response?.status === 403;
        setIsCfError(cfBlocked);
        setError(
          cfBlocked
            ? "Bị Cloudflare chặn."
            : "Không thể tải danh sách box."
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} onRetry={load} isCloudflareError={isCfError} />;

  return (
    <div className="home-page">
      {categories.map((cat, ci) => (
        <section key={ci} className="category">
          <h2 className="category-title">{cat.title}</h2>
          <div className="forum-list">
            {cat.forums.map((forum) => (
              <Link
                key={forum.id}
                to={`/box/${forum.id}`}
                className="forum-card"
              >
                <div className="forum-card-title">{forum.title}</div>
                {forum.description && (
                  <div className="forum-card-desc">{forum.description}</div>
                )}
                {forum.subForums.length > 0 && (
                  <div className="forum-card-subs">
                    {forum.subForums.map((sub) => (
                      <span key={sub.id} className="sub-tag">
                        {sub.title}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
