import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { EMPLOYMENT_TYPES } from "@/lib/jobs-data";
import {
  careerContentSchema,
  emptyCareerContent,
  parseCareerContent,
  type CareerContent,
} from "@/lib/career-content";

/**
 * The Professional Profile is the user's single factual source of reusable
 * career content. It stores exactly the same content sections as a CV document
 * (see `@/lib/career-content`) plus a positioning headline — and deliberately
 * none of the CV-only presentation settings (template, section/entry
 * visibility, document name, tailoring provenance, print settings).
 */
export const professionalProfileSchema = careerContentSchema.extend({
  headline: z.string().trim().max(160, "Keep the headline under 160 characters.").default(""),
  summary: z.string().trim().max(2000, "Keep the summary under 2000 characters.").default(""),
});


export const WORK_MODES = ["Remote", "Hybrid", "On-site"] as const;

/**
 * Career Goals reuses the canonical Jobs employment vocabulary so preferences
 * and recorded jobs speak the same language. These are user *preferences*, not
 * job requirements or hiring evidence.
 */
export const EMPLOYMENT_TYPE_PREFERENCES = EMPLOYMENT_TYPES;

export const careerGoalsSchema = z.object({
  targetRoles: z
    .array(z.string().trim().min(1, "Role cannot be empty."))
    .min(1, "Add at least one target role so analysis has direction.")
    .default([]),
  targetLocations: z.array(z.string().trim().min(1, "Location cannot be empty.")).default([]),
  preferredWorkModes: z.array(z.enum(WORK_MODES)).default([]),
  preferredEmploymentTypes: z.array(z.enum(EMPLOYMENT_TYPE_PREFERENCES)).default([]),
  notes: z.string().trim().max(2000, "Keep notes under 2000 characters.").default(""),
});

export type ProfessionalProfileValues = CareerContent & { headline: string };
export type CareerGoalsValues = z.infer<typeof careerGoalsSchema>;

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

export async function getCurrentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("No active session");
  return data.user.id;
}

export const emptyProfile: ProfessionalProfileValues = {
  ...emptyCareerContent(),
  headline: "",
};

export const emptyGoals: CareerGoalsValues = {
  targetRoles: [],
  targetLocations: [],
  preferredWorkModes: [],
  preferredEmploymentTypes: [],
  notes: "",
};

const PROFILE_SELECT =
  "headline, target_title, summary, contact, skills, languages, certifications, experience, education, projects, volunteering, awards";

export async function fetchProfessionalProfile(): Promise<ProfessionalProfileValues> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("professional_profiles")
    .select(PROFILE_SELECT)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return emptyProfile;
  const row = data as Record<string, unknown>;
  // Legacy rows predate the newer sections; parseCareerContent defaults them to
  // empty and maps the old experience `title`/`description` fields.
  const content = parseCareerContent({
    contact: row["contact"],
    targetTitle: row["target_title"],
    summary: row["summary"],
    experience: row["experience"],
    education: row["education"],
    skills: row["skills"],
    languages: row["languages"],
    certifications: row["certifications"],
    projects: row["projects"],
    volunteering: row["volunteering"],
    awards: row["awards"],
  });
  return { ...content, headline: typeof row["headline"] === "string" ? row["headline"] : "" };
}

export async function saveProfessionalProfile(values: ProfessionalProfileValues): Promise<void> {
  const userId = await getCurrentUserId();
  const { error } = await supabase.from("professional_profiles").upsert(
    {
      user_id: userId,
      headline: values.headline || null,
      target_title: values.targetTitle || null,
      summary: values.summary || null,
      contact: values.contact,
      skills: values.skills,
      languages: values.languages,
      certifications: values.certifications,
      experience: values.experience.map((entry) => ({
        ...entry,
        endDate: entry.current ? "" : entry.endDate,
      })),
      education: values.education.map((entry) => ({
        ...entry,
        endDate: entry.current ? "" : entry.endDate,
      })),
      projects: values.projects,
      volunteering: values.volunteering,
      awards: values.awards,
    } as never,
    { onConflict: "user_id" },
  );
  if (error) throw error;
}

export async function fetchCareerGoals(): Promise<CareerGoalsValues> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("career_goals")
    .select("target_roles, target_locations, preferred_work_modes, preferred_employment_types, notes")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return emptyGoals;
  const modes = stringList(data.preferred_work_modes).filter(
    (mode): mode is (typeof WORK_MODES)[number] =>
      (WORK_MODES as readonly string[]).includes(mode),
  );
  const employmentTypes = stringList(
    (data as Record<string, unknown>)["preferred_employment_types"],
  ).filter((type): type is (typeof EMPLOYMENT_TYPE_PREFERENCES)[number] =>
    (EMPLOYMENT_TYPE_PREFERENCES as readonly string[]).includes(type),
  );
  return {
    targetRoles: stringList(data.target_roles),
    targetLocations: stringList(data.target_locations),
    preferredWorkModes: modes,
    preferredEmploymentTypes: employmentTypes,
    notes: data.notes ?? "",
  };
}

export async function saveCareerGoals(values: CareerGoalsValues): Promise<void> {
  const userId = await getCurrentUserId();
  const { error } = await supabase.from("career_goals").upsert(
    {
      user_id: userId,
      target_roles: values.targetRoles,
      target_locations: values.targetLocations,
      preferred_work_modes: values.preferredWorkModes,
      preferred_employment_types: values.preferredEmploymentTypes,
      notes: values.notes || null,
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}
