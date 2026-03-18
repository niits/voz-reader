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
        <a href={buildLink(current - 1)} className="pagination-btn">
          ‹
        </a>
      )}
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="pagination-ellipsis">
            …
          </span>
        ) : (
          <a
            key={p}
            href={buildLink(p)}
            className={`pagination-btn ${p === current ? "active" : ""}`}
          >
            {p}
          </a>
        )
      )}
      {current < last && (
        <a href={buildLink(current + 1)} className="pagination-btn">
          ›
        </a>
      )}
    </nav>
  );
}
