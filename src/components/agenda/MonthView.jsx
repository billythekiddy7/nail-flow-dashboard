
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import DayModal from './DayModal';

export default function MonthView({ selectedDate, appointments, clients, services, onDateSelect }) {
  const [showDayModal, setShowDayModal] = useState(false);
  const [selectedDayDate, setSelectedDayDate] = useState(null);

  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const handleDayClick = (date) => {
    setSelectedDayDate(date);
    setShowDayModal(true);
    
    // Adicionar console.log conforme sugerido na auditoria
    console.log('Day clicked:', format(date, 'yyyy-MM-dd'));
    
    if (onDateSelect) {
      onDateSelect(date);
    }
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

  const getStatusColor = (status) => {
    const colors = {
      agendado: 'bg-blue-500',
      confirmado: 'bg-green-500',
      concluido: 'bg-purple-500',
      cancelado: 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  return (
    <>
      <Card className="card-3d" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Calendar className="w-5 h-5 text-pink-500" />
            {format(selectedDate, 'MMMM yyyy', { locale: ptBR })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Grid do calendário - Dias da semana (Responsivo) */}
          <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2 md:mb-4">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => (
              <div key={index} className="text-center font-medium text-xs md:text-sm py-1 md:py-2" style={{ color: 'var(--text-secondary)' }}>
                {day}
              </div>
            ))}
          </div>

          {/* Grid do calendário - Dias do Mês (Responsivo) */}
          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {monthDays.map(date => {
              const dayAppointments = getAppointmentsForDay(date);
              const isCurrentMonth = isSameMonth(date, selectedDate);
              const isCurrentDay = isToday(date);

              return (
                <Button
                  key={date.getTime()}
                  variant="ghost"
                  role="button"
                  aria-label={`${format(date, 'dd/MM/yyyy')} - ${dayAppointments.length} agendamentos`}
                  onClick={() => handleDayClick(date)}
                  className={`
                    h-14 md:h-20 p-1 md:p-2 flex flex-col items-center justify-start text-left hover:bg-pink-500/10 transition-all duration-200
                    ${!isCurrentMonth ? 'opacity-40' : ''}
                    ${isCurrentDay ? 'bg-pink-500/20 border-2 border-pink-500' : ''}
                  `}
                  style={{ 
                    background: isCurrentDay ? 'rgba(230, 0, 122, 0.1)' : 'transparent',
                    borderColor: isCurrentDay ? '#E6007A' : 'transparent',
                    textAlign: 'center'
                  }}
                >
                  <span className={`text-xs md:text-sm font-medium ${isCurrentDay ? 'text-pink-500' : ''}`} style={{ color: isCurrentDay ? '#E6007A' : 'var(--text-primary)' }}>
                    {format(date, 'd')}
                  </span>
                  
                  {/* Indicadores de agendamentos (Responsivo) */}
                  <div className="flex flex-wrap gap-1 mt-1 justify-center">
                    {dayAppointments.slice(0, 2).map((apt, index) => (
                      <div
                        key={index}
                        className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${getStatusColor(apt.status)}`}
                        title={`${clients.find(c => c.id === apt.client_id)?.name || 'Cliente'} - ${apt.status}`}
                      />
                    ))}
                    {dayAppointments.length > 2 && (
                      <span className="text-[10px] md:text-xs" style={{ color: 'var(--text-secondary)' }}>
                        +{dayAppointments.length - 2}
                      </span>
                    )}
                  </div>
                </Button>
              );
            })}
          </div>

          {/* Legenda */}
          <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Agendado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Confirmado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Concluído</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Cancelado</span>
            </div>
          </div>
        </CardContent>
      </Card>

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
