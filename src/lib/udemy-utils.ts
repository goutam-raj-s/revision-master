/**
 * Udemy URL utility functions — safe to import from client and server.
 */

export interface UdemyCourseInfo {
  courseSlug: string;
  lectureId?: string;
}

/**
 * Parse a Udemy URL and extract the course slug and optional lecture ID.
 * Supports URLs like:
 *  - https://www.udemy.com/course/course-slug/
 *  - https://www.udemy.com/course/course-slug/learn/lecture/12345678/
 */
export function parseUdemyUrl(url: string): UdemyCourseInfo | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("udemy.com")) return null;

    // Match /course/<slug>
    const courseMatch = u.pathname.match(/\/course\/([^/]+)/);
    if (!courseMatch) return null;

    const courseSlug = courseMatch[1];

    // Match /learn/lecture/<id>
    const lectureMatch = u.pathname.match(/\/learn\/lecture\/(\d+)/);
    const lectureId = lectureMatch ? lectureMatch[1] : undefined;

    return { courseSlug, lectureId };
  } catch {
    return null;
  }
}

export function isUdemyUrl(url: string): boolean {
  return parseUdemyUrl(url) !== null;
}

/**
 * Build a normalised Udemy course URL from a slug.
 */
export function buildUdemyCourseUrl(courseSlug: string): string {
  return `https://www.udemy.com/course/${courseSlug}/`;
}

/**
 * Build a Udemy lecture URL.
 */
export function buildUdemyLectureUrl(courseSlug: string, lectureId: string): string {
  return `https://www.udemy.com/course/${courseSlug}/learn/lecture/${lectureId}/`;
}

/**
 * Derive a human-readable title from the slug as a fallback.
 * e.g. "the-complete-react-developer-course" → "The Complete React Developer Course"
 */
export function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
