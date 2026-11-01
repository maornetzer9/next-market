import React from "react";

export default function StatisticsCategoryToggle({ category, active, onToggle, children }) {
  return (
    <button
      type="button"
      className={`admin-statistics__category-toggle${active ? "" : " is-hidden"}`}
      aria-pressed={active}
      aria-label={`${active ? "Hide" : "Show"} ${category.label} category`}
      onClick={() => onToggle(category.name)}
    >
      {children}
    </button>
  );
}
