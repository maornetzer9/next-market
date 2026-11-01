export function getAdminChartTheme(darkMode, reducedMotion) {
  return {
    text: darkMode ? "#c8d8e8" : "#526681",
    grid: darkMode ? "rgba(164, 190, 214, 0.13)" : "rgba(38, 70, 105, 0.11)",
    border: darkMode ? "#071522" : "#ffffff",
    animation: reducedMotion ? false : { duration: 620, easing: "easeOutQuart" },
    tooltip: {
      backgroundColor: darkMode ? "rgba(6, 22, 35, 0.96)" : "rgba(255, 255, 255, 0.98)",
      titleColor: darkMode ? "#f4f8fc" : "#0b1a33",
      bodyColor: darkMode ? "#c8d8e8" : "#526681",
      borderColor: darkMode ? "rgba(126, 164, 197, 0.26)" : "rgba(31, 68, 105, 0.16)",
      borderWidth: 1,
      cornerRadius: 10,
      padding: 11,
      displayColors: true,
      boxPadding: 4,
    },
  };
}

export const getAdminStatisticsChartTheme = getAdminChartTheme;

export function toggleHiddenCategory(hiddenCategoryNames, categoryName) {
  const next = new Set(hiddenCategoryNames);
  if (next.has(categoryName)) next.delete(categoryName);
  else next.add(categoryName);
  return next;
}

export function selectVisibleCategories(categories, hiddenCategoryNames) {
  return categories.filter((category) => !hiddenCategoryNames.has(category.name));
}

export function getVisibleCategoryUnits(categories) {
  return categories.reduce((total, category) => total + category.quantity, 0);
}
