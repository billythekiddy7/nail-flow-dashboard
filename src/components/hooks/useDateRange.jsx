import { useState, useMemo, useCallback } from 'react';
import { 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear 
} from 'date-fns';

export function useDateRange(initialPeriod = 'month') {
  const [period, setPeriod] = useState(initialPeriod);
  const [customRange, setCustomRange] = useState({ startDate: null, endDate: null });

  const dateRange = useMemo(() => {
    const now = new Date();
    switch (period) {
      case 'today':
        return { startDate: startOfDay(now), endDate: endOfDay(now) };
      case 'week':
        return { startDate: startOfWeek(now, { weekStartsOn: 0 }), endDate: endOfWeek(now, { weekStartsOn: 0 }) };
      case 'year':
        return { startDate: startOfYear(now), endDate: endOfYear(now) };
      case 'custom':
        // Se o range customizado ainda não estiver setado, usa o mês atual como padrão
        return { 
          startDate: customRange.startDate ? startOfDay(customRange.startDate) : startOfMonth(now),
          endDate: customRange.endDate ? endOfDay(customRange.endDate) : endOfMonth(now)
        };
      case 'month':
      default:
        return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
    }
  }, [period, customRange.startDate, customRange.endDate]);

  // A função setDateRange agora gerencia o período 'custom' automaticamente.
  const setDateRangeCallback = useCallback((newRange) => {
    setCustomRange(newRange);
    setPeriod('custom');
  }, []);

  return { period, setPeriod, dateRange, setDateRange: setDateRangeCallback };
}