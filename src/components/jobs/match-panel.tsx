import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { SurfaceCard, SurfaceCardTitle } from "@/components/ui/surface-card";
import { analyseMatch } from "@/lib/ai-analysis.functions";
import { aiKeys, fetchMatchAssessments } from "@/lib/ai-data";
import {
  MATCH_DISCLAIMER,
  NOT_ENOUGH_REQUIREMENTS,
  matchScoreLabel,
  type MatchRequirement,
} from "@/lib/ai-shared";
import { friendlyDataError } from "@/lib/auth-errors";
import { formatDateTime, type JobRecord } from "@/lib/jobs-data";
import type { CvRecord } from "@/lib/cv-data";

type Props = { job: JobRecord; cvs: CvRecord[]; cvsLoading: boolean };

function RequirementList({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: MatchRequirement[];
  emptyLabel: string;
}) {
  return (
    <div>
      <h4 className="text-xs font-medium uppercase tracking-wide text-subtle-foreground">{title}</h4>
      {items.length === 0 ? (
        <p className="mt-1.5 text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <ul className="mt-1.5 space-y-1.5">
          {items.map((req) => (
            <li key={req.id} className="text-sm text-foreground">
              {req.text}
              {req.evidence_note && (
                <span className="block text-xs text-muted-foreground">{req.evidence_note}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function MatchPanel({ job, cvs, cvsLoading }: Props) {
  const queryClient = useQueryClient();
  const run = useServerFn(analyseMatch);
  const [cvId, setCvId] = useState("");

  const assessments = useQuery({
    queryKey: aiKeys.match(job.id),
    queryFn: () => fetchMatchAssessments(job.id),
  });

  useEffect(() => {
    if (!cvId && cvs.length > 0) setCvId(cvs[0]!.id);
  }, [cvs, cvId]);

  const analyse = useMutation({
    mutationFn: () => run({ data: { jobId: job.id, cvId } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: aiKeys.match(job.id) });
      toast.success("Match assessment ready.");
    },
    onError: (error) => toast.error(friendlyDataError(error)),
  });

  const selectedCv = cvs.find((cv) => cv.id === cvId) ?? null;
  const assessment = (assessments.data ?? []).find((item) => item.cvId === cvId) ?? null;
  const stale =
    assessment !== null &&
    (assessment.jobContentVersion !== job.contentVersion ||
      (selectedCv ? assessment.cvContentVersion !== selectedCv.contentVersion : false));

  const requirements = assessment?.breakdown.requirements ?? [];
  const required = requirements.filter((r) => r.importance === "required");
  const preferred = requirements.filter((r) => r.importance === "preferred");
  const partial = requirements.filter((r) => r.evidence_state === "partial");
  const gaps = requirements.filter((r) => r.evidence_state === "not_evidenced");

  return (
    <SurfaceCard as="section">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-ai" aria-hidden="true" />
        <SurfaceCardTitle>Match assessment</SurfaceCardTitle>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <Label htmlFor="match-cv">CV to compare</Label>
          {cvsLoading ? (
            <Skeleton className="mt-1.5 h-9 w-full" />
          ) : cvs.length === 0 ? (
            <p className="mt-1.5 text-sm text-muted-foreground">
              Create a CV first —{" "}
              <Link to="/app/cvs" className="text-primary underline-offset-4 hover:underline">
                open CVs
              </Link>
              .
            </p>
          ) : (
            <select
              id="match-cv"
              className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
              value={cvId}
              onChange={(event) => setCvId(event.target.value)}
            >
              {cvs.map((cv) => (
                <option key={cv.id} value={cv.id}>
                  {cv.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <Button
          className="w-full gap-2"
          disabled={!cvId || analyse.isPending}
          onClick={() => analyse.mutate()}
        >
          {analyse.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Comparing this CV with the job description…
            </>
          ) : assessment ? (
            "Reanalyse match"
          ) : (
            "Analyse match"
          )}
        </Button>

        {analyse.isError && (
          <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {friendlyDataError(analyse.error)}
          </p>
        )}
      </div>

      {assessments.isLoading ? (
        <Skeleton className="mt-5 h-24 w-full" />
      ) : assessments.isError ? (
        <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCw className="size-4" aria-hidden="true" />
          <button className="underline underline-offset-4" onClick={() => assessments.refetch()}>
            Couldn't load saved assessments — retry
          </button>
        </div>
      ) : !assessment ? (
        <p className="mt-5 text-sm text-muted-foreground">
          No assessment generated for this CV yet. Nothing runs automatically.
        </p>
      ) : (
        <div className="mt-5 space-y-4 border-t border-border pt-5">
          {stale && (
            <p className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground">
              The job or CV changed since this assessment was generated. Reanalyse for an up-to-date view.
            </p>
          )}

          {assessment.score === null ? (
            <p className="text-sm font-medium text-foreground">{NOT_ENOUGH_REQUIREMENTS}</p>
          ) : (
            <div>
              <p className="text-3xl font-semibold text-foreground">{assessment.score}</p>
              <p className="text-sm text-muted-foreground">{matchScoreLabel(assessment.score)}</p>
            </div>
          )}

          <RequirementList
            title="Required requirements"
            items={required}
            emptyLabel="No explicitly required requirements were identified."
          />
          <RequirementList
            title="Preferred requirements"
            items={preferred}
            emptyLabel="No preferred requirements were identified."
          />
          <RequirementList title="Partial evidence" items={partial} emptyLabel="No partial evidence noted." />
          <RequirementList title="Possible gaps" items={gaps} emptyLabel="No gaps identified." />

          {assessment.explanation.terminology_opportunities.length > 0 && (
            <div>
              <h4 className="text-xs font-medium uppercase tracking-wide text-subtle-foreground">
                Terminology opportunities
              </h4>
              <ul className="mt-1.5 space-y-1.5">
                {assessment.explanation.terminology_opportunities.map((item) => (
                  <li key={item.term} className="text-sm text-foreground">
                    {item.term}
                    {item.reason && <span className="block text-xs text-muted-foreground">{item.reason}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {assessment.explanation.uncertainties.length > 0 && (
            <div>
              <h4 className="text-xs font-medium uppercase tracking-wide text-subtle-foreground">Uncertainties</h4>
              <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                {assessment.explanation.uncertainties.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            {assessment.explanation.cv_name || selectedCv?.name} · generated {formatDateTime(assessment.createdAt)}
          </p>
          <p className="text-xs text-muted-foreground">{MATCH_DISCLAIMER}</p>
        </div>
      )}
    </SurfaceCard>
  );
}
