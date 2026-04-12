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
  Brain,
  Tag,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/actions/auth";
import type { User } from "@/types";

interface SidebarProps {
  user: User;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/documents", label: "Documents", icon: BookOpen },
  { href: "/terminology", label: "Terminology", icon: BookText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-border">
        <div className="h-7 w-7 rounded-xl bg-state-today flex items-center justify-center shrink-0">
          <Brain className="h-4 w-4 text-white" />
        </div>
        <span className="font-semibold text-forest-slate text-sm">Revision Master</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5" aria-label="Main navigation">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-state-today/50",
                active
                  ? "bg-state-today/10 text-state-today"
                  : "text-mossy-gray hover:text-forest-slate hover:bg-canvas"
              )}
              aria-current={active ? "page" : undefined}
            >
              <item.icon className={cn("h-4 w-4 shrink-0", active ? "text-state-today" : "text-mossy-gray")} />
              {item.label}
              {active && <ChevronRight className="ml-auto h-3 w-3 text-state-today/60" />}
            </Link>
          );
        })}

        {user.role === "admin" && (
          <Link
            href="/admin"
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
              pathname.startsWith("/admin")
                ? "bg-state-today/10 text-state-today"
                : "text-mossy-gray hover:text-forest-slate hover:bg-canvas"
            )}
          >
            <Tag className="h-4 w-4 shrink-0" />
            Admin
          </Link>
        )}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-3 rounded-xl px-3 py-2 mb-1">
          <div className="h-7 w-7 rounded-full bg-state-today/20 flex items-center justify-center text-xs font-semibold text-state-today shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-forest-slate truncate">{user.name}</div>
            <div className="text-xs text-mossy-gray truncate">{user.email}</div>
          </div>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-mossy-gray hover:text-destructive hover:bg-destructive/5 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-state-today/50"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </form>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-border bg-surface h-screen sticky top-0">
        <NavContent />
      </aside>

      {/* Mobile hamburger */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-surface border border-border shadow-soft"
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
          <aside className="absolute left-0 top-0 h-full w-56 flex flex-col bg-surface border-r border-border shadow-hover animate-slide-up">
            <NavContent />
          </aside>
        </div>
      )}
    </>
  );
}
