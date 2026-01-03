/**
 * PÁGINA DE LOGIN - Portão de Entrada
 * @description Autenticação real via Base44 SDK nativo
 * @version 2.0.0 - Arquitetura Real de Autenticação
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';
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
            // AUTENTICAÇÃO REAL: Usando SDK nativo da Base44
            await base44.auth.signInWithPassword({ 
                email: email.toLowerCase().trim(), 
                password 
            });

            // Obter dados do usuário autenticado
            const user = await base44.auth.me();

            if (!user) {
                throw new Error('Não foi possível obter dados do usuário.');
            }

            // Verificar status da conta (integração com Webhook Veksell)
            if (user.account_status === 'pending_payment') {
                throw new Error('Sua conta aguarda confirmação de pagamento. Verifique seu email.');
            }

            if (user.account_status === 'inactive') {
                throw new Error('Sua conta está inativa. Entre em contato com o suporte.');
            }

            if (user.account_status !== 'active') {
                throw new Error('Conta não autorizada. Verifique seu status de assinatura.');
            }
            
            toast.success('Login realizado com sucesso!', {
                description: `Bem-vinda, ${user.full_name || user.email}!`
            });

            // Redireciona para o dashboard
            setTimeout(() => {
                navigate(createPageUrl('Dashboard'));
            }, 300);

        } catch (err) {
            console.error('[LOGIN] Erro:', err);
            
            // Mensagens de erro amigáveis
            let errorMessage = err.message || 'Erro ao tentar fazer login.';
            
            if (errorMessage.includes('Invalid login credentials')) {
                errorMessage = 'Email ou senha incorretos.';
            } else if (errorMessage.includes('Email not confirmed')) {
                errorMessage = 'Confirme seu email antes de fazer login. Verifique sua caixa de entrada.';
            }
            
            toast.error('Falha no Login', {
                description: errorMessage
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