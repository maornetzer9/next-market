import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Chart as ChartJS,
  CategoryScale,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useReducedMotion } from 'framer-motion';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import LocalMallOutlinedIcon from '@mui/icons-material/LocalMallOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import InsertChartOutlinedRoundedIcon from '@mui/icons-material/InsertChartOutlinedRounded';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import DonutSmallOutlinedIcon from '@mui/icons-material/DonutSmallOutlined';
import { MdArrowForward, MdCalendarMonth } from 'react-icons/md';
import { loadProductsAction } from '../../actions/productActions';
import { loadUsersOrders } from '../../actions/orderActions';
import { useDarkMode } from '../../hooks/darkMode';
import { ORIGIN } from '../../App';
import AdminPageContainer from './AdminPageContainer';
import AdminPageHeader from './AdminPageHeader';
import AdminMetricCard from './AdminMetricCard';
import AdminSectionCard from './AdminSectionCard';
import AdminStatusBadge from './AdminStatusBadge';
import AdminEntityImage from './AdminEntityImage';
import { getAdminChartTheme } from './adminStatisticsChart';
import { buildAdminDashboardData } from './adminDashboardData';
import '../../css/admin-dashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip
);

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

const integer = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

function formatCurrency(value) {
  return currency.format(Number(value) || 0);
}

function PanelLink({ to, children }) {
  return (
    <Link className="admin-dashboard__panel-link" to={to}>
      <span>{children}</span>
      <MdArrowForward aria-hidden="true" />
    </Link>
  );
}

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const [darkMode] = useDarkMode();
  const reducedMotion = useReducedMotion();
  const chartTheme = useMemo(
    () => getAdminChartTheme(darkMode, reducedMotion),
    [darkMode, reducedMotion]
  );
  const { products = [] } = useSelector((state) => state.productsReducer);
  const { users = [] } = useSelector((state) => state.ordersReducer);

  useEffect(() => {
    const load = async () => {
      try {
        await Promise.all([
          dispatch(loadProductsAction(`${ORIGIN}/products/admin`, { authenticated: true })),
          dispatch(loadUsersOrders(`${ORIGIN}/admin/user`)),
        ]);
      } catch (error) {
        console.error('Failed to load admin dashboard data', error.message);
      }
    };
    load();
  }, [dispatch]);

  const dashboard = useMemo(
    () => buildAdminDashboardData(products, users),
    [products, users]
  );

  const revenuePoints = dashboard.revenueSeries.slice(-12);
  const chartData = useMemo(
    () => ({
      labels: revenuePoints.map((point) => point.label),
      datasets: [
        {
          data: revenuePoints.map((point) => point.value),
          borderColor: darkMode ? '#ff5638' : '#ff482c',
          borderWidth: 2.5,
          pointRadius: revenuePoints.length <= 6 ? 3 : 0,
          pointHoverRadius: 5,
          pointBackgroundColor: '#ff482c',
          pointBorderColor: darkMode ? '#071522' : '#ffffff',
          pointBorderWidth: 2,
          tension: 0.38,
          fill: true,
          backgroundColor: (context) => {
            const { chart } = context;
            const { ctx, chartArea } = chart;
            if (!chartArea) return 'rgba(255, 72, 44, 0.12)';
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, darkMode ? 'rgba(255, 72, 44, 0.32)' : 'rgba(255, 72, 44, 0.22)');
            gradient.addColorStop(1, 'rgba(255, 72, 44, 0)');
            return gradient;
          },
        },
      ],
    }),
    [darkMode, revenuePoints]
  );

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: chartTheme.animation,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { display: false },
        tooltip: {
          ...chartTheme.tooltip,
          displayColors: false,
          callbacks: { label: (context) => formatCurrency(context.raw) },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: {
            color: chartTheme.text,
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 7,
            font: { size: 11 },
          },
        },
        y: {
          beginAtZero: true,
          border: { display: false },
          grid: { color: chartTheme.grid },
          ticks: {
            color: chartTheme.text,
            maxTicksLimit: 5,
            font: { size: 11 },
            callback: (value) => `$${integer.format(value)}`,
          },
        },
      },
    }),
    [chartTheme]
  );

  const maxProductUnits = Math.max(1, ...dashboard.topProducts.map((item) => item.units));
  const maxCategoryCount = Math.max(1, ...dashboard.catalogMix.map((item) => item.count));

  return (
    <AdminPageContainer className="admin-dashboard">
      <AdminPageHeader
        title="Welcome back, Admin 👋"
        description="Here’s what’s happening with your store today."
        actions={
          <div className="admin-dashboard__date-range" aria-label={`Data range: ${dashboard.dateRange}`}>
            <MdCalendarMonth aria-hidden="true" />
            <span>{dashboard.dateRange}</span>
          </div>
        }
      />

      <div className="admin-page__body">
        <section className="admin-dashboard__metrics" aria-label="Store summary">
          <AdminMetricCard
            tone="orange"
            icon={Inventory2OutlinedIcon}
            label="Total Products"
            value={integer.format(dashboard.metrics.products)}
            detail="catalog items"
          />
          <AdminMetricCard
            tone="blue"
            icon={LocalMallOutlinedIcon}
            label="Order Records"
            value={integer.format(dashboard.metrics.orders)}
            detail={`${integer.format(dashboard.metrics.units)} units sold`}
          />
          <AdminMetricCard
            tone="purple"
            icon={PeopleAltOutlinedIcon}
            label="Customers"
            value={integer.format(dashboard.metrics.customers)}
            detail="with recorded orders"
          />
          <AdminMetricCard
            tone="green"
            icon={PaymentsOutlinedIcon}
            label="Recorded Revenue"
            value={formatCurrency(dashboard.metrics.revenue)}
            detail="from order snapshots"
          />
        </section>

        <div className="admin-dashboard__primary-grid">
          <AdminSectionCard
            className="admin-dashboard__revenue-card"
            icon={InsertChartOutlinedRoundedIcon}
            tone="orange"
            title="Revenue Overview"
            subtitle="Recorded revenue across available order dates."
            action={<span className="admin-dashboard__period">Available history</span>}
          >
            {revenuePoints.length ? (
              <div className="admin-dashboard__chart" aria-label="Revenue by recorded order date">
                <Line data={chartData} options={chartOptions} />
              </div>
            ) : (
              <div className="admin-dashboard__empty-chart" role="status">
                Revenue will appear when dated orders are available.
              </div>
            )}
          </AdminSectionCard>

          <AdminSectionCard
            className="admin-dashboard__recent-card"
            icon={ShoppingCartOutlinedIcon}
            tone="blue"
            title="Recent Purchases"
            subtitle="Latest records from customer orders."
            action={<PanelLink to="/admin/customers">View all</PanelLink>}
          >
            {dashboard.recentOrders.length ? (
              <ul className="admin-dashboard__orders">
                {dashboard.recentOrders.map((order) => (
                  <li className="admin-dashboard__order" key={order.key}>
                    <AdminEntityImage
                      src={order.thumbnail}
                      title={order.title}
                      width="42"
                      height="42"
                      className="admin-dashboard__order-image"
                    />
                    <span className="admin-dashboard__order-copy">
                      <strong>{order.title || `Item ${order.id || ''}`}</strong>
                      <span>{order.customerName}</span>
                    </span>
                    <strong className="admin-dashboard__order-total">
                      {formatCurrency(order.revenue)}
                    </strong>
                    <AdminStatusBadge status={order.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="admin-dashboard__empty">No customer orders yet.</p>
            )}
          </AdminSectionCard>
        </div>

        <div className="admin-dashboard__secondary-grid">
          <AdminSectionCard
            icon={EmojiEventsOutlinedIcon}
            tone="orange"
            title="Top Selling Products"
            subtitle="Products ranked by real ordered quantity."
            action={<PanelLink to="/admin/products">View all</PanelLink>}
          >
            {dashboard.topProducts.length ? (
              <ol className="admin-dashboard__ranking">
                {dashboard.topProducts.map((product, index) => (
                  <li key={product.key}>
                    <span className="admin-dashboard__rank">{index + 1}</span>
                    <AdminEntityImage
                      src={product.thumbnail}
                      title={product.title}
                      width="34"
                      height="34"
                      className="admin-dashboard__rank-image"
                    />
                    <span className="admin-dashboard__rank-name">{product.title}</span>
                    <span className="admin-dashboard__rank-units">{integer.format(product.units)} units</span>
                    <strong>{formatCurrency(product.revenue)}</strong>
                    <span className="admin-dashboard__bar" aria-hidden="true">
                      <i style={{ width: `${(product.units / maxProductUnits) * 100}%` }} />
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="admin-dashboard__empty">Top products will appear after the first order.</p>
            )}
          </AdminSectionCard>

          <AdminSectionCard
            icon={DonutSmallOutlinedIcon}
            tone="purple"
            title="Catalog Mix"
            subtitle="Current product distribution by category."
            action={<PanelLink to="/admin/categories">View categories</PanelLink>}
          >
            {dashboard.catalogMix.length ? (
              <ul className="admin-dashboard__mix">
                {dashboard.catalogMix.map((category, index) => (
                  <li key={category.name}>
                    <span className={`admin-dashboard__mix-dot is-${(index % 5) + 1}`} aria-hidden="true" />
                    <span>{category.name}</span>
                    <span className="admin-dashboard__mix-bar" aria-hidden="true">
                      <i style={{ width: `${(category.count / maxCategoryCount) * 100}%` }} />
                    </span>
                    <strong>{integer.format(category.count)}</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="admin-dashboard__empty">Catalog categories are not available yet.</p>
            )}
          </AdminSectionCard>
        </div>
      </div>
    </AdminPageContainer>
  );
}
