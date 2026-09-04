import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SurfaceCard, SurfaceCardTitle } from "@/components/ui/surface-card";
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
import { tailorCvForJob } from "@/lib/ai-analysis.functions";
import { cvKeys, type CvRecord } from "@/lib/cv-data";
import { friendlyDataError } from "@/lib/auth-errors";
import type { JobRecord } from "@/lib/jobs-data";

type Props = { job: JobRecord; cvs: CvRecord[] };

export function TailorCvPanel({ job, cvs }: Props) {
  const queryClient = useQueryClient();
  const run = useServerFn(tailorCvForJob);
  const [cvId, setCvId] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [created, setCreated] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (!cvId && cvs.length > 0) setCvId(cvs[0]!.id);
  }, [cvs, cvId]);

  const tailor = useMutation({
    mutationFn: () => run({ data: { jobId: job.id, cvId } }),
    onSuccess: async (result) => {
      setCreated({ id: result.cvId, name: result.name });
      await queryClient.invalidateQueries({ queryKey: cvKeys.all });
      toast.success("A tailored copy was created. Your original CV is unchanged.");
    },
    onError: (error) => toast.error(friendlyDataError(error)),
  });

  return (
    <SurfaceCard as="section">
      <div className="flex items-center gap-2">
        <Wand2 className="size-4 text-ai" aria-hidden="true" />
        <SurfaceCardTitle>Tailor a CV for this job</SurfaceCardTitle>
      </div>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Creates a new copy using only evidence already in the selected CV. The source CV is never changed.
      </p>

      {cvs.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Create a CV first —{" "}
          <Link to="/app/cvs" className="text-primary underline-offset-4 hover:underline">
            open CVs
          </Link>
          .
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          <div>
            <Label htmlFor="tailor-cv">Source CV</Label>
            <select
              id="tailor-cv"
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
          </div>
          <Button
            variant="outline"
            className="w-full gap-2"
            disabled={!cvId || tailor.isPending}
            onClick={() => setConfirmOpen(true)}
          >
            {tailor.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Creating a tailored copy…
              </>
            ) : (
              "Tailor CV for this job"
            )}
          </Button>
          {tailor.isError && (
            <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {friendlyDataError(tailor.error)}
            </p>
          )}
          {created && (
            <p className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground">
              Created “{created.name}” —{" "}
              <Link
                to="/app/cvs/$cvId"
                params={{ cvId: created.id }}
                className="text-primary underline-offset-4 hover:underline"
              >
                review and edit it
              </Link>
              .
            </p>
          )}
        </div>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create a tailored copy?</AlertDialogTitle>
            <AlertDialogDescription>
              CareerPilot will create a new CV named after this job, using only wording and evidence from your
              selected CV. Hidden sections and your contact details are not sent for analysis and stay as they are.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => tailor.mutate()}>Create tailored copy</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SurfaceCard>
  );
}
