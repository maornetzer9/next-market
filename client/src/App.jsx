import { Navigate, Route, Routes } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import ProtectedRoute from './components/ProtectedRoute';
import { InitialViewReady, RouteWaitSignal } from './UI/LoadingCoordinator';

const Login = lazy(() => import('./components/Login'));
const Register = lazy(() => import('./components/Register'));
const Admin = lazy(() => import('./components/Admin'));
const AdminDashboard = lazy(() => import('./components/Admin/AdminDashboard'));
const AdminCategories = lazy(() => import('./components/Admin/Categories'));
const AdminCustomers = lazy(() => import('./components/Admin/Customers'));
const AdminProducts = lazy(() => import('./components/Admin/Products'));
const AdminStatistics = lazy(() => import('./components/Admin/Statistics'));
const Customer = lazy(() => import('./components/Customer'));
const CustomerHomepage = lazy(() => import('./components/Customer/Homepage'));
const CustomerProducts = lazy(() => import('./components/Customer/Products'));
const CustomerOrders = lazy(() => import('./components/Customer/Orders'));
const CustomerAccount = lazy(() => import('./components/Customer/Account'));
const CustomerCart = lazy(() => import('./components/Customer/CartPage'));

export const ORIGIN = import.meta.env.VITE_ORIGIN;

const withRouteLoader = (element) => (
  <Suspense fallback={<RouteWaitSignal />}>
    {element}
  </Suspense>
);

const withInitialReady = (element) => withRouteLoader(<InitialViewReady>{element}</InitialViewReady>);

function App() {
    return (
        <Routes>

            {/* Auth */}
          <Route path="/login" element={withInitialReady(<Login />)} />
          <Route path="/register" element={withInitialReady(<Register />)} />

            {/* Public storefront shell + protected commerce routes */}
          <Route path="/" element={withRouteLoader(<Customer />)}>
            <Route index element={withInitialReady(<CustomerHomepage />)} />
            <Route path="customer/products" element={withRouteLoader(<CustomerProducts />)} />
            <Route path="customer" element={<Navigate to="/" replace />} />
            <Route element={<ProtectedRoute allowedRoles={['User', 'Admin']} redirectTo="/login" />}>
              <Route path="customer/orders" element={withInitialReady(<CustomerOrders />)} />
              <Route path="customer/account" element={withInitialReady(<CustomerAccount />)} />
              <Route path="customer/cart" element={withInitialReady(<CustomerCart />)} />
            </Route>
          </Route>

            {/* Protected Routes For Admin */}
          <Route element={<ProtectedRoute allowedRoles={['Admin']} redirectTo="/login" />}>
            <Route path="/admin" element={withRouteLoader(<Admin />)}>
                <Route index element={withInitialReady(<AdminDashboard />)} />
                <Route path="categories" element={withInitialReady(<AdminCategories />)} />
                <Route path="customers" element={withInitialReady(<AdminCustomers />)} />
                <Route path="products" element={withInitialReady(<AdminProducts />)} />
                <Route path="statistics" element={withInitialReady(<AdminStatistics />)} />
            </Route>
          </Route>

        </Routes>
  );
}

export default App;
