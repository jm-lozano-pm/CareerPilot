/**
 * Server-only page retrieval for URL-assisted job import.
 *
 * SSRF controls (P4.2):
 * - only http/https schemes, no credentials in the URL;
 * - hostnames resolving to loopback, private, CGNAT, link-local, documentation,
 *   benchmarking, multicast and reserved ranges are refused, for IPv4 in every
 *   literal form (dotted, decimal, octal, hex) and for IPv6 including
 *   unique-local, link-local, IPv4-mapped and NAT64 embeddings;
 * - internal-looking names (bare hostnames, .local, .internal, .lan, ...) refused;
 * - redirects are followed manually with the full validation re-applied to every
 *   hop, capped at MAX_REDIRECTS;
 * - hard request timeout, declared/actual response size cap, HTML/plain-text
 *   content types only, and no JavaScript execution;
 * - fetched content is treated strictly as untrusted data and only reaches the
 *   model inside labelled <data> blocks behind the prompt-injection guard;
 * - internal error details never reach the client: callers map every failure to
 *   one generic "inaccessible" message with the manual-entry fallback.
 *
 * Residual risk: this runtime (Cloudflare Workers) exposes no DNS resolver API
 * and no socket-level connect hook, so a public hostname that resolves to a
 * private address (DNS rebinding / TOCTOU) cannot be excluded at connect time.
 * The checks above are syntactic and literal-address based. Accepted knowingly;
 * a custom network stack would be disproportionate here.
 */

const MAX_REDIRECTS = 3;
const TIMEOUT_MS = 10_000;
const MAX_BYTES = 1_500_000;
export const MAX_TEXT_CHARS = 20_000;

const BLOCKED_HOST_SUFFIXES = [
  ".local",
  ".internal",
  ".localhost",
  ".home.arpa",
  ".lan",
  ".corp",
  ".intranet",
];

/** True for any IPv4 address outside the public unicast range. */
function isPrivateIpv4Number(value: number): boolean {
  const a = (value >>> 24) & 255;
  const b = (value >>> 16) & 255;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true; // link-local
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 192 && b === 0) return true; // 192.0.0.0/24 + 192.0.2.0/24
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
  if (a === 198 && b === 51) return true; // documentation
  if (a === 203 && b === 0) return true; // documentation
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a >= 224) return true; // multicast / reserved / broadcast
  return false;
}

/**
 * Parses every IPv4 literal form a resolver may accept: dotted quad, decimal,
 * octal and hexadecimal (e.g. 2130706433, 0x7f000001, 0177.0.0.1).
 * Returns null when the host is not an IPv4 literal at all.
 */
function parseIpv4(host: string): number | null {
  const parts = host.split(".");
  if (parts.length > 4 || parts.some((part) => part.length === 0)) return null;

  const numbers: number[] = [];
  for (const part of parts) {
    let value: number;
    if (/^0[xX][0-9a-fA-F]+$/.test(part)) value = parseInt(part.slice(2), 16);
    else if (/^0[0-7]+$/.test(part)) value = parseInt(part, 8);
    else if (/^\d+$/.test(part)) value = Number(part);
    else return null;
    if (!Number.isFinite(value) || value < 0) return null;
    numbers.push(value);
  }

  // Trailing part absorbs the remaining bytes (inet_aton semantics).
  const last = numbers[numbers.length - 1]!;
  const leading = numbers.slice(0, -1);
  if (leading.some((n) => n > 255)) return null;
  const remainingBytes = 4 - leading.length;
  if (last >= 2 ** (8 * remainingBytes)) return null;

  let result = 0;
  for (const n of leading) result = (result << 8) | n;
  return ((result * 2 ** (8 * remainingBytes) + last) >>> 0) as number;
}

function isBlockedIpv6(host: string): boolean {
  const value = host.toLowerCase();
  if (value === "::1" || value === "::") return true;
  if (/^f[cd]/.test(value)) return true; // unique-local
  if (/^fe[89ab]/.test(value)) return true; // link-local
  if (/^ff/.test(value)) return true; // multicast
  // IPv4-mapped and IPv4-compatible forms (::ffff:a.b.c.d, ::ffff:7f00:1, ::a.b.c.d)
  // are refused outright: they only appear in bypass attempts here.
  if (
    value.startsWith("::ffff:") ||
    /^::\d/.test(value) ||
    /^::[0-9a-f]{1,4}:[0-9a-f]{1,4}$/.test(value)
  )
    return true;
  // NAT64 embeddings: validate the inner IPv4 when written in dotted form.
  const embedded = /(\d{1,3}(?:\.\d{1,3}){3})$/.exec(value);
  if (embedded) {
    const inner = parseIpv4(embedded[1]!);
    if (inner !== null && isPrivateIpv4Number(inner)) return true;
  }
  if (/^64:ff9b:/.test(value)) return true; // NAT64 well-known prefix
  return false;
}

function isBlockedHost(hostname: string): boolean {
  const host = hostname
    .toLowerCase()
    .replace(/^\[|\]$/g, "")
    .replace(/\.$/, "");
  if (!host || host === "localhost" || host.endsWith(".localhost")) return true;
  if (BLOCKED_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix))) return true;
  if (host.includes(":")) return isBlockedIpv6(host);
  if (!host.includes(".")) return true; // bare/internal name
  const ipv4 = parseIpv4(host);
  if (ipv4 !== null) return isPrivateIpv4Number(ipv4);
  return false;
}

export function validateTargetUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new Error("unsafe-url");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("unsafe-url");
  if (url.username || url.password) throw new Error("unsafe-url");
  if (isBlockedHost(url.hostname)) throw new Error("unsafe-url");
  return url;
}

/** Deterministic source label derived from the hostname — never guessed by AI. */
export function sourceFromHostname(hostname: string): string {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  const known: Record<string, string> = {
    "linkedin.com": "LinkedIn",
    "greenhouse.io": "Greenhouse",
    "boards.greenhouse.io": "Greenhouse",
    "job-boards.greenhouse.io": "Greenhouse",
    "lever.co": "Lever",
    "jobs.lever.co": "Lever",
    "indeed.com": "Indeed",
    "workable.com": "Workable",
  };
  if (known[host]) return known[host]!;
  const base = Object.keys(known).find((key) => host === key || host.endsWith(`.${key}`));
  return base ? known[base]! : host;
}

export type FetchedPage = { finalUrl: URL; title: string; text: string };

export async function fetchJobPage(raw: string): Promise<FetchedPage> {
  let current = validateTargetUrl(raw);

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const response = await fetch(current.toString(), {
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "CareerPilotBot/1.0 (+job import requested by the account owner)",
      },
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error("inaccessible");
      current = validateTargetUrl(new URL(location, current).toString());
      continue;
    }

    if (!response.ok) throw new Error("inaccessible");
    const type = response.headers.get("content-type") ?? "";
    if (!/text\/html|application\/xhtml|text\/plain/i.test(type)) throw new Error("inaccessible");

    const declared = Number(response.headers.get("content-length") ?? "");
    if (Number.isFinite(declared) && declared > MAX_BYTES) throw new Error("inaccessible");

    const body = await readCapped(response);
    return { finalUrl: current, title: extractTitle(body), text: cleanHtml(body) };
  }

  throw new Error("inaccessible");
}

/** Reads at most MAX_BYTES, aborting oversized bodies instead of buffering them. */
async function readCapped(response: Response): Promise<string> {
  const stream = response.body;
  if (!stream) return "";
  const reader = stream.getReader();
  const decoder = new TextDecoder("utf-8");
  let text = "";
  let bytes = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      text += decoder.decode(value, { stream: true });
      if (bytes >= MAX_BYTES) break;
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  return text;
}

function extractTitle(html: string): string {
  const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  return decodeEntities(match?.[1] ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300);
}

/** Strips scripts/styles/navigation noise and collapses to readable text. */
export function cleanHtml(html: string): string {
  const stripped = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|svg|template|iframe)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<(nav|header|footer|aside|form)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\/(p|div|li|tr|h[1-6]|section|article|br)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ");

  return decodeEntities(stripped)
    .replace(/[ \t\u00a0]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n")
    .slice(0, MAX_TEXT_CHARS);
}

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_m, code: string) => String.fromCodePoint(Number(code)));
}
