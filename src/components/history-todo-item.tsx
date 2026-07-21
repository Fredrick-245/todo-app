"use client";

import { useState, useTransition } from "react";
import { ChevronDown, CircleX } from "lucide-react";
import { deleteTodo } from "@/actions/todos";
import { PriorityBadge } from "@/components/priority-badge";
import { getTodoCardBackground } from "@/lib/constants";
import { getTodoPoints } from "@/lib/history-todos";
import { getTodoImagePublicUrl } from "@/lib/storage";
import type { Todo } from "@/lib/types";

type HistoryTodoItemProps = {
  todo: Todo;
  memberId: string;
  currentUserId: string;
  onDeleted: (todoId: string) => void;
};

export function HistoryTodoItem({
  todo,
  memberId,
  currentUserId,
  onDeleted,
}: HistoryTodoItemProps) {
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imageUrl = getTodoImagePublicUrl(todo.image_path);
  const hasImage = Boolean(imageUrl);
  const points = getTodoPoints(todo);
  const canDelete = todo.created_by === currentUserId;

  const summary = (
    <>
      <div className="flex items-start gap-2">
        <h2
          className={`min-w-0 flex-1 truncate text-[13px] font-semibold leading-snug sm:text-[15px] ${
            todo.completed ? "text-gray-400" : "text-gray-900"
          }`}
        >
          {todo.title}
        </h2>
        <span className="shrink-0 text-xs font-semibold text-blue-500 sm:text-sm">
          +{points}
        </span>
        {hasImage ? (
          <ChevronDown
            className={`mt-0.5 h-4 w-4 shrink-0 text-gray-300 transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
            strokeWidth={2}
          />
        ) : null}
      </div>
      <p
        className={`mt-0.5 text-xs sm:text-sm ${
          todo.completed ? "text-gray-300" : "text-gray-400"
        }`}
      >
        {todo.label}
      </p>
      <div className="mt-2">
        <PriorityBadge priority={todo.priority} />
      </div>
    </>
  );

  return (
    <article
      className={`rounded-2xl p-3 shadow-sm ring-1 ring-black/[0.03] transition-opacity sm:p-4 ${getTodoCardBackground(todo.completed, hasImage)} ${
        isPending ? "opacity-60" : "opacity-100"
      }`}
    >
      <div className="flex items-start gap-3">
        {canDelete ? (
          <button
            type="button"
            aria-label={`Delete ${todo.title}`}
            disabled={isPending}
            className="mt-0.5 shrink-0 text-gray-300 transition-colors hover:text-gray-500 disabled:opacity-50"
            onClick={() => {
              setError(null);
              startTransition(async () => {
                try {
                  await deleteTodo(todo.id, memberId);
                  onDeleted(todo.id);
                } catch (err) {
                  setError(
                    err instanceof Error
                      ? err.message
                      : "Could not delete todo.",
                  );
                }
              });
            }}
          >
            <CircleX className="h-5 w-5" strokeWidth={1.75} />
          </button>
        ) : null}

        {hasImage ? (
          <div
            role="button"
            tabIndex={0}
            className="min-w-0 flex-1 cursor-pointer text-left"
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
            onMouseDown={(event) => event.preventDefault()}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                setExpanded((value) => !value);
              }
              if (event.key === " " || event.key === "Spacebar") {
                event.preventDefault();
              }
            }}
          >
            {summary}
          </div>
        ) : (
          <div className="min-w-0 flex-1">{summary}</div>
        )}
      </div>

      {expanded && imageUrl ? (
        <div className="mt-3 overflow-hidden rounded-xl ring-1 ring-black/[0.04]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={`Attachment for ${todo.title}`}
            className="max-h-48 w-full object-cover"
          />
        </div>
      ) : null}
      {error ? <p className="mt-2 text-xs text-red-500">{error}</p> : null}
    </article>
  );
}
