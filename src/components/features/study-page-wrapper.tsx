"use client";

import * as React from "react";
import { TooltipProvider } from "@/components/ui/tooltip";

export function StudyPageWrapper({ children }: { children: React.ReactNode }) {
  return <TooltipProvider delayDuration={300}>{children}</TooltipProvider>;
}
