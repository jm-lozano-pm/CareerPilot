import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserId } from "@/lib/profile-data";
import {
  BOARD_LABELS,
  BOARD_STATUSES,
  OUTCOME_LABELS,
  type BoardStatus,
  type Outcome,
} from "@/lib/jobs-data";
import { METRIC_DEFINITIONS, computeApplicationMetrics, type MetricStatus } from "@/lib/career-metrics";

export type DashboardSummary = {
  metrics: {
    savedJobs: number;
    activeApplications: number;
    interviews: number;
    offers: number;
  };
  pipeline: { status: BoardStatus; label: string; count: number }[];
  totalJobs: number;
  readiness: {
    hasProfile: boolean;
    hasGoals: boolean;
    hasCv: boolean;
    hasJob: boolean;
  };
};

export { METRIC_DEFINITIONS };

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const userId = await getCurrentUserId();

  const [jobsRes, appsRes, historyRes, outcomesRes, cvsRes, profileRes, goalsRes] = await Promise.all([
    // Board status is derived from applications; jobs.board_status is legacy/cache-only.
    supabase.from("jobs").select("id").eq("user_id", userId),
    supabase.from("applications").select("id, job_id, current_status").eq("user_id", userId),
    supabase
      .from("application_status_history")
      .select("application_id, to_status")
      .eq("user_id", userId),
    supabase.from("application_outcomes").select("application_id, outcome").eq("user_id", userId),
    supabase.from("cvs").select("id").eq("user_id", userId).limit(1),
    supabase.from("professional_profiles").select("id").eq("user_id", userId).limit(1),
    supabase.from("career_goals").select("target_roles").eq("user_id", userId).limit(1),
  ]);

  const failed = [jobsRes, appsRes, historyRes, outcomesRes, cvsRes, profileRes, goalsRes].find(
    (res) => res.error,
  );
  if (failed?.error) throw failed.error;

  const jobs = jobsRes.data ?? [];
  const apps = appsRes.data ?? [];
  const outcomes = outcomesRes.data ?? [];
  const history = historyRes.data ?? [];

  // One shared deterministic metric implementation (P2.8) — identical to the
  // definitions used for Job-Search Insights.
  const metrics = computeApplicationMetrics({
    applications: apps.map((app) => ({ id: app.id, currentStatus: app.current_status as MetricStatus })),
    history: history.map((row) => ({
      applicationId: row.application_id,
      toStatus: row.to_status as MetricStatus,
    })),
    outcomes: outcomes.map((row) => ({ applicationId: row.application_id, outcome: row.outcome })),
  });

  // Derived board status: application status when one exists, otherwise Saved.
  const statusByJob = new Map(apps.map((app) => [app.job_id, app.current_status]));
  const derivedStatuses = jobs.map((job) => statusByJob.get(job.id) ?? "saved");

  const pipeline = BOARD_STATUSES.map((status) => ({
    status,
    label: BOARD_LABELS[status],
    count: derivedStatuses.filter((value) => value === status).length,
  }));

  return {
    metrics: {
      savedJobs: derivedStatuses.filter((value) => value === "saved").length,
      activeApplications: metrics.activeApplications,
      interviews: metrics.interviews,
      offers: metrics.offers,
    },
    pipeline,
    totalJobs: jobs.length,
    readiness: {
      hasProfile: (profileRes.data ?? []).length > 0,
      // A goal row only counts as configured once it has a target role (P2.5).
      hasGoals: (goalsRes.data ?? []).some(
        (row) => Array.isArray(row.target_roles) && row.target_roles.length > 0,
      ),
      hasCv: (cvsRes.data ?? []).length > 0,
      hasJob: jobs.length > 0,
    },
  };
}

export type ActivityItem = {
  id: string;
  at: string;
  label: string;
  detail: string;
  to: "/app/jobs/$jobId" | "/app/cvs/$cvId" | null;
  params: Record<string, string> | null;
};

type HistoryRow = {
  id: string;
  to_status: string;
  from_status: string | null;
  changed_at: string;
  applications: { job_id: string; jobs: { title: string; company: string } | null } | null;
};

type OutcomeRow = {
  id: string;
  outcome: string;
  created_at: string;
  applications: { job_id: string; jobs: { title: string; company: string } | null } | null;
};

function jobLabel(row: { title: string; company: string } | null | undefined): string {
  if (!row) return "a job";
  return `${row.title} — ${row.company}`;
}

export async function fetchRecentActivity(): Promise<ActivityItem[]> {
  const userId = await getCurrentUserId();

  const [jobsRes, cvsRes, historyRes, outcomesRes] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, title, company, created_at, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(8),
    supabase
      .from("cvs")
      .select("id, name, created_at, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(8),
    supabase
      .from("application_status_history")
      .select("id, to_status, from_status, changed_at, applications(job_id, jobs(title, company))")
      .eq("user_id", userId)
      .order("changed_at", { ascending: false })
      .limit(8),
    supabase
      .from("application_outcomes")
      .select("id, outcome, created_at, applications(job_id, jobs(title, company))")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const failed = [jobsRes, cvsRes, historyRes, outcomesRes].find((res) => res.error);
  if (failed?.error) throw failed.error;

  const items: ActivityItem[] = [];

  for (const job of jobsRes.data ?? []) {
    const created = job.created_at === job.updated_at;
    items.push({
      id: `job-${job.id}`,
      at: job.updated_at,
      label: created ? "Job saved" : "Job updated",
      detail: `${job.title} — ${job.company}`,
      to: "/app/jobs/$jobId",
      params: { jobId: job.id },
    });
  }

  for (const cv of cvsRes.data ?? []) {
    const created = cv.created_at === cv.updated_at;
    items.push({
      id: `cv-${cv.id}`,
      at: cv.updated_at,
      label: created ? "CV created" : "CV updated",
      detail: cv.name,
      to: "/app/cvs/$cvId",
      params: { cvId: cv.id },
    });
  }

  for (const row of (historyRes.data ?? []) as unknown as HistoryRow[]) {
    const jobId = row.applications?.job_id ?? null;
    items.push({
      id: `history-${row.id}`,
      at: row.changed_at,
      label: row.from_status
        ? `Application moved to ${row.to_status}`
        : `Application recorded (${row.to_status})`,
      detail: jobLabel(row.applications?.jobs),
      to: jobId ? "/app/jobs/$jobId" : null,
      params: jobId ? { jobId } : null,
    });
  }

  for (const row of (outcomesRes.data ?? []) as unknown as OutcomeRow[]) {
    const jobId = row.applications?.job_id ?? null;
    const label = OUTCOME_LABELS[row.outcome as Outcome] ?? row.outcome;
    items.push({
      id: `outcome-${row.id}`,
      at: row.created_at,
      label: `Outcome recorded: ${label}`,
      detail: jobLabel(row.applications?.jobs),
      to: jobId ? "/app/jobs/$jobId" : null,
      params: jobId ? { jobId } : null,
    });
  }

  return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8);
}

export function formatActivityTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
