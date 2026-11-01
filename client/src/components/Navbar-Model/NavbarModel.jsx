import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Drawer, List, ListItem, ListItemText, Divider, Typography, Box, Toolbar, FormControlLabel, Switch, Alert, AlertTitle } from '@mui/material';
import { RiMenuFold2Line } from "react-icons/ri";
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import DvrTwoToneIcon from '@mui/icons-material/DvrTwoTone';
import ExitToAppTwoToneIcon from '@mui/icons-material/ExitToAppTwoTone';
import ShoppingBagTwoToneIcon from '@mui/icons-material/ShoppingBagTwoTone';
import BarChartTwoToneIcon from '@mui/icons-material/BarChartTwoTone';
import CategoryTwoToneIcon from '@mui/icons-material/CategoryTwoTone';
import InfoTwoToneIcon from '@mui/icons-material/InfoTwoTone';
import {
  MdDarkMode,
  MdHome,
  MdLightMode,
  MdLogin,
  MdLogout,
  MdOutlineInventory2,
  MdOutlinePerson,
  MdPersonAdd,
  MdReceiptLong,
} from 'react-icons/md';
import FallingStars from '../../UI/FallingStars';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useDarkMode } from '../../hooks/darkMode';
import {
  getPageContentExitMotion,
  PAGE_CONTENT_EASE,
  PAGE_CONTENT_EXIT_DURATION,
} from '../../UI/PageContentEntrance';
import RouteScrollRestoration from '../../UI/RouteScrollRestoration';
import { pageTransition, slideAnimation } from '../../utils/motion';
import { disconnectAction, authAction } from '../../actions/userActions';
import { ORIGIN } from '../../App';
import '../../css/customer-shell.css';
import NeuralWaveNav from '../Customer/NeuralWaveNav';
import StorefrontFooter from '../Customer/StorefrontFooter';
import StorefrontMobileBottomNav from '../Customer/StorefrontMobileBottomNav';
import StorefrontCategoryNav from '../Customer/StorefrontCategoryNav';
import { useCartOperations, useLoadCart } from '../../utils/products';
import { isAuthenticatedUser } from '../../utils/auth';
import MarketBrandLink from '../Shell/MarketBrandLink';
import {
  STOREFRONT_CATEGORIES,
  deriveStorefrontCategories,
  shouldShowCustomerFooter,
} from '../../utils/storefrontNavigation';

const NavbarModel = (({ menuHeader, variant = 'default', onOpenSignIn, onOpenRegister }) => {

    const drawerWidth = 240;
    const USER_DISCONNECT_URL = `${ORIGIN}/user/disconnect`;

    const dispatch = useDispatch();
    const location = useLocation();
    const navigate = useNavigate();
    const reduceMotion = useReducedMotion();
    const { user } = useSelector((state) => state.userReducer);
    const { products } = useSelector((state) => state.productsReducer);
    const authenticated = isAuthenticatedUser(user);
    useLoadCart(variant === 'customer' && authenticated);
    const { addToCart, removeFromCart } = useCartOperations();

    const storefrontCategories = useMemo(() => {
      const derived = deriveStorefrontCategories(products);
      return derived.length ? derived : STOREFRONT_CATEGORIES;
    }, [products]);

    const [ menu, setMenu ] = useState([]);
    const [ preview, setPreview ] = useState(false);
    const [ showInfo, setShowInfo ] = useState(false);
    const [ darkMode, toggleDarkMode ] = useDarkMode();
    const [ navCollapsed, setNavCollapsed ] = useState(() => {
      try {
        return window.localStorage.getItem('nm-neural-wave-collapsed') === '1';
      } catch {
        return false;
      }
    });

    const handleMenuToggle = useCallback(() => setPreview(prevState => !prevState), []);

    const handleDisconnect = useCallback(async () => {
        try
        {
            if( !user?.token ) return;
            await dispatch( disconnectAction( user.token, USER_DISCONNECT_URL ) );
            navigate('/', { replace: true });
        }
        catch(error)
        {
            console.error('Failed To Disconnect Admin', error.message);
        }
    }, [ user?.token, dispatch, navigate ])

    const ADMIN_NAVIGATION = useMemo(() =>  [
        {
            label: "Categories",
            page: "categories",
            icon: <CategoryTwoToneIcon />,
        },
        {
            label: "Customers",
            page: "customers",
            icon: <DvrTwoToneIcon />
        },
        {
            label: "Products",
            page: "products",
            icon: <ShoppingBagTwoToneIcon />,
        },
        {
            label: "Statistics",
            page: "statistics",
            icon: <BarChartTwoToneIcon />,
        },
        {
            label: "Logout",
            page: "/",
            icon: <ExitToAppTwoToneIcon />,
            handler: handleDisconnect
        },
    ], [ handleDisconnect ]);

    const STOREFRONT_PRIMARY_NAV = useMemo(() => [
        {
            label: 'Home',
            page: '/',
            icon: <MdHome />,
        },
        {
            label: 'Shop', page: '/customer/products',
            buttonLabels: ['Update', 'Delete'],
            icon: <MdOutlineInventory2/>
        },
    ], []);

    const AUTH_ONLY_NAV = useMemo(() => [
        {
            label: 'My Orders', page: '/customer/orders',
            buttonLabels: ['Update', 'Delete'],
            icon: <MdReceiptLong/>
        },
        {
            label: 'My Account', page: '/customer/account',
            buttonLabels: ['Update', 'Delete'],
            icon: <MdOutlinePerson/>
        },
    ], []);

    const PUBLIC_AUTH_NAV = useMemo(() => [
        {
            label: 'Sign in',
            page: '/login',
            icon: <MdLogin />,
        },
        {
            label: 'Create account',
            page: '/register',
            icon: <MdPersonAdd />,
        },
    ], []);

    const LOGOUT_OPTION = useMemo(() => ({
        label: 'Logout',
        page: '/',
        magnetKey: 'logout',
        buttonLabels: ['Update', 'Delete'],
        icon: <MdLogout/>,
        handler: handleDisconnect,
    }), [ handleDisconnect ]);

      useEffect(() => {
        const { role } = JSON.parse(localStorage.getItem('user') || '{}');

        role === 'Admin'
        ? setMenu(ADMIN_NAVIGATION)
        : setMenu([...STOREFRONT_PRIMARY_NAV, ...AUTH_ONLY_NAV, LOGOUT_OPTION]);

    }, [ ADMIN_NAVIGATION, STOREFRONT_PRIMARY_NAV, AUTH_ONLY_NAV, LOGOUT_OPTION ])

    useEffect(() => {
      if (variant !== 'customer') return undefined;

      const stored = JSON.parse(localStorage.getItem('user') || 'null');
      if (stored?.token && !isAuthenticatedUser(user)) {
        dispatch(authAction(stored.token, `${ORIGIN}/user/auth`));
      }

      return undefined;
    }, [variant, dispatch, user]);

    useEffect(() => {
      if (variant !== 'customer') return undefined;
      document.documentElement.classList.toggle('nm-nav-collapsed', navCollapsed);
      try {
        window.localStorage.setItem('nm-neural-wave-collapsed', navCollapsed ? '1' : '0');
      } catch {
        /* ignore quota / private mode */
      }
      return () => document.documentElement.classList.remove('nm-nav-collapsed');
    }, [navCollapsed, variant]);

    if (variant === 'customer') {
      const primaryCustomerNavigation = authenticated
        ? [...STOREFRONT_PRIMARY_NAV, ...AUTH_ONLY_NAV]
        : STOREFRONT_PRIMARY_NAV;
      const logoutOption = authenticated ? LOGOUT_OPTION : null;
      const ThemeIcon = darkMode ? MdLightMode : MdDarkMode;
      const showStorefrontFooter = shouldShowCustomerFooter(location.pathname);

      return (
        <div
          className={`b25-customer-shell${darkMode ? ' is-dark' : ''}${navCollapsed ? ' is-nav-collapsed' : ''}`}
        >
          <NeuralWaveNav
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
            user={user}
            isAuthenticated={authenticated}
            addToCart={addToCart}
            removeFromCart={removeFromCart}
            navigation={primaryCustomerNavigation}
            logoutOption={logoutOption}
            collapsed={navCollapsed}
            onToggleCollapsed={() => setNavCollapsed((current) => !current)}
          />

          <header className="b25-customer-command">
            <div className="b25-customer-command__brand-zone">
              <MarketBrandLink to="/" />
            </div>

            <div className="b25-customer-command__center">
              <StorefrontCategoryNav categories={storefrontCategories} />
            </div>

            <div className="b25-customer-command__meta">
              {authenticated ? (
                <>
                  <Link to="/customer/account" className="b25-customer-command__account">
                    <MdOutlinePerson aria-hidden="true" />
                    <span>{[user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.username}</span>
                  </Link>
                  <nav className="b25-customer-command__mobile-tools" aria-label="Account actions">
                    <button
                      type="button"
                      className="b25-customer-command__tool is-logout"
                      aria-label="Logout"
                      onClick={handleDisconnect}
                    >
                      <MdLogout aria-hidden="true" />
                    </button>
                    <Link
                      to="/customer/account"
                      className={`b25-customer-command__tool${location.pathname.startsWith('/customer/account') ? ' is-active' : ''}`}
                      aria-label="Account"
                      aria-current={location.pathname.startsWith('/customer/account') ? 'page' : undefined}
                    >
                      <MdOutlinePerson aria-hidden="true" />
                    </Link>
                  </nav>
                </>
              ) : (
                <nav className="b25-customer-command__auth" aria-label="Account access">
                  <button
                    type="button"
                    className="b25-customer-command__auth-login"
                    aria-label="Sign in"
                    onClick={(event) => onOpenSignIn?.(event.currentTarget)}
                  >
                    <span className="b25-command-icon" aria-hidden="true">
                      <MdLogin />
                    </span>
                    <span>Sign in</span>
                  </button>
                  <button
                    type="button"
                    className="b25-customer-command__auth-register"
                    aria-label="Create account"
                    onClick={(event) => onOpenRegister?.(event.currentTarget)}
                  >
                    <span className="b25-command-icon" aria-hidden="true">
                      <MdPersonAdd />
                    </span>
                    <span>Create account</span>
                  </button>
                </nav>
              )}
              <button
                type="button"
                className="b25-theme-toggle b25-theme-toggle--mobile"
                onClick={toggleDarkMode}
                aria-pressed={darkMode}
                aria-label={darkMode ? 'Use light theme' : 'Use dark theme'}
              >
                <ThemeIcon aria-hidden="true" />
                <span className="b25-theme-toggle__label">Theme</span>
              </button>
            </div>
          </header>

          <main className="b25-customer-main">
            <RouteScrollRestoration />
            <div className="b25-customer-main__body">
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  className="b291-customer-route"
                  initial={false}
                  animate={{ opacity: 1, y: 0 }}
                  exit={getPageContentExitMotion(reduceMotion)}
                  transition={{
                    duration: reduceMotion ? 0 : PAGE_CONTENT_EXIT_DURATION,
                    ease: PAGE_CONTENT_EASE,
                  }}
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </div>
            {showStorefrontFooter ? (
              <StorefrontFooter
                authenticated={authenticated}
                onOpenSignIn={onOpenSignIn}
                onOpenRegister={onOpenRegister}
                categories={storefrontCategories}
              />
            ) : null}
          </main>

          {showStorefrontFooter ? (
            <StorefrontMobileBottomNav
              authenticated={authenticated}
              onOpenSignIn={onOpenSignIn}
              categories={storefrontCategories}
            />
          ) : null}
        </div>
      );
    }

return (
    <motion.div
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageTransition}
        style={{
            display: 'flex',
            color: darkMode ? 'white' : 'black'
        }}>

      { darkMode && <FallingStars/> }

      { !preview ?
        <Box
          component="div"
        >
          <motion.div
              style={{
                  top: 1,
                  right: 0,
                  position: 'absolute',
                  zIndex: 1
              }}
              {...slideAnimation('right')}
          >
              <Alert
                  severity="info"
                  icon={<InfoTwoToneIcon />}
                  onMouseEnter={()  => setShowInfo(true)}
                  onMouseLeave={()  => setShowInfo(false)}
                  sx={{ padding: '0px 10px', borderRadius: '0px', borderTopLeftRadius: '10px'}}
              >
                  <AlertTitle
                      sx={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          width: showInfo ? '175px' : '0px',
                          transition: 'width 0.5s ease-out',
                      }}
                  >
                      { 'Dashboard on Left Side' }
                  </AlertTitle>
              </Alert>
          </motion.div>


          <RiMenuFold2Line
            size={25}
            onClick={handleMenuToggle}
            style={{
                cursor: 'pointer',
                position:'fixed',
                boxShadow: '1px 1px 1px 1px gray',
                borderTopRightRadius:'5px',
                padding: '5px 9px',
                zIndex: 1
            }}
        />
        </Box>
      : null }

      <Drawer
        anchor="left"
        open={preview}
        onClick={handleMenuToggle}
        disableRestoreFocus
        disableEnforceFocus
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            background: darkMode ? 'black' : '',
            color: darkMode ? 'white' : 'black',
            boxShadow: '0px 0px 0px 0.5px white',
          },
        }}
      >
        <Typography
          variant="h6"
          sx={{ padding: '16px' }}
        >
            { menuHeader }
        </Typography>

        <Divider sx={{background: darkMode ? 'white' : 'black'}}/>
        <List>
            <Box >
              <FormControlLabel
                sx={{gap:'80px'}}
                label="Dark Mode"
                labelPlacement='start'
                control={<Switch checked={darkMode} onChange={toggleDarkMode} />}
              />
            </Box>
        <Divider sx={{background: darkMode ? 'white' : 'black'}}/>

          {menu.map((option, index) => (
            <ListItem button key={index}>
             <Link
                   to={option.page}
                   style={{
                       textDecoration: 'none',
                       color: 'inherit',
                       display: 'flex',
                       alignItems: 'center',
                       width: '100%'
                   }}
               >
              <ListItemText
                primary={option.label}
                onClick={option?.handler}
              />
              <ListItemSecondaryAction>
                {option.icon}
              </ListItemSecondaryAction>
            </Link>
          </ListItem>
          ))}
        </List>

      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          overflow:'hidden',
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          marginLeft: { sm: `${drawerWidth}px` },
        }}
      >

            <Outlet />
        <Toolbar />
      </Box>

    </motion.div>
  )
});

export default NavbarModel
