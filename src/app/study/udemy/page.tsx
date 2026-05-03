import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAuth } from "@/lib/auth/session";
import {
  createOrGetUdemySession,
  listUdemySessions,
  listUdemyLectureSessions,
  fetchUdemyCurriculum,
} from "@/actions/udemy";
import { slugToTitle } from "@/lib/udemy-utils";
import { UdemyStudyClient } from "@/components/features/udemy-study-client";
import { UdemyUrlForm } from "@/components/features/udemy-url-form";
import { UdemyRecentSessions } from "@/components/features/udemy-recent-sessions";
import { DashboardHeader } from "@/components/features/dashboard-header";
import { UdemyCourseExplorer } from "@/components/features/udemy-course-explorer";

interface UdemyStudyPageProps {
  searchParams: Promise<{
    course?: string;
    lecture?: string;
    ltitle?: string; // lecture title passed from course explorer
  }>;
}

export default async function UdemyStudyPage({ searchParams }: UdemyStudyPageProps) {
  await requireAuth();

  const { course: courseSlug, lecture: lectureId, ltitle: lectureTitle } = await searchParams;

  // ── Route A: No course — landing page ─────────────────────────────────────
  if (!courseSlug) {
    const sessions = await listUdemySessions();
    return (
      <div className="h-screen flex flex-col bg-canvas overflow-y-auto">
        <DashboardHeader 
          showLogo={true}
          customBreadcrumbs={[{ href: "/dashboard", label: "Dashboard" }, { href: "/study/udemy", label: "Udemy Study" }]}
        />
        <div className="flex-1 flex flex-col items-center p-8 w-full max-w-5xl mx-auto">
          <div className="mt-[10vh] w-full flex justify-center">
            <UdemyUrlForm />
          </div>
          <UdemyRecentSessions sessions={sessions} />
        </div>
      </div>
    );
  }

  // ── Route B: Course URL only — show curriculum explorer ───────────────────
  if (courseSlug && !lectureId) {
    const [sections, existingSessions] = await Promise.all([
      fetchUdemyCurriculum(courseSlug),
      listUdemyLectureSessions(courseSlug),
    ]);
    const courseTitle = slugToTitle(courseSlug);

    return (
      <div className="h-screen flex flex-col bg-canvas overflow-hidden">
        <DashboardHeader 
          showLogo={true}
          customBreadcrumbs={[
            { href: "/dashboard", label: "Dashboard" },
            { href: "/study/udemy", label: "Udemy Study" },
            { href: `/study/udemy?course=${courseSlug}`, label: courseTitle },
          ]}
        />
        <div className="flex-1 min-h-0">
          <UdemyCourseExplorer
            courseSlug={courseSlug}
            courseTitle={courseTitle}
            sections={sections}
            existingSessions={existingSessions}
          />
        </div>
      </div>
    );
  }

  // ── Route C: Course + Lecture — study session ─────────────────────────────
  const result = await createOrGetUdemySession(courseSlug, {
    lectureId,
    lectureTitle: lectureTitle || undefined,
    courseTitle: slugToTitle(courseSlug),
  });

  if (!result.success || !result.data) {
    redirect("/study/udemy");
  }

  const session = result.data;
  const displayTitle = session.lectureTitle || session.courseTitle;

  const lectureUrl = `${session.courseUrl}learn/lecture/${lectureId}/`;

  return (
    <div className="h-screen flex flex-col bg-canvas overflow-hidden">
      <DashboardHeader 
        showLogo={true}
        customBreadcrumbs={[
          { href: "/dashboard", label: "Dashboard" },
          { href: "/study/udemy", label: "Udemy Study" },
          { href: `/study/udemy?course=${courseSlug}`, label: session.courseTitle },
          { href: `/study/udemy?course=${courseSlug}&lecture=${lectureId}`, label: displayTitle },
        ]}
        rightActions={
          <a
            href={lectureUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-mossy-gray hover:text-forest-slate transition-colors"
          >
            Open on Udemy ↗
          </a>
        }
      />
      <div className="flex-1 min-h-0">
        <UdemyStudyClient session={session} />
      </div>
    </div>
  );
}
