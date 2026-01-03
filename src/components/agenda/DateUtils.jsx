import { 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth,
  addDays,
  format,
  isSameDay,
  isToday
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const getDateRange = (date, viewMode) => {
  const baseDate = new Date(date);
  
  switch (viewMode) {
    case 'day':
      return {
        start: startOfDay(baseDate),
        end: endOfDay(baseDate)
      };
    case 'week':
      return {
        start: startOfWeek(baseDate, { weekStartsOn: 0 }),
        end: endOfWeek(baseDate, { weekStartsOn: 0 })
      };
    case 'month':
      return {
        start: startOfMonth(baseDate),
        end: endOfMonth(baseDate)
      };
    default:
      return {
        start: startOfDay(baseDate),
        end: endOfDay(baseDate)
      };
  }
};

export const getWeekDays = (date) => {
  const start = startOfWeek(date, { weekStartsOn: 0 });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
};

export const formatDateForDisplay = (date, viewMode) => {
  switch (viewMode) {
    case 'day':
      return format(date, "dd 'de' MMMM, yyyy", { locale: ptBR });
    case 'week':
      const weekStart = startOfWeek(date, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(date, { weekStartsOn: 0 });
      return `${format(weekStart, 'dd/MM', { locale: ptBR })} - ${format(weekEnd, 'dd/MM/yyyy', { locale: ptBR })}`;
    case 'month':
      return format(date, "MMMM 'de' yyyy", { locale: ptBR });
    default:
      return format(date, "dd 'de' MMMM, yyyy", { locale: ptBR });
  }
};

export { isSameDay, isToday, format };