import Link from "next/link";
import { Brain, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms of Service — Lostbae",
  description: "Terms and conditions for using Lostbae.",
};

const SECTIONS = [
  {
    title: "Acceptance of Terms",
    content: [
      "By accessing or using Lostbae (lostbae.com) you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, do not use the service.",
    ],
  },
  {
    title: "Description of Service",
    content: [
      "Lostbae is a spaced-repetition learning platform that allows users to create, import, and review flashcard-style content. We use AI to generate flashcards from user-provided material and schedule reviews based on evidence-based memory science.",
    ],
  },
  {
    title: "Accounts",
    content: [
      "You must provide accurate information when creating an account.",
      "You are responsible for maintaining the confidentiality of your credentials and for all activity that occurs under your account.",
      "You must be at least 13 years old to use Lostbae.",
      "We reserve the right to suspend or terminate accounts that violate these Terms.",
    ],
  },
  {
    title: "Your Content",
    content: [
      "You retain ownership of all content you create or import into Lostbae.",
      "By submitting content, you grant us a limited licence to store, process, and display it solely to provide the service to you.",
      "You are responsible for ensuring you have the right to use any content you import (e.g., content from third-party documents or websites).",
      "We do not claim ownership of your content and will not use it for advertising or sell it to third parties.",
    ],
  },
  {
    title: "Acceptable Use",
    content: [
      "You agree not to use Lostbae to upload or distribute unlawful, harmful, or infringing content.",
      "You agree not to attempt to reverse-engineer, scrape, or disrupt the service.",
      "You agree not to create multiple accounts to circumvent restrictions or abuse free-tier limits.",
    ],
  },
  {
    title: "Third-Party Integrations",
    content: [
      "Lostbae integrates with third-party services (Google OAuth, GitHub, Discord). Your use of those services is subject to their respective terms and privacy policies.",
      "We are not responsible for the availability or conduct of third-party services.",
    ],
  },
  {
    title: "Disclaimers",
    content: [
      "Lostbae is provided \"as is\" without warranties of any kind, express or implied.",
      "We do not guarantee that the service will be uninterrupted, error-free, or that AI-generated flashcards will be accurate. Always verify important information.",
    ],
  },
  {
    title: "Limitation of Liability",
    content: [
      "To the maximum extent permitted by law, Lostbae and its creators shall not be liable for any indirect, incidental, or consequential damages arising from your use of or inability to use the service.",
    ],
  },
  {
    title: "Changes to Terms",
    content: [
      "We may revise these Terms at any time. We will notify you of material changes by email or in-app notice. Continued use after the effective date constitutes acceptance of the updated Terms.",
    ],
  },
  {
    title: "Governing Law",
    content: [
      "These Terms are governed by applicable law. Any disputes will be resolved in the courts of competent jurisdiction.",
    ],
  },
  {
    title: "Contact",
    content: [
      "For questions about these Terms, contact us at: support@lostbae.com",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-canvas text-forest-slate flex flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-canvas/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-state-today flex items-center justify-center shadow-soft">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-forest-slate tracking-tight">Lostbae</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-mossy-gray hover:text-forest-slate transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto px-6 py-12 w-full">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-forest-slate mb-2">Terms of Service</h1>
          <p className="text-mossy-gray text-sm">Last updated: 1 June 2025</p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-surface shadow-card p-8 space-y-10">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold text-forest-slate mb-4 pb-2 border-b border-border/50">
                {section.title}
              </h2>
              <ul className="space-y-3">
                {section.content.map((item, i) => (
                  <li key={i} className="text-sm text-mossy-gray leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-canvas">
        <div className="max-w-3xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-mossy-gray">
          <span>© {new Date().getFullYear()} Lostbae</span>
          <nav className="flex items-center gap-5">
            <Link href="/privacy" className="hover:text-forest-slate transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-state-today font-medium">Terms of Service</Link>
            <a href="mailto:support@lostbae.com" className="hover:text-forest-slate transition-colors">Contact</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
