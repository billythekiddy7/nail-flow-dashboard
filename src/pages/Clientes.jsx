import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, User } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/Toast';
import ClientCard from '@/components/clients/ClientCard';
import ClientDetailsModal from '@/components/clients/ClientDetailsModal';
import NewAppointmentModal from '@/components/agenda/NewAppointmentModal/index'; // Adicionado import
import { base44 } from '@/api/base44Client';

export default function Clientes() {
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isNewAppointmentModalOpen, setIsNewAppointmentModalOpen] = useState(false);
  const [preselectedClientForAppointment, setPreselectedClientForAppointment] = useState(null);

  const [deleteClient, setDeleteClient] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { toast } = useToast();

  // Efeito para carregar dados não filtráveis (serviços) uma única vez
  useEffect(() => {
    const loadNonFilteredData = async () => {
      try {
        console.log('📡 Carregando serviços...');
        const servicesData = await base44.entities.Service.list('-created_date', 20);
        setServices(Array.isArray(servicesData) ? servicesData : []);
        console.log('✅ Serviços carregados:', servicesData.length);
      } catch (error) {
        console.warn('Erro ao carregar serviços (não crítico):', error);
        setServices([]);
      }
    };
    loadNonFilteredData();
  }, []);

  const loadClients = async () => {
    // Function to reload the client list after an action (CUD)
    setLoading(true);
    try {
      const filterOptions = searchTerm ? { name_contains: searchTerm } : {};
      console.log('📡 Recarregando clientes com filtro:', filterOptions);
      const clientsData = await base44.entities.Client.filter(filterOptions, '-created_date', 50);
      setClients(clientsData || []);
    } catch (error) {
      console.error('❌ Erro ao recarregar clientes:', error);
      toast.error("Falha ao recarregar clientes.");
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  // Efeito refatorado com debounce para busca de clientes no servidor
  useEffect(() => {
    setLoading(true);
    const debounceHandler = setTimeout(async () => {
      try {
        const filterOptions = searchTerm ?
        { name_contains: searchTerm } // Optimized filter on the backend
        : {};

        console.log('📡 Buscando clientes com filtro:', filterOptions);
        const clientsData = await base44.entities.Client.filter(filterOptions, '-created_date', 50);
        setClients(clientsData || []);
      } catch (error) {
        console.error('❌ Erro ao buscar clientes:', error);
        toast.error("Falha ao buscar clientes.");
        setClients([]);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce

    return () => {
      clearTimeout(debounceHandler);
    };
  }, [searchTerm]); // Triggered on every change in the search term

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
      if (editingClient) {
        await base44.entities.Client.update(editingClient.id, data);
        toast.success('Cliente atualizada com sucesso!');
      } else {
        const newClient = await base44.entities.Client.create(data);
        toast.success('Cliente cadastrada com sucesso!');
        
        // OPERAÇÃO CRONOS: Disparar trigger de atualização incremental
        try {
          await base44.functions.invoke('onClientCreated', { 
            clientId: newClient.id 
          });
        } catch (triggerError) {
          console.warn('Falha ao disparar trigger de métricas (onClientCreated):', triggerError);
          // Não bloquear o fluxo principal - trigger é best-effort
        }
      }

      setIsFormOpen(false);
      setEditingClient(null);
      loadClients();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      toast.error('Erro ao salvar cliente');
    }
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setIsFormOpen(true);
  };

  const handleDelete = async (client) => {
    console.log('🗑️ handleDelete chamado para:', client.name);
    setDeleteClient(client);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteClient) return;

    try {
      await base44.entities.Client.delete(deleteClient.id);
      toast.success(`Cliente "${deleteClient.name}" excluída com sucesso!`);
      setShowDeleteModal(false);
      setDeleteClient(null);
      loadClients();
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      toast.error('Erro ao excluir cliente. Tente novamente.');
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteClient(null);
  };

  const handleView = (client) => {
    setSelectedClient(client);
    setShowDetailsModal(true);
  };

  const handleNewAppointmentForClient = (client) => {
    setPreselectedClientForAppointment(client);
    setShowDetailsModal(false); // Fecha o modal de detalhes
    setIsNewAppointmentModalOpen(true); // Abre o modal de novo agendamento
  };

  // Client-side filtering logic has been removed.
  // The `clients` variable now contains data already filtered from the server.

  const ClientForm = ({ client }) =>
  <form onSubmit={handleFormSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Nome Completa</Label>
        <Input id="name" name="name" defaultValue={client?.name} required className="bg-slate-950 px-3 py-2 text-base flex h-10 w-full rounded-md border border-input ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" />
      </div>
      <div>
        <Label htmlFor="phone">Telefone / WhatsApp</Label>
        <Input id="phone" name="phone" defaultValue={client?.phone} required className="bg-slate-950 px-3 py-2 text-base flex h-10 w-full rounded-md border border-input ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" defaultValue={client?.email} className="bg-slate-950 px-3 py-2 text-base flex h-10 w-full rounded-md border border-input ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" />
      </div>
      <div>
        <Label htmlFor="notes">Anotações (preferências, alergias, etc.)</Label>
        <Input id="notes" name="notes" defaultValue={client?.notes} className="bg-slate-950 px-3 py-2 text-base flex h-10 w-full rounded-md border border-input ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" />
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button variant="ghost" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
        <Button type="submit" className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
          {client ? 'Salvar Alterações' : 'Cadastrar Cliente'}
        </Button>
      </div>
    </form>;


  return (
    <div className="p-6">
      <PageHeader
        title="Gestão de Clientes"
        subtitle="Adicione, edite e visualize suas clientes"
        buttonText="Nova Cliente"
        onButtonClick={() => {setEditingClient(null);setIsFormOpen(true);}}>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          <Input
            placeholder="Buscar por nome..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} />

        </div>
      </PageHeader>
      
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="glass-effect">
          <DialogHeader>
            <DialogTitle className="gradient-text">{editingClient ? 'Editar Cliente' : 'Nova Cliente'}</DialogTitle>
          </DialogHeader>
          <ClientForm client={editingClient} />
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="glass-effect">
          <DialogHeader>
            <DialogTitle className="text-red-400">Excluir Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p style={{ color: 'var(--text-primary)' }}>
              Tem certeza que deseja excluir a cliente <strong>"{deleteClient?.name}"</strong>?
            </p>
            <div className="p-4 rounded-lg bg-red-900/20 border border-red-500/30">
              <p className="text-red-400 text-sm font-medium">
                ⚠️ Esta ação é IRREVERSÍVEL e todos os dados serão perdidos permanentemente.
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={cancelDelete}>
                Cancelar
              </Button>
              <Button
                onClick={confirmDelete}
                className="bg-red-500 hover:bg-red-600 text-white">

                Sim, Excluir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ClientDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        client={selectedClient}
        services={Array.isArray(services) ? services : []}
        onNewAppointment={handleNewAppointmentForClient}
      />

      <NewAppointmentModal
        isOpen={isNewAppointmentModalOpen}
        onClose={() => {
            setIsNewAppointmentModalOpen(false);
            setPreselectedClientForAppointment(null);
        }}
        onSuccess={() => {
            setIsNewAppointmentModalOpen(false);
            setPreselectedClientForAppointment(null);
            loadClients();
        }}
        initialClient={preselectedClientForAppointment}
      />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ?
        [...Array(8)].map((_, i) =>
        <div key={i} className="animate-pulse h-40 rounded-2xl" style={{ background: 'var(--border)' }} />
        ) :
        clients.length > 0 ?
        clients.map((client) =>
        <ClientCard
          key={client.id}
          client={client}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView} />

        ) :

        <div className="col-span-full text-center py-12">
            <div className="text-center">
              <User className="w-12 h-12 mx-auto mb-4 opacity-50" style={{ color: 'var(--text-secondary)' }} />
              <p style={{ color: 'var(--text-secondary)' }}>
                {searchTerm ? 'Nenhum cliente encontrado para sua busca' : 'Nenhum cliente cadastrado ainda'}
              </p>
            </div>
          </div>
        }
      </div>
    </div>);

}