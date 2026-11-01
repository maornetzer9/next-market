import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import CategoryTwoToneIcon from '@mui/icons-material/CategoryTwoTone';
import DvrTwoToneIcon from '@mui/icons-material/DvrTwoTone';
import ShoppingBagTwoToneIcon from '@mui/icons-material/ShoppingBagTwoTone';
import BarChartTwoToneIcon from '@mui/icons-material/BarChartTwoTone';
import {
  MdChevronLeft,
  MdDarkMode,
  MdHome,
  MdLightMode,
  MdLogout,
  MdOutlinePerson,
} from 'react-icons/md';
import { useDarkMode } from '../../hooks/darkMode';
import RouteScrollRestoration from '../../UI/RouteScrollRestoration';
import AuthBrandMark from '../../auth/AuthBrandMark';
import MarketBrandLink from '../Shell/MarketBrandLink';
import NeuralWaveField from '../Customer/NeuralWaveField';
import { disconnectAction } from '../../actions/userActions';
import { ORIGIN } from '../../App';
import {
  ADMIN_PRIMARY_NAV,
  ADMIN_MOBILE_NAV,
} from './adminNav';
import '../../css/customer-shell.css';
import '../../css/neural-wave.css';
import '../../css/storefront-mobile-nav.css';
import '../../css/admin-shell.css';

const NAV_ICONS = {
  dashboard: MdHome,
  categories: CategoryTwoToneIcon,
  customers: DvrTwoToneIcon,
  products: ShoppingBagTwoToneIcon,
  statistics: BarChartTwoToneIcon,
};

function getDisplayName(user) {
  const full = [user?.firstName, user?.lastName].filter(Boolean).join(' ');
  return full || user?.username || 'Admin';
}

function AdminNavIcon({ id }) {
  const Icon = NAV_ICONS[id];
  if (!Icon) return null;
  if (id === 'dashboard') return <Icon aria-hidden="true" />;
  return <Icon fontSize="inherit" aria-hidden="true" />;
}

/**
 * Admin-only presentation shell shared by all /admin/* routes.
 * Customer NavbarModel (variant="customer") is intentionally untouched.
 */
export default function AdminShell() {
  const USER_DISCONNECT_URL = `${ORIGIN}/user/disconnect`;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.userReducer);
  const [darkMode, toggleDarkMode] = useDarkMode();
  const [navCollapsed, setNavCollapsed] = useState(() => {
    try {
      return window.localStorage.getItem('nm-neural-wave-collapsed') === '1';
    } catch {
      return false;
    }
  });
  const [hoverNav, setHoverNav] = useState(null);

  const displayName = useMemo(() => getDisplayName(user), [user]);
  const ThemeIcon = darkMode ? MdLightMode : MdDarkMode;

  useEffect(() => {
    try {
      window.localStorage.setItem('nm-neural-wave-collapsed', navCollapsed ? '1' : '0');
    } catch {
      // Presentation preference remains local to this mount when storage is unavailable.
    }
  }, [navCollapsed]);

  const handleDisconnect = useCallback(async () => {
    try {
      if (!user?.token) return;
      await dispatch(disconnectAction(user.token, USER_DISCONNECT_URL));
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Failed To Disconnect Admin', error.message);
    }
  }, [user?.token, dispatch, navigate, USER_DISCONNECT_URL]);

  return (
    <div className={`admin-shell b25-customer-shell${darkMode ? ' is-dark' : ''}${navCollapsed ? ' is-nav-collapsed' : ''}`}>
      <aside
        className={`admin-shell__sidebar b25-customer-spine nm-spine${navCollapsed ? ' is-collapsed' : ''}`}
        aria-label="Admin navigation"
        data-magnet-mode={hoverNav ? 'hover' : 'route'}
      >
        <div className="nm-spine__canvas" aria-hidden="true">
          <NeuralWaveField orientation="vertical" collapsed={navCollapsed} />
          <span className="nm-wave-bloom" />
        </div>

        <Link to="/admin" className="b25-customer-spine__mark nm-brand" aria-label="NEXT MARKET Admin home">
          <span className="nm-brand__badge">
            <AuthBrandMark className="auth-brand-mark--rail" animateEnter={false} />
          </span>
          <small>NEXT MARKET</small>
        </Link>

        <button
          type="button"
          className="nm-collapse"
          aria-expanded={!navCollapsed}
          aria-label={navCollapsed ? 'Expand navigation' : 'Collapse navigation'}
          data-tooltip={navCollapsed ? 'Expand navigation' : undefined}
          onClick={() => setNavCollapsed((current) => !current)}
        >
          <MdChevronLeft aria-hidden="true" />
        </button>

        <nav className="admin-shell__nav b25-customer-nav nm-nav" aria-label="Admin sections">
          {ADMIN_PRIMARY_NAV.map((item) => (
            <NavLink
              key={item.id}
              to={item.to}
              end={Boolean(item.end)}
              className={({ isActive }) =>
                `admin-shell__nav-link b25-customer-nav__link nm-link${isActive ? ' is-active' : ''}${hoverNav === item.id ? ' is-magnet' : ''}`
              }
              data-tooltip={navCollapsed ? item.label : undefined}
              data-magnet-target={item.id}
              onMouseEnter={() => setHoverNav(item.id)}
              onMouseLeave={() => setHoverNav(null)}
              onFocus={() => setHoverNav(item.id)}
              onBlur={() => setHoverNav(null)}
            >
              <span className="b25-customer-nav__icon nm-link__icon" aria-hidden="true">
                <AdminNavIcon id={item.id} />
              </span>
              <span className="b25-customer-nav__label nm-link__label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="admin-shell__sidebar-footer b25-customer-spine__footer nm-footer">
          <button
            type="button"
            className={`admin-shell__footer-action nm-link${hoverNav === 'theme' ? ' is-magnet' : ''}`}
            onClick={toggleDarkMode}
            aria-pressed={darkMode}
            aria-label={darkMode ? 'Use light theme' : 'Use dark theme'}
            data-tooltip={navCollapsed ? 'Theme' : undefined}
            data-magnet-target="theme"
            onMouseEnter={() => setHoverNav('theme')}
            onMouseLeave={() => setHoverNav(null)}
            onFocus={() => setHoverNav('theme')}
            onBlur={() => setHoverNav(null)}
          >
            <span className="b25-customer-nav__icon nm-link__icon" aria-hidden="true"><ThemeIcon /></span>
            <span className="b25-customer-nav__label nm-link__label">Theme</span>
          </button>
          <button
            type="button"
            className={`admin-shell__footer-action nm-link${hoverNav === 'logout' ? ' is-magnet' : ''}`}
            onClick={handleDisconnect}
            aria-label="Logout"
            data-tooltip={navCollapsed ? 'Logout' : undefined}
            data-magnet-target="logout"
            onMouseEnter={() => setHoverNav('logout')}
            onMouseLeave={() => setHoverNav(null)}
            onFocus={() => setHoverNav('logout')}
            onBlur={() => setHoverNav(null)}
          >
            <span className="b25-customer-nav__icon nm-link__icon" aria-hidden="true"><MdLogout /></span>
            <span className="b25-customer-nav__label nm-link__label">Logout</span>
          </button>
        </div>
      </aside>

      <div className="admin-shell__frame">
        <header className="admin-shell__topbar b25-customer-command">
          <div className="b25-customer-command__brand-zone">
            <MarketBrandLink to="/admin" ariaLabel="NEXT MARKET Admin home" />
          </div>

          <div className="admin-shell__topbar-center b25-customer-command__center" aria-hidden="true" />

          <div className="admin-shell__topbar-actions b25-customer-command__meta">
            <div className="admin-shell__desktop-identity b25-customer-command__account" title={displayName}>
              <MdOutlinePerson aria-hidden="true" />
              <span>{displayName}</span>
            </div>

            <nav className="admin-shell__mobile-tools b25-customer-command__mobile-tools" aria-label="Admin account actions">
              <button type="button" className="b25-customer-command__tool is-logout" onClick={handleDisconnect} aria-label="Logout">
                <MdLogout aria-hidden="true" />
              </button>
              <span className="admin-shell__mobile-identity b25-customer-command__tool" aria-label={displayName} title={displayName}>
                <MdOutlinePerson aria-hidden="true" />
              </span>
            </nav>

            <button type="button" className="b25-theme-toggle b25-theme-toggle--mobile" onClick={toggleDarkMode} aria-pressed={darkMode} aria-label={darkMode ? 'Use light theme' : 'Use dark theme'}>
              <ThemeIcon aria-hidden="true" />
              <span className="b25-theme-toggle__label">Theme</span>
            </button>
          </div>
        </header>

        <main className="admin-shell__main b25-customer-main">
          <RouteScrollRestoration />
          <div className="admin-shell__main-inner">
            <Outlet />
          </div>
        </main>
      </div>

      <nav className="admin-shell__mobile-nav b25-customer-mobile-nav storefront-mobile-nav" aria-label="Admin mobile navigation">
        {ADMIN_MOBILE_NAV.map((item) => {
          const isFab = item.id === 'products';
          if (isFab) {
            return (
              <NavLink
                key={item.id}
                to={item.to}
                className="admin-shell__mobile-link storefront-mobile-nav__categories"
                aria-label={item.label}
              >
                <span className="storefront-mobile-nav__categories-ring" aria-hidden="true">
                  <AdminNavIcon id={item.id} />
                </span>
              </NavLink>
            );
          }
          return (
            <NavLink
              key={item.id}
              to={item.to}
              end={Boolean(item.end)}
              className={({ isActive }) =>
                `admin-shell__mobile-link storefront-mobile-nav__item${isActive ? ' is-active' : ''}`
              }
              aria-label={item.label}
            >
              <AdminNavIcon id={item.id} />
              <span>{item.shortLabel || item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
