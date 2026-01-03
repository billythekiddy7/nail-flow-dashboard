
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Product } from '@/entities/Product';
import { useToast } from '@/components/ui/Toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import GradientButton from '@/components/ui/GradientButton';

const INITIAL_STATE = {
  name: '',
  cost_total: '',
  stock: '',
  min_stock: '',
  unit: 'unidade',
  cost_unit: 0
};

export default function NewProductModal({ isOpen, onClose, productToEdit, onSuccess }) {
  const [product, setProduct] = useState(INITIAL_STATE);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (productToEdit) {
      setProduct({
        ...INITIAL_STATE,
        ...productToEdit,
        cost_total: productToEdit.cost_total || '',
        stock: productToEdit.stock || '',
        min_stock: productToEdit.min_stock || ''
      });
    } else {
      setProduct(INITIAL_STATE);
    }
  }, [productToEdit, isOpen]);

  useEffect(() => {
    const costTotal = parseFloat(product.cost_total);
    const stock = parseFloat(product.stock);
    if (!isNaN(costTotal) && !isNaN(stock) && stock > 0) {
      const unitCost = costTotal / stock;
      setProduct((p) => ({ ...p, cost_unit: unitCost }));
    } else {
      setProduct((p) => ({ ...p, cost_unit: 0 }));
    }
  }, [product.cost_total, product.stock]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setProduct({ ...product, [id]: value });
  };

  const handleUnitChange = (value) => {
    setProduct({ ...product, unit: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSave = {
        ...product,
        cost_total: parseFloat(product.cost_total),
        stock: parseInt(product.stock, 10),
        min_stock: parseInt(product.min_stock, 10)
      };

      if (productToEdit) {
        await Product.update(productToEdit.id, dataToSave);
        toast.success('Produto atualizado com sucesso!');
      } else {
        await Product.create(dataToSave);
        toast.success('Produto criado com sucesso!');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      toast.error('Erro ao salvar produto.');
    } finally {
      setLoading(false);
    }
  };

  // New handler for Dialog's onOpenChange, wrapping the onClose prop
  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="glass-effect">
        <DialogHeader>
          <DialogTitle className="gradient-text">{productToEdit ? 'Editar Produto' : 'Adicionar Novo Produto'}</DialogTitle>
          <DialogDescription>
            Preencha os detalhes do produto para controle de estoque e custos.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="name">Nome do Produto *</Label>
            <Input id="name" value={product.name} onChange={handleChange} required className="bg-slate-950 px-3 py-2 text-base flex h-10 w-full rounded-md border ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm border-input" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cost_total">Custo Total da Compra (R$) *</Label>
              <Input id="cost_total" type="number" placeholder="Ex: 50,00" value={product.cost_total} onChange={handleChange} required className="bg-slate-950 px-3 py-2 text-base flex h-10 w-full rounded-md border ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm border-input" />
            </div>
            <div>
              <Label htmlFor="stock">Quantidade Comprada *</Label>
              <Input id="stock" type="number" placeholder="Ex: 10" value={product.stock} onChange={handleChange} required className="bg-slate-950 px-3 py-2 text-base flex h-10 w-full rounded-md border ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm border-input" />
            </div>
          </div>
           <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="unit">Unidade de Medida *</Label>
              <Select onValueChange={handleUnitChange} value={product.unit}>
                <SelectTrigger className="bg-slate-950 px-3 py-2 text-sm flex h-10 w-full items-center justify-between rounded-md border ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 border-input">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unidade">Unidade (un)</SelectItem>
                  <SelectItem value="ml">Mililitro (ml)</SelectItem>
                  <SelectItem value="g">Grama (g)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="min_stock">Estoque Mínimo *</Label>
              <Input id="min_stock" type="number" placeholder="Ex: 2" value={product.min_stock} onChange={handleChange} required className="bg-slate-950 px-3 py-2 text-base flex h-10 w-full rounded-md border ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm border-input" />
            </div>
          </div>
          <div className="bg-slate-950 p-4 rounded-lg border border-border">
            <h4 className="text-slate-50 mb-2 font-medium">Custo Unitário Calculado:</h4>
            <p className="text-2xl font-bold text-green-400">
              R$ {product.cost_unit.toFixed(2).replace('.', ',')}
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="bg-slate-950 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input hover:bg-accent hover:text-accent-foreground h-10">Cancelar</Button>
            <GradientButton type="submit" disabled={loading}>
              {loading ? 'Salvando...' : productToEdit ? 'Salvar Alterações' : 'Criar Produto'}
            </GradientButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>);

}