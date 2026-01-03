
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Filter, X, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import ClientSelect from '../ClientSelect';
import GradientButton from '../../ui/GradientButton';

const STATUS_OPTIONS = [
  { value: 'todos', label: 'Todos os Status' },
  { value: 'agendado', label: 'Agendado' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'cancelado', label: 'Cancelado' }
];

const PAYMENT_OPTIONS = [
  { value: 'todos', label: 'Todos os Pagamentos' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'pix', label: 'PIX' },
  { value: 'cartao', label: 'Cartão' },
  { value: 'fiado', label: 'Fiado' }
];

export default function FiltersModal({
  isOpen,
  onClose,
  onApply,
  clients = [],
  services = [],
  currentFilters = {}
}) {
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    status: 'todos',
    client_id: '',
    service_ids: [],
    payment_method: 'todos',
    ...currentFilters
  });

  useEffect(() => {
    if (isOpen) {
      setFilters({
        startDate: null,
        endDate: null,
        status: 'todos',
        client_id: '',
        service_ids: [],
        payment_method: 'todos',
        ...currentFilters
      });
    }
  }, [isOpen, currentFilters]);

  const handleServiceToggle = (serviceId) => {
    setFilters((prev) => ({
      ...prev,
      service_ids: prev.service_ids.includes(serviceId) ?
        prev.service_ids.filter((id) => id !== serviceId) :
        [...prev.service_ids, serviceId]
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      startDate: null,
      endDate: null,
      status: 'todos',
      client_id: '',
      service_ids: [],
      payment_method: 'todos'
    });
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
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

  const selectedClient = clients.find((c) => c.id === filters.client_id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-effect">
        <DialogHeader>
          <DialogTitle className="gradient-text flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros Avançados
            {getActiveFiltersCount() > 0 &&
              <Badge variant="secondary" className="bg-pink-500 text-white">
                {getActiveFiltersCount()}
              </Badge>
            }
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Período */}
          <div>
            <Label className="text-base font-semibold mb-3 block">📅 Período</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Data Inicial</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="bg-slate-950 text-left px-4 py-2 text-sm font-medium inline-flex items-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input hover:bg-accent hover:text-accent-foreground h-10 w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.startDate ?
                        format(filters.startDate, 'dd/MM/yyyy', { locale: ptBR }) :
                        'Selecionar'
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.startDate}
                      onSelect={(date) => setFilters((prev) => ({ ...prev, startDate: date }))}
                      locale={ptBR} />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="endDate">Data Final</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="bg-slate-950 text-left px-4 py-2 text-sm font-medium inline-flex items-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input hover:bg-accent hover:text-accent-foreground h-10 w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.endDate ?
                        format(filters.endDate, 'dd/MM/yyyy', { locale: ptBR }) :
                        'Selecionar'
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.endDate}
                      onSelect={(date) => setFilters((prev) => ({ ...prev, endDate: date }))}
                      locale={ptBR} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Status e Pagamento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-base font-semibold mb-3 block">🏷️ Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}>
                <SelectTrigger className="bg-slate-950 px-3 py-2 text-sm flex h-10 w-full items-center justify-between rounded-md border border-input ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) =>
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-base font-semibold mb-3 block">💳 Pagamento</Label>
              <Select value={filters.payment_method} onValueChange={(value) => setFilters((prev) => ({ ...prev, payment_method: value }))}>
                <SelectTrigger className="bg-slate-950 px-3 py-2 text-sm flex h-10 w-full items-center justify-between rounded-md border border-input ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_OPTIONS.map((option) =>
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Cliente */}
          <div>
            <Label className="text-base font-semibold mb-3 block">👤 Cliente</Label>
            <ClientSelect
              value={filters.client_id}
              onChange={(clientId) => setFilters((prev) => ({ ...prev, client_id: clientId }))}
              clients={clients} />

            {selectedClient &&
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="outline">{selectedClient.name}</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilters((prev) => ({ ...prev, client_id: '' }))}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            }
          </div>

          {/* Serviços */}
          <div>
            <Label className="text-base font-semibold mb-3 block">✂️ Serviços</Label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded">
              {services.map((service) =>
                <div key={service.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`service-${service.id}`}
                    checked={filters.service_ids.includes(service.id)}
                    onChange={() => handleServiceToggle(service.id)}
                    className="rounded" />
                  <label htmlFor={`service-${service.id}`} className="text-sm">
                    {service.name}
                  </label>
                </div>
              )}
            </div>
            {filters.service_ids.length > 0 &&
              <div className="mt-2 flex flex-wrap gap-1">
                {filters.service_ids.map((serviceId) => {
                  const service = services.find((s) => s.id === serviceId);
                  return (
                    <Badge key={serviceId} variant="outline" className="bg-slate-950 text-green-500 px-2.5 py-0.5 text-xs font-semibold inline-flex items-center rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                      {service?.name}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-1"
                        onClick={() => handleServiceToggle(serviceId)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  );
                })}
              </div>
            }
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4 border-t border-gray-700">
          <Button variant="outline" onClick={handleClearFilters} className="bg-slate-950 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input hover:bg-accent hover:text-accent-foreground h-10">
            <RotateCcw className="w-4 h-4 mr-2" />
            Limpar Filtros
          </Button>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <GradientButton onClick={handleApply}>
              Aplicar Filtros
            </GradientButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
