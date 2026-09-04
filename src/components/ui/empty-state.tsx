import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  tone?: "neutral" | "ai";
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  tone = "neutral",
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-12 text-center",
        className,
      )}
    >
      <span
        className={cn(
          "mb-4 grid size-14 shrink-0 place-items-center rounded-full",
          tone === "ai" ? "bg-ai/10 text-ai" : "bg-surface-muted text-subtle-foreground",
        )}
      >
        <Icon className="size-6" aria-hidden="true" strokeWidth={1.75} />
      </span>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
