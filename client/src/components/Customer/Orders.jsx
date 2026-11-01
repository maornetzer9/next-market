import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { MdAccessTime, MdChevronRight, MdHistory, MdInventory2, MdOutlineReceiptLong, MdReceiptLong } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";

import { loadOrdersAction } from "../../actions/orderActions";
import { ORIGIN } from "../../App";
import "../../css/orders.css";
import ScrollToTop from "./ScrollToTop";
import PageHeader from "./PageHeader";
import { ReadyPageContent } from "../../UI/PageContentEntrance";

const formatMoney = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? `$${amount.toFixed(2)}` : String(value ?? "");
};

const formatRecordedAt = (value) =>
  String(value ?? "").replace(/,\s*(\d{1,2}:\d{2})(?::\d{2})?$/, " · $1");

const formatRecordedParts = (value) => {
  const formatted = formatRecordedAt(value);
  const [date, time] = formatted.split(" · ");
  return {
    date: date || formatted,
    time: time || null,
    full: formatted,
  };
};

const statusClassName = (status) => String(status || "").trim().toLowerCase();

const ownerName = (owner) =>
  [owner?.firstName, owner?.lastName].filter(Boolean).join(" ") || owner?.username || "";

function OrderRecord({ order, index }) {
  const recorded = formatRecordedParts(order.createAt);
  const statusClass = order.status ? statusClassName(order.status) : "";

  return (
    <li className="order-record">
      <div className="order-record__product">
        <figure className="order-record__media">
          <img
            src={order.thumbnail}
            alt={order.title}
            loading={index < 2 ? "eager" : "lazy"}
            decoding="async"
          />
        </figure>

        <div className="order-record__identity">
          <div className="order-record__labels">
            {order.category ? <span className="b25-ui-label">{order.category}</span> : null}
          </div>
          <h3>{order.title}</h3>
          <p>Historical product snapshot</p>
        </div>
      </div>

      <dl className="order-record__facts">
        <div className="order-record__metrics">
          <div className="is-total">
            <dt>Total</dt>
            <dd className="b25-tabular">{formatMoney(order.total)}</dd>
          </div>
          <div className="order-record__metrics-secondary">
            <div className="is-quantity">
              <dt>Qty</dt>
              <dd className="b25-tabular">{order.quantity}</dd>
            </div>
            <div className="is-unit-price">
              <dt>Unit price</dt>
              <dd className="b25-tabular">{formatMoney(order.price)}</dd>
            </div>
          </div>
        </div>
        <div className="order-record__meta">
          <div className="is-date">
            <dt>
              <MdAccessTime aria-hidden="true" />
              <span>Recorded</span>
            </dt>
            <dd className="b25-tabular">
              <span className="order-record__recorded-date">{recorded.date}</span>
              {recorded.time ? (
                <span className="order-record__recorded-time">{recorded.time}</span>
              ) : null}
            </dd>
          </div>
          {order.status ? (
            <div className="is-status">
              <dt>Status</dt>
              <dd>
                <span className={`order-record__status-value is-${statusClass}`}>{order.status}</span>
              </dd>
            </div>
          ) : null}
        </div>
      </dl>
    </li>
  );
}

function OwnerGroup({ group, expanded, onToggle }) {
  const panelId = `orders-owner-${group.key}`;
  const countLabel = `${group.orders.length} ${group.orders.length === 1 ? "record" : "records"}`;
  const listRef = useRef(null);
  const clipRef = useRef(null);
  const panelRef = useRef(null);
  const wasExpandedRef = useRef(expanded);
  const expandedRef = useRef(expanded);
  const isClosingRef = useRef(false);
  const needsScroll = group.orders.length > 2;
  const [viewportHeight, setViewportHeight] = useState(null);
  const [panelHeight, setPanelHeight] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const isPanelOpen = expanded || isClosing || panelHeight > 0;

  const [heightMotionReady, setHeightMotionReady] = useState(false);

  useEffect(() => {
    expandedRef.current = expanded;
  }, [expanded]);

  useEffect(() => {
    isClosingRef.current = isClosing;
  }, [isClosing]);

  const measureViewport = useCallback(() => {
    const list = listRef.current;
    if (!list || !needsScroll) {
      return null;
    }

    const rows = list.querySelectorAll(".order-record");
    if (rows.length < 2) {
      return null;
    }

    const first = rows[0].getBoundingClientRect().height;
    const second = rows[1].getBoundingClientRect().height;
    const styles = getComputedStyle(list);
    const gap = Number.parseFloat(styles.rowGap || styles.gap || "0") || 0;
    const paddingTop = Number.parseFloat(styles.paddingTop) || 0;
    const paddingBottom = Number.parseFloat(styles.paddingBottom) || 0;
    return Math.ceil(paddingTop + first + gap + second + paddingBottom);
  }, [needsScroll]);

  const measurePanelHeight = useCallback(() => {
    const clip = clipRef.current;
    if (!clip) return 0;
    return Math.ceil(clip.getBoundingClientRect().height);
  }, []);

  const applyOpenLayout = useCallback(() => {
    const nextViewport = measureViewport();
    if (nextViewport) {
      setViewportHeight(nextViewport);
    }

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setPanelHeight(measurePanelHeight());
      });
    });
  }, [measurePanelHeight, measureViewport]);

  useLayoutEffect(() => {
    if (expanded) {
      setIsClosing(false);
      const nextViewport = measureViewport();
      if (nextViewport) {
        setViewportHeight(nextViewport);
      }
      const nextHeight = measurePanelHeight();
      if (nextHeight > 0) {
        setPanelHeight(nextHeight);
      } else {
        applyOpenLayout();
      }
      wasExpandedRef.current = true;
      return;
    }

    if (wasExpandedRef.current) {
      setIsClosing(true);
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setPanelHeight(0));
      });
      wasExpandedRef.current = false;
    }
  }, [expanded, applyOpenLayout, group.orders.length, measurePanelHeight, measureViewport]);

  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(() => setHeightMotionReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!expanded || !needsScroll) {
      return undefined;
    }

    let frameId = 0;
    const scheduleMeasure = () => {
      frameId = window.requestAnimationFrame(() => {
        frameId = window.requestAnimationFrame(() => {
          const nextViewport = measureViewport();
          if (nextViewport) {
            setViewportHeight(nextViewport);
          }
          setPanelHeight(measurePanelHeight());
        });
      });
    };

    scheduleMeasure();

    const list = listRef.current;
    if (!list) return () => window.cancelAnimationFrame(frameId);

    const onResize = () => scheduleMeasure();
    window.addEventListener("resize", onResize);

    let observer;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(onResize);
      observer.observe(list);
      list.querySelectorAll(".order-record").forEach((row) => observer.observe(row));
    }

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
      observer?.disconnect();
    };
  }, [expanded, needsScroll, measurePanelHeight, measureViewport, group.orders.length]);

  const handlePanelTransitionEnd = (event) => {
    if (event.propertyName !== "height" || event.target !== panelRef.current) {
      return;
    }

    if (!expandedRef.current && isClosingRef.current && panelRef.current?.offsetHeight <= 1) {
      setIsClosing(false);
      setPanelHeight(0);
      setViewportHeight(null);
      listRef.current?.scrollTo({ top: 0 });
    }
  };

  return (
    <section className={`orders-owner-group${expanded ? " is-expanded" : ""}${isClosing ? " is-closing" : ""}${heightMotionReady ? "" : " is-instant"}`}>
      <button
        type="button"
        className="orders-owner-group__toggle"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span className="orders-owner-group__mark" aria-hidden="true">
          <MdReceiptLong />
        </span>
        <span className="orders-owner-group__identity">
          <span className="b25-ui-label">{group.isOwn ? "My orders" : "Shared with me"}</span>
          <strong>{group.name}</strong>
        </span>
        <span className="orders-owner-group__count b25-tabular">{countLabel}</span>
        <MdChevronRight className="orders-owner-group__chevron" aria-hidden="true" />
      </button>

      <div
        id={panelId}
        ref={panelRef}
        className="orders-owner-group__panel"
        style={{ height: isPanelOpen ? `${panelHeight}px` : "0px" }}
        onTransitionEnd={handlePanelTransitionEnd}
        {...(!expanded && !isClosing ? { inert: "" } : {})}
      >
        <div ref={clipRef} className="orders-owner-group__clip">
          <div className="orders-owner-group__body">
            <ol
              ref={listRef}
              className={`orders-list b25-internal-scroll${needsScroll && isPanelOpen ? " is-scrollable" : ""}`}
              data-record-count={needsScroll ? "many" : String(group.orders.length)}
              style={viewportHeight && isPanelOpen ? { maxHeight: `${viewportHeight}px` } : undefined}
            >
              {group.orders.map((order, index) => (
                <OrderRecord
                  key={order._id ?? `${group.key}-${order.id}`}
                  order={order}
                  index={index}
                />
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Orders() {
  const dispatch = useDispatch();
  const { user: authenticatedUser } = useSelector((state) => state.userReducer);
  const {
    user: orderUser,
    users: sharedOrderUsers,
    error,
  } = useSelector((state) => state.ordersReducer);
  const hasCachedOrders =
    Boolean(authenticatedUser?._id) &&
    Boolean(orderUser?._id) &&
    String(orderUser._id) === String(authenticatedUser._id);
  const [loading, setLoading] = useState(!hasCachedOrders);
  const [expandedOwners, setExpandedOwners] = useState(() => new Set(["self"]));

  const ownerGroups = useMemo(() => {
    const ownOrders = Array.isArray(orderUser?.orders) ? orderUser.orders : [];
    const sharedGroups = Array.isArray(sharedOrderUsers)
      ? sharedOrderUsers
          .filter((owner) => Array.isArray(owner?.orders) && owner.orders.length > 0)
          .map((owner) => ({
            key: String(owner._id),
            name: ownerName(owner),
            orders: owner.orders,
            isOwn: false,
          }))
      : [];

    return [
      {
        key: "self",
        name: ownerName(orderUser) || ownerName(authenticatedUser),
        orders: ownOrders,
        isOwn: true,
      },
      ...sharedGroups,
    ];
  }, [authenticatedUser, orderUser, sharedOrderUsers]);

  const recordCount = ownerGroups.reduce((total, group) => total + group.orders.length, 0);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const userId = authenticatedUser?._id;

    if (!userId) {
      setLoading(false);
      return () => {
        active = false;
        controller.abort();
      };
    }

    const fetchOrders = async () => {
      /*
       * Soft-refresh when this user already has canonical cache.
       * Hard-load (spinner) only when cache is missing or belongs to another user.
       */
      const cacheMatchesUser =
        Boolean(orderUser?._id) && String(orderUser._id) === String(userId);
      if (!cacheMatchesUser) {
        setLoading(true);
      }

      try {
        const result = await dispatch(
          loadOrdersAction(userId, `${ORIGIN}/orders`, { signal: controller.signal })
        );
        if (result?.aborted) return;
      } catch (requestError) {
        if (requestError?.name === "CanceledError" || requestError?.code === "ERR_CANCELED") {
          return;
        }
        console.error("Failed To Load Orders On Customer Side", requestError.message);
      } finally {
        if (active && !controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchOrders();

    return () => {
      active = false;
      controller.abort();
    };
    // orderUser intentionally read at effect start only — do not re-fetch when LOAD_ORDERS lands.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cache check is mount/user-scoped
  }, [authenticatedUser?._id, dispatch]);

  const toggleOwner = (ownerKey) => {
    setExpandedOwners((current) => {
      const next = new Set(current);
      if (next.has(ownerKey)) next.delete(ownerKey);
      else next.add(ownerKey);
      return next;
    });
  };

  return (
    <ReadyPageContent ready={!loading}>
      <section className="orders-page" aria-labelledby="orders-title">
      <PageHeader
        className="orders-heading"
        icon={MdOutlineReceiptLong}
        title="Orders"
        titleId="orders-title"
        description="Track your purchases, review order history and access shared orders."
        meta={
          <p className="orders-heading__count b25-tabular" aria-live="polite">
            {recordCount} {recordCount === 1 ? "record" : "records"}
          </p>
        }
      />

      {loading ? (
        <div className="orders-state" role="status" aria-live="polite">
          <MdHistory aria-hidden="true" />
          <div>
            <p className="b25-ui-label">Order history</p>
            <strong>Loading your records</strong>
          </div>
        </div>
      ) : error ? (
        <div className="orders-state is-error" role="status">
          <MdReceiptLong aria-hidden="true" />
          <div>
            <p className="b25-ui-label">Order history</p>
            <strong>Your records could not be loaded.</strong>
          </div>
        </div>
      ) : recordCount ? (
        <section className="orders-history" aria-labelledby="orders-history-title">
          <div className="orders-history__summary">
            <div>
              <MdReceiptLong aria-hidden="true" />
              <div>
                <p className="b25-ui-label">Purchase archive</p>
                <h2 id="orders-history-title">Order history</h2>
              </div>
            </div>
            <span className="b25-tabular">
              {ownerGroups.length} {ownerGroups.length === 1 ? "owner" : "owners"} · {recordCount} stored records
            </span>
          </div>

          <div className="orders-owner-groups">
            {ownerGroups.map((group) => (
              <OwnerGroup
                key={group.key}
                group={group}
                expanded={expandedOwners.has(group.key)}
                onToggle={() => toggleOwner(group.key)}
              />
            ))}
          </div>
        </section>
      ) : (
        <div className="orders-state orders-empty">
          <MdInventory2 aria-hidden="true" />
          <div>
            <p className="b25-ui-label">Order history</p>
            <h2>No orders yet</h2>
            <p>Your completed purchases will appear here.</p>
            <Link className="orders-empty__action" to="/customer/products">
              Browse products
            </Link>
          </div>
        </div>
      )}

      <ScrollToTop />
      </section>
    </ReadyPageContent>
  );
}
