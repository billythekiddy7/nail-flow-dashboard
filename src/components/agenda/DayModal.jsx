import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Check, XCircle, RotateCcw, Clock, User, Scissors } from 'lucide-react';
import { Appointment, Client, Service } from '@/entities/all';
import { useToast } from '@/components/ui/Toast';

export default function DayModal({ date, isOpen, onClose, clients = [], services = [] }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && date) {
      loadAppointments();
    }
  }, [isOpen, date]);

  const loadAppointments = async () => {
    if (!date) return;
    
    setLoading(true);
    try {
      const allAppointments = await Appointment.list('-start_time', 100);
      const dayAppointments = allAppointments.filter(apt => {
        const aptDate = new Date(apt.start_time);
        return aptDate.toDateString() === date.toDateString();
      });
      setAppointments(dayAppointments);
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
      toast.error('Erro ao carregar agendamentos');
    }
    setLoading(false);
  };

  const handleStatusChange = async (appointment, newStatus) => {
    try {
      await Appointment.update(appointment.id, { status: newStatus });
      
      // Atualizar localmente
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === appointment.id 
            ? { ...apt, status: newStatus }
            : apt
        )
      );

      const statusMessages = {
        'confirmado': 'Agendamento confirmado com sucesso!',
        'cancelado': 'Agendamento cancelado',
        'concluido': 'Atendimento marcado como concluído'
      };

      toast.success(statusMessages[newStatus] || 'Status atualizado');
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Cliente não encontrado';
  };

  const getServiceName = (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    return service?.name || 'Serviço não encontrado';
  };

  const getStatusColor = (status) => {
    const colors = {
      agendado: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      confirmado: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      concluido: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      cancelado: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      pendente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  };

  // Agrupar por status
  const agendados = appointments.filter(apt => apt.status === 'agendado');
  const pendentes = appointments.filter(apt => apt.status === 'pendente');
  const concluidos = appointments.filter(apt => apt.status === 'concluido');

  const renderAppointmentCard = (appointment) => (
    <Card key={appointment.id} className="mb-3" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {format(new Date(appointment.start_time), 'HH:mm')}
            </div>
            <div>
              <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                {getClientName(appointment.client_id)}
              </h4>
              <p className="text-sm flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                <Scissors className="w-3 h-3" />
                {getServiceName(appointment.service_id)}
              </p>
            </div>
          </div>
          <Badge className={getStatusColor(appointment.status)}>
            {appointment.status}
          </Badge>
        </div>

        {/* Botões de ação baseados no status */}
        {appointment.status === 'agendado' && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange(appointment, 'confirmado')}
              className="flex-1 border-green-200 text-green-700 hover:bg-green-50"
            >
              <Check className="w-4 h-4 mr-1" /> Confirmar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange(appointment, 'cancelado')}
              className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
            >
              <XCircle className="w-4 h-4 mr-1" /> Cancelar
            </Button>
          </div>
        )}

        {appointment.status === 'confirmado' && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange(appointment, 'concluido')}
              className="flex-1 border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              <Check className="w-4 h-4 mr-1" /> Concluir
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange(appointment, 'cancelado')}
              className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
            >
              <XCircle className="w-4 h-4 mr-1" /> Cancelar
            </Button>
          </div>
        )}

        {appointment.status === 'pendente' && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange(appointment, 'agendado')}
              className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <Check className="w-4 h-4 mr-1" /> Aprovar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange(appointment, 'cancelado')}
              className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
            >
              <XCircle className="w-4 h-4 mr-1" /> Rejeitar
            </Button>
          </div>
        )}

        {appointment.final_price && (
          <div className="mt-2 text-right">
            <span className="text-sm font-bold text-green-500">
              R$ {appointment.final_price.toFixed(2)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] glass-effect dark" style={{ background: '#222222', color: 'white', borderColor: '#333333' }}>
        <DialogHeader>
          <DialogTitle className="gradient-text flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {date ? format(date, "dd 'de' MMMM", { locale: ptBR }) : 'Agendamentos'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="agendados" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="agendados" className="text-xs sm:text-sm">
              Agendados ({agendados.length})
            </TabsTrigger>
            <TabsTrigger value="pendentes" className="text-xs sm:text-sm">
              Pendentes ({pendentes.length})
            </TabsTrigger>
            <TabsTrigger value="concluidos" className="text-xs sm:text-sm">
              Concluídos ({concluidos.length})
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 max-h-96 overflow-y-auto">
            <TabsContent value="agendados" className="space-y-3">
              {loading ? (
                <div className="animate-pulse space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-20 rounded" style={{ background: 'var(--border)' }} />
                  ))}
                </div>
              ) : agendados.length > 0 ? (
                agendados.map(renderAppointmentCard)
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" style={{ color: 'var(--text-secondary)' }} />
                  <p style={{ color: 'var(--text-secondary)' }}>Nenhum agendamento para este dia</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="pendentes" className="space-y-3">
              {pendentes.length > 0 ? (
                pendentes.map(renderAppointmentCard)
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" style={{ color: 'var(--text-secondary)' }} />
                  <p style={{ color: 'var(--text-secondary)' }}>Nenhuma solicitação pendente</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="concluidos" className="space-y-3">
              {concluidos.length > 0 ? (
                concluidos.map(renderAppointmentCard)
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" style={{ color: 'var(--text-secondary)' }} />
                  <p style={{ color: 'var(--text-secondary)' }}>Nenhum atendimento concluído</p>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-end pt-4 border-t border-gray-700">
          <Button variant="ghost" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}