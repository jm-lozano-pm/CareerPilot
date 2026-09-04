import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, FileText, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { SurfaceCard } from "@/components/ui/surface-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FormAlert } from "@/components/auth/auth-shell";
import { friendlyDataError } from "@/lib/auth-errors";
import {
  TEMPLATE_LABELS,
  cvKeys,
  deleteCv,
  duplicateCv,
  fetchCvs,
  formatUpdatedAt,
  type CvRecord,
} from "@/lib/cv-data";
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

export const Route = createFileRoute("/app/cvs/")({
  head: () => ({
    meta: [
      { title: "CVs — CareerPilot" },
      {
        name: "description",
        content: "Create, tailor and organise your CV versions inside your CareerPilot workspace.",
      },
      { property: "og:title", content: "CVs — CareerPilot" },
      { property: "og:description", content: "Keep your CV versions organised." },
    ],
  }),
  component: CvLibraryPage,
});

function CvLibraryPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [pendingDelete, setPendingDelete] = useState<CvRecord | null>(null);

  const cvsQuery = useQuery({ queryKey: cvKeys.all, queryFn: fetchCvs });

  const duplicate = useMutation({
    mutationFn: duplicateCv,
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: cvKeys.all });
      toast.success(`Duplicated as “${created.name}”.`);
    },
    onError: (error) => toast.error(friendlyDataError(error)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteCv(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: cvKeys.all });
      setPendingDelete(null);
      toast.success("CV deleted.");
    },
    onError: (error) => toast.error(friendlyDataError(error)),
  });

  const cvs = cvsQuery.data ?? [];

  return (
    <>
      <PageHeader
        title="CVs"
        description="Keep your CV versions organised and ready to send."
        action={
          <Button className="gap-2" onClick={() => void navigate({ to: "/app/cvs/new" })}>
            <Plus className="size-4" aria-hidden="true" />
            Create CV
          </Button>
        }
      />

      <div className="mt-8">
        {cvsQuery.isPending ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((key) => (
              <SurfaceCard key={key}>
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="mt-3 h-4 w-1/3" />
                <Skeleton className="mt-6 h-9 w-full" />
              </SurfaceCard>
            ))}
          </div>
        ) : cvsQuery.isError ? (
          <SurfaceCard>
            <FormAlert message={friendlyDataError(cvsQuery.error)} />
            <Button variant="outline" onClick={() => void cvsQuery.refetch()}>
              Try again
            </Button>
          </SurfaceCard>
        ) : cvs.length === 0 ? (
          <SurfaceCard>
            <EmptyState
              icon={FileText}
              title="No CVs yet"
              description="Create your first CV to start building versions you can tailor later."
              action={
                <Button className="gap-2" onClick={() => void navigate({ to: "/app/cvs/new" })}>
                  <Plus className="size-4" aria-hidden="true" />
                  Create CV
                </Button>
              }
            />
          </SurfaceCard>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cvs.map((cv) => (
              <li key={cv.id}>
                <SurfaceCard as="article" className="flex h-full flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="min-w-0 text-base font-semibold text-foreground">
                      <Link
                        to="/app/cvs/$cvId"
                        params={{ cvId: cv.id }}
                        className="block truncate hover:underline"
                      >
                        {cv.name}
                      </Link>
                    </h2>
                    {cv.sourceCvId || cv.tailoredForJobId ? (
                      <span className="shrink-0 rounded-md border border-ai/30 bg-ai-surface px-2 py-0.5 text-xs font-medium text-ai">
                        Tailored copy
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {TEMPLATE_LABELS[cv.template]} template
                  </p>
                  <p className="text-sm text-subtle-foreground">
                    Updated {formatUpdatedAt(cv.updatedAt)}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => void navigate({ to: "/app/cvs/$cvId", params: { cvId: cv.id } })}
                    >
                      <Pencil className="size-3.5" aria-hidden="true" />
                      Open
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      disabled={duplicate.isPending}
                      onClick={() => duplicate.mutate(cv)}
                    >
                      <Copy className="size-3.5" aria-hidden="true" />
                      Duplicate
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-destructive hover:bg-destructive/5 hover:text-destructive"
                      onClick={() => setPendingDelete(cv)}
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                      Delete
                    </Button>
                  </div>
                </SurfaceCard>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{pendingDelete?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes this CV and its content. Any application that referenced it
              will no longer point to a CV. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={remove.isPending}
              onClick={(event) => {
                event.preventDefault();
                if (pendingDelete) remove.mutate(pendingDelete.id);
              }}
            >
              {remove.isPending ? "Deleting…" : "Delete CV"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
