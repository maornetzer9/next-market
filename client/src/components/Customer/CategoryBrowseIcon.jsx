import React from "react";

/** Two-tone outlined 2×2 grid: hollow squares, neutral left + coral right. */
export default function CategoryBrowseIcon({ className }) {
  return (
    <span className={className} aria-hidden="true">
      <span className="b25-category-browse__cell is-neutral" />
      <span className="b25-category-browse__cell is-accent" />
      <span className="b25-category-browse__cell is-neutral" />
      <span className="b25-category-browse__cell is-accent" />
    </span>
  );
}
