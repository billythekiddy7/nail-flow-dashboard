
import React, { useState, useEffect } from 'react';
import { Service } from '@/entities/Service';
import { Appointment } from '@/entities/Appointment';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Scissors, Edit, Trash2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import NumberInput from '@/components/ui/NumberInput';
import NewServiceModal from '@/components/services/NewServiceModal/index';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/hooks/useConfirm';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { deleteService } from '@/functions/deleteService'; // Importa a nova função

export default function Servicos() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isNewServiceModalOpen, setIsNewServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const { toast } = useToast();
  const { confirm, isOpen, config, onConfirm, onCancel } = useConfirm();

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setLoading(true);
    const servicesData = await Service.list('-created_date');
    setServices(servicesData);
    setLoading(false);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      price: parseFloat(formData.get('price')),
      duration: parseInt(formData.get('duration')),
      description: formData.get('description'),
      category: formData.get('category')
    };

    try {
      if (editingService) {
        await Service.update(editingService.id, data);
        toast.success('Serviço atualizado com sucesso!');
      } else {
        await Service.create(data);
        toast.success('Serviço cadastrado com sucesso!');
      }

      setIsFormOpen(false);
      setEditingService(null);
      loadServices();
    } catch (error) {
      console.error('Erro ao salvar serviço:', error);
      toast.error('Erro ao salvar serviço. Tente novamente.');
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setIsFormOpen(true);
  };

  const handleDelete = async (service) => {
    const confirmed = await confirm({
      title: 'Excluir Serviço',
      description: `Tem certeza que deseja excluir o serviço "${service.name}"? Esta ação não pode ser desfeita.`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      variant: 'destructive'
    });

    if (!confirmed) return;

    try {
      // ANiquilação da lógica antiga, implementação da chamada ao backend
      const response = await deleteService({ serviceId: service.id });
      
      toast.success(response.data.message || 'Serviço excluído com sucesso!');
      loadServices();
    } catch (error) {
      console.error("Falha ao excluir serviço:", error);
      // Extrai a mensagem de erro específica do backend (ex: 409 Conflict)
      const errorMessage = error.response?.data?.error || 'Ocorreu um erro ao tentar excluir o serviço.';
      toast.error(errorMessage);
    }
  };

  const handleNewServiceSuccess = () => {
    loadServices();
  };

  const ServiceForm = ({ service }) =>
  <form onSubmit={handleFormSubmit} className="space-y-4">
      <div><Label htmlFor="name">Nome do Serviço</Label><Input id="name" name="name" defaultValue={service?.name} required className="bg-slate-950 px-3 py-2 text-base flex h-10 w-full rounded-md border border-input ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label htmlFor="price">Preço (R$)</Label><NumberInput id="price" name="price" step="0.01" defaultValue={service?.price} required className="bg-slate-950 text-white px-3 py-2 no-spin border border-neutral-700 rounded-md w-full placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent" /></div>
        <div><Label htmlFor="duration">Duração (minutos)</Label><NumberInput id="duration" name="duration" defaultValue={service?.duration} required className="bg-slate-950 text-white px-3 py-2 no-spin border border-neutral-700 rounded-md w-full placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent" /></div>
      </div>
      <div><Label htmlFor="category">Categoria</Label><Input id="category" name="category" defaultValue={service?.category} placeholder="Ex: manicure, pedicure" className="bg-slate-950 px-3 py-2 text-base flex h-10 w-full rounded-md border border-input ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" /></div>
      <div><Label htmlFor="description">Descrição</Label><Input id="description" name="description" defaultValue={service?.description} className="bg-slate-950 px-3 py-2 text-base flex h-10 w-full rounded-md border border-input ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" /></div>
      <div className="flex justify-end gap-3 pt-4">
        <Button variant="ghost" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
        <Button type="submit" className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
          {service ? 'Salvar Alterações' : 'Cadastrar Serviço'}
        </Button>
      </div>
    </form>;


  return (
    <div className="p-6">
      <PageHeader
        title="Serviços"
        subtitle="Cadastre e gerencie os serviços que você oferece"
        buttonText="Novo Serviço"
        onButtonClick={() => setIsNewServiceModalOpen(true)} />


      {/* Modal Novo Serviço */}
      <NewServiceModal
        isOpen={isNewServiceModalOpen}
        onClose={() => setIsNewServiceModalOpen(false)}
        onSuccess={handleNewServiceSuccess} />


      {/* Modal de Edição (mantido para compatibilidade) */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="glass-effect">
          <DialogHeader>
            <DialogTitle className="gradient-text">{editingService ? 'Editar Serviço' : 'Novo Serviço'}</DialogTitle>
          </DialogHeader>
          <ServiceForm service={editingService} />
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação para Exclusão */}
      {isOpen &&
      <ConfirmDialog
        isOpen={isOpen}
        title={config.title}
        description={config.description}
        onConfirm={onConfirm}
        onCancel={onCancel}
        confirmText={config.confirmText}
        cancelText={config.cancelText}
        variant={config.variant} />

      }

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ?
        [...Array(6)].map((_, i) => <Card key={i} className="animate-pulse h-48" style={{ background: 'var(--border)' }} />) :

        services.map((service) =>
        <Card key={service.id} className="card-3d" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
                  <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: service.color || '#E6007A' }} />

                  <Scissors className="w-5 h-5 text-pink-500" />
                  {service.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-bold text-xl gradient-text">R$ {service.price.toFixed(2)}</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Duração: {service.duration} min</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{service.description}</p>
                {service.slug &&
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    URL: {service.slug}
                  </p>
            }
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(service)}><Edit className="w-4 h-4 text-blue-500" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(service)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                </div>
              </CardContent>
            </Card>
        )
        }
      </div>
    </div>);

}
