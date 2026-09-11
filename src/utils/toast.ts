import { useState, useCallback, useRef } from 'react';
import { ToastMessage, ToastType } from '../types';

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const counterRef = useRef(0);

  const showToast = useCallback((
    title: string,
    type: ToastType = 'info',
    message?: string,
    duration: number = 4000
  ) => {
    const id = `toast_${Date.now()}_${counterRef.current++}`;
    const newToast: ToastMessage = { id, type, title, message, duration };
    
    setToasts(prev => [...prev, newToast]);
    
    if (duration > 0) {
      setTimeout(() => {
        dismissToast(id);
      }, duration);
    }
    
    return id;
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, showToast, dismissToast };
}
