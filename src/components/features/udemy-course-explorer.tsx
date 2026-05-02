"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  PlayCircle,
  ChevronRight,
  Search,
  FileText,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import type { UdemyCurriculumSection, UdemySession } from "@/types";

interface UdemyCourseExplorerProps {
  courseSlug: string;
  courseTitle: string;
  sections: UdemyCurriculumSection[];
  existingSessions: UdemySession[];
}

function formatDuration(seconds?: number): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function UdemyCourseExplorer({
  courseSlug,
  courseTitle,
  sections,
  existingSessions,
}: UdemyCourseExplorerProps) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [expandedSections, setExpandedSections] = React.useState<Set<number>>(
    () => new Set(sections.slice(0, 3).map((s) => s.id))
  );

  const sessionByLectureId = React.useMemo(() => {
    const map = new Map<string, UdemySession>();
    for (const s of existingSessions) {
      if (s.lectureId) map.set(s.lectureId, s);
    }
    return map;
  }, [existingSessions]);

  const filtered = React.useMemo(() => {
    if (!search.trim()) return sections;
    const q = search.toLowerCase();
    return sections
      .map((sec) => ({
        ...sec,
        lectures: sec.lectures.filter((l) => l.title.toLowerCase().includes(q)),
      }))
      .filter((sec) => sec.lectures.length > 0 || sec.title.toLowerCase().includes(q));
  }, [sections, search]);

  function toggleSection(id: number) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openLecture(lectureId: number, lectureTitle: string) {
    const params = new URLSearchParams({
      course: courseSlug,
      lecture: String(lectureId),
      ltitle: lectureTitle,
    });
    router.push(`/study/udemy?${params.toString()}`);
  }

  const hasCurriculum = sections.length > 0;
  const totalLectures = sections.reduce((sum, s) => sum + s.lectures.length, 0);

  return (
    <div className="h-full flex flex-col bg-canvas overflow-hidden">
      {/* Course header */}
      <div className="shrink-0 px-6 py-5 border-b border-border bg-white">
        <div className="flex items-start gap-3 max-w-3xl">
          <div className="h-10 w-10 rounded-xl bg-state-today/10 flex items-center justify-center shrink-0 mt-0.5">
            <GraduationCap className="h-5 w-5 text-state-today" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-forest-slate text-base leading-snug">
              {courseTitle}
            </h2>
            {hasCurriculum && (
              <p className="text-xs text-mossy-gray mt-0.5">
                {sections.length} sections · {totalLectures} lectures
              </p>
            )}
          </div>
        </div>

        {hasCurriculum && (
          <div className="mt-3 max-w-3xl">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-mossy-gray" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search lectures…"
                className="pl-8 h-8 text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Curriculum list */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {!hasCurriculum ? (
          /* Fallback when curriculum fetch failed */
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
            <AlertCircle className="h-8 w-8 text-mossy-gray/50" />
            <div className="space-y-1">
              <p className="font-medium text-forest-slate text-sm">
                Couldn&apos;t load the curriculum
              </p>
              <p className="text-xs text-mossy-gray max-w-xs">
                Paste a specific lecture URL on the home page to start a session for that video.
              </p>
            </div>

            {/* Show existing lecture sessions if any */}
            {existingSessions.length > 0 && (
              <div className="w-full max-w-md mt-4 space-y-2 text-left">
                <p className="text-xs font-semibold text-mossy-gray uppercase tracking-wide px-1">
                  Your previous sessions
                </p>
                {existingSessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() =>
                      router.push(
                        `/study/udemy?course=${courseSlug}&lecture=${s.lectureId}`
                      )
                    }
                    className="w-full flex items-center gap-2 p-3 rounded-xl border border-border bg-white hover:shadow-soft transition-all text-left"
                  >
                    <FileText className="h-4 w-4 text-state-today shrink-0" />
                    <span className="text-sm text-forest-slate truncate">
                      {s.lectureTitle || s.courseTitle}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-mossy-gray ml-auto shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-mossy-gray">
            No lectures match &ldquo;{search}&rdquo;
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-4 space-y-2">
            {filtered.map((section) => {
              const isOpen = expandedSections.has(section.id);
              return (
                <div
                  key={section.id}
                  className="rounded-xl border border-border bg-white overflow-hidden"
                >
                  {/* Section header */}
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-canvas transition-colors"
                  >
                    <ChevronRight
                      className={`h-4 w-4 text-mossy-gray shrink-0 transition-transform ${
                        isOpen ? "rotate-90" : ""
                      }`}
                    />
                    <span className="flex-1 text-sm font-semibold text-forest-slate">
                      {section.title}
                    </span>
                    <span className="text-xs text-mossy-gray shrink-0">
                      {section.lectures.length} lecture{section.lectures.length !== 1 ? "s" : ""}
                    </span>
                  </button>

                  {/* Lectures */}
                  {isOpen && (
                    <div className="border-t border-border/50">
                      {section.lectures.map((lecture, idx) => {
                        const hasSession = sessionByLectureId.has(String(lecture.id));
                        return (
                          <button
                            key={lecture.id}
                            onClick={() => openLecture(lecture.id, lecture.title)}
                            className={`w-full flex items-center gap-3 px-5 py-2.5 text-left hover:bg-state-today/5 transition-colors group ${
                              idx < section.lectures.length - 1
                                ? "border-b border-border/30"
                                : ""
                            }`}
                          >
                            <PlayCircle
                              className={`h-4 w-4 shrink-0 transition-colors ${
                                hasSession
                                  ? "text-state-today"
                                  : "text-mossy-gray/40 group-hover:text-mossy-gray"
                              }`}
                            />
                            <span className="flex-1 text-sm text-forest-slate group-hover:text-state-today transition-colors truncate">
                              {lecture.title}
                            </span>
                            {hasSession && (
                              <span className="shrink-0 flex items-center gap-1 text-[10px] text-state-today font-medium">
                                <FileText className="h-3 w-3" />
                                Notes
                              </span>
                            )}
                            <ChevronRight className="h-3.5 w-3.5 text-mossy-gray/40 group-hover:text-state-today transition-colors shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
