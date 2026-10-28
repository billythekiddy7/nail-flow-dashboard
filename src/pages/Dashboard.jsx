import React, { useState, useEffect, useCallback } from "react";
import { useGlobalState } from "@/components/hooks/useGlobalState";

import {
  DollarSign, Calendar, Users, TrendingUp, Plus, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/Toast";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { startOfMonth, endOfMonth, startOfDay, endOfDay, format } from 'date-fns';
import { summarizeAppointments } from '@/lib/finance';

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
  const [profitComplete, setProfitComplete] = useState(true);

  // Métricas calculadas a partir dos dados reais (pagamentos, atendimentos e clientes)
  const fetchMetrics = useCallback(async () => {
    // Aguarda o usuário estar disponível no estado global
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      // Receita recebida: pagamentos confirmados no mês
      const monthPayments = await base44.entities.Payment.filter({
        status: 'confirmado',
        date: {
          $gte: format(monthStart, 'yyyy-MM-dd'),
          $lte: format(monthEnd, 'yyyy-MM-dd'),
        },
      }, '-date', 1000);

      // Atendimentos concluídos no mês (base do lucro)
      const monthAppointments = await base44.entities.Appointment.filter({
        status: 'concluido',
        start_time: {
          $gte: monthStart.toISOString(),
          $lte: monthEnd.toISOString(),
        },
      }, '-start_time', 1000);

      // Novas clientes cadastradas no mês
      const monthClients = await base44.entities.Client.filter({
        created_date: {
          $gte: monthStart.toISOString(),
          $lte: monthEnd.toISOString(),
        },
      }, '-created_date', 1000);

      // Agendamentos do dia
      const todayAppointments = await base44.entities.Appointment.filter({
        start_time: {
          $gte: startOfDay(now).toISOString(),
          $lte: endOfDay(now).toISOString(),
        },
      }, '-start_time', 200);

      const products = await base44.entities.Product.list('-created_date', 500);
      const productsById = {};
      (products || []).forEach((product) => {
        productsById[product.id] = product;
      });

      const monthlyRevenue = (monthPayments || []).reduce(
        (sum, payment) => sum + (Number(payment.amount) || 0),
        0
      );
      const appointmentSummary = summarizeAppointments(monthAppointments || [], productsById);

      setMetrics({
        monthlyRevenue,
        monthlyProfit: appointmentSummary.profit,
        newClients: (monthClients || []).length,
        todayAppointmentsCount: (todayAppointments || []).length,
      });
      setProfitComplete(appointmentSummary.profitComplete);

      const completedAppointments = appointmentSummary.total;
      const workingDays = 22;
      const maxAppointmentsPerDay = 8;
      const calculatedOccupancyRate =
        ((completedAppointments / workingDays) / maxAppointmentsPerDay) * 100;
      setOccupancyRate(`${Math.min(calculatedOccupancyRate, 100).toFixed(1)}%`);
    } catch (error) {
      console.error("Erro ao calcular métricas do dashboard:", error);
      toast.error('Não foi possível carregar as métricas do painel');
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
          title="Lucro Apurado"
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

      {!profitComplete && (
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          O lucro considera apenas atendimentos com custo de material registrado.
        </p>
      )}

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