export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string; // ISO
  author: string;
  tags: string[];
  /** Markdown body. */
  content: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "what-is-spaced-repetition",
    title: "What Is Spaced Repetition (and Why It Works)",
    description:
      "A plain-English guide to spaced repetition — the science-backed study method that helps you remember more by reviewing at the right moments.",
    date: "2026-06-01",
    author: "lostbae",
    tags: ["spaced repetition", "learning science", "study tips"],
    content: `
Most of what you read, you forget. Not because you're a bad learner — because of how memory works. Within a day, the **forgetting curve** wipes out a huge chunk of new information unless you do something about it.

Spaced repetition is the something.

## The core idea

Instead of cramming everything at once, you review material at **increasing intervals** — say after 1 day, then 3 days, then a week, then a month. Each well-timed review resets the forgetting curve and makes the memory more durable.

The magic is in the timing: you review *just before* you'd otherwise forget. That moment of effortful recall is what strengthens the memory.

## Why it beats re-reading

Re-reading feels productive but it's mostly an illusion of competence — the words look familiar, so you assume you know them. Spaced repetition forces **active recall**: you retrieve the answer from memory, which is far more effective than passively recognizing it.

> Decades of cognitive-science research consistently rank spaced practice and retrieval practice among the most effective study techniques.

## How to actually use it

1. **Capture** what you want to remember — notes, docs, video lessons.
2. **Schedule** the first review a couple of days out.
3. **Review** when prompted, and rate how well you recalled it.
4. **Repeat** at growing intervals until it sticks.

The hard part is the scheduling and showing up — which is exactly what a tool like [lostbae](/) automates: it turns your Google Docs, notes and YouTube lessons into a review queue and reminds you at the optimal time.

## The takeaway

You don't need more study hours. You need *better-timed* ones. Spaced repetition is the highest-leverage change most learners can make.
`,
  },
  {
    slug: "active-recall-vs-rereading",
    title: "Active Recall vs Re-reading: Why One Wins",
    description:
      "Re-reading is the most popular study method and one of the least effective. Here's why active recall beats it — and how to switch.",
    date: "2026-06-05",
    author: "lostbae",
    tags: ["active recall", "study tips", "memory"],
    content: `
If you highlight, re-read, and review your notes — and still blank out in the exam or the meeting — you're not alone. The problem is the *method*, not your memory.

## The recognition trap

When you re-read, the material feels easy. That feeling is **recognition**, not **recall**. Recognizing something ("yeah, I've seen this") is much weaker than being able to produce it from a blank page.

## What active recall is

Active recall means closing the book and **retrieving** the answer:

- Turning a heading into a question and answering it.
- Explaining a concept out loud without looking.
- Quizzing yourself with flashcards.

Every time you successfully pull something from memory, you make it easier to pull next time. The struggle is the point.

## A simple switch

Next time you finish reading something:

1. Cover the text.
2. Write down everything you remember.
3. Check what you missed — *those gaps* are your real study material.

Pair active recall with [spaced repetition](/blog/what-is-spaced-repetition) and you get the two highest-impact study techniques working together. That combination is the backbone of how lostbae schedules your reviews.
`,
  },
  {
    slug: "remember-what-you-read-in-google-docs",
    title: "How to Actually Remember What You Read in Google Docs",
    description:
      "Your Google Docs are full of notes you never revisit. Here's a system to turn scattered docs into knowledge you retain.",
    date: "2026-06-10",
    author: "lostbae",
    tags: ["Google Docs", "note-taking", "knowledge management"],
    content: `
You take notes in Google Docs. You write them once. You never open them again. Sound familiar?

Notes you don't revisit are just an expensive way to feel productive. Here's how to fix that.

## The problem with "write once" notes

Capturing information is only step one. Memory needs **retrieval over time** — and a folder of docs gives you no nudge to come back. Out of sight, out of mind, out of memory.

## A retention system for your docs

1. **Centralize** your docs so they're in one reviewable place instead of scattered across folders.
2. **Tag** them by topic so related ideas cluster together.
3. **Schedule reviews** — the first a few days after writing, then spaced further out.
4. **Recall, don't re-read** — when a doc comes up for review, try to summarize it before opening.

## Make the system automatic

The reason most people don't do this is friction. Manually tracking what to review and when is tedious, so it doesn't happen.

[lostbae](/) removes the friction: connect your Google Docs, and each one becomes a card in a spaced-repetition queue with reminders, status tracking, and quick review. The same works for [YouTube lessons](/for/youtube) and your own notes.

## Bottom line

The value of a note isn't in writing it — it's in remembering it. Give your docs a review schedule and they finally start paying off.
`,
  },
];
