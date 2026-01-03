import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, User } from 'lucide-react';
import { UploadFile } from '@/integrations/Core';
import { useToast } from '@/components/ui/Toast';

export default function UploadLogoButton({ currentImage, onUploadSuccess }) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione um arquivo de imagem');
      return;
    }

    // Validar tamanho (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo 5MB');
      return;
    }

    try {
      setUploading(true);
      const { file_url } = await UploadFile({ file });
      onUploadSuccess(file_url);
      toast.success('Logo atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao fazer upload da imagem');
    }
    setUploading(false);
  };

  return (
    <div className="flex items-center gap-4">
      {/* Preview da imagem */}
      <div className="w-18 h-18 rounded-full overflow-hidden border-2 border-pink-500 bg-gradient-to-br from-pink-500 to-purple-600">
        {currentImage ? (
          <img 
            src={currentImage} 
            alt="Logo atual" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
        )}
      </div>

      {/* Botão de upload */}
      <div>
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="bg-transparent border-pink-500 text-pink-500 hover:bg-pink-500/10"
        >
          <Upload className="w-4 h-4 mr-2" />
          {uploading ? 'Enviando...' : 'Alterar Logo'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <p className="text-xs text-gray-400 mt-1">
          JPG, PNG até 5MB
        </p>
      </div>
    </div>
  );
}