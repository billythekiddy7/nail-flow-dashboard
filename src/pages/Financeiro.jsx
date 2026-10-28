import React, { useState, useEffect, useCallback } from "react";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Download,
  BarChart3,
  Plus,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { startOfDay, endOfDay, format, isSameDay } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { useToast } from "@/components/ui/Toast";

// Componentes
import MetricsCard from "@/components/ui/metrics-card";
import VirtualizedPaymentsTable from "@/components/finance/VirtualizedPaymentsTable";
import LazyFinanceChart from "@/components/charts/LazyFinanceChart";
import NewAttendanceModal from "@/components/finance/NewAttendanceModal";
import FinanceErrorBoundary from "@/components/finance/FinanceErrorBoundary";
import GoalsModal from "@/components/finance/GoalsModal";
import PeriodToggle from "@/components/finance/PeriodToggle";
import DateRangePicker from "@/components/finance/DateRangePicker";

// Hooks, Funções e Entidades
import { base44 } from "@/api/base44Client";
import { useDateRange } from "@/components/hooks/useDateRange";
import { computeAppointmentProfit, summarizeAppointments } from "@/lib/finance";

export default function Financeiro() {
  const [showNewAttendanceModal, setShowNewAttendanceModal] = useState(false);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const { toast } = useToast();
  
  // AÇÃO 1: Implementação do Estado de Data usando um hook customizado.
  const { period, setPeriod, dateRange, setDateRange } = useDateRange('month');

  const [lookupData, setLookupData] = useState({ clients: [], services: [] });
  const [appointments, setAppointments] = useState([]);
  const [financialData, setFinancialData] = useState({
    summary: { revenueTotal: 0, netProfit: 0, ticketMedio: 0, totalApts: 0, series: [] },
    payments: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLookupData = async () => {
      try {
        const clientsList = await base44.entities.Client.list('-created_date', 500);
        const servicesList = await base44.entities.Service.list();
        setLookupData({
          clients: clientsList || [],
          services: servicesList || [],
        });
      } catch (e) {
        console.error("Erro ao carregar dados de lookup:", e);
      }
    };
    fetchLookupData();
  }, []);

  const fetchFinancials = useCallback(async () => {
    if (!dateRange || !dateRange.startDate || !dateRange.endDate) return;

    setLoading(true);
    setError(null);

    try {
      const startDay = format(dateRange.startDate, 'yyyy-MM-dd');
      const endDay = format(dateRange.endDate, 'yyyy-MM-dd');

      // Receita recebida: pagamentos confirmados no período
      const payments = await base44.entities.Payment.filter({
        status: 'confirmado',
        date: { $gte: startDay, $lte: endDay },
      }, '-date', 500);

      // Atendimentos concluídos no período (base do lucro)
      const periodAppointments = await base44.entities.Appointment.filter({
        status: 'concluido',
        start_time: {
          $gte: startOfDay(dateRange.startDate).toISOString(),
          $lte: endOfDay(dateRange.endDate).toISOString(),
        },
      }, '-start_time', 500);

      const products = await base44.entities.Product.list('-created_date', 500);
      const productsById = {};
      (products || []).forEach((product) => {
        productsById[product.id] = product;
      });

      const revenueTotal = (payments || []).reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
      const appointmentSummary = summarizeAppointments(periodAppointments || [], productsById);
      const totalApts = (payments || []).length;
      const ticketMedio = totalApts > 0 ? revenueTotal / totalApts : 0;

      // Série diária: receita pela data do pagamento, lucro pela data do atendimento
      const seriesMap = {};
      (payments || []).forEach(p => {
        const day = p.date || '';
        if (!seriesMap[day]) seriesMap[day] = { date: day, receita: 0, lucro: 0 };
        seriesMap[day].receita += Number(p.amount) || 0;
      });
      (periodAppointments || []).forEach(apt => {
        const profit = computeAppointmentProfit(apt, productsById);
        if (profit === null) return;
        const day = format(new Date(apt.start_time), 'yyyy-MM-dd');
        if (!seriesMap[day]) seriesMap[day] = { date: day, receita: 0, lucro: 0 };
        seriesMap[day].lucro += profit;
      });
      const series = Object.values(seriesMap).sort((a, b) => a.date.localeCompare(b.date));

      setAppointments(periodAppointments || []);
      setFinancialData({
        summary: {
          revenueTotal,
          netProfit: appointmentSummary.profit,
          ticketMedio,
          totalApts,
          series,
          profitComplete: appointmentSummary.profitComplete,
        },
        payments: payments || [],
      });
    } catch (e) {
      const errorMessage = e.message || "Ocorreu um erro inesperado.";
      setError(errorMessage);
      console.error("Erro ao buscar dados financeiros:", e);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  // AÇÃO 2: Refatoração do Gatilho de Busca para depender do 'fetchFinancials'.
  useEffect(() => {
    fetchFinancials();
  }, [fetchFinancials]);

  const handleNewAttendanceSuccess = () => {
    setShowNewAttendanceModal(false);
    fetchFinancials(); // CORREÇÃO: Chama a busca de dados em vez de recarregar a página
  };

  const handleGoalsUpdated = (newGoals) => {
    window.dispatchEvent(new CustomEvent('goalsUpdated', { detail: newGoals }));
  };

  const getPeriodLabel = () => {
    // BLINDAGEM: Adiciona verificação para o objeto dateRange em si.
    if (!dateRange || !dateRange.startDate || !dateRange.endDate) return 'Carregando...';
    if (isSameDay(dateRange.startDate, dateRange.endDate)) {
        return format(dateRange.startDate, 'PPP', { locale: ptBR });
    }
    return `${format(dateRange.startDate, 'dd/MM/yy', { locale: ptBR })} - ${format(dateRange.endDate, 'dd/MM/yy', { locale: ptBR })}`;
  };

  const { summary, payments } = financialData;

  return (
    <FinanceErrorBoundary>
      <div className="p-4 sm:p-6 space-y-6 sm:space-y-8" style={{ background: 'var(--primary-bg)' }}>
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold gradient-text">Resumo Financeiro</h1>
            <p className="mt-1 text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>
              Resultados para o período: <span className="font-semibold text-pink-400">{getPeriodLabel()}</span>
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => setShowGoalsModal(true)}
              className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20 w-full sm:w-auto"
            >
              <Target className="w-4 h-4 mr-2" />
              Definir Metas
            </Button>
            
            <Button
              onClick={() => setShowNewAttendanceModal(true)}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg flex-1"
            >
              <Plus className="w-4 h-4 mr-2" />
              Registrar Atendimento
            </Button>
            <Button 
              variant="outline" 
              className="glass-effect flex-1 sm:flex-none"
              onClick={() => {
                const rows = [['Data','Cliente','Serviço','Valor','Método']];
                payments.forEach(p => {
                  const client = lookupData.clients.find(c => c.id === p.client_id);
                  const appointment = appointments.find(a => a.id === p.appointment_id);
                  const service = lookupData.services.find(s => s.id === appointment?.service_id);
                  rows.push([p.date || '', client?.name || '', service?.name || '', p.amount || '', p.method || '']);
                });
                const csv = rows.map(r => r.join(',')).join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = 'financeiro.csv'; a.click();
                URL.revokeObjectURL(url);
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>

        <NewAttendanceModal
          isOpen={showNewAttendanceModal}
          onClose={() => setShowNewAttendanceModal(false)}
          onSuccess={handleNewAttendanceSuccess}
        />
        <GoalsModal
          isOpen={showGoalsModal}
          onClose={() => setShowGoalsModal(false)}
          onGoalsUpdated={handleGoalsUpdated}
        />

        {/* AÇÃO 4: Reintrodução da UI de Filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
            <PeriodToggle period={period} onPeriodChange={setPeriod} />
            {period === 'custom' && (
                <DateRangePicker 
                    dateRange={dateRange} 
                    onDateChange={setDateRange} 
                />
            )}
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-2">
              <div className="animate-spin w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full"></div>
              <span style={{ color: 'var(--text-primary)' }}>Carregando dados financeiros...</span>
            </div>
          </div>
        ) : (
          <>
            <section>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                <MetricsCard
                  title="Faturamento Total"
                  value={`R$ ${(summary.revenueTotal || 0).toFixed(2)}`}
                  icon={DollarSign}
                  color="green"
                  showChange={false}
                />
                <MetricsCard
                  title="Lucro Apurado"
                  value={`R$ ${(summary.netProfit || 0).toFixed(2)}`}
                  icon={TrendingUp}
                  color="blue"
                  showChange={false}
                />
                <MetricsCard
                  title="Ticket Médio"
                  value={`R$ ${(summary.ticketMedio || 0).toFixed(2)}`}
                  icon={Calendar}
                  color="pink"
                  showChange={false}
                />
                <MetricsCard
                  title="Total de Atendimentos"
                  value={summary.totalApts || 0}
                  icon={BarChart3}
                  color="orange"
                  showChange={false}
                />
              </div>
              {summary.profitComplete === false && (
                <p className="mt-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  O lucro considera apenas atendimentos com custo de material registrado.
                </p>
              )}
            </section>

            <section>
              <LazyFinanceChart
                data={summary.series || []}
                title="Evolução Financeira no Período"
              />
            </section>

            <section>
              <VirtualizedPaymentsTable
                payments={payments}
                clients={lookupData.clients}
                services={lookupData.services}
              />
            </section>
          </>
        )}
      </div>
    </FinanceErrorBoundary>
  );
}