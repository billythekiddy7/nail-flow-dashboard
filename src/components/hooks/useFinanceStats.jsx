import { useState, useEffect } from 'react';
import { Appointment } from '@/entities/Appointment';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Cache local para estatísticas
let statsCache = null;
let lastStatsUpdate = 0;
const STATS_CACHE_DURATION = 45000; // 45 segundos

export function useFinanceStats({ start, end }) {
  const [stats, setStats] = useState({
    series: [],
    revenueTotal: 0,
    netProfit: 0,
    ticketMedio: 0,
    totalApts: 0,
    loading: true
  });

  useEffect(() => {
    if (!start || !end) return;
    
    const cacheKey = `${start.getTime()}_${end.getTime()}`;
    const now = Date.now();
    
    // Verificar cache primeiro
    if (statsCache && statsCache.key === cacheKey && now - lastStatsUpdate < STATS_CACHE_DURATION) {
      setStats({ ...statsCache.data, loading: false });
      return;
    }
    
    const fetchStats = async () => {
      try {
        setStats(prev => ({ ...prev, loading: true }));
        
        // Rate limiting: aguardar se última chamada foi muito recente
        if (now - lastStatsUpdate < 3000) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
        const appointments = await Appointment.list('-created_date', 40); // Reduzir limite
        
        // Filtrar por período e status concluído
        const filteredAppointments = appointments.filter(apt => {
          try {
            const aptDate = new Date(apt.start_time);
            return aptDate >= start && 
                   aptDate <= end && 
                   apt.status === 'concluido';
          } catch {
            return false;
          }
        });

        // Calcular métricas
        const revenueTotal = filteredAppointments.reduce((sum, apt) => sum + (apt.final_price || 0), 0);
        const netProfit = filteredAppointments.reduce((sum, apt) => sum + (apt.profit || (apt.final_price || 0) * 0.7), 0);
        const totalApts = filteredAppointments.length;
        const ticketMedio = totalApts > 0 ? revenueTotal / totalApts : 0;

        // Gerar série temporal para o gráfico
        const series = generateTimeSeries(filteredAppointments, start, end);

        const newStats = {
          series,
          revenueTotal,
          netProfit,
          ticketMedio,
          totalApts,
          loading: false
        };

        // Armazenar no cache
        statsCache = {
          key: cacheKey,
          data: newStats
        };
        lastStatsUpdate = now;

        setStats(newStats);
      } catch (error) {
        console.error('Erro ao carregar estatísticas financeiras:', error);
        
        // Em caso de rate limit, usar dados do cache se disponíveis
        if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
          if (statsCache && statsCache.key === cacheKey) {
            setStats({ ...statsCache.data, loading: false });
            return;
          }
        }
        
        // Usar dados padrão em caso de erro
        setStats({
          series: [],
          revenueTotal: 0,
          netProfit: 0,
          ticketMedio: 0,
          totalApts: 0,
          loading: false
        });
      }
    };

    // Debounce: aguardar 500ms antes de executar
    const timeoutId = setTimeout(fetchStats, 500);
    
    return () => clearTimeout(timeoutId);
  }, [start, end]);

  return stats;
}

const generateTimeSeries = (appointments, startDate, endDate) => {
  try {
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const series = [];

    for (let i = 0; i <= Math.min(days, 31); i++) { // Limitar a 31 dias para performance
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const dayAppointments = appointments.filter(apt => {
        try {
          const aptDate = new Date(apt.start_time);
          return aptDate.toDateString() === currentDate.toDateString();
        } catch {
          return false;
        }
      });

      const receita = dayAppointments.reduce((sum, apt) => sum + (apt.final_price || 0), 0);
      const lucro = dayAppointments.reduce((sum, apt) => sum + (apt.profit || receita * 0.7), 0);

      series.push({
        date: format(currentDate, 'dd/MM', { locale: ptBR }),
        receita,
        lucro,
        atendimentos: dayAppointments.length
      });
    }

    return series;
  } catch (error) {
    console.error('Erro ao gerar série temporal:', error);
    return [];
  }
};