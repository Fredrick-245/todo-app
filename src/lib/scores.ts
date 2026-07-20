import type { createClient } from "@/lib/supabase/client";
import type { ScoreHistoryRange } from "./dates";
import { getScoreRangeStartDate } from "./dates";
import type { TodoPriority } from "./types";

type SupabaseBrowserClient = ReturnType<typeof createClient>;

export const PRIORITY_POINTS: Record<TodoPriority, number> = {
  low: 3,
  medium: 5,
  high: 8,
};

export function getPriorityPoints(priority: TodoPriority | null): number {
  if (!priority) return PRIORITY_POINTS.low;
  return PRIORITY_POINTS[priority];
}

export type DailyScore = {
  id: string;
  user_id: string;
  score_date: string;
  total_points: number;
  tasks_completed: number;
  created_at: string;
};

export type DailyScoreItem = {
  id: string;
  daily_score_id: string;
  title: string;
  label: string;
  priority: TodoPriority | null;
  points: number;
  todo_id: string | null;
};

export type DailyScoreWithItems = DailyScore & {
  daily_score_items: DailyScoreItem[];
};

export async function fetchDailyScoresWithItems(
  supabase: SupabaseBrowserClient,
  userId: string,
  rangeDays: ScoreHistoryRange = 7,
): Promise<{ data: DailyScoreWithItems[]; error: string | null }> {
  const startDate = getScoreRangeStartDate(rangeDays);
  const { data: scores, error: scoresError } = await supabase
    .from("daily_scores")
    .select("*")
    .eq("user_id", userId)
    .gte("score_date", startDate)
    .order("score_date", { ascending: false });

  if (scoresError) {
    return { data: [], error: scoresError.message };
  }

  const scoreRows = (scores ?? []) as DailyScore[];

  if (scoreRows.length === 0) {
    return { data: [], error: null };
  }

  const scoreIds = scoreRows.map((score) => score.id);
  const { data: items, error: itemsError } = await supabase
    .from("daily_score_items")
    .select("*")
    .in("daily_score_id", scoreIds);

  if (itemsError) {
    return { data: [], error: itemsError.message };
  }

  const itemsByScore = new Map<string, DailyScoreItem[]>();

  for (const item of (items ?? []) as DailyScoreItem[]) {
    const existing = itemsByScore.get(item.daily_score_id) ?? [];
    existing.push(item);
    itemsByScore.set(item.daily_score_id, existing);
  }

  return {
    data: scoreRows.map((score) => ({
      ...score,
      daily_score_items: itemsByScore.get(score.id) ?? [],
    })),
    error: null,
  };
}
