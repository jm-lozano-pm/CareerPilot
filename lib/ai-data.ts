import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserId } from "@/lib/profile-data";
import type { MatchBreakdown, MatchExplanation, OpportunityAnalysis, OpportunityContextRefs } from "@/lib/ai-shared";

export const aiKeys = {
  match: (jobId: string) => ["match-assessments", jobId] as const,
  opportunity: (jobId: string) => ["opportunity-insight", jobId] as const,
};

export type MatchAssessment = {
  id: string;
  jobId: string;
  cvId: string;
  jobContentVersion: number;
  cvContentVersion: number;
  score: number | null;
  breakdown: MatchBreakdown;
  explanation: MatchExplanation;
  createdAt: string;
};

const emptyBreakdown: MatchBreakdown = { score: null, scorable_count: 0, requirements: [] };

/** Latest assessment per CV for one job. */
export async function fetchMatchAssessments(jobId: string): Promise<MatchAssessment[]> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("cv_job_match_assessments")
    .select("id, job_id, cv_id, job_content_version, cv_content_version, score, breakdown, explanation, created_at")
    .eq("user_id", userId)
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const latest = new Map<string, MatchAssessment>();
  for (const row of data ?? []) {
    if (latest.has(row.cv_id)) continue;
    latest.set(row.cv_id, {
      id: row.id,
      jobId: row.job_id,
      cvId: row.cv_id,
      jobContentVersion: row.job_content_version,
      cvContentVersion: row.cv_content_version,
      score: row.score,
      breakdown: (row.breakdown as MatchBreakdown | null) ?? emptyBreakdown,
      explanation: (row.explanation as MatchExplanation | null) ?? {
        terminology_opportunities: [],
        uncertainties: [],
        cv_id: row.cv_id,
        cv_name: "",
        generated_at: row.created_at,
      },
      createdAt: row.created_at,
    });
  }
  return [...latest.values()];
}

export type OpportunityInsight = {
  id: string;
  content: OpportunityAnalysis;
  contextRefs: OpportunityContextRefs;
  generatedAt: string;
};

/** Latest opportunity analysis for one job. */
export async function fetchOpportunityInsight(jobId: string): Promise<OpportunityInsight | null> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("ai_insights")
    .select("id, content, context_refs, generated_at")
    .eq("user_id", userId)
    .eq("type", "opportunity")
    .order("generated_at", { ascending: false })
    .limit(30);
  if (error) throw error;

  const row = (data ?? []).find(
    (item) => (item.context_refs as { job_id?: string } | null)?.job_id === jobId,
  );
  if (!row) return null;
  return {
    id: row.id,
    content: row.content as OpportunityAnalysis,
    contextRefs: row.context_refs as OpportunityContextRefs,
    generatedAt: row.generated_at,
  };
}
