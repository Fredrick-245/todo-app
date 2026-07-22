"use server";

import { createClient } from "@/lib/supabase/server";
import type { TodoComment } from "@/lib/types";

export type CommentFormState = {
  error?: string;
  comment?: TodoComment;
};

export async function createComment(
  todoId: string,
  body: string,
): Promise<CommentFormState> {
  const trimmed = body.trim();

  if (!trimmed) {
    return { error: "Comment cannot be empty." };
  }

  if (trimmed.length > 1000) {
    return { error: "Comment must be 1000 characters or fewer." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const { data: todo, error: todoError } = await supabase
    .from("todos")
    .select("id, image_path")
    .eq("id", todoId)
    .maybeSingle();

  if (todoError || !todo) {
    return { error: "Todo not found." };
  }

  if (!todo.image_path) {
    return { error: "Comments are only available on todos with images." };
  }

  const { data: comment, error } = await supabase
    .from("todo_comments")
    .insert({
      todo_id: todoId,
      author_id: user.id,
      body: trimmed,
    })
    .select("*")
    .single();

  if (error) {
    return { error: error.message };
  }

  return { comment };
}

export async function markCommentsRead(todoId: string): Promise<CommentFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const { error } = await supabase.from("todo_comment_reads").upsert(
    {
      user_id: user.id,
      todo_id: todoId,
      last_read_at: new Date().toISOString(),
    },
    { onConflict: "user_id,todo_id" },
  );

  if (error) {
    return { error: error.message };
  }

  return {};
}
