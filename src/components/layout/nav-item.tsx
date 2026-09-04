import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

export type NavDestination = {
  label: string;
  to: "/app/dashboard" | "/app/jobs" | "/app/cvs" | "/app/profile" | "/app/settings";
  icon: LucideIcon;
};

type NavItemProps = NavDestination & {
  onNavigate?: (() => void) | undefined;
};

export function NavItem({ label, to, icon: Icon, onNavigate }: NavItemProps) {
  return (
    <li>
      <Link
        to={to}
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground data-[status=active]:bg-primary data-[status=active]:text-primary-foreground"
        activeOptions={{ exact: false }}
      >
        <Icon className="size-[18px] shrink-0" aria-hidden="true" strokeWidth={1.9} />
        <span className="truncate">{label}</span>
      </Link>
    </li>
  );
}
