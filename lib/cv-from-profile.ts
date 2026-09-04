import { allVisible, type CvContent, type CvVisibility } from "@/lib/cv-data";
import { emptyCareerContent, newEntryId, descriptionToBullets } from "@/lib/career-content";
import { emptyProfile, type ProfessionalProfileValues } from "@/lib/profile-data";

/**
 * One-time copy of the Professional Profile into a brand-new CV.
 *
 * Profile and CV now share one content model, so this is a structural copy of
 * every reusable section. It is deterministic and pure: nothing is mutated and
 * no object or array reference is shared with the profile, and entry IDs are
 * re-minted, so later edits to either side cannot affect the other.
 */

export type ProfileSnapshotOptions = {
  /** Injectable so tests can assert stable, predictable entry IDs. */
  makeId?: () => string;
};

/** A headline is only used as a fallback target title when it reads like a role title. */
export function headlineAsTargetTitle(headline: string): string {
  const value = headline.trim().replace(/\s+/g, " ");
  if (!value) return "";
  if (value.length > 80) return "";
  // Sentence-like headlines ("I help teams ship faster.") are summaries, not titles.
  if (/[.!?]/.test(value)) return "";
  return value;
}

export { descriptionToBullets };

/** True when there is at least one piece of profile information worth copying. */
export function profileHasContent(profile: ProfessionalProfileValues | null | undefined): boolean {
  if (!profile) return false;
  const c = profile.contact;
  return (
    profile.headline.trim().length > 0 ||
    profile.targetTitle.trim().length > 0 ||
    profile.summary.trim().length > 0 ||
    [c.fullName, c.email, c.phone, c.location].some((v) => v.trim().length > 0) ||
    c.links.length > 0 ||
    profile.skills.some((skill) => skill.trim().length > 0) ||
    profile.awards.some((award) => award.trim().length > 0) ||
    profile.languages.some((entry) => entry.language.trim().length > 0) ||
    profile.certifications.some((entry) => entry.name.trim().length > 0) ||
    profile.experience.length > 0 ||
    profile.education.length > 0 ||
    profile.projects.length > 0 ||
    profile.volunteering.length > 0
  );
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

/** Plain-language description of what will be copied, for the creation screen. */
export function describeProfileSnapshot(profile: ProfessionalProfileValues | null | undefined): string[] {
  if (!profileHasContent(profile)) return [];
  const p = profile as ProfessionalProfileValues;
  const parts: string[] = [];
  const contact = [p.contact.fullName, p.contact.email, p.contact.phone, p.contact.location].some(
    (v) => v.trim(),
  );
  if (contact || p.contact.links.length > 0) parts.push("contact details");
  if (p.targetTitle.trim() || headlineAsTargetTitle(p.headline)) parts.push("target title");
  if (p.summary.trim()) parts.push("summary");
  if (p.experience.length) parts.push(plural(p.experience.length, "experience entry", "experience entries"));
  if (p.education.length) parts.push(plural(p.education.length, "education entry", "education entries"));
  const skills = p.skills.filter((s) => s.trim()).length;
  if (skills) parts.push(plural(skills, "skill", "skills"));
  const certifications = p.certifications.filter((entry) => entry.name.trim()).length;
  if (certifications) parts.push(plural(certifications, "certification", "certifications"));
  const languages = p.languages.filter((entry) => entry.language.trim()).length;
  if (languages) parts.push(plural(languages, "language", "languages"));
  if (p.projects.length) parts.push(plural(p.projects.length, "project", "projects"));
  if (p.volunteering.length)
    parts.push(plural(p.volunteering.length, "volunteering entry", "volunteering entries"));
  const awards = p.awards.filter((a) => a.trim()).length;
  if (awards) parts.push(plural(awards, "award", "awards"));
  return parts;
}

/** Build the initial CV content for a new manual CV from profile context. */
export function cvContentFromProfile(
  profile: ProfessionalProfileValues | null | undefined,
  options: ProfileSnapshotOptions = {},
): CvContent {
  const base = emptyCareerContent();
  if (!profileHasContent(profile)) return base;

  const makeId = options.makeId ?? newEntryId;
  const p = profile as ProfessionalProfileValues;

  return {
    ...base,
    contact: {
      fullName: p.contact.fullName.trim(),
      email: p.contact.email.trim(),
      phone: p.contact.phone.trim(),
      location: p.contact.location.trim(),
      links: p.contact.links.map((link) => link.trim()).filter((link) => link.length > 0),
    },
    targetTitle: p.targetTitle.trim() || headlineAsTargetTitle(p.headline),
    summary: p.summary.trim(),
    experience: p.experience.map((entry) => ({
      id: makeId(),
      role: entry.role.trim(),
      organisation: entry.organisation.trim(),
      location: entry.location.trim(),
      startDate: entry.startDate.trim(),
      endDate: entry.current ? "" : entry.endDate.trim(),
      current: entry.current === true,
      bullets: entry.bullets.map((bullet) => bullet.trim()).filter((bullet) => bullet.length > 0),
    })),
    education: p.education.map((entry) => ({
      id: makeId(),
      qualification: entry.qualification.trim(),
      institution: entry.institution.trim(),
      location: entry.location.trim(),
      startDate: entry.startDate.trim(),
      endDate: entry.current ? "" : entry.endDate.trim(),
      current: entry.current === true,
    })),
    skills: p.skills.map((skill) => skill.trim()).filter((skill) => skill.length > 0),
    languages: p.languages
      .map((entry) => ({ language: entry.language.trim(), proficiency: entry.proficiency }))
      .filter((entry) => entry.language.length > 0),
    certifications: p.certifications
      .map((entry) => ({ name: entry.name.trim(), url: entry.url.trim() }))
      .filter((entry) => entry.name.length > 0),
    projects: p.projects.map((entry) => ({
      id: makeId(),
      name: entry.name.trim(),
      description: entry.description.trim(),
      link: entry.link.trim(),
    })),
    volunteering: p.volunteering.map((entry) => ({
      id: makeId(),
      role: entry.role.trim(),
      organisation: entry.organisation.trim(),
      description: entry.description.trim(),
    })),
    awards: p.awards.map((award) => award.trim()).filter((award) => award.length > 0),
  };
}

/** New CVs start with every section visible; visibility is CV-only. */
export function snapshotVisibility(): CvVisibility {
  return allVisible();
}

export { emptyProfile };
