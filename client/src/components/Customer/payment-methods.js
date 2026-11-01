import applePayMark from "../../assets/payments/apple_pay.svg";
import googlePayMark from "../../assets/payments/google_pay.svg";
import mastercardMark from "../../assets/payments/master.svg";
import paypalMark from "../../assets/payments/paypal.svg";
import visaMark from "../../assets/payments/visa.svg";

/**
 * Official Shopify payment-brand badges (activemerchant/payment_icons).
 * Unmodified 38×24 vector marks — the same set used on Shopify checkouts.
 */
export const PAYMENT_METHOD_TILE_HEIGHT = 31;

export const PAYMENT_METHODS = [
  {
    id: "visa",
    accessibleName: "Visa",
    src: visaMark,
    width: 49,
    height: PAYMENT_METHOD_TILE_HEIGHT,
  },
  {
    id: "mastercard",
    accessibleName: "Mastercard",
    src: mastercardMark,
    width: 49,
    height: PAYMENT_METHOD_TILE_HEIGHT,
  },
  {
    id: "paypal",
    accessibleName: "PayPal",
    src: paypalMark,
    width: 49,
    height: PAYMENT_METHOD_TILE_HEIGHT,
  },
  {
    id: "apple-pay",
    accessibleName: "Apple Pay",
    src: applePayMark,
    width: 49,
    height: PAYMENT_METHOD_TILE_HEIGHT,
  },
  {
    id: "google-pay",
    accessibleName: "Google Pay",
    src: googlePayMark,
    width: 49,
    height: PAYMENT_METHOD_TILE_HEIGHT,
  },
];

export function getPaymentMethod(id) {
  return PAYMENT_METHODS.find((method) => method.id === id) ?? null;
}
