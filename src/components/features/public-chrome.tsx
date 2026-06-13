import Link from "next/link";
import { Brain } from "lucide-react";

/** Lightweight header for public marketing pages (blog, use-cases). */
export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-canvas/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-state-today shadow-soft">
            <Brain className="h-4 w-4 text-white" />
          </div>
          <span className="font-serif text-lg font-bold text-forest-slate">lostbae</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/blog" className="text-mossy-gray transition-colors hover:text-forest-slate">Blog</Link>
          <Link href="/login" className="text-mossy-gray transition-colors hover:text-forest-slate">Log in</Link>
          <Link
            href="/register"
            className="rounded-full bg-state-today px-4 py-1.5 font-medium text-white transition-colors hover:bg-state-today/90"
          >
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-border/50 bg-surface/50">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-mossy-gray sm:flex-row">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-state-today/10">
            <Brain className="h-3.5 w-3.5 text-state-today" />
          </div>
          <span>© {new Date().getFullYear()} lostbae</span>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <Link href="/blog" className="hover:text-forest-slate">Blog</Link>
          <Link href="/for/coding-interviews" className="hover:text-forest-slate">For interviews</Link>
          <Link href="/for/medical-students" className="hover:text-forest-slate">For med school</Link>
          <Link href="/for/language-learning" className="hover:text-forest-slate">For languages</Link>
          <Link href="/privacy" className="hover:text-forest-slate">Privacy</Link>
          <Link href="/terms" className="hover:text-forest-slate">Terms</Link>
        </nav>
      </div>
    </footer>
  );
}

/** Shared call-to-action used at the foot of content pages. */
export function TryCta({ context }: { context?: string }) {
  return (
    <div className="my-10 rounded-2xl border border-border bg-surface p-6 text-center shadow-card sm:p-8">
      <h3 className="text-lg font-semibold text-forest-slate sm:text-xl">
        {context ?? "Remember everything you read, watch and note."}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-mossy-gray">
        lostbae turns your Google Docs, notes and YouTube lessons into a spaced-repetition queue — free to start.
      </p>
      <Link
        href="/register"
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-state-today px-6 py-2.5 text-sm font-medium text-white transition-transform hover:scale-105"
      >
        Start free
      </Link>
    </div>
  );
}
