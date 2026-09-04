import {
  formatDateRange,
  type CvContent,
  type CvSection,
  type CvTemplate,
  type CvVisibility,
} from "@/lib/cv-data";
import { formatLanguages } from "@/lib/languages";
import { isSectionVisible, visibleEntries } from "@/lib/cv-visibility";
import { SafeLink } from "@/components/cv/safe-link";

/**
 * Neutral, professional one-column A4 CV document.
 *
 * Deliberately uses no CareerPilot branding, gradients, icons, photos, skill
 * bars or app controls, and no design tokens — these documents must render
 * identically on screen and in print/PDF. Factual rendering logic is shared by
 * all three templates; only presentation varies through `Theme`.
 */

type HeaderVariant = "centered" | "band" | "tight";
type SectionVariant = "rule" | "accent" | "bar";

type Theme = {
  fontFamily: string;
  baseSize: string;
  lineHeight: string;
  pagePadding: string;
  nameSize: string;
  nameFamily: string;
  nameCase: "uppercase" | "none";
  nameSpacing: string;
  sectionSize: string;
  sectionSpacing: string;
  blockGap: string;
  entryGap: string;
  accent: string;
  headerVariant: HeaderVariant;
  sectionVariant: SectionVariant;
  /** Solid fill used by the band/bar variants. */
  fill: string;
  onFill: string;
};

const THEMES: Record<CvTemplate, Theme> = {
  classic: {
    fontFamily: '"Times New Roman", Georgia, serif',
    baseSize: "10.5pt",
    lineHeight: "1.45",
    pagePadding: "18mm 18mm",
    nameSize: "21pt",
    nameFamily: '"Times New Roman", Georgia, serif',
    nameCase: "uppercase",
    nameSpacing: "0.06em",
    sectionSize: "10.5pt",
    sectionSpacing: "0.1em",
    blockGap: "12px",
    entryGap: "7px",
    accent: "#111111",
    headerVariant: "centered",
    sectionVariant: "rule",
    fill: "#111111",
    onFill: "#ffffff",
  },
  modern: {
    fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
    baseSize: "10.5pt",
    lineHeight: "1.5",
    pagePadding: "16mm 16mm",
    nameSize: "22pt",
    nameFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
    nameCase: "uppercase",
    nameSpacing: "0.01em",
    sectionSize: "10.5pt",
    sectionSpacing: "0.12em",
    blockGap: "13px",
    entryGap: "8px",
    accent: "#1d4ed8",
    headerVariant: "band",
    sectionVariant: "accent",
    fill: "#1d4ed8",
    onFill: "#ffffff",
  },
  compact: {
    fontFamily:
      '"Arial Narrow", "Helvetica Neue Condensed", Arial, "Helvetica Neue", Helvetica, sans-serif',
    baseSize: "9.5pt",
    lineHeight: "1.3",
    pagePadding: "12mm 13mm",
    nameSize: "16pt",
    nameFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
    nameCase: "uppercase",
    nameSpacing: "0.02em",
    sectionSize: "8.5pt",
    sectionSpacing: "0.08em",
    blockGap: "7px",
    entryGap: "5px",
    accent: "#333333",
    headerVariant: "tight",
    sectionVariant: "bar",
    fill: "#333333",
    onFill: "#ffffff",
  },
};

/** Forces solid fills to survive Chromium's "Background graphics" setting. */
const exactColor = {
  WebkitPrintColorAdjust: "exact",
  printColorAdjust: "exact",
} as const;

type SectionProps = {
  theme: Theme;
  title: string;
  children: React.ReactNode;
};

function Section({ theme, title, children }: SectionProps) {
  if (theme.sectionVariant === "bar") {
    return (
      <section style={{ marginTop: theme.blockGap }}>
        <h2
          style={{
            ...exactColor,
            fontSize: theme.sectionSize,
            fontWeight: 700,
            color: theme.onFill,
            background: theme.fill,
            border: `1px solid ${theme.fill}`,
            textTransform: "uppercase",
            letterSpacing: theme.sectionSpacing,
            margin: "0 0 4px",
            padding: "2px 6px",
          }}
        >
          {title}
        </h2>
        {children}
      </section>
    );
  }

  if (theme.sectionVariant === "accent") {
    return (
      <section style={{ marginTop: theme.blockGap }}>
        <div style={{ borderLeft: `2px solid ${theme.accent}`, paddingLeft: "9px" }}>
          <h2
            style={{
              fontSize: theme.sectionSize,
              fontWeight: 700,
              color: theme.accent,
              textTransform: "uppercase",
              letterSpacing: theme.sectionSpacing,
              margin: "0 0 5px",
            }}
          >
            {title}
          </h2>
          {children}
        </div>
      </section>
    );
  }

  return (
    <section style={{ marginTop: theme.blockGap }}>
      <h2
        style={{
          fontSize: theme.sectionSize,
          fontWeight: 700,
          color: "#111111",
          textTransform: "uppercase",
          letterSpacing: theme.sectionSpacing,
          margin: "0 0 5px",
          paddingBottom: "2px",
          borderBottom: "1px solid #666666",
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function EntryHeading({
  theme,
  primary,
  secondary,
  meta,
}: {
  theme: Theme;
  primary: string;
  secondary: string;
  meta: string;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
      <div style={{ minWidth: 0 }}>
        {primary && (
          <div
            style={{
              fontWeight: 700,
              color: theme.sectionVariant === "accent" ? "#111111" : undefined,
            }}
          >
            {primary}
          </div>
        )}
        {secondary && <div style={{ color: "#333333" }}>{secondary}</div>}
      </div>
      {meta && (
        <div style={{ whiteSpace: "nowrap", color: "#444444", fontSize: "0.92em" }}>{meta}</div>
      )}
    </div>
  );
}

function InlineList({ items }: { items: string[] }) {
  return <p style={{ margin: "2px 0 0" }}>{items.join(" · ")}</p>;
}

/**
 * Drops entries the user added but never filled in. `id`, `current` and other
 * non-text fields are ignored, so a placeholder row never produces an empty
 * section heading or blank line in Preview or the exported PDF.
 */
function withContent<T extends Record<string, unknown>>(entries: T[]): T[] {
  return entries.filter((entry) =>
    Object.entries(entry).some(([key, value]) => {
      if (key === "id") return false;
      if (typeof value === "string") return value.trim().length > 0;
      if (Array.isArray(value)) return value.some((v) => typeof v === "string" && v.trim());
      return false;
    }),
  );
}


export function CvDocument({
  content,
  visibility,
  template,
}: {
  content: CvContent;
  visibility: CvVisibility;
  template: CvTemplate;
}) {
  const theme = THEMES[template];
  const show = (key: CvSection) => isSectionVisible(visibility, key);

  const contact = content.contact;
  const contactParts = show("contact")
    ? [contact.location, contact.phone, contact.email].filter((v) => v.trim())
    : [];
  const contactLine = contactParts.join("  |  ");
  const contactLinks = show("contact") ? contact.links.filter((l) => l.trim()) : [];

  // Section visibility and per-entry Hide (P1.5) both flow through
  // visibleEntries, so Preview and Print/Save-as-PDF share one rule.
  // Entries the user created but never filled in are omitted from the
  // document so an exported CV never shows an empty heading or blank row.
  const experience = withContent(visibleEntries(visibility, "experience", content.experience));
  const education = withContent(visibleEntries(visibility, "education", content.education));
  const skills = show("skills") ? content.skills.filter((v) => v.trim()) : [];
  const languages = show("languages") ? formatLanguages(content.languages) : [];
  const certifications = show("certifications")
    ? content.certifications.filter((entry) => entry.name.trim())
    : [];
  const projects = withContent(visibleEntries(visibility, "projects", content.projects));
  const volunteering = withContent(visibleEntries(visibility, "volunteering", content.volunteering));


  const awards = show("awards") ? content.awards.filter((v) => v.trim()) : [];

  const showName = show("contact") && Boolean(contact.fullName.trim());
  const showTitle = show("targetTitle") && Boolean(content.targetTitle.trim());

  const hasAnything =
    showName ||
    contactLine.length > 0 ||
    contactLinks.length > 0 ||
    showTitle ||
    (show("summary") && content.summary.trim()) ||
    experience.length > 0 ||
    education.length > 0 ||
    skills.length > 0 ||
    languages.length > 0 ||
    certifications.length > 0 ||
    projects.length > 0 ||
    volunteering.length > 0 ||
    awards.length > 0;

  /**
   * One horizontal contact row: location, phone, email, then links, separated by
   * thin dividers. Wraps only when the width genuinely cannot fit the row.
   */
  const contactRow = (
    color: string,
    options?: { align?: "flex-start" | "center"; fontSize?: string },
  ) => {
    const items: React.ReactNode[] = [
      ...contactParts.map((part, index) => <span key={`c-${index}`}>{part}</span>),
      ...contactLinks.map((link, index) => (
        <SafeLink key={`link-${index}`} value={link} color={color} />
      )),
    ];
    if (items.length === 0) return null;
    return (
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "baseline",
          justifyContent: options?.align === "center" ? "center" : "flex-start",
          columnGap: "10px",
          rowGap: "2px",
          margin: "5px 0 0",
          fontSize: options?.fontSize,
        }}
      >
        {items.map((item, index) => (
          <span key={`item-${index}`} style={{ display: "inline-flex", alignItems: "baseline" }}>
            {index > 0 && (
              <span aria-hidden="true" style={{ opacity: 0.5, marginRight: "10px" }}>
                |
              </span>
            )}
            {item}
          </span>
        ))}
      </div>
    );
  };

  let header: React.ReactNode = null;

  if (theme.headerVariant === "centered") {
    header = (
      <header style={{ textAlign: "center", borderBottom: "2px solid #111111", paddingBottom: "8px" }}>
        {showName && (
          <h1
            style={{
              fontFamily: theme.nameFamily,
              fontSize: theme.nameSize,
              fontWeight: 700,
              textTransform: theme.nameCase,
              letterSpacing: theme.nameSpacing,
              margin: 0,
            }}
          >
            {contact.fullName}
          </h1>
        )}
        {showTitle && (
          <p
            style={{
              margin: "3px 0 0",
              fontSize: "1.08em",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {content.targetTitle}
          </p>
        )}
        <div style={{ color: "#333333" }}>{contactRow("#111111", { align: "center" })}</div>
      </header>
    );
  } else if (theme.headerVariant === "band") {
    header = (
      <header
        style={{
          ...exactColor,
          background: theme.fill,
          color: theme.onFill,
          borderBottom: `3px solid ${theme.fill}`,
          padding: "10mm 9mm",
        }}
      >
        <div style={{ minWidth: 0 }}>
          {showName && (
            <h1
              style={{
                fontFamily: theme.nameFamily,
                fontSize: theme.nameSize,
                fontWeight: 700,
                textTransform: theme.nameCase,
                letterSpacing: theme.nameSpacing,
                margin: 0,
                lineHeight: 1.15,
              }}
            >
              {contact.fullName}
            </h1>
          )}
          {showTitle && (
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "1.05em",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {content.targetTitle}
            </p>
          )}
        </div>
        {(contactLine || contactLinks.length > 0) && (
          <div style={{ minWidth: 0 }}>{contactRow(theme.onFill, { fontSize: "0.86em" })}</div>
        )}
      </header>
    );
  } else {
    header = (
      <header>
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}>
          {showName && (
            <h1
              style={{
                fontFamily: theme.nameFamily,
                fontSize: theme.nameSize,
                fontWeight: 700,
                textTransform: theme.nameCase,
                letterSpacing: theme.nameSpacing,
                margin: 0,
              }}
            >
              {contact.fullName}
            </h1>
          )}
          {showName && showTitle && <span style={{ color: "#999999" }}>|</span>}
          {showTitle && (
            <p
              style={{
                margin: 0,
                fontWeight: 700,
                fontSize: "1.02em",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "#333333",
              }}
            >
              {content.targetTitle}
            </p>
          )}
        </div>
        <div style={{ color: "#333333" }}>{contactRow("#333333", { fontSize: "0.94em" })}</div>
        <div style={{ borderBottom: "1px solid #999999", marginTop: "5px" }} />
      </header>
    );
  }

  const isBand = theme.headerVariant === "band";

  return (
    <div
      className={`cv-document cv-document--${template}`}
      style={{
        fontFamily: theme.fontFamily,
        fontSize: theme.baseSize,
        lineHeight: theme.lineHeight,
        color: "#111111",
        background: "#ffffff",
        padding: isBand ? "0" : theme.pagePadding,
      }}
    >
      {header}

      <div style={{ padding: isBand ? "2mm 16mm 16mm" : undefined }}>
        {!hasAnything && (
          <p style={{ marginTop: "24px", color: "#666666" }}>
            This CV has no visible content yet. Add details on the left to see them here.
          </p>
        )}

        {show("summary") && content.summary.trim() && (
          <Section theme={theme} title="Profile">
            <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{content.summary}</p>
          </Section>
        )}

        {experience.length > 0 && (
          <Section theme={theme} title="Experience">
            {experience.map((entry, entryIndex) => (
              <div
                key={entry.id}
                style={{
                  marginTop: entryIndex === 0 ? 0 : theme.entryGap,
                  breakInside: "avoid",
                  pageBreakInside: "avoid",
                }}
              >
                <EntryHeading
                  theme={theme}
                  primary={entry.role}
                  secondary={[entry.organisation, entry.location]
                    .filter((v) => v.trim())
                    .join(", ")}
                  meta={formatDateRange(entry.startDate, entry.endDate, entry.current)}
                />
                {entry.bullets.filter((b) => b.trim()).length > 0 && (
                  <ul style={{ margin: "3px 0 0", paddingLeft: "16px" }}>
                    {entry.bullets
                      .filter((b) => b.trim())
                      .map((bullet, index) => (
                        <li key={`${entry.id}-b${index}`} style={{ marginTop: "1px" }}>
                          {bullet}
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            ))}
          </Section>
        )}

        {education.length > 0 && (
          <Section theme={theme} title="Education">
            {education.map((entry, entryIndex) => (
              <div
                key={entry.id}
                style={{
                  marginTop: entryIndex === 0 ? 0 : theme.entryGap,
                  breakInside: "avoid",
                  pageBreakInside: "avoid",
                }}
              >
                <EntryHeading
                  theme={theme}
                  primary={entry.qualification}
                  secondary={[entry.institution, entry.location].filter((v) => v.trim()).join(", ")}
                  meta={formatDateRange(entry.startDate, entry.endDate, entry.current)}
                />
              </div>
            ))}
          </Section>
        )}

        {projects.length > 0 && (
          <Section theme={theme} title="Projects">
            {projects.map((entry, entryIndex) => (
              <div
                key={entry.id}
                style={{
                  marginTop: entryIndex === 0 ? 0 : theme.entryGap,
                  breakInside: "avoid",
                  pageBreakInside: "avoid",
                }}
              >
                {entry.name.trim() && (
                  <div style={{ fontWeight: 700 }}>
                    {entry.link.trim() ? (
                      <SafeLink value={entry.link} label={entry.name} color={theme.accent} bold />
                    ) : (
                      entry.name
                    )}
                  </div>
                )}
                {entry.description.trim() && (
                  <p style={{ margin: "1px 0 0", whiteSpace: "pre-wrap" }}>{entry.description}</p>
                )}
                {entry.link.trim() && !entry.name.trim() && (
                  <p style={{ margin: "1px 0 0" }}>
                    <SafeLink value={entry.link} color={theme.accent} />
                  </p>
                )}
              </div>
            ))}
          </Section>
        )}

        {skills.length > 0 && (
          <Section theme={theme} title="Skills">
            <InlineList items={skills} />
          </Section>
        )}

        {languages.length > 0 && (
          <Section theme={theme} title="Languages">
            <InlineList items={languages} />
          </Section>
        )}

        {certifications.length > 0 && (
          <Section theme={theme} title="Certifications">
            <ul style={{ margin: "2px 0 0", paddingLeft: "16px" }}>
              {certifications.map((item, index) => (
                <li key={`cert-${index}`}>
                  {item.url.trim() ? (
                    <SafeLink value={item.url} label={item.name} color={theme.accent} />
                  ) : (
                    item.name.trim()
                  )}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {volunteering.length > 0 && (
          <Section theme={theme} title="Volunteering">
            {volunteering.map((entry, entryIndex) => (
              <div
                key={entry.id}
                style={{
                  marginTop: entryIndex === 0 ? 0 : theme.entryGap,
                  breakInside: "avoid",
                  pageBreakInside: "avoid",
                }}
              >
                <EntryHeading
                  theme={theme}
                  primary={entry.role}
                  secondary={entry.organisation}
                  meta=""
                />
                {entry.description.trim() && (
                  <p style={{ margin: "1px 0 0", whiteSpace: "pre-wrap" }}>{entry.description}</p>
                )}
              </div>
            ))}
          </Section>
        )}

        {awards.length > 0 && (
          <Section theme={theme} title="Awards">
            <ul style={{ margin: "2px 0 0", paddingLeft: "16px" }}>
              {awards.map((item, index) => (
                <li key={`award-${index}`}>{item}</li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    </div>
  );
}
