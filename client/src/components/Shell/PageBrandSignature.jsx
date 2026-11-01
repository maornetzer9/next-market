import React from "react";
import AuthBrandMark from "../../auth/AuthBrandMark";
import BrandWordmark from "./BrandWordmark";

/** Customer's compact animated page signature, shared by Customer and Admin headers. */
export default function PageBrandSignature({ eyebrow = "Next / Market" }) {
  return (
    <div className="b25-page-heading__brand">
      <span className="b25-page-heading__mark" aria-hidden="true">
        <AuthBrandMark
          className="auth-brand-mark--page-heading"
          animateEnter={false}
        />
      </span>
      <p className="b25-page-heading__eyebrow b25-brand-wordmark">
        {eyebrow === "Next / Market" ? <BrandWordmark /> : eyebrow}
      </p>
    </div>
  );
}
