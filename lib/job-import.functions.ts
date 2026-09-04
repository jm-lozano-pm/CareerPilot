import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { IMPORT_MESSAGES, jobExtractionSchema, type ImportResult } from "@/lib/ai-shared";

const inputSchema = z.object({ url: z.string().trim().min(1).max(600) });

const SYSTEM = [
  "You extract job posting facts from cleaned webpage text for a career-management tool.",
  "Copy facts only. Never invent, infer or complete a value that is not stated on the page.",
  "Preserve the meaning and wording of the job description; do not summarise away requirements.",
  "Set status 'extracted' when the value is clearly stated, 'uncertain' when it is only implied,",
  "and 'missing' with value null when it is absent. List every absent field in missing_fields.",
  "Set page_type to 'not_job_posting' for pages that are not a single job posting (search results,",
  "login walls, company home pages), 'uncertain' when unclear.",
  "Never output a source or a URL. Return this exact JSON shape:",
  '{"page_type":"job_posting|uncertain|not_job_posting","job_title":{"value":string|null,"status":"extracted|uncertain|missing"},',
  '"company":{...},"description":{...},"location":{...},"employment_type":{...},"missing_fields":[string],"warnings":[string]}',
].join(" ");

/**
 * URL-assisted extraction. Fetches the page server-side, sends only the URL,
 * hostname, title and cleaned text to the model, and returns a draft for the
 * user to review. Nothing is persisted here.
 */
export const importJobFromUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data, context }): Promise<ImportResult> => {
    const { fetchJobPage, sourceFromHostname, validateTargetUrl } = await import("@/lib/url-fetch.server");
    const { callAiJson, dataBlock } = await import("@/lib/ai-gateway.server");

    let page;
    let source: string;
    try {
      validateTargetUrl(data.url);
      page = await fetchJobPage(data.url);
      source = sourceFromHostname(page.finalUrl.hostname);
    } catch {
      return { ok: false, reason: "inaccessible", message: IMPORT_MESSAGES.inaccessible };
    }

    if (page.text.length < 200) {
      return { ok: false, reason: "inaccessible", message: IMPORT_MESSAGES.unreadable };
    }

    const requestKey = `import:${context.userId}:${page.finalUrl.toString()}`.slice(0, 200);
    let extraction;
    try {
      extraction = await callAiJson({
        system: SYSTEM,
        schema: jobExtractionSchema,
        user: [
          dataBlock("page_url", page.finalUrl.toString(), 600),
          dataBlock("page_hostname", page.finalUrl.hostname, 200),
          dataBlock("page_title", page.title, 300),
          dataBlock("page_text", page.text, 20_000),
        ].join("\n\n"),
      });
      await logAiRequest(context, "job_url_extraction", requestKey, "completed");
    } catch (error) {
      await logAiRequest(context, "job_url_extraction", requestKey, "failed");
      throw error;
    }

    const fields = [
      extraction.job_title,
      extraction.company,
      extraction.description,
      extraction.location,
      extraction.employment_type,
    ];
    const incomplete = fields.some((field) => field.status !== "extracted");

    let notice: string | null = null;
    if (extraction.page_type === "not_job_posting") notice = IMPORT_MESSAGES.notJob;
    else if (!extraction.job_title.value && !extraction.company.value) notice = IMPORT_MESSAGES.unreadable;
    else if (extraction.page_type === "uncertain" || incomplete) notice = IMPORT_MESSAGES.partial;

    return { ok: true, extraction, source, notice };
  });

/** Operational logging only — never surfaced in the UI. */
async function logAiRequest(
  context: { supabase: { from: (table: string) => any }; userId: string },
  type: string,
  key: string,
  status: "completed" | "failed",
): Promise<void> {
  try {
    await context.supabase.from("ai_requests").insert({
      user_id: context.userId,
      request_type: type,
      idempotency_key: `${key}:${Date.now()}`,
      status,
    });
  } catch {
    // Logging must never break the user-facing operation.
  }
}
