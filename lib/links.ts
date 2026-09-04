/**
 * Shared, safe URL handling for CV contact links and certification credential
 * links. One utility so validation, normalisation and rendering never drift.
 *
 * Rules:
 * - Bare domains are accepted and normalised to https://
 * - Only http and https survive; javascript:, data:, file:, mailto:, etc. are rejected
 * - Credentials in the URL (user:pass@host) are rejected
 * - Whitespace and malformed hosts are rejected
 */

export type NormalisedUrl = { href: string; label: string };

const SCHEME = /^[a-z][a-z0-9+.-]*:/i;

export function normaliseUrl(raw: string): { url: NormalisedUrl } | { error: string } {
  const value = raw.trim();
  if (!value) return { error: "Enter a link." };
  if (/\s/.test(value)) return { error: "Links cannot contain spaces." };

  const hasScheme = SCHEME.test(value);
  if (hasScheme && !/^https?:/i.test(value)) {
    return { error: "Only web links starting with http:// or https:// are allowed." };
  }

  const candidate = hasScheme ? value : `https://${value}`;
  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return { error: "That doesn't look like a valid link." };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { error: "Only web links starting with http:// or https:// are allowed." };
  }
  if (parsed.username || parsed.password) {
    return { error: "Remove the username or password from the link." };
  }
  const host = parsed.hostname;
  if (!host.includes(".") || host.startsWith(".") || host.endsWith(".")) {
    return { error: "Include a full domain, for example linkedin.com/in/yourname." };
  }
  if (!/^[a-z0-9.-]+$/i.test(host)) {
    return { error: "That doesn't look like a valid link." };
  }

  const href = parsed.toString();
  return { url: { href, label: linkLabel(href) } };
}

/** True when a stored value is a safe http(s) link we can render as an anchor. */
export function safeHref(raw: string): string | null {
  const result = normaliseUrl(raw);
  return "url" in result ? result.url.href : null;
}

/** Readable label: drops the scheme, "www." and a trailing slash, then shortens. */
export function linkLabel(raw: string, maxLength = 48): string {
  const value = raw.trim();
  let readable = value.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
  readable = readable.replace(/\/$/, "");
  if (readable.length <= maxLength) return readable;
  const slash = readable.indexOf("/");
  const host = slash > 0 ? readable.slice(0, slash) : readable;
  return `${host}/…`;
}

/**
 * Concise human-readable label for a stored link, used on CV documents so the
 * printed CV shows "LinkedIn" rather than a long raw URL. Falls back to the
 * shortened host label for anything unrecognised.
 */
const KNOWN_HOSTS: { match: RegExp; label: string }[] = [
  { match: /(^|\.)linkedin\.com$/i, label: "LinkedIn" },
  { match: /(^|\.)github\.com$/i, label: "GitHub" },
  { match: /(^|\.)gitlab\.com$/i, label: "GitLab" },
  { match: /(^|\.)behance\.net$/i, label: "Behance" },
  { match: /(^|\.)dribbble\.com$/i, label: "Dribbble" },
  { match: /(^|\.)medium\.com$/i, label: "Medium" },
  { match: /(^|\.)stackoverflow\.com$/i, label: "Stack Overflow" },
  { match: /(^|\.)x\.com$/i, label: "X" },
  { match: /(^|\.)twitter\.com$/i, label: "X" },
  { match: /(^|\.)credly\.com$/i, label: "Credly" },
  { match: /(^|\.)youtube\.com$/i, label: "YouTube" },
  { match: /(^|\.)kaggle\.com$/i, label: "Kaggle" },
  { match: /(^|\.)notion\.(so|site)$/i, label: "Portfolio" },
];

export function friendlyLinkLabel(raw: string): string {
  const href = safeHref(raw);
  if (!href) return linkLabel(raw, 32);
  let host = "";
  try {
    host = new URL(href).hostname.replace(/^www\./i, "");
  } catch {
    return linkLabel(raw, 32);
  }
  const known = KNOWN_HOSTS.find((entry) => entry.match.test(host));
  if (known) return known.label;
  if (/(^|\.)(portfolio|folio)\./i.test(host)) return "Portfolio";
  // Personal site or anything else: show the bare domain, which reads cleanly.
  return linkLabel(host, 32);
}

