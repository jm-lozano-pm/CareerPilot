import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SurfaceCardProps = {
  children: ReactNode;
  className?: string;
  /** Compact = 16px padding, default = 24px padding. */
  padding?: "compact" | "default";
  as?: "div" | "section" | "article";
};

export function SurfaceCard({
  children,
  className,
  padding = "default",
  as: Tag = "div",
}: SurfaceCardProps) {
  return (
    <Tag
      className={cn(
        "rounded-xl border border-border bg-card shadow-card",
        padding === "compact" ? "p-4" : "p-6",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function SurfaceCardTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2 className={cn("text-base font-semibold text-foreground", className)}>
      {children}
    </h2>
  );
}
