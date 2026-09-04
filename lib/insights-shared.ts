import { z } from "zod";
import { METRIC_DEFINITIONS, computeApplicationMetrics } from "@/lib/career-metrics";

/**
 * Client-safe contracts and deterministic calculations for job-search insights.
 *
 * Every number below is calculated by CareerPilot code from stored rows. The
 * model receives these facts as read-only evidence and never produces numbers.
 */

export const APPLICATION_STATUSES = [
  "applied",
  "interview",
  "offer",
  "rejected",
  "withdrawn",
  "closed",
] as const;
export type ApplicationStatusKey = (typeof APPLICATION_STATUSES)[number];

export const OUTCOME_KEYS = ["offer_accepted", "offer_declined", "rejected", "withdrawn", "closed"] as const;
export type OutcomeKey = (typeof OUTCOME_KEYS)[number];

export type FactsInput = {
  savedJobs: number;
  applications: {
    id: string;
    applicationDate: string | null;
    currentStatus: ApplicationStatusKey;
    createdAt: string;
    updatedAt: string;
  }[];
  history: {
    applicationId: string;
    fromStatus: ApplicationStatusKey | null;
    toStatus: ApplicationStatusKey;
    changedAt: string;
  }[];
  outcomes: {
    applicationId: string;
    outcome: OutcomeKey;
    outcomeDate: string | null;
    createdAt: string;
  }[];
};

export type JobSearchFacts = {
  total_saved_jobs: number;
  total_applications: number;
  active_applications: number;
  status_counts: Record<ApplicationStatusKey, number>;
  interviews_reached: number;
  offers_reached: number;
  outcomes_by_type: Record<OutcomeKey, number>;
  application_to_interview_rate: number | null;
  application_to_offer_rate: number | null;
  average_days_to_first_interview: number | null;
  days_to_job: number | null;
  activity_window_start: string | null;
  activity_window_end: string | null;
};

export type SampleSizes = {
  applications: number;
  interview_rate_denominator: number | null;
  offer_rate_denominator: number | null;
  average_days_to_first_interview: number | null;
  days_to_job_evidence: number;
  /** Raw event count. Context only — never used for eligibility. */
  progress_events: number;
  /** Raw outcome count. Context only — never used for eligibility. */
  terminal_outcomes: number;
  /**
   * Distinct applications that either progressed beyond their initial applied
   * row or have a recorded outcome. This is the eligibility measure: several
   * events on one application still count once.
   */
  qualifying_applications: number;
};


export const FACT_DEFINITIONS: Record<string, string> = {
  total_saved_jobs: "Jobs the user saved that have no application recorded yet.",
  total_applications: "Applications the user recorded.",
  active_applications: "Applications currently in applied, interview or offer.",
  status_counts: "Count of applications currently in each status.",
  interviews_reached: METRIC_DEFINITIONS.interviews,
  offers_reached: METRIC_DEFINITIONS.offers,
  outcomes_by_type: "Recorded terminal outcomes grouped by outcome type.",
  application_to_interview_rate:
    "interviews_reached divided by total_applications, expressed 0–1. Null when there are no applications.",
  application_to_offer_rate:
    "offers_reached divided by total_applications, expressed 0–1. Null when there are no applications.",
  average_days_to_first_interview:
    "Mean days from application_date to the first recorded interview status, counting only applications where both dates exist. Null when none qualify.",
  days_to_job:
    "Days from the earliest recorded application date to the earliest recorded offer_accepted outcome date. Null until a genuine accepted offer exists.",
  activity_window_start: "Earliest recorded application date in the data set.",
  activity_window_end: "Most recent recorded application, status change or outcome date.",
};

const MS_PER_DAY = 86_400_000;

function parseDate(value: string | null | undefined): number | null {
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Pure deterministic aggregation. Derived rates and durations are null — never
 * zero — when there is no valid denominator or no dated evidence.
 */
export function computeDeterministicFacts(input: FactsInput): {
  facts: JobSearchFacts;
  sampleSizes: SampleSizes;
} {
  const statusCounts = Object.fromEntries(
    APPLICATION_STATUSES.map((status) => [status, 0]),
  ) as Record<ApplicationStatusKey, number>;
  for (const app of input.applications) statusCounts[app.currentStatus] += 1;

  const outcomeCounts = Object.fromEntries(OUTCOME_KEYS.map((key) => [key, 0])) as Record<OutcomeKey, number>;
  for (const outcome of input.outcomes) outcomeCounts[outcome.outcome] += 1;

  // Interviews and offers come from the one shared metric implementation
  // (P2.8), so the Dashboard and these facts can never disagree.
  const metrics = computeApplicationMetrics({
    applications: input.applications.map((app) => ({ id: app.id, currentStatus: app.currentStatus })),
    history: input.history.map((event) => ({
      applicationId: event.applicationId,
      toStatus: event.toStatus,
    })),
    outcomes: input.outcomes.map((outcome) => ({
      applicationId: outcome.applicationId,
      outcome: outcome.outcome,
    })),
  });
  const everInterview = metrics.interviewApplicationIds;
  const everOffer = metrics.offerApplicationIds;

  const firstInterviewAt = new Map<string, number>();
  let progressEvents = 0;
  const knownApplicationIds = new Set(input.applications.map((app) => app.id));
  // Distinct applications with meaningful evidence. Repeat events on the same
  // application collapse into one member of this set.
  const qualifyingApplications = new Set<string>();

  for (const event of input.history) {
    if (event.toStatus === "interview") {
      const at = parseDate(event.changedAt);
      if (at !== null) {
        const existing = firstInterviewAt.get(event.applicationId);
        if (existing === undefined || at < existing) firstInterviewAt.set(event.applicationId, at);
      }
    }
    // The first row of every application is its initial "applied" entry
    // (to_status 'applied' with no from_status). Anything else is progression.
    const isInitialAppliedRow = event.toStatus === "applied" && event.fromStatus === null;
    if (!isInitialAppliedRow) {
      progressEvents += 1;
      if (knownApplicationIds.has(event.applicationId)) qualifyingApplications.add(event.applicationId);
    }
  }
  for (const outcome of input.outcomes) {
    if (knownApplicationIds.has(outcome.applicationId)) qualifyingApplications.add(outcome.applicationId);
  }

  const totalApplications = metrics.totalApplications;
  const activeApplications = metrics.activeApplications;

  // Average days to first interview — only applications with both dates count.
  const durations: number[] = [];
  for (const app of input.applications) {
    const applied = parseDate(app.applicationDate);
    const interview = firstInterviewAt.get(app.id) ?? null;
    if (applied === null || interview === null) continue;
    const days = (interview - applied) / MS_PER_DAY;
    if (days >= 0) durations.push(days);
  }
  const averageDays =
    durations.length > 0 ? round2(durations.reduce((sum, value) => sum + value, 0) / durations.length) : null;

  // Time to job — earliest application date to earliest accepted-offer date.
  const applicationDates = input.applications
    .map((app) => parseDate(app.applicationDate))
    .filter((value): value is number => value !== null);
  const earliestApplication = applicationDates.length > 0 ? Math.min(...applicationDates) : null;
  const acceptedDates = input.outcomes
    .filter((outcome) => outcome.outcome === "offer_accepted")
    .map((outcome) => parseDate(outcome.outcomeDate))
    .filter((value): value is number => value !== null);
  const earliestAccepted = acceptedDates.length > 0 ? Math.min(...acceptedDates) : null;
  const daysToJob =
    earliestApplication !== null && earliestAccepted !== null && earliestAccepted >= earliestApplication
      ? round2((earliestAccepted - earliestApplication) / MS_PER_DAY)
      : null;

  const windowEndCandidates = [
    ...applicationDates,
    ...input.applications.map((app) => parseDate(app.updatedAt)).filter((v): v is number => v !== null),
    ...input.history.map((event) => parseDate(event.changedAt)).filter((v): v is number => v !== null),
    ...input.outcomes
      .map((outcome) => parseDate(outcome.outcomeDate) ?? parseDate(outcome.createdAt))
      .filter((v): v is number => v !== null),
  ];

  const facts: JobSearchFacts = {
    total_saved_jobs: input.savedJobs,
    total_applications: totalApplications,
    active_applications: activeApplications,
    status_counts: statusCounts,
    interviews_reached: everInterview.size,
    offers_reached: everOffer.size,
    outcomes_by_type: outcomeCounts,
    application_to_interview_rate:
      totalApplications > 0 ? round2(everInterview.size / totalApplications) : null,
    application_to_offer_rate: totalApplications > 0 ? round2(everOffer.size / totalApplications) : null,
    average_days_to_first_interview: averageDays,
    days_to_job: daysToJob,
    activity_window_start: earliestApplication !== null ? new Date(earliestApplication).toISOString() : null,
    activity_window_end:
      windowEndCandidates.length > 0 ? new Date(Math.max(...windowEndCandidates)).toISOString() : null,
  };

  const sampleSizes: SampleSizes = {
    applications: totalApplications,
    interview_rate_denominator: totalApplications > 0 ? totalApplications : null,
    offer_rate_denominator: totalApplications > 0 ? totalApplications : null,
    average_days_to_first_interview: durations.length > 0 ? durations.length : null,
    days_to_job_evidence: acceptedDates.length,
    progress_events: progressEvents,
    terminal_outcomes: input.outcomes.length,
    qualifying_applications: qualifyingApplications.size,
  };

  return { facts, sampleSizes };
}

/* -------------------------------------------------------------- eligibility */

export const MIN_APPLICATIONS = 3;
/** Distinct applications that must carry progression and/or a recorded outcome. */
export const MIN_QUALIFYING_APPLICATIONS = 2;

export type Eligibility = {
  eligible: boolean;
  message: string | null;
};

/**
 * Minimum-data rule. No gateway call happens unless this passes.
 *
 * Eligibility needs at least MIN_APPLICATIONS recorded applications AND
 * MIN_QUALIFYING_APPLICATIONS distinct applications with meaningful evidence.
 * Several progress events on one application count once, so a single
 * applied→interview→offer application alongside two applied-only applications
 * stays ineligible.
 */
export function evaluateEligibility(sampleSizes: SampleSizes): Eligibility {
  const applicationsShort = Math.max(0, MIN_APPLICATIONS - sampleSizes.applications);
  const qualifyingShort = Math.max(0, MIN_QUALIFYING_APPLICATIONS - sampleSizes.qualifying_applications);

  if (applicationsShort === 0 && qualifyingShort === 0) return { eligible: true, message: null };

  const parts: string[] = [];
  if (applicationsShort > 0) {
    parts.push(`Record ${applicationsShort} more application${applicationsShort === 1 ? "" : "s"}`);
  }
  if (qualifyingShort > 0) {
    const evidence = `${qualifyingShort} more application${qualifyingShort === 1 ? "" : "s"} with a status change beyond Applied or a recorded outcome (currently ${sampleSizes.qualifying_applications} of ${MIN_QUALIFYING_APPLICATIONS})`;
    parts.push(parts.length > 0 ? evidence : `Record ${evidence}`);
  }
  return { eligible: false, message: `${parts.join(" and ")} before generating insights.` };
}


/* ---------------------------------------------------------- evidence tiers */

/**
 * Deterministic evidence strength (P3.2). Application code — not the prompt —
 * decides the tier and the hard output caps, so an over-eager model response
 * can never widen what is persisted or displayed.
 */
export const EVIDENCE_TIERS = ["insufficient", "limited", "moderate"] as const;
export type EvidenceTier = (typeof EVIDENCE_TIERS)[number];

/** Conservative stronger-history threshold for the moderate tier. */
export const MODERATE_MIN_APPLICATIONS = 5;
export const MODERATE_MIN_QUALIFYING_APPLICATIONS = 3;

export type EvidenceCaps = {
  /** Maximum substantive interpretations (observations) kept. */
  observations: number;
  /** Maximum recommendations kept. */
  recommendations: number;
  /** Maximum stated uncertainties kept. */
  uncertainties: number;
};

export const EVIDENCE_CAPS: Record<Exclude<EvidenceTier, "insufficient">, EvidenceCaps> = {
  limited: { observations: 1, recommendations: 1, uncertainties: 2 },
  moderate: { observations: 3, recommendations: 3, uncertainties: 3 },
};

export const EVIDENCE_TIER_LABELS: Record<EvidenceTier, string> = {
  insufficient: "Not enough recorded evidence",
  limited: "Based on limited evidence",
  moderate: "Based on moderate evidence",
};

export const EVIDENCE_TIER_NOTES: Record<Exclude<EvidenceTier, "insufficient">, string> = {
  limited:
    "Your recorded history is only just large enough to describe. CareerPilot keeps this to one observation and one suggested action, and it describes recorded activity only — never a cause, a judgement of you, or any chance of an interview or offer.",
  moderate:
    "Your recorded history supports a slightly broader description. It still describes recorded activity only — never a cause, a judgement of you, or any chance of an interview or offer.",
};

/**
 * Tier from stored sample sizes. `insufficient` means no model call happens.
 */
export function evaluateEvidenceTier(sampleSizes: SampleSizes): {
  tier: EvidenceTier;
  caps: EvidenceCaps | null;
  label: string;
  note: string | null;
} {
  if (!evaluateEligibility(sampleSizes).eligible) {
    return {
      tier: "insufficient",
      caps: null,
      label: EVIDENCE_TIER_LABELS.insufficient,
      note: null,
    };
  }
  const moderate =
    sampleSizes.applications >= MODERATE_MIN_APPLICATIONS &&
    sampleSizes.qualifying_applications >= MODERATE_MIN_QUALIFYING_APPLICATIONS;
  const tier: Exclude<EvidenceTier, "insufficient"> = moderate ? "moderate" : "limited";
  return {
    tier,
    caps: EVIDENCE_CAPS[tier],
    label: EVIDENCE_TIER_LABELS[tier],
    note: EVIDENCE_TIER_NOTES[tier],
  };
}

/** Hard cap applied when parsing/persisting model output. */
export function applyEvidenceCaps(
  output: JobSearchInsightOutput,
  caps: EvidenceCaps,
): JobSearchInsightOutput {
  return {
    summary: output.summary,
    observations: output.observations.slice(0, caps.observations),
    uncertainties: output.uncertainties.slice(0, caps.uncertainties),
    recommendations: output.recommendations.slice(0, caps.recommendations),
  };
}

/* ------------------------------------------------------- comparative gate */

/** Minimum distinct applications a group needs before it may be compared. */
export const COMPARATIVE_MIN_APPLICATIONS = 3;

export type ComparativeGroupInput = {
  key: string;
  label: string;
  applicationIds: string[];
  qualifyingApplicationIds: string[];
};

export type ComparativeGroup = {
  key: string;
  label: string;
  applications: number;
  qualifying_applications: number;
};

/**
 * Comparative claims are only allowed when at least two groups each have
 * >= COMPARATIVE_MIN_APPLICATIONS distinct applications and at least some
 * progression/outcome evidence. The gate is evaluated before any comparison
 * context reaches the model.
 */
export function evaluateComparativeGate(groups: ComparativeGroupInput[]): {
  allowed: boolean;
  groups: ComparativeGroup[];
  reason: string | null;
} {
  const qualifying = groups
    .filter(
      (group) =>
        new Set(group.applicationIds).size >= COMPARATIVE_MIN_APPLICATIONS &&
        new Set(group.qualifyingApplicationIds).size >= 1,
    )
    .map((group) => ({
      key: group.key,
      label: group.label,
      applications: new Set(group.applicationIds).size,
      qualifying_applications: new Set(group.qualifyingApplicationIds).size,
    }));

  if (qualifying.length < 2) {
    return {
      allowed: false,
      groups: [],
      reason: `Comparisons need at least two groups with ${COMPARATIVE_MIN_APPLICATIONS} or more recorded applications each and some recorded progression or outcome in each. Record more activity before CareerPilot compares groups.`,
    };
  }
  return { allowed: true, groups: qualifying, reason: null };
}

/**
 * Comparative / causal phrasing detector used to filter model text when the
 * gate is closed. Deliberately conservative — a dropped observation is safer
 * than an unsupported comparison.
 */
const COMPARATIVE_PATTERNS = [
  /\b(compared (?:to|with)|versus|vs\.?)\b/i,
  /\b(better|worse|stronger|weaker|higher|lower|more|less|fewer)\b[^.]{0,40}\bthan\b/i,
  /\b(outperform\w*|underperform\w*)\b/i,
  /\b(because of|caused by|causes?|due to|leads? to|results? in)\b/i,
];

export function containsComparativeClaim(text: string): boolean {
  return COMPARATIVE_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Drops any interpretation or recommendation that reads as a comparison or a
 * causal claim. Applied before persistence whenever the gate is closed.
 */
export function filterComparativeClaims(output: JobSearchInsightOutput): {
  output: JobSearchInsightOutput;
  removed: number;
  /** True when the summary itself compared groups or asserted a cause. */
  summaryFlagged: boolean;
} {
  const keepItem = (item: { title: string; explanation?: string; rationale?: string }) =>
    !containsComparativeClaim(`${item.title} ${item.explanation ?? ""} ${item.rationale ?? ""}`);

  const observations = output.observations.filter(keepItem);
  const recommendations = output.recommendations.filter(keepItem);
  return {
    output: { ...output, observations, recommendations },
    removed:
      output.observations.length -
      observations.length +
      (output.recommendations.length - recommendations.length),
    summaryFlagged: containsComparativeClaim(output.summary),
  };
}


/* -------------------------------------------------------------- evidence */

/** Every evidence key the model is allowed to cite, derived from the facts. */
export function allowedEvidenceKeys(facts: JobSearchFacts): string[] {
  const keys: string[] = [];
  for (const key of Object.keys(facts)) {
    if (key === "status_counts" || key === "outcomes_by_type") continue;
    keys.push(key);
  }
  for (const status of APPLICATION_STATUSES) keys.push(`status_counts.${status}`);
  for (const outcome of OUTCOME_KEYS) keys.push(`outcomes_by_type.${outcome}`);
  return keys;
}


/* --------------------------------------------------------------- AI output */

const evidenceItem = z.object({
  title: z.string().trim().min(1).max(120),
  explanation: z.string().trim().min(1).max(600),
  evidence_keys: z.array(z.string().trim().min(1)).min(1).max(6),
});

export const jobSearchInsightSchema = z.object({
  summary: z.string().trim().min(1).max(1200),
  observations: z.array(evidenceItem).max(4).default([]),
  uncertainties: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(120),
        explanation: z.string().trim().min(1).max(600),
      }),
    )
    .max(3)
    .default([]),
  recommendations: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(120),
        rationale: z.string().trim().min(1).max(600),
        evidence_keys: z.array(z.string().trim().min(1)).min(1).max(6),
      }),
    )
    .max(4)
    .default([]),
});
export type JobSearchInsightOutput = z.infer<typeof jobSearchInsightSchema>;

export const SUMMARY_WORD_LIMIT = 120;

export function countWords(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Business validation: every cited evidence key must exist. Unknown references
 * mean the output is rejected and nothing is persisted.
 */
export function validateEvidenceKeys(
  output: JobSearchInsightOutput,
  allowed: string[],
): { ok: true } | { ok: false; unknownKeys: string[] } {
  const allowedSet = new Set(allowed);
  const unknown = new Set<string>();
  for (const item of [...output.observations, ...output.recommendations]) {
    for (const key of item.evidence_keys) if (!allowedSet.has(key)) unknown.add(key);
  }
  return unknown.size === 0 ? { ok: true } : { ok: false, unknownKeys: [...unknown] };
}

/* ---------------------------------------------------------- stored shapes */

export type JobSearchInsightContent = {
  deterministic_facts: JobSearchFacts;
  definitions: Record<string, string>;
  sample_sizes: SampleSizes;
  summary: string;
  observations: JobSearchInsightOutput["observations"];
  uncertainties: JobSearchInsightOutput["uncertainties"];
  /** Deterministic evidence strength this insight was capped to (P3.2). */
  evidence_tier?: EvidenceTier;
  evidence_caps?: EvidenceCaps;
  /** Comparative gate outcome for auditability (P3.3). */
  comparisons_allowed?: boolean;
  comparison_groups?: ComparativeGroup[];
  comparison_blocked_reason?: string | null;
};

export type JobSearchContextRefs = {
  generated_at: string;
  application_count: number;
  latest_activity_at: string | null;
  career_goals_updated_at: string | null;
  snapshot_signature: string;
  /** How many outcomes carried user-recorded employer feedback in this snapshot. */
  employer_feedback_records?: number;
  /** Evidence tier recorded for staleness and audit. */
  evidence_tier?: EvidenceTier;
  comparisons_allowed?: boolean;



};

/** Stable signature of the data the insight was generated from. */
export function snapshotSignature(parts: (string | number | null)[]): string {
  const source = parts.map((part) => String(part ?? "-")).join("|");
  let hash = 5381;
  for (let index = 0; index < source.length; index += 1) {
    hash = ((hash << 5) + hash + source.charCodeAt(index)) >>> 0;
  }
  return `v1-${hash.toString(36)}-${source.length.toString(36)}`;
}

/** Human-readable label for a cited evidence key. */
export function evidenceLabel(key: string): string {
  return key.replace(/_/g, " ").replace(/\./g, ": ");
}
