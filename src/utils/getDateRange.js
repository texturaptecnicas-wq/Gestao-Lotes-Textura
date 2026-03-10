
export const getNextDay = (dateString) => {
  if (!dateString) return null;
  // Parse date as local time to avoid timezone shifts
  const [year, month, day] = dateString.split('-');
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + 1);
  
  const nextYear = date.getFullYear();
  const nextMonth = String(date.getMonth() + 1).padStart(2, '0');
  const nextDay = String(date.getDate()).padStart(2, '0');
  
  return `${nextYear}-${nextMonth}-${nextDay}`;
};

export const getDateRange = (periodType) => {
  const today = new Date();
  
  const formatDate = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const endStr = formatDate(today);
  let startStr = endStr;

  switch (periodType) {
    case 'today':
      startStr = endStr;
      break;
    case 'week':
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      startStr = formatDate(weekAgo);
      break;
    case 'month':
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      startStr = formatDate(firstDayOfMonth);
      
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      // Optional: If we want 'Este Mês' to cover the whole month including future days
      // return { startDate: startStr, endDate: formatDate(lastDayOfMonth) };
      break;
    case 'year':
      const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
      startStr = formatDate(firstDayOfYear);
      break;
    default:
      startStr = endStr;
  }

  return { startDate: startStr, endDate: endStr };
};
