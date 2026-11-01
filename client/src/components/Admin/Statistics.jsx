import React, { useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import ShoppingCartCheckoutRoundedIcon from "@mui/icons-material/ShoppingCartCheckoutRounded";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import { loadUsersOrders } from "../../actions/orderActions";
import { useDarkMode } from "../../hooks/darkMode";
import { ORIGIN } from "../../App";
import AdminPageContainer from "./AdminPageContainer";
import AdminPageHeader from "./AdminPageHeader";
import AdminMetricCard from "./AdminMetricCard";
import AdminSectionCard from "./AdminSectionCard";
import PieGraph from "./PieGraph";
import QtyGraph from "./QtyGraph";
import { buildAdminStatisticsData } from "./adminStatisticsData";
import { getVisibleCategoryUnits, selectVisibleCategories, toggleHiddenCategory } from "./adminStatisticsChart";
import "../../css/admin-statistics.css";

const integer = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const insightIcons = {
  category: TrendingUpRoundedIcon,
  customer: GroupsRoundedIcon,
  volume: InsightsRoundedIcon,
};

export default function Statistics() {
  const LOAD_ADMIN_ORDERS_URL = `${ORIGIN}/admin/user`;
  const dispatch = useDispatch();
  const [darkMode] = useDarkMode();
  const reducedMotion = useReducedMotion();
  const { users = [] } = useSelector((state) => state.ordersReducer);
  const [status, setStatus] = useState(users.length ? "ready" : "loading");
  const [error, setError] = useState("");
  const statistics = useMemo(() => buildAdminStatisticsData(users), [users]);
  const [hiddenCategoryNames, setHiddenCategoryNames] = useState(() => new Set());
  const visibleCategories = useMemo(
    () => selectVisibleCategories(statistics.categories, hiddenCategoryNames),
    [statistics.categories, hiddenCategoryNames]
  );
  const visibleUnits = getVisibleCategoryUnits(visibleCategories);
  const toggleCategory = (categoryName) => {
    setHiddenCategoryNames((hidden) => toggleHiddenCategory(hidden, categoryName));
  };

  useEffect(() => {
    let active = true;
    const fetchUsersOrders = async () => {
      if (!users.length) setStatus("loading");
      const response = await dispatch(loadUsersOrders(LOAD_ADMIN_ORDERS_URL));
      if (!active) return;
      if (response?.code === 200) {
        setError("");
        setStatus("ready");
      } else {
        setError(response?.message || "Statistics could not be loaded.");
        setStatus("error");
      }
    };
    fetchUsersOrders();
    return () => { active = false; };
  }, [dispatch, LOAD_ADMIN_ORDERS_URL]);

  const metrics = [
    {
      tone: "orange",
      icon: ReceiptLongOutlinedIcon,
      label: "Order records",
      value: integer.format(statistics.metrics.orderRecords),
      detail: "Persisted purchase snapshots",
    },
    {
      tone: "blue",
      icon: GroupsRoundedIcon,
      label: "Customers with orders",
      value: integer.format(statistics.metrics.customersWithOrders),
      detail: "Accounts containing order records",
    },
    {
      tone: "purple",
      icon: ShoppingCartCheckoutRoundedIcon,
      label: "Units sold",
      value: integer.format(statistics.metrics.units),
      detail: "Sum of recorded quantities",
    },
    {
      tone: "green",
      icon: PaymentsOutlinedIcon,
      label: "Recorded revenue",
      value: currency.format(statistics.metrics.revenue),
      detail: "Saved totals; price × quantity fallback",
    },
  ];

  return (
    <AdminPageContainer className="admin-statistics">
        <AdminPageHeader
          title="Statistics"
          description="Truthful performance insights from recorded customer purchases."
        />

        <div className="admin-page__body">
          {status === "loading" && !statistics.hasData ? (
            <section className="admin-statistics__state admin-surface" role="status">
              Loading recorded statistics…
            </section>
          ) : status === "error" && !statistics.hasData ? (
            <section className="admin-statistics__state admin-statistics__state--error admin-surface" role="alert">
              {error}
            </section>
          ) : !statistics.hasData ? (
            <section className="admin-statistics__state admin-surface">
              <strong>No statistical data available</strong>
              <span>Recorded purchases will appear here when customers place orders.</span>
            </section>
          ) : (
            <>
              <section className="admin-statistics__metrics" aria-label="Recorded commerce metrics">
                {metrics.map((metric) => <AdminMetricCard key={metric.label} {...metric} />)}
              </section>

              <div className="admin-statistics__grid" id="statistics_form">
                <PieGraph statistics={statistics} visibleCategories={visibleCategories} visibleUnits={visibleUnits} onToggleCategory={toggleCategory} darkMode={darkMode} reducedMotion={reducedMotion} />
                <QtyGraph statistics={statistics} visibleCategories={visibleCategories} onToggleCategory={toggleCategory} darkMode={darkMode} reducedMotion={reducedMotion} />
              </div>

              <AdminSectionCard
                className="admin-statistics__insights"
                icon={AutoAwesomeRoundedIcon}
                tone="orange"
                title="Key Insights"
                subtitle="Deterministic facts from the same recorded purchase data."
                aria-label="Key insights"
              >
                <ul className="admin-statistics__insights-list">
                  {statistics.insights.map((insight) => {
                    const Icon = insightIcons[insight.id] || InsightsRoundedIcon;
                    return (
                      <li
                        key={insight.id}
                        className={`admin-statistics__insight admin-statistics__insight--${insight.tone}`}
                      >
                        <span className="admin-statistics__insight-icon" aria-hidden="true">
                          <Icon fontSize="inherit" />
                        </span>
                        <div>
                          <strong>{insight.title}</strong>
                          <p>{insight.body}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </AdminSectionCard>
            </>
          )}
        </div>
    </AdminPageContainer>
  );
}
