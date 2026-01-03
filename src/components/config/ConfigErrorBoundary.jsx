import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

class ConfigErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      errorId: null
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

    // Log estruturado para monitoramento
    console.error('Config Error Boundary:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    // Enviar para serviço de monitoramento (Sentry, etc.)
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error, {
        tags: {
          component: 'ConfigErrorBoundary',
          section: 'configuracoes'
        },
        extra: {
          errorInfo,
          errorId: this.state.errorId
        }
      });
    }
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null 
    });
  };

  render() {
    if (this.state.hasError) {
      const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';

      return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--primary-bg)' }}>
          <Card className="max-w-md w-full" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <CardTitle className="text-xl" style={{ color: 'var(--text-primary)' }}>
                Erro nas Configurações
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Ocorreu um erro inesperado na seção de configurações. Nossa equipe foi notificada automaticamente.
              </p>
              
              {isDevelopment && this.state.error && (
                <details className="text-left text-xs p-3 rounded" style={{ background: 'var(--secondary-bg)' }}>
                  <summary className="cursor-pointer font-medium mb-2">Detalhes do Erro</summary>
                  <div className="space-y-2">
                    <div>
                      <strong>Erro:</strong> {this.state.error.message}
                    </div>
                    <div>
                      <strong>ID:</strong> {this.state.errorId}
                    </div>
                    <div>
                      <strong>Stack:</strong>
                      <pre className="mt-1 text-xs overflow-auto">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  </div>
                </details>
              )}
              
              <div className="flex flex-col gap-3">
                <Button 
                  onClick={this.handleRetry}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tentar Novamente
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/'}
                >
                  Voltar ao Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ConfigErrorBoundary;