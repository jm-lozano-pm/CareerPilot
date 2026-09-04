import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Briefcase, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { SurfaceCard } from "@/components/ui/surface-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { KanbanBoard } from "@/components/jobs/kanban-board";
import { JobSheet } from "@/components/jobs/job-sheet";
import { RecordApplicationDialog } from "@/components/jobs/record-application-dialog";
import { RecordOutcomeDialog, type OutcomeTarget } from "@/components/jobs/record-outcome-dialog";
import { friendlyDataError } from "@/lib/auth-errors";
import {
  BOARD_LABELS,
  createJob,
  fetchJobs,
  jobKeys,
  planMove,
  recordApplication,
  recordOutcome,
  transitionApplication,
  type BoardStatus,
  type JobFormValues,
  type JobRecord,
  type RecordApplicationValues,
  type RecordOutcomeValues,
} from "@/lib/jobs-data";

export const Route = createFileRoute("/app/jobs/")({
  head: () => ({
    meta: [
      { title: "Jobs — CareerPilot" },
      {
        name: "description",
        content: "Track saved opportunities, applications and outcomes on your CareerPilot job board.",
      },
      { property: "og:title", content: "Jobs — CareerPilot" },
      { property: "og:description", content: "Manage saved opportunities and applications." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: JobsBoardPage,
});

function JobsBoardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [applyJob, setApplyJob] = useState<JobRecord | null>(null);
  const [outcomeState, setOutcomeState] = useState<{ job: JobRecord; target: OutcomeTarget } | null>(null);

  const jobsQuery = useQuery({ queryKey: jobKeys.all, queryFn: fetchJobs });

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: jobKeys.all });
  }

  const create = useMutation({
    mutationFn: (values: JobFormValues) => createJob(values),
    onSuccess: async () => {
      await refresh();
      setSheetOpen(false);
      toast.success("Job saved.");
    },
  });

  const apply = useMutation({
    mutationFn: (input: { jobId: string; values: RecordApplicationValues }) => recordApplication(input),
    onSuccess: async () => {
      await refresh();
      setApplyJob(null);
      toast.success("Application recorded.");
    },
  });

  const transition = useMutation({
    mutationFn: (input: { applicationId: string; to: "applied" | "interview" | "offer" }) =>
      transitionApplication(input),
    onSuccess: async (_data, variables) => {
      await refresh();
      toast.success(`Moved to ${BOARD_LABELS[variables.to]}.`);
    },
    onError: (error) => toast.error(friendlyDataError(error)),
  });

  const outcome = useMutation({
    mutationFn: (input: { applicationId: string; values: RecordOutcomeValues }) => recordOutcome(input),
    onSuccess: async () => {
      await refresh();
      setOutcomeState(null);
      toast.success("Outcome recorded.");
    },
  });

  function handleMove(job: JobRecord, to: BoardStatus) {
    const plan = planMove(job, to);
    if (plan.kind === "invalid") {
      toast.error(plan.reason);
      return;
    }
    if (plan.kind === "noop") return;
    if (plan.kind === "record-application") {
      setApplyJob(job);
      return;
    }
    if (plan.kind === "record-outcome") {
      setOutcomeState({ job, target: plan.to });
      return;
    }
    if (!job.application) return;
    // Active stages only — corrections back to Applied or Interview included
    // (P2.7). Terminal states never reach here; they use the outcome flow.
    if (plan.to === "applied" || plan.to === "interview" || plan.to === "offer") {
      transition.mutate({ applicationId: job.application.id, to: plan.to });
    }
  }

  const jobs = jobsQuery.data ?? [];

  return (
    <>
      <PageHeader
        title="Jobs"
        description="Manage saved opportunities and applications."
        action={
          <Button className="gap-2" onClick={() => setSheetOpen(true)}>
            <Plus className="size-4" aria-hidden="true" />
            Add Job
          </Button>
        }
      />

      <div className="mt-8">
        {jobsQuery.isLoading ? (
          <div className="flex gap-4 overflow-hidden">
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} className="h-48 w-[290px] min-w-[290px] rounded-xl" />
            ))}
          </div>
        ) : jobsQuery.isError ? (
          <SurfaceCard>
            <EmptyState
              icon={RefreshCw}
              title="We couldn't load your jobs"
              description={friendlyDataError(jobsQuery.error)}
              action={
                <Button variant="outline" onClick={() => jobsQuery.refetch()}>
                  Try again
                </Button>
              }
            />
          </SurfaceCard>
        ) : jobs.length === 0 ? (
          <SurfaceCard>
            <EmptyState
              icon={Briefcase}
              title="No saved jobs yet"
              description="Add an opportunity you found yourself. You control what gets tracked — CareerPilot never searches or imports jobs for you."
              action={
                <Button className="gap-2" onClick={() => setSheetOpen(true)}>
                  <Plus className="size-4" aria-hidden="true" />
                  Add Job
                </Button>
              }
            />
          </SurfaceCard>
        ) : (
          <KanbanBoard
            jobs={jobs}
            onOpenJob={(job) => navigate({ to: "/app/jobs/$jobId", params: { jobId: job.id } })}
            onMove={handleMove}
          />
        )}
      </div>

      <JobSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) create.reset();
        }}
        saving={create.isPending}
        errorMessage={create.isError ? friendlyDataError(create.error) : null}
        onSubmit={(values) => create.mutate(values)}
      />

      <RecordApplicationDialog
        job={applyJob}
        open={applyJob !== null}
        onOpenChange={(open) => {
          if (!open) {
            setApplyJob(null);
            apply.reset();
          }
        }}
        saving={apply.isPending}
        errorMessage={apply.isError ? friendlyDataError(apply.error) : null}
        onSubmit={(values) => {
          if (applyJob) apply.mutate({ jobId: applyJob.id, values });
        }}
      />

      <RecordOutcomeDialog
        job={outcomeState?.job ?? null}
        target={outcomeState?.target ?? "closed"}
        open={outcomeState !== null}
        onOpenChange={(open) => {
          if (!open) {
            setOutcomeState(null);
            outcome.reset();
          }
        }}
        saving={outcome.isPending}
        errorMessage={outcome.isError ? friendlyDataError(outcome.error) : null}
        onSubmit={(values) => {
          const applicationId = outcomeState?.job.application?.id;
          if (applicationId) outcome.mutate({ applicationId, values });
        }}
      />
    </>
  );
}
