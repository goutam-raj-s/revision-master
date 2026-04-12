"use client";

import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const ToastProvider = ToastPrimitive.Provider;
const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      "fixed bottom-4 right-4 z-[100] flex max-h-screen w-full max-w-[360px] flex-col gap-2",
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitive.Viewport.displayName;

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root> & {
    variant?: "default" | "success" | "error";
  }
>(({ className, variant = "default", ...props }, ref) => (
  <ToastPrimitive.Root
    ref={ref}
    className={cn(
      "group pointer-events-auto relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-2xl border p-4 pr-8 shadow-hover",
      "data-[state=open]:animate-slide-up data-[state=closed]:animate-fade-in",
      "transition-all duration-300",
      variant === "success" && "border-state-today/20 bg-state-today/5 text-state-today",
      variant === "error" && "border-destructive/20 bg-destructive/5 text-destructive",
      variant === "default" && "border-border bg-surface text-forest-slate",
      className
    )}
    {...props}
  />
));
Toast.displayName = ToastPrimitive.Root.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100",
      "focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-state-today/50",
      className
    )}
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitive.Close>
));
ToastClose.displayName = ToastPrimitive.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Title
    ref={ref}
    className={cn("text-sm font-medium", className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitive.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Description
    ref={ref}
    className={cn("text-xs opacity-80", className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitive.Description.displayName;

export { ToastProvider, ToastViewport, Toast, ToastClose, ToastTitle, ToastDescription };

// ─── Toast hook ────────────────────────────────────────────────────────────────
type ToastItem = {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "success" | "error";
};

type ToastStore = {
  toasts: ToastItem[];
  add: (toast: Omit<ToastItem, "id">) => void;
  remove: (id: string) => void;
};

let listeners: ((state: ToastItem[]) => void)[] = [];
let toasts: ToastItem[] = [];

function emitChange() {
  for (const listener of listeners) listener(toasts);
}

export const toastStore = {
  add(toast: Omit<ToastItem, "id">) {
    const id = Math.random().toString(36).slice(2);
    toasts = [...toasts, { ...toast, id }];
    emitChange();
    setTimeout(() => toastStore.remove(id), 4000);
  },
  remove(id: string) {
    toasts = toasts.filter((t) => t.id !== id);
    emitChange();
  },
  subscribe(listener: (state: ToastItem[]) => void) {
    listeners = [...listeners, listener];
    return () => { listeners = listeners.filter((l) => l !== listener); };
  },
};

export function toast(title: string, opts?: { description?: string; variant?: "default" | "success" | "error" }) {
  toastStore.add({ title, ...opts });
}

// ─── Toast container component ─────────────────────────────────────────────────
export function Toaster() {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  React.useEffect(() => {
    return toastStore.subscribe(setItems);
  }, []);

  return (
    <ToastProvider>
      {items.map((item) => (
        <Toast key={item.id} variant={item.variant} open>
          <div className="flex items-start gap-2">
            {item.variant === "success" && <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />}
            {item.variant === "error" && <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />}
            {(!item.variant || item.variant === "default") && <Info className="h-4 w-4 mt-0.5 shrink-0 text-mossy-gray" />}
            <div>
              <ToastTitle>{item.title}</ToastTitle>
              {item.description && <ToastDescription>{item.description}</ToastDescription>}
            </div>
          </div>
          <ToastClose onClick={() => toastStore.remove(item.id)} />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}
