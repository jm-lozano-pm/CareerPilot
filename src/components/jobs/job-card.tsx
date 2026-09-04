import { forwardRef } from "react";
import { Building2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { OUTCOME_LABELS, type JobRecord } from "@/lib/jobs-data";

type JobCardProps = {
  job: JobRecord;
  dragging?: boolean;
  raised?: boolean;
  className?: string;
};

export const JobCard = forwardRef<HTMLDivElement, JobCardProps & React.HTMLAttributes<HTMLDivElement>>(
  function JobCard({ job, dragging, raised, className, ...rest }, ref) {
    const outcome = job.application?.outcome?.outcome;
    return (
      <div
        ref={ref}
        className={cn(
          "cursor-pointer rounded-xl border border-border bg-card p-3 text-left shadow-card transition-shadow focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none hover:border-border-strong",
          dragging && "opacity-40",
          raised && "rotate-[0.5deg] cursor-grabbing border-border-strong shadow-[0_18px_40px_-12px_rgb(11_18_32_/_0.35)]",
          className,
        )}
        {...rest}
      >
        <p className="text-sm font-semibold leading-snug text-foreground">{job.title}</p>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Building2 className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{job.company}</span>
        </p>
        {job.location && (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{job.location}</span>
          </p>
        )}
        {(job.employmentType || job.source || outcome) && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {job.employmentType && (
              <span className="rounded-md bg-surface-muted px-2 py-0.5 text-xs text-muted-foreground">
                {job.employmentType}
              </span>
            )}
            {job.source && (
              <span className="rounded-md bg-surface-muted px-2 py-0.5 text-xs text-muted-foreground">
                {job.source}
              </span>
            )}
            {outcome && (
              <span
                className={cn(
                  "rounded-md px-2 py-0.5 text-xs font-medium",
                  outcome === "offer_accepted"
                    ? "bg-success-soft text-success"
                    : "bg-surface-muted text-muted-foreground",
                )}
              >
                {OUTCOME_LABELS[outcome]}
              </span>
            )}
          </div>
        )}
      </div>
    );
  },
);
