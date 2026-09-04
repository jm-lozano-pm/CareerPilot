import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError, FormAlert } from "@/components/auth/auth-shell";
import { friendlyDataError } from "@/lib/auth-errors";
import { CvTemplatePicker } from "@/components/cv/template-picker";
import { CV_TEMPLATES, createCv, cvKeys } from "@/lib/cv-data";


import { cvContentFromProfile, describeProfileSnapshot, profileHasContent } from "@/lib/cv-from-profile";
import { fetchProfessionalProfile } from "@/lib/profile-data";

const newCvSchema = z.object({
  name: z.string().trim().min(1, "Give this CV a name.").max(120, "Keep the name under 120 characters."),
  template: z.enum(CV_TEMPLATES),
});

type NewCvValues = z.infer<typeof newCvSchema>;

export const Route = createFileRoute("/app/cvs/new")({
  head: () => ({
    meta: [
      { title: "Create CV — CareerPilot" },
      {
        name: "description",
        content: "Name your CV and choose one of the three CareerPilot document templates.",
      },
      { property: "og:title", content: "Create CV — CareerPilot" },
      { property: "og:description", content: "Start a new CV version in CareerPilot." },
    ],
  }),
  component: NewCvPage,
});

function NewCvPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const form = useForm<NewCvValues>({
    resolver: zodResolver(newCvSchema),
    defaultValues: { name: "", template: "modern" },
  });

  const profileQuery = useQuery({
    queryKey: ["professional-profile"],
    queryFn: fetchProfessionalProfile,
  });

  const create = useMutation({
    mutationFn: async (values: NewCvValues) => {
      // Read the signed-in user's own profile under RLS at creation time only.
      const profile = await fetchProfessionalProfile();
      return createCv({ ...values, content: cvContentFromProfile(profile) });
    },
    onSuccess: async (cv) => {
      await queryClient.invalidateQueries({ queryKey: cvKeys.all });
      toast.success("CV created.");
      await navigate({ to: "/app/cvs/$cvId", params: { cvId: cv.id } });
    },
  });

  const template = form.watch("template");

  return (
    <>
      <PageHeader
        title="Create CV"
        description="Name this CV and pick a document template. You can change both later."
        action={
          <Button variant="outline" className="gap-2" onClick={() => void navigate({ to: "/app/cvs" })}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to CVs
          </Button>
        }
      />

      <SurfaceCard className="mt-8 max-w-2xl">
        {create.isError && <FormAlert message={friendlyDataError(create.error)} />}
        <form
          noValidate
          className="flex flex-col gap-6"
          onSubmit={form.handleSubmit((values) => create.mutate(values))}
        >
          <ProfileCopyNotice
            loading={profileQuery.isPending}
            failed={profileQuery.isError}
            parts={describeProfileSnapshot(profileQuery.data)}
            hasProfile={profileHasContent(profileQuery.data)}
          />

          <div>
            <Label htmlFor="cv-name">CV name</Label>
            <Input
              id="cv-name"
              className="mt-1.5"
              placeholder="e.g. Product Manager — 2026"
              aria-invalid={!!form.formState.errors.name}
              {...form.register("name")}
            />
            <FieldError message={form.formState.errors.name?.message} />
          </div>

          <CvTemplatePicker
            name="cv-new-template"
            value={template}
            onChange={(next) => form.setValue("template", next, { shouldDirty: true })}
            hint="Modern is the default. You can change the template at any time."
          />


          <div className="flex justify-end">
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Creating…" : "Create CV"}
            </Button>
          </div>
        </form>
      </SurfaceCard>
    </>
  );
}

function ProfileCopyNotice({
  loading,
  failed,
  parts,
  hasProfile,
}: {
  loading: boolean;
  failed: boolean;
  parts: string[];
  hasProfile: boolean;
}) {
  let body: string;
  if (loading) {
    body = "Checking your Career Profile…";
  } else if (failed) {
    body =
      "We couldn't read your Career Profile just now, so this CV will be created empty. You can add details in the editor.";
  } else if (hasProfile) {
    body = `Your Career Profile details (${parts.join(", ")}) will be copied into this CV once, at creation. After that the CV is independent: editing the CV never changes your profile, and editing your profile never changes this CV.`;
  } else {
    body =
      "Your Career Profile is empty, so an empty CV will be created. You can fill it in directly in the editor, or add your profile details first and copy them into your next CV.";
  }
  return (
    <div className="rounded-lg border border-border bg-surface-muted p-3 text-sm text-muted-foreground">
      {body}
    </div>
  );
}
