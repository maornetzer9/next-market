import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { MdShoppingCart } from "react-icons/md";
import { useSelector } from "react-redux";

export default function Cart({
  user = {},
  addToTheCart = () => {},
  removeFromCart = () => {},
  compact = false,
  collapsed = false,
  previewOpen = false,
}) {
  const cart = useSelector((state) => state.cartReducer.user?.cart);
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const onCartPage = /\/cart\/?$/.test(location.pathname);
  const itemCount = cart?.items?.length || 0;
  const displayCount = itemCount > 99 ? "99+" : itemCount;

  return (
    <div className={`b272-cart${compact ? " is-compact" : ""}${collapsed ? " is-collapsed" : ""}`}>
      <NavLink
        to="/customer/cart"
        className={({ isActive }) =>
          `b272-cart-access nm-cart-access${isActive ? " is-open" : ""}${compact ? " is-compact" : ""}${previewOpen ? " is-preview" : ""}`
        }
        aria-label={`Cart, ${itemCount} ${itemCount === 1 ? "item" : "items"}`}
        aria-expanded={compact ? onCartPage : previewOpen || onCartPage}
        aria-controls={compact ? undefined : "nm-cart-preview"}
        aria-haspopup={compact ? undefined : "dialog"}
      >
        <span className="b272-cart-access__icon nm-cart-access__icon" aria-hidden="true">
          <MdShoppingCart />
          <motion.span
            key={itemCount}
            className="b272-cart-access__count nm-cart-access__count b25-tabular"
            initial={reduceMotion ? false : { scale: 0.78, opacity: 0.55 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.14, ease: "easeOut" }}
          >
            {displayCount}
          </motion.span>
        </span>
        <span className="b25-customer-nav__label b272-cart-access__label nm-link__label">Cart</span>
      </NavLink>
    </div>
  );
}
