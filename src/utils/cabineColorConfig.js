export const CABIN_COLORS = {
  1: { hex: '#3B82F6', twClass: 'text-blue-400 bg-blue-500/20 border-blue-500/30' },
  2: { hex: '#10B981', twClass: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' },
  3: { hex: '#8B5CF6', twClass: 'text-purple-400 bg-purple-500/20 border-purple-500/30' },
  4: { hex: '#F97316', twClass: 'text-orange-400 bg-orange-500/20 border-orange-500/30' },
  5: { hex: '#EC4899', twClass: 'text-pink-400 bg-pink-500/20 border-pink-500/30' },
  6: { hex: '#EF4444', twClass: 'text-red-400 bg-red-500/20 border-red-500/30' }
};

const DEFAULT_COLOR = { hex: '#94A3B8', twClass: 'text-slate-400 bg-slate-500/20 border-slate-500/30' };

export const getCabineColor = (cabineNumber) => {
  return CABIN_COLORS[cabineNumber]?.hex || DEFAULT_COLOR.hex;
};

export const getCabineColorClass = (cabineNumber) => {
  return CABIN_COLORS[cabineNumber]?.twClass || DEFAULT_COLOR.twClass;
};