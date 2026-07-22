"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { createTodo, updateTodo } from "@/actions/todos";
import { TodoForm } from "@/components/todo-form";
import type { Todo } from "@/lib/types";

type TodoFormModalProps = {
  open: boolean;
  mode: "add" | "edit";
  ownerId: string;
  todo?: Todo;
  onClose: () => void;
  onSuccess: () => void;
};

export function TodoFormModal({
  open,
  mode,
  ownerId,
  todo,
  onClose,
  onSuccess,
}: TodoFormModalProps) {
  const [mounted, setMounted] = useState(false);
  const title = mode === "add" ? "Add Todo" : "Edit Todo";

  const action = useMemo(() => {
    if (mode === "edit" && todo) {
      return updateTodo.bind(null, todo.id);
    }
    return createTodo;
  }, [mode, todo]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  const modal =
    open && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-end justify-center bg-black/25 p-2 sm:items-center sm:p-4"
            onClick={onClose}
          >
            <div
              className="flex h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/[0.05] sm:h-auto sm:max-h-[85dvh]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-3 py-3 sm:px-5 sm:py-4">
                <h2 className="text-base font-semibold text-gray-900 sm:text-lg">
                  {title}
                </h2>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={onClose}
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                >
                  <X className="h-5 w-5" strokeWidth={1.75} />
                </button>
              </div>

              <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 py-3 sm:px-5 sm:py-4">
                <TodoForm
                  key={mode === "edit" ? todo?.id : "add"}
                  todo={todo}
                  ownerId={ownerId}
                  action={action}
                  onSuccess={onSuccess}
                />
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return modal;
}
