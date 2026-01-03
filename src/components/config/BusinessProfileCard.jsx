import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Briefcase } from 'lucide-react';
import UploadLogoButton from './UploadLogoButton';

export default function BusinessProfileCard({ userData, onChange }) {
  const [formData, setFormData] = useState(userData || {});

  const handleChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onChange(newData);
  };

  const validateWhatsApp = (phone) => {
    if (!phone) return true; // Permite campo vazio
    const phoneRegex = /^\+?55\d{10,11}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const validateInstagram = (instagram) => {
    if (!instagram) return true; // Permite campo vazio
    return instagram.startsWith('@') || instagram.startsWith('https://instagram.com/') || instagram.startsWith('https://www.instagram.com/');
  };

  return (
    <Card className="card-3d" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-pink-500" />
          Perfil do Negócio
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload de Logo */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Logo / Foto de Perfil</Label>
          <UploadLogoButton
            currentImage={formData.profile_image}
            onUploadSuccess={(url) => handleChange('profile_image', url)}
          />
        </div>

        {/* Informações básicas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="full_name">Seu Nome *</Label>
            <Input
              id="full_name"
              value={formData.full_name || ''}
              onChange={(e) => handleChange('full_name', e.target.value)}
              className="focus:border-pink-500 focus:ring-pink-500"
              placeholder="Seu nome completo"
              required
            />
          </div>

          <div>
            <Label htmlFor="business_name">Nome do Negócio *</Label>
            <Input
              id="business_name"
              value={formData.business_name || ''}
              onChange={(e) => handleChange('business_name', e.target.value)}
              className="focus:border-pink-500 focus:ring-pink-500"
              placeholder="Nome da sua empresa/marca"
              required
            />
            {formData.business_name && formData.business_name.length > 0 && formData.business_name.length < 3 && (
              <p className="text-xs text-red-400 mt-1">Nome muito curto (mín. 3 caracteres)</p>
            )}
          </div>
        </div>

        {/* Bio */}
        <div>
          <Label htmlFor="bio">Sua Bio Profissional</Label>
          <Textarea
            id="bio"
            value={formData.bio || ''}
            onChange={(e) => handleChange('bio', e.target.value)}
            className="focus:border-pink-500 focus:ring-pink-500"
            placeholder="Ex: Especialista em unhas de fibra há 5 anos..."
            rows={3}
          />
        </div>

        {/* Contato */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="phone">WhatsApp</Label>
            <Input
              id="phone"
              value={formData.phone || ''}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="focus:border-pink-500 focus:ring-pink-500"
              placeholder="+5511999999999"
            />
            {!validateWhatsApp(formData.phone) && (
              <p className="text-xs text-red-400 mt-1">Formato inválido. Use: +55DDDNumero</p>
            )}
          </div>

          <div>
            <Label htmlFor="instagram">Instagram</Label>
            <Input
              id="instagram"
              value={formData.instagram || ''}
              onChange={(e) => handleChange('instagram', e.target.value)}
              className="focus:border-pink-500 focus:ring-pink-500"
              placeholder="@seuinsta ou URL completa"
            />
            {!validateInstagram(formData.instagram) && (
              <p className="text-xs text-red-400 mt-1">Formato inválido. Use @ ou a URL completa</p>
            )}
          </div>
        </div>
        
        {/* O seletor de tema foi permanentemente removido daqui. */}
      </CardContent>
    </Card>
  );
}