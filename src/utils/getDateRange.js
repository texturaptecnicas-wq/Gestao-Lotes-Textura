
export const getNextDay = (dateString) => {
  if (!dateString) return null;
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

  let startStr = formatDate(today);
  let endStr = formatDate(today);

  switch (periodType) {
    case 'today':
      startStr = endStr;
      break;
    case 'week': {
      // Calculate Monday to Friday of the current week
      const day = today.getDay(); // 0 is Sunday, 1 is Monday
      const diffToMonday = today.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(today);
      monday.setDate(diffToMonday);
      
      const friday = new Date(monday);
      friday.setDate(monday.getDate() + 4);
      
      startStr = formatDate(monday);
      endStr = formatDate(friday);
      break;
    }
    case 'month': {
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      startStr = formatDate(firstDayOfMonth);
      // Let it go to the current day or end of month depending on preference. Using current day for now.
      endStr = formatDate(today); 
      break;
    }
    case 'year': {
      const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
      startStr = formatDate(firstDayOfYear);
      endStr = formatDate(today);
      break;
    }
    default:
      startStr = endStr;
  }

  return { startDate: startStr, endDate: endStr };
};
