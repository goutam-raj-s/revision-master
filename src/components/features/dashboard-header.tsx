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
    <div className={cn("sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-border bg-canvas/80 px-4 shadow-sm backdrop-blur-md md:px-8", className)}>
      <nav aria-label="Breadcrumb" className="flex items-center text-sm font-medium text-mossy-gray">
        {showLogo ? (
          <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity mr-2">
            <div className="h-6 w-6 rounded-lg bg-state-today flex items-center justify-center shrink-0">
              <HeartHandshake className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-forest-slate text-lg tracking-tighter lowercase hidden sm:inline-block">
              lost<span className="text-state-today opacity-80">bae</span>
            </span>
          </Link>
        ) : (
          <Link href="/dashboard" className="flex items-center gap-1 hover:text-forest-slate transition-colors">
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
              <ChevronRight className="h-4 w-4 mx-1 opacity-50" />
              {isLast ? (
                <span className="text-forest-slate font-semibold truncate max-w-[200px] md:max-w-[300px]" title={crumb.label}>
                  {crumb.label}
                </span>
              ) : (
                <Link 
                  href={crumb.href} 
                  className="hover:text-forest-slate transition-colors truncate max-w-[150px]"
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
        <div className="flex items-center gap-3">
          {rightActions}
        </div>
      )}
    </div>
  );
}
