import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, AlertTriangle, Box, Package, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const formatCurrency = (value) => `R$ ${value?.toFixed(2).replace('.', ',') || '0,00'}`;

export default function ProductCard({ product, onEdit, onDelete }) {
  const isLowStock = product.stock <= product.min_stock;

  return (
    <Card className="card-3d flex flex-col justify-between" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg" style={{ color: 'var(--text-primary)' }}>
          <Package className="w-5 h-5 text-pink-500" />
          <span className="truncate">{product.name}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--secondary-bg)' }}>
          <div className="flex items-center gap-2">
            <Box className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Estoque Atual</span>
          </div>
          <div className="flex items-center gap-2">
            {isLowStock && <AlertTriangle className="w-5 h-5 text-orange-400" title="Estoque baixo" />}
            <span className={`text-lg font-bold ${isLowStock ? 'text-orange-400' : 'text-white'}`}>
              {product.stock} <span className="text-sm font-normal">{product.unit}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--secondary-bg)' }}>
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Custo Unitário</span>
          </div>
          <span className="text-lg font-bold text-green-400">
            {formatCurrency(product.cost_unit)}
          </span>
        </div>

        {isLowStock && (
            <Badge variant="destructive" className="w-full justify-center">
                Estoque Mínimo: {product.min_stock} {product.unit}
            </Badge>
        )}

      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="ghost" size="icon" onClick={() => onEdit(product)} aria-label={`Editar ${product.name}`}>
          <Edit className="w-4 h-4 text-blue-500" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(product)} aria-label={`Excluir ${product.name}`}>
          <Trash2 className="w-4 h-4 text-red-500" />
        </Button>
      </CardFooter>
    </Card>
  );
}