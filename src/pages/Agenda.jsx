import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Calendar, Clock, Plus, Filter, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format, addDays, startOfWeek, isSameDay, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

// Importar componentes
import ViewToggle from "@/components/agenda/ViewToggle";
import WeekCards from "@/components/agenda/WeekCards";
import DayView from "@/components/agenda/DayView";
import MonthView from "@/components/agenda/MonthView";
import NewAppointmentModal from "@/components/agenda/NewAppointmentModal/index";
import FiltersModal from "@/components/agenda/FiltersModal/index";
import GradientButton from "@/components/ui/GradientButton";
import { useAppointments } from "@/components/agenda/AppointmentHook";
import { getDateRange, formatDateForDisplay } from "@/components/agenda/DateUtils";

export default function Agenda() {
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("week");
  const [searchTerm, setSearchTerm] = useState("");
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    status: 'todos',
    client_id: '',
    service_ids: [],
    payment_method: 'todos'
  });
  
  // Memoizar o cálculo do dateRange para evitar recalculos desnecessários
  const dateRange = useMemo(() => {
    return getDateRange(selectedDate, viewMode);
  }, [selectedDate, viewMode]);
  
  // Usar hook personalizado para buscar agendamentos
  const { appointments, loading } = useAppointments(dateRange);

  useEffect(() => {
    // Carregar dados apenas uma vez
    if (!dataLoaded) {
      loadData();
    }
  }, [dataLoaded]);

  const loadData = async () => {
    try {
      const clientsData = await base44.entities.Client.list('-created_date', 100);
      const servicesData = await base44.entities.Service.list('-created_date', 50);
      setClients(clientsData || []);
      setServices(servicesData || []);
      setDataLoaded(true);
    } catch (error) {
      console.error("Erro ao carregar dados da agenda:", error);
      setDataLoaded(true);
    }
  };

  // Memoizar a filtragem para evitar recalculos desnecessários
  const filteredAppointments = useMemo(() => {
    let filtered = appointments;

    // Filtro por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(apt => {
        const clientName = clients.find(c => c.id === apt.client_id)?.name || '';
        const serviceName = services.find(s => s.id === apt.service_id)?.name || '';
        
        return clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
               serviceName.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    // Aplicar filtros avançados
    if (filters.status !== 'todos') {
      filtered = filtered.filter(apt => apt.status === filters.status);
    }

    if (filters.client_id) {
      filtered = filtered.filter(apt => apt.client_id === filters.client_id);
    }

    if (filters.service_ids.length > 0) {
      filtered = filtered.filter(apt => filters.service_ids.includes(apt.service_id));
    }

    if (filters.payment_method !== 'todos') {
      filtered = filtered.filter(apt => apt.payment_method === filters.payment_method);
    }

    // Filtro por período personalizado
    if (filters.startDate && filters.endDate) {
      filtered = filtered.filter(apt => {
        const aptDate = new Date(apt.start_time);
        return aptDate >= filters.startDate && aptDate <= filters.endDate;
      });
    }

    return filtered;
  }, [appointments, clients, services, searchTerm, filters]);

  // Navegação de datas com debounce
  const navigateDate = (direction) => {
    const days = viewMode === 'day' ? 1 : viewMode === 'week' ? 7 : 30;
    const newDate = addDays(selectedDate, direction * days);
    setSelectedDate(newDate);
  };

  const handleNewAppointmentSuccess = () => {
    setShowNewAppointmentModal(false);
  };

  const handleFiltersApply = (newFilters) => {
    setFilters(newFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.startDate || filters.endDate) count++;
    if (filters.status !== 'todos') count++;
    if (filters.client_id) count++;
    if (filters.service_ids.length > 0) count++;
    if (filters.payment_method !== 'todos') count++;
    return count;
  };

  // Loading state melhorado
  if (loading || !dataLoaded) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 rounded" style={{ background: 'var(--border)' }} />
          <div className="h-96 rounded-2xl" style={{ background: 'var(--border)' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6" style={{ background: 'var(--primary-bg)' }}>
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold gradient-text">Agenda</h1>
          <p className="mt-1 text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>
            Gerencie seus agendamentos e horários
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            variant="outline" 
            className="glass-effect relative w-full sm:w-auto"
            onClick={() => setShowFiltersModal(true)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros
            {getActiveFiltersCount() > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center p-0">
                {getActiveFiltersCount()}
              </Badge>
            )}
          </Button>
          <GradientButton onClick={() => setShowNewAppointmentModal(true)} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Novo Agendamento
          </GradientButton>
        </div>
      </div>

      {/* Controles da Agenda */}
      <Card className="glass-effect" style={{ border: '1px solid var(--border)' }}>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Navegação de Data - Mobile First */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
                <Button variant="outline" size="sm" onClick={() => navigateDate(-1)} className="flex-shrink-0">
                  ←
                </Button>
                <div className="flex items-center gap-2 min-w-0">
                  <Calendar className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--text-secondary)' }} />
                  <span className="font-medium text-sm sm:text-base truncate" style={{ color: 'var(--text-primary)' }}>
                    {formatDateForDisplay(selectedDate, viewMode)}
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigateDate(1)} className="flex-shrink-0">
                  →
                </Button>
              </div>
              
              {/* Toggle de Visualização */}
              <ViewToggle viewMode={viewMode} onChange={setViewMode} />
            </div>
            
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
              <Input
                placeholder="Buscar cliente ou serviço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visualizações Dinâmicas */}
      {viewMode === 'week' && (
        <WeekCards
          startDate={selectedDate}
          appointments={filteredAppointments}
          clients={clients}
          services={services}
        />
      )}

      {viewMode === 'day' && (
        <DayView
          appointments={filteredAppointments}
          clients={clients}
          services={services}
          selectedDate={selectedDate}
        />
      )}

      {viewMode === 'month' && (
        <MonthView
          selectedDate={selectedDate}
          appointments={filteredAppointments}
          clients={clients}
          services={services}
        />
      )}

      {/* Resumo do Período - apenas para visualizações Day e Week */}
      {viewMode !== 'month' && (
        <Card className="card-3d" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Calendar className="w-5 h-5 text-pink-500" />
              Resumo - {viewMode === 'day' ? 'Hoje' : 'Esta Semana'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold gradient-text">
                  {filteredAppointments.length}
                </p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Total de Agendamentos
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">
                  R$ {filteredAppointments.reduce((sum, apt) => sum + (apt.final_price || 0), 0).toFixed(2)}
                </p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Faturamento Previsto
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-500">
                  {filteredAppointments.filter(apt => apt.status === 'concluido').length}
                </p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Concluídos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modais */}
      <NewAppointmentModal
        isOpen={showNewAppointmentModal}
        onClose={() => setShowNewAppointmentModal(false)}
        onSuccess={handleNewAppointmentSuccess}
      />

      <FiltersModal
        isOpen={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        onApply={handleFiltersApply}
        clients={clients}
        services={services}
        currentFilters={filters}
      />
    </div>
  );
}