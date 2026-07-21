"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Timer, X } from "lucide-react";
import { HistoryPointsChart } from "@/components/history-points-chart";
import { HistoryTodoItem } from "@/components/history-todo-item";
import { createClient } from "@/lib/supabase/client";
import type { ScoreHistoryRange } from "@/lib/dates";
import {
  buildHistoryChartData,
  fetchTodosInRange,
  groupTodosByDay,
  sumTodoPoints,
  type TodosByDay,
} from "@/lib/history-todos";
import type { Todo } from "@/lib/types";

type ScoreHistoryButtonProps = {
  memberId: string;
  currentUserId: string;
};

const RANGE_OPTIONS: { label: string; value: ScoreHistoryRange }[] = [
  { label: "1D", value: 1 },
  { label: "7D", value: 7 },
  { label: "30D", value: 30 },
];

function formatHistoryDate(date: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

export function ScoreHistoryButton({
  memberId,
  currentUserId,
}: ScoreHistoryButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [range, setRange] = useState<ScoreHistoryRange>(7);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function loadTodos() {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      const { data, error: fetchError } = await fetchTodosInRange(
        supabase,
        memberId,
        range,
      );

      if (cancelled) return;

      if (fetchError) {
        setError(fetchError);
        setTodos([]);
      } else {
        setTodos(data);
      }

      setLoading(false);
    }

    void loadTodos();

    return () => {
      cancelled = true;
    };
  }, [open, memberId, range]);

  const days: TodosByDay[] = useMemo(() => groupTodosByDay(todos), [todos]);
  const totalPoints = useMemo(() => sumTodoPoints(todos), [todos]);
  const chartData = useMemo(
    () => buildHistoryChartData(todos, range),
    [todos, range],
  );
  const rangeLabel =
    RANGE_OPTIONS.find((option) => option.value === range)?.label ?? `${range}D`;

  const handleDeleted = (todoId: string) => {
    setTodos((current) => current.filter((todo) => todo.id !== todoId));
    router.refresh();
  };

  const modal =
    open && mounted
      ? createPortal(
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/25 p-2 sm:items-center sm:p-4">
            <div className="flex h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/[0.05] sm:h-auto sm:max-h-[85dvh]">
              <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-3 py-3 sm:px-5 sm:py-4">
                <div className="min-w-0 pr-2">
                  <h2 className="text-base font-semibold text-gray-900 sm:text-lg">
                    Previous todos
                  </h2>
                  <p className="text-[11px] text-gray-400 sm:text-sm">
                    Points · Low 3 · Medium 5 · High 8
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setOpen(false)}
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                >
                  <X className="h-5 w-5" strokeWidth={1.75} />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-5 sm:py-4">
                <div className="flex flex-col gap-3 sm:gap-4">
                  <div className="flex rounded-xl bg-slate-100 p-1">
                    {RANGE_OPTIONS.map((option) => {
                      const active = range === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setRange(option.value)}
                          className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition sm:px-3 sm:text-sm ${
                            active
                              ? "bg-white text-gray-900 shadow-sm"
                              : "text-gray-500 hover:text-gray-700"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>

                  {loading ? (
                    <p className="text-xs text-gray-400 sm:text-sm">
                      Loading todos...
                    </p>
                  ) : error ? (
                    <p className="text-xs text-red-500 sm:text-sm">{error}</p>
                  ) : (
                    <>
                      <HistoryPointsChart
                        data={chartData}
                        totalPoints={totalPoints}
                        rangeLabel={rangeLabel}
                      />

                      {days.length === 0 ? (
                        <p className="text-xs text-gray-400 sm:text-sm">
                          {range === 1
                            ? "No todos from yesterday."
                            : `No todos in the last ${range} days.`}
                        </p>
                      ) : (
                        days.map((day) => (
                          <section
                            key={day.date}
                            className="flex flex-col gap-2.5 sm:gap-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="text-xs font-semibold text-gray-500 sm:text-sm">
                                {formatHistoryDate(day.date)}
                                <span className="ml-1.5 font-normal text-gray-400 sm:ml-2">
                                  {day.todos.length} todo
                                  {day.todos.length === 1 ? "" : "s"}
                                </span>
                              </h3>
                              <p className="text-xs font-semibold text-blue-500 sm:text-sm">
                                {day.points} pts
                              </p>
                            </div>
                            {day.todos.map((todo) => (
                              <HistoryTodoItem
                                key={todo.id}
                                todo={todo}
                                memberId={memberId}
                                currentUserId={currentUserId}
                                onDeleted={handleDeleted}
                              />
                            ))}
                          </section>
                        ))
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        aria-label="Todo history"
        onClick={() => {
          setLoading(true);
          setOpen(true);
        }}
        className="relative z-10 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-white hover:text-gray-600 sm:p-2"
      >
        <Timer className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.75} />
      </button>
      {modal}
    </>
  );
}
