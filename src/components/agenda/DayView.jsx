
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Scissors } from 'lucide-react';
import { format } from 'date-fns';

export default function DayView({ appointments, clients, services, selectedDate }) {
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
      agendado: 'bg-blue-100 text-blue-800 border-blue-200',
      confirmado: 'bg-green-100 text-green-800 border-green-200',
      concluido: 'bg-purple-100 text-purple-800 border-purple-200',
      cancelado: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Ordenar agendamentos por horário
  const sortedAppointments = appointments.sort((a, b) => 
    new Date(a.start_time) - new Date(b.start_time)
  );

  const handleAppointmentClick = (appointment) => {
    // Implementar modal ou ação de detalhes
    console.log('Appointment clicked:', appointment);
  };

  return (
    <div className="space-y-4">
      {sortedAppointments.length > 0 ? (
        sortedAppointments.map((appointment) => (
          <Card 
            key={appointment.id} 
            className="card-3d cursor-pointer hover:scale-[1.02] transition-transform" 
            style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
            onClick={() => handleAppointmentClick(appointment)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {format(new Date(appointment.start_time), 'HH:mm')}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                      {getClientName(appointment.client_id)}
                    </h3>
                    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      <Scissors className="w-4 h-4" />
                      {getServiceName(appointment.service_id)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={getStatusColor(appointment.status)}>
                    {appointment.status}
                  </Badge>
                  {appointment.final_price && (
                    <p className="text-sm font-bold text-green-500 mt-1">
                      R$ {appointment.final_price.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
              
              {appointment.notes && (
                <div className="mt-3 p-2 rounded-lg" style={{ background: 'var(--secondary-bg)' }}>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <strong>Observações:</strong> {appointment.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      ) : (
        <Card className="card-3d" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
          <CardContent className="p-8 text-center">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" style={{ color: 'var(--text-secondary)' }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Nenhum agendamento para hoje
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Seu dia está livre! Que tal aproveitar para descansar ou fazer uma promoção?
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
