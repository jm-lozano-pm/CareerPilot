import type { LucideIcon } from "lucide-react";
import { SurfaceCard } from "@/components/ui/surface-card";

type MetricCardProps = {
  label: string;
  /** Placeholder-only value. Use "—" until real data exists. */
  value?: string;
  icon: LucideIcon;
};

export function MetricCard({ label, value = "—", icon: Icon }: MetricCardProps) {
  return (
    <SurfaceCard padding="compact">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/8 text-primary">
          <Icon className="size-5" aria-hidden="true" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{label}</p>
          <p className="text-lg font-semibold text-subtle-foreground">{value}</p>
        </div>
      </div>
    </SurfaceCard>
  );
}
