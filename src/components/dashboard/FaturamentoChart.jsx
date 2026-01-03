import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useLive } from '@/components/hooks/useLive';
import { Appointment } from '@/entities/Appointment';

const PERIOD_RANGES = {
  hoje: () => {
    const today = new Date();
    return [startOfDay(today), endOfDay(today)];
  },
  semana: () => {
    const today = new Date();
    return [startOfWeek(today, { weekStartsOn: 1 }), endOfWeek(today, { weekStartsOn: 1 })];
  },
  mes: () => {
    const today = new Date();
    return [startOfMonth(today), endOfMonth(today)];
  },
  ano: () => {
    const today = new Date();
    return [startOfYear(today), endOfYear(today)];
  }
};

export default function FaturamentoChart({ range = "mes", customDates = null }) {
  const [selectedPeriod, setSelectedPeriod] = useState(range);
  
  // Calcular datas baseado no período selecionado
  const dateRange = useMemo(() => {
    if (customDates && customDates.length === 2) {
      return customDates;
    }
    
    if (PERIOD_RANGES[selectedPeriod]) {
      return PERIOD_RANGES[selectedPeriod]();
    }
    
    return PERIOD_RANGES.mes();
  }, [selectedPeriod, customDates]);

  // Usar hook real-time para agendamentos concluídos
  const { data: appointments, loading } = useLive(Appointment, {
    status: 'concluido'
  });

  // Filtrar por período e calcular dados do gráfico
  const chartData = useMemo(() => {
    if (!appointments.length) return [];

    const [startDate, endDate] = dateRange;
    
    // Filtrar agendamentos do período
    const filteredAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.start_time);
      return aptDate >= startDate && aptDate <= endDate;
    });

    // Agrupar por dia para o gráfico
    const groupedByDay = {};
    filteredAppointments.forEach(apt => {
      const day = format(new Date(apt.start_time), 'yyyy-MM-dd');
      if (!groupedByDay[day]) {
        groupedByDay[day] = { date: day, receita: 0, atendimentos: 0 };
      }
      groupedByDay[day].receita += (apt.final_price || 0);
      groupedByDay[day].atendimentos += 1;
    });

    // Converter para array e ordenar
    return Object.values(groupedByDay)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(item => ({
        ...item,
        dateFormatted: format(new Date(item.date), 'dd/MM', { locale: ptBR })
      }));
  }, [appointments, dateRange]);

  // Calcular total do período
  const totalRevenue = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.receita, 0);
  }, [chartData]);

  const periodLabels = {
    hoje: 'Hoje',
    semana: 'Esta Semana', 
    mes: 'Este Mês',
    ano: 'Este Ano'
  };

  if (loading) {
    return (
      <Card className="card-3d" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <TrendingUp className="w-5 h-5 text-pink-500" />
            Faturamento - {periodLabels[selectedPeriod]}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="animate-pulse h-8 w-32 rounded" style={{ background: 'var(--border)' }} />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-3d" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <TrendingUp className="w-5 h-5 text-pink-500" />
            Faturamento - {periodLabels[selectedPeriod]}
          </CardTitle>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-500">
              R$ {totalRevenue.toFixed(2)}
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Total no período
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis 
                  dataKey="dateFormatted" 
                  stroke="var(--text-secondary)"
                />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    color: 'var(--text-primary)'
                  }}
                  formatter={(value, name) => [
                    name === 'receita' ? `R$ ${value.toFixed(2)}` : value,
                    name === 'receita' ? 'Receita' : 'Atendimentos'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="receita" 
                  stroke="#E6007A" 
                  strokeWidth={3}
                  dot={{ fill: '#E6007A', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" style={{ color: 'var(--text-secondary)' }} />
                <p style={{ color: 'var(--text-secondary)' }}>
                  Nenhum faturamento no período selecionado
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}