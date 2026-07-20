"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PrioritySlider } from "@/components/priority-slider";
import { TODO_LABELS } from "@/lib/constants";
import type { Todo, TodoPriority } from "@/lib/types";
import type { TodoFormState } from "@/actions/todos";

type TodoFormProps = {
  todo?: Todo;
  ownerId: string;
  cancelHref: string;
  action: (
    prev: TodoFormState,
    formData: FormData,
  ) => Promise<TodoFormState>;
  title: string;
};

export function TodoForm({
  todo,
  ownerId,
  cancelHref,
  action,
  title,
}: TodoFormProps) {
  const [state, formAction, isPending] = useActionState(action, {});
  const [priority, setPriority] = useState<TodoPriority>(
    todo?.priority ?? "low",
  );
  const [label, setLabel] = useState(todo?.label ?? "");

  return (
    <AppShell>
      <div className="flex h-full w-full flex-col overflow-hidden bg-white">
        <form
          action={formAction}
          className="flex h-full w-full flex-col overflow-hidden px-5 pb-6 pt-8"
        >
      <div className="mb-8 flex items-start justify-between">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          {title}
        </h1>
        <Link
          href={cancelHref}
          aria-label="Close"
          className="mt-1 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
        >
          <X className="h-6 w-6" strokeWidth={1.75} />
        </Link>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
        <label className="block">
          <span className="mb-2 block text-sm text-gray-500">To-do</span>
          <input
            name="title"
            type="text"
            required
            defaultValue={todo?.title ?? ""}
            placeholder="What needs to be done?"
            className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-3 text-[15px] text-gray-900 outline-none transition placeholder:text-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm text-gray-500">Label</span>
          <div className="relative">
            <select
              name="label"
              required
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3.5 py-3 text-[15px] text-gray-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="" disabled>
                Select Label
              </option>
              {TODO_LABELS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
              <svg
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          </div>
        </label>

        <div>
          <span className="mb-3 block text-sm text-gray-500">Priority</span>
          <PrioritySlider value={priority} onChange={setPriority} />
        </div>

        {state.error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {state.error}
          </p>
        ) : null}
      </div>

      <input type="hidden" name="ownerId" value={ownerId} />

      <button
        type="submit"
        disabled={isPending}
        className="mt-8 w-full rounded-2xl bg-blue-500 py-3.5 text-base font-semibold text-white transition hover:bg-blue-600 disabled:opacity-60"
      >
        {isPending ? "Saving..." : "Done"}
      </button>
        </form>
      </div>
    </AppShell>
  );
}
