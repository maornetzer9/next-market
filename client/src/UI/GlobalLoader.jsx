import React from "react";

import { useDarkMode } from "../hooks/darkMode";
import "../css/global-loader.css";

export default function GlobalLoader({ context = "route", label = "Loading view" }) {
  const [darkMode] = useDarkMode();

  return (
    <section
      className={`b292-global-loader is-${context}${darkMode ? " is-dark" : ""}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="b292-global-loader__material" aria-hidden="true">
        <strong className="b292-global-loader__mark">N/M</strong>
        <span className="b292-global-loader__trace" />
      </div>
      <span className="b292-visually-hidden">{label}</span>
    </section>
  );
}
