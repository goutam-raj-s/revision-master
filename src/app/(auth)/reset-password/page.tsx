"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState, Suspense } from "react";
import { Brain, ArrowRight, Eye, EyeOff } from "lucide-react";
import { resetPasswordAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useSearchParams } from "next/navigation";
import type { ActionResult } from "@/types";

const initialState: ActionResult = { success: false };

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") ?? "";
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [state, action, pending] = useActionState(resetPasswordAction, initialState);

  // No token in URL
  if (!token) {
    return (
      <Card className="shadow-glass border-border/50">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-2xl bg-destructive/80 flex items-center justify-center shadow-soft">
              <Brain className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-forest-slate">Invalid reset link</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-mossy-gray text-center leading-relaxed">
            This reset link is missing a token. Please request a new one.
          </p>
          <p className="mt-6 text-center text-sm text-mossy-gray">
            <Link href="/forgot-password" className="text-state-today hover:underline font-medium">
              Request new reset link
            </Link>
          </p>
        </CardContent>
      </Card>
    );
  }

  // Expired or already-used token
  if (!state.success && state.error === "expired") {
    return (
      <Card className="shadow-glass border-border/50">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-2xl bg-destructive/80 flex items-center justify-center shadow-soft">
              <Brain className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-forest-slate">Link expired</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-mossy-gray text-center leading-relaxed">
            This link has expired or has already been used.
          </p>
          <p className="mt-6 text-center text-sm text-mossy-gray">
            <Link href="/forgot-password" className="text-state-today hover:underline font-medium">
              Request a new reset link
            </Link>
          </p>
        </CardContent>
      </Card>
    );
  }

  // Success
  if (state.success) {
    return (
      <Card className="shadow-glass border-border/50">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-2xl bg-state-today flex items-center justify-center shadow-soft">
              <Brain className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-forest-slate">Password updated!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-mossy-gray text-center leading-relaxed">
            Your password has been changed. You can now sign in with your new password.
          </p>
          <p className="mt-6 text-center text-sm text-mossy-gray">
            <Link href="/login" className="text-state-today hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-glass border-border/50">
      <CardHeader className="text-center pb-2">
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 rounded-2xl bg-state-today flex items-center justify-center shadow-soft">
            <Brain className="h-6 w-6 text-white" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-forest-slate">Set new password</CardTitle>
        <CardDescription>Choose a strong password for your account.</CardDescription>
      </CardHeader>

      <CardContent>
        <form action={action} className="space-y-4">
          <input type="hidden" name="token" value={token} />

          {state.error && state.error !== "expired" && (
            <div className="rounded-xl bg-destructive/5 border border-destructive/20 px-4 py-3 text-sm text-destructive animate-slide-down">
              {state.error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="newPassword">New password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                name="newPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Min 8 characters"
                autoComplete="new-password"
                required
                minLength={8}
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

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirm ? "text" : "password"}
                placeholder="Repeat your new password"
                autoComplete="new-password"
                required
                minLength={8}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-mossy-gray hover:text-forest-slate transition-colors"
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Updating…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Update password
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-mossy-gray">
          <Link href="/login" className="text-state-today hover:underline font-medium">
            Back to sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
