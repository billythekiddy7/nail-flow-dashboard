import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, Scissors } from 'lucide-react';
import { format, addDays, startOfWeek, isToday, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import DayModal from './DayModal';

export default function WeekCards({ startDate, appointments, clients, services }) {
  const [showDayModal, setShowDayModal] = useState(false);
  const [selectedDayDate, setSelectedDayDate] = useState(null);

  const weekStart = startOfWeek(startDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const handleDayClick = (date) => {
    setSelectedDayDate(date);
    setShowDayModal(true);
  };

  const getAppointmentsForDay = (date) => {
    return appointments.filter(apt => {
      try {
        return isSameDay(new Date(apt.start_time), date);
      } catch {
        return false;
      }
    });
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
      cancelado: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {weekDays.map(date => {
          const dayAppointments = getAppointmentsForDay(date);
          const isCurrentDay = isToday(date);

          return (
            <Card 
              key={date.getTime()} 
              className={`card-3d cursor-pointer transition-all duration-200 hover:shadow-lg ${
                isCurrentDay ? 'ring-2 ring-pink-500 bg-pink-50 dark:bg-pink-900/10' : ''
              }`}
              style={{ 
                background: 'var(--card-bg)', 
                border: `1px solid ${isCurrentDay ? '#E6007A' : 'var(--border)'}` 
              }}
              onClick={() => handleDayClick(date)}
              role="button"
              tabIndex={0}
              aria-label={`${format(date, 'EEEE, dd/MM', { locale: ptBR })} - ${dayAppointments.length} agendamentos`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleDayClick(date);
                }
              }}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${isCurrentDay ? 'text-pink-600' : ''}`} 
                       style={{ color: isCurrentDay ? '#E6007A' : 'var(--text-secondary)' }}>
                      {format(date, 'EEEE', { locale: ptBR })}
                    </p>
                    <p className={`text-xl font-bold ${isCurrentDay ? 'text-pink-500' : ''}`}
                       style={{ color: isCurrentDay ? '#E6007A' : 'var(--text-primary)' }}>
                      {format(date, 'dd')}
                    </p>
                  </div>
                  {dayAppointments.length > 0 && (
                    <Badge 
                      className="bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                      aria-label={`${dayAppointments.length} agendamentos`}
                    >
                      {dayAppointments.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {dayAppointments.length === 0 ? (
                  <div className="text-center py-4">
                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" style={{ color: 'var(--text-secondary)' }} />
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Nenhum agendamento
                    </p>
                  </div>
                ) : (
                  dayAppointments.slice(0, 3).map((appointment) => (
                    <div 
                      key={appointment.id} 
                      className="p-3 rounded-lg border transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      style={{ 
                        background: 'var(--secondary-bg)', 
                        borderColor: 'var(--border)' 
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3" style={{ color: 'var(--text-secondary)' }} />
                          <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                            {format(new Date(appointment.start_time), 'HH:mm')}
                          </span>
                        </div>
                        <Badge className={getStatusColor(appointment.status)} aria-label={`Status: ${appointment.status}`}>
                          {appointment.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3" style={{ color: 'var(--text-secondary)' }} />
                          <span className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                            {getClientName(appointment.client_id)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Scissors className="w-3 h-3" style={{ color: 'var(--text-secondary)' }} />
                          <span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                            {getServiceName(appointment.service_id)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                
                {dayAppointments.length > 3 && (
                  <div className="text-center pt-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDayClick(date);
                      }}
                      aria-label={`Ver mais ${dayAppointments.length - 3} agendamentos`}
                    >
                      +{dayAppointments.length - 3} mais
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal do Dia */}
      <DayModal
        date={selectedDayDate}
        isOpen={showDayModal}
        onClose={() => setShowDayModal(false)}
        clients={clients}
        services={services}
      />
    </>
  );
}