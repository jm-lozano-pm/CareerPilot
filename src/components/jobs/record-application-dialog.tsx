import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
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
import { cvKeys, fetchCvs } from "@/lib/cv-data";
import {
  recordApplicationSchema,
  todayIso,
  type JobRecord,
  type RecordApplicationValues,
} from "@/lib/jobs-data";

type Props = {
  job: JobRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saving: boolean;
  errorMessage?: string | null;
  onSubmit: (values: RecordApplicationValues) => void;
};

export function RecordApplicationDialog({
  job,
  open,
  onOpenChange,
  saving,
  errorMessage,
  onSubmit,
}: Props) {
  const form = useForm<RecordApplicationValues>({
    resolver: zodResolver(recordApplicationSchema),
    defaultValues: { applicationDate: todayIso(), cvId: "", notes: "" },
  });

  const cvsQuery = useQuery({ queryKey: cvKeys.all, queryFn: fetchCvs, enabled: open });

  useEffect(() => {
    if (open) form.reset({ applicationDate: todayIso(), cvId: "", notes: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, job?.id]);

  const errors = form.formState.errors;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Record application</DialogTitle>
          <DialogDescription>
            {job
              ? `Confirm that you applied for ${job.title} at ${job.company}.`
              : "Confirm your application details."}
          </DialogDescription>
        </DialogHeader>

        <form
          id="record-application-form"
          className="space-y-4"
          onSubmit={form.handleSubmit((values) => onSubmit(values))}
          noValidate
        >
          <div>
            <Label htmlFor="application-date">Application date</Label>
            <Input id="application-date" type="date" className="mt-1.5" {...form.register("applicationDate")} />
            {errors.applicationDate && (
              <p className="mt-1.5 text-sm text-destructive">{errors.applicationDate.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="application-cv">CV used (optional)</Label>
            <select
              id="application-cv"
              className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
              {...form.register("cvId")}
            >
              <option value="">No CV linked</option>
              {(cvsQuery.data ?? []).map((cv) => (
                <option key={cv.id} value={cv.id}>
                  {cv.name}
                </option>
              ))}
            </select>
            {cvsQuery.isLoading && <p className="mt-1.5 text-xs text-muted-foreground">Loading your CVs…</p>}
          </div>

          <div>
            <Label htmlFor="application-notes">Notes (optional)</Label>
            <Textarea id="application-notes" rows={3} className="mt-1.5" {...form.register("notes")} />
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
          <Button type="submit" form="record-application-form" disabled={saving} className="gap-2">
            {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            Record application
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
