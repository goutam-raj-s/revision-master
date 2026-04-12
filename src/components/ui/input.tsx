import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-forest-slate placeholder:text-mossy-gray/60 shadow-card",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-state-today/50 focus-visible:border-state-today/40",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "transition-all duration-200",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
