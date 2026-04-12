import { CheckCircle2, CalendarDays } from "lucide-react";

interface InboxZeroProps {
  nextDate?: string;
}

export function InboxZero({ nextDate }: InboxZeroProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-fade-in">
      {/* Illustration */}
      <div className="relative mb-6">
        <div className="h-20 w-20 rounded-full bg-state-today/10 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-state-today" />
        </div>
        {/* Decorative circles */}
        <div className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-state-today/20" />
        <div className="absolute -bottom-1 -left-3 h-3 w-3 rounded-full bg-state-upcoming/30" />
      </div>

      <h2 className="text-xl font-semibold text-forest-slate mb-2">All caught up for today!</h2>
      <p className="text-sm text-mossy-gray max-w-xs leading-relaxed">
        Your knowledge is safely scheduled. Take a break — the right concepts will resurface at exactly the right time.
      </p>

      {nextDate && (
        <div className="mt-6 flex items-center gap-2 px-4 py-2.5 rounded-full border border-border bg-surface text-sm text-mossy-gray">
          <CalendarDays className="h-4 w-4 text-state-upcoming" />
          <span>Next review: <strong className="text-forest-slate font-medium">{nextDate}</strong></span>
        </div>
      )}
    </div>
  );
}
