import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  EMPLOYMENT_TYPES,
  jobFormSchema,
  normaliseEmploymentType,
  type JobFormValues,
  type JobRecord,
} from "@/lib/jobs-data";
import { importJobFromUrl } from "@/lib/job-import.functions";
import { IMPORT_MESSAGES } from "@/lib/ai-shared";


type JobSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job?: JobRecord | null;
  saving: boolean;
  errorMessage?: string | null;
  onSubmit: (values: JobFormValues) => void;
};

function defaults(job?: JobRecord | null): JobFormValues {
  return {
    title: job?.title ?? "",
    company: job?.company ?? "",
    location: job?.location ?? "",
    employment_type: job?.employmentType ?? "",
    description: job?.description ?? "",
    source: job?.source ?? "",
    source_url: job?.sourceUrl ?? "",
    personal_notes: job?.personalNotes ?? "",
  };
}

export function JobSheet({ open, onOpenChange, job, saving, errorMessage, onSubmit }: JobSheetProps) {
  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: defaults(job),
  });

  useEffect(() => {
    if (open) form.reset(defaults(job));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, job?.id]);

  const errors = form.formState.errors;
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const runImport = useServerFn(importJobFromUrl);

  const importDetails = useMutation({
    mutationFn: (url: string) => runImport({ data: { url } }),
    onSuccess: (result) => {
      if (!result.ok) {
        setImportNotice(result.message);
        return;
      }
      const { extraction } = result;
      const apply = (field: keyof JobFormValues, value: string | null) => {
        if (value && value.trim()) form.setValue(field, value.trim(), { shouldDirty: true });
      };
      apply("title", extraction.job_title.value);
      apply("company", extraction.company.value);
      apply("description", extraction.description.value);
      apply("location", extraction.location.value);
      apply("source", result.source);
      const match = normaliseEmploymentType(extraction.employment_type.value);
      if (match) form.setValue("employment_type", match, { shouldDirty: true });
      setImportNotice(result.notice);
    },
    onError: () => setImportNotice(IMPORT_MESSAGES.inaccessible),
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:max-w-[560px]"
        aria-describedby="job-sheet-description"
      >
        <SheetHeader>
          <SheetTitle>{job ? "Edit job" : "Add job"}</SheetTitle>
          <SheetDescription id="job-sheet-description">
            Save an opportunity you found yourself. CareerPilot never searches or imports jobs on your behalf.
          </SheetDescription>
        </SheetHeader>

        <form
          className="space-y-5 px-4 pb-8"
          onSubmit={form.handleSubmit((values) => onSubmit(values))}
          noValidate
        >
          <div className="rounded-lg border border-border bg-surface-muted p-3">
            <Label htmlFor="job-source-url">Job URL</Label>
            <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
              <Input
                id="job-source-url"
                placeholder="https://"
                inputMode="url"
                {...form.register("source_url")}
              />
              <Button
                type="button"
                variant="secondary"
                className="shrink-0 gap-2"
                disabled={importDetails.isPending}
                onClick={() => {
                  const url = form.getValues("source_url").trim();
                  setImportNotice(null);
                  if (!/^https?:\/\/\S+$/i.test(url)) {
                    setImportNotice("Enter a full job page address starting with http:// or https://.");
                    return;
                  }
                  importDetails.mutate(url);
                }}
              >
                {importDetails.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                {importDetails.isPending ? "Reading the job page…" : "Import details"}
              </Button>
            </div>
            {errors.source_url && (
              <p className="mt-1.5 text-sm text-destructive">{errors.source_url.message}</p>
            )}
            {importNotice ? (
              <p role="status" className="mt-2 text-xs text-foreground">
                {importNotice}
              </p>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">
                CareerPilot can read a public job page and fill in the fields below for you to review. Nothing is
                saved until you save the job.
              </p>
            )}
          </div>


          <div>
            <Label htmlFor="job-title">Job title</Label>
            <Input id="job-title" className="mt-1.5" {...form.register("title")} />
            {errors.title && <p className="mt-1.5 text-sm text-destructive">{errors.title.message}</p>}
          </div>

          <div>
            <Label htmlFor="job-company">Company</Label>
            <Input id="job-company" className="mt-1.5" {...form.register("company")} />
            {errors.company && (
              <p className="mt-1.5 text-sm text-destructive">{errors.company.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="job-location">Location</Label>
              <Input id="job-location" className="mt-1.5" {...form.register("location")} />
              {errors.location && (
                <p className="mt-1.5 text-sm text-destructive">{errors.location.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="job-employment-type">Employment type</Label>
              <select
                id="job-employment-type"
                className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                {...form.register("employment_type")}
              >
                <option value="">Not specified</option>
                {job?.employmentType &&
                !(EMPLOYMENT_TYPES as readonly string[]).includes(job.employmentType) ? (
                  <option value={job.employmentType}>{job.employmentType}</option>
                ) : null}
                {EMPLOYMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="job-description">
              Job description <span aria-hidden="true">*</span>
              <span className="sr-only">(required)</span>
            </Label>
            <Textarea
              id="job-description"
              rows={6}
              required
              aria-required="true"
              className="mt-1.5"
              aria-invalid={errors.description ? true : undefined}
              aria-describedby={
                errors.description ? "job-description-error" : "job-description-hint"
              }
              {...form.register("description")}
            />
            {errors.description ? (
              <p id="job-description-error" className="mt-1.5 text-sm text-destructive">
                {errors.description.message}
              </p>
            ) : (
              <p id="job-description-hint" className="mt-1.5 text-xs text-subtle-foreground">
                Paste the full description. Extracting from a URL may only prefill part of it — you
                need to complete it before saving.
              </p>
            )}
          </div>


          <div>
            <Label htmlFor="job-source">Source</Label>
            <Input
              id="job-source"
              className="mt-1.5"
              placeholder="Company site, referral, job board…"
              {...form.register("source")}
            />
            {errors.source && <p className="mt-1.5 text-sm text-destructive">{errors.source.message}</p>}
          </div>

          <div>
            <Label htmlFor="job-notes">Personal notes</Label>
            <Textarea id="job-notes" rows={4} className="mt-1.5" {...form.register("personal_notes")} />
            {errors.personal_notes && (
              <p className="mt-1.5 text-sm text-destructive">{errors.personal_notes.message}</p>
            )}
          </div>

          {errorMessage && (
            <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {job ? "Save changes" : "Save job"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
