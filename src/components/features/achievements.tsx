import { Card } from "@/components/ui/card";
import { Lock } from "lucide-react";

interface AchievementsProps {
  totalReviews: number;
  bestStreak: number;
  totalDocs: number;
  totalCompleted: number;
}

interface Badge {
  emoji: string;
  title: string;
  desc: string;
  unlocked: boolean;
}

/** Milestone archive — badges unlocked from existing stats. */
export function Achievements({ totalReviews, bestStreak, totalDocs, totalCompleted }: AchievementsProps) {
  const badges: Badge[] = [
    { emoji: "🌱", title: "First Steps", desc: "Complete your first review", unlocked: totalReviews >= 1 },
    { emoji: "🔥", title: "On a Roll", desc: "Reach a 3-day streak", unlocked: bestStreak >= 3 },
    { emoji: "⚡", title: "Week Warrior", desc: "Reach a 7-day streak", unlocked: bestStreak >= 7 },
    { emoji: "🏔️", title: "Unstoppable", desc: "Reach a 30-day streak", unlocked: bestStreak >= 30 },
    { emoji: "📚", title: "Library Started", desc: "Add 10 documents", unlocked: totalDocs >= 10 },
    { emoji: "🗂️", title: "Knowledge Base", desc: "Add 50 documents", unlocked: totalDocs >= 50 },
    { emoji: "💯", title: "Centurion", desc: "Complete 100 reviews", unlocked: totalReviews >= 100 },
    { emoji: "🎓", title: "Master", desc: "Master 10 documents", unlocked: totalCompleted >= 10 },
  ];

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <Card className="p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-forest-slate">Achievements</h2>
        <span className="text-xs text-mossy-gray">{unlockedCount} / {badges.length} unlocked</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {badges.map((b) => (
          <div
            key={b.title}
            className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition-colors ${
              b.unlocked ? "border-state-today/30 bg-state-today/5" : "border-border bg-canvas opacity-60"
            }`}
            title={b.desc}
          >
            <span className="relative text-2xl leading-none">
              {b.unlocked ? b.emoji : <Lock className="h-5 w-5 text-mossy-gray" />}
            </span>
            <span className="text-xs font-medium text-forest-slate">{b.title}</span>
            <span className="text-[10px] leading-tight text-mossy-gray">{b.desc}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
