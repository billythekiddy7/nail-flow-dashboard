import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Link as LinkIcon, Copy, ExternalLink, Lock } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function PublicPageCard({ userData, onChange }) {
  const [formData, setFormData] = useState(userData || {});
  const { toast } = useToast();

  const handleChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onChange(newData);
  };

  const slugify = (text) => {
    return text.
    toLowerCase().
    normalize('NFD').
    replace(/[\u0300-\u036f]/g, '').
    replace(/[^a-z0-9\s-]/g, '').
    trim().
    replace(/\s+/g, '-').
    replace(/-+/g, '-');
  };

  const validateSlug = (slug) => {
    const slugRegex = /^[a-z0-9-]{3,}$/;
    return slugRegex.test(slug);
  };

  const handleSlugChange = (value) => {
    const cleanSlug = slugify(value);
    handleChange('public_slug', cleanSlug);
  };

  const publicUrl = formData.public_slug ? `https://nailpro.app/${formData.public_slug}` : '';

  const copyLink = () => {
    if (publicUrl) {
      navigator.clipboard.writeText(publicUrl);
      toast.success('Link copiado para a área de transferência!');
    }
  };

  return (
    <Card className="card-3d relative overflow-hidden" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
      {/* Overlay de bloqueio */}
      <div className="absolute inset-0 z-10 backdrop-blur-sm bg-black/50 flex flex-col items-center justify-center rounded-xl">
        <div className="bg-gray-800/90 p-6 rounded-xl text-center max-w-xs">
          <div className="w-14 h-14 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-white font-bold text-lg mb-2">Em Breve!</h3>
          <p className="text-gray-300 text-sm">
            Esta funcionalidade estará disponível na próxima atualização.
          </p>
        </div>
      </div>
      
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="w-5 h-5 text-blue-500" />
          Página Pública
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* URL Slug */}
        <div>
          <Label htmlFor="public_slug">URL da sua página *</Label>
          <div className="flex items-center mt-2">
            <span className="text-sm px-3 py-2 rounded-l-md border border-r-0 bg-neutral-800 text-gray-400 border-neutral-700">nailflow.com.br/app/



            </span>
            <Input
              id="public_slug"
              value={formData.public_slug || ''}
              onChange={(e) => handleSlugChange(e.target.value)}
              className="rounded-l-none focus:border-pink-500 focus:ring-pink-500"
              placeholder="seu-nome-profissional" />

          </div>
          {formData.public_slug && !validateSlug(formData.public_slug) &&
          <p className="text-xs text-red-400 mt-1">
              Apenas letras minúsculas, números e hífens (mín. 3 caracteres)
            </p>
          }
        </div>

        {/* Preview da URL */}
        {publicUrl && validateSlug(formData.public_slug) &&
        <div className="p-4 rounded-lg bg-gradient-to-r from-pink-500/10 to-purple-600/10 border border-pink-500/20">
            <h4 className="font-medium text-white mb-2">Preview da sua página:</h4>
            <div className="flex items-center justify-between bg-neutral-900 rounded-lg p-3">
              <code className="text-green-400 text-sm break-all">
                {publicUrl}
              </code>
              <div className="flex gap-2 ml-3">
                <Button size="sm" variant="ghost" onClick={copyLink}>
                  <Copy className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" asChild>
                  <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Suas clientes poderão agendar diretamente por este link
            </p>
          </div>
        }
      </CardContent>
    </Card>);

}