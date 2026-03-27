
export const COLOR_PALETTE = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#ef4444', // Red
  '#06b6d4', // Sky
  '#f97316', // Orange
  '#84cc16', // Lime
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#d946ef', // Fuchsia
  '#f43f5e', // Rose
  '#22c55e', // Green
];

export const getComparisonColor = (index) => {
  return COLOR_PALETTE[index % COLOR_PALETTE.length];
};
