import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserId } from "@/lib/profile-data";

/** Board columns, in locked order. */
export const BOARD_STATUSES = [
  "saved",
  "applied",
  "interview",
  "offer",
  "rejected",
  "withdrawn",
  "closed",
] as const;
export type BoardStatus = (typeof BOARD_STATUSES)[number];

export const BOARD_LABELS: Record<BoardStatus, string> = {
  saved: "Saved",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
  closed: "Closed",
};

export const APPLICATION_STATUSES = [
  "applied",
  "interview",
  "offer",
  "rejected",
  "withdrawn",
  "closed",
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const OUTCOMES = [
  "offer_accepted",
  "offer_declined",
  "rejected",
  "withdrawn",
  "closed",
] as const;
export type Outcome = (typeof OUTCOMES)[number];

export const OUTCOME_LABELS: Record<Outcome, string> = {
  offer_accepted: "Offer accepted",
  offer_declined: "Offer declined",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
  closed: "Closed",
};

/**
 * Backend transition matrix, mirrored for immediate user feedback.
 *
 * Active stages (Applied, Interview, Offer) may be corrected in either
 * direction — a mis-recorded Interview can go back to Applied (P2.7). Every
 * correction appends a status-history row; history is never rewritten.
 * Terminal states are always reached through the outcome flow.
 */
const ALLOWED_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  applied: ["interview", "offer", "rejected", "withdrawn", "closed"],
  interview: ["applied", "offer", "rejected", "withdrawn", "closed"],
  offer: ["applied", "interview", "rejected", "withdrawn", "closed"],
  rejected: [],
  withdrawn: [],
  closed: [],
};

export const TERMINAL_STATUSES: ApplicationStatus[] = ["rejected", "withdrawn", "closed"];

export function isTerminal(status: ApplicationStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

export type MoveKind =
  | { kind: "record-application" }
  | { kind: "transition"; to: ApplicationStatus }
  | { kind: "record-outcome"; to: Extract<ApplicationStatus, "rejected" | "withdrawn" | "closed"> }
  | { kind: "noop" }
  | { kind: "invalid"; reason: string };

/** Decides what a drag from one column to another means. */
export function planMove(job: JobRecord, to: BoardStatus): MoveKind {
  const app = job.application;
  if (to === "saved") {
    return {
      kind: "invalid",
      reason: app
        ? "Saved is not an application status. A job with an application cannot go back to Saved."
        : "This job is already saved.",
    };
  }
  if (!app) {
    if (to === "applied") return { kind: "record-application" };
    return {
      kind: "invalid",
      reason: "Record the application first — a saved job has to move to Applied before anything else.",
    };
  }
  if (app.currentStatus === to) return { kind: "noop" };
  if (isTerminal(app.currentStatus)) {
    return {
      kind: "invalid",
      reason: `This application is already ${BOARD_LABELS[app.currentStatus].toLowerCase()} and cannot be changed.`,
    };
  }
  if (!ALLOWED_TRANSITIONS[app.currentStatus].includes(to)) {
    return {
      kind: "invalid",
      reason: `An application in ${BOARD_LABELS[app.currentStatus]} cannot move straight to ${BOARD_LABELS[to]}.`,
    };
  }
  if (to === "rejected" || to === "withdrawn" || to === "closed") {
    return { kind: "record-outcome", to };
  }
  return { kind: "transition", to };
}


/**
 * Canonical employment/contract vocabulary shared by Jobs and Career Goals.
 * Stored jobs keep whatever value they already hold — nothing is rewritten.
 */
export const EMPLOYMENT_TYPES = [
  "Full-time",
  "Part-time",
  "Fixed-term",
  "Temporary",
  "Contract / Freelance",
  "Internship",
  "Apprenticeship",
] as const;

export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

/** Legacy/free-text spellings mapped onto the canonical list for display only. */
const EMPLOYMENT_TYPE_ALIASES: Record<string, EmploymentType> = {
  "full time": "Full-time",
  fulltime: "Full-time",
  permanent: "Full-time",
  "part time": "Part-time",
  parttime: "Part-time",
  contract: "Contract / Freelance",
  contractor: "Contract / Freelance",
  freelance: "Contract / Freelance",
  "self-employed": "Contract / Freelance",
  "fixed term": "Fixed-term",
  "fixed-term contract": "Fixed-term",
  temp: "Temporary",
  intern: "Internship",
  internship: "Internship",
  apprentice: "Apprenticeship",
};

/** Returns a canonical employment type when a value maps cleanly, else null. */
export function normaliseEmploymentType(value: string | null | undefined): EmploymentType | null {
  const raw = (value ?? "").trim().toLowerCase();
  if (!raw) return null;
  const exact = EMPLOYMENT_TYPES.find((option) => option.toLowerCase() === raw);
  if (exact) return exact;
  return EMPLOYMENT_TYPE_ALIASES[raw] ?? null;
}

export const jobFormSchema = z.object({
  title: z.string().trim().min(1, "Add the job title.").max(160, "Keep the title under 160 characters."),
  company: z.string().trim().min(1, "Add the company name.").max(160, "Keep the company under 160 characters."),
  location: z.string().trim().max(160, "Keep the location under 160 characters."),
  employment_type: z.string().trim().max(60),
  // Required: the description is the analytical evidence every AI workflow reads.
  description: z
    .string()
    .trim()
    .min(1, "Add the job description — it's required for matching and analysis.")
    .max(20000, "Keep the description under 20000 characters."),
  source: z.string().trim().max(120, "Keep the source under 120 characters."),
  source_url: z
    .string()
    .trim()
    .max(600)
    .refine((value) => value === "" || /^https?:\/\/\S+$/i.test(value), "Enter a full URL starting with http:// or https://")
    ,
  personal_notes: z.string().trim().max(4000, "Keep notes under 4000 characters."),
});

export type JobFormValues = z.infer<typeof jobFormSchema>;

export const recordApplicationSchema = z.object({
  applicationDate: z.string().trim().min(1, "Choose the date you applied."),
  cvId: z.string(),
  notes: z.string().trim().max(4000, "Keep notes under 4000 characters."),
});
export type RecordApplicationValues = z.infer<typeof recordApplicationSchema>;

export const recordOutcomeSchema = z.object({
  outcome: z.enum(OUTCOMES),
  outcomeDate: z.string().trim().min(1, "Choose the outcome date."),
  /** Verbatim evidence supplied by the employer/recruiter. Never AI-written. */
  employerFeedback: z
    .string()
    .trim()
    .max(4000, "Keep employer feedback under 4000 characters."),
  notes: z.string().trim().max(4000, "Keep notes under 4000 characters."),
});
export type RecordOutcomeValues = z.infer<typeof recordOutcomeSchema>;

export type ApplicationRecord = {
  id: string;
  jobId: string;
  cvId: string | null;
  applicationDate: string;
  currentStatus: ApplicationStatus;
  notes: string | null;
  outcome: {
    outcome: Outcome;
    outcomeDate: string;
    notes: string | null;
    employerFeedback: string | null;
  } | null;
};


export type JobRecord = {
  id: string;
  title: string;
  company: string;
  description: string;
  location: string;
  employmentType: string;
  source: string;
  sourceUrl: string;
  personalNotes: string;
  boardStatus: BoardStatus;
  contentVersion: number;
  createdAt: string;
  updatedAt: string;
  application: ApplicationRecord | null;
};

export type StatusHistoryEntry = {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  changedAt: string;
};

/**
 * jobs.board_status is deliberately NOT selected: displayed board status is
 * derived from the application (see toJob). The column is legacy/cache-only.
 */
const JOB_SELECT =
  "id, title, company, description, location, employment_type, source, source_url, personal_notes, content_version, created_at, updated_at";

type JobRow = {
  id: string;
  title: string;
  company: string;
  description: string | null;
  location: string | null;
  employment_type: string | null;
  source: string | null;
  source_url: string | null;
  personal_notes: string | null;
  content_version: number;
  created_at: string;
  updated_at: string;
};

const str = (value: string | null) => value ?? "";

function isApplicationStatus(value: string): value is ApplicationStatus {
  return (APPLICATION_STATUSES as readonly string[]).includes(value);
}

function isOutcome(value: string): value is Outcome {
  return (OUTCOMES as readonly string[]).includes(value);
}

export const jobKeys = {
  all: ["jobs"] as const,
  detail: (id: string) => ["jobs", id] as const,
  history: (applicationId: string) => ["application-history", applicationId] as const,
};

async function fetchApplications(userId: string, jobIds?: string[]) {
  let appQuery = supabase
    .from("applications")
    .select("id, job_id, cv_id, application_date, current_status, notes")
    .eq("user_id", userId);
  if (jobIds) appQuery = appQuery.in("job_id", jobIds);
  const { data: apps, error } = await appQuery;
  if (error) throw error;

  const appRows = apps ?? [];
  const outcomes = new Map<string, ApplicationRecord["outcome"]>();
  if (appRows.length > 0) {
    const { data: outcomeRows, error: outcomeError } = await supabase
      .from("application_outcomes")
      .select("application_id, outcome, outcome_date, notes, employer_feedback")
      .eq("user_id", userId)
      .in(
        "application_id",
        appRows.map((row) => row.id),
      );
    if (outcomeError) throw outcomeError;
    for (const row of outcomeRows ?? []) {
      if (isOutcome(row.outcome)) {
        outcomes.set(row.application_id, {
          outcome: row.outcome,
          outcomeDate: row.outcome_date,
          notes: row.notes,
          employerFeedback: row.employer_feedback,
        });
      }
    }
  }

  const byJob = new Map<string, ApplicationRecord>();
  for (const row of appRows) {
    byJob.set(row.job_id, {
      id: row.id,
      jobId: row.job_id,
      cvId: row.cv_id,
      applicationDate: row.application_date,
      currentStatus: isApplicationStatus(row.current_status) ? row.current_status : "applied",
      notes: row.notes,
      outcome: outcomes.get(row.id) ?? null,
    });
  }
  return byJob;
}

function toJob(row: JobRow, application: ApplicationRecord | null): JobRecord {
  return {
    id: row.id,
    title: row.title,
    company: row.company,
    description: str(row.description),
    location: str(row.location),
    employmentType: str(row.employment_type),
    source: str(row.source),
    sourceUrl: str(row.source_url),
    personalNotes: str(row.personal_notes),
    // Single source of truth: the application's status, else Saved.
    boardStatus: application ? application.currentStatus : "saved",
    contentVersion: row.content_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    application,
  };
}

export async function fetchJobs(): Promise<JobRecord[]> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("jobs")
    .select(JOB_SELECT)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as JobRow[];
  const apps = rows.length > 0 ? await fetchApplications(userId) : new Map<string, ApplicationRecord>();
  return rows.map((row) => toJob(row, apps.get(row.id) ?? null));
}

export async function fetchJob(id: string): Promise<JobRecord | null> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("jobs")
    .select(JOB_SELECT)
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const apps = await fetchApplications(userId, [id]);
  return toJob(data as JobRow, apps.get(id) ?? null);
}

export async function fetchStatusHistory(applicationId: string): Promise<StatusHistoryEntry[]> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("application_status_history")
    .select("id, from_status, to_status, changed_at")
    .eq("user_id", userId)
    .eq("application_id", applicationId)
    .order("changed_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    fromStatus: row.from_status,
    toStatus: row.to_status,
    changedAt: row.changed_at,
  }));
}

export async function createJob(values: JobFormValues): Promise<JobRecord> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("jobs")
    .insert({
      user_id: userId,
      title: values.title,
      company: values.company,
      description: values.description,
      location: values.location || null,
      employment_type: values.employment_type || null,
      source: values.source || null,
      source_url: values.source_url || null,
      personal_notes: values.personal_notes || null,
      content_version: 1,
    })
    .select(JOB_SELECT)
    .single();
  if (error) throw error;
  return toJob(data as JobRow, null);
}

/** Only analytical fields bump content_version. */
export function analyticalFieldsChanged(job: JobRecord, values: JobFormValues): boolean {
  return (
    job.title !== values.title ||
    job.company !== values.company ||
    job.description !== values.description ||
    job.location !== values.location ||
    job.employmentType !== values.employment_type
  );
}

export async function updateJob(job: JobRecord, values: JobFormValues): Promise<JobRecord> {
  const userId = await getCurrentUserId();
  const bump = analyticalFieldsChanged(job, values);
  const { data, error } = await supabase
    .from("jobs")
    .update({
      title: values.title,
      company: values.company,
      description: values.description,
      location: values.location || null,
      employment_type: values.employment_type || null,
      source: values.source || null,
      source_url: values.source_url || null,
      personal_notes: values.personal_notes || null,
      content_version: bump ? job.contentVersion + 1 : job.contentVersion,
    })
    .eq("user_id", userId)
    .eq("id", job.id)
    .select(JOB_SELECT)
    .single();
  if (error) throw error;
  return toJob(data as JobRow, job.application);
}

export async function deleteJob(id: string): Promise<void> {
  const userId = await getCurrentUserId();
  const { error } = await supabase.from("jobs").delete().eq("user_id", userId).eq("id", id);
  if (error) throw error;
}

export async function recordApplication(input: {
  jobId: string;
  values: RecordApplicationValues;
}): Promise<void> {
  const { error } = await supabase.rpc("record_application", {
    p_job_id: input.jobId,
    p_application_date: input.values.applicationDate,
    ...(input.values.cvId ? { p_cv_id: input.values.cvId } : {}),
    ...(input.values.notes ? { p_notes: input.values.notes } : {}),
  });
  if (error) throw error;
}

export async function transitionApplication(input: {
  applicationId: string;
  to: ApplicationStatus;
}): Promise<void> {
  const { error } = await supabase.rpc("transition_application_status", {
    p_application_id: input.applicationId,
    p_to_status: input.to,
  });
  if (error) throw error;
}

export async function recordOutcome(input: {
  applicationId: string;
  values: RecordOutcomeValues;
}): Promise<void> {
  const { error } = await supabase.rpc("record_application_outcome", {
    p_application_id: input.applicationId,
    p_outcome: input.values.outcome,
    p_outcome_date: input.values.outcomeDate,
    ...(input.values.notes ? { p_notes: input.values.notes } : {}),
    ...(input.values.employerFeedback ? { p_employer_feedback: input.values.employerFeedback } : {}),
  });
  if (error) throw error;
}


export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatDate(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function statusLabel(value: string | null): string {
  if (!value) return "—";
  return (BOARD_STATUSES as readonly string[]).includes(value)
    ? BOARD_LABELS[value as BoardStatus]
    : value;
}

export function safeExternalUrl(value: string): string | null {
  if (!/^https?:\/\/\S+$/i.test(value)) return null;
  return value;
}
