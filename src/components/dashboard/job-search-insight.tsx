import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Lightbulb, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { friendlyDataError } from "@/lib/auth-errors";
import { generateJobSearchInsight, getJobSearchStatus } from "@/lib/insights.functions";
import { fetchLatestJobSearchInsight } from "@/lib/insights-data";
import { evidenceLabel, EVIDENCE_TIER_LABELS, EVIDENCE_TIER_NOTES } from "@/lib/insights-shared";
import { RecommendationList } from "@/components/insights/recommendation-list";
import { formatActivityTime } from "@/lib/dashboard-data";


const insightKeys = {
  status: ["insights", "job-search", "status"] as const,
  latest: ["insights", "job-search", "latest"] as const,
  recommendations: (insightId: string) => ["insights", "recommendations", insightId] as const,
};

function Section({
  title,
  items,
}: {
  title: string;
  items: { title: string; explanation: string; evidence_keys?: string[] }[];
}) {
  if (items.length === 0) return null;
  return (
    <div className="mt-4">
      <h3 className="text-xs font-medium uppercase tracking-wide text-subtle-foreground">{title}</h3>
      <ul className="mt-2 space-y-2.5">
        {items.map((item) => (
          <li key={item.title}>
            <p className="text-sm font-medium text-foreground">{item.title}</p>
            <p className="text-sm text-muted-foreground">{item.explanation}</p>
            {item.evidence_keys && item.evidence_keys.length > 0 && (
              <p className="mt-1 text-xs text-subtle-foreground">
                Evidence basis: {item.evidence_keys.map((key) => evidenceLabel(key)).join(" · ")}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Recommendations({ insightId }: { insightId: string }) {
  return <RecommendationList insightId={insightId} />;
}


/**
 * Job-search insights. Nothing is generated automatically: the user asks, code
 * calculates every number, and the model only interprets those facts.
 */
export function JobSearchInsight() {
  const queryClient = useQueryClient();
  const run = useServerFn(generateJobSearchInsight);
  const readStatus = useServerFn(getJobSearchStatus);

  const statusQuery = useQuery({
    queryKey: insightKeys.status,
    queryFn: () => readStatus({}),
  });
  const insightQuery = useQuery({
    queryKey: insightKeys.latest,
    queryFn: fetchLatestJobSearchInsight,
  });

  const generate = useMutation({
    mutationFn: () => run({}),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: insightKeys.latest });
      const insightId = insightQuery.data?.id;
      if (insightId) {
        await queryClient.invalidateQueries({ queryKey: insightKeys.recommendations(insightId) });
      }
      toast.success(
        result && "reused" in result && result.reused
          ? "Your existing insight already covers this activity."
          : "Job-search insights ready.",
      );
    },
    onError: (error) => toast.error(friendlyDataError(error)),
  });

  const status = statusQuery.data;
  const insight = insightQuery.data ?? null;
  const stale = Boolean(
    insight && status && insight.contextRefs?.snapshot_signature !== status.snapshotSignature,
  );
  const loading = statusQuery.isPending || insightQuery.isPending;

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-ai-surface shadow-card">
      <div className="h-[3px] w-28 bg-ai" aria-hidden="true" />
      <div className="p-6">
        <div className="flex min-w-0 items-center justify-between gap-4 border-b border-ai/15 pb-4">
          <h2 className="truncate text-base font-semibold text-ai">CareerPilot Insight</h2>
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-ai/10 text-ai">
            <Lightbulb className="size-4" aria-hidden="true" strokeWidth={1.75} />
          </span>
        </div>

        {loading ? (
          <Skeleton className="mt-4 h-24 rounded-xl" />
        ) : statusQuery.isError ? (
          <div className="pt-4">
            <p className="text-sm text-destructive">{friendlyDataError(statusQuery.error)}</p>
            <Button
              className="mt-3"
              variant="outline"
              size="sm"
              onClick={() => void statusQuery.refetch()}
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              Try again
            </Button>
          </div>
        ) : status && !status.eligible ? (
          <div className="pt-4">
            <p className="text-sm font-medium text-foreground">Not enough recorded evidence yet</p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Insights are generated only from what you have recorded. CareerPilot needs evidence
              from at least 3 recorded applications, with meaningful progression or a recorded
              outcome on at least 2 of them, before it can interpret anything. This is a data
              sufficiency requirement — not a suggestion to apply to more jobs.
            </p>
            <p className="mt-2 text-xs text-subtle-foreground">
              Recorded so far: {status.sampleSizes.applications} application
              {status.sampleSizes.applications === 1 ? "" : "s"},{" "}
              {status.sampleSizes.qualifying_applications} with a status change beyond Applied or a
              recorded outcome. Several changes on the same application count once.
            </p>

          </div>

        ) : (
          <div className="pt-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {insight
                  ? `Generated ${formatActivityTime(insight.generatedAt)} from your recorded activity.`
                  : "Reviews what you have recorded — applications, status changes and outcomes. Runs only when you ask."}
              </p>
              <Button
                size="sm"
                variant={insight ? "outline" : "default"}
                disabled={generate.isPending}
                onClick={() => generate.mutate()}
              >
                {generate.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Sparkles className="size-4" aria-hidden="true" />
                )}
                {insight ? "Refresh insights" : "Generate insights"}
              </Button>
            </div>

            {stale && (
              <p className="mt-3 rounded-lg border border-warning/25 bg-warning-soft px-3 py-2 text-sm text-warning">
                Your activity has changed since this insight was generated. Refresh to bring it up to date.
              </p>
            )}

            {insight && (
              <>
                {insight.content.evidence_tier && insight.content.evidence_tier !== "insufficient" && (
                  <div className="mt-4 rounded-lg border border-border bg-muted px-3 py-2">
                    <p className="text-xs font-medium text-foreground">
                      {EVIDENCE_TIER_LABELS[insight.content.evidence_tier]}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {EVIDENCE_TIER_NOTES[insight.content.evidence_tier]}
                    </p>
                    {insight.content.comparisons_allowed === false && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Comparisons between sources or CVs are switched off:{" "}
                        {insight.content.comparison_blocked_reason ??
                          "each group compared needs at least 3 recorded applications with progression or an outcome."}
                      </p>
                    )}
                  </div>
                )}
                <p className="mt-4 text-sm text-foreground">{insight.content.summary}</p>
                <Section title="Observations" items={insight.content.observations ?? []} />
                <Section
                  title="Uncertainties"
                  items={(insight.content.uncertainties ?? []).map((item) => ({
                    title: item.title,
                    explanation: item.explanation,
                  }))}
                />
                <p className="mt-4 text-xs text-subtle-foreground">
                  All figures are calculated by CareerPilot from your stored records. This describes recorded
                  activity only, not your employability or any hiring prediction.
                </p>

                <Recommendations insightId={insight.id} />
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
