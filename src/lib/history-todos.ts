import type { createClient } from "@/lib/supabase/client";
import type { ScoreHistoryRange } from "@/lib/dates";
import {
  formatLocalDateISO,
  getHistoryRangeISO,
  listHistoryDates,
} from "@/lib/dates";
import { getPriorityPoints } from "@/lib/scores";
import type { Todo } from "@/lib/types";

type SupabaseBrowserClient = ReturnType<typeof createClient>;

export type TodosByDay = {
  date: string;
  todos: Todo[];
  points: number;
};

export type HistoryDayPoints = {
  date: string;
  points: number;
  todoCount: number;
};

export function getTodoPoints(todo: Todo): number {
  return getPriorityPoints(todo.priority);
}

export function sumTodoPoints(todos: Todo[]): number {
  return todos.reduce((total, todo) => total + getTodoPoints(todo), 0);
}

export async function fetchTodosInRange(
  supabase: SupabaseBrowserClient,
  userId: string,
  rangeDays: ScoreHistoryRange,
): Promise<{ data: Todo[]; error: string | null }> {
  const { start, end } = getHistoryRangeISO(rangeDays);

  const { data, error } = await supabase
    .from("todos")
    .select("*")
    .eq("created_by", userId)
    .gte("created_at", start)
    .lt("created_at", end)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: (data ?? []) as Todo[], error: null };
}

export function groupTodosByDay(todos: Todo[]): TodosByDay[] {
  const groups = new Map<string, Todo[]>();

  for (const todo of todos) {
    const date = formatLocalDateISO(new Date(todo.created_at));
    const existing = groups.get(date) ?? [];
    existing.push(todo);
    groups.set(date, existing);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([date, dayTodos]) => ({
      date,
      todos: dayTodos,
      points: sumTodoPoints(dayTodos),
    }));
}

export function buildHistoryChartData(
  todos: Todo[],
  rangeDays: ScoreHistoryRange,
): HistoryDayPoints[] {
  const pointsByDate = new Map<string, { points: number; todoCount: number }>();

  for (const todo of todos) {
    const date = formatLocalDateISO(new Date(todo.created_at));
    const existing = pointsByDate.get(date) ?? { points: 0, todoCount: 0 };
    existing.points += getTodoPoints(todo);
    existing.todoCount += 1;
    pointsByDate.set(date, existing);
  }

  return listHistoryDates(rangeDays).map((date) => {
    const day = pointsByDate.get(date);
    return {
      date,
      points: day?.points ?? 0,
      todoCount: day?.todoCount ?? 0,
    };
  });
}
