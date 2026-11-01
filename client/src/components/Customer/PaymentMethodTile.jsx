import React from "react";
import { getPaymentMethod, PAYMENT_METHODS } from "./payment-methods";

export default function PaymentMethodTile({ method }) {
  const entry = getPaymentMethod(method);

  if (!entry) return null;

  return (
    <span className="payment-method-tile" title={entry.accessibleName}>
      <img
        src={entry.src}
        alt={entry.accessibleName}
        width={entry.width}
        height={entry.height}
        decoding="async"
        draggable="false"
      />
    </span>
  );
}

export function PaymentMethodStrip() {
  return (
    <div className="cart-summary__payments-block">
      <p className="cart-summary__payments-label">Payment methods</p>
      <div className="cart-summary__payments" aria-label="Accepted payment methods">
        {PAYMENT_METHODS.map((method) => (
          <PaymentMethodTile key={method.id} method={method.id} />
        ))}
      </div>
    </div>
  );
}
