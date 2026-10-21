import { AlignJustify, Box, Maximize, Maximize2, Scaling } from 'lucide-react';

export const PIECE_SIZES = [
  { id: 'muito_pequena', label: 'Muito Pequena', value: 'muito_pequena', color: '#3B82F6', twColor: 'text-blue-500', twBg: 'bg-blue-500/10', twBorder: 'border-blue-500/30', icon: AlignJustify },
  { id: 'pequena', label: 'Pequena', value: 'pequena', color: '#10B981', twColor: 'text-emerald-500', twBg: 'bg-emerald-500/10', twBorder: 'border-emerald-500/30', icon: Box },
  { id: 'media', label: 'Média', value: 'media', color: '#F59E0B', twColor: 'text-amber-500', twBg: 'bg-amber-500/10', twBorder: 'border-amber-500/30', icon: Maximize },
  { id: 'grande', label: 'Grande', value: 'grande', color: '#F97316', twColor: 'text-orange-500', twBg: 'bg-orange-500/10', twBorder: 'border-orange-500/30', icon: Maximize2 },
  { id: 'muito_grande', label: 'Muito Grande', value: 'muito_grande', color: '#EF4444', twColor: 'text-red-500', twBg: 'bg-red-500/10', twBorder: 'border-red-500/30', icon: Scaling }
];

export const getPieceSizeConfig = (value) => {
  return PIECE_SIZES.find(size => size.value === value) || null;
};

export const getPieceSizeColor = (value) => {
  const config = getPieceSizeConfig(value);
  return config ? config.color : '#94A3B8';
};

export const getPieceSizeLabel = (value) => {
  const config = getPieceSizeConfig(value);
  return config ? config.label : 'Não Informado';
};

export const getPieceSizeIcon = (value) => {
  const config = getPieceSizeConfig(value);
  return config ? config.icon : Box;
};