"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, HeartHandshake } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardHeader({
  customBreadcrumbs,
  rightActions,
  showLogo = true,
  className,
}: {
  customBreadcrumbs?: { href: string; label: string }[];
  rightActions?: React.ReactNode;
  showLogo?: boolean;
  className?: string;
} = {}) {
  const pathname = usePathname();

  // Generate breadcrumbs from pathname if not provided
  const breadcrumbs = customBreadcrumbs || (() => {
    const segments = pathname.split("/").filter(Boolean);
    return segments.map((segment, index) => {
      const href = "/" + segments.slice(0, index + 1).join("/");
      let label = segment.replace(/-/g, " ");
      label = label.charAt(0).toUpperCase() + label.slice(1);
      
      if (segment.length > 20 && !segment.includes(" ")) {
        label = "Detail";
      }

      return { href, label };
    });
  })();

  return (
    <div className={cn("sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between gap-2 overflow-hidden border-b border-border bg-canvas/80 py-0 pl-14 pr-3 shadow-sm backdrop-blur-md sm:px-4 md:px-8", className)}>
      <nav aria-label="Breadcrumb" className="flex min-w-0 flex-1 items-center overflow-hidden text-sm font-medium text-mossy-gray">
        {showLogo ? (
          <Link href="/dashboard" className="mr-1 flex shrink-0 items-center gap-2 transition-opacity hover:opacity-80 sm:mr-2">
            <div className="h-6 w-6 rounded-lg bg-state-today flex items-center justify-center shrink-0">
              <HeartHandshake className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-forest-slate text-lg tracking-tighter lowercase hidden sm:inline-block">
              lost<span className="text-state-today opacity-80">bae</span>
            </span>
          </Link>
        ) : (
          <Link href="/dashboard" className="flex shrink-0 items-center gap-1 transition-colors hover:text-forest-slate">
            <div className="h-6 w-6 rounded-lg bg-state-today flex items-center justify-center shrink-0">
              <HeartHandshake className="h-3.5 w-3.5 text-white" />
            </div>
          </Link>
        )}
        
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          
          if (crumb.label === "Dashboard" && breadcrumbs.length === 1) return null;
          
          return (
            <React.Fragment key={crumb.href + index}>
              <ChevronRight className={cn("mx-1 h-4 w-4 shrink-0 opacity-50", !isLast && "hidden sm:block")} />
              {isLast ? (
                <span className="min-w-0 flex-1 truncate font-semibold text-forest-slate sm:max-w-[240px] md:max-w-[340px] lg:max-w-[520px]" title={crumb.label}>
                  {crumb.label}
                </span>
              ) : (
                <Link 
                  href={crumb.href} 
                  className="hidden max-w-[150px] truncate transition-colors hover:text-forest-slate sm:inline-block"
                  title={crumb.label}
                >
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </nav>

      {rightActions && (
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {rightActions}
        </div>
      )}
    </div>
  );
}
