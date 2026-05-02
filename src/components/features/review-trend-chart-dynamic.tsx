"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";

export const ReviewTrendChartDynamic = dynamic(
  () => import("./review-trend-chart").then((m) => m.ReviewTrendChart),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[120px] w-full rounded-xl" />,
  }
);
