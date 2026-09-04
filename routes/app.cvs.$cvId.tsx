import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useFieldArray, useForm, type Resolver } from "react-hook-form";
import { withEntryHidden } from "@/lib/cv-visibility";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowLeft, ArrowUp, Download, Eye, EyeOff, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FieldError, FormAlert } from "@/components/auth/auth-shell";
import { LanguageListField } from "@/components/profile/language-list-field";
import { StringListField } from "@/components/profile/string-list-field";
import { CvDocument } from "@/components/cv/cv-document";
import { CvTemplatePicker } from "@/components/cv/template-picker";
import { friendlyDataError } from "@/lib/auth-errors";
import { CertificationListField } from "@/components/profile/certification-list-field";
import { LinkListField } from "@/components/profile/link-list-field";
import { MonthYearField } from "@/components/form/month-year-field";
import {
  SECTION_LABELS,

  cvEditorSchema,
  cvKeys,
  fetchCv,
  newEntryId,
  safeFileName,
  saveCv,
  type CvEditorValues,
  type CvRecord,
  type CvSection,
} from "@/lib/cv-data";

export const Route = createFileRoute("/app/cvs/$cvId")({
  head: () => ({
    meta: [
      { title: "Edit CV — CareerPilot" },
      {
        name: "description",
        content: "Edit your CV content, control section visibility and export a PDF from CareerPilot.",
      },
      { property: "og:title", content: "Edit CV — CareerPilot" },
      { property: "og:description", content: "Edit a CV version in CareerPilot." },
    ],
  }),
  component: CvEditorPage,
});

function toValues(cv: CvRecord): CvEditorValues {
  return {
    name: cv.name,
    template: cv.template,
    content: cv.content,
    visibility: cv.visibility,
  };
}

function SectionCard({
  section,
  visible,
  onVisibilityChange,
  children,
  description,
}: {
  section: CvSection;
  visible: boolean;
  onVisibilityChange: (value: boolean) => void;
  children: ReactNode;
  description?: string;
}) {
  const switchId = `visible-${section}`;
  return (
    <SurfaceCard as="section" className="mt-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground">{SECTION_LABELS[section]}</h2>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Label htmlFor={switchId} className="text-sm text-muted-foreground">
            {visible ? "Shown in CV" : "Hidden (kept stored)"}
          </Label>
          <Switch
            id={switchId}
            checked={visible}
            onCheckedChange={onVisibilityChange}
            aria-label={`${SECTION_LABELS[section]} visible in CV`}
          />
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-4">{children}</div>
    </SurfaceCard>
  );
}

/** Non-destructive per-entry visibility badge (P1.5). */
function HiddenEntryBadge({ label }: { label: string }) {
  return (
    <p className="mb-3 rounded-md border border-border bg-warning-soft px-3 py-2 text-sm text-warning">
      This {label} is hidden. It stays stored and editable, but is left out of the CV preview, the PDF and any AI
      analysis until you restore it.
    </p>
  );
}

function EntryToolbar({
  label,
  index,
  count,
  hidden,
  onMove,
  onToggleHidden,
  onRemove,
}: {
  label: string;
  index: number;
  count: number;
  hidden: boolean;
  onMove: (from: number, to: number) => void;
  onToggleHidden: (next: boolean) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-end gap-1.5 border-t border-border pt-3">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label={`Move ${label} ${index + 1} up`}
        disabled={index === 0}
        onClick={() => onMove(index, index - 1)}
      >
        <ArrowUp className="size-4" aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label={`Move ${label} ${index + 1} down`}
        disabled={index === count - 1}
        onClick={() => onMove(index, index + 1)}
      >
        <ArrowDown className="size-4" aria-hidden="true" />
      </Button>
      {/* Hide is reversible and keeps the entry stored — deliberately styled
          as a neutral outline control, clearly separate from Remove. */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        aria-label={
          hidden ? `Restore ${label} ${index + 1} to this CV` : `Hide ${label} ${index + 1} from this CV, keeping it stored`
        }
        onClick={() => onToggleHidden(!hidden)}
      >
        {hidden ? <Eye className="size-4" aria-hidden="true" /> : <EyeOff className="size-4" aria-hidden="true" />}
        {hidden ? "Restore" : "Hide"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="gap-1.5 text-destructive hover:bg-destructive/5 hover:text-destructive"
        aria-label={`Remove ${label} ${index + 1} permanently`}
        onClick={() => onRemove(index)}
      >
        <Trash2 className="size-4" aria-hidden="true" />
        Remove
      </Button>
    </div>
  );
}


function useWideScreen(): boolean {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1280px)");
    const update = () => setWide(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);
  return wide;
}

function CvEditorPage() {
  const { cvId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const isWide = useWideScreen();

  useEffect(() => setMounted(true), []);

  const cvQuery = useQuery({
    queryKey: cvKeys.detail(cvId),
    queryFn: () => fetchCv(cvId),
  });

  const form = useForm<CvEditorValues>({
    resolver: zodResolver(cvEditorSchema) as Resolver<CvEditorValues>,
    defaultValues: {
      name: "",
      template: "modern",
      content: {
        contact: { fullName: "", email: "", phone: "", location: "", links: [] },
        targetTitle: "",
        summary: "",
        experience: [],
        education: [],
        skills: [],
        languages: [],
        certifications: [],
        projects: [],
        volunteering: [],
        awards: [],
      },
      visibility: {
        contact: true,
        targetTitle: true,
        summary: true,
        experience: true,
        education: true,
        skills: true,
        languages: true,
        certifications: true,
        projects: true,
        volunteering: true,
        awards: true,
      },
    },
  });

  const cv = cvQuery.data ?? null;

  useEffect(() => {
    if (cv) form.reset(toValues(cv));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cv?.id, cv?.updatedAt, cv?.contentVersion]);

  const values = form.watch();
  const isDirty = form.formState.isDirty;

  useEffect(() => {
    if (!isDirty) return;
    function warn(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  const save = useMutation({
    mutationFn: (formValues: CvEditorValues) => {
      if (!cv) throw new Error("CV not loaded");
      return saveCv(cv, formValues);
    },
    onSuccess: async (updated) => {
      queryClient.setQueryData(cvKeys.detail(updated.id), updated);
      await queryClient.invalidateQueries({ queryKey: cvKeys.all });
      form.reset(toValues(updated));
      toast.success("CV saved.");
    },
  });

  const experience = useFieldArray({ control: form.control, name: "content.experience" });
  const education = useFieldArray({ control: form.control, name: "content.education" });
  const projects = useFieldArray({ control: form.control, name: "content.projects" });
  const volunteering = useFieldArray({ control: form.control, name: "content.volunteering" });

  const documentTitle = useMemo(() => safeFileName(values.name || cv?.name || "cv"), [values.name, cv?.name]);

  function handleDownloadPdf() {
    if (isDirty) {
      toast.error("Save your changes first so the PDF matches the stored CV.");
      return;
    }
    const previousTitle = document.title;
    document.title = documentTitle;
    window.addEventListener(
      "afterprint",
      () => {
        document.title = previousTitle;
      },
      { once: true },
    );
    window.print();
  }

  if (cvQuery.isPending) {
    return (
      <>
        <PageHeader title="CV" description="Loading this CV…" />
        <SurfaceCard className="mt-8">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="mt-4 h-32 w-full" />
        </SurfaceCard>
      </>
    );
  }

  if (cvQuery.isError) {
    return (
      <>
        <PageHeader title="CV" description="We couldn't load this CV." />
        <SurfaceCard className="mt-8">
          <FormAlert message={friendlyDataError(cvQuery.error)} />
          <Button variant="outline" onClick={() => void cvQuery.refetch()}>
            Try again
          </Button>
        </SurfaceCard>
      </>
    );
  }

  if (!cv) {
    return (
      <>
        <PageHeader title="CV not found" description="This CV no longer exists in your workspace." />
        <SurfaceCard className="mt-8">
          <Button variant="outline" onClick={() => void navigate({ to: "/app/cvs" })}>
            Back to CVs
          </Button>
        </SurfaceCard>
      </>
    );
  }

  const setVisible = (section: CvSection) => (value: boolean) =>
    form.setValue(`visibility.${section}`, value, { shouldDirty: true });

  const hiddenEntries = values.visibility.hiddenEntries ?? [];
  const isEntryHidden = (entryId: string) => hiddenEntries.includes(entryId);
  const toggleEntryHidden = (entryId: string) => (next: boolean) =>
    form.setValue("visibility.hiddenEntries", withEntryHidden(hiddenEntries, entryId, next), { shouldDirty: true });


  const preview = (
    <div className="overflow-x-auto">
      <div className="cv-sheet mx-auto border border-border shadow-card">
        <CvDocument content={values.content} visibility={values.visibility} template={values.template} />
      </div>
    </div>
  );

  const editor = (
    <div>
      {save.isError && <FormAlert message={friendlyDataError(save.error)} />}

      <SurfaceCard as="section">
        <div className="max-w-sm">
          <Label htmlFor="cv-name">CV name</Label>
          <Input
            id="cv-name"
            className="mt-1.5"
            aria-invalid={!!form.formState.errors.name}
            {...form.register("name")}
          />
          <FieldError message={form.formState.errors.name?.message} />
        </div>
        <div className="mt-5">
          <CvTemplatePicker
            name="cv-editor-template"
            value={values.template}
            onChange={(template) => form.setValue("template", template, { shouldDirty: true })}
            hint="Switching template restyles the same content and updates the preview immediately."
          />
        </div>
        <p className="mt-4 text-xs text-subtle-foreground">
          Content version {cv.contentVersion}. Renaming or switching template does not create a new
          content version.
        </p>
      </SurfaceCard>


      {/* Contact */}
      <SectionCard
        section="contact"
        visible={values.visibility.contact}
        onVisibilityChange={setVisible("contact")}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="contact-name">Full name</Label>
            <Input id="contact-name" className="mt-1.5" {...form.register("content.contact.fullName")} />
          </div>
          <div>
            <Label htmlFor="contact-email">Email</Label>
            <Input id="contact-email" className="mt-1.5" {...form.register("content.contact.email")} />
          </div>
          <div>
            <Label htmlFor="contact-phone">Phone</Label>
            <Input id="contact-phone" className="mt-1.5" {...form.register("content.contact.phone")} />
          </div>
          <div>
            <Label htmlFor="contact-location">Location</Label>
            <Input
              id="contact-location"
              className="mt-1.5"
              {...form.register("content.contact.location")}
            />
          </div>
        </div>
        <LinkListField
          id="contact-links"
          label="Links"
          placeholder="e.g. linkedin.com/in/yourname"
          values={values.content.contact.links}
          onChange={(next) =>
            form.setValue("content.contact.links", next, { shouldDirty: true })
          }
          emptyHint="No links added yet."
        />
      </SectionCard>

      {/* Target title */}
      <SectionCard
        section="targetTitle"
        visible={values.visibility.targetTitle}
        onVisibilityChange={setVisible("targetTitle")}
      >
        <div>
          <Label htmlFor="target-title">Target title</Label>
          <Input
            id="target-title"
            className="mt-1.5"
            placeholder="e.g. Senior Product Manager"
            {...form.register("content.targetTitle")}
          />
        </div>
      </SectionCard>

      {/* Summary */}
      <SectionCard
        section="summary"
        visible={values.visibility.summary}
        onVisibilityChange={setVisible("summary")}
      >
        <div>
          <Label htmlFor="cv-summary">Professional summary</Label>
          <Textarea id="cv-summary" rows={5} className="mt-1.5" {...form.register("content.summary")} />
        </div>
      </SectionCard>

      {/* Experience */}
      <SectionCard
        section="experience"
        visible={values.visibility.experience}
        onVisibilityChange={setVisible("experience")}
        description="Each role can hold individual achievement bullets."
      >
        {experience.fields.length === 0 && (
          <p className="text-sm text-muted-foreground">No experience entries yet.</p>
        )}
        {experience.fields.map((field, index) => (
          <div
            key={field.id}
            className={`rounded-lg border border-border bg-surface-muted p-4 ${
              isEntryHidden(values.content.experience?.[index]?.id ?? "") ? "border-warning/40 opacity-80" : ""
            }`}
          >
            {isEntryHidden(values.content.experience?.[index]?.id ?? "") && <HiddenEntryBadge label="experience entry" />}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor={`exp-role-${index}`}>Role title</Label>
                <Input
                  id={`exp-role-${index}`}
                  className="mt-1.5"
                  {...form.register(`content.experience.${index}.role`)}
                />
              </div>
              <div>
                <Label htmlFor={`exp-org-${index}`}>Organisation</Label>
                <Input
                  id={`exp-org-${index}`}
                  className="mt-1.5"
                  {...form.register(`content.experience.${index}.organisation`)}
                />
              </div>
              <div>
                <Label htmlFor={`exp-loc-${index}`}>Location</Label>
                <Input
                  id={`exp-loc-${index}`}
                  className="mt-1.5"
                  {...form.register(`content.experience.${index}.location`)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <MonthYearField
                  id={`exp-start-${index}`}
                  label="Start"
                  value={values.content.experience[index]?.startDate ?? ""}
                  onChange={(value) =>
                    form.setValue(`content.experience.${index}.startDate`, value, { shouldDirty: true })
                  }
                />
                <MonthYearField
                  id={`exp-end-${index}`}
                  label="End"
                  value={values.content.experience[index]?.endDate ?? ""}
                  disabled={values.content.experience[index]?.current === true}
                  onChange={(value) =>
                    form.setValue(`content.experience.${index}.endDate`, value, { shouldDirty: true })
                  }
                />
              </div>
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm text-foreground">
              <Checkbox
                checked={values.content.experience[index]?.current === true}
                onCheckedChange={(checked) =>
                  form.setValue(`content.experience.${index}.current`, checked === true, {
                    shouldDirty: true,
                  })
                }
                aria-label="I currently work here"
              />
              I currently work here
            </label>

            <div className="mt-4">
              <span className="text-sm font-medium text-foreground">Bullets</span>
              <ul className="mt-2 flex flex-col gap-2">
                {(values.content.experience[index]?.bullets ?? []).map((_, bulletIndex) => (
                  <li key={`${field.id}-bullet-${bulletIndex}`} className="flex gap-2">
                    <Input
                      aria-label={`Bullet ${bulletIndex + 1} for role ${index + 1}`}
                      {...form.register(`content.experience.${index}.bullets.${bulletIndex}`)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={`Remove bullet ${bulletIndex + 1} from role ${index + 1}`}
                      onClick={() => {
                        const current = values.content.experience[index]?.bullets ?? [];
                        form.setValue(
                          `content.experience.${index}.bullets`,
                          current.filter((__, i) => i !== bulletIndex),
                          { shouldDirty: true },
                        );
                      }}
                    >
                      <X className="size-4" aria-hidden="true" />
                    </Button>
                  </li>
                ))}
              </ul>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 gap-1.5"
                onClick={() =>
                  form.setValue(
                    `content.experience.${index}.bullets`,
                    [...(values.content.experience[index]?.bullets ?? []), ""],
                    { shouldDirty: true },
                  )
                }
              >
                <Plus className="size-3.5" aria-hidden="true" />
                Add bullet
              </Button>
            </div>

            <EntryToolbar
              label="experience entry"
              hidden={isEntryHidden(values.content.experience?.[index]?.id ?? "")}
              onToggleHidden={toggleEntryHidden(values.content.experience?.[index]?.id ?? "")}
              index={index}
              count={experience.fields.length}
              onMove={experience.move}
              onRemove={experience.remove}
            />
          </div>
        ))}
        <div>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() =>
              experience.append({
                id: newEntryId(),
                role: "",
                organisation: "",
                location: "",
                startDate: "",
                endDate: "",
                current: false,
                bullets: [],
              })
            }
          >
            <Plus className="size-4" aria-hidden="true" />
            Add experience
          </Button>
        </div>
      </SectionCard>

      {/* Education */}
      <SectionCard
        section="education"
        visible={values.visibility.education}
        onVisibilityChange={setVisible("education")}
      >
        {education.fields.length === 0 && (
          <p className="text-sm text-muted-foreground">No education entries yet.</p>
        )}
        {education.fields.map((field, index) => (
          <div
            key={field.id}
            className={`rounded-lg border border-border bg-surface-muted p-4 ${
              isEntryHidden(values.content.education?.[index]?.id ?? "") ? "border-warning/40 opacity-80" : ""
            }`}
          >
            {isEntryHidden(values.content.education?.[index]?.id ?? "") && <HiddenEntryBadge label="education entry" />}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor={`edu-qual-${index}`}>Qualification</Label>
                <Input
                  id={`edu-qual-${index}`}
                  className="mt-1.5"
                  {...form.register(`content.education.${index}.qualification`)}
                />
              </div>
              <div>
                <Label htmlFor={`edu-inst-${index}`}>Institution</Label>
                <Input
                  id={`edu-inst-${index}`}
                  className="mt-1.5"
                  {...form.register(`content.education.${index}.institution`)}
                />
              </div>
              <div>
                <Label htmlFor={`edu-loc-${index}`}>Location</Label>
                <Input
                  id={`edu-loc-${index}`}
                  className="mt-1.5"
                  {...form.register(`content.education.${index}.location`)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <MonthYearField
                  id={`edu-start-${index}`}
                  label="Start"
                  value={values.content.education[index]?.startDate ?? ""}
                  onChange={(value) =>
                    form.setValue(`content.education.${index}.startDate`, value, { shouldDirty: true })
                  }
                />
                <MonthYearField
                  id={`edu-end-${index}`}
                  label="End"
                  value={values.content.education[index]?.endDate ?? ""}
                  disabled={values.content.education[index]?.current === true}
                  onChange={(value) =>
                    form.setValue(`content.education.${index}.endDate`, value, { shouldDirty: true })
                  }
                />
              </div>
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm text-foreground">
              <Checkbox
                checked={values.content.education[index]?.current === true}
                onCheckedChange={(checked) =>
                  form.setValue(`content.education.${index}.current`, checked === true, {
                    shouldDirty: true,
                  })
                }
                aria-label="I am currently studying here"
              />
              I am currently studying here
            </label>
            <EntryToolbar
              label="education entry"
              hidden={isEntryHidden(values.content.education?.[index]?.id ?? "")}
              onToggleHidden={toggleEntryHidden(values.content.education?.[index]?.id ?? "")}
              index={index}
              count={education.fields.length}
              onMove={education.move}
              onRemove={education.remove}
            />
          </div>
        ))}
        <div>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() =>
              education.append({
                id: newEntryId(),
                qualification: "",
                institution: "",
                location: "",
                startDate: "",
                endDate: "",
                current: false,
              })
            }
          >
            <Plus className="size-4" aria-hidden="true" />
            Add education
          </Button>
        </div>
      </SectionCard>

      {/* Skills */}
      <SectionCard
        section="skills"
        visible={values.visibility.skills}
        onVisibilityChange={setVisible("skills")}
      >
        <StringListField
          id="cv-skills"
          label="Skills"
          placeholder="Add a skill"
          values={values.content.skills}
          onChange={(next) => form.setValue("content.skills", next, { shouldDirty: true })}
          emptyHint="No skills added yet."
        />
      </SectionCard>

      {/* Languages */}
      <SectionCard
        section="languages"
        visible={values.visibility.languages}
        onVisibilityChange={setVisible("languages")}
      >
        <LanguageListField
          id="cv-languages"
          values={values.content.languages}
          onChange={(next) => form.setValue("content.languages", next, { shouldDirty: true })}
        />
      </SectionCard>

      {/* Certifications */}
      <SectionCard
        section="certifications"
        visible={values.visibility.certifications}
        onVisibilityChange={setVisible("certifications")}
      >
        <CertificationListField
          id="cv-certifications"
          values={values.content.certifications}
          onChange={(next) => form.setValue("content.certifications", next, { shouldDirty: true })}
        />
      </SectionCard>

      {/* Projects */}
      <SectionCard
        section="projects"
        visible={values.visibility.projects}
        onVisibilityChange={setVisible("projects")}
      >
        {projects.fields.length === 0 && (
          <p className="text-sm text-muted-foreground">No projects yet.</p>
        )}
        {projects.fields.map((field, index) => (
          <div
            key={field.id}
            className={`rounded-lg border border-border bg-surface-muted p-4 ${
              isEntryHidden(values.content.projects?.[index]?.id ?? "") ? "border-warning/40 opacity-80" : ""
            }`}
          >
            {isEntryHidden(values.content.projects?.[index]?.id ?? "") && <HiddenEntryBadge label="project" />}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor={`proj-name-${index}`}>Project name</Label>
                <Input
                  id={`proj-name-${index}`}
                  className="mt-1.5"
                  {...form.register(`content.projects.${index}.name`)}
                />
              </div>
              <div>
                <Label htmlFor={`proj-link-${index}`}>Link</Label>
                <Input
                  id={`proj-link-${index}`}
                  className="mt-1.5"
                  {...form.register(`content.projects.${index}.link`)}
                />
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor={`proj-desc-${index}`}>Description</Label>
              <Textarea
                id={`proj-desc-${index}`}
                rows={3}
                className="mt-1.5"
                {...form.register(`content.projects.${index}.description`)}
              />
            </div>
            <EntryToolbar
              label="project"
              hidden={isEntryHidden(values.content.projects?.[index]?.id ?? "")}
              onToggleHidden={toggleEntryHidden(values.content.projects?.[index]?.id ?? "")}
              index={index}
              count={projects.fields.length}
              onMove={projects.move}
              onRemove={projects.remove}
            />
          </div>
        ))}
        <div>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => projects.append({ id: newEntryId(), name: "", description: "", link: "" })}
          >
            <Plus className="size-4" aria-hidden="true" />
            Add project
          </Button>
        </div>
      </SectionCard>

      {/* Volunteering */}
      <SectionCard
        section="volunteering"
        visible={values.visibility.volunteering}
        onVisibilityChange={setVisible("volunteering")}
      >
        {volunteering.fields.length === 0 && (
          <p className="text-sm text-muted-foreground">No volunteering entries yet.</p>
        )}
        {volunteering.fields.map((field, index) => (
          <div
            key={field.id}
            className={`rounded-lg border border-border bg-surface-muted p-4 ${
              isEntryHidden(values.content.volunteering?.[index]?.id ?? "") ? "border-warning/40 opacity-80" : ""
            }`}
          >
            {isEntryHidden(values.content.volunteering?.[index]?.id ?? "") && <HiddenEntryBadge label="volunteering entry" />}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor={`vol-role-${index}`}>Role</Label>
                <Input
                  id={`vol-role-${index}`}
                  className="mt-1.5"
                  {...form.register(`content.volunteering.${index}.role`)}
                />
              </div>
              <div>
                <Label htmlFor={`vol-org-${index}`}>Organisation</Label>
                <Input
                  id={`vol-org-${index}`}
                  className="mt-1.5"
                  {...form.register(`content.volunteering.${index}.organisation`)}
                />
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor={`vol-desc-${index}`}>Description</Label>
              <Textarea
                id={`vol-desc-${index}`}
                rows={3}
                className="mt-1.5"
                {...form.register(`content.volunteering.${index}.description`)}
              />
            </div>
            <EntryToolbar
              label="volunteering entry"
              hidden={isEntryHidden(values.content.volunteering?.[index]?.id ?? "")}
              onToggleHidden={toggleEntryHidden(values.content.volunteering?.[index]?.id ?? "")}
              index={index}
              count={volunteering.fields.length}
              onMove={volunteering.move}
              onRemove={volunteering.remove}
            />
          </div>
        ))}
        <div>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() =>
              volunteering.append({ id: newEntryId(), role: "", organisation: "", description: "" })
            }
          >
            <Plus className="size-4" aria-hidden="true" />
            Add volunteering
          </Button>
        </div>
      </SectionCard>

      {/* Awards */}
      <SectionCard
        section="awards"
        visible={values.visibility.awards}
        onVisibilityChange={setVisible("awards")}
      >
        <StringListField
          id="cv-awards"
          label="Awards"
          placeholder="Add an award"
          values={values.content.awards}
          onChange={(next) => form.setValue("content.awards", next, { shouldDirty: true })}
          emptyHint="No awards added yet."
        />
      </SectionCard>
    </div>
  );

  return (
    <form noValidate onSubmit={form.handleSubmit((formValues) => save.mutate(formValues))}>
      <PageHeader
        title={cv.name}
        description={
          cv.sourceCvId || cv.tailoredForJobId
            ? "Tailored copy — an independent CV created from another version."
            : "Edit content, control what is shown, and export a PDF."
        }
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => void navigate({ to: "/app/cvs" })}
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              CVs
            </Button>
            <Button type="button" variant="outline" className="gap-2" onClick={handleDownloadPdf}>
              <Download className="size-4" aria-hidden="true" />
              Download PDF
            </Button>
            <Button type="submit" disabled={save.isPending || !isDirty}>
              {save.isPending ? "Saving…" : isDirty ? "Save CV" : "Saved"}
            </Button>
          </div>
        }
      />

      {isDirty && (
        <p className="mt-4 rounded-lg border border-border-strong bg-surface-muted px-3.5 py-2.5 text-sm text-foreground">
          You have unsaved changes. Save before downloading a PDF so the export matches the stored CV.
        </p>
      )}

      {isWide ? (
        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_auto]">
          <div className="min-w-0">{editor}</div>
          <aside className="w-fit" aria-label="CV preview">
            <div className="sticky top-6">
              <h2 className="mb-3 text-sm font-medium text-muted-foreground">Preview (A4)</h2>
              <div className="max-h-[calc(100vh-8rem)] overflow-auto rounded-xl bg-surface-muted p-3">
                <div style={{ zoom: 0.72 }}>{preview}</div>
              </div>
            </div>
          </aside>
        </div>
      ) : (
        <Tabs defaultValue="edit" className="mt-6">
          <TabsList>
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="edit">{editor}</TabsContent>
          <TabsContent value="preview">
            <div className="rounded-xl bg-surface-muted p-3">{preview}</div>
          </TabsContent>
        </Tabs>
      )}


      {mounted &&
        createPortal(
          <div className="cv-print-portal">
            <div className="cv-sheet">
              <CvDocument
                content={cv.content}
                visibility={cv.visibility}
                template={values.template}
              />
            </div>
          </div>,
          document.body,
        )}
    </form>
  );
}
