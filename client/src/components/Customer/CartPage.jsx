import React, { useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  MdAdd,
  MdDeleteOutline,
  MdExpandMore,
  MdLock,
  MdOutlineReplay,
  MdOutlineShoppingBag,
  MdRemove,
  MdShield,
} from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";

import { deleteFromCartAction } from "../../actions/cartActions";
import { newOrderAction } from "../../actions/orderActions";
import { notifyError, notifyInfo } from "../../actions/toastActions";
import { ORIGIN } from "../../App";
import { useCartOperations } from "../../utils/products";
import { ReadyPageContent } from "../../UI/PageContentEntrance";
import "../../css/product.css";
import "../../css/cart.css";
import PageHeader from "./PageHeader";
import ScrollToTop from "./ScrollToTop";
import { PaymentMethodStrip } from "./PaymentMethodTile";

const CART_EASE = [0.16, 1, 0.3, 1];
const NEW_ORDER_URL = `${ORIGIN}/orders/add`;
const CART_URL_DELETE = `${ORIGIN}/cart/delete`;
const CART_MUTATION_TOAST_ID = "cart-mutation";

const createCheckoutKey = () => {
  if (typeof globalThis.crypto?.randomUUID === "function") return globalThis.crypto.randomUUID();
  return `checkout-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const formatMoney = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? `$${amount.toFixed(2)}` : String(value ?? "");
};

function CartCategoryTag({ category }) {
  if (!category) return null;

  return (
    <span className="b25-product-tag" aria-label={`Category: ${category}`}>
      <span className="b25-product-tag__dot" aria-hidden="true" />
      <span className="b25-product-tag__label">{category}</span>
    </span>
  );
}

function CartDiscountPanel({ reduceMotion }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");

  return (
    <div className={`cart-discount${open ? " is-open" : ""}`}>
      <button
        type="button"
        className="cart-discount__toggle"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span>Discount code</span>
        <MdExpandMore className="cart-discount__chevron" aria-hidden="true" />
      </button>
      <motion.div
        className="cart-discount__panel"
        initial={false}
        animate={{
          height: open ? "auto" : 0,
          opacity: open ? 1 : 0,
        }}
        transition={{ duration: reduceMotion ? 0 : 0.22, ease: CART_EASE }}
        aria-hidden={!open}
      >
        <div className="cart-discount__fields">
          <input
            type="text"
            className="cart-discount__input"
            placeholder="Enter discount code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            disabled={!open}
            aria-label="Discount code"
          />
          <button type="button" className="cart-discount__apply" disabled={!open || !code.trim()}>
            Apply
          </button>
        </div>
      </motion.div>
    </div>
  );
}


function CartItem({ item, index, loading, onIncrease, onDecrease, onRemove, reduceMotion }) {
  const [imageFailed, setImageFailed] = useState(false);
  const lineTotal = Number(item.price) * Number(item.quantity);
  const atStockLimit = Number.isFinite(Number(item.stock)) && Number(item.quantity) >= Number(item.stock);

  return (
    <>
      <figure className="cart-item__media">
        {item.thumbnail && !imageFailed ? (
          <img
            src={item.thumbnail}
            alt={item.title}
            loading={index < 2 ? "eager" : "lazy"}
            decoding="async"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className="cart-item__fallback" aria-hidden="true">
            <MdOutlineShoppingBag />
          </span>
        )}
      </figure>

      <div className="cart-item__identity">
        <CartCategoryTag category={item.category} />
        <h2>{item.title}</h2>
        <p className="cart-item__unit b25-tabular">{formatMoney(item.price)} each</p>
      </div>

      <div className="cart-item__action-row">
        <div className="cart-item__stepper-wrap">
          <p className="cart-item__qty-label b25-tabular">
            Qty <span>{item.quantity}</span>
          </p>
          <div className="cart-stepper" role="group" aria-label={`Quantity for ${item.title}`}>
            <button
              type="button"
              disabled={loading}
              onClick={onDecrease}
              aria-label={`Remove one ${item.title}`}
            >
              <MdRemove aria-hidden="true" />
            </button>
            <motion.output
              key={item.quantity}
              className="b25-tabular"
              aria-live="polite"
              initial={false}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: reduceMotion ? 0 : 0.18, ease: CART_EASE }}
            >
              {item.quantity}
            </motion.output>
            <button
              type="button"
              disabled={loading || atStockLimit}
              onClick={onIncrease}
              aria-label={`Add one ${item.title}`}
            >
              <MdAdd aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="cart-item__actions">
          <motion.p
            key={lineTotal}
            className="cart-item__total b25-tabular"
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.18, ease: CART_EASE }}
          >
            {formatMoney(lineTotal)}
          </motion.p>
          <button
            type="button"
            className="cart-item__remove"
            disabled={loading}
            onClick={onRemove}
            aria-label={`Delete ${item.title} from Cart`}
          >
            <MdDeleteOutline aria-hidden="true" />
            <span>Remove</span>
          </button>
        </div>
      </div>
    </>
  );
}

export default function CartPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const user = useSelector((state) => state.userReducer.user);
  const cart = useSelector((state) => state.cartReducer.user?.cart);
  const { loading, hydrated } = useSelector((state) => state.cartReducer);
  const { addToCart, removeFromCart } = useCartOperations();
  const [submitting, setSubmitting] = useState(false);
  const [pendingId, setPendingId] = useState(null);
  const [checkoutError, setCheckoutError] = useState(null);
  const checkoutKeyRef = useRef(null);

  const items = Array.isArray(cart?.items) ? cart.items : [];
  const itemCount = items.length;
  const total = Number(cart?.total) || 0;
  const isBusy = Boolean(loading || submitting || pendingId);
  const cartReady = Boolean(user?._id) && (hydrated || itemCount > 0);

  const handleDelete = async (id) => {
    if (isBusy || !user?._id) return;

    const removedItem = items.find((entry) => entry.id === id);
    setPendingId(id);
    try {
      const response = await dispatch(deleteFromCartAction(id, user._id, CART_URL_DELETE));
      const { code } = response || {};

      if (code !== 200) {
        dispatch(notifyError("Unable to remove item"));
        return;
      }

      dispatch(
        notifyInfo(`Removed ${removedItem?.title || "Product"} from cart`, {
          id: CART_MUTATION_TOAST_ID,
          duration: 2800,
        })
      );
    } catch (error) {
      console.error("Failed To Delete From Cart", error.message);
      dispatch(notifyError("Unable to remove item"));
    } finally {
      setPendingId(null);
    }
  };

  const handleNewOrder = async () => {
    if (!itemCount || isBusy || !user?._id) return;

    setSubmitting(true);
    setCheckoutError(null);
    checkoutKeyRef.current ||= createCheckoutKey();

    try {
      const response = await dispatch(
        newOrderAction(user._id, NEW_ORDER_URL, checkoutKeyRef.current)
      );
      const { code, message } = response || {};

      if (code !== 200) {
        setCheckoutError(message || "The order could not be placed.");
        return;
      }

      checkoutKeyRef.current = null;
      navigate("/customer/orders");
    } catch (error) {
      console.error("Failed To Handle New Order", error.message);
      setCheckoutError("The order could not be placed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!cartReady) {
    return null;
  }

  return (
    <ReadyPageContent ready={cartReady}>
      <section className="cart-page" id="customer-cart-page" aria-labelledby="cart-title">
        <PageHeader
          className="cart-heading"
          icon={MdOutlineShoppingBag}
          title="Cart"
          titleId="cart-title"
          description="Review your items and complete your order when you're ready."
          meta={
            <p className="cart-heading__count b25-tabular" aria-live="polite">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </p>
          }
        />

        {itemCount ? (
          <div className="cart-layout">
            <div className="cart-main">
              <ul className="cart-list" tabIndex={0} aria-label="Cart items">
                {items.map((item, index) => (
                  <li key={item.id ?? `${item.title}-${index}`} className="cart-item">
                    <CartItem
                      item={item}
                      index={index}
                      loading={isBusy}
                      reduceMotion={reduceMotion}
                      onIncrease={() => addToCart(item, 1)}
                      onDecrease={() => removeFromCart(item)}
                      onRemove={() => handleDelete(item.id)}
                    />
                  </li>
                ))}
              </ul>
            </div>

            <aside className="cart-summary" aria-labelledby="cart-summary-title">
              <p className="b25-ui-label">Order summary</p>
              <h2 id="cart-summary-title">Checkout</h2>

              <dl className="cart-summary__facts">
                <div>
                  <dt>Items</dt>
                  <dd className="b25-tabular">{itemCount}</dd>
                </div>
                <div>
                  <dt>Subtotal</dt>
                  <dd className="b25-tabular">{formatMoney(total)}</dd>
                </div>
                <div className="is-secondary">
                  <dt>Estimated shipping</dt>
                  <dd>Free</dd>
                </div>
                <div className="is-secondary">
                  <dt>Estimated tax</dt>
                  <dd>Calculated at checkout</dd>
                </div>
              </dl>

              <p className="cart-summary__delivery">Estimated delivery: 2–5 business days</p>

              <CartDiscountPanel reduceMotion={reduceMotion} />

              <div className="cart-summary__total">
                <span>Total</span>
                <motion.span
                  key={total}
                  className="b25-tabular"
                  initial={false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.18, ease: CART_EASE }}
                >
                  {formatMoney(total)}
                </motion.span>
              </div>

              {checkoutError ? (
                <p className="cart-summary__error" role="alert">
                  {checkoutError}
                </p>
              ) : null}

              <button
                type="button"
                className="cart-checkout"
                onClick={handleNewOrder}
                disabled={isBusy || !itemCount}
              >
                <MdLock aria-hidden="true" />
                {submitting ? "Placing order…" : "Secure checkout"}
              </button>

              <p className="cart-summary__secure">
                <MdLock aria-hidden="true" />
                Encrypted checkout
              </p>

              <PaymentMethodStrip />

              <ul className="cart-summary__trust">
                <li>
                  <MdShield aria-hidden="true" />
                  Order protection
                </li>
                <li>
                  <MdOutlineReplay aria-hidden="true" />
                  Easy returns
                </li>
              </ul>

              <Link className="cart-continue" to="/customer/products">
                Continue shopping
              </Link>
            </aside>
          </div>
        ) : (
          <div className="cart-empty">
            <div className="cart-empty__icon" aria-hidden="true">
              <MdOutlineShoppingBag />
            </div>
            <div>
              <h2>Your cart is empty</h2>
              <p>Looks like you haven&apos;t added anything yet.</p>
              <Link className="cart-empty__action" to="/customer/products">
                Continue shopping
              </Link>
            </div>
          </div>
        )}

        <ScrollToTop />
      </section>
    </ReadyPageContent>
  );
}
