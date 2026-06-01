import Link from "next/link";
import { Brain, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — Lostbae",
  description: "How Lostbae collects, uses, and protects your personal information.",
};

const SECTIONS = [
  {
    title: "Information We Collect",
    content: [
      "**Account information:** When you register, we collect your name, email address, and password (stored as a secure hash).",
      "**OAuth data:** If you sign in via Google, GitHub, or Discord, we receive your name, email, and profile photo from that provider.",
      "**Content you create:** Documents, flashcards, notes, and any other material you add to Lostbae.",
      "**Usage data:** Study session activity, review results, and feature interactions — used to power spaced-repetition scheduling.",
      "**Device data:** Browser type, operating system, and IP address for security and diagnostics.",
    ],
  },
  {
    title: "How We Use Your Information",
    content: [
      "**To provide the service:** Authenticate your account, sync your content, and schedule spaced-repetition reviews.",
      "**To improve Lostbae:** Aggregate, anonymised usage analytics help us understand which features work best.",
      "**To communicate with you:** Transactional emails (password reset, review reminders). We do not send marketing emails without your consent.",
      "**To keep the service secure:** Detect abuse, enforce our Terms of Service, and protect user data.",
    ],
  },
  {
    title: "Google OAuth & Google Data",
    content: [
      "Lostbae uses Google OAuth solely to authenticate your identity. We request access to your basic profile (name, email, avatar) and, when you use the Google Docs import feature, read-only access to the specific documents you select.",
      "We do not access your Google Drive, Gmail, or any other Google service beyond what you explicitly authorise during a specific import action.",
      "We do not sell, share, or use your Google data for advertising or profiling purposes.",
      "You can revoke Lostbae's access at any time via your Google Account permissions page (myaccount.google.com/permissions).",
    ],
  },
  {
    title: "Data Sharing",
    content: [
      "We do not sell your personal data.",
      "We share data only with infrastructure providers necessary to operate the service (hosting, database, email delivery), all bound by data processing agreements.",
      "We may disclose data if required by law or to protect the rights and safety of our users.",
    ],
  },
  {
    title: "Data Retention",
    content: [
      "Your account data is retained for as long as your account is active.",
      "You may delete your account at any time from Settings → Account. Deletion removes your personal data within 30 days, except where retention is required by law.",
    ],
  },
  {
    title: "Cookies",
    content: [
      "We use a single session cookie (`rm_session`) to keep you logged in. We do not use advertising or tracking cookies.",
    ],
  },
  {
    title: "Security",
    content: [
      "All data is transmitted over HTTPS. Passwords are hashed with bcrypt. We apply industry-standard security practices and review them regularly.",
      "No method of transmission or storage is 100% secure. If you discover a security issue, please contact us at support@lostbae.com.",
    ],
  },
  {
    title: "Children's Privacy",
    content: [
      "Lostbae is not directed at children under 13. We do not knowingly collect data from anyone under 13. If you believe we have inadvertently done so, contact us and we will delete it promptly.",
    ],
  },
  {
    title: "Changes to This Policy",
    content: [
      "We may update this policy periodically. We will notify you of material changes by email or by a notice within the app. Continued use of Lostbae after changes constitutes acceptance.",
    ],
  },
  {
    title: "Contact Us",
    content: [
      "For privacy questions, data requests, or to exercise your rights (access, correction, deletion), email us at: support@lostbae.com",
    ],
  },
];

export default function PrivacyPage() {
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
          <h1 className="text-3xl font-bold text-forest-slate mb-2">Privacy Policy</h1>
          <p className="text-mossy-gray text-sm">Last updated: 1 June 2025</p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-surface shadow-card p-8 space-y-10">
          <p className="text-mossy-gray leading-relaxed">
            This Privacy Policy describes how Lostbae (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) collects, uses, and
            shares information when you use lostbae.com and related services. By using Lostbae
            you agree to the practices described here.
          </p>

          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold text-forest-slate mb-4 pb-2 border-b border-border/50">
                {section.title}
              </h2>
              <ul className="space-y-3">
                {section.content.map((item, i) => (
                  <li key={i} className="text-sm text-mossy-gray leading-relaxed">
                    {item.split(/\*\*(.+?)\*\*/).map((part, j) =>
                      j % 2 === 1 ? (
                        <strong key={j} className="font-semibold text-forest-slate">
                          {part}
                        </strong>
                      ) : (
                        part
                      )
                    )}
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
            <Link href="/privacy" className="text-state-today font-medium">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-forest-slate transition-colors">Terms of Service</Link>
            <a href="mailto:support@lostbae.com" className="hover:text-forest-slate transition-colors">Contact</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
