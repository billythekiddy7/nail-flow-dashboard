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
import { startOfMonth, endOfMonth, format, isSameDay } from "date-fns";
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
import { getFinancialSummary } from "@/functions/getFinancialSummary";
import { Client, Service } from "@/entities/all";
import { useDateRange } from "@/components/hooks/useDateRange";

export default function Financeiro() {
  const [showNewAttendanceModal, setShowNewAttendanceModal] = useState(false);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const { toast } = useToast();
  
  // AÇÃO 1: Implementação do Estado de Data usando um hook customizado.
  const { period, setPeriod, dateRange, setDateRange } = useDateRange('month');

  const [lookupData, setLookupData] = useState({ clients: [], services: [] });
  const [financialData, setFinancialData] = useState({
    summary: { revenueTotal: 0, netProfit: 0, ticketMedio: 0, totalApts: 0, series: [] },
    payments: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLookupData = async () => {
      try {
        const clientsList = await Client.list('-created_date', 500);
        const servicesList = await Service.list();
        
        setLookupData({
          clients: clientsList || [],
          services: servicesList || [],
        });
      } catch (e) {
        console.error("Erro ao carregar dados de lookup:", e);
        setError("Falha ao carregar dados de clientes e serviços."); 
      }
    };
    fetchLookupData();
  }, []);

  const fetchFinancials = useCallback(async () => {
    // PROVA (UI): Adicionar verificação de nulidade para dateRange.
    if (!dateRange || !dateRange.startDate || !dateRange.endDate) return;

    setLoading(true);
    setError(null);
    
    try {

      const { data, error: fetchError } = await getFinancialSummary({
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
      });

      if (fetchError) {
        const errorDetails = fetchError.response?.data?.details || fetchError.message || 'Erro ao buscar dados do servidor.';
        throw new Error(errorDetails);
      }
      
      if (data) {
        setFinancialData({
          summary: data.summary || { revenueTotal: 0, netProfit: 0, ticketMedio: 0, totalApts: 0, series: [] },
          payments: data.details?.payments || []
        });
      } else {
         setFinancialData({
          summary: { revenueTotal: 0, netProfit: 0, ticketMedio: 0, totalApts: 0, series: [] },
          payments: []
        });
      }
    } catch (e) {
      const errorMessage = e.message || "Ocorreu um erro inesperado.";
      setError(errorMessage);
      toast.error("Falha ao Buscar Dados", {
          description: errorMessage
      });
      console.error("Erro ao buscar dados financeiros:", e);
    } finally {
      setLoading(false);
    }
  }, [dateRange, toast]); // Dependência adicionada.

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

  if (error && !loading) {
    return (
      <FinanceErrorBoundary>
        <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--primary-bg)' }}>
          <div className="text-center">
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Erro ao carregar dados financeiros
            </h2>
            <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
              {error}
            </p>
            <Button onClick={() => window.location.reload()}>
              Tentar Novamente
            </Button>
          </div>
        </div>
      </FinanceErrorBoundary>
    );
  }

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
                  const service = lookupData.services.find(s => s.id === p.service_id);
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
                  title="Lucro Líquido"
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