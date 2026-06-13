"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  BookText,
  Settings,
  LogOut,
  Menu,
  X,
  HeartHandshake,
  Tag,
  ChevronRight,
  CirclePlay,
  Film,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/actions/auth";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import type { User } from "@/types";

interface SidebarProps {
  user: User;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/documents", label: "Documents", icon: BookOpen },
  { href: "/study/youtube", label: "YouTube", icon: CirclePlay },
  { href: "/video", label: "Video", icon: Film },
  { href: "/terminology", label: "Terminology", icon: BookText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = React.useState(false);

  React.useEffect(() => {
    setDesktopCollapsed(window.localStorage.getItem("lostbae_sidebar_collapsed") === "1");
  }, []);

  React.useEffect(() => {
    window.localStorage.setItem("lostbae_sidebar_collapsed", desktopCollapsed ? "1" : "0");
  }, [desktopCollapsed]);

  const NavContent = ({ collapsed = false }: { collapsed?: boolean }) => (
    <>
      {/* Logo */}
      <div className={cn("flex items-center border-b border-border", collapsed ? "justify-center px-2 py-4" : "gap-2 px-4 py-5")}>
      <Link href="/dashboard" className={cn("flex min-w-0 items-center gap-2 transition-opacity hover:opacity-80", collapsed && "justify-center")}>
        <div className="h-7 w-7 rounded-xl bg-state-today flex items-center justify-center shrink-0">
          <HeartHandshake className="h-4 w-4 text-white" />
        </div>
        <span className={cn("font-bold text-forest-slate text-xl tracking-tighter lowercase", collapsed && "sr-only")}>
          lost<span className="text-state-today opacity-80">bae</span>
        </span>
      </Link>
      </div>

      {/* Nav */}
      <nav className={cn("flex-1 space-y-0.5", collapsed ? "p-2" : "p-3")} aria-label="Main navigation">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center rounded-xl py-2 text-sm font-medium transition-all duration-200",
                collapsed ? "justify-center px-2" : "gap-3 px-3",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-state-today/50",
                active
                  ? "bg-state-today/10 text-state-today"
                  : "text-mossy-gray hover:text-forest-slate hover:bg-canvas"
              )}
              aria-current={active ? "page" : undefined}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className={cn("h-4 w-4 shrink-0", active ? "text-state-today" : "text-mossy-gray")} />
              <span className={cn(collapsed && "sr-only")}>{item.label}</span>
              {active && !collapsed && <ChevronRight className="ml-auto h-3 w-3 text-state-today/60" />}
            </Link>
          );
        })}

        {user.role === "admin" && (
          <Link
            href="/admin"
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center rounded-xl py-2 text-sm font-medium transition-all duration-200",
              collapsed ? "justify-center px-2" : "gap-3 px-3",
              pathname.startsWith("/admin")
                ? "bg-state-today/10 text-state-today"
                : "text-mossy-gray hover:text-forest-slate hover:bg-canvas"
            )}
            title={collapsed ? "Admin" : undefined}
          >
            <Tag className="h-4 w-4 shrink-0" />
            <span className={cn(collapsed && "sr-only")}>Admin</span>
          </Link>
        )}
      </nav>

      {/* User */}
      <div className={cn("border-t border-border", collapsed ? "p-2" : "p-3")}>
        <div className={cn("mb-1 flex", collapsed ? "justify-center" : "px-1")}>
          <ThemeToggle showLabel={!collapsed} />
        </div>
        <button
          type="button"
          onClick={() => setDesktopCollapsed((current) => !current)}
          className={cn(
            "mb-2 hidden w-full items-center rounded-xl py-2 text-sm text-mossy-gray transition-colors hover:bg-canvas hover:text-forest-slate md:flex",
            collapsed ? "justify-center px-2" : "gap-3 px-3"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          <span className={cn(collapsed && "sr-only")}>{collapsed ? "Expand" : "Collapse"}</span>
        </button>
        <div className={cn("flex items-center rounded-xl py-2 mb-1", collapsed ? "justify-center px-2" : "gap-3 px-3")}>
          <div className="h-7 w-7 rounded-full bg-state-today/20 flex items-center justify-center text-xs font-semibold text-state-today shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className={cn("flex-1 min-w-0", collapsed && "sr-only")}>
            <div className="text-sm font-medium text-forest-slate truncate">{user.name}</div>
            <div className="text-xs text-mossy-gray truncate">{user.email}</div>
          </div>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className={cn(
              "flex w-full items-center rounded-xl py-2 text-sm text-mossy-gray hover:text-destructive hover:bg-destructive/5 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-state-today/50",
              collapsed ? "justify-center px-2" : "gap-3 px-3"
            )}
            title={collapsed ? "Sign out" : undefined}
          >
            <LogOut className="h-4 w-4" />
            <span className={cn(collapsed && "sr-only")}>Sign out</span>
          </button>
        </form>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={cn("hidden md:flex flex-col shrink-0 border-r border-border bg-surface h-screen sticky top-0 transition-[width] duration-200", desktopCollapsed ? "w-16" : "w-56")}>
        <NavContent collapsed={desktopCollapsed} />
      </aside>

      {/* Mobile hamburger */}
      <button
        className="md:hidden fixed left-3 top-2.5 z-50 flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface shadow-soft"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle navigation"
      >
        {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40"
          onClick={() => setMobileOpen(false)}
        >
          <div className="absolute inset-0 bg-forest-slate/20 backdrop-blur-sm" />
          <aside
            className="absolute left-0 top-0 h-full w-56 flex flex-col bg-surface border-r border-border shadow-hover animate-slide-up"
            onClick={(event) => event.stopPropagation()}
          >
            <NavContent />
          </aside>
        </div>
      )}
    </>
  );
}
