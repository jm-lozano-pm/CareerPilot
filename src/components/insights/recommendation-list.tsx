import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { friendlyDataError } from "@/lib/auth-errors";
import { fetchRecommendations, type RecommendationRecord } from "@/lib/insights-data";
import { RecommendationCard } from "@/components/dashboard/recommendation-card";

/**
 * The single recommendation control loop, shared by Job-Search Insights and
 * Opportunity analysis. Recommendations are suggestions only: reviewing,
 * rating or dismissing one never changes a job, CV or application.
 */
export function RecommendationList({
  insightId,
  title = "Recommended actions",
  description = "Suggestions you stay in control of — dismiss anything that doesn't fit.",
}: {
  insightId: string;
  title?: string;
  description?: string;
}) {
  const query = useQuery({
    queryKey: ["insights", "recommendations", insightId] as const,
    queryFn: () => fetchRecommendations(insightId),
  });

  if (query.isPending) return <Skeleton className="mt-4 h-24 rounded-xl" />;
  if (query.isError) {
    return <p className="mt-4 text-sm text-destructive">{friendlyDataError(query.error)}</p>;
  }

  const all: RecommendationRecord[] = query.data ?? [];
  if (all.length === 0) return null;
  const active = all.filter((item) => item.state === "active");
  const dismissed = all.filter((item) => item.state === "dismissed");

  return (
    <div className="mt-5 border-t border-border pt-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      {active.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          You've dismissed every suggested action from this analysis.
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {active.map((item) => (
            <RecommendationCard key={item.id} recommendation={item} insightId={insightId} />
          ))}
        </ul>
      )}
      {dismissed.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-medium text-primary">
            Dismissed actions ({dismissed.length})
          </summary>
          <ul className="mt-3 space-y-3">
            {dismissed.map((item) => (
              <RecommendationCard key={item.id} recommendation={item} insightId={insightId} />
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
