'use client';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { createContext, useCallback, useContext, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastMessage = {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'danger' | 'warning';
};

type ToastContextValue = {
  toast: (msg: Omit<ToastMessage, 'id'>) => void;
};

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastMessage[]>([]);
  const toast = useCallback((msg: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setItems((prev) => [...prev, { ...msg, id }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }, 4500);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        {items.map((t) => (
          <ToastPrimitive.Root
            key={t.id}
            className={cn(
              'group pointer-events-auto relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-md border p-4 pr-6 shadow-lg',
              'animate-fade-in',
              t.variant === 'success' && 'border-success/40 bg-success/10 text-foreground',
              t.variant === 'danger' && 'border-danger/40 bg-danger/10 text-foreground',
              t.variant === 'warning' && 'border-warning/40 bg-warning/10 text-foreground',
              (!t.variant || t.variant === 'default') && 'border-border bg-surface text-foreground'
            )}
          >
            <div className="flex flex-col gap-0.5">
              <ToastPrimitive.Title className="text-sm font-semibold">{t.title}</ToastPrimitive.Title>
              {t.description && (
                <ToastPrimitive.Description className="text-xs text-muted-foreground">
                  {t.description}
                </ToastPrimitive.Description>
              )}
            </div>
            <ToastPrimitive.Close className="absolute right-2 top-2 rounded p-1 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

export function ToastViewport() {
  return (
    <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 outline-none" />
  );
}
