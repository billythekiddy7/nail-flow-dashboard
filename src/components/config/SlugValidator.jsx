import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { User } from '@/entities/User';

// Debounce personalizado para validação
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Componente de validação de slug em tempo real
export default function SlugValidator({ value, onChange, error, currentUserSlug }) {
  const [validationState, setValidationState] = useState('idle'); // idle, checking, valid, invalid
  const [validationMessage, setValidationMessage] = useState('');
  const debouncedSlug = useDebounce(value, 500); // 500ms de debounce

  // Função para normalizar slug
  const normalizeSlug = (input) => {
    return input
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-') // Substituir caracteres especiais por hífen
      .replace(/-+/g, '-') // Remover hífens consecutivos
      .replace(/^-|-$/g, ''); // Remover hífens do início e fim
  };

  // Validação de slug único
  const validateSlugUnique = useCallback(async (slug) => {
    if (!slug || slug.length < 3) {
      setValidationState('invalid');
      setValidationMessage('Slug deve ter pelo menos 3 caracteres');
      return false;
    }

    // Se é o slug atual do usuário, é válido
    if (slug === currentUserSlug) {
      setValidationState('valid');
      setValidationMessage('Este é seu slug atual');
      return true;
    }

    setValidationState('checking');
    setValidationMessage('Verificando disponibilidade...');

    try {
      // Simular verificação de unicidade
      // Em implementação real, seria uma chamada à API
      const response = await fetch(`/api/validate-slug?slug=${encodeURIComponent(slug)}`);
      
      if (response.ok) {
        const { available } = await response.json();
        
        if (available) {
          setValidationState('valid');
          setValidationMessage('Slug disponível!');
          return true;
        } else {
          setValidationState('invalid');
          setValidationMessage('Este slug já está em uso');
          return false;
        }
      } else {
        throw new Error('Erro na validação');
      }
    } catch (error) {
      console.error('Erro ao validar slug:', error);
      setValidationState('invalid');
      setValidationMessage('Erro na validação. Tente novamente.');
      return false;
    }
  }, [currentUserSlug]);

  // Efeito para validar quando o slug muda
  useEffect(() => {
    if (debouncedSlug) {
      validateSlugUnique(debouncedSlug);
    } else {
      setValidationState('idle');
      setValidationMessage('');
    }
  }, [debouncedSlug, validateSlugUnique]);

  // Handler para mudança de input
  const handleInputChange = (e) => {
    const rawValue = e.target.value;
    const normalizedValue = normalizeSlug(rawValue);
    onChange(normalizedValue);
  };

  // Ícone de status
  const getStatusIcon = () => {
    switch (validationState) {
      case 'checking':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'valid':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'invalid':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  // Cor da borda baseada no estado
  const getBorderColor = () => {
    if (error) return 'border-red-500';
    
    switch (validationState) {
      case 'valid':
        return 'border-green-500';
      case 'invalid':
        return 'border-red-500';
      case 'checking':
        return 'border-blue-500';
      default:
        return 'border-gray-300';
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="slug" className="text-white">
        URL da Sua Página *
      </Label>
      
      <div className="relative">
        <div className="flex">
          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
            nailflow.app/
          </span>
          <Input
            id="slug"
            type="text"
            value={value}
            onChange={handleInputChange}
            placeholder="seu-nome"
            className={`rounded-l-none pr-10 ${getBorderColor()}`}
            style={{ background: '#1a1a1a', color: 'white', borderColor: 'var(--border)' }}
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {getStatusIcon()}
          </div>
        </div>
      </div>

      {/* Mensagens de validação */}
      {validationMessage && (
        <p className={`text-sm ${
          validationState === 'valid' ? 'text-green-500' : 
          validationState === 'invalid' ? 'text-red-500' : 
          'text-blue-500'
        }`}>
          {validationMessage}
        </p>
      )}

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {/* Preview da URL */}
      {value && validationState === 'valid' && (
        <div className="p-3 rounded-lg bg-green-50 border border-green-200">
          <p className="text-sm text-green-800">
            <strong>Sua página ficará disponível em:</strong>
            <br />
            <code className="bg-green-100 px-2 py-1 rounded text-xs">
              https://nailflow.app/{value}
            </code>
          </p>
        </div>
      )}

      {/* Dicas */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• Use apenas letras, números e hífens</p>
        <p>• Mínimo de 3 caracteres</p>
        <p>• Será convertido automaticamente para minúsculas</p>
      </div>
    </div>
  );
}