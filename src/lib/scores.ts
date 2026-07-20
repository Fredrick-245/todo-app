import type { TodoPriority } from "./types";

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
