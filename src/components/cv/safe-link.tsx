import { friendlyLinkLabel, safeHref } from "@/lib/links";

/**
 * Small inline link glyph. Inline SVG with currentColor keeps it print-safe:
 * browsers render it in Save-as-PDF without extra assets or icon fonts.
 */
function LinkGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      style={{
        width: "0.82em",
        height: "0.82em",
        marginLeft: "0.25em",
        verticalAlign: "-0.08em",
        flex: "none",
      }}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5" />
      <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5" />
    </svg>
  );
}

/**
 * Renders a stored link as a real hyperlink when — and only when — it is a safe
 * http(s) URL. Used by the CV document (screen and print/PDF) so anchors stay
 * clickable in exported PDFs, and by any other surface showing user links.
 *
 * `label` lets callers make existing content itself the link target (a project
 * title, a certification name) so the CV never shows a raw URL line.
 */
export function SafeLink({
  value,
  label,
  color = "#1d4ed8",
  interactive = true,
  showIcon = true,
  bold = false,
}: {
  value: string;
  label?: string;
  color?: string;
  interactive?: boolean;
  showIcon?: boolean;
  bold?: boolean;
}) {
  const href = safeHref(value);
  const text = label?.trim() || friendlyLinkLabel(value);
  if (!href) {
    return (
      <span style={{ wordBreak: "break-word", fontWeight: bold ? 700 : undefined }}>
        {label?.trim() || value.trim()}
      </span>
    );
  }
  // The icon must stay glued to the text: the anchor never wraps internally, so
  // the glyph can never end up alone on its own line.
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      tabIndex={interactive ? undefined : -1}
      style={{
        color,
        textDecoration: "underline",
        textDecorationThickness: "0.5px",
        textUnderlineOffset: "2px",
        fontWeight: bold ? 700 : undefined,
        whiteSpace: "nowrap",
      }}
    >
      {/* Inline-flex wrapper makes the label + glyph a single atomic unit so the
          icon can never wrap onto its own line, while the anchor stays a real
          clickable link for print/PDF and screen readers. */}
      <span
        style={{
          display: "inline-flex",
          alignItems: "baseline",
          whiteSpace: "nowrap",
        }}
      >
        {text}
        {showIcon && <LinkGlyph />}
      </span>
    </a>
  );
}
