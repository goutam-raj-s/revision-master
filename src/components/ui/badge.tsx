import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-state-today/10 text-state-today border border-state-today/20",
        today: "bg-state-today/10 text-state-today border border-state-today/20",
        upcoming: "bg-state-upcoming/10 text-state-upcoming border border-state-upcoming/20",
        stale: "bg-state-stale/10 text-state-stale border border-state-stale/20",
        completed: "bg-state-completed/10 text-state-completed border border-state-completed/20",
        tag: "bg-canvas text-mossy-gray border border-border hover:border-state-today/30 cursor-pointer",
        easy: "bg-state-today/10 text-state-today border border-state-today/20",
        medium: "bg-state-stale/10 text-state-stale border border-state-stale/20",
        hard: "bg-destructive/10 text-destructive border border-destructive/20",
        outline: "border border-border text-mossy-gray",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
