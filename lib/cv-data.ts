import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserId } from "@/lib/profile-data";
import { ENTRY_SECTIONS, hiddenEntryIds } from "@/lib/cv-visibility";
import { type Certification } from "@/lib/certifications";
import {
  careerContactSchema,
  careerContentSchema,
  careerEducationSchema,
  careerExperienceSchema,
  careerProjectSchema,
  careerVolunteeringSchema,
  emptyCareerContent,
  newEntryId,
  parseCareerContent,
  type CareerContent,
} from "@/lib/career-content";



/** The three locked document templates. */
export const CV_TEMPLATES = ["classic", "modern", "compact"] as const;
export type CvTemplate = (typeof CV_TEMPLATES)[number];

export const TEMPLATE_LABELS: Record<CvTemplate, string> = {
  classic: "Classic",
  modern: "Modern",
  compact: "Compact",
};

export const TEMPLATE_DESCRIPTIONS: Record<CvTemplate, string> = {
  classic: "Centred serif name and title, thin section rules, generous margins.",
  modern: "Blue header band, blue section labels with a slim accent rule.",
  compact: "Dark filled section bars and tight spacing for more content per page.",
};


/** Section keys used by both the content model and the visibility map. */
export const CV_SECTIONS = [
  "contact",
  "targetTitle",
  "summary",
  "experience",
  "education",
  "skills",
  "languages",
  "certifications",
  "projects",
  "volunteering",
  "awards",
] as const;
export type CvSection = (typeof CV_SECTIONS)[number];

export const SECTION_LABELS: Record<CvSection, string> = {
  contact: "Contact details",
  targetTitle: "Target title",
  summary: "Professional summary",
  experience: "Experience",
  education: "Education",
  skills: "Skills",
  languages: "Languages",
  certifications: "Certifications",
  projects: "Projects",
  volunteering: "Volunteering",
  awards: "Awards",
};

/**
 * The CV content model IS the shared career-content model (see
 * `@/lib/career-content`). These aliases keep the CV-facing names stable while
 * guaranteeing the Professional Profile and CV cannot drift apart.
 */
export const cvContactSchema = careerContactSchema;
export const cvExperienceSchema = careerExperienceSchema;
export const cvEducationSchema = careerEducationSchema;
export const cvProjectSchema = careerProjectSchema;
export const cvVolunteeringSchema = careerVolunteeringSchema;
export const cvContentSchema = careerContentSchema;

export type CvContent = CareerContent;


/**
 * Section booleans plus the P1.5 entry map: `hiddenEntries` holds the stable
 * IDs of individually hidden entries. Legacy rows without the key treat every
 * entry as visible.
 */
export type CvVisibility = { [K in CvSection]: boolean } & { hiddenEntries: string[] };

export const cvEditorSchema = z.object({
  name: z.string().trim().min(1, "Give this CV a name.").max(120, "Keep the name under 120 characters."),
  template: z.enum(CV_TEMPLATES),
  content: cvContentSchema,
  visibility: z.object({
    contact: z.boolean(),
    targetTitle: z.boolean(),
    summary: z.boolean(),
    experience: z.boolean(),
    education: z.boolean(),
    skills: z.boolean(),
    languages: z.boolean(),
    certifications: z.boolean(),
    projects: z.boolean(),
    volunteering: z.boolean(),
    awards: z.boolean(),
    hiddenEntries: z.array(z.string().min(1)).default([]),
  }),
});


export type CvEditorValues = z.infer<typeof cvEditorSchema>;

export type CvRecord = {
  id: string;
  name: string;
  template: CvTemplate;
  content: CvContent;
  visibility: CvVisibility;
  contentVersion: number;
  sourceCvId: string | null;
  tailoredForJobId: string | null;
  updatedAt: string;
  createdAt: string;
  /** Unknown-but-valid keys from stored content, preserved on save. */
  extraContentKeys: Record<string, unknown>;
};

export { newEntryId };

export function emptyCvContent(): CvContent {
  return emptyCareerContent();
}

export function allVisible(): CvVisibility {
  const visibility = CV_SECTIONS.reduce((acc, key) => {
    acc[key] = true;
    return acc;
  }, {} as Record<CvSection, boolean>);
  return { ...visibility, hiddenEntries: [] };
}


function isTemplate(value: unknown): value is CvTemplate {
  return typeof value === "string" && (CV_TEMPLATES as readonly string[]).includes(value);
}

function parseContent(raw: unknown): { content: CvContent; extras: Record<string, unknown> } {
  const source: Record<string, unknown> =
    typeof raw === "object" && raw !== null && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};

  const content = parseCareerContent(source);

  const known = new Set<string>(CV_SECTIONS);
  const extras: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(source)) {
    if (!known.has(key)) extras[key] = value;
  }

  return { content, extras };
}


export function parseVisibility(raw: unknown): CvVisibility {
  const source: Record<string, unknown> =
    typeof raw === "object" && raw !== null && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const sections = CV_SECTIONS.reduce((acc, key) => {
    acc[key] = source[key] === undefined ? true : source[key] !== false;
    return acc;
  }, {} as Record<CvSection, boolean>);
  return { ...sections, hiddenEntries: hiddenEntryIds(source) };
}


type CvRow = {
  id: string;
  name: string;
  template: string;
  content: unknown;
  visibility: unknown;
  content_version: number;
  source_cv_id: string | null;
  tailored_for_job_id: string | null
  created_at: string;
  updated_at: string;
};

function toRecord(row: CvRow): CvRecord {
  const { content, extras } = parseContent(row.content);
  return {
    id: row.id,
    name: row.name,
    template: isTemplate(row.template) ? row.template : "classic",
    content,
    visibility: parseVisibility(row.visibility),
    contentVersion: row.content_version,
    sourceCvId: row.source_cv_id,
    tailoredForJobId: row.tailored_for_job_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    extraContentKeys: extras,
  };
}

const SELECT =
  "id, name, template, content, visibility, content_version, source_cv_id, tailored_for_job_id, created_at, updated_at";

export const cvKeys = {
  all: ["cvs"] as const,
  detail: (id: string) => ["cvs", id] as const,
};

export async function fetchCvs(): Promise<CvRecord[]> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("cvs")
    .select(SELECT)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => toRecord(row as CvRow));
}

export async function fetchCv(id: string): Promise<CvRecord | null> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("cvs")
    .select(SELECT)
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? toRecord(data as CvRow) : null;
}

/**
 * Manual CV creation. When `content` is supplied (P1.4 profile snapshot) it is
 * inserted as an independent JSON snapshot — no shared references, no later sync.
 */
export async function createCv(input: {
  name: string;
  template: CvTemplate;
  content?: CvContent;
}): Promise<CvRecord> {
  const userId = await getCurrentUserId();
  const snapshot: CvContent = input.content
    ? (JSON.parse(JSON.stringify(input.content)) as CvContent)
    : emptyCvContent();
  const { data, error } = await supabase
    .from("cvs")
    .insert({
      user_id: userId,
      name: input.name,
      template: input.template,
      content: snapshot,
      visibility: allVisible(),
      content_version: 1,
      source_cv_id: null,
      tailored_for_job_id: null,
    })
    .select(SELECT)
    .single();
  if (error) throw error;
  return toRecord(data as CvRow);
}


export async function duplicateCv(cv: CvRecord): Promise<CvRecord> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("cvs")
    .insert({
      user_id: userId,
      name: `Copy of ${cv.name}`.slice(0, 120),
      template: cv.template,
      content: { ...cv.extraContentKeys, ...cv.content },
      visibility: cv.visibility,
      content_version: 1,
      source_cv_id: cv.id,
      tailored_for_job_id: null,
    })
    .select(SELECT)
    .single();
  if (error) throw error;
  return toRecord(data as CvRow);
}

export async function deleteCv(id: string): Promise<void> {
  const userId = await getCurrentUserId();
  const { error } = await supabase.from("cvs").delete().eq("user_id", userId).eq("id", id);
  if (error) throw error;
}

/**
 * Normalises the entry map before comparison/persistence: IDs are sorted and
 * IDs of entries that no longer exist in content are dropped, so the map cannot
 * grow unbounded when an entry is genuinely removed.
 */
export function normaliseVisibility(content: CvContent, visibility: CvVisibility): CvVisibility {
  const known = new Set<string>();
  for (const section of ENTRY_SECTIONS) {
    for (const row of content[section]) known.add(row.id);
  }
  return {
    ...visibility,
    hiddenEntries: hiddenEntryIds(visibility)
      .filter((id) => known.has(id))
      .sort(),
  };
}

/**
 * Content or visibility changes — including hiding or restoring a single entry,
 * which is an evidence change — bump content_version. Name/template do not.
 */
export function contentOrVisibilityChanged(current: CvRecord, values: CvEditorValues): boolean {
  return (
    JSON.stringify(current.content) !== JSON.stringify(values.content) ||
    JSON.stringify(normaliseVisibility(current.content, current.visibility)) !==
      JSON.stringify(normaliseVisibility(values.content, values.visibility))
  );
}

export async function saveCv(current: CvRecord, values: CvEditorValues): Promise<CvRecord> {
  const userId = await getCurrentUserId();
  const bump = contentOrVisibilityChanged(current, values);
  const { data, error } = await supabase
    .from("cvs")
    .update({
      name: values.name,
      template: values.template,
      content: { ...current.extraContentKeys, ...values.content },
      visibility: normaliseVisibility(values.content, values.visibility),
      content_version: bump ? current.contentVersion + 1 : current.contentVersion,
    })

    .eq("user_id", userId)
    .eq("id", current.id)
    .select(SELECT)
    .single();
  if (error) throw error;
  return toRecord(data as CvRow);
}

export function safeFileName(name: string): string {
  const cleaned = name
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  return (cleaned || "cv").slice(0, 60);
}

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/**
 * Presentation-only: stored month values stay `YYYY-MM`, documents show an
 * English month label. Anything else is printed verbatim.
 */
function formatMonthYear(value: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(value.trim());
  if (!match) return value.trim();
  const month = Number(match[2]);
  if (month < 1 || month > 12) return value.trim();
  return `${MONTH_LABELS[month - 1]} ${match[1]}`;
}

export function formatDateRange(startDate: string, endDate: string, current: boolean): string {
  const end = current ? "Present" : formatMonthYear(endDate);
  const start = formatMonthYear(startDate);
  if (start && end) return `${start} — ${end}`;
  return start || end;
}


export function formatUpdatedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
