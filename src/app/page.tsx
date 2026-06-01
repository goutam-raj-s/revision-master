import Link from "next/link";
import { Brain, Repeat2, Zap, BookOpen, BarChart3, Sparkles, ArrowRight } from "lucide-react";

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

export default function HomePage() {
  return (
    <div className="min-h-screen bg-canvas text-forest-slate flex flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-canvas/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-state-today flex items-center justify-center shadow-soft">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-forest-slate tracking-tight">Lostbae</span>
          </div>
          <div className="flex items-center gap-3">
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
          <nav className="flex items-center gap-6">
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
