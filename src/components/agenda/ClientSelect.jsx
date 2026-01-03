import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Plus, User } from 'lucide-react';
import { Client } from '@/entities/Client';

export default function ClientSelect({ value, onChange, clients: initialClients, onClientsUpdate }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredClients, setFilteredClients] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [clients, setClients] = useState(initialClients || []);
  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => {
    if (value && clients.length > 0) {
      const client = clients.find((c) => c.id === value);
      setSelectedClient(client);
      setSearchTerm(client?.name || '');
    }
  }, [value, clients]);

  useEffect(() => {
    if (searchTerm && clients.length > 0) {
      const filtered = clients.filter((client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm)
      );
      setFilteredClients(filtered);
      setShowResults(true);
    } else {
      setFilteredClients([]);
      setShowResults(false);
    }
  }, [searchTerm, clients]);

  const handleClientSelect = (client) => {
    setSelectedClient(client);
    setSearchTerm(client.name);
    setShowResults(false);
    onChange(client.id);
  };

  const handleNewClient = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const clientData = {
      name: formData.get('name'),
      phone: formData.get('phone'),
      email: formData.get('email') || ''
    };

    try {
      const newClient = await Client.create(clientData);
      const updatedClients = [...clients, newClient];
      setClients(updatedClients);
      onClientsUpdate?.(updatedClients);
      handleClientSelect(newClient);
      setShowNewClientModal(false);
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      alert('Erro ao criar cliente. Tente novamente.');
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Buscar cliente por nome ou telefone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)} className="bg-slate-950 pl-10 px-3 py-2 text-base flex h-10 w-full rounded-md border border-input ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" />


      </div>

      {showResults && filteredClients.length > 0 &&
      <Card className="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
          <CardContent className="p-2">
            {filteredClients.map((client) =>
          <div
            key={client.id}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded flex items-center gap-2"
            onClick={() => handleClientSelect(client)}>

                <User className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-red-400 font-medium">{client.name}</p>
                  <p className="text-green-500 text-sm">{client.phone}</p>
                </div>
              </div>
          )}
          </CardContent>
        </Card>
      }

      {searchTerm && filteredClients.length === 0 &&
      <Card className="absolute z-10 w-full mt-1" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-500 mb-2">Cliente não encontrado</p>
            <Button
            size="sm"
            onClick={() => setShowNewClientModal(true)}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">

              <Plus className="w-4 h-4 mr-1" />
              Cadastrar Cliente
            </Button>
          </CardContent>
        </Card>
      }

      <Dialog open={showNewClientModal} onOpenChange={setShowNewClientModal}>
        <DialogContent className="glass-effect dark" style={{ background: '#222222', color: 'white', borderColor: '#333333' }}>
          <DialogHeader>
            <DialogTitle className="gradient-text">Novo Cliente</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleNewClient} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome Completo</Label>
              <Input id="name" name="name" required defaultValue={searchTerm} />
            </div>
            <div>
              <Label htmlFor="phone">Telefone/WhatsApp</Label>
              <Input id="phone" name="phone" required placeholder="(11) 99999-9999" />
            </div>
            <div>
              <Label htmlFor="email">Email (opcional)</Label>
              <Input id="email" name="email" type="email" />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" type="button" onClick={() => setShowNewClientModal(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
                Cadastrar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>);

}