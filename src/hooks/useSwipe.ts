import { useRef, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface SwipeConfig {
  /** URL to navigate on swipe right (← prev page) */
  onSwipeRight?: string | (() => void);
  /** URL to navigate on swipe left (→ next page) */
  onSwipeLeft?: string | (() => void);
  /** Minimum horizontal distance (px) to trigger swipe. Default: 60 */
  threshold?: number;
  /** Max vertical deviation ratio. Default: 0.5 */
  maxVerticalRatio?: number;
  /** Whether swipe is enabled. Default: true */
  enabled?: boolean;
}

interface SwipeState {
  /** Current horizontal offset while swiping (for visual indicator) */
  offsetX: number;
  /** Whether currently tracking a swipe */
  isSwiping: boolean;
  /** Direction hint: 'left' | 'right' | null */
  direction: "left" | "right" | null;
}

export default function useSwipe(config: SwipeConfig) {
  const {
    onSwipeRight,
    onSwipeLeft,
    threshold = 60,
    maxVerticalRatio = 0.5,
    enabled = true,
  } = config;

  const navigate = useNavigate();

  const [swipeState, setSwipeState] = useState<SwipeState>({
    offsetX: 0,
    isSwiping: false,
    direction: null,
  });

  const startX = useRef(0);
  const startY = useRef(0);
  const tracking = useRef(false);
  const startTime = useRef(0);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled) return;

      const touch = e.touches[0];
      startX.current = touch.clientX;
      startY.current = touch.clientY;
      startTime.current = Date.now();
      tracking.current = true;

      setSwipeState({ offsetX: 0, isSwiping: false, direction: null });
    },
    [enabled]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!tracking.current || !enabled) return;

      const touch = e.touches[0];
      const dx = touch.clientX - startX.current;
      const dy = touch.clientY - startY.current;

      // If vertical scroll dominates, stop tracking
      if (Math.abs(dy) > Math.abs(dx) * 1.2 && Math.abs(dy) > 10) {
        tracking.current = false;
        setSwipeState({ offsetX: 0, isSwiping: false, direction: null });
        return;
      }

      // Determine if we have a valid horizontal swipe candidate
      if (Math.abs(dx) > 15) {
        const direction = dx > 0 ? "right" : "left";
        const hasTarget =
          (direction === "right" && onSwipeRight) ||
          (direction === "left" && onSwipeLeft);

        if (hasTarget) {
          // Apply resistance: the further you swipe, the harder it gets
          const resistance = 0.4;
          const resistedOffset =
            Math.sign(dx) * Math.min(Math.abs(dx) * resistance, 120);

          setSwipeState({
            offsetX: resistedOffset,
            isSwiping: true,
            direction,
          });
        }
      }
    },
    [enabled, onSwipeRight, onSwipeLeft]
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!tracking.current || !enabled) {
        tracking.current = false;
        setSwipeState({ offsetX: 0, isSwiping: false, direction: null });
        return;
      }

      const touch = e.changedTouches[0];
      const dx = touch.clientX - startX.current;
      const dy = touch.clientY - startY.current;
      const elapsed = Date.now() - startTime.current;

      tracking.current = false;

      // Check if it qualifies as a swipe
      const isHorizontalEnough =
        Math.abs(dy) / Math.max(Math.abs(dx), 1) < maxVerticalRatio;
      const isFastEnough = elapsed < 500 || Math.abs(dx) > threshold;
      const isLongEnough = Math.abs(dx) > threshold;

      if (isHorizontalEnough && isFastEnough && isLongEnough) {
        if (dx > 0 && onSwipeRight) {
          // Swipe right → previous page / go back
          if (typeof onSwipeRight === "string") {
            navigate(onSwipeRight);
          } else {
            onSwipeRight();
          }
        } else if (dx < 0 && onSwipeLeft) {
          // Swipe left → next page
          if (typeof onSwipeLeft === "string") {
            navigate(onSwipeLeft);
          } else {
            onSwipeLeft();
          }
        }
      }

      // Animate back
      setSwipeState({ offsetX: 0, isSwiping: false, direction: null });
    },
    [enabled, threshold, maxVerticalRatio, onSwipeRight, onSwipeLeft, navigate]
  );

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !enabled) return;

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: true });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { containerRef, swipeState };
}
