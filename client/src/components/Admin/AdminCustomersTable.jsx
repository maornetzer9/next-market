import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { MdChevronLeft, MdChevronRight, MdClose, MdSearch } from 'react-icons/md';
import AdminEntityImage from './AdminEntityImage';
import AdminDeviceFrame from './AdminDeviceFrame';
import { resolveAdminPurchaseImage } from '../../utils/adminProductImage';
import { formatCatalogPrice } from '../../utils/priceRange';
import { getCustomerOrderTotal, getOrderRevenue } from './adminDashboardData';

const AVATAR_COLORS = ['#ef3f36', '#287be0', '#8254ef', '#19b66b', '#e2ac26', '#e85294', '#00aab8'];
const PAGE_SIZE = 6;
const COMPACT_QUERY = '(max-width: 1200px)';
const MOTION_EASE = [0.16, 1, 0.3, 1];

const statusClassName = (status) => String(status || '').trim().toLowerCase().replace(/\s+/g, '-');
const fullName = (user) => `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Customer';
const userKey = (user) => user._id || user.username || fullName(user);
function getInitials(user) {
  return `${(user.firstName?.[0] || '').toUpperCase()}${(user.lastName?.[0] || '').toUpperCase()}` || '?';
}

function avatarColor(seed) {
  let hash = 0;
  const text = String(seed || '');
  for (let i = 0; i < text.length; i += 1) hash = (hash + text.charCodeAt(i) * 17) % AVATAR_COLORS.length;
  return AVATAR_COLORS[hash];
}

function useCompactCustomersLayout() {
  const [compact, setCompact] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(COMPACT_QUERY).matches : false
  );

  useEffect(() => {
    const media = window.matchMedia(COMPACT_QUERY);
    const update = () => setCompact(media.matches);
    update();
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);

  return compact;
}

function CustomerAvatar({ user, large = false }) {
  return (
    <span
      className={`admin-customers__avatar${large ? ' admin-customers__avatar--lg' : ''}`}
      style={{ '--customer-avatar': avatarColor(userKey(user)) }}
      aria-hidden="true"
    >
      {getInitials(user)}
    </span>
  );
}

function ProductThumbnail({ order, priority = false }) {
  return (
    <AdminEntityImage
      className="admin-customers__thumb-frame"
      src={resolveAdminPurchaseImage(order)}
      title={order.title || order.category || 'Product'}
      width={56}
      height={56}
      loading={priority ? 'eager' : 'lazy'}
    />
  );
}

function AdminCustomerRow({ user, selected, onSelect }) {
  const orders = Array.isArray(user.orders) ? user.orders : [];
  const totalSpent = formatCatalogPrice(getCustomerOrderTotal(user));

  return (
    <button
      type="button"
      className={`admin-customers__customer-row${selected ? ' is-selected' : ''}`}
      aria-pressed={selected}
      aria-expanded={selected}
      aria-controls="admin-customer-orders-panel"
      onClick={(event) => onSelect(user, event.currentTarget)}
    >
      <span className="admin-customers__customer-identity">
        <CustomerAvatar user={user} />
        <span className="admin-customers__identity-copy">
          <strong className="admin-customers__name">{fullName(user)}</strong>
          {user.username ? <span className="admin-customers__email">{user.username}</span> : null}
          <span className="admin-customers__identity-date">{user.createAt || '—'}</span>
        </span>
      </span>
      <span className="admin-customers__joined">
        <span className="admin-customers__field-label">Member since</span>
        <span className="admin-customers__mobile-label">Joined</span>
        <strong>{user.createAt || '—'}</strong>
      </span>
      <span className="admin-customers__activity">
        <span className="admin-customers__spent" aria-label={`Total price ${totalSpent}`}>
          <strong>{totalSpent}</strong>
          <span>Total price</span>
        </span>
        <span className="admin-customers__orders-count" aria-label={`${orders.length} orders`}>
          <strong>{orders.length}</strong>
          <span>orders</span>
        </span>
      </span>
      <MdChevronRight className="admin-customers__chevron" aria-hidden="true" />
    </button>
  );
}

function AdminOrderRecord({ order, index, ownerKey }) {
  const total = formatCatalogPrice(getOrderRevenue(order));
  const statusClass = statusClassName(order.status);

  return (
    <li key={`${ownerKey}-order-${order._id || order.id || index}`} className="admin-customers__order-card">
      <div className="admin-customers__order-meta">
        <strong>#{order.id ?? index + 1}</strong>
        {order.createAt ? <span>{order.createAt}</span> : null}
      </div>
      <ProductThumbnail order={order} priority={index < 6} />
      <div className="admin-customers__order-info">
        <span className="admin-customers__order-title">{order.title || order.category || 'Order item'}</span>
        <span className="admin-customers__item-pill">{order.quantity ?? 0} item{Number(order.quantity) === 1 ? '' : 's'}</span>
      </div>
      <div className="admin-customers__order-total">
        {total ? <strong>{total}</strong> : null}
        {order.status ? <span className={`admin-status-pill is-${statusClass}`}>{order.status}</span> : null}
      </div>
    </li>
  );
}

function OrdersDetail({ user, compact, closeButtonRef, onClose, reduceMotion }) {
  const orders = Array.isArray(user.orders) ? user.orders : [];
  const totalSpent = formatCatalogPrice(getCustomerOrderTotal(user));

  return (
    <>
      {compact ? <div className="admin-customers__sheet-handle" aria-hidden="true" /> : null}
      <header className="admin-customers__detail-head">
        <div><h2 id="admin-customer-orders-title">Orders</h2><p>All order records for this customer.</p></div>
        <button ref={closeButtonRef} type="button" className="admin-customers__close" onClick={onClose} aria-label="Close customer orders"><MdClose aria-hidden="true" /></button>
      </header>

      <AnimatePresence initial={false} mode="popLayout">
        <motion.div
          key={userKey(user)}
          className="admin-customers__detail-content"
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -5 }}
          transition={{ duration: reduceMotion ? 0.08 : 0.22, ease: MOTION_EASE }}
        >
          <div className="admin-customers__summary">
            <div className="admin-customers__summary-identity">
              <CustomerAvatar user={user} large />
              <div className="admin-customers__summary-copy"><strong>{fullName(user)}</strong>{user.username ? <p>{user.username}</p> : null}{user.createAt ? <span>Joined {user.createAt}</span> : null}</div>
            </div>
            <div className="admin-customers__summary-metrics" aria-label={`${orders.length} total orders, ${totalSpent} total price`}>
              <div className="admin-customers__summary-metric"><span>Total Orders</span><strong>{orders.length}</strong></div>
              <span className="admin-customers__summary-divider" aria-hidden="true" />
              <div className="admin-customers__summary-metric is-spent"><span>Total Price</span><strong>{totalSpent}</strong></div>
            </div>
          </div>

          <ul className="admin-customers__order-cards" aria-label={`${fullName(user)} order records`}>
            {orders.map((order, index) => (
              <AdminOrderRecord key={`${userKey(user)}-order-${order._id || order.id || index}`} order={order} index={index} ownerKey={userKey(user)} />
            ))}
          </ul>
        </motion.div>
      </AnimatePresence>
    </>
  );
}

export default function AdminCustomersTable({ loading = false, loadError = null }) {
  const { users } = useSelector((state) => state.ordersReducer);
  const reduceMotion = useReducedMotion();
  const compact = useCompactCustomersLayout();
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const returnFocusRef = useRef(null);
  const closeButtonRef = useRef(null);

  const customers = useMemo(() => (users || []).filter((user) => Array.isArray(user.orders) && user.orders.length > 0), [users]);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return customers;
    return customers.filter((user) => `${fullName(user)} ${user.username || ''}`.toLowerCase().includes(normalized));
  }, [customers, query]);
  const totalOrderRecords = useMemo(
    () => customers.reduce((total, user) => total + (Array.isArray(user.orders) ? user.orders.length : 0), 0),
    [customers]
  );
  const filteredOrderRecords = useMemo(
    () => filtered.reduce((total, user) => total + (Array.isArray(user.orders) ? user.orders.length : 0), 0),
    [filtered]
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageSlice = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const selectedUser = customers.find((user) => userKey(user) === selectedId) || null;

  useEffect(() => setPage(1), [query]);
  useEffect(() => {
    if (selectedId && !pageSlice.some((user) => userKey(user) === selectedId)) setSelectedId(null);
  }, [pageSlice, selectedId]);
  useEffect(() => {
    if (selectedUser && compact) requestAnimationFrame(() => closeButtonRef.current?.focus());
  }, [compact, selectedUser]);
  useEffect(() => {
    if (!selectedUser) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setSelectedId(null);
        requestAnimationFrame(() => returnFocusRef.current?.focus());
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selectedUser]);

  const selectCustomer = (user, trigger) => {
    returnFocusRef.current = trigger;
    setSelectedId(userKey(user));
  };
  const closeDetail = () => {
    setSelectedId(null);
    requestAnimationFrame(() => returnFocusRef.current?.focus());
  };
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
    const numbers = [1];
    const start = Math.max(2, safePage - 1);
    const end = Math.min(totalPages - 1, safePage + 1);
    if (start > 2) numbers.push('…');
    for (let value = start; value <= end; value += 1) numbers.push(value);
    if (end < totalPages - 1) numbers.push('…');
    numbers.push(totalPages);
    return numbers;
  }, [safePage, totalPages]);

  if (loading) return <div className="admin-customers__state" role="status"><span className="admin-customers__spinner" aria-hidden="true" />Loading customers…</div>;
  if (loadError) return <div className="admin-customers__state" role="alert"><strong>Customers could not be loaded.</strong><span>{loadError}</span></div>;
  if (!customers.length) return <div className="admin-customers__state" role="status">No customers with orders yet.</div>;

  return (
    <div className={`admin-customers__layout${selectedUser ? ' is-detail-open' : ''}`}>
      <motion.section layout className="admin-customers__master admin-surface" transition={{ duration: reduceMotion ? 0 : 0.34, ease: MOTION_EASE }}>
        <header className="admin-customers__directory-intro">
          <div className="admin-customers__directory-title">
            <span>Customer directory</span>
            <strong>Active order accounts</strong>
            <p>Review customer identity, membership and order activity.</p>
          </div>
          <div className="admin-customers__directory-summary" aria-label={`${customers.length} customers and ${totalOrderRecords} order records`}>
            <span><strong>{customers.length}</strong><small>Customers</small></span>
            <span><strong>{totalOrderRecords}</strong><small>Orders</small></span>
          </div>
        </header>
        <div className="admin-customers__toolbar">
          <label className="admin-customers__search" htmlFor="admin-customers-search"><MdSearch aria-hidden="true" /><input id="admin-customers-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search customers by name or username…" autoComplete="off" /></label>
          <span className="admin-customers__directory-total"><strong>{filtered.length}</strong><span>{query ? 'matching accounts' : 'active accounts'}</span></span>
        </div>
        <div className="admin-customers__list-region">
          <div className="admin-customers__directory-head" aria-hidden="true"><span>Customer profile</span><span>Membership</span><span>Total price</span><span>Orders</span><span /></div>
          <ul className="admin-customers__directory" aria-label="Customers with orders">{pageSlice.map((user) => {
            const key = userKey(user);
            const selected = selectedId === key;
            return <li key={key}><AdminCustomerRow user={user} selected={selected} onSelect={selectCustomer} /></li>;
          })}</ul>
          {!pageSlice.length ? <p className="admin-customers__empty">No customers match your search.</p> : null}
        </div>
        <footer className="admin-customers__pagination">
          <div className="admin-customers__pagination-meta">
            <span><strong>{filtered.length ? `${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE, filtered.length)}` : '0'}</strong><small>Showing of {filtered.length}</small></span>
            <span><strong>{filteredOrderRecords}</strong><small>Order records</small></span>
          </div>
          {totalPages > 1 ? (
            <div className="admin-customers__pagination-controls">
              <button type="button" className="admin-customers__page-btn" disabled={safePage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} aria-label="Previous page"><MdChevronLeft aria-hidden="true" /></button>
              {pageNumbers.map((number, index) => number === '…' ? <span key={`ellipsis-${index}`} className="admin-customers__ellipsis">…</span> : <button key={number} type="button" className={`admin-customers__page-btn${number === safePage ? ' is-active' : ''}`} onClick={() => setPage(number)} aria-current={number === safePage ? 'page' : undefined}>{number}</button>)}
              <button type="button" className="admin-customers__page-btn" disabled={safePage >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} aria-label="Next page"><MdChevronRight aria-hidden="true" /></button>
            </div>
          ) : null}
        </footer>
      </motion.section>

      <AnimatePresence initial={false}>{selectedUser && !compact ? <motion.aside id="admin-customer-orders-panel" key="desktop-orders" className="admin-customers__detail" aria-labelledby="admin-customer-orders-title" initial={reduceMotion ? { opacity: 1 } : { opacity: 0, x: 34 }} animate={{ opacity: 1, x: 0 }} exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 34 }} transition={{ duration: reduceMotion ? 0.08 : 0.3, ease: MOTION_EASE }}><AdminDeviceFrame><OrdersDetail user={selectedUser} compact={false} closeButtonRef={closeButtonRef} onClose={closeDetail} reduceMotion={reduceMotion} /></AdminDeviceFrame></motion.aside> : null}</AnimatePresence>

      <AnimatePresence initial={false}>{selectedUser && compact ? <><motion.button key="sheet-backdrop" type="button" className="admin-customers__backdrop" aria-label="Close customer orders" onClick={closeDetail} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0.08 : 0.22 }} /><motion.aside id="admin-customer-orders-panel" key="mobile-orders" className="admin-customers__detail admin-customers__sheet admin-surface" role="dialog" aria-modal="true" aria-labelledby="admin-customer-orders-title" initial={reduceMotion ? { opacity: 1 } : { y: '100%' }} animate={{ y: 0, opacity: 1 }} exit={reduceMotion ? { opacity: 0 } : { y: '100%' }} transition={{ duration: reduceMotion ? 0.08 : 0.36, ease: MOTION_EASE }}><OrdersDetail user={selectedUser} compact closeButtonRef={closeButtonRef} onClose={closeDetail} reduceMotion={reduceMotion} /></motion.aside></> : null}</AnimatePresence>
    </div>
  );
}
