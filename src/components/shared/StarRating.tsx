"use client";

import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  count?: number;
  size?: "sm" | "md";
}

export function StarRating({ rating, count, size = "md" }: StarRatingProps) {
  const starSize = size === "sm" ? 12 : 16;

  return (
    <span className="flex items-center gap-1">
      <Star
        size={starSize}
        fill="var(--color-accent)"
        color="var(--color-accent)"
      />
      <span
        className="font-medium"
        style={{ fontSize: size === "sm" ? "var(--text-xs)" : "var(--text-sm)" }}
      >
        {rating.toFixed(1)}
      </span>
      {count !== undefined && (
        <span style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>
          ({count})
        </span>
      )}
    </span>
  );
}
