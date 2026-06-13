export interface UseCase {
  slug: string;
  /** H1 / hero headline. */
  headline: string;
  /** Short audience label, e.g. "DSA & coding interviews". */
  audience: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  /** 3 benefit bullets. */
  benefits: { title: string; body: string }[];
}

export const USE_CASES: UseCase[] = [
  {
    slug: "coding-interviews",
    audience: "DSA & coding interviews",
    headline: "Spaced Repetition for Coding Interviews",
    metaTitle: "Spaced Repetition for Coding Interviews & DSA",
    metaDescription:
      "Stop re-solving the same problems. Use spaced repetition to actually remember data structures, algorithms and patterns for your coding interviews.",
    intro:
      "You grind LeetCode, understand the solution, then forget the pattern two weeks later. lostbae turns your problem notes into a spaced-repetition queue so the patterns stick when it counts.",
    benefits: [
      { title: "Remember patterns, not just problems", body: "Review the underlying technique at the right intervals so you recognize it in unseen problems." },
      { title: "Turn notes into recall", body: "Your problem write-ups become active-recall cards instead of dead documents." },
      { title: "Show up prepared", body: "Daily review reminders keep your prep consistent in the weeks before interviews." },
    ],
  },
  {
    slug: "medical-students",
    audience: "medical school",
    headline: "Spaced Repetition for Medical Students",
    metaTitle: "Spaced Repetition for Medical Students",
    metaDescription:
      "Medicine is a memory marathon. Use spaced repetition to retain high-volume material across years of study and clinical rotations.",
    intro:
      "There's simply too much to hold in your head with cramming. lostbae schedules your notes and lecture material for review at the optimal moments, so high-yield facts stay accessible for exams and the wards.",
    benefits: [
      { title: "Handle the volume", body: "Spaced reviews make long-term retention of huge syllabi realistic, not heroic." },
      { title: "Integrate any source", body: "Lecture notes, Google Docs, and YouTube lectures all live in one review queue." },
      { title: "Never lose a topic", body: "Status tracking surfaces your least-revised areas before they fade." },
    ],
  },
  {
    slug: "language-learning",
    audience: "language learning",
    headline: "Spaced Repetition for Language Learning",
    metaTitle: "Spaced Repetition for Language Learning",
    metaDescription:
      "Vocabulary and grammar are forgotten without timed review. Use spaced repetition to build durable language memory.",
    intro:
      "Languages are the classic spaced-repetition use case: vocab and grammar need repeated, well-timed exposure. lostbae turns your word lists and notes into a review schedule that fits real life.",
    benefits: [
      { title: "Vocabulary that sticks", body: "Review words right before you'd forget them to lock them into long-term memory." },
      { title: "Bring your own material", body: "Notes, docs and video lessons become recall practice, not passive consumption." },
      { title: "Build a daily habit", body: "Streaks and reminders keep the most important learning ritual consistent." },
    ],
  },
  {
    slug: "youtube",
    audience: "learning from YouTube",
    headline: "Remember What You Learn on YouTube",
    metaTitle: "Spaced Repetition for YouTube Learning",
    metaDescription:
      "You watch hours of tutorials and remember almost none of it. Turn YouTube lessons into timestamped notes with spaced-repetition review.",
    intro:
      "Watching a tutorial isn't learning — it feels productive but fades fast. lostbae lets you take timestamped notes on any YouTube video and schedules them for spaced review so the lessons actually stick.",
    benefits: [
      { title: "Timestamped notes", body: "Capture insights at the exact moment in the video, then review them later." },
      { title: "From passive to active", body: "Convert watch time into recall practice that builds real memory." },
      { title: "Playlists too", body: "Work through whole course playlists and keep every lesson in your review queue." },
    ],
  },
];
