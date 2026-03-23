export const getMonday = (d) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); 
  return new Date(date.setDate(diff));
};

export const getFriday = (d) => {
  const monday = getMonday(d);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  return friday;
};

export const formatYYYYMMDD = (date) => {
  if (!date) return '';
  return date.toISOString().split('T')[0];
};

export const getPeriodRange = (periodType, dateStr) => {
  const date = new Date(dateStr + 'T12:00:00Z');
  
  if (periodType === 'daily') {
    return { start: formatYYYYMMDD(date), end: formatYYYYMMDD(date) };
  }
  
  if (periodType === 'weekly') {
    const monday = getMonday(date);
    const friday = getFriday(date);
    return { start: formatYYYYMMDD(monday), end: formatYYYYMMDD(friday) };
  }
  
  if (periodType === 'monthly') {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return { start: formatYYYYMMDD(start), end: formatYYYYMMDD(end) };
  }

  return { start: formatYYYYMMDD(date), end: formatYYYYMMDD(date) };
};