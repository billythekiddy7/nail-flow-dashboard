import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Mail, Clock, ArrowRight } from 'lucide-react';

export default function ObrigadoPage() {
  // O container <div className="dark"> e a tag <style> foram removidos
  // pois a página agora está dentro do MainLayout que já provê o tema.
  return (
    <div className="flex items-center justify-center min-h-screen p-4" style={{ background: 'var(--primary-bg)' }}>
      <div className="w-full max-w-2xl mx-auto animate-in fade-in-0 duration-500">
        <Card className="card-3d text-center" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
          <CardHeader className="pt-8">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <CardTitle className="text-3xl font-bold gradient-text">
              Pagamento Confirmado!
            </CardTitle>
            <p className="text-lg pt-2" style={{ color: 'var(--text-secondary)' }}>
              Sua jornada para uma gestão de sucesso começa agora.
            </p>
          </CardHeader>
          <CardContent className="p-6 md:p-8 space-y-8">
            <div className="text-left space-y-6">
              <h3 className="text-xl font-semibold text-center" style={{ color: 'var(--text-primary)' }}>O que acontece agora?</h3>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold" style={{ color: 'var(--text-primary)' }}>1. Ativação da Conta</h4>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    Nosso sistema já recebeu a confirmação e está liberando seu acesso. Isso geralmente leva apenas alguns instantes.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold" style={{ color: 'var(--text-primary)' }}>2. E-mail de Boas-Vindas</h4>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    Você receberá um e-mail com as instruções e o link para acessar sua nova plataforma de gestão. Verifique sua caixa de entrada e spam.
                  </p>
                </div>
              </div>
            </div>
            <Button asChild size="lg" className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg">
              <Link to={createPageUrl("AcessoPainel")}>
                Ir para a Página de Login
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}