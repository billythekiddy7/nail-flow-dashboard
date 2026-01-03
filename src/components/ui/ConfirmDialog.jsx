import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle } from
'@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import GradientButton from './GradientButton';

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "warning"
}) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onCancel}>
      <AlertDialogContent className="bg-neutral-900 border-pink-600">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold text-neutral-300">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-neutral-300">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline" onClick={onCancel} className="bg-background text-slate-950 mt-2 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input hover:bg-accent hover:text-accent-foreground h-10 sm:mt-0">
              {cancelText}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <GradientButton onClick={onConfirm} variant={variant}>
              {confirmText}
            </GradientButton>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>);

}