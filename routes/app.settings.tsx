import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, Loader2, LogOut, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { SurfaceCard, SurfaceCardTitle } from "@/components/ui/surface-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SignInMethods } from "@/components/settings/sign-in-methods";
import { supabase } from "@/integrations/supabase/client";
import { signOutIntentionally } from "@/lib/auth-actions";
import { buildUserDataExport, downloadJson } from "@/lib/account-data";
import { deleteMyAccount } from "@/lib/account.functions";

export const Route = createFileRoute("/app/settings")({
  head: () => ({
    meta: [
      { title: "Settings — CareerPilot" },
      {
        name: "description",
        content: "Manage your CareerPilot account, export your data, or delete your account.",
      },
      { property: "og:title", content: "Settings — CareerPilot" },
      {
        property: "og:description",
        content: "Manage your account, export your career data, or delete your account.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const deleteAccount = useServerFn(deleteMyAccount);

  const [email, setEmail] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  async function handleExport() {
    setExporting(true);
    try {
      const payload = await buildUserDataExport();
      downloadJson(payload, `careerpilot-export-${new Date().toISOString().slice(0, 10)}.json`);
      toast.success("Export ready. Check your downloads.");
    } catch {
      toast.error("We could not build your export. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteAccount({});
      await signOutIntentionally(queryClient);
      setDialogOpen(false);
      await navigate({ to: "/login", search: {}, replace: true });
      toast.success("Your account and data have been deleted.");
    } catch {
      toast.error("We could not delete your account. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleSignOut() {
    await signOutIntentionally(queryClient);
    await navigate({ to: "/login", search: {}, replace: true });
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your account, your stored career data, and account deletion."
      />

      <div className="flex flex-col gap-8">
        <SurfaceCard>
          <SurfaceCardTitle>Account</SurfaceCardTitle>
          <p className="mt-1.5 text-sm text-muted-foreground">
            You can sign in to CareerPilot with Google or with an email and password. Your email
            address identifies your workspace and cannot be changed here.
          </p>
          <div className="mt-4 max-w-sm">
            <Label htmlFor="account-email">Email address</Label>
            <Input
              id="account-email"
              value={email ?? ""}
              readOnly
              className="mt-1.5 bg-surface-muted"
            />
          </div>
          <Button variant="outline" className="mt-4" onClick={() => void handleSignOut()}>
            <LogOut className="size-4" aria-hidden="true" />
            Log out
          </Button>
        </SurfaceCard>

        <SignInMethods />


        <SurfaceCard>
          <SurfaceCardTitle>Data export</SurfaceCardTitle>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Download a JSON file containing your own stored records: career profile, goals, CVs,
            jobs, applications, status history, outcomes, match assessments, insights and
            recommendations. No account credentials or other users&apos; data are included.
          </p>
          <Button className="mt-4" onClick={() => void handleExport()} disabled={exporting}>
            {exporting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Download className="size-4" aria-hidden="true" />
            )}
            {exporting ? "Preparing export…" : "Export my data"}
          </Button>
        </SurfaceCard>

        <SurfaceCard className="border-destructive/25">
          <SurfaceCardTitle>Delete account</SurfaceCardTitle>
          <p className="mt-1.5 text-sm text-muted-foreground">
            This permanently deletes your account and every record you have stored in CareerPilot:
            career profile, goals, CVs, jobs, applications, history and outcomes. This cannot be
            undone.
          </p>
          <Button
            variant="destructive"
            className="mt-4"
            onClick={() => {
              setConfirmText("");
              setDialogOpen(true);
            }}
          >
            <ShieldAlert className="size-4" aria-hidden="true" />
            Delete my account
          </Button>
        </SurfaceCard>
      </div>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your CareerPilot account?</AlertDialogTitle>
            <AlertDialogDescription>
              Your account and all stored career data will be permanently deleted. Type DELETE to
              confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div>
            <Label htmlFor="delete-confirm">Confirmation</Label>
            <Input
              id="delete-confirm"
              className="mt-1.5"
              value={confirmText}
              autoComplete="off"
              placeholder="DELETE"
              onChange={(event) => setConfirmText(event.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={confirmText !== "DELETE" || deleting}
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
            >
              {deleting ? "Deleting…" : "Delete account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>

      </AlertDialog>
    </>
  );
}
