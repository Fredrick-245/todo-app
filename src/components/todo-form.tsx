"use client";

import { useActionState, useEffect, useState } from "react";
import { PrioritySlider } from "@/components/priority-slider";
import { TODO_LABELS } from "@/lib/constants";
import type { Todo, TodoPriority } from "@/lib/types";
import type { TodoFormState } from "@/actions/todos";

type TodoFormProps = {
  todo?: Todo;
  ownerId: string;
  onSuccess?: () => void;
  action: (
    prev: TodoFormState,
    formData: FormData,
  ) => Promise<TodoFormState>;
};

export function TodoForm({
  todo,
  ownerId,
  onSuccess,
  action,
}: TodoFormProps) {
  const [state, formAction, isPending] = useActionState(action, {});
  const [priority, setPriority] = useState<TodoPriority>(
    todo?.priority ?? "low",
  );
  const [label, setLabel] = useState(todo?.label ?? "");

  useEffect(() => {
    if (state.success) {
      onSuccess?.();
    }
  }, [state.success, onSuccess]);

  return (
    <form action={formAction} className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain sm:gap-6">
        <label className="block">
          <span className="mb-2 block text-sm text-gray-500">To-do</span>
          <input
            name="title"
            type="text"
            required
            defaultValue={todo?.title ?? ""}
            placeholder="What needs to be done?"
            className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-3 text-base text-gray-900 outline-none transition placeholder:text-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 sm:text-[15px]"
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
              className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3.5 py-3 text-base text-gray-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 sm:text-[15px]"
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
        className="mt-6 w-full shrink-0 rounded-2xl bg-blue-500 py-3.5 text-base font-semibold text-white transition hover:bg-blue-600 disabled:opacity-60 sm:mt-8"
      >
        {isPending ? "Saving..." : "Done"}
      </button>
    </form>
  );
}
