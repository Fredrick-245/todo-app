"use client";

import { useEffect, useState } from "react";
import { Timer, X } from "lucide-react";
import { PriorityBadge } from "@/components/priority-badge";
import { createClient } from "@/lib/supabase/client";
import { fetchDailyScoresWithItems, type DailyScoreWithItems } from "@/lib/scores";

type ScoreHistoryButtonProps = {
  userId: string;
};

function formatScoreDate(date: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

export function ScoreHistoryButton({ userId }: ScoreHistoryButtonProps) {
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [scores, setScores] = useState<DailyScoreWithItems[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function loadScores() {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      const { data, error: fetchError } = await fetchDailyScoresWithItems(
        supabase,
        userId,
      );

      if (cancelled) return;

      if (fetchError) {
        setError(fetchError);
        setScores([]);
      } else {
        setScores(data);
      }

      setLoading(false);
    }

    void loadScores();

    return () => {
      cancelled = true;
    };
  }, [open, userId]);

  return (
    <>
      <button
        type="button"
        aria-label="Daily scores"
        onClick={() => setOpen(true)}
        className="rounded-full p-2 text-gray-400 transition-colors hover:bg-white hover:text-gray-600"
      >
        <Timer className="h-5 w-5" strokeWidth={1.75} />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/20 p-4 sm:items-center">
          <div className="flex max-h-[85dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/[0.05]">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Daily scores
                </h2>
                <p className="text-sm text-gray-400">
                  Low 3 · Medium 5 · High 8 points
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => {
                  setOpen(false);
                  setExpandedId(null);
                }}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
              >
                <X className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {loading ? (
                <p className="text-sm text-gray-400">Loading scores...</p>
              ) : error ? (
                <p className="text-sm text-red-500">{error}</p>
              ) : scores.length === 0 ? (
                <p className="text-sm text-gray-400">
                  No daily scores yet. Completed todos are scored each night.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {scores.map((score) => {
                    const expanded = expandedId === score.id;

                    return (
                      <div
                        key={score.id}
                        className="overflow-hidden rounded-2xl ring-1 ring-black/[0.04]"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedId(expanded ? null : score.id)
                          }
                          className="flex w-full items-center justify-between bg-slate-50 px-4 py-4 text-left transition hover:bg-slate-100"
                        >
                          <div>
                            <p className="font-semibold text-gray-900">
                              {formatScoreDate(score.score_date)}
                            </p>
                            <p className="mt-0.5 text-sm text-gray-500">
                              {score.tasks_completed} task
                              {score.tasks_completed === 1 ? "" : "s"} completed
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-blue-500">
                              {score.total_points}
                            </p>
                            <p className="text-xs text-gray-400">points</p>
                          </div>
                        </button>

                        {expanded ? (
                          <div className="space-y-2 border-t border-gray-100 bg-white px-4 py-3">
                            {score.daily_score_items.length === 0 ? (
                              <p className="text-sm text-gray-400">
                                No completed tasks recorded for this day.
                              </p>
                            ) : (
                              score.daily_score_items.map((item) => (
                                <div
                                  key={item.id}
                                  className="rounded-xl bg-slate-50 px-3 py-3"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-semibold text-gray-900">
                                        {item.title}
                                      </p>
                                      <p className="mt-0.5 text-xs text-gray-400">
                                        {item.label}
                                      </p>
                                      <div className="mt-2">
                                        <PriorityBadge priority={item.priority} />
                                      </div>
                                    </div>
                                    <p className="shrink-0 text-sm font-semibold text-blue-500">
                                      +{item.points}
                                    </p>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
