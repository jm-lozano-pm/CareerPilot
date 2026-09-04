import mark from "@/assets/careerpilot-mark.png.asset.json";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  /** Size of the compass mark in px. */
  size?: number;
  showWordmark?: boolean;
  tone?: "light" | "dark";
};

export function Logo({
  className,
  size = 32,
  showWordmark = true,
  tone = "dark",
}: LogoProps) {
  return (
    <span className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <img
        src={mark.url}
        alt={showWordmark ? "" : "CareerPilot"}
        width={size}
        height={size}
        className="shrink-0 rounded-[8px]"
        style={{ width: size, height: size }}
      />
      {showWordmark && (
        <span
          className={cn(
            "truncate text-[17px] font-semibold tracking-[-0.01em]",
            tone === "light" ? "text-sidebar-foreground" : "text-foreground",
          )}
        >
          Career<span className="text-primary">Pilot</span>
        </span>
      )}
    </span>
  );
}
