import React from "react";
import PageBrandSignature from "../Shell/PageBrandSignature";
import "../../css/page-heading.css";

/**
 * Shared storefront page header for Orders / Account / Product Catalog / Cart.
 * Homepage does not use this component.
 */
export default function PageHeader({
  className = "",
  eyebrow = "Next / Market",
  icon: Icon,
  title,
  titleId,
  description,
  meta,
}) {
  const rootClass = ["b25-page-heading", className].filter(Boolean).join(" ");

  return (
    <header className={rootClass}>
      <div className="b25-page-heading__copy">
        {eyebrow ? <PageBrandSignature eyebrow={eyebrow} /> : null}
        <div className="b25-page-heading__title-row">
          {Icon ? (
            <span className="b25-page-heading__icon-box" aria-hidden="true">
              <Icon className="b25-page-heading__icon" />
            </span>
          ) : null}
          <h1 id={titleId}>{title}</h1>
        </div>
        {description ? (
          <p className="b25-page-heading__description">{description}</p>
        ) : null}
      </div>
      {meta ? <div className="b25-page-heading__meta">{meta}</div> : null}
    </header>
  );
}
