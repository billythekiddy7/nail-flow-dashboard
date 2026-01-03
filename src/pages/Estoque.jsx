import React, { useState, useEffect } from 'react';
import { Product } from '@/entities/Product';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Package, Edit, Trash2, Box, Calculator, DollarSign, TrendingUp } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import NewProductModal from '@/components/inventory/NewProductModal';
import ProductCard from '@/components/inventory/ProductCard';
import MetricsCard from '@/components/ui/metrics-card';
import { getInventoryMetrics } from '@/functions/getInventoryMetrics'; // Importa a função do backend
import { useConfirm } from '@/components/hooks/useConfirm';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

const formatCurrency = (value) => `R$ ${value?.toFixed(2).replace('.', ',') || '0,00'}`;

export default function Estoque() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  
  const { toast } = useToast();
  const { confirm, isOpen, config, onConfirm, onCancel } = useConfirm();

  const loadAllData = async () => {
    setLoading(true);
    setMetricsLoading(true);
    try {
      // Busca sequencial para reduzir carga no servidor (Regra 4.1)
      console.log("[Estoque] Buscando produtos...");
      const productsData = await Product.list('-created_date');
      console.log("[Estoque] Buscando métricas do backend...");
      const metricsResponse = await getInventoryMetrics();
      
      setProducts(productsData);
      setMetrics(metricsResponse.data);

    } catch (error) {
        console.error("Erro ao carregar dados do estoque:", error);
        toast.error("Falha ao carregar dados do estoque.");
        setMetrics(null); // Reseta as métricas em caso de erro
    } finally {
        setLoading(false);
        setMetricsLoading(false);
    }
  };
  
  useEffect(() => {
    loadAllData();
  }, []);

  const handleEdit = (product) => {
    setEditingProduct(product);
    setIsNewProductModalOpen(true); // Reutilizando o modal de novo produto para edição
  };

  const handleDelete = async (product) => {
    const confirmed = await confirm({
      title: 'Excluir Produto',
      description: `Tem certeza que deseja excluir o produto "${product.name}"? Esta ação é irreversível.`,
      confirmText: 'Excluir',
      variant: 'destructive',
    });

    if (confirmed) {
      try {
        await Product.delete(product.id);
        toast.success(`Produto "${product.name}" excluído com sucesso!`);
        await loadAllData(); // Recarrega produtos e métricas
      } catch (error) {
        toast.error("Ocorreu um erro ao excluir o produto.");
        console.error("Erro ao excluir produto:", error);
      }
    }
  };

  const handleSuccess = async () => {
    setEditingProduct(null); // Limpa o produto em edição
    await loadAllData();
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Controle de Estoque"
        subtitle="Gerencie os produtos utilizados em seus serviços"
        buttonText="Novo Produto"
        onButtonClick={() => {
          setEditingProduct(null);
          setIsNewProductModalOpen(true);
        }}
      />

      {/* Métricas */}
      {metricsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8 animate-pulse">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-gray-700/50" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          <MetricsCard title="Total de Unidades" value={metrics?.totalUnits || 0} icon={Box} color="blue" showChange={false}/>
          <MetricsCard title="Custo Total" value={formatCurrency(metrics?.totalCost)} icon={Calculator} color="orange" showChange={false}/>
          <MetricsCard title="Valor Recebido (Uso)" value={formatCurrency(metrics?.totalValueReceived)} icon={DollarSign} color="green" showChange={false}/>
          <MetricsCard title="Lucro Realizado (Uso)" value={formatCurrency(metrics?.totalProfit)} icon={TrendingUp} color="blue" showChange={false}/>
        </div>
      )}

      {/* Modal de Confirmação para Exclusão */}
      <ConfirmDialog
        isOpen={isOpen}
        title={config.title}
        description={config.description}
        onConfirm={onConfirm}
        onCancel={onCancel}
        confirmText={config.confirmText}
        variant={config.variant}
      />

      <NewProductModal
        isOpen={isNewProductModalOpen}
        onClose={() => {
          setEditingProduct(null);
          setIsNewProductModalOpen(false);
        }}
        onSuccess={handleSuccess}
        productToEdit={editingProduct}
      />
      
      {/* Grid de Produtos Responsiva */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          [...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse h-64 rounded-2xl bg-gray-700/50" />
          ))
        ) : products.length > 0 ? (
          products.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-16">
            <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <h3 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Nenhum produto no estoque</h3>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Adicione seu primeiro produto para começar a gerenciar seu inventário.
            </p>
            <Button 
              onClick={() => {
                setEditingProduct(null);
                setIsNewProductModalOpen(true);
              }}
              className="mt-6 bg-gradient-to-r from-pink-500 to-purple-600 text-white"
            >
              Adicionar Produto
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}