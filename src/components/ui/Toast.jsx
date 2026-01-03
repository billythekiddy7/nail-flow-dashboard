import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { 
      id, 
      ...toast, 
      timestamp: Date.now(),
      duration: toast.duration || 5000 
    };
    
    setToasts(prev => [...prev, newToast]);

    // Auto remove
    setTimeout(() => {
      removeToast(id);
    }, newToast.duration);

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const toast = {
    success: (message, options = {}) => addToast({ 
      type: 'success', 
      message, 
      ...options,
      'aria-live': 'polite'
    }),
    error: (message, options = {}) => addToast({ 
      type: 'error', 
      message, 
      ...options,
      'aria-live': 'assertive'
    }),
    warning: (message, options = {}) => addToast({ 
      type: 'warning', 
      message, 
      ...options,
      'aria-live': 'polite'
    }),
    info: (message, options = {}) => addToast({ 
      type: 'info', 
      message, 
      ...options,
      'aria-live': 'polite'
    }),
  };

  const getToastIcon = (type) => {
    const icons = {
      success: <CheckCircle className="w-5 h-5" />,
      error: <AlertCircle className="w-5 h-5" />,
      warning: <AlertTriangle className="w-5 h-5" />,
      info: <Info className="w-5 h-5" />
    };
    return icons[type];
  };

  const getToastStyles = (type) => {
    const styles = {
      success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400',
      error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400',
      info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400'
    };
    return styles[type] || styles.info;
  };

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      
      {/* Toast Container */}
      <div 
        className="fixed top-4 right-4 z-50 space-y-2"
        role="region"
        aria-label="Notificações"
        aria-live="polite"
      >
        {toasts.map((toastItem) => (
          <div
            key={toastItem.id}
            className={`
              flex items-center gap-3 p-4 rounded-lg border shadow-lg max-w-sm transition-all duration-300
              animate-in slide-in-from-right-full
              ${getToastStyles(toastItem.type)}
            `}
            role="alert"
            aria-live={toastItem['aria-live']}
            aria-describedby={`toast-message-${toastItem.id}`}
          >
            <div className="flex-shrink-0">
              {getToastIcon(toastItem.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <p 
                id={`toast-message-${toastItem.id}`}
                className="text-sm font-medium break-words"
              >
                {toastItem.message}
              </p>
              {toastItem.description && (
                <p className="text-xs mt-1 opacity-90">
                  {toastItem.description}
                </p>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-70 hover:opacity-100"
              onClick={() => removeToast(toastItem.id)}
              aria-label="Fechar notificação"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};