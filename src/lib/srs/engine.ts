import type { Difficulty } from "@/types";

// Simple spaced repetition intervals based on difficulty and review count
// Phase 1: simple exponential-ish intervals, no SM-2 complexity
const BASE_INTERVALS: Record<Difficulty, number[]> = {
  easy:   [2, 5, 10, 21, 45, 90],
  medium: [2, 4, 7,  14, 30, 60],
  hard:   [1, 3, 5,  10, 20, 40],
};

/**
 * Calculate the next interval (in days) based on difficulty and how many times
 * the document has been reviewed.
 */
export function getNextInterval(difficulty: Difficulty, reviewCount: number): number {
  const intervals = BASE_INTERVALS[difficulty];
  const idx = Math.min(reviewCount, intervals.length - 1);
  return intervals[idx];
}

/**
 * Calculate the next review date given difficulty and current review count.
 */
export function getNextReviewDate(difficulty: Difficulty, reviewCount: number): Date {
  const intervalDays = getNextInterval(difficulty, reviewCount);
  const next = new Date();
  next.setDate(next.getDate() + intervalDays);
  next.setHours(0, 0, 0, 0);
  return next;
}

/**
 * Calculate a custom next review date (user-specified +N days from today).
 */
export function getCustomNextReviewDate(daysFromNow: number): Date {
  const next = new Date();
  next.setDate(next.getDate() + daysFromNow);
  next.setHours(0, 0, 0, 0);
  return next;
}
