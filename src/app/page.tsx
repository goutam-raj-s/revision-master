import Link from "next/link";
import { Brain, Repeat2, Zap, BookOpen, BarChart3, Sparkles, ArrowRight, Download, Globe } from "lucide-react";

const FEATURES = [
  {
    icon: Brain,
    title: "AI-Powered Flashcards",
    description: "Paste any content and our AI instantly generates high-quality flashcards from your notes, articles, and documents.",
  },
  {
    icon: Repeat2,
    title: "Spaced Repetition",
    description: "Our algorithm schedules each card at the optimal moment — right before you forget — so every review counts.",
  },
  {
    icon: Zap,
    title: "Active Recall",
    description: "Stop re-reading. Active recall through flashcard quizzing is proven to dramatically outperform passive study.",
  },
  {
    icon: BookOpen,
    title: "Import Anything",
    description: "Bring in content from Google Docs, YouTube videos, web pages, or plain text. Lostbae handles the rest.",
  },
  {
    icon: BarChart3,
    title: "Track Your Progress",
    description: "See exactly how much you know, what's due today, and where you need more practice — all in one view.",
  },
  {
    icon: Sparkles,
    title: "Smart Review Sessions",
    description: "Each session adapts to your performance, prioritising the cards most likely to slip from memory.",
  },
];

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "lostbae",
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web, macOS, Windows",
  description:
    "Spaced repetition and active recall for your Google Docs, notes and YouTube lessons.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  url: (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.lostbae.com").replace(/\/$/, ""),
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-canvas text-forest-slate flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-canvas/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-state-today flex items-center justify-center shadow-soft">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-forest-slate tracking-tight">Lostbae</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/blog"
              className="hidden text-sm font-medium text-mossy-gray transition-colors hover:text-forest-slate sm:inline"
            >
              Blog
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-mossy-gray hover:text-forest-slate transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 rounded-xl bg-state-today px-4 py-2 text-sm font-medium text-white shadow-soft hover:bg-state-today/90 transition-colors"
            >
              Get started
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-state-today/20 bg-state-today/5 px-3 py-1 text-xs font-medium text-state-today mb-6">
            <Sparkles className="h-3 w-3" />
            AI-powered spaced repetition
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-forest-slate mb-6 leading-[1.1]">
            Learn anything.
            <br />
            <span className="text-state-today">Actually remember it.</span>
          </h1>

          <p className="text-lg text-mossy-gray max-w-2xl mx-auto mb-10 leading-relaxed">
            Lostbae is a spaced repetition learning platform that uses AI to turn your notes,
            articles, and videos into flashcards — then schedules reviews at the exact moment
            you're about to forget them.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-2xl bg-state-today px-6 py-3 text-sm font-semibold text-white shadow-soft hover:bg-state-today/90 transition-colors"
            >
              Start learning for free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-2xl border border-border bg-surface px-6 py-3 text-sm font-medium text-forest-slate hover:bg-muted/50 transition-colors shadow-soft"
            >
              Sign in
            </Link>
          </div>
        </section>

        {/* Stats strip */}
        <section className="border-y border-border/50 bg-surface/60">
          <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-3 gap-4 text-center">
            {[
              { value: "10×", label: "better retention vs passive re-reading" },
              { value: "5 min", label: "to generate a full flashcard deck" },
              { value: "Free", label: "to start — no credit card needed" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-bold text-state-today">{s.value}</p>
                <p className="text-xs text-mossy-gray mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="max-w-5xl mx-auto px-6 py-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-forest-slate mb-3">
            Everything you need to remember more
          </h2>
          <p className="text-mossy-gray text-center mb-12 max-w-xl mx-auto">
            Built on decades of cognitive science research, with a modern AI layer on top.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-border/60 bg-surface p-6 shadow-card hover:shadow-hover transition-shadow"
              >
                <div className="h-10 w-10 rounded-xl bg-state-today/10 flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-state-today" />
                </div>
                <h3 className="font-semibold text-forest-slate mb-1.5">{f.title}</h3>
                <p className="text-sm text-mossy-gray leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Available everywhere */}
        <section className="border-t border-border/50 bg-surface/40">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-wide text-state-today">Use it everywhere</p>
              <h2 className="mt-2 text-2xl font-bold text-forest-slate sm:text-3xl">
                On your desktop, or any browser
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-mossy-gray">
                Install the native app for macOS or Windows, or just open it on the web — your library
                stays in sync everywhere.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {/* macOS */}
              <a
                href="https://github.com/goutam-raj-s/revision-master/releases/latest"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-6 text-center shadow-card transition-all hover:-translate-y-1 hover:shadow-hover"
              >
                <svg viewBox="0 0 24 24" className="h-9 w-9 fill-forest-slate" aria-hidden="true">
                  <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.661 0-2.256.91-3.642.91-1.387 0-2.412-1.24-3.355-2.53-1.211-1.66-2.18-4.04-2.18-6.32 0-3.71 2.41-5.68 4.79-5.68 1.32 0 2.42.88 3.246.88.79 0 2.03-.94 3.554-.94.578 0 2.648.05 4.012 1.92-.106.06-2.27 1.33-2.27 3.96 0 3.03 2.65 4.1 2.74 4.14z" />
                </svg>
                <div>
                  <div className="text-sm font-semibold text-forest-slate">Download for Mac</div>
                  <div className="text-xs text-mossy-gray">Intel &amp; Apple Silicon</div>
                </div>
                <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-state-today/10 px-3 py-1 text-xs font-medium text-state-today transition-colors group-hover:bg-state-today/15">
                  <Download className="h-3 w-3" /> .dmg
                </span>
              </a>

              {/* Windows */}
              <a
                href="https://github.com/goutam-raj-s/revision-master/releases/latest"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-6 text-center shadow-card transition-all hover:-translate-y-1 hover:shadow-hover"
              >
                <svg viewBox="0 0 24 24" className="h-9 w-9 fill-forest-slate" aria-hidden="true">
                  <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" />
                </svg>
                <div>
                  <div className="text-sm font-semibold text-forest-slate">Download for Windows</div>
                  <div className="text-xs text-mossy-gray">Windows 10 &amp; 11</div>
                </div>
                <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-state-today/10 px-3 py-1 text-xs font-medium text-state-today transition-colors group-hover:bg-state-today/15">
                  <Download className="h-3 w-3" /> .exe
                </span>
              </a>

              {/* Web */}
              <Link
                href="/register"
                className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-6 text-center shadow-card transition-all hover:-translate-y-1 hover:shadow-hover"
              >
                <Globe className="h-9 w-9 text-forest-slate" strokeWidth={1.5} />
                <div>
                  <div className="text-sm font-semibold text-forest-slate">Use on the web</div>
                  <div className="text-xs text-mossy-gray">Any modern browser</div>
                </div>
                <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-state-today/10 px-3 py-1 text-xs font-medium text-state-today transition-colors group-hover:bg-state-today/15">
                  Open app
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-forest-slate">
          <div className="max-w-5xl mx-auto px-6 py-16 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Ready to actually remember what you learn?
            </h2>
            <p className="text-white/60 mb-8 max-w-lg mx-auto">
              Create your free account and import your first document in under two minutes.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-2xl bg-state-today px-6 py-3 text-sm font-semibold text-white shadow-soft hover:bg-state-today/90 transition-colors"
            >
              Get started — it&apos;s free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-canvas">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-mossy-gray">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-state-today flex items-center justify-center">
              <Brain className="h-3 w-3 text-white" />
            </div>
            <span className="font-semibold text-forest-slate">Lostbae</span>
            <span className="text-border">·</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link href="/blog" className="hover:text-forest-slate transition-colors">
              Blog
            </Link>
            <Link href="/for/coding-interviews" className="hover:text-forest-slate transition-colors">
              For interviews
            </Link>
            <Link href="/for/medical-students" className="hover:text-forest-slate transition-colors">
              For med school
            </Link>
            <Link href="/for/language-learning" className="hover:text-forest-slate transition-colors">
              For languages
            </Link>
            <Link href="/privacy" className="hover:text-forest-slate transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-forest-slate transition-colors">
              Terms of Service
            </Link>
            <a href="mailto:support@lostbae.com" className="hover:text-forest-slate transition-colors">
              Contact
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
