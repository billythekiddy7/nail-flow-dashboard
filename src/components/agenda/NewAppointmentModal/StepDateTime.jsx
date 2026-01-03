import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Appointment } from '@/entities/Appointment';

export default function StepDateTime({ 
  formData, 
  onChange, 
  errors = {} 
}) {
  const [timeSlots, setTimeSlots] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Gerar slots de horário (8h às 18h, intervalos de 30min)
  useEffect(() => {
    const slots = [];
    for (let hour = 8; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    setTimeSlots(slots);
  }, []);

  // Verificar conflitos quando data é selecionada
  useEffect(() => {
    if (formData.date) {
      checkConflicts();
    }
  }, [formData.date]);

  const checkConflicts = async () => {
    if (!formData.date) return;
    
    setLoading(true);
    try {
      const startOfDay = new Date(formData.date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(formData.date);
      endOfDay.setHours(23, 59, 59, 999);

      // Buscar agendamentos do dia
      const dayAppointments = await Appointment.list('-start_time', 50);
      const dayConflicts = dayAppointments.filter(apt => {
        const aptDate = new Date(apt.start_time);
        return aptDate >= startOfDay && aptDate <= endOfDay;
      });

      setConflicts(dayConflicts);
    } catch (error) {
      console.error('Erro ao verificar conflitos:', error);
    }
    setLoading(false);
  };

  const isTimeSlotAvailable = (timeSlot) => {
    if (!formData.date) return true;
    
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const slotDateTime = new Date(formData.date);
    slotDateTime.setHours(hours, minutes, 0, 0);

    return !conflicts.some(apt => {
      const aptStart = new Date(apt.start_time);
      const aptEnd = new Date(apt.end_time);
      return slotDateTime >= aptStart && slotDateTime < aptEnd;
    });
  };

  const handleTimeSelect = (timeSlot) => {
    onChange({
      ...formData,
      time: timeSlot
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-bold gradient-text">Data e Horário</h3>
        <p className="text-sm text-gray-500 mt-1">
          Escolha quando realizar o atendimento
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Seleção de Data */}
        <div>
          <Label>Data do Agendamento *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.date ? 
                  format(formData.date, 'PPP', { locale: ptBR }) : 
                  'Selecione a data'
                }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.date}
                onSelect={(date) => onChange({ ...formData, date, time: '' })}
                disabled={(date) => date < new Date()}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
          {errors.date && (
            <p className="text-sm text-red-500 mt-1">{errors.date}</p>
          )}
        </div>

        {/* Seleção de Horário */}
        <div>
          <Label>Horário *</Label>
          {loading ? (
            <div className="animate-pulse h-40 bg-gray-200 rounded"></div>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded">
              {timeSlots.map((slot) => {
                const isAvailable = isTimeSlotAvailable(slot);
                const isSelected = formData.time === slot;
                
                return (
                  <Button
                    key={slot}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    disabled={!isAvailable}
                    onClick={() => handleTimeSelect(slot)}
                    className={`${
                      isSelected 
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white' 
                        : isAvailable 
                          ? 'hover:bg-gray-100' 
                          : 'opacity-50 cursor-not-allowed'
                    }`}
                  >
                    {slot}
                  </Button>
                );
              })}
            </div>
          )}
          {errors.time && (
            <p className="text-sm text-red-500 mt-1">{errors.time}</p>
          )}
        </div>
      </div>

      {/* Aviso de Conflitos */}
      {conflicts.length > 0 && formData.date && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <p className="font-medium text-yellow-800 dark:text-yellow-200">
              Agendamentos existentes neste dia:
            </p>
          </div>
          <div className="space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
            {conflicts.map((apt) => (
              <p key={apt.id}>
                • {format(new Date(apt.start_time), 'HH:mm')} - {format(new Date(apt.end_time), 'HH:mm')}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}