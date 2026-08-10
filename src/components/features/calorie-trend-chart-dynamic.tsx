"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";

export const CalorieTrendChartDynamic = dynamic(
  () => import("./calorie-trend-chart").then((m) => m.CalorieTrendChart),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[190px] w-full rounded-xl" />,
  }
);
