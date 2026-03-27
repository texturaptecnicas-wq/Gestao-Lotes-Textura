
export const CLIENT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#EF4444', // Red
  '#06B6D4', // Sky
  '#F97316', // Orange
  '#84CC16', // Lime
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#D946EF', // Fuchsia
  '#F43F5E', // Rose
  '#22C55E', // Green
];

const clientColorMap = new Map();
let colorIndex = 0;

export const getClientColor = (clientName) => {
  if (!clientName) return '#94a3b8'; // Default slate gray
  const normalized = clientName.trim().toUpperCase();
  if (clientColorMap.has(normalized)) {
    return clientColorMap.get(normalized);
  }
  const color = CLIENT_COLORS[colorIndex % CLIENT_COLORS.length];
  clientColorMap.set(normalized, color);
  colorIndex++;
  return color;
};
