import { z } from "zod";
import { safeHref } from "@/lib/links";

/**
 * Certifications used to be bare strings. They are now `{ name, url }`, and
 * legacy strings normalise to `{ name, url: "" }` without data loss. Stored
 * URLs are re-validated on read so an unsafe value can never be rendered as a
 * link or forwarded into AI evidence.
 */

export const certificationSchema = z.object({
  name: z.string().trim().min(1, "Add a certification name.").max(160, "Keep the name under 160 characters."),
  url: z.string().trim().max(2048, "That link is too long.").default(""),
});

export type Certification = z.infer<typeof certificationSchema>;

export function normaliseCertifications(value: unknown): Certification[] {
  if (!Array.isArray(value)) return [];
  const out: Certification[] = [];
  for (const item of value) {
    if (typeof item === "string") {
      const name = item.trim();
      if (name) out.push({ name, url: "" });
      continue;
    }
    if (typeof item === "object" && item !== null) {
      const row = item as Record<string, unknown>;
      const name = typeof row["name"] === "string" ? row["name"].trim() : "";
      if (!name) continue;
      const rawUrl = typeof row["url"] === "string" ? row["url"].trim() : "";
      out.push({ name, url: rawUrl && safeHref(rawUrl) ? rawUrl : "" });
    }
  }
  return out;
}

/** Names only — credential URLs are never sent to a model as instructions. */
export function certificationNames(value: unknown): string[] {
  return normaliseCertifications(value).map((entry) => entry.name);
}
