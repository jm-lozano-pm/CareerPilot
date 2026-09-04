import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Bookmark,
  BriefcaseBusiness,
  Check,
  Handshake,
  Inbox,
  Lightbulb,
  RefreshCw,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { JobSearchInsight } from "@/components/dashboard/job-search-insight";

import { EmptyState } from "@/components/ui/empty-state";
import { SurfaceCard, SurfaceCardTitle } from "@/components/ui/surface-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchDashboardSummary,
  fetchRecentActivity,
  formatActivityTime,
  type DashboardSummary,
} from "@/lib/dashboard-data";
import { METRIC_DEFINITIONS } from "@/lib/career-metrics";

export const Route = createFileRoute("/app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — CareerPilot" },
      {
        name: "description",
        content:
          "Track your career progress in CareerPilot and focus on what matters next.",
      },
      { property: "og:title", content: "Dashboard — CareerPilot" },
      {
        property: "og:description",
        content: "Your career workspace for jobs, CVs, and profile management.",
      },
    ],
  }),
  component: DashboardPage,
});

function SectionError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-destructive/25 bg-destructive-soft px-4 py-3">
      <p className="text-sm text-destructive">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="size-4" aria-hidden="true" />
        Try again
      </Button>
    </div>
  );
}

const METRICS: { key: "savedJobs" | "activeApplications" | "interviews" | "offers"; label: string; hint: string; tooltip: string; icon: typeof Bookmark }[] = [
  {
    key: "savedJobs",
    label: "Saved Jobs",
    hint: "Jobs you're considering but haven't applied to yet.",
    tooltip: METRIC_DEFINITIONS.saved_jobs,
    icon: Bookmark,
  },
  {
    key: "activeApplications",
    label: "Active Applications",
    hint: "Applications currently in progress.",
    tooltip: METRIC_DEFINITIONS.active_applications,
    icon: BriefcaseBusiness,
  },
  {
    key: "interviews",
    label: "Interviews",
    hint: "Applications that reached the Interview stage.",
    tooltip: METRIC_DEFINITIONS.interviews,
    icon: Users,
  },
  {
    key: "offers",
    label: "Offers",
    hint: "Applications that reached the Offer stage.",
    tooltip: METRIC_DEFINITIONS.offers,
    icon: Handshake,
  },
];


function MetricTile({
  label,
  hint,
  tooltip,
  value,
  icon: Icon,
}: {
  label: string;
  hint: string;
  tooltip: string;
  value: number;
  icon: typeof Bookmark;
}) {
  return (
    <SurfaceCard padding="compact">
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/8 text-primary">
          <Icon className="size-5" aria-hidden="true" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground" title={tooltip}>
            {label}
          </p>
          <p className="text-2xl font-semibold text-foreground" aria-label={`${label}: ${value}`}>
            {value}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        </div>
      </div>
    </SurfaceCard>
  );
}


function PipelineSummary({ summary }: { summary: DashboardSummary }) {
  const max = Math.max(1, ...summary.pipeline.map((row) => row.count));
  return (
    <SurfaceCard>
      <div className="flex items-center justify-between gap-4">
        <SurfaceCardTitle>Pipeline summary</SurfaceCardTitle>
        <Link
          to="/app/jobs"
          className="inline-flex items-center gap-1 rounded-md text-sm font-medium text-primary hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Open Jobs
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
      {summary.totalJobs === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-border-strong bg-surface-muted px-4 py-3 text-sm text-subtle-foreground">
          Your pipeline is empty. Save a job to start tracking it.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {summary.pipeline.map((row) => (
            <li key={row.status} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-sm text-secondary-foreground">{row.label}</span>
              <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-muted">
                <span
                  className="block h-full rounded-full bg-primary/70"
                  style={{ width: `${row.count === 0 ? 0 : (row.count / max) * 100}%` }}
                  aria-hidden="true"
                />
              </span>
              <span
                className="w-6 shrink-0 text-right text-sm font-medium text-foreground"
                aria-label={`${row.label}: ${row.count} jobs`}
              >
                {row.count}
              </span>
            </li>
          ))}
        </ul>
      )}
    </SurfaceCard>
  );
}

function ReadinessChecklist({ summary }: { summary: DashboardSummary }) {
  const items = [
    {
      done: summary.readiness.hasProfile,
      label: "Professional profile saved",
      to: "/app/profile" as const,
      action: "Open Career Profile",
    },
    {
      done: summary.readiness.hasGoals,
      label: "Career goals saved",
      to: "/app/profile" as const,
      action: "Open Career Profile",
    },
    {
      done: summary.readiness.hasCv,
      label: "At least one CV created",
      to: "/app/cvs" as const,
      action: "Open CVs",
    },
    {
      done: summary.readiness.hasJob,
      label: "At least one job saved",
      to: "/app/jobs" as const,
      action: "Open Jobs",
    },
  ];
  const done = items.filter((item) => item.done).length;
  const complete = done === items.length;

  // Once setup is complete this collapses to a single compact line so it stops
  // competing with evidence and interpretation for dashboard space.
  if (complete) {
    return (
      <div className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-success-soft text-success">
          <Check className="size-3.5" aria-hidden="true" />
        </span>
        <p className="min-w-0 flex-1 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Workspace setup complete</span> — profile,
          goals, CV and jobs are in place. This is not a score of your employability.
        </p>
      </div>
    );
  }

  return (
    <SurfaceCard>

      <SurfaceCardTitle>Career readiness</SurfaceCardTitle>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Setup completion only — {done} of {items.length} steps done. This is not a score of your
        employability.
      </p>
      <ul className="mt-4 flex flex-col gap-2.5">
        {items.map((item) => (
          <li key={item.label} className="flex min-w-0 items-center gap-3">
            <span
              className={
                item.done
                  ? "grid size-5 shrink-0 place-items-center rounded-full bg-success-soft text-success"
                  : "grid size-5 shrink-0 place-items-center rounded-full border border-border-strong text-subtle-foreground"
              }
            >
              {item.done ? <Check className="size-3.5" aria-hidden="true" /> : null}
            </span>
            <span className="min-w-0 flex-1 text-sm text-foreground">
              {item.label}
              <span className="sr-only">{item.done ? " — done" : " — not done yet"}</span>
            </span>
            {!item.done && (
              <Link
                to={item.to}
                className="shrink-0 rounded-md text-sm font-medium text-primary hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {item.action}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </SurfaceCard>
  );
}




function DashboardPage() {
  const summaryQuery = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: fetchDashboardSummary,
  });
  const activityQuery = useQuery({
    queryKey: ["dashboard", "activity"],
    queryFn: fetchRecentActivity,
  });

  const loading = summaryQuery.isPending || activityQuery.isPending;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Track your career progress and focus on what matters next."
      />

      {loading ? (
        <div className="flex flex-col gap-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((key) => (
              <Skeleton key={key} className="h-[104px] rounded-xl" />
            ))}
          </div>
          <div className="grid gap-8 lg:grid-cols-2">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      ) : (
        <>
          {summaryQuery.isError ? (
            <SectionError
              message="We could not load your dashboard figures."
              onRetry={() => void summaryQuery.refetch()}
            />
          ) : summaryQuery.data ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {METRICS.map((metric) => (
                <MetricTile
                  key={metric.key}
                  label={metric.label}
                  hint={metric.hint}
                  tooltip={metric.tooltip}
                  icon={metric.icon}
                  value={summaryQuery.data.metrics[metric.key]}
                />
              ))}
            </div>
          ) : null}

          {/* Interpretation and recommendations come first: this is what
              CareerPilot adds on top of the raw records. */}
          <JobSearchInsight />

          {summaryQuery.data && (
            <div className="grid gap-8 lg:grid-cols-2">
              <PipelineSummary summary={summaryQuery.data} />
              <ReadinessChecklist summary={summaryQuery.data} />
            </div>
          )}

          {/* Secondary: a record of what changed, available but de-emphasised. */}
          <section className="rounded-xl border border-border bg-surface-muted/60 p-5">
            <h2 className="text-sm font-semibold text-secondary-foreground">Recent activity</h2>
            {activityQuery.isError ? (
              <div className="mt-4">
                <SectionError
                  message="We could not load your recent activity."
                  onRetry={() => void activityQuery.refetch()}
                />
              </div>
            ) : (activityQuery.data ?? []).length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="No recent activity yet"
                description="Saved jobs, CV updates and application changes will appear here."
              />
            ) : (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm text-muted-foreground">
                  {(activityQuery.data ?? []).length} recent update
                  {(activityQuery.data ?? []).length === 1 ? "" : "s"}
                </summary>
                <ul className="mt-2 flex flex-col divide-y divide-border">
                  {(activityQuery.data ?? []).map((item) => (
                    <li key={item.id} className="flex min-w-0 items-start gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        <p className="truncate text-sm text-muted-foreground">{item.detail}</p>
                        <time className="text-xs text-subtle-foreground" dateTime={item.at}>
                          {formatActivityTime(item.at)}
                        </time>
                      </div>
                      {item.to && item.params && (
                        <Link
                          to={item.to}
                          params={item.params as never}
                          className="shrink-0 rounded-md text-sm font-medium text-primary hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                          aria-label={`Open ${item.detail}`}
                        >
                          Open
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </section>

        </>
      )}
    </>
  );
}
