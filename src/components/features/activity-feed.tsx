import { formatDistanceToNow } from "date-fns";
import { FileText, CirclePlay } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { ActivityItem } from "@/actions/analytics";

const CONF: Record<string, string> = { easy: "😎", okay: "🙂", struggled: "😣" };

/** Recent learning activity timeline. */
export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) return null;

  return (
    <Card className="p-5 shadow-card">
      <h2 className="mb-3 text-sm font-semibold text-forest-slate">Recent activity</h2>
      <ul className="space-y-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-canvas">
              {item.source === "youtube" ? (
                <CirclePlay className="h-3.5 w-3.5 text-destructive" />
              ) : (
                <FileText className="h-3.5 w-3.5 text-mossy-gray" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-forest-slate">
                Reviewed <span className="font-medium">{item.title}</span>
              </p>
            </div>
            {item.confidence && <span className="shrink-0 text-sm">{CONF[item.confidence]}</span>}
            <span className="shrink-0 text-xs text-mossy-gray">
              {formatDistanceToNow(new Date(item.reviewedAt), { addSuffix: true })}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
