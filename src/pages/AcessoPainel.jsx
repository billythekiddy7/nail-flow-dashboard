import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authService } from '@/functions/authService'; // MUDANÇA: Nova função de autenticação
import { useToast } from '@/components/ui/Toast';

export default function AcessoPainelPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // MUDANÇA CRÍTICA: Chamando authService em vez de authValidate
            const { data: response, error } = await authService({ email, password });

            if (error || !response.success) {
                throw new Error(response?.message || error?.message || 'Erro ao tentar fazer login.');
            }

            // Armazena o token e os dados do usuário para gerenciar a sessão
            localStorage.setItem('authToken', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            
            toast.success('Login realizado com sucesso!', {
                description: 'Redirecionando para o seu dashboard...'
            });

            // Redireciona para o dashboard
            setTimeout(() => {
                navigate(createPageUrl('Dashboard'));
            }, 500);

        } catch (err) {
            toast.error('Falha no Login', {
                description: err.message
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4" style={{ background: 'var(--primary-bg)' }}>
            <div className="w-full max-w-md mx-auto">
                <Card className="card-3d" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                    <CardHeader className="text-center">
                        <img
                            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/274fa6f49_ChatGPTImageJun202509_16_52PM.png"
                            alt="Nail Flow Logo"
                            className="w-16 h-16 rounded-xl mx-auto mb-4 neon-glow"
                        />
                        <CardTitle className="text-2xl font-bold gradient-text">Acessar Painel</CardTitle>
                        <CardDescription style={{ color: 'var(--text-secondary)' }}>
                            Use suas credenciais para entrar no sistema.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="email" style={{ color: 'var(--text-primary)' }}>Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="seu@email.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="bg-transparent"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password" style={{ color: 'var(--text-primary)' }}>Senha</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Sua senha"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-transparent"
                                />
                            </div>
                            <Button 
                                type="submit" 
                                disabled={loading} 
                                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg"
                            >
                                {loading ? 'Verificando...' : 'Entrar'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}