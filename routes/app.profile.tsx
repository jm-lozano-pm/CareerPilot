import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useForm, useFieldArray, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { LanguageListField } from "@/components/profile/language-list-field";
import { StringListField } from "@/components/profile/string-list-field";
import { CertificationListField } from "@/components/profile/certification-list-field";
import { LinkListField } from "@/components/profile/link-list-field";
import { MonthYearField } from "@/components/form/month-year-field";
import {
  newEducationEntry,
  newExperienceEntry,
  newProjectEntry,
  newVolunteeringEntry,
} from "@/lib/career-content";
import { FieldError, FormAlert } from "@/components/auth/auth-shell";
import { friendlyDataError } from "@/lib/auth-errors";
import {
  WORK_MODES,
  EMPLOYMENT_TYPE_PREFERENCES,
  careerGoalsSchema,
  emptyGoals,
  emptyProfile,
  fetchCareerGoals,
  fetchProfessionalProfile,
  professionalProfileSchema,
  saveCareerGoals,
  saveProfessionalProfile,
  type CareerGoalsValues,
  type ProfessionalProfileValues,
} from "@/lib/profile-data";

export const Route = createFileRoute("/app/profile")({
  head: () => ({
    meta: [
      { title: "Career Profile — CareerPilot" },
      {
        name: "description",
        content:
          "Maintain the career profile and goals that give context to your jobs and CVs in CareerPilot.",
      },
      { property: "og:title", content: "Career Profile — CareerPilot" },
      {
        property: "og:description",
        content: "The career profile and goals behind your jobs and CVs.",
      },
    ],
  }),
  component: ProfilePage,
});

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-lg font-semibold tracking-[-0.01em] text-foreground">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function LoadingCard() {
  return (
    <SurfaceCard>
      <Skeleton className="h-5 w-40" />
      <Skeleton className="mt-3 h-4 w-72" />
      <Skeleton className="mt-6 h-10 w-full" />
      <Skeleton className="mt-3 h-24 w-full" />
    </SurfaceCard>
  );
}

function ErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <SurfaceCard>
      <FormAlert message="We couldn't load this section. Please try again." />
      <Button type="button" variant="outline" onClick={onRetry}>
        Retry
      </Button>
    </SurfaceCard>
  );
}

function ProfilePage() {
  return (
    <>
      <PageHeader
        title="Career Profile"
        description="The context behind your jobs, CVs, and future insight."
      />
      <Tabs defaultValue="profile" className="mt-6">
        <TabsList aria-label="Career Profile sections">
          <TabsTrigger value="profile">Professional Profile</TabsTrigger>
          <TabsTrigger value="goals">Career Goals</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-6">
          <ProfessionalProfileSection />
        </TabsContent>
        <TabsContent value="goals" className="mt-6">
          <CareerGoalsSection />
        </TabsContent>
      </Tabs>
    </>
  );
}


function EntryCard({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-border bg-surface-muted p-4">{children}</div>;
}

function RemoveEntryButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <div className="mt-3 flex justify-end">
      <Button type="button" variant="ghost" onClick={onClick} aria-label={label}>
        <Trash2 className="size-4" aria-hidden="true" />
        Remove
      </Button>
    </div>
  );
}

function ProfessionalProfileSection() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["professional_profile"],
    queryFn: fetchProfessionalProfile,
  });

  const form = useForm<ProfessionalProfileValues>({
    resolver: zodResolver(professionalProfileSchema) as Resolver<ProfessionalProfileValues>,
    defaultValues: emptyProfile,
  });

  useEffect(() => {
    if (query.data) form.reset(query.data);
  }, [query.data, form]);

  const experience = useFieldArray({ control: form.control, name: "experience" });
  const education = useFieldArray({ control: form.control, name: "education" });
  const projects = useFieldArray({ control: form.control, name: "projects" });
  const volunteering = useFieldArray({ control: form.control, name: "volunteering" });

  const mutation = useMutation({
    mutationFn: saveProfessionalProfile,
    onSuccess: async () => {
      toast.success("Professional profile saved.");
      await queryClient.invalidateQueries({ queryKey: ["professional_profile"] });
      await queryClient.invalidateQueries({ queryKey: ["professional-profile"] });
    },
  });

  if (query.isPending) return <LoadingCard />;
  if (query.isError) return <ErrorCard onRetry={() => void query.refetch()} />;

  const values = form.watch();

  return (
    <SurfaceCard as="section">
      <SectionHeading
        title="Professional Profile"
        description="Your factual career information: contact details, positioning, summary, experience, education, skills, languages, certifications, projects, volunteering and awards. Every CV you create starts from this."
      />
      {mutation.isError && <FormAlert message={friendlyDataError(mutation.error)} />}
      <form
        noValidate
        onSubmit={form.handleSubmit((submitted) => mutation.mutate(submitted))}
        className="flex flex-col gap-6"
      >
        <fieldset>
          <legend className="text-sm font-medium text-foreground">Contact details</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="contact-fullName">Full name</Label>
              <Input id="contact-fullName" className="mt-1.5" {...form.register("contact.fullName")} />
            </div>
            <div>
              <Label htmlFor="contact-email">Email</Label>
              <Input
                id="contact-email"
                type="email"
                className="mt-1.5"
                {...form.register("contact.email")}
              />
            </div>
            <div>
              <Label htmlFor="contact-phone">Phone</Label>
              <Input id="contact-phone" className="mt-1.5" {...form.register("contact.phone")} />
            </div>
            <div>
              <Label htmlFor="contact-location">Location</Label>
              <Input id="contact-location" className="mt-1.5" {...form.register("contact.location")} />
            </div>
          </div>
          <div className="mt-3">
            <LinkListField
              id="contact-links"
              label="Links"
              placeholder="linkedin.com/in/your-name"
              emptyHint="No links added yet."
              values={values.contact.links}
              onChange={(next) => form.setValue("contact.links", next, { shouldDirty: true })}
            />
          </div>
        </fieldset>

        <div>
          <Label htmlFor="headline">Headline</Label>
          <Input
            id="headline"
            className="mt-1.5"
            aria-describedby="headline-hint"
            aria-invalid={!!form.formState.errors.headline}
            {...form.register("headline")}
          />
          <p id="headline-hint" className="mt-1.5 text-xs text-muted-foreground">
            A short positioning line about you.
          </p>
          <FieldError message={form.formState.errors.headline?.message} />
        </div>

        <div>
          <Label htmlFor="targetTitle">Target title</Label>
          <Input
            id="targetTitle"
            className="mt-1.5"
            aria-describedby="targetTitle-hint"
            {...form.register("targetTitle")}
          />
          <p id="targetTitle-hint" className="mt-1.5 text-xs text-muted-foreground">
            The role title you want a CV to lead with.
          </p>
        </div>

        <div>
          <Label htmlFor="summary">Professional summary</Label>
          <Textarea
            id="summary"
            rows={5}
            className="mt-1.5"
            aria-invalid={!!form.formState.errors.summary}
            {...form.register("summary")}
          />
          <FieldError message={form.formState.errors.summary?.message} />
        </div>

        <fieldset>
          <legend className="text-sm font-medium text-foreground">Experience</legend>
          {experience.fields.length === 0 && (
            <p className="mt-2 text-sm text-muted-foreground">No experience entries yet.</p>
          )}
          <div className="mt-3 flex flex-col gap-4">
            {experience.fields.map((field, index) => (
              <EntryCard key={field.id}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor={`exp-role-${index}`}>Role title</Label>
                    <Input
                      id={`exp-role-${index}`}
                      className="mt-1.5"
                      {...form.register(`experience.${index}.role`)}
                    />
                    <FieldError
                      message={form.formState.errors.experience?.[index]?.role?.message}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`exp-org-${index}`}>Organisation</Label>
                    <Input
                      id={`exp-org-${index}`}
                      className="mt-1.5"
                      {...form.register(`experience.${index}.organisation`)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`exp-loc-${index}`}>Location</Label>
                    <Input
                      id={`exp-loc-${index}`}
                      className="mt-1.5"
                      {...form.register(`experience.${index}.location`)}
                    />
                  </div>
                  <div className="hidden sm:block" aria-hidden="true" />
                  <MonthYearField
                    id={`exp-start-${index}`}
                    label="Start date"
                    value={form.watch(`experience.${index}.startDate`)}
                    onChange={(value) =>
                      form.setValue(`experience.${index}.startDate`, value, { shouldDirty: true })
                    }
                  />
                  <MonthYearField
                    id={`exp-end-${index}`}
                    label="End date"
                    value={form.watch(`experience.${index}.endDate`)}
                    disabled={form.watch(`experience.${index}.current`)}
                    onChange={(value) =>
                      form.setValue(`experience.${index}.endDate`, value, { shouldDirty: true })
                    }
                  />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Checkbox
                    id={`exp-current-${index}`}
                    checked={form.watch(`experience.${index}.current`)}
                    onCheckedChange={(checked) =>
                      form.setValue(`experience.${index}.current`, checked === true, {
                        shouldDirty: true,
                      })
                    }
                  />
                  <Label htmlFor={`exp-current-${index}`} className="font-normal">
                    I currently work here
                  </Label>
                </div>
                <div className="mt-3">
                  <span className="text-sm font-medium text-foreground">Achievements</span>
                  <div className="mt-1.5 flex flex-col gap-2">
                    {(values.experience[index]?.bullets ?? []).map((_, bulletIndex) => (
                      <div key={bulletIndex} className="flex gap-2">
                        <Input
                          aria-label={`Experience ${index + 1} achievement ${bulletIndex + 1}`}
                          {...form.register(`experience.${index}.bullets.${bulletIndex}`)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          aria-label={`Remove achievement ${bulletIndex + 1} from experience ${index + 1}`}
                          onClick={() => {
                            const current = values.experience[index]?.bullets ?? [];
                            form.setValue(
                              `experience.${index}.bullets`,
                              current.filter((_, i) => i !== bulletIndex),
                              { shouldDirty: true },
                            );
                          }}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-2"
                    onClick={() =>
                      form.setValue(
                        `experience.${index}.bullets`,
                        [...(values.experience[index]?.bullets ?? []), ""],
                        { shouldDirty: true },
                      )
                    }
                  >
                    <Plus className="size-4" aria-hidden="true" />
                    Add achievement
                  </Button>
                </div>
                <RemoveEntryButton
                  label={`Remove experience entry ${index + 1}`}
                  onClick={() => experience.remove(index)}
                />
              </EntryCard>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            className="mt-3"
            onClick={() => experience.append(newExperienceEntry())}
          >
            <Plus className="size-4" aria-hidden="true" />
            Add experience
          </Button>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-medium text-foreground">Education</legend>
          {education.fields.length === 0 && (
            <p className="mt-2 text-sm text-muted-foreground">No education entries yet.</p>
          )}
          <div className="mt-3 flex flex-col gap-4">
            {education.fields.map((field, index) => (
              <EntryCard key={field.id}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor={`edu-qual-${index}`}>Qualification</Label>
                    <Input
                      id={`edu-qual-${index}`}
                      className="mt-1.5"
                      {...form.register(`education.${index}.qualification`)}
                    />
                    <FieldError
                      message={form.formState.errors.education?.[index]?.qualification?.message}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`edu-inst-${index}`}>Institution</Label>
                    <Input
                      id={`edu-inst-${index}`}
                      className="mt-1.5"
                      {...form.register(`education.${index}.institution`)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`edu-loc-${index}`}>Location</Label>
                    <Input
                      id={`edu-loc-${index}`}
                      className="mt-1.5"
                      {...form.register(`education.${index}.location`)}
                    />
                  </div>
                  <div className="hidden sm:block" aria-hidden="true" />
                  <MonthYearField
                    id={`edu-start-${index}`}
                    label="Start date"
                    value={form.watch(`education.${index}.startDate`)}
                    onChange={(value) =>
                      form.setValue(`education.${index}.startDate`, value, { shouldDirty: true })
                    }
                  />
                  <MonthYearField
                    id={`edu-end-${index}`}
                    label="End date"
                    value={form.watch(`education.${index}.endDate`)}
                    disabled={form.watch(`education.${index}.current`)}
                    onChange={(value) =>
                      form.setValue(`education.${index}.endDate`, value, { shouldDirty: true })
                    }
                  />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Checkbox
                    id={`edu-current-${index}`}
                    checked={form.watch(`education.${index}.current`)}
                    onCheckedChange={(checked) =>
                      form.setValue(`education.${index}.current`, checked === true, {
                        shouldDirty: true,
                      })
                    }
                  />
                  <Label htmlFor={`edu-current-${index}`} className="font-normal">
                    Currently studying
                  </Label>
                </div>
                <RemoveEntryButton
                  label={`Remove education entry ${index + 1}`}
                  onClick={() => education.remove(index)}
                />
              </EntryCard>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            className="mt-3"
            onClick={() => education.append(newEducationEntry())}
          >
            <Plus className="size-4" aria-hidden="true" />
            Add education
          </Button>
        </fieldset>

        <StringListField
          id="skills"
          label="Skills"
          placeholder="Add a skill"
          emptyHint="No skills added yet."
          values={values.skills}
          onChange={(next) => form.setValue("skills", next, { shouldDirty: true })}
        />

        <LanguageListField
          id="languages"
          values={values.languages}
          onChange={(next) => form.setValue("languages", next, { shouldDirty: true })}
        />

        <CertificationListField
          id="profile-cert"
          values={values.certifications}
          onChange={(next) => form.setValue("certifications", next, { shouldDirty: true })}
        />

        <fieldset>
          <legend className="text-sm font-medium text-foreground">Projects</legend>
          {projects.fields.length === 0 && (
            <p className="mt-2 text-sm text-muted-foreground">No projects yet.</p>
          )}
          <div className="mt-3 flex flex-col gap-4">
            {projects.fields.map((field, index) => (
              <EntryCard key={field.id}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor={`proj-name-${index}`}>Project name</Label>
                    <Input
                      id={`proj-name-${index}`}
                      className="mt-1.5"
                      {...form.register(`projects.${index}.name`)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`proj-link-${index}`}>Link</Label>
                    <Input
                      id={`proj-link-${index}`}
                      inputMode="url"
                      className="mt-1.5"
                      {...form.register(`projects.${index}.link`)}
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <Label htmlFor={`proj-desc-${index}`}>Description</Label>
                  <Textarea
                    id={`proj-desc-${index}`}
                    rows={3}
                    className="mt-1.5"
                    {...form.register(`projects.${index}.description`)}
                  />
                </div>
                <RemoveEntryButton
                  label={`Remove project ${index + 1}`}
                  onClick={() => projects.remove(index)}
                />
              </EntryCard>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            className="mt-3"
            onClick={() => projects.append(newProjectEntry())}
          >
            <Plus className="size-4" aria-hidden="true" />
            Add project
          </Button>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-medium text-foreground">Volunteering</legend>
          {volunteering.fields.length === 0 && (
            <p className="mt-2 text-sm text-muted-foreground">No volunteering entries yet.</p>
          )}
          <div className="mt-3 flex flex-col gap-4">
            {volunteering.fields.map((field, index) => (
              <EntryCard key={field.id}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor={`vol-role-${index}`}>Role</Label>
                    <Input
                      id={`vol-role-${index}`}
                      className="mt-1.5"
                      {...form.register(`volunteering.${index}.role`)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`vol-org-${index}`}>Organisation</Label>
                    <Input
                      id={`vol-org-${index}`}
                      className="mt-1.5"
                      {...form.register(`volunteering.${index}.organisation`)}
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <Label htmlFor={`vol-desc-${index}`}>Description</Label>
                  <Textarea
                    id={`vol-desc-${index}`}
                    rows={3}
                    className="mt-1.5"
                    {...form.register(`volunteering.${index}.description`)}
                  />
                </div>
                <RemoveEntryButton
                  label={`Remove volunteering entry ${index + 1}`}
                  onClick={() => volunteering.remove(index)}
                />
              </EntryCard>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            className="mt-3"
            onClick={() => volunteering.append(newVolunteeringEntry())}
          >
            <Plus className="size-4" aria-hidden="true" />
            Add volunteering
          </Button>
        </fieldset>

        <StringListField
          id="awards"
          label="Awards"
          placeholder="Add an award"
          emptyHint="No awards added yet."
          values={values.awards}
          onChange={(next) => form.setValue("awards", next, { shouldDirty: true })}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Save profile"}
          </Button>
        </div>
      </form>
    </SurfaceCard>
  );
}


function CareerGoalsSection() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["career_goals"], queryFn: fetchCareerGoals });

  const form = useForm<CareerGoalsValues>({
    resolver: zodResolver(careerGoalsSchema) as Resolver<CareerGoalsValues>,
    defaultValues: emptyGoals,
  });

  useEffect(() => {
    if (query.data) form.reset(query.data);
  }, [query.data, form]);

  const mutation = useMutation({
    mutationFn: saveCareerGoals,
    onSuccess: async () => {
      toast.success("Career goals saved.");
      await queryClient.invalidateQueries({ queryKey: ["career_goals"] });
    },
  });

  if (query.isPending) return <LoadingCard />;
  if (query.isError) return <ErrorCard onRetry={() => void query.refetch()} />;

  const targetRoles = form.watch("targetRoles");
  const targetLocations = form.watch("targetLocations");
  const modes = form.watch("preferredWorkModes");
  const employmentTypes = form.watch("preferredEmploymentTypes");

  return (
    <SurfaceCard as="section">
      <SectionHeading
        title="Career Goals"
        description="What you're aiming for, so future analysis has direction."
      />
      {mutation.isError && <FormAlert message={friendlyDataError(mutation.error)} />}
      <form
        noValidate
        onSubmit={form.handleSubmit(
          (values) => mutation.mutate(values),
          (errors) => {
            // Accessible error focus: the list control is not a registered
            // input, so focus its entry field directly.
            if (errors.targetRoles) document.getElementById("targetRoles")?.focus();
          },
        )}
        className="flex flex-col gap-6"
      >
        <StringListField
          id="targetRoles"
          label="Target roles (required)"
          placeholder="Add a target role"
          emptyHint="Add at least one target role so analysis has direction."
          values={targetRoles}
          error={form.formState.errors.targetRoles?.message}
          onChange={(values) => {
            form.setValue("targetRoles", values, { shouldDirty: true });
            if (values.length > 0) form.clearErrors("targetRoles");
          }}
        />
        <StringListField
          id="targetLocations"
          label="Target locations"
          placeholder="Add a target location"
          emptyHint="No target locations added yet."
          values={targetLocations}
          onChange={(values) => form.setValue("targetLocations", values, { shouldDirty: true })}
        />

        <fieldset>
          <legend className="text-sm font-medium text-foreground">Preferred work modes</legend>
          <div className="mt-3 flex flex-wrap gap-4">
            {WORK_MODES.map((mode) => (
              <div key={mode} className="flex items-center gap-2">
                <Checkbox
                  id={`mode-${mode}`}
                  checked={modes.includes(mode)}
                  onCheckedChange={(checked) =>
                    form.setValue(
                      "preferredWorkModes",
                      checked === true
                        ? [...modes, mode]
                        : modes.filter((item) => item !== mode),
                      { shouldDirty: true },
                    )
                  }
                />
                <Label htmlFor={`mode-${mode}`} className="font-normal">
                  {mode}
                </Label>
              </div>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-medium text-foreground">
            Preferred contract types <span className="text-muted-foreground">(optional)</span>
          </legend>
          <p className="mt-1 text-sm text-muted-foreground">
            Your own preference. CareerPilot never treats this as a job requirement.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {EMPLOYMENT_TYPE_PREFERENCES.map((type) => {
              const selected = employmentTypes.includes(type);
              return (
                <div key={type} className="flex items-center gap-2">
                  <Checkbox
                    id={`contract-${type}`}
                    checked={selected}
                    onCheckedChange={(checked) =>
                      form.setValue(
                        "preferredEmploymentTypes",
                        checked === true
                          ? [...employmentTypes, type]
                          : employmentTypes.filter((item) => item !== type),
                        { shouldDirty: true },
                      )
                    }
                  />
                  <Label htmlFor={`contract-${type}`} className="font-normal">
                    {type}
                    <span className="sr-only">{selected ? " (selected)" : ""}</span>
                  </Label>
                </div>
              );
            })}
          </div>
        </fieldset>

        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            rows={4}
            className="mt-1.5"
            aria-invalid={!!form.formState.errors.notes}
            {...form.register("notes")}
          />
          <FieldError message={form.formState.errors.notes?.message} />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Save goals"}
          </Button>
        </div>
      </form>
    </SurfaceCard>
  );
}
