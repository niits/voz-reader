import { Link } from "react-router-dom";

interface Props {
  current: number;
  last: number;
  buildLink: (page: number) => string;
}

export default function Pagination({ current, last, buildLink }: Props) {
  if (last <= 1) return null;

  const pages: (number | "...")[] = [];

  // Always show first
  pages.push(1);

  if (current > 3) pages.push("...");

  for (let i = Math.max(2, current - 1); i <= Math.min(last - 1, current + 1); i++) {
    pages.push(i);
  }

  if (current < last - 2) pages.push("...");

  if (last > 1) pages.push(last);

  return (
    <nav className="pagination">
      {current > 1 && (
        <Link to={buildLink(current - 1)} className="pagination-btn">
          ‹
        </Link>
      )}
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="pagination-ellipsis">
            …
          </span>
        ) : (
          <Link
            key={p}
            to={buildLink(p)}
            className={`pagination-btn ${p === current ? "active" : ""}`}
          >
            {p}
          </Link>
        )
      )}
      {current < last && (
        <Link to={buildLink(current + 1)} className="pagination-btn">
          ›
        </Link>
      )}
    </nav>
  );
}
