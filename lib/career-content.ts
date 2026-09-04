import { z } from "zod";
import { languageEntrySchema, normaliseLanguages } from "@/lib/languages";
import { certificationSchema, normaliseCertifications } from "@/lib/certifications";

/**
 * One canonical model for reusable, factual career content.
 *
 * Both the Professional Profile and a CV document store exactly these sections,
 * so a user maintains one mental model and the Profile -> CV copy is a direct
 * structural copy. CV-only presentation settings (template, section/entry
 * visibility, document name, tailoring provenance, print settings) deliberately
 * live outside this module and are never copied into the Profile.
 */

const text = z.string().trim().default("");

export const careerContactSchema = z.object({
  fullName: text,
  email: text,
  phone: text,
  location: text,
  links: z.array(z.string().trim()).default([]),
});

export const careerExperienceSchema = z.object({
  id: z.string().min(1),
  role: text,
  organisation: text,
  location: text,
  startDate: text,
  endDate: text,
  current: z.boolean().default(false),
  bullets: z.array(z.string().trim()).default([]),
});

export const careerEducationSchema = z.object({
  id: z.string().min(1),
  qualification: text,
  institution: text,
  location: text,
  startDate: text,
  endDate: text,
  current: z.boolean().default(false),
});

export const careerProjectSchema = z.object({
  id: z.string().min(1),
  name: text,
  description: text,
  link: text,
});

export const careerVolunteeringSchema = z.object({
  id: z.string().min(1),
  role: text,
  organisation: text,
  description: text,
});

export const careerContentSchema = z.object({
  contact: careerContactSchema,
  targetTitle: text,
  summary: text,
  experience: z.array(careerExperienceSchema).default([]),
  education: z.array(careerEducationSchema).default([]),
  skills: z.array(z.string().trim()).default([]),
  languages: z.array(languageEntrySchema).default([]),
  certifications: z.array(certificationSchema).default([]),
  projects: z.array(careerProjectSchema).default([]),
  volunteering: z.array(careerVolunteeringSchema).default([]),
  awards: z.array(z.string().trim()).default([]),
});

export type CareerContact = z.infer<typeof careerContactSchema>;
export type CareerExperience = z.infer<typeof careerExperienceSchema>;
export type CareerEducation = z.infer<typeof careerEducationSchema>;
export type CareerProject = z.infer<typeof careerProjectSchema>;
export type CareerVolunteering = z.infer<typeof careerVolunteeringSchema>;
export type CareerContent = z.infer<typeof careerContentSchema>;

export function newEntryId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

export function emptyCareerContact(): CareerContact {
  return { fullName: "", email: "", phone: "", location: "", links: [] };
}

export function emptyCareerContent(): CareerContent {
  return {
    contact: emptyCareerContact(),
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
  };
}

export const s = (v: unknown) => (typeof v === "string" ? v : "");

export function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

export function rows(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter((row): row is Record<string, unknown> => typeof row === "object" && row !== null);
}

/** Free-text descriptions become discrete bullets; bullet markers are stripped. */
export function descriptionToBullets(description: string): string[] {
  return description
    .split(/\r?\n+/)
    .map((line) => line.replace(/^\s*[-•*\u2022]\s*/, "").trim())
    .filter((line) => line.length > 0);
}

export function parseContact(raw: unknown): CareerContact {
  const source = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
  return {
    fullName: s(source["fullName"]),
    email: s(source["email"]),
    phone: s(source["phone"]),
    location: s(source["location"]),
    links: strings(source["links"]),
  };
}

/**
 * Legacy rows are read without data loss: the original Professional Profile
 * stored `title` and a single free-text `description`, which map to `role` and
 * bullets. Missing entry IDs are minted on read.
 */
export function parseExperience(raw: unknown): CareerExperience[] {
  return rows(raw).map((row) => {
    const bullets = strings(row["bullets"]);
    return {
      id: s(row["id"]) || newEntryId(),
      role: s(row["role"]) || s(row["title"]),
      organisation: s(row["organisation"]),
      location: s(row["location"]),
      startDate: s(row["startDate"]),
      endDate: s(row["endDate"]),
      current: row["current"] === true,
      bullets: bullets.length > 0 ? bullets : descriptionToBullets(s(row["description"])),
    };
  });
}

export function parseEducation(raw: unknown): CareerEducation[] {
  return rows(raw).map((row) => ({
    id: s(row["id"]) || newEntryId(),
    qualification: s(row["qualification"]),
    institution: s(row["institution"]),
    location: s(row["location"]),
    startDate: s(row["startDate"]),
    endDate: s(row["endDate"]),
    current: row["current"] === true,
  }));
}

export function parseProjects(raw: unknown): CareerProject[] {
  return rows(raw).map((row) => ({
    id: s(row["id"]) || newEntryId(),
    name: s(row["name"]),
    description: s(row["description"]),
    link: s(row["link"]),
  }));
}

export function parseVolunteering(raw: unknown): CareerVolunteering[] {
  return rows(raw).map((row) => ({
    id: s(row["id"]) || newEntryId(),
    role: s(row["role"]),
    organisation: s(row["organisation"]),
    description: s(row["description"]),
  }));
}

export function parseLanguagesField(raw: unknown) {
  return normaliseLanguages(raw);
}

export function parseCertificationsField(raw: unknown) {
  return normaliseCertifications(raw);
}

/** Structural, reference-free parse of any stored career-content JSON. */
export function parseCareerContent(raw: unknown): CareerContent {
  const source: Record<string, unknown> =
    typeof raw === "object" && raw !== null && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  return {
    contact: parseContact(source["contact"]),
    targetTitle: s(source["targetTitle"]),
    summary: s(source["summary"]),
    experience: parseExperience(source["experience"]),
    education: parseEducation(source["education"]),
    skills: strings(source["skills"]),
    languages: normaliseLanguages(source["languages"]),
    certifications: normaliseCertifications(source["certifications"]),
    projects: parseProjects(source["projects"]),
    volunteering: parseVolunteering(source["volunteering"]),
    awards: strings(source["awards"]),
  };
}

export function newExperienceEntry(): CareerExperience {
  return {
    id: newEntryId(),
    role: "",
    organisation: "",
    location: "",
    startDate: "",
    endDate: "",
    current: false,
    bullets: [],
  };
}

export function newEducationEntry(): CareerEducation {
  return {
    id: newEntryId(),
    qualification: "",
    institution: "",
    location: "",
    startDate: "",
    endDate: "",
    current: false,
  };
}

export function newProjectEntry(): CareerProject {
  return { id: newEntryId(), name: "", description: "", link: "" };
}

export function newVolunteeringEntry(): CareerVolunteering {
  return { id: newEntryId(), role: "", organisation: "", description: "" };
}
