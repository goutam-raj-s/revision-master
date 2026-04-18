"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState, Suspense } from "react";
import { Brain, ArrowRight } from "lucide-react";
import { forgotPasswordAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { ActionResult } from "@/types";

const initialState: ActionResult = { success: false };

function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, initialState);

  if (state.success) {
    return (
      <Card className="shadow-glass border-border/50">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-2xl bg-state-today flex items-center justify-center shadow-soft">
              <Brain className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-forest-slate">Check your inbox</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-mossy-gray text-center leading-relaxed">
            If an account exists for that email, you&apos;ll receive a reset link shortly.
          </p>
          <p className="mt-6 text-center text-sm text-mossy-gray">
            <Link href="/login" className="text-state-today hover:underline font-medium">
              Back to sign in
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
        <CardTitle className="text-2xl font-bold text-forest-slate">Forgot password?</CardTitle>
        <CardDescription>Enter your email and we&apos;ll send you a reset link.</CardDescription>
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

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Sending…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Send reset link
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

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
