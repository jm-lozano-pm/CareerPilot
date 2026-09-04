import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Briefcase,
  ExternalLink,
  FileText,
  Pencil,
  RefreshCw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { SurfaceCard, SurfaceCardTitle } from "@/components/ui/surface-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { JobSheet } from "@/components/jobs/job-sheet";
import { MatchPanel } from "@/components/jobs/match-panel";
import { OpportunityPanel } from "@/components/jobs/opportunity-panel";
import { TailorCvPanel } from "@/components/jobs/tailor-cv-panel";
import { RecordApplicationDialog } from "@/components/jobs/record-application-dialog";
import { RecordOutcomeDialog, type OutcomeTarget } from "@/components/jobs/record-outcome-dialog";

import { friendlyDataError } from "@/lib/auth-errors";
import { cvKeys, fetchCvs } from "@/lib/cv-data";
import {
  BOARD_LABELS,
  OUTCOME_LABELS,
  deleteJob,
  fetchJob,
  fetchStatusHistory,
  formatDate,
  formatDateTime,
  jobKeys,
  recordApplication,
  recordOutcome,
  safeExternalUrl,
  statusLabel,
  transitionApplication,
  updateJob,
  type JobFormValues,
  type RecordApplicationValues,
  type RecordOutcomeValues,
} from "@/lib/jobs-data";

const JOB_TABS = ["overview", "match", "application", "insights"] as const;
type JobTab = (typeof JOB_TABS)[number];

export const Route = createFileRoute("/app/jobs/$jobId")({
  validateSearch: (search: Record<string, unknown>): { tab?: JobTab } => {
    const tab = search["tab"];
    return typeof tab === "string" && (JOB_TABS as readonly string[]).includes(tab)
      ? { tab: tab as JobTab }
      : {};
  },


  head: () => ({
    meta: [
      { title: "Job detail — CareerPilot" },
      {
        name: "description",
        content: "Review a saved opportunity, its application status and recorded outcome.",
      },
      { property: "og:title", content: "Job detail — CareerPilot" },
      { property: "og:description", content: "Review a saved opportunity and its application history." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: JobDetailPage,
});

function Field({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-subtle-foreground">{label}</dt>
      <dd className="mt-1 text-sm whitespace-pre-line text-foreground">{value}</dd>
    </div>
  );
}

function JobDetailPage() {
  const { jobId } = Route.useParams();
  const activeTab: JobTab = Route.useSearch().tab ?? "overview";

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [editOpen, setEditOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [outcomeTarget, setOutcomeTarget] = useState<OutcomeTarget | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const jobQuery = useQuery({ queryKey: jobKeys.detail(jobId), queryFn: () => fetchJob(jobId) });
  const job = jobQuery.data ?? null;
  const application = job?.application ?? null;

  const historyQuery = useQuery({
    queryKey: jobKeys.history(application?.id ?? "none"),
    queryFn: () => fetchStatusHistory(application!.id),
    enabled: Boolean(application?.id),
  });

  const cvsQuery = useQuery({ queryKey: cvKeys.all, queryFn: fetchCvs });
  const linkedCv = (cvsQuery.data ?? []).find((cv) => cv.id === application?.cvId) ?? null;

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(jobId) }),
      queryClient.invalidateQueries({ queryKey: jobKeys.all }),
      queryClient.invalidateQueries({ queryKey: jobKeys.history(application?.id ?? "none") }),
    ]);
  }

  const update = useMutation({
    mutationFn: (values: JobFormValues) => updateJob(job!, values),
    onSuccess: async () => {
      await refresh();
      setEditOpen(false);
      toast.success("Job updated.");
    },
  });

  const apply = useMutation({
    mutationFn: (values: RecordApplicationValues) => recordApplication({ jobId, values }),
    onSuccess: async () => {
      await refresh();
      setApplyOpen(false);
      toast.success("Application recorded.");
    },
  });

  const transition = useMutation({
    mutationFn: (to: "applied" | "interview" | "offer") =>
      transitionApplication({ applicationId: application!.id, to }),
    onSuccess: async (_data, to) => {
      await refresh();
      toast.success(`Moved to ${BOARD_LABELS[to]}.`);
    },
    onError: (error) => toast.error(friendlyDataError(error)),
  });

  const outcome = useMutation({
    mutationFn: (values: RecordOutcomeValues) =>
      recordOutcome({ applicationId: application!.id, values }),
    onSuccess: async () => {
      await refresh();
      setOutcomeTarget(null);
      toast.success("Outcome recorded.");
    },
  });

  const remove = useMutation({
    mutationFn: () => deleteJob(jobId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: jobKeys.all });
      toast.success("Job deleted.");
      navigate({ to: "/app/jobs" });
    },
    onError: (error) => toast.error(friendlyDataError(error)),
  });

  if (jobQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (jobQuery.isError) {
    return (
      <SurfaceCard>
        <EmptyState
          icon={RefreshCw}
          title="We couldn't load this job"
          description={friendlyDataError(jobQuery.error)}
          action={
            <Button variant="outline" onClick={() => jobQuery.refetch()}>
              Try again
            </Button>
          }
        />
      </SurfaceCard>
    );
  }

  if (!job) {
    return (
      <SurfaceCard>
        <EmptyState
          icon={Briefcase}
          title="Job not found"
          description="This job may have been deleted."
          action={
            <Button variant="outline" asChild>
              <Link to="/app/jobs">Back to Jobs</Link>
            </Button>
          }
        />
      </SurfaceCard>
    );
  }

  const url = safeExternalUrl(job.sourceUrl);
  const terminal = application ? ["rejected", "withdrawn", "closed"].includes(application.currentStatus) : false;
  const canDelete = application === null;

  const statusHistoryCard = (
    <SurfaceCard as="section">
      <SurfaceCardTitle>Status history</SurfaceCardTitle>
      {!application ? (
        <p className="mt-3 text-sm text-muted-foreground">
          No application recorded yet, so there is no status history.
        </p>
      ) : historyQuery.isLoading ? (
        <Skeleton className="mt-4 h-20 w-full" />
      ) : (historyQuery.data ?? []).length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No status changes recorded yet.</p>
      ) : (
        <ol className="mt-4 space-y-3">
          {(historyQuery.data ?? []).map((entry) => (
            <li key={entry.id} className="flex flex-wrap items-baseline gap-x-2 text-sm">
              <span className="text-foreground">
                {entry.fromStatus ? `${statusLabel(entry.fromStatus)} → ` : ""}
                <span className="font-medium">{statusLabel(entry.toStatus)}</span>
              </span>
              <span className="text-xs text-muted-foreground">{formatDateTime(entry.changedAt)}</span>
            </li>
          ))}
        </ol>
      )}
    </SurfaceCard>
  );



  return (
    <>
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild className="gap-1.5 -ml-2">
          <Link to="/app/jobs">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to Jobs
          </Link>
        </Button>
      </div>

      <PageHeader
        title={job.title}
        description={job.company}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" aria-hidden="true" />
              Edit
            </Button>
            {canDelete ? (
              <Button variant="outline" className="gap-2" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="size-4" aria-hidden="true" />
                Delete
              </Button>
            ) : (
              <Button variant="outline" className="gap-2" disabled title="An application exists for this job.">
                <Trash2 className="size-4" aria-hidden="true" />
                Delete
              </Button>
            )}
          </div>
        }
      />

      {!canDelete && (
        <p className="mt-3 text-sm text-muted-foreground">
          This job can't be deleted because an application is recorded against it. Your application history stays
          intact.
        </p>
      )}

      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          void navigate({
            to: "/app/jobs/$jobId",
            params: { jobId },
            search: { tab: value as JobTab },
            replace: true,
          })
        }
        className="mt-8"
      >
        <div className="overflow-x-auto">
          <TabsList aria-label="Job detail sections">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="match">CV Match</TabsTrigger>
            <TabsTrigger value="application">Application</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-6">
          <SurfaceCard as="section">

            <SurfaceCardTitle>Opportunity</SurfaceCardTitle>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Company" value={job.company} />
              <Field label="Location" value={job.location} />
              <Field label="Employment type" value={job.employmentType} />
              <Field label="Source" value={job.source} />
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-subtle-foreground">
                  Board status
                </dt>
                <dd className="mt-1 text-sm text-foreground">{BOARD_LABELS[job.boardStatus]}</dd>
              </div>
              {url && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-subtle-foreground">
                    Original listing
                  </dt>
                  <dd className="mt-1 text-sm">
                    <a
                      className="inline-flex items-center gap-1.5 text-primary underline-offset-4 hover:underline"
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                    >
                      Open listing
                      <ExternalLink className="size-3.5" aria-hidden="true" />
                    </a>
                  </dd>
                </div>
              )}
            </dl>
            {job.description && (
              <div className="mt-6 border-t border-border pt-5">
                <h3 className="text-sm font-medium text-foreground">Job description</h3>
                <p className="mt-2 text-sm whitespace-pre-line text-muted-foreground">{job.description}</p>
              </div>
            )}
            {job.personalNotes && (
              <div className="mt-6 border-t border-border pt-5">
                <h3 className="text-sm font-medium text-foreground">Personal notes</h3>
                <p className="mt-2 text-sm whitespace-pre-line text-muted-foreground">{job.personalNotes}</p>
              </div>
            )}
          </SurfaceCard>
        </TabsContent>

        <TabsContent value="match" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <MatchPanel job={job} cvs={cvsQuery.data ?? []} cvsLoading={cvsQuery.isLoading} />
            <TailorCvPanel job={job} cvs={cvsQuery.data ?? []} />
          </div>
        </TabsContent>

        <TabsContent value="application" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">

          <SurfaceCard as="section">
            <SurfaceCardTitle>Application</SurfaceCardTitle>
            {!application ? (
              <>
                <p className="mt-3 text-sm text-muted-foreground">
                  This job is saved. Record an application when you have applied.
                </p>
                <Button className="mt-4 w-full" onClick={() => setApplyOpen(true)}>
                  Record application
                </Button>
              </>
            ) : (
              <div className="mt-4 space-y-4">
                <dl className="space-y-4">
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-subtle-foreground">
                      Current status
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-foreground">
                      {BOARD_LABELS[application.currentStatus]}
                    </dd>
                  </div>
                  <Field label="Applied on" value={formatDate(application.applicationDate)} />
                  {application.notes && <Field label="Application notes" value={application.notes} />}
                  {application.cvId && (
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-subtle-foreground">
                        CV used
                      </dt>
                      <dd className="mt-1 text-sm">
                        <Link
                          to="/app/cvs/$cvId"
                          params={{ cvId: application.cvId }}
                          className="inline-flex items-center gap-1.5 text-primary underline-offset-4 hover:underline"
                        >
                          <FileText className="size-3.5" aria-hidden="true" />
                          {linkedCv?.name ?? "Open linked CV"}
                        </Link>
                      </dd>
                    </div>
                  )}
                  {application.outcome && (
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-subtle-foreground">
                        Outcome
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-foreground">
                        {OUTCOME_LABELS[application.outcome.outcome]}
                        <span className="ml-2 font-normal text-muted-foreground">
                          {formatDate(application.outcome.outcomeDate)}
                        </span>
                      </dd>
                      {application.outcome.employerFeedback && (
                        <div className="mt-3 rounded-md border border-border bg-muted-surface px-3 py-2">
                          <p className="text-xs font-medium uppercase tracking-wide text-subtle-foreground">
                            Recorded employer feedback
                          </p>
                          <p className="mt-1 text-sm whitespace-pre-line text-foreground">
                            {application.outcome.employerFeedback}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            As stated by the employer or recruiter, recorded by you. CareerPilot does not
                            interpret or infer employer motives.
                          </p>
                        </div>
                      )}
                      {application.outcome.notes && (
                        <div className="mt-3">
                          <p className="text-xs font-medium uppercase tracking-wide text-subtle-foreground">
                            Your personal notes
                          </p>
                          <p className="mt-1 text-sm whitespace-pre-line text-muted-foreground">
                            {application.outcome.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                </dl>

                {!terminal && (
                  <div className="space-y-3 border-t border-border pt-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="application-status-select"
                        className="text-sm font-medium text-foreground"
                      >
                        Update application status
                      </label>
                      <Select
                        value={application.currentStatus}
                        disabled={transition.isPending}
                        onValueChange={(value) => {
                          if (value === application.currentStatus) return;
                          if (value === "rejected" || value === "withdrawn" || value === "closed") {
                            setOutcomeTarget(value);
                            return;
                          }
                          transition.mutate(value as "applied" | "interview" | "offer");
                        }}
                      >
                        <SelectTrigger
                          id="application-status-select"
                          aria-describedby="application-status-help"
                          className="w-full"
                        >
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Active stages</SelectLabel>
                            <SelectItem value="applied">Applied</SelectItem>
                            <SelectItem value="interview">Interview</SelectItem>
                            <SelectItem value="offer">Offer</SelectItem>
                          </SelectGroup>
                          <SelectGroup>
                            <SelectLabel>Outcomes</SelectLabel>
                            <SelectItem value="rejected">Rejected…</SelectItem>
                            <SelectItem value="withdrawn">Withdrawn…</SelectItem>
                            <SelectItem value="closed">
                              {application.currentStatus === "offer"
                                ? "Close (accept or decline offer)…"
                                : "Closed…"}
                            </SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <p id="application-status-help" className="text-xs text-muted-foreground">
                        Active stages can be corrected in either direction. Choosing an outcome opens the Record
                        outcome step so you can capture employer feedback.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </SurfaceCard>

            {statusHistoryCard}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="mt-6">
          <div className="max-w-3xl">
            <OpportunityPanel job={job} cvs={cvsQuery.data ?? []} />
          </div>
        </TabsContent>
      </Tabs>


      <JobSheet
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) update.reset();
        }}
        job={job}
        saving={update.isPending}
        errorMessage={update.isError ? friendlyDataError(update.error) : null}
        onSubmit={(values) => update.mutate(values)}
      />

      <RecordApplicationDialog
        job={job}
        open={applyOpen}
        onOpenChange={(open) => {
          setApplyOpen(open);
          if (!open) apply.reset();
        }}
        saving={apply.isPending}
        errorMessage={apply.isError ? friendlyDataError(apply.error) : null}
        onSubmit={(values) => apply.mutate(values)}
      />

      <RecordOutcomeDialog
        job={job}
        target={outcomeTarget ?? "closed"}
        open={outcomeTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setOutcomeTarget(null);
            outcome.reset();
          }
        }}
        saving={outcome.isPending}
        errorMessage={outcome.isError ? friendlyDataError(outcome.error) : null}
        onSubmit={(values) => outcome.mutate(values)}
      />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this job?</AlertDialogTitle>
            <AlertDialogDescription>
              “{job.title}” at {job.company} will be permanently removed. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={remove.isPending} onClick={() => remove.mutate()}>
              Delete job
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
