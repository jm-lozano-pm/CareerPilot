import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserId } from "@/lib/profile-data";

/** Tables included in a personal data export. Operational logs are excluded. */
const EXPORT_TABLES = [
  "professional_profiles",
  "career_goals",
  "cvs",
  "jobs",
  "applications",
  "application_status_history",
  "application_outcomes",
  "cv_job_match_assessments",
  "ai_insights",
  "recommendations",
  "recommendation_feedback",
] as const;

export type ExportTable = (typeof EXPORT_TABLES)[number];

export type UserDataExport = {
  schema_version: number;
  exported_at: string;
  user_id: string;
  data: Record<ExportTable, unknown[]>;
};

export async function buildUserDataExport(): Promise<UserDataExport> {
  const userId = await getCurrentUserId();
  const data = {} as Record<ExportTable, unknown[]>;

  for (const table of EXPORT_TABLES) {
    const { data: rows, error } = await supabase.from(table).select("*").eq("user_id", userId);
    if (error) throw error;
    data[table] = rows ?? [];
  }

  return {
    schema_version: 1,
    exported_at: new Date().toISOString(),
    user_id: userId,
    data,
  };
}

export function downloadJson(payload: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
