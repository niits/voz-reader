interface Props {
  direction: "left" | "right" | null;
  offsetX: number;
  isSwiping: boolean;
  leftLabel?: string;
  rightLabel?: string;
}

export default function SwipeIndicator({
  direction,
  offsetX,
  isSwiping,
  leftLabel = "Trang sau ›",
  rightLabel = "‹ Trang trước",
}: Props) {
  if (!isSwiping || !direction) return null;

  const progress = Math.min(Math.abs(offsetX) / 48, 1);
  const isRight = direction === "right";

  return (
    <div
      className={`swipe-indicator swipe-indicator--${direction}`}
      style={{ opacity: progress }}
    >
      <div className="swipe-indicator-inner">
        <span className="swipe-indicator-icon">
          {isRight ? "‹" : "›"}
        </span>
        <span className="swipe-indicator-text">
          {isRight ? rightLabel : leftLabel}
        </span>
      </div>
    </div>
  );
}
