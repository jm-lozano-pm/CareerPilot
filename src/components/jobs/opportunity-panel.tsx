import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { SurfaceCard, SurfaceCardTitle } from "@/components/ui/surface-card";
import { analyseOpportunity } from "@/lib/ai-analysis.functions";
import { aiKeys, fetchOpportunityInsight } from "@/lib/ai-data";
import { friendlyDataError } from "@/lib/auth-errors";
import { formatDateTime, type JobRecord } from "@/lib/jobs-data";
import type { CvRecord } from "@/lib/cv-data";
import { RecommendationList } from "@/components/insights/recommendation-list";


type Props = { job: JobRecord; cvs: CvRecord[] };

function Group({
  title,
  items,
}: {
  title: string;
  items: { title: string; explanation?: string; rationale?: string; status?: string }[];
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <h4 className="text-xs font-medium uppercase tracking-wide text-subtle-foreground">{title}</h4>
      <ul className="mt-1.5 space-y-2">
        {items.map((item) => (
          <li key={item.title}>
            <p className="text-sm font-medium text-foreground">
              {item.title}
              {item.status && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">({item.status.replace(/_/g, " ")})</span>
              )}
            </p>
            <p className="text-sm text-muted-foreground">{item.explanation ?? item.rationale}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function OpportunityPanel({ job, cvs }: Props) {
  const queryClient = useQueryClient();
  const run = useServerFn(analyseOpportunity);
  const [cvId, setCvId] = useState("");

  const insight = useQuery({
    queryKey: aiKeys.opportunity(job.id),
    queryFn: () => fetchOpportunityInsight(job.id),
  });

  const analyse = useMutation({
    mutationFn: () => run({ data: { jobId: job.id, cvId: cvId || null } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: aiKeys.opportunity(job.id) });
      toast.success("Opportunity analysis ready.");
    },
    onError: (error) => toast.error(friendlyDataError(error)),
  });

  const data = insight.data;
  const selectedCv = cvs.find((cv) => cv.id === data?.contextRefs.cv_id) ?? null;
  const stale =
    data !== null &&
    data !== undefined &&
    (data.contextRefs.job_content_version !== job.contentVersion ||
      (selectedCv ? data.contextRefs.cv_content_version !== selectedCv.contentVersion : false));

  return (
    <SurfaceCard as="section">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-ai" aria-hidden="true" />
        <SurfaceCardTitle>Opportunity analysis</SurfaceCardTitle>
      </div>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Uses this job, your career profile and goals. Runs only when you ask.
      </p>

      <div className="mt-4 space-y-3">
        <div>
          <Label htmlFor="opportunity-cv">Include a CV (optional)</Label>
          <select
            id="opportunity-cv"
            className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
            value={cvId}
            onChange={(event) => setCvId(event.target.value)}
          >
            <option value="">No CV — profile only</option>
            {cvs.map((cv) => (
              <option key={cv.id} value={cv.id}>
                {cv.name}
              </option>
            ))}
          </select>
        </div>
        <Button variant="outline" className="w-full gap-2" disabled={analyse.isPending} onClick={() => analyse.mutate()}>
          {analyse.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Analysing this opportunity against your profile…
            </>
          ) : data ? (
            "Reanalyse opportunity"
          ) : (
            "Analyse opportunity"
          )}
        </Button>
        {analyse.isError && (
          <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {friendlyDataError(analyse.error)}
          </p>
        )}
      </div>

      {insight.isLoading ? (
        <Skeleton className="mt-5 h-24 w-full" />
      ) : insight.isError ? (
        <button
          className="mt-5 text-sm text-muted-foreground underline underline-offset-4"
          onClick={() => insight.refetch()}
        >
          Couldn't load the saved analysis — retry
        </button>
      ) : !data ? (
        <p className="mt-5 text-sm text-muted-foreground">No analysis generated for this job yet.</p>
      ) : (
        <div className="mt-5 space-y-4 border-t border-border pt-5">
          {stale && (
            <p className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground">
              The job or CV changed since this analysis was generated. Reanalyse for an up-to-date view.
            </p>
          )}
          <Group title="Documented alignment" items={data.content.alignment} />
          <Group title="Possible gaps" items={data.content.possible_gaps} />
          <Group title="Goal considerations" items={data.content.goal_considerations} />
          <Group title="Effort considerations" items={data.content.effort_considerations} />
          <Group title="Uncertainties" items={data.content.uncertainties} />
          <p className="text-xs text-muted-foreground">
            Generated {formatDateTime(data.generatedAt)} · job version {data.contextRefs.job_content_version}
            {data.contextRefs.cv_id ? ` · CV version ${data.contextRefs.cv_content_version}` : ""}
          </p>
          {/* Suggested next steps run through the same recommendation loop as
              Dashboard insights: review, rate or dismiss — never automatic. */}
          <RecommendationList
            insightId={data.id}
            title="Suggested next steps"
            description="Suggestions you stay in control of. Nothing is applied to this job automatically."
          />

        </div>
      )}
    </SurfaceCard>
  );
}
