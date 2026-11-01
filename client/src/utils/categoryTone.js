const CATEGORY_TONES = [
  { bg: "rgba(255, 95, 31, 0.16)", fg: "#ff5f1f" },
  { bg: "rgba(45, 140, 255, 0.16)", fg: "#2d8cff" },
  { bg: "rgba(154, 85, 255, 0.16)", fg: "#9a55ff" },
  { bg: "rgba(0, 200, 83, 0.16)", fg: "#00c853" },
  { bg: "rgba(255, 193, 7, 0.18)", fg: "#e6a800" },
  { bg: "rgba(255, 98, 165, 0.16)", fg: "#ff62a5" },
];

/** Existing deterministic category accent language shared by Admin category surfaces. */
export function getCategoryTone(category) {
  const text = String(category || "").trim().toLowerCase();
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) hash += text.charCodeAt(index);
  return CATEGORY_TONES[hash % CATEGORY_TONES.length];
}
