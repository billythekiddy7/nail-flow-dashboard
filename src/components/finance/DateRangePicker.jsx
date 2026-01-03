import React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function DateRangePicker({ startDate, endDate, onStartDateChange, onEndDateChange }) {
  return (
    <div className="flex items-center gap-4">
      <div>
        <label className="text-sm font-medium mb-2 block text-white">Data Inicial</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="bg-neutral-900 border-neutral-700 text-white">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-neutral-900 border-neutral-700">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={onStartDateChange}
              locale={ptBR}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <div>
        <label className="text-sm font-medium mb-2 block text-white">Data Final</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="bg-neutral-900 border-neutral-700 text-white">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? format(endDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-neutral-900 border-neutral-700">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={onEndDateChange}
              locale={ptBR}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}