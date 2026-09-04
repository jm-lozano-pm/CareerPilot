/**
 * Single deterministic metric implementation (P2.8).
 *
 * Dashboard KPIs and Job-Search Insight facts both consume this module so a
 * metric can never mean two different things in CareerPilot. Every value is
 * calculated from stored rows; no model ever produces these numbers.
 */

export const METRIC_ACTIVE_STATUSES = ["applied", "interview", "offer"] as const;

export type MetricStatus =
  | "applied"
  | "interview"
  | "offer"
  | "rejected"
  | "withdrawn"
  | "closed";

/** Outcomes that are explicit recorded evidence that an offer existed. */
export const OFFER_EVIDENCE_OUTCOMES = ["offer_accepted", "offer_declined"] as const;

export const METRIC_DEFINITIONS = {
  saved_jobs: "Jobs saved with no application recorded yet. Saved is derived from the absence of an application.",
  active_applications: "Applications whose current status is Applied, Interview or Offer.",
  interviews:
    "Distinct applications that ever reached Interview, evidenced by recorded status history or a current Interview status. Reaching Offer does not by itself imply an interview.",
  offers:
    "Distinct applications that ever reached Offer, evidenced by recorded status history, a current Offer status, or a recorded accepted/declined offer outcome. Each application counts once.",
} as const;

export type MetricsInput = {
  applications: { id: string; currentStatus: MetricStatus }[];
  history: { applicationId: string; toStatus: MetricStatus }[];
  outcomes: { applicationId: string; outcome: string }[];
};

export type ApplicationMetrics = {
  totalApplications: number;
  activeApplications: number;
  /** Distinct applications that ever reached Interview. */
  interviewApplicationIds: Set<string>;
  /** Distinct applications that ever reached Offer. */
  offerApplicationIds: Set<string>;
  interviews: number;
  offers: number;
};

export function computeApplicationMetrics(input: MetricsInput): ApplicationMetrics {
  const known = new Set(input.applications.map((app) => app.id));
  const interviewIds = new Set<string>();
  const offerIds = new Set<string>();

  for (const app of input.applications) {
    if (app.currentStatus === "interview") interviewIds.add(app.id);
    if (app.currentStatus === "offer") offerIds.add(app.id);
  }
  for (const event of input.history) {
    if (!known.has(event.applicationId)) continue;
    if (event.toStatus === "interview") interviewIds.add(event.applicationId);
    if (event.toStatus === "offer") offerIds.add(event.applicationId);
  }
  for (const outcome of input.outcomes) {
    if (!known.has(outcome.applicationId)) continue;
    if ((OFFER_EVIDENCE_OUTCOMES as readonly string[]).includes(outcome.outcome)) {
      offerIds.add(outcome.applicationId);
    }
  }

  const activeApplications = input.applications.filter((app) =>
    (METRIC_ACTIVE_STATUSES as readonly string[]).includes(app.currentStatus),
  ).length;

  return {
    totalApplications: input.applications.length,
    activeApplications,
    interviewApplicationIds: interviewIds,
    offerApplicationIds: offerIds,
    interviews: interviewIds.size,
    offers: offerIds.size,
  };
}
