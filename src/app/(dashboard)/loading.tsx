import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center min-h-[50vh]">
      <Loader2 className="w-8 h-8 text-mossy-gray animate-spin" />
      <p className="mt-4 text-sm text-mossy-gray animate-pulse">Loading dashboard...</p>
    </div>
  );
}
