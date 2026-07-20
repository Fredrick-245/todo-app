"use client";

import { useRef, useState, useTransition } from "react";
import { createComment } from "@/actions/comments";
import { useTodoComments } from "@/hooks/use-todo-comments";
import { useTypingIndicator } from "@/hooks/use-typing-indicator";
import type { AppMember } from "@/lib/allowed-users";
import { getMemberLabel } from "@/lib/members";

type TodoCommentsProps = {
  todoId: string;
  enabled: boolean;
  members: AppMember[];
  currentUserId: string;
};

function formatCommentTime(createdAt: string): string {
  return new Date(createdAt).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function TodoComments({
  todoId,
  enabled,
  members,
  currentUserId,
}: TodoCommentsProps) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { comments, loading } = useTodoComments(todoId, enabled);

  const currentMember = members.find((member) => member.id === currentUserId);
  const currentUserName = currentMember
    ? getMemberLabel(currentMember.email)
    : "You";

  const { typingName, notifyTyping } = useTypingIndicator(
    todoId,
    enabled,
    currentUserId,
    currentUserName,
  );

  const getAuthorLabel = (authorId: string) => {
    const member = members.find((item) => item.id === authorId);
    return member ? getMemberLabel(member.email) : "Someone";
  };

  const handleChange = (value: string) => {
    setBody(value);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (value.trim()) {
      notifyTyping();
      typingTimeoutRef.current = setTimeout(() => {
        notifyTyping();
      }, 400);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const trimmed = body.trim();
    if (!trimmed) return;

    setError(null);
    startTransition(async () => {
      const result = await createComment(todoId, trimmed);

      if (result.error) {
        setError(result.error);
        return;
      }

      setBody("");
    });
  };

  return (
    <div
      className="mt-3 border-t border-black/[0.06] pt-3"
      onClick={(event) => event.stopPropagation()}
    >
      {loading ? (
        <p className="text-xs text-gray-400">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-gray-400">No comments yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {comments.map((comment) => (
            <li key={comment.id} className="rounded-xl bg-white/70 px-3 py-2">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-semibold text-gray-700">
                  {getAuthorLabel(comment.author_id)}
                </span>
                <span className="shrink-0 text-[11px] text-gray-400">
                  {formatCommentTime(comment.created_at)}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-gray-600">{comment.body}</p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="mt-3">
        <input
          type="text"
          value={body}
          placeholder="Add a comment..."
          maxLength={1000}
          disabled={isPending}
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-300 focus:outline-none disabled:opacity-50"
          onChange={(event) => handleChange(event.target.value)}
        />
        {typingName ? (
          <p className="mt-1.5 text-xs text-gray-400">
            {typingName} is typing...
          </p>
        ) : null}
        {error ? <p className="mt-1.5 text-xs text-red-500">{error}</p> : null}
      </form>
    </div>
  );
}
