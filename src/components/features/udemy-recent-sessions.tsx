"use client";

import Link from "next/link";
import { GraduationCap, Clock } from "lucide-react";
import type { UdemySession } from "@/types";

function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function UdemyRecentSessions({ sessions }: { sessions: UdemySession[] }) {
  if (sessions.length === 0) return null;

  return (
    <div className="w-full max-w-4xl mx-auto mt-12 space-y-4">
      <div className="flex items-center gap-2 px-1">
        <Clock className="h-4 w-4 text-state-today" />
        <h3 className="text-sm font-semibold text-forest-slate uppercase tracking-wider">
          Recent Sessions
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sessions.map((session) => {
          const href = `/study/udemy?course=${session.courseSlug}${session.lectureId ? `&lecture=${session.lectureId}` : ""}`;

          return (
            <Link
              key={session.id}
              href={href}
              className="group flex gap-3 p-3 bg-white rounded-xl border border-border shadow-sm hover:shadow-md transition-all"
            >
              {/* Icon placeholder */}
              <div className="h-16 w-16 shrink-0 rounded-xl bg-state-today/10 flex items-center justify-center">
                <GraduationCap className="h-7 w-7 text-state-today" />
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                <h4 className="text-sm font-medium text-forest-slate line-clamp-2 leading-tight group-hover:text-state-today transition-colors">
                  {session.courseTitle}
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm bg-state-today/10 text-state-today border border-state-today/20">
                    Udemy
                  </span>
                  <span className="text-[10px] text-mossy-gray">
                    {formatRelativeDate(session.updatedAt)}
                  </span>
                  {session.notes.trim() && (
                    <span className="text-[10px] text-mossy-gray ml-auto">
                      {session.notes.split("\n").filter(Boolean).length} note{session.notes.split("\n").filter(Boolean).length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
