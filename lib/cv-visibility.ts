/**
 * Single source of truth for CV visibility rules (P1.5).
 *
 * Storage: the existing `cvs.visibility` JSON keeps its section booleans and
 * gains one backward-compatible key, `hiddenEntries` — an array of stable entry
 * IDs that are hidden. A CV with no `hiddenEntries` key therefore treats every
 * entry as visible, and no new table is required.
 *
 * Every consumer (Preview, Print/PDF, Match, Tailoring, Opportunity Analysis)
 * must use these helpers so one rule governs "visible evidence".
 */

/** Sections that support per-entry Hide / Restore. */
export const ENTRY_SECTIONS = ["experience", "education", "projects", "volunteering"] as const;
export type EntrySection = (typeof ENTRY_SECTIONS)[number];

export const ENTRY_SECTION_NOUN: Record<EntrySection, string> = {
  experience: "experience entry",
  education: "education entry",
  projects: "project",
  volunteering: "volunteering entry",
};

export type EntryLike = { id?: unknown };

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/** Tolerant reader: accepts a parsed visibility object or raw stored JSON. */
export function hiddenEntryIds(visibility: unknown): string[] {
  const raw = asRecord(visibility)["hiddenEntries"];
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const value of raw) {
    if (typeof value === "string" && value.trim() && !out.includes(value)) out.push(value);
  }
  return out;
}

export function hiddenEntryIdSet(visibility: unknown): Set<string> {
  return new Set(hiddenEntryIds(visibility));
}

/** Legacy-safe: a missing section key means visible. */
export function isSectionVisible(visibility: unknown, section: string): boolean {
  const value = asRecord(visibility)[section];
  return value === undefined ? true : value !== false;
}

/** An entry is visible when its section is visible and it is not hidden. */
export function isEntryVisible(visibility: unknown, section: string, entryId: unknown): boolean {
  if (!isSectionVisible(visibility, section)) return false;
  if (typeof entryId !== "string" || !entryId) return true;
  return !hiddenEntryIdSet(visibility).has(entryId);
}

/**
 * Filters entry rows for a section. A hidden section excludes every entry
 * regardless of individual entry state.
 */
export function visibleEntries<T extends EntryLike>(visibility: unknown, section: string, rows: T[]): T[] {
  if (!isSectionVisible(visibility, section)) return [];
  const hidden = hiddenEntryIdSet(visibility);
  return rows.filter((row) => !(typeof row.id === "string" && hidden.has(row.id)));
}

/** Pure toggle used by the editor; returns a new, sorted, de-duplicated list. */
export function withEntryHidden(hidden: string[], entryId: string, isHidden: boolean): string[] {
  const set = new Set(hidden.filter((id) => typeof id === "string" && id));
  if (isHidden) set.add(entryId);
  else set.delete(entryId);
  return [...set].sort();
}
