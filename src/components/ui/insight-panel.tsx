import { Lightbulb, Navigation } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

type InsightPanelProps = {
  title?: string;
  description: string;
  emptyTitle: string;
};

/**
 * Restrained presentation shell for CareerPilot Insight.
 * Purely presentational — it never generates or implies a recommendation.
 */
export function InsightPanel({
  title = "CareerPilot Insight",
  description,
  emptyTitle,
}: InsightPanelProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-ai-surface shadow-card">
      <div className="h-[3px] w-28 bg-ai" aria-hidden="true" />
      <div className="p-6">
        <div className="flex min-w-0 items-center justify-between gap-4 border-b border-ai/15 pb-4">
          <h2 className="truncate text-base font-semibold text-ai">{title}</h2>
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-ai/10 text-ai">
            <Lightbulb className="size-4" aria-hidden="true" strokeWidth={1.75} />
          </span>
        </div>
        <EmptyState
          icon={Navigation}
          tone="ai"
          title={emptyTitle}
          description={description}
        />
      </div>
    </section>
  );
}
