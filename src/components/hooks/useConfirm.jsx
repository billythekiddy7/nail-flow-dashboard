import { useState } from 'react';

export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState({
    title: '',
    description: '',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    variant: 'warning'
  });
  const [resolvePromise, setResolvePromise] = useState(null);

  const confirm = (options) => {
    return new Promise((resolve) => {
      setConfig({
        title: options.title || 'Confirmar Ação',
        description: options.description || 'Tem certeza que deseja continuar?',
        confirmText: options.confirmText || 'Confirmar',
        cancelText: options.cancelText || 'Cancelar',
        variant: options.variant || 'warning'
      });
      setResolvePromise(() => resolve);
      setIsOpen(true);
    });
  };

  const onConfirm = () => {
    if (resolvePromise) {
      resolvePromise(true);
    }
    setIsOpen(false);
    setResolvePromise(null);
  };

  const onCancel = () => {
    if (resolvePromise) {
      resolvePromise(false);
    }
    setIsOpen(false);
    setResolvePromise(null);
  };

  return {
    confirm,
    isOpen,
    config,
    onConfirm,
    onCancel
  };
}