import { useState, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import {
  Briefcase,
  FileText,
  LayoutGrid,
  LogOut,
  Menu,
  Settings,
  User,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { NavItem, type NavDestination } from "@/components/layout/nav-item";
import { cn } from "@/lib/utils";

const primaryNav: NavDestination[] = [
  { label: "Dashboard", to: "/app/dashboard", icon: LayoutGrid },
  { label: "Jobs", to: "/app/jobs", icon: Briefcase },
  { label: "CVs", to: "/app/cvs", icon: FileText },
  { label: "Career Profile", to: "/app/profile", icon: User },
];

const settingsNav: NavDestination = {
  label: "Settings",
  to: "/app/settings",
  icon: Settings,
};

type SidebarProps = {
  onNavigate?: (() => void) | undefined;
  userEmail?: string | null | undefined;
  onSignOut?: (() => void | Promise<void>) | undefined;
};

function SidebarContent({ onNavigate, userEmail, onSignOut }: SidebarProps) {
  return (
    <div className="flex h-full flex-col bg-sidebar px-4 py-5">
      <div className="px-1 pb-6">
        <Logo tone="light" size={32} />
      </div>
      <nav aria-label="Workspace" className="flex min-h-0 flex-1 flex-col">
        <ul className="flex flex-col gap-1">
          {primaryNav.map((item) => (
            <NavItem key={item.to} {...item} onNavigate={onNavigate} />
          ))}
        </ul>
        <hr className="my-4 border-sidebar-border" />
        <ul>
          <NavItem {...settingsNav} onNavigate={onNavigate} />
        </ul>
      </nav>
      {onSignOut && (
        <div className="mt-4 border-t border-sidebar-border pt-4">
          <p className="truncate px-3 text-xs text-sidebar-muted" title={userEmail ?? undefined}>
            {userEmail ?? "Signed in"}
          </p>
          <button
            type="button"
            onClick={() => void onSignOut()}
            className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <LogOut className="size-[18px] shrink-0" aria-hidden="true" strokeWidth={1.9} />
            <span>Log out</span>
          </button>
        </div>
      )}
    </div>
  );
}

export function AppShell({
  children,
  userEmail,
  onSignOut,
}: {
  children: ReactNode;
  userEmail?: string | null | undefined;
  onSignOut?: (() => void | Promise<void>) | undefined;
}) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  // The Jobs board uses the full main-content width; other pages stay measured.
  const wide = pathname.startsWith("/app/jobs");
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-dvh w-full bg-background">
      {/* Fixed desktop sidebar: 232px */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[232px] lg:block">
        <SidebarContent userEmail={userEmail} onSignOut={onSignOut} />
      </aside>

      {/* Mobile off-canvas sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[232px] shadow-raised">
            <SidebarContent onNavigate={() => setMobileOpen(false)} userEmail={userEmail} onSignOut={onSignOut} />
          </div>
        </div>
      )}

      <div className={cn("flex min-w-0 flex-1 flex-col", "lg:ml-[232px]")}>
        <header className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            className="grid size-9 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-surface-muted"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <Logo size={26} />
        </header>

        <main className="min-w-0 flex-1 px-5 py-8 lg:px-8 lg:py-8">
          {/* The Jobs board needs the full main-content width for its columns. */}
          <div
            className={cn(
              "mx-auto flex w-full flex-col gap-8",
              wide ? "max-w-none" : "max-w-6xl",
            )}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
