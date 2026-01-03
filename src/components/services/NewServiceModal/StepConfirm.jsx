import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, DollarSign, Clock, Tag, Palette } from 'lucide-react';

export default function StepConfirm({ formData }) {
  const getCategoryLabel = (category) => {
    const categories = {
      manicure: 'Manicure',
      pedicure: 'Pedicure',
      nail_art: 'Nail Art',
      manutencao: 'Manutenção',
      outros: 'Outros'
    };
    return categories[category] || category;
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold gradient-text mb-2">Resumo do Serviço</h3>
        <p className="text-sm text-gray-400">Confira os dados antes de finalizar</p>
      </div>

      <Card className="bg-neutral-800 border-neutral-700">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3 text-white">
            <div 
              className="w-4 h-4 rounded-full" 
              style={{ backgroundColor: formData.color || '#E6007A' }}
            />
            {formData.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-xs text-gray-400">Preço</p>
                <p className="font-semibold text-green-500">R$ {formData.price.toFixed(2)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-xs text-gray-400">Duração</p>
                <p className="font-semibold text-blue-500">{formData.duration} min</p>
              </div>
            </div>
          </div>

          {formData.category && (
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-purple-500" />
              <div>
                <p className="text-xs text-gray-400">Categoria</p>
                <Badge variant="outline" className="text-purple-500 border-purple-500">
                  {getCategoryLabel(formData.category)}
                </Badge>
              </div>
            </div>
          )}

          {formData.commission > 0 && (
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-orange-500" />
              <div>
                <p className="text-xs text-gray-400">Comissão</p>
                <p className="font-semibold text-orange-500">{formData.commission}%</p>
              </div>
            </div>
          )}

          {formData.slug && (
            <div className="pt-2 border-t border-neutral-700">
              <p className="text-xs text-gray-400">URL amigável</p>
              <p className="text-sm text-gray-300 font-mono bg-neutral-900 px-2 py-1 rounded">
                {formData.slug}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="bg-neutral-900 p-4 rounded-lg border border-neutral-700">
        <h4 className="text-sm font-semibold text-white mb-2">✨ Pronto para cadastrar!</h4>
        <p className="text-xs text-gray-400">
          Seu serviço será criado com todas as informações acima. 
          Você poderá editá-lo a qualquer momento na lista de serviços.
        </p>
      </div>
    </div>
  );
}