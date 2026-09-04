import { useEffect, useState } from "react";
import { Outlet, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { signOutIntentionally, wasIntentionalSignOut } from "@/lib/auth-actions";
import { enforceSessionPersistence } from "@/lib/auth-persistence";

export const Route = createFileRoute("/app")({
  // Session lives in browser storage, so the gate runs client-side only.
  ssr: false,
  beforeLoad: async () => {
    // Drops a non-remembered session left over from a previous browser session.
    await enforceSessionPersistence();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/login", search: {} });
    }
    return { user: data.user };
  },

  component: AppLayout,
});

function AppLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || (event === "TOKEN_REFRESHED" && !session)) {
        queryClient.clear();
        if (wasIntentionalSignOut()) {
          void navigate({ to: "/login", search: {}, replace: true });
        } else {
          void navigate({ to: "/login", search: { expired: true }, replace: true });
        }
        return;
      }
      if (event === "USER_UPDATED" || event === "SIGNED_IN") {
        setEmail(session?.user.email ?? null);
      }
    });

    return () => subscription.subscription.unsubscribe();
  }, [navigate, queryClient]);

  async function handleSignOut() {
    await signOutIntentionally(queryClient);
    await navigate({ to: "/login", search: {}, replace: true });
  }

  return (
    <AppShell userEmail={email} onSignOut={handleSignOut}>
      <Outlet />
    </AppShell>
  );
}
