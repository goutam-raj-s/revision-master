"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardHeader() {
  const pathname = usePathname();

  // Generate breadcrumbs from pathname
  const segments = pathname.split("/").filter(Boolean);
  
  const breadcrumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    // Format segment: capitalize, replace dashes with spaces, handle special IDs
    let label = segment.replace(/-/g, " ");
    label = label.charAt(0).toUpperCase() + label.slice(1);
    
    // Quick heuristic: If it looks like an ID (long alphanumeric), maybe we truncate or label it generically
    if (segment.length > 20 && !segment.includes(" ")) {
      label = "Detail";
    }

    return { href, label };
  });

  return (
    <div className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-canvas/80 px-4 shadow-sm backdrop-blur-md md:px-8">
      <nav aria-label="Breadcrumb" className="flex items-center text-sm font-medium text-mossy-gray">
        <Link href="/dashboard" className="flex items-center gap-1 hover:text-forest-slate transition-colors">
          <Home className="h-4 w-4" />
        </Link>
        
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          
          // Don't show "Dashboard" crumb if we are already on the dashboard root
          if (crumb.label === "Dashboard" && breadcrumbs.length === 1) return null;
          
          return (
            <React.Fragment key={crumb.href}>
              <ChevronRight className="h-4 w-4 mx-1 opacity-50" />
              {isLast ? (
                <span className="text-forest-slate font-semibold truncate max-w-[200px] md:max-w-[300px]">
                  {crumb.label}
                </span>
              ) : (
                <Link 
                  href={crumb.href} 
                  className="hover:text-forest-slate transition-colors truncate max-w-[150px]"
                >
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </nav>
    </div>
  );
}
