import React, { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from "chart.js";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import AdminSectionCard from "./AdminSectionCard";
import StatisticsCategoryToggle from "./StatisticsCategoryToggle";
import { getAdminChartTheme } from "./adminStatisticsChart";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export default function QtyGraph({ statistics, visibleCategories, onToggleCategory, darkMode, reducedMotion }) {
  const { categories, customers } = statistics;
  const theme = getAdminChartTheme(darkMode, reducedMotion);
  const data = useMemo(
    () => ({
      labels: customers.map((customer) => customer.label),
      datasets: visibleCategories.map((category) => ({
        label: category.label,
        data: customers.map((customer) => customer.byCategory.get(category.name) || 0),
        backgroundColor: category.color,
        borderColor: category.color,
        borderWidth: 0,
        borderRadius: 4,
        borderSkipped: false,
        stack: "recorded-quantity",
        categoryPercentage: 0.7,
        barPercentage: 0.82,
      })),
    }),
    [visibleCategories, customers]
  );
  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: theme.animation,
      interaction: { intersect: false, mode: "index" },
      plugins: {
        legend: { display: false },
        tooltip: {
          ...theme.tooltip,
          callbacks: {
            label: (context) => ` ${context.dataset.label}: ${(Number(context.raw) || 0).toLocaleString()} units`,
          },
        },
      },
      scales: {
        x: {
          stacked: true,
          border: { color: theme.grid },
          grid: { display: false },
          ticks: {
            color: theme.text,
            autoSkip: false,
            maxRotation: 0,
            font: { size: 10, weight: "600" },
            callback(value) {
              const label = this.getLabelForValue(value);
              return label.length > 18 ? `${label.slice(0, 17)}…` : label;
            },
          },
        },
        y: {
          stacked: true,
          beginAtZero: true,
          border: { display: false },
          grid: { color: theme.grid, drawTicks: false },
          ticks: { color: theme.text, precision: 0, padding: 8, font: { size: 10 } },
        },
      },
    }),
    [theme]
  );
  const wide = customers.length > 6;

  return (
    <AdminSectionCard
      className="admin-statistics__chart-card admin-statistics__chart-card--bar"
      icon={BarChartRoundedIcon}
      tone="blue"
      title="Quantity by category grouped by customer"
      subtitle="Real customers with recorded units stacked by category."
      aria-label="Quantity by category grouped by customer"
    >
      <div className={`admin-statistics__bar-scroll${wide ? " is-wide" : ""}`}>
        <div
          className="admin-statistics__bar-plot"
          style={wide ? { minWidth: `${customers.length * 88}px` } : undefined}
        >
          {visibleCategories.length ? <Bar
            data={data}
            options={options}
            role="img"
            aria-label={`Recorded quantities for ${customers.length} customers grouped by category`}
          /> : <div className="admin-statistics__bar-empty">Select a category below to explore recorded quantities.</div>}
        </div>
      </div>
      <ul className="admin-statistics__series-legend" aria-label="Chart categories">
        {categories.map((category) => (
          <li key={category.name} style={{ "--series-color": category.color }}>
            <StatisticsCategoryToggle category={category} active={visibleCategories.includes(category)} onToggle={onToggleCategory}>
              <span className="admin-statistics__legend-dot" aria-hidden="true" />
              {category.label}
            </StatisticsCategoryToggle>
          </li>
        ))}
      </ul>
    </AdminSectionCard>
  );
}
