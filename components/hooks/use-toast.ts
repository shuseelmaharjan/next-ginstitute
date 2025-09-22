"use client";

import * as React from "react";

interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
}

interface ToastContextType {
  toasts: Toast[];
  toast: (toast: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextType | null>(null);

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

// Simple toast state management
let toastState: Toast[] = [];
let listeners: Array<(toasts: Toast[]) => void> = [];

function notifyListeners() {
  listeners.forEach(listener => listener([...toastState]));
}

export function toast({ title, description, variant = "default" }: Omit<Toast, "id">) {
  const id = Math.random().toString(36).substr(2, 9);
  const newToast: Toast = { id, title, description, variant };
  
  toastState = [...toastState, newToast];
  notifyListeners();

  // Auto dismiss after 5 seconds
  setTimeout(() => {
    dismiss(id);
  }, 5000);
}

export function dismiss(id: string) {
  toastState = toastState.filter((t) => t.id !== id);
  notifyListeners();
}

export function useToastState() {
  const [toasts, setToasts] = React.useState<Toast[]>(toastState);

  React.useEffect(() => {
    listeners.push(setToasts);
    return () => {
      listeners = listeners.filter(l => l !== setToasts);
    };
  }, []);

  return { toasts, dismiss };
}