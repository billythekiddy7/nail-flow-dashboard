
import React, { useState, useEffect, useCallback } from "react";
import { useGlobalState } from "@/components/hooks/useGlobalState";
import { DashboardMetric } from "@/entities/DashboardMetric";
import {
  DollarSign, Calendar, Users, TrendingUp, Plus, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/Toast";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';

import MetricsCard from "@/components/ui/metrics-card";
import NovoAgendamento from "@/components/modals/NovoAgendamento";
import RelatorioModal from "@/components/modals/RelatorioModal";
import FaturamentoChart from "@/components/dashboard/FaturamentoChart";

export default function Dashboard() {
  // OPERAÇÃO ZÊNITE: Consumir usuário do estado global
  const { user, isLoading: globalLoading } = useGlobalState();
  
  const [loading, setLoading] = useState(true);
  const [showNovoAgendamento, setShowNovoAgendamento] = useState(false);
  const [showRelatorio, setShowRelatorio] = useState(false);
  const { toast } = useToast();
  
  const [metrics, setMetrics] = useState({
    monthlyRevenue: 0,
    monthlyProfit: 0,
    newClients: 0,
    todayAppointmentsCount: 0,
  });
  const [occupancyRate, setOccupancyRate] = useState('N/A');

  // OPERAÇÃO CRONOS: Busca simplificada de métricas pré-calculadas
  const fetchMetrics = useCallback(async () => {
    // Aguarda o usuário estar disponível no estado global
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Leitura direta do warehouse de métricas - operação instantânea
      const metricsFromWarehouse = await DashboardMetric.list();
      
      if (metricsFromWarehouse && metricsFromWarehouse.length > 0) {
        const warehouseData = metricsFromWarehouse[0];
        
        setMetrics({
          monthlyRevenue: warehouseData.revenueTotal || 0,
          monthlyProfit: warehouseData.netProfit || 0,
          newClients: warehouseData.newClientsCount || 0,
          todayAppointmentsCount: warehouseData.todayAppointmentsCount || 0,
        });

        // Calcular taxa de ocupação a partir dos dados do warehouse
        const completedAppointments = warehouseData.completedAppointmentsCount || 0;
        const workingDays = 22; // Aproximação para o mês
        const averageAppointmentsPerDay = completedAppointments / workingDays;
        const maxAppointmentsPerDay = 8; // Assumindo 8 horários por dia
        const calculatedOccupancyRate = (averageAppointmentsPerDay / maxAppointmentsPerDay) * 100;
        setOccupancyRate(`${Math.min(calculatedOccupancyRate, 100).toFixed(1)}%`);
      } else {
        setMetrics({
          monthlyRevenue: 0,
          monthlyProfit: 0,
          newClients: 0,
          todayAppointmentsCount: 0,
        });
        setOccupancyRate('0%');
      }
    } catch (error) {
      console.error("Erro ao buscar métricas pré-calculadas:", error);
      toast.error("Falha ao carregar dados", { description: "Não foi possível buscar os indicadores do dashboard." });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    // OPERAÇÃO CRONOS + ZÊNITE: Apenas leitura de dados pré-calculados
    // Aguarda o usuário estar disponível no estado global
    if (user) {
      fetchMetrics();
    }

    // Listener para re-sincronizar quando eventos externos ocorrerem
    const handleDashboardSync = () => fetchMetrics();
    window.addEventListener('dashboardSynced', handleDashboardSync);

    return () => {
      window.removeEventListener('dashboardSynced', handleDashboardSync);
    };
  }, [user, fetchMetrics]);

  // Loader enquanto aguarda estado global
  if (globalLoading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-8 w-64 rounded bg-gray-700 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-2xl bg-gray-700" />)}
        </div>
        <div className="h-96 rounded-2xl bg-gray-700" />
      </div>
    );
  }

  // Carregamento de métricas
  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-8 w-64 rounded bg-gray-700 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-2xl bg-gray-700" />)}
        </div>
        <div className="h-96 rounded-2xl bg-gray-700" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8" style={{ background: 'var(--primary-bg)' }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold gradient-text">Dashboard</h1>
          <p className="mt-1 text-sm md:text-base" style={{ color: 'var(--text-secondary)' }}>
            Visão geral do seu negócio
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Button variant="outline" className="glass-effect w-full sm:w-auto" onClick={() => setShowRelatorio(true)}>
            <Eye className="w-4 h-4 mr-2" />
            Ver Relatório
          </Button>
          <Button
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg w-full sm:w-auto"
            onClick={() => setShowNovoAgendamento(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>
      </div>

      {/* Main metrics - OPERAÇÃO CRONOS: Leitura instantânea do cache */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricsCard
          title="Faturamento do Mês"
          value={`R$ ${metrics.monthlyRevenue.toFixed(2)}`}
          icon={DollarSign}
          color="green"
          showChange={false}
        />
        <MetricsCard
          title="Lucro Estimado"
          value={`R$ ${metrics.monthlyProfit.toFixed(2)}`}
          icon={TrendingUp}
          color="blue"
          showChange={false}
        />
        <MetricsCard
          title="Novas Clientes"
          value={metrics.newClients}
          icon={Users}
          color="pink"
          showChange={false}
        />
        <MetricsCard
          title="Taxa de Ocupação"
          value={occupancyRate} 
          icon={Calendar}
          color="orange"
          showChange={false}
        />
      </div>

      {/* Charts and information */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3">
          <FaturamentoChart range="mes" />
        </div>
      </div>

      {/* Modals */}
      <NovoAgendamento
        isOpen={showNovoAgendamento}
        onClose={() => setShowNovoAgendamento(false)}
        onSuccess={() => {
          // OPERAÇÃO CRONOS: Triggers no backend já atualizaram o cache
          // Apenas recarregamos a view
          fetchMetrics();
        }}
      />

      <RelatorioModal
        isOpen={showRelatorio}
        onClose={() => setShowRelatorio(false)}
      />
    </div>
  );
}
