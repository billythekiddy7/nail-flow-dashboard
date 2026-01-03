import React from 'react';
import { Label } from '@/components/ui/label';
import ClientSelect from '../ClientSelect';
import { User } from 'lucide-react';

export default function StepClient({ 
  formData, 
  onChange, 
  clients, 
  onClientsUpdate,
  errors = {} 
}) {
  const selectedClient = clients.find(c => c.id === formData.client_id);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-bold gradient-text">Selecionar Cliente</h3>
        <p className="text-sm text-gray-500 mt-1">
          Escolha uma cliente existente ou cadastre uma nova
        </p>
      </div>

      <div>
        <Label htmlFor="client">Cliente *</Label>
        <ClientSelect
          value={formData.client_id}
          onChange={(clientId) => onChange({ ...formData, client_id: clientId })}
          clients={clients}
          onClientsUpdate={onClientsUpdate}
        />
        {errors.client_id && (
          <p className="text-sm text-red-500 mt-1">{errors.client_id}</p>
        )}
      </div>

      {selectedClient && (
        <div className="p-4 rounded-lg" style={{ background: 'var(--secondary-bg)' }}>
          <h4 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Cliente Selecionada
          </h4>
          <div className="space-y-1 text-sm">
            <p><strong>Nome:</strong> {selectedClient.name}</p>
            <p><strong>Telefone:</strong> {selectedClient.phone}</p>
            {selectedClient.email && (
              <p><strong>Email:</strong> {selectedClient.email}</p>
            )}
            {selectedClient.notes && (
              <p><strong>Observações:</strong> {selectedClient.notes}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}