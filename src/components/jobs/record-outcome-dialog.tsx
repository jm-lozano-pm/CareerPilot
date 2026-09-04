import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  OUTCOME_LABELS,
  recordOutcomeSchema,
  todayIso,
  type JobRecord,
  type Outcome,
  type RecordOutcomeValues,
} from "@/lib/jobs-data";

export type OutcomeTarget = "rejected" | "withdrawn" | "closed";

type Props = {
  job: JobRecord | null;
  target: OutcomeTarget;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saving: boolean;
  errorMessage?: string | null;
  onSubmit: (values: RecordOutcomeValues) => void;
};

/** Closing an application that reached Offer requires an explicit accepted/declined choice. */
function needsOfferChoice(job: JobRecord | null, target: OutcomeTarget): boolean {
  return target === "closed" && job?.application?.currentStatus === "offer";
}

function defaultOutcome(job: JobRecord | null, target: OutcomeTarget): Outcome {
  if (needsOfferChoice(job, target)) return "offer_accepted";
  return target;
}

export function RecordOutcomeDialog({
  job,
  target,
  open,
  onOpenChange,
  saving,
  errorMessage,
  onSubmit,
}: Props) {
  const offerChoice = needsOfferChoice(job, target);
  const form = useForm<RecordOutcomeValues>({
    resolver: zodResolver(recordOutcomeSchema),
    defaultValues: {
      outcome: defaultOutcome(job, target),
      outcomeDate: todayIso(),
      employerFeedback: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        outcome: defaultOutcome(job, target),
        outcomeDate: todayIso(),
        employerFeedback: "",
        notes: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, job?.id, target]);

  const errors = form.formState.errors;
  const outcome = form.watch("outcome");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Record outcome</DialogTitle>
          <DialogDescription>
            {job
              ? `Close out your application for ${job.title} at ${job.company}. This is final and cannot be reopened.`
              : "Record the final outcome of this application."}
          </DialogDescription>
        </DialogHeader>

        <form
          id="record-outcome-form"
          className="space-y-4"
          onSubmit={form.handleSubmit((values) => onSubmit(values))}
          noValidate
        >
          {offerChoice ? (
            <fieldset>
              <legend className="text-sm font-medium text-foreground">Outcome</legend>
              <RadioGroup
                className="mt-2 gap-2"
                value={outcome}
                onValueChange={(value) => form.setValue("outcome", value as Outcome)}
              >
                {(["offer_accepted", "offer_declined"] as const).map((value) => (
                  <div key={value} className="flex items-center gap-2">
                    <RadioGroupItem id={`outcome-${value}`} value={value} />
                    <Label htmlFor={`outcome-${value}`} className="font-normal">
                      {OUTCOME_LABELS[value]}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {errors.outcome && (
                <p className="mt-1.5 text-sm text-destructive">Choose an outcome.</p>
              )}
            </fieldset>
          ) : (
            <p className="text-sm text-muted-foreground">
              Outcome: <span className="font-medium text-foreground">{OUTCOME_LABELS[outcome]}</span>
            </p>
          )}

          <div>
            <Label htmlFor="outcome-date">Outcome date</Label>
            <Input id="outcome-date" type="date" className="mt-1.5" {...form.register("outcomeDate")} />
            {errors.outcomeDate && (
              <p className="mt-1.5 text-sm text-destructive">{errors.outcomeDate.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="outcome-employer-feedback">
              Employer feedback / stated reason (optional)
            </Label>
            <Textarea
              id="outcome-employer-feedback"
              rows={3}
              className="mt-1.5"
              aria-describedby="outcome-employer-feedback-help"
              {...form.register("employerFeedback")}
            />
            <p id="outcome-employer-feedback-help" className="mt-1.5 text-xs text-muted-foreground">
              Only enter information explicitly provided by the employer or recruiter.
            </p>
            {errors.employerFeedback && (
              <p className="mt-1.5 text-sm text-destructive">{errors.employerFeedback.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="outcome-notes">Personal notes (optional)</Label>
            <Textarea id="outcome-notes" rows={3} className="mt-1.5" {...form.register("notes")} />
            {errors.notes && <p className="mt-1.5 text-sm text-destructive">{errors.notes.message}</p>}
          </div>

          {errorMessage && (
            <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </p>
          )}
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="record-outcome-form" disabled={saving} className="gap-2">
            {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            Record outcome
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
