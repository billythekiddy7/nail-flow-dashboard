import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Scissors, DollarSign } from 'lucide-react';

const PAYMENT_METHODS = [
  { value: 'dinheiro', label: 'Dinheiro', icon: '💵' },
  { value: 'pix', label: 'PIX', icon: '📱' },
  { value: 'cartao', label: 'Cartão', icon: '💳' },
  { value: 'fiado', label: 'Fiado', icon: '📝' }
];

export default function StepPayment({ 
  formData, 
  onChange, 
  services,
  errors = {} 
}) {
  const selectedService = services.find(s => s.id === formData.service_id);
  const finalPrice = formData.custom_price || selectedService?.price || 0;

  const handleServiceChange = (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    onChange({
      ...formData,
      service_id: serviceId,
      custom_price: service?.price || 0
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <DollarSign className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-bold gradient-text">Serviço e Pagamento</h3>
        <p className="text-sm text-gray-500 mt-1">
          Defina o serviço e forma de pagamento
        </p>
      </div>

      {/* Seleção de Serviço */}
      <div>
        <Label htmlFor="service">Serviço *</Label>
        <Select value={formData.service_id} onValueChange={handleServiceChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um serviço" />
          </SelectTrigger>
          <SelectContent>
            {services.map((service) => (
              <SelectItem key={service.id} value={service.id}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <Scissors className="w-4 h-4" />
                    <span>{service.name}</span>
                  </div>
                  <span className="text-green-500 font-bold ml-4">
                    R$ {service.price?.toFixed(2)}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.service_id && (
          <p className="text-sm text-red-500 mt-1">{errors.service_id}</p>
        )}
      </div>

      {/* Detalhes do Serviço Selecionado */}
      {selectedService && (
        <Card style={{ background: 'var(--secondary-bg)', border: '1px solid var(--border)' }}>
          <CardContent className="p-4">
            <h4 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Detalhes do Serviço
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Duração:</p>
                <p className="font-medium">{selectedService.duration} minutos</p>
              </div>
              <div>
                <p className="text-gray-500">Preço Padrão:</p>
                <p className="font-medium text-green-500">R$ {selectedService.price?.toFixed(2)}</p>
              </div>
            </div>
            {selectedService.description && (
              <div className="mt-2">
                <p className="text-gray-500">Descrição:</p>
                <p className="text-sm">{selectedService.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Forma de Pagamento */}
        <div>
          <Label htmlFor="payment_method">Forma de Pagamento *</Label>
          <Select 
            value={formData.payment_method} 
            onValueChange={(value) => onChange({ ...formData, payment_method: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Como será pago?" />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map((method) => (
                <SelectItem key={method.value} value={method.value}>
                  <div className="flex items-center gap-2">
                    <span>{method.icon}</span>
                    {method.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.payment_method && (
            <p className="text-sm text-red-500 mt-1">{errors.payment_method}</p>
          )}
        </div>

        {/* Valor Personalizado */}
        <div>
          <Label htmlFor="custom_price">Valor a Cobrar (R$)</Label>
          <Input
            id="custom_price"
            type="number"
            step="0.01"
            min="0"
            value={formData.custom_price || ''}
            onChange={(e) => onChange({ ...formData, custom_price: parseFloat(e.target.value) || 0 })}
            placeholder="0,00"
          />
          <p className="text-xs text-gray-500 mt-1">
            Deixe em branco para usar o preço padrão
          </p>
        </div>
      </div>

      {/* Observações */}
      <div>
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          placeholder="Informações adicionais sobre o agendamento..."
          value={formData.notes || ''}
          onChange={(e) => onChange({ ...formData, notes: e.target.value })}
          rows={3}
        />
      </div>

      {/* Resumo Final */}
      {selectedService && (
        <Card className="border-2 border-green-200 dark:border-green-800" style={{ background: 'var(--card-bg)' }}>
          <CardContent className="p-4">
            <h4 className="font-bold text-green-600 mb-2">Resumo do Agendamento</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Serviço:</span>
                <span className="font-medium">{selectedService.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Duração:</span>
                <span>{selectedService.duration} min</span>
              </div>
              <div className="flex justify-between">
                <span>Pagamento:</span>
                <span>{PAYMENT_METHODS.find(m => m.value === formData.payment_method)?.label}</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between font-bold text-green-600">
                <span>Total:</span>
                <span>R$ {finalPrice.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}