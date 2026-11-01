import React from "react";
import AuthBrandMark from "./AuthBrandMark";

export default function AuthBrandLockup() {
  return (
    <div className="auth-modal__brand-row">
      <AuthBrandMark />
      <p className="auth-modal__mark b25-ui-label">
        <span>NEXT</span>
        <span aria-hidden="true">/</span>
        <strong>MARKET</strong>
      </p>
    </div>
  );
}
