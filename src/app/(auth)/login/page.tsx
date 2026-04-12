"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, Suspense } from "react";
import { Brain, ArrowRight, Eye, EyeOff } from "lucide-react";
import { loginAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useSearchParams } from "next/navigation";
import type { ActionResult } from "@/types";

const initialState: ActionResult<{ redirectTo: string }> = { success: false };

function LoginFormBase() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams?.get("from") || "/dashboard";
  const [showPassword, setShowPassword] = React.useState(false);
  const [state, action, pending] = useActionState(loginAction, initialState);

  React.useEffect(() => {
    if (state.success) {
      router.push(from);
    }
  }, [state, router, from]);

  return (
    <Card className="shadow-glass border-border/50">
      <CardHeader className="text-center pb-2">
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 rounded-2xl bg-state-today flex items-center justify-center shadow-soft">
            <Brain className="h-6 w-6 text-white" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-forest-slate">Welcome back</CardTitle>
        <CardDescription>Sign in to your Revision Master account</CardDescription>
      </CardHeader>

      <CardContent>
        <form action={action} className="space-y-4">
          {state.error && (
            <div className="rounded-xl bg-destructive/5 border border-destructive/20 px-4 py-3 text-sm text-destructive animate-slide-down">
              {state.error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="alex@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-mossy-gray hover:text-forest-slate transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Signing in…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Sign in
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-mossy-gray">
          Don&apos;t have an account?{" "}
          <Link href={from && from !== "/dashboard" ? `/register?from=${encodeURIComponent(from)}` : "/register"} className="text-state-today hover:underline font-medium">
            Create one
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginFormBase />
    </Suspense>
  );
}
