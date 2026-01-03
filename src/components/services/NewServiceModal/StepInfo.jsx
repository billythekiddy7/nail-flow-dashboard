import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import NumberInput from '@/components/ui/NumberInput';

const slugify = (text) => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
    .trim()
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-'); // Remove hífens duplicados
};

const SERVICE_COLORS = [
  { value: '#E6007A', label: 'Rosa' },
  { value: '#8B5CF6', label: 'Roxo' },
  { value: '#3B82F6', label: 'Azul' },
  { value: '#10B981', label: 'Verde' },
  { value: '#F59E0B', label: 'Amarelo' },
  { value: '#EF4444', label: 'Vermelho' }
];

export default function StepInfo({ formData, onChange, errors }) {
  const handleChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    
    // Auto-gerar slug quando o nome muda
    if (field === 'name') {
      newData.slug = slugify(value);
    }
    
    onChange(newData);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold gradient-text mb-2">Informações do Serviço</h3>
        <p className="text-sm text-gray-400">Preencha os dados básicos do seu serviço</p>
      </div>

      <div className="space-y-4">
        {/* Nome do Serviço */}
        <div>
          <Label htmlFor="name" className="text-white">Nome do Serviço *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Ex: Unha de Gel"
            className="bg-neutral-900 border-neutral-700 text-white"
          />
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
        </div>

        {/* Slug (readonly) */}
        <div>
          <Label htmlFor="slug" className="text-white">URL amigável</Label>
          <Input
            id="slug"
            value={formData.slug}
            readOnly
            placeholder="sera-gerado-automaticamente"
            className="bg-neutral-800 border-neutral-600 text-gray-400"
          />
          <p className="text-xs text-gray-500 mt-1">Gerado automaticamente a partir do nome</p>
        </div>

        {/* Preço e Duração */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="price" className="text-white">Preço (R$) *</Label>
            <NumberInput
              id="price"
              value={formData.price}
              onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
            {errors.price && <p className="text-red-400 text-xs mt-1">{errors.price}</p>}
          </div>

          <div>
            <Label htmlFor="duration" className="text-white">Duração (min) *</Label>
            <NumberInput
              id="duration"
              value={formData.duration}
              onChange={(e) => handleChange('duration', parseInt(e.target.value) || 0)}
              placeholder="60"
              min="5"
              step="5"
            />
            {errors.duration && <p className="text-red-400 text-xs mt-1">{errors.duration}</p>}
          </div>
        </div>

        {/* Categoria */}
        <div>
          <Label htmlFor="category" className="text-white">Categoria</Label>
          <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
            <SelectTrigger className="bg-neutral-900 border-neutral-700 text-white [&>span]:text-white">
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-900 border-neutral-700">
              <SelectItem value="manicure" className="text-white hover:bg-neutral-800 focus:bg-neutral-800">Manicure</SelectItem>
              <SelectItem value="pedicure" className="text-white hover:bg-neutral-800 focus:bg-neutral-800">Pedicure</SelectItem>
              <SelectItem value="nail_art" className="text-white hover:bg-neutral-800 focus:bg-neutral-800">Nail Art</SelectItem>
              <SelectItem value="manutencao" className="text-white hover:bg-neutral-800 focus:bg-neutral-800">Manutenção</SelectItem>
              <SelectItem value="outros" className="text-white hover:bg-neutral-800 focus:bg-neutral-800">Outros</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Cor do Serviço */}
        <div>
          <Label htmlFor="color" className="text-white">Cor do Serviço</Label>
          <div className="flex gap-2 mt-2">
            {SERVICE_COLORS.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => handleChange('color', color.value)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  formData.color === color.value 
                    ? 'border-white scale-110' 
                    : 'border-gray-600 hover:border-gray-400'
                }`}
                style={{ backgroundColor: color.value }}
                title={color.label}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}