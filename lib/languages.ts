import { z } from "zod";

/**
 * Structured language proficiency (P2.4).
 *
 * Proficiency is a plain text label — never a star, bar or numeric rating.
 * Legacy free-text language rows are normalised, never discarded.
 */
export const LANGUAGE_PROFICIENCIES = [
  "Native / bilingual",
  "Full professional",
  "Professional working",
  "Limited working",
  "Elementary",
] as const;

export type LanguageProficiency = (typeof LANGUAGE_PROFICIENCIES)[number];

export const languageEntrySchema = z.object({
  language: z.string().trim().min(1, "Language cannot be empty."),
  /** Empty string means the user has not stated a proficiency. */
  proficiency: z
    .union([z.enum(LANGUAGE_PROFICIENCIES), z.literal("")])
    .default(""),
});

export type LanguageEntry = z.infer<typeof languageEntrySchema>;

function matchProficiency(value: string): LanguageProficiency | "" {
  const needle = value.toLowerCase().replace(/\s+/g, " ").trim();
  return (
    LANGUAGE_PROFICIENCIES.find((label) => label.toLowerCase() === needle) ?? ""
  );
}

/**
 * Accepts the current structured shape and any legacy string shape, including
 * strings the user already wrote as "Spanish — Full professional".
 */
export function normaliseLanguage(value: unknown): LanguageEntry | null {
  if (typeof value === "string") {
    const raw = value.trim();
    if (!raw) return null;
    const separator = raw.match(/\s+[—–\-|:]\s+|\s*\(([^)]*)\)\s*$/);
    if (separator) {
      const parenthetical = separator[1];
      if (parenthetical !== undefined) {
        const proficiency = matchProficiency(parenthetical);
        const language = raw.slice(0, separator.index).trim();
        if (proficiency && language) return { language, proficiency };
      } else {
        const language = raw.slice(0, separator.index).trim();
        const tail = raw.slice((separator.index ?? 0) + separator[0].length).trim();
        const proficiency = matchProficiency(tail);
        if (proficiency && language) return { language, proficiency };
      }
    }
    return { language: raw, proficiency: "" };
  }
  if (typeof value === "object" && value !== null) {
    const row = value as Record<string, unknown>;
    const language = typeof row["language"] === "string" ? row["language"].trim() : "";
    if (!language) return null;
    const proficiency =
      typeof row["proficiency"] === "string" ? matchProficiency(row["proficiency"]) : "";
    return { language, proficiency };
  }
  return null;
}

export function normaliseLanguages(value: unknown): LanguageEntry[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(normaliseLanguage)
    .filter((entry): entry is LanguageEntry => entry !== null);
}

/** Display / print / evidence text for one language. */
export function formatLanguage(entry: LanguageEntry): string {
  return entry.proficiency ? `${entry.language} — ${entry.proficiency}` : entry.language;
}

export function formatLanguages(entries: LanguageEntry[]): string[] {
  return entries.filter((entry) => entry.language.trim()).map(formatLanguage);
}
