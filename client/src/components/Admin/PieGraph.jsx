import React, { useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip } from "chart.js";
import PieChartOutlineRoundedIcon from "@mui/icons-material/PieChartOutlineRounded";
import AdminSectionCard from "./AdminSectionCard";
import StatisticsCategoryToggle from "./StatisticsCategoryToggle";
import { getAdminChartTheme } from "./adminStatisticsChart";

ChartJS.register(ArcElement, Tooltip);

export default function PieGraph({ statistics, visibleCategories, visibleUnits, onToggleCategory, darkMode, reducedMotion }) {
  const { categories } = statistics;
  const theme = getAdminChartTheme(darkMode, reducedMotion);
  const data = useMemo(
    () => ({
      labels: visibleCategories.map((category) => category.label),
      datasets: [{
        label: "Units",
        data: visibleCategories.map((category) => category.quantity),
        backgroundColor: visibleCategories.map((category) => category.color),
        borderColor: theme.border,
        borderWidth: 2,
        hoverBorderWidth: 2,
        hoverOffset: 4,
      }],
    }),
    [visibleCategories, theme.border]
  );
  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: theme.animation,
      cutout: "67%",
      plugins: {
        legend: { display: false },
        tooltip: {
          ...theme.tooltip,
          callbacks: {
            label(context) {
              const value = Number(context.raw) || 0;
              const share = visibleUnits ? Math.round((value / visibleUnits) * 100) : 0;
              return ` ${context.label}: ${value.toLocaleString()} units (${share}%)`;
            },
          },
        },
      },
      elements: { arc: { borderRadius: 3 } },
    }),
    [visibleUnits, theme]
  );

  return (
    <AdminSectionCard
      className="admin-statistics__chart-card admin-statistics__chart-card--donut"
      icon={PieChartOutlineRoundedIcon}
      tone="orange"
      title="Quantity sold per category"
      subtitle="Recorded quantity from real purchase snapshots."
      aria-label="Quantity sold per category"
    >
      <div className="admin-statistics__donut-layout">
        <div className="admin-statistics__donut-plot">
          {visibleCategories.length ? <Doughnut
            data={data}
            options={options}
            role="img"
            aria-label={`Category distribution totaling ${visibleUnits} units`}
          /> : null}
          <div className="admin-statistics__donut-center" aria-hidden="true">
            <strong>{visibleUnits.toLocaleString()}</strong>
            <span>Items sold</span>
          </div>
        </div>
        <ul className="admin-statistics__legend" aria-label="Category totals">
          {categories.map((category) => {
            const active = visibleCategories.includes(category);
            const share = active && visibleUnits
              ? `${Math.round((category.quantity / visibleUnits) * 100)}%`
              : "—";
            return (
              <li key={category.name} style={{ "--series-color": category.color }}>
                <StatisticsCategoryToggle category={category} active={active} onToggle={onToggleCategory}>
                  <span className="admin-statistics__legend-dot" aria-hidden="true" />
                  <span className="admin-statistics__legend-name">{category.label}</span>
                  <strong>{category.quantity.toLocaleString()}</strong>
                  <small>{share}</small>
                </StatisticsCategoryToggle>
              </li>
            );
          })}
        </ul>
      </div>
    </AdminSectionCard>
  );
}
