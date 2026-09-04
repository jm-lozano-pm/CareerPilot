import { z } from "zod";
import { hiddenEntryIdSet, isSectionVisible, visibleEntries } from "@/lib/cv-visibility";
import { formatLanguages, normaliseLanguages } from "@/lib/languages";
import { certificationNames } from "@/lib/certifications";

/**
 * Client-safe AI contracts and deterministic calculations.
 *
 * The model never produces numbers: it returns structured evidence only and
 * CareerPilot code calculates every score below.
 */

export const MATCH_DISCLAIMER =
  "CareerPilot assessment based on the selected CV and job description. It is not an employer ATS score or prediction of interview, offer or hiring outcome.";

export const IMPORT_MESSAGES = {
  inaccessible: "We couldn't access this job page. You can still add the job manually.",
  unreadable:
    "We found the page but couldn't reliably identify the job details. Review or complete the fields manually.",
  partial: "Some details couldn't be identified. Review the imported information before saving.",
  notJob: "This page doesn't appear to contain a clear job posting. You can still enter the opportunity manually.",
} as const;

/* ------------------------------------------------------------------ import */

export const FIELD_STATUSES = ["extracted", "uncertain", "missing"] as const;

const extractedField = z.object({
  value: z.string().nullable(),
  status: z.enum(FIELD_STATUSES),
});

export const jobExtractionSchema = z.object({
  page_type: z.enum(["job_posting", "uncertain", "not_job_posting"]),
  job_title: extractedField,
  company: extractedField,
  description: extractedField,
  location: extractedField,
  employment_type: extractedField,
  missing_fields: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
});
export type JobExtraction = z.infer<typeof jobExtractionSchema>;

export type ImportResult =
  | { ok: true; extraction: JobExtraction; source: string; notice: string | null }
  | { ok: false; reason: "inaccessible"; message: string };

/* ------------------------------------------------------------------- match */

export const REQUIREMENT_TYPES = [
  "skill",
  "experience",
  "education",
  "language",
  "certification",
  "domain",
  "location",
  "salary",
  "schedule",
  "employment_type",
  "work_authorisation",
  "other",
] as const;

/** Only these requirement types feed the numeric calculation. */
export const SCORABLE_TYPES = ["skill", "experience", "education", "language", "certification", "domain"] as const;

export const EVIDENCE_STATES = ["evidenced", "partial", "not_evidenced"] as const;

export const matchRequirementSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  importance: z.enum(["required", "preferred", "unscored"]),
  type: z.enum(REQUIREMENT_TYPES),
  evidence_state: z.enum(EVIDENCE_STATES),
  evidence_refs: z.array(z.string()).default([]),
  evidence_note: z.string().default(""),
});
export type MatchRequirement = z.infer<typeof matchRequirementSchema>;

export const matchAnalysisSchema = z.object({
  requirements: z.array(matchRequirementSchema).max(40).default([]),
  terminology_opportunities: z
    .array(z.object({ term: z.string().min(1), reason: z.string().default("") }))
    .max(12)
    .default([]),
  uncertainties: z.array(z.string()).max(12).default([]),
});
export type MatchAnalysis = z.infer<typeof matchAnalysisSchema>;

const WEIGHTS = { required: 3, preferred: 1 } as const;
const FACTORS = { evidenced: 1, partial: 0.5, not_evidenced: 0 } as const;

export function scorableRequirements(analysis: MatchAnalysis): MatchRequirement[] {
  return analysis.requirements.filter(
    (req) =>
      (req.importance === "required" || req.importance === "preferred") &&
      (SCORABLE_TYPES as readonly string[]).includes(req.type),
  );
}

/**
 * Deterministic score. Returns null when fewer than three scorable
 * requirements exist — a number would not be reliable.
 */
export function calculateMatchScore(analysis: MatchAnalysis): {
  score: number | null;
  scorableCount: number;
} {
  const scorable = scorableRequirements(analysis);
  if (scorable.length < 3) return { score: null, scorableCount: scorable.length };
  let weighted = 0;
  let total = 0;
  for (const req of scorable) {
    const weight = WEIGHTS[req.importance as "required" | "preferred"];
    total += weight;
    weighted += weight * FACTORS[req.evidence_state];
  }
  if (total === 0) return { score: null, scorableCount: scorable.length };
  return { score: Math.round((weighted / total) * 100), scorableCount: scorable.length };
}

export function matchScoreLabel(score: number): string {
  if (score >= 80) return "Strong documented alignment";
  if (score >= 65) return "Good documented alignment";
  if (score >= 50) return "Mixed documented alignment";
  return "Limited documented alignment";
}

export const NOT_ENOUGH_REQUIREMENTS =
  "Not enough explicit job requirements for a reliable Match Score.";

export type MatchBreakdown = {
  score: number | null;
  scorable_count: number;
  requirements: MatchRequirement[];
};

export type MatchExplanation = {
  terminology_opportunities: MatchAnalysis["terminology_opportunities"];
  uncertainties: string[];
  cv_id: string;
  cv_name: string;
  generated_at: string;
};

/* ------------------------------------------------------------- opportunity */

const titled = z.object({ title: z.string().min(1), explanation: z.string().default("") });

export const opportunityAnalysisSchema = z.object({
  alignment: z
    .array(z.object({ title: z.string().min(1), explanation: z.string().default(""), evidence_refs: z.array(z.string()).default([]) }))
    .max(4)
    .default([]),
  possible_gaps: z
    .array(
      z.object({
        title: z.string().min(1),
        explanation: z.string().default(""),
        status: z.enum(["not_evidenced", "partial", "uncertain"]),
      }),
    )
    .max(4)
    .default([]),
  goal_considerations: z.array(titled).max(3).default([]),
  effort_considerations: z.array(titled).max(3).default([]),
  uncertainties: z.array(titled).max(3).default([]),
  recommendations: z
    .array(z.object({ title: z.string().min(1), rationale: z.string().default("") }))
    .max(3)
    .default([]),
});
export type OpportunityAnalysis = z.infer<typeof opportunityAnalysisSchema>;

export type OpportunityContextRefs = {
  job_id: string;
  job_content_version: number;
  profile_updated_at: string | null;
  goals_updated_at: string | null;
  cv_id: string | null;
  cv_content_version: number | null;
  generated_at: string;
};

/* --------------------------------------------------------------- tailoring */

/**
 * Tailoring output contract.
 *
 * The model may only return wording. Every protected professional fact —
 * employers, role titles, dates, education, certifications, languages,
 * skills membership, metrics and credentials — is copied from the source CV
 * and can never be expressed in model output. Experience items therefore
 * reference an immutable source entry id and carry revised bullets only.
 *
 * `.strict()` is deliberate: if the model tries to emit an identity field
 * (role, organisation, dates …) the whole draft is rejected and nothing is
 * persisted.
 */
export const tailoredExperienceSchema = z
  .object({
    id: z.string().min(1),
    bullets: z.array(z.string().max(600)).max(12).default([]),
  })
  .strict();

export const tailoredCvSchema = z
  .object({
    targetTitle: z.string().max(160).optional(),
    summary: z.string().max(3000).optional(),
    skills: z.array(z.string().max(120)).max(60).optional(),
    experience: z.array(tailoredExperienceSchema).max(20).optional(),
  })
  .strict();
export type TailoredCvDraft = z.infer<typeof tailoredCvSchema>;

export const TAILOR_REJECTED =
  "The tailored draft changed or introduced details that aren't in your CV, so nothing was saved. You can try again.";

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const asStrings = (value: unknown): string[] => asArray(value).filter((v): v is string => typeof v === "string");
const asText = (value: unknown): string => (typeof value === "string" ? value : "");
const isRow = (row: unknown): row is Record<string, unknown> => typeof row === "object" && row !== null;
type EntryRow = Record<string, unknown>;

export function normaliseFact(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export function numericTokens(value: string): string[] {
  return value.match(/\d+(?:[.,]\d+)?/g) ?? [];
}

/**
 * Builds the CV evidence sent to the model. Contact details, hidden sections
 * and individually hidden entries (P1.5) are excluded — they never enter model
 * context, for Match, Tailoring or Opportunity Analysis.
 */
export function visibleCvEvidence(cv: {
  content: Record<string, unknown>;
  visibility: Record<string, unknown>;
}): { text: string; substantive: boolean } {
  const c = cv.content ?? {};
  const v = cv.visibility ?? {};
  const parts: string[] = [];
  let weight = 0;

  if (isSectionVisible(v, "targetTitle") && asText(c["targetTitle"])) {
    parts.push(`TARGET TITLE: ${asText(c["targetTitle"])}`);
  }
  if (isSectionVisible(v, "summary") && asText(c["summary"])) {
    parts.push(`SUMMARY: ${asText(c["summary"])}`);
    weight += 1;
  }
  {
    const rows = visibleEntries(v, "experience", asArray(c["experience"]).filter(isRow) as EntryRow[]);
    if (rows.length > 0) {
      weight += 2;
      parts.push(
        "EXPERIENCE:\n" +
          rows
            .map((row) => {
              const bullets = asStrings(row["bullets"]).map((b) => `  - ${b}`).join("\n");
              return `- [experience:${asText(row["id"])}] ${asText(row["role"])} at ${asText(row["organisation"])} (${asText(row["startDate"])}–${row["current"] === true ? "Present" : asText(row["endDate"])})${bullets ? `\n${bullets}` : ""}`;
            })
            .join("\n"),
      );
    }
  }
  {
    const rows = visibleEntries(v, "education", asArray(c["education"]).filter(isRow) as EntryRow[]);
    if (rows.length > 0) {
      weight += 1;
      parts.push(
        "EDUCATION:\n" +
          rows
            .map(
              (row) =>
                `- [education:${asText(row["id"])}] ${asText(row["qualification"])}, ${asText(row["institution"])} (${asText(row["startDate"])}–${row["current"] === true ? "Present" : asText(row["endDate"])})`,
            )
            .join("\n"),
      );
    }
  }
  {
    const rows = visibleEntries(v, "projects", asArray(c["projects"]).filter(isRow) as EntryRow[]);
    if (rows.length > 0) {
      parts.push(
        "PROJECTS:\n" +
          rows
            .map((row) => `- [projects:${asText(row["id"])}] ${asText(row["name"])}: ${asText(row["description"])}`)
            .join("\n"),
      );
    }
  }
  {
    const rows = visibleEntries(v, "volunteering", asArray(c["volunteering"]).filter(isRow) as EntryRow[]);
    if (rows.length > 0) {
      parts.push(
        "VOLUNTEERING:\n" +
          rows
            .map(
              (row) =>
                `- [volunteering:${asText(row["id"])}] ${asText(row["role"])}, ${asText(row["organisation"])}: ${asText(row["description"])}`,
            )
            .join("\n"),
      );
    }
  }
  if (isSectionVisible(v, "languages")) {
    const values = formatLanguages(normaliseLanguages(c["languages"]));
    if (values.length > 0) parts.push(`LANGUAGES: ${values.join(", ")}`);
  }
  if (isSectionVisible(v, "skills")) {
    const values = asStrings(c["skills"]);
    if (values.length > 0) {
      weight += 1;
      parts.push(`SKILLS: ${values.join(", ")}`);
    }
  }
  if (isSectionVisible(v, "certifications")) {
    // Names only: a credential URL is user-supplied text and never enters
    // model context, so it can never act as an instruction.
    const values = certificationNames(c["certifications"]);
    if (values.length > 0) parts.push(`CERTIFICATIONS: ${values.join(", ")}`);
  }

  return { text: parts.join("\n\n"), substantive: weight >= 2 };
}


export class TailoringRejected extends Error {
  constructor(public readonly rule: string) {
    super(TAILOR_REJECTED);
    this.name = "TailoringRejected";
  }
}

/**
 * Deterministic merge. Protected facts are copied byte-for-byte from the
 * source CV; hidden sections and contact details are never touched. Throws
 * `TailoringRejected` when the draft cannot be mapped safely — the caller
 * must then persist nothing.
 */
export function mergeTailoredCv(
  source: Record<string, unknown>,
  visibility: Record<string, unknown>,
  draft: TailoredCvDraft,
): Record<string, unknown> {
  const reject = (rule: string): never => {
    throw new TailoringRejected(rule);
  };

  const sourceExperience = asArray(source["experience"]).filter(isRow);
  const hiddenIds = hiddenEntryIdSet(visibility);
  // Hidden entries are not evidence: they never reach the model and cannot
  // license a fact in the merged output either.
  const visibleExperience = sourceExperience.filter((row) => !hiddenIds.has(asText(row["id"])));
  const sourceNumbers = new Set(
    numericTokens(
      JSON.stringify({
        ...source,
        experience: visibleExperience,
        education: visibleEntries(visibility, "education", asArray(source["education"]).filter(isRow) as EntryRow[]),
        projects: visibleEntries(visibility, "projects", asArray(source["projects"]).filter(isRow) as EntryRow[]),
        volunteering: visibleEntries(
          visibility,
          "volunteering",
          asArray(source["volunteering"]).filter(isRow) as EntryRow[],
        ),
      }),
    ),
  );

  const merged: Record<string, unknown> = { ...source };

  /* target title — a protected role fact: only an existing supported title */
  if (draft.targetTitle !== undefined && isSectionVisible(visibility, "targetTitle")) {
    const supported = new Map<string, string>();
    const current = asText(source["targetTitle"]);
    if (current) supported.set(normaliseFact(current), current);
    for (const row of visibleExperience) {
      const role = asText(row["role"]);
      if (role) supported.set(normaliseFact(role), role);
    }
    const match = supported.get(normaliseFact(draft.targetTitle));
    if (!match) reject("targetTitle is not an existing documented title");
    merged["targetTitle"] = match;
  }

  /* summary — rephrasing allowed, unsupported numbers are not */
  if (draft.summary !== undefined && isSectionVisible(visibility, "summary")) {
    for (const token of numericTokens(draft.summary)) {
      if (!sourceNumbers.has(token)) reject("summary introduced an unsupported number");
    }
    merged["summary"] = draft.summary;
  }

  /* skills — reorder only; membership is a protected fact */
  if (draft.skills && isSectionVisible(visibility, "skills")) {
    const sourceSkills = asStrings(source["skills"]);
    const allowed = new Map(sourceSkills.map((skill) => [normaliseFact(skill), skill]));
    const next: string[] = [];
    for (const skill of draft.skills) {
      const match = allowed.get(normaliseFact(skill));
      if (!match) reject("skills introduced an unsupported skill");
      if (!next.includes(match!)) next.push(match!);
    }
    for (const skill of sourceSkills) if (!next.includes(skill)) next.push(skill);
    merged["skills"] = next;
  }

  /* experience — identity copied exactly, bullets revised in place */
  if (draft.experience && isSectionVisible(visibility, "experience")) {
    // Only visible entries are offered to the model, so only they may be
    // revised. Hidden entries stay exactly as stored, in their original slot.
    const byId = new Map<string, Record<string, unknown>>();
    for (const row of visibleExperience) {
      const id = asText(row["id"]);
      if (id) byId.set(id, row);
    }
    if (draft.experience.length !== byId.size) reject("experience entry count does not match the source CV");

    const seen = new Set<string>();
    const revised = new Map<string, Record<string, unknown>>();
    for (const entry of draft.experience) {
      if (seen.has(entry.id)) reject("experience contained a duplicate entry id");
      seen.add(entry.id);
      const original = byId.get(entry.id);
      if (!original) reject("experience referenced an unknown entry id");

      // Metrics must come from that entry's own narrative text — dates and
      // other identity fields are not a licence to introduce numbers.
      const entryNumbers = new Set(
        numericTokens(
          [asText(original!["role"]), asText(original!["organisation"]), ...asStrings(original!["bullets"])].join(" "),
        ),
      );
      const bullets: string[] = [];
      for (const bullet of entry.bullets) {
        for (const token of numericTokens(bullet)) {
          if (!entryNumbers.has(token)) reject("a bullet introduced a metric not documented in that entry");
        }
        const text = bullet.trim();
        if (text) bullets.push(text);
      }
      // Every identity field survives exactly; only bullets are replaced.
      revised.set(entry.id, {
        ...original!,
        bullets: bullets.length > 0 ? bullets : asStrings(original!["bullets"]),
      });
    }
    if (seen.size !== byId.size) reject("experience did not reference every visible source entry exactly once");
    merged["experience"] = sourceExperience.map((row) => revised.get(asText(row["id"])) ?? row);
  }

  return merged;
}

