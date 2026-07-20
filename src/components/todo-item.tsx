"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { Camera, ChevronDown, CircleX } from "lucide-react";
import { deleteTodo, setTodoImagePath, toggleTodo } from "@/actions/todos";
import { useRefreshTodos } from "@/components/todos-cache-context";
import { PriorityBadge } from "@/components/priority-badge";
import { getTodoCardBackground } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { buildTodoImagePath, getTodoImagePublicUrl } from "@/lib/storage";
import type { Todo } from "@/lib/types";

type TodoItemProps = {
  todo: Todo;
  memberId: string;
  currentUserId: string;
};

export function TodoItem({ todo, memberId, currentUserId }: TodoItemProps) {
  const refreshTodos = useRefreshTodos();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const isOwnTodo = todo.created_by === currentUserId;
  const canToggleCompletion = !isOwnTodo;
  const canManageTodo = isOwnTodo;
  const imageUrl = getTodoImagePublicUrl(todo.image_path);
  const hasImage = Boolean(imageUrl);

  const handleContentClick = () => {
    if (hasImage) {
      setExpanded((value) => !value);
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!canManageTodo) return;

    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("File must be an image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be smaller than 5MB.");
      return;
    }

    setUploadError(null);
    startTransition(async () => {
      const supabase = createClient();
      const path = buildTodoImagePath(todo.id, file);

      const { error: uploadError } = await supabase.storage
        .from("todo-images")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || "image/jpeg",
        });

      if (uploadError) {
        setUploadError(uploadError.message);
        return;
      }

      const result = await setTodoImagePath(todo.id, memberId, path);

      if (result.error) {
        await supabase.storage.from("todo-images").remove([path]);
        setUploadError(result.error);
        return;
      }

      setExpanded(true);
      refreshTodos?.(memberId);
    });
  };

  const content = (
    <>
      <div className="flex items-start gap-2">
        <h2
          className={`min-w-0 flex-1 truncate text-[15px] font-semibold leading-snug ${
            todo.completed ? "text-gray-400" : "text-gray-900"
          }`}
        >
          {todo.title}
        </h2>
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
        className={`mt-0.5 text-sm ${
          todo.completed ? "text-gray-300" : "text-gray-400"
        }`}
      >
        {todo.label}
      </p>
      <div className="mt-2">
        <PriorityBadge priority={todo.priority} />
      </div>
      {expanded && imageUrl ? (
        <div className="mt-3 overflow-hidden rounded-xl ring-1 ring-black/[0.04]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={`Attachment for ${todo.title}`}
            className="max-h-72 w-full object-cover"
          />
        </div>
      ) : null}
      {canManageTodo && hasImage && expanded ? (
        <Link
          href={`/todos/${todo.id}/edit?member=${memberId}`}
          className="mt-3 inline-block text-xs font-medium text-blue-500"
          onClick={(event) => event.stopPropagation()}
        >
          Edit
        </Link>
      ) : null}
      {uploadError ? (
        <p className="mt-2 text-xs text-red-500">{uploadError}</p>
      ) : null}
    </>
  );

  const contentNode =
    hasImage ? (
      <button
        type="button"
        className="min-w-0 flex-1 text-left"
        onClick={handleContentClick}
        aria-expanded={expanded}
      >
        {content}
      </button>
    ) : canManageTodo ? (
      <Link href={`/todos/${todo.id}/edit?member=${memberId}`} className="min-w-0 flex-1">
        {content}
      </Link>
    ) : (
      <div className="min-w-0 flex-1">{content}</div>
    );

  return (
    <article
      className={`rounded-2xl p-4 shadow-sm ring-1 ring-black/[0.03] transition-opacity ${getTodoCardBackground(todo.completed, hasImage)} ${
        isPending ? "opacity-60" : "opacity-100"
      }`}
    >
      <div className="flex items-start gap-3">
        {canManageTodo ? (
          <button
            type="button"
            aria-label={`Delete ${todo.title}`}
            className="mt-0.5 shrink-0 text-gray-300 transition-colors hover:text-gray-500"
            onClick={() => {
            startTransition(async () => {
              await deleteTodo(todo.id, memberId);
              refreshTodos?.(memberId);
            });
            }}
          >
            <CircleX className="h-5 w-5" strokeWidth={1.75} />
          </button>
        ) : null}

        {contentNode}

        <div className="flex shrink-0 flex-col items-center gap-2">
          {canToggleCompletion ? (
            <button
              type="button"
              aria-label={todo.completed ? "Mark incomplete" : "Mark complete"}
              className={`flex h-6 w-6 items-center justify-center rounded-[6px] border-2 transition-colors ${
                todo.completed
                  ? "border-blue-500 bg-blue-500 text-white"
                  : "border-gray-200 bg-white hover:border-blue-300"
              }`}
              onClick={() => {
                startTransition(async () => {
                  await toggleTodo(todo.id, !todo.completed, memberId);
                  refreshTodos?.(memberId);
                });
              }}
            >
              {todo.completed ? (
                <svg
                  viewBox="0 0 16 16"
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path
                    d="M3.5 8.5l3 3 6-6.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : null}
            </button>
          ) : null}

          {canManageTodo ? (
            <>
              <button
                type="button"
                aria-label={hasImage ? "Replace image" : "Add image"}
                title={hasImage ? "Replace image" : "Add image"}
                disabled={isPending}
                className="flex h-6 w-6 items-center justify-center rounded-[6px] border-2 border-gray-200 bg-white text-gray-400 transition-colors hover:border-blue-300 hover:text-blue-500 disabled:opacity-50"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-3.5 w-3.5" strokeWidth={2} />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleImageSelect}
              />
            </>
          ) : null}
        </div>
      </div>
    </article>
  );
}
