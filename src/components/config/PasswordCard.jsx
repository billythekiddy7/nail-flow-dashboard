import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Lock, Eye, EyeOff, Shield } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { base44 } from '@/api/base44Client'; // MUDANÇA: Import do cliente Base44

export default function PasswordCard() {
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleChange = (field, value) => {
    setPasswords(prev => ({ ...prev, [field]: value }));
  };

  const toggleShowPassword = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const validatePasswords = () => {
    if (!passwords.current) {
      toast.error('Digite sua senha atual');
      return false;
    }
    
    if (passwords.new.length < 8) {
      toast.error('A nova senha deve ter pelo menos 8 caracteres');
      return false;
    }
    
    if (passwords.new !== passwords.confirm) {
      toast.error('As senhas não coincidem');
      return false;
    }
    
    return true;
  };

  // MUDANÇA CRÍTICA: Substituição da lógica de simulação pela chamada real à API
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePasswords()) return;
    
    setLoading(true);
    
    try {
      // ANTES: await new Promise(resolve => setTimeout(resolve, 1000));
      // DEPOIS: Chamada real à função de backend
      const { data, error } = await base44.functions.invoke('updateUserPassword', {
        currentPassword: passwords.current,
        newPassword: passwords.new
      });

      if (error) {
        throw new Error(error.response?.data?.message || 'Erro ao atualizar senha');
      }

      if (!data.success) {
        throw new Error(data.message || 'Erro ao atualizar senha');
      }
      
      toast.success('Senha atualizada com sucesso!', {
        description: 'Sua senha foi alterada. Use-a no próximo login.'
      });
      
      // Limpar os campos após sucesso
      setPasswords({ current: '', new: '', confirm: '' });
      
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      toast.error('Erro ao alterar senha', {
        description: error.message || 'Verifique se a senha atual está correta e tente novamente.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="card-3d" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-orange-500" />
          Alterar Senha
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Senha Atual */}
          <div>
            <Label htmlFor="current_password">Senha Atual *</Label>
            <div className="relative">
              <Input
                id="current_password"
                type={showPasswords.current ? "text" : "password"}
                value={passwords.current}
                onChange={(e) => handleChange('current', e.target.value)}
                className="pr-10 focus:border-orange-500 focus:ring-orange-500"
                placeholder="Digite sua senha atual"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => toggleShowPassword('current')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Nova Senha */}
          <div>
            <Label htmlFor="new_password">Nova Senha *</Label>
            <div className="relative">
              <Input
                id="new_password"
                type={showPasswords.new ? "text" : "password"}
                value={passwords.new}
                onChange={(e) => handleChange('new', e.target.value)}
                className="pr-10 focus:border-orange-500 focus:ring-orange-500"
                placeholder="Digite sua nova senha"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => toggleShowPassword('new')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwords.new && passwords.new.length < 8 && (
              <p className="text-xs text-red-400 mt-1">A senha deve ter pelo menos 8 caracteres</p>
            )}
          </div>

          {/* Confirmar Nova Senha */}
          <div>
            <Label htmlFor="confirm_password">Confirmar Nova Senha *</Label>
            <div className="relative">
              <Input
                id="confirm_password"
                type={showPasswords.confirm ? "text" : "password"}
                value={passwords.confirm}
                onChange={(e) => handleChange('confirm', e.target.value)}
                className="pr-10 focus:border-orange-500 focus:ring-orange-500"
                placeholder="Digite novamente sua nova senha"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => toggleShowPassword('confirm')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwords.confirm && passwords.new !== passwords.confirm && (
              <p className="text-xs text-red-400 mt-1">As senhas não coincidem</p>
            )}
          </div>

          {/* Dicas de Segurança */}
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
            <h4 className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-2">
              Dicas para uma senha forte:
            </h4>
            <ul className="text-xs text-orange-700 dark:text-orange-300 space-y-1">
              <li>• Use pelo menos 8 caracteres</li>
              <li>• Inclua letras maiúsculas e minúsculas</li>
              <li>• Adicione números e símbolos</li>
              <li>• Evite informações pessoais óbvias</li>
            </ul>
          </div>

          {/* Botão de Submissão */}
          <Button
            type="submit"
            disabled={loading || !passwords.current || !passwords.new || !passwords.confirm || passwords.new !== passwords.confirm}
            className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white"
          >
            <Lock className="w-4 h-4 mr-2" />
            {loading ? 'Alterando Senha...' : 'Alterar Senha'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}