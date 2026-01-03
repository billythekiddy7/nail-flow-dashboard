import React from 'react';
import { TrendingDown, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

class FinanceErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { 
      hasError: true,
      errorId: Math.random().toString(36).substr(2, 9)
    };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log estruturado específico para erros financeiros
    console.error('Finance Error Boundary:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      retryCount: this.state.retryCount,
      timestamp: new Date().toISOString(),
      section: 'financeiro',
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    // Enviar para monitoramento com contexto financeiro
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error, {
        tags: {
          component: 'FinanceErrorBoundary',
          section: 'financeiro',
          severity: 'high' // Erros financeiros são críticos
        },
        extra: {
          errorInfo,
          errorId: this.state.errorId,
          retryCount: this.state.retryCount
        }
      });
    }
  }

  handleRetry = () => {
    const newRetryCount = this.state.retryCount + 1;
    
    // Limitar tentativas automáticas
    if (newRetryCount > 3) {
      console.warn('Máximo de tentativas atingido para Finance Error Boundary');
      return;
    }

    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null,
      retryCount: newRetryCount
    });
  };

  render() {
    if (this.state.hasError) {
      const canRetry = this.state.retryCount < 3;
      const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';

      return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--primary-bg)' }}>
          <Card className="max-w-lg w-full" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <TrendingDown className="w-8 h-8 text-red-500" />
              </div>
              <CardTitle className="text-xl" style={{ color: 'var(--text-primary)' }}>
                Erro no Sistema Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Ocorreu um erro ao carregar os dados financeiros. Seus dados estão seguros e nossa equipe foi notificada.
              </p>

              {this.state.retryCount > 0 && (
                <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    Tentativa {this.state.retryCount} de 3
                  </p>
                </div>
              )}
              
              {isDevelopment && this.state.error && (
                <details className="text-left text-xs p-3 rounded" style={{ background: 'var(--secondary-bg)' }}>
                  <summary className="cursor-pointer font-medium mb-2">Detalhes Técnicos</summary>
                  <div className="space-y-2">
                    <div>
                      <strong>Erro:</strong> {this.state.error.message}
                    </div>
                    <div>
                      <strong>ID de Rastreamento:</strong> {this.state.errorId}
                    </div>
                    <div>
                      <strong>Timestamp:</strong> {new Date().toLocaleString()}
                    </div>
                  </div>
                </details>
              )}
              
              <div className="flex flex-col gap-3">
                {canRetry && (
                  <Button 
                    onClick={this.handleRetry}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Tentar Novamente ({3 - this.state.retryCount} restantes)
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/'}
                >
                  <Home className="w-4 h-4 mr-2" />
                  Voltar ao Dashboard
                </Button>

                {!canRetry && (
                  <Button 
                    variant="outline"
                    onClick={() => window.location.reload()}
                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Recarregar Página
                  </Button>
                )}
              </div>

              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                <p>ID do Erro: {this.state.errorId}</p>
                <p>Se o problema persistir, entre em contato com o suporte.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default FinanceErrorBoundary;