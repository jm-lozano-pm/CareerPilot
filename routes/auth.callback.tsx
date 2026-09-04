import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell, FormAlert } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { clearPendingEmail } from "@/lib/auth-verification";
import {
  clearPendingLink,
  friendlyLinkError,
  readPendingLinkUserId,
} from "@/lib/identity-linking";
import { setLinkResult } from "@/lib/link-result";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Confirming your account — CareerPilot" },
      {
        name: "description",
        content: "Completing email confirmation or sign-in for your CareerPilot workspace.",
      },
      { property: "og:title", content: "Confirming your account — CareerPilot" },
      { property: "og:description", content: "Finishing sign-in to CareerPilot." },
    ],
  }),
  component: CallbackPage,
});

type State = "working" | "invalid";

function readLinkError(): string | null {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const search = new URLSearchParams(window.location.search);
  const code = hash.get("error_code") ?? search.get("error_code");
  const description = hash.get("error_description") ?? search.get("error_description");
  const error = hash.get("error") ?? search.get("error");
  if (!code && !description && !error) return null;
  const raw = `${code ?? ""} ${description ?? ""}`.toLowerCase();
  if (raw.includes("expired")) {
    return "That confirmation link has expired. Request a new one below.";
  }
  if (raw.includes("access_denied") || raw.includes("used")) {
    return "That confirmation link is no longer valid — it may already have been used. Try logging in, or request a new link.";
  }
  return "We couldn't confirm your account with that link. Request a new one below.";
}

function CallbackPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<State>("working");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const isIdentityLink = new URLSearchParams(window.location.search).get("link") === "google";

      if (isIdentityLink) {
        const expectedUserId = readPendingLinkUserId();
        clearPendingLink();
        const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const search = new URLSearchParams(window.location.search);
        const providerError =
          params.get("error_description") ??
          params.get("error") ??
          search.get("error_description") ??
          search.get("error");
        if (providerError) {
          setLinkResult({ status: "error", message: friendlyLinkError({ message: providerError }) });
          await navigate({ to: "/app/settings", replace: true });
          return;
        }

        // Never infer success from the redirect: re-read the user and prove a
        // Google identity is attached to the SAME auth user id.
        for (let attempt = 0; attempt < 12; attempt += 1) {
          const { data } = await supabase.auth.getUser();
          if (cancelled) return;
          const user = data.user;
          if (user) {
            const hasGoogle = (user.identities ?? []).some((i) => i.provider === "google");
            if (hasGoogle && (!expectedUserId || user.id === expectedUserId)) {
              setLinkResult({ status: "linked" });
              await navigate({ to: "/app/settings", replace: true });
              return;
            }
            if (hasGoogle && expectedUserId && user.id !== expectedUserId) {
              setLinkResult({
                status: "error",
                message:
                  "That Google account signed in as a different CareerPilot account, so nothing was linked or merged.",
              });
              await navigate({ to: "/app/settings", replace: true });
              return;
            }
          }
          await new Promise((resolve) => window.setTimeout(resolve, 250));
        }
        if (cancelled) return;
        setLinkResult({
          status: "error",
          message: "We couldn't confirm the Google connection. Please check Settings and try again.",
        });
        await navigate({ to: "/app/settings", replace: true });
        return;
      }

      const linkError = readLinkError();
      if (linkError) {
        setMessage(linkError);
        setState("invalid");
        return;
      }

      // The Supabase client processes tokens/codes present in the URL on load.
      // Give it a moment, then decide where the user belongs.
      for (let attempt = 0; attempt < 10; attempt += 1) {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        if (data.session) {
          clearPendingEmail();
          await navigate({ to: "/app/dashboard", replace: true });
          return;
        }
        await new Promise((resolve) => window.setTimeout(resolve, 250));
      }
      if (cancelled) return;
      // Confirmed but no session (or nothing to process): sign in normally.
      await navigate({ to: "/login", replace: true });
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (state === "working") {
    return (
      <AuthShell title="Confirming your account" description="One moment while we finish up.">
        <p role="status" className="text-sm text-muted-foreground">
          Verifying your link…
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="This link didn't work"
      description="Confirmation links are single-use and expire after a while."
      footer={
        <Link to="/login" className="font-medium text-primary hover:underline">
          Back to login
        </Link>
      }
    >
      <FormAlert message={message} />
      <div className="flex flex-col gap-2.5">
        <Button asChild>
          <Link to="/check-email">Request a new verification email</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/signup">Create an account again</Link>
        </Button>
      </div>
    </AuthShell>
  );
}
