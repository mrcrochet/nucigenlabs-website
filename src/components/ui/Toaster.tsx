/**
 * Toaster Component
 * 
 * Provides toast notifications using sonner
 */

import { Toaster as SonnerToaster } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        style: {
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#fff',
        },
        className: 'font-light',
      }}
    />
  );
}
