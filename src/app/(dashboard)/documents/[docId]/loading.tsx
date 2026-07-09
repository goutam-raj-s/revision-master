import { Loader2 } from "lucide-react";

export default function DocumentDetailLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm text-mossy-gray shadow-soft">
        <Loader2 className="h-4 w-4 animate-spin" />
        Opening editor...
      </div>
    </div>
  );
}
