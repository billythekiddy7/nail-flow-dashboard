import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Image as ImageIcon, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { UploadFile } from '@/integrations/Core';

// Função para comprimir imagem
const compressImage = (file, maxWidth = 800, maxHeight = 600, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calcular dimensões mantendo aspect ratio
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Desenhar imagem redimensionada
      ctx.drawImage(img, 0, 0, width, height);
      
      // Converter para blob com compressão
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Falha na compressão da imagem'));
          }
        },
        'image/jpeg',
        quality
      );
    };
    
    img.onerror = () => {
      reject(new Error('Falha ao carregar a imagem'));
    };
    
    img.src = URL.createObjectURL(file);
  });
};

// Validação de arquivo de imagem
const validateImageFile = (file) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB original (será comprimido)
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Tipo de arquivo não permitido. Use JPEG, PNG ou WebP.');
  }
  
  if (file.size > maxSize) {
    throw new Error('Arquivo muito grande. Máximo 10MB.');
  }
  
  return true;
};

// Componente principal
export default function ImageCompressor({ 
  currentImage, 
  onImageUpload, 
  onError, 
  className = "",
  maxWidth = 800,
  maxHeight = 600,
  quality = 0.8 
}) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImage);
  const [uploadStats, setUploadStats] = useState(null);

  const handleFileSelect = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadStats(null);

    try {
      // 1. Validar arquivo
      validateImageFile(file);
      
      const originalSize = file.size;
      
      // 2. Comprimir imagem
      const compressedBlob = await compressImage(file, maxWidth, maxHeight, quality);
      const compressedSize = compressedBlob.size;
      
      // 3. Criar preview local
      const previewUrl = URL.createObjectURL(compressedBlob);
      setPreview(previewUrl);
      
      // 4. Upload para servidor
      const compressedFile = new File([compressedBlob], file.name, {
        type: 'image/jpeg',
        lastModified: Date.now()
      });
      
      const { file_url } = await UploadFile({ file: compressedFile });
      
      // 5. Estatísticas de compressão
      const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
      setUploadStats({
        originalSize: (originalSize / 1024).toFixed(1),
        compressedSize: (compressedSize / 1024).toFixed(1),
        compressionRatio
      });
      
      // 6. Callback de sucesso
      onImageUpload(file_url);
      
    } catch (error) {
      console.error('Erro no upload:', error);
      onError(error.message);
      setPreview(currentImage); // Restaurar preview anterior
    } finally {
      setUploading(false);
      // Limpar input
      event.target.value = '';
    }
  }, [currentImage, onImageUpload, onError, maxWidth, maxHeight, quality]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Preview da imagem */}
      <div className="relative">
        <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-gray-300 bg-gray-100">
          {preview ? (
            <img 
              src={preview} 
              alt="Preview" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-gray-400" />
            </div>
          )}
        </div>
        
        {/* Overlay de loading */}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}
      </div>

      {/* Botão de upload */}
      <div className="text-center">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
          id="image-upload"
        />
        <label htmlFor="image-upload">
          <Button
            as="span"
            variant="outline"
            disabled={uploading}
            className="cursor-pointer"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Comprimindo...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Selecionar Imagem
              </>
            )}
          </Button>
        </label>
      </div>

      {/* Estatísticas de compressão */}
      {uploadStats && (
        <div className="p-3 rounded-lg bg-green-50 border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium text-green-800">
              Imagem otimizada com sucesso!
            </span>
          </div>
          <div className="text-xs text-green-700 space-y-1">
            <p>Tamanho original: {uploadStats.originalSize} KB</p>
            <p>Tamanho final: {uploadStats.compressedSize} KB</p>
            <p>Economia: {uploadStats.compressionRatio}%</p>
          </div>
        </div>
      )}

      {/* Informações de ajuda */}
      <div className="text-xs text-gray-500 text-center space-y-1">
        <p>Formatos aceitos: JPEG, PNG, WebP</p>
        <p>Tamanho máximo: 10MB (será comprimido automaticamente)</p>
        <p>Resolução recomendada: 800x600 pixels</p>
      </div>
    </div>
  );
}