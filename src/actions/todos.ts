"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { TodoPriority } from "@/lib/types";

export type TodoFormState = {
  error?: string;
};

function parsePriority(value: FormDataEntryValue | null): TodoPriority | null {
  if (value === "low" || value === "medium" || value === "high") {
    return value;
  }
  return null;
}

async function validateOwnerId(ownerId: string): Promise<string | null> {
  if (!ownerId) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("app_members")
    .select("id")
    .eq("id", ownerId)
    .maybeSingle();

  return data?.id ?? null;
}

function todosPath(memberId: string) {
  return `/todos?member=${memberId}`;
}

async function assertTodoOwner(todoId: string): Promise<
  | { error: string }
  | { user: { id: string }; supabase: Awaited<ReturnType<typeof createClient>> }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const { data: todo, error: fetchError } = await supabase
    .from("todos")
    .select("created_by")
    .eq("id", todoId)
    .maybeSingle();

  if (fetchError) {
    return { error: fetchError.message };
  }

  if (!todo) {
    return { error: "Todo not found." };
  }

  if (todo.created_by !== user.id) {
    return { error: "You can only change your own todos." };
  }

  return { user, supabase };
}

async function removeStoredTodoImage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  path: string | null | undefined,
) {
  if (!path) return;

  await supabase.storage.from("todo-images").remove([path]);
}

export async function setTodoImagePath(
  todoId: string,
  memberId: string,
  path: string,
): Promise<{ error?: string }> {
  if (!path.startsWith(`${todoId}/`)) {
    return { error: "Invalid image path." };
  }

  const ownership = await assertTodoOwner(todoId);
  if ("error" in ownership) {
    return { error: ownership.error };
  }

  const { supabase } = ownership;

  const { data: todo, error: fetchError } = await supabase
    .from("todos")
    .select("image_path")
    .eq("id", todoId)
    .maybeSingle();

  if (fetchError) {
    return { error: fetchError.message };
  }

  if (!todo) {
    return { error: "Todo not found." };
  }

  if (todo.image_path && todo.image_path !== path) {
    await removeStoredTodoImage(supabase, todo.image_path);
  }

  const { error: updateError } = await supabase
    .from("todos")
    .update({ image_path: path })
    .eq("id", todoId);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath("/todos");
  revalidatePath(todosPath(memberId));

  return {};
}

export async function createTodo(
  _prev: TodoFormState,
  formData: FormData,
): Promise<TodoFormState> {
  const title = String(formData.get("title") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  const priority = parsePriority(formData.get("priority"));
  const ownerId = String(formData.get("ownerId") ?? "");

  if (!title) {
    return { error: "To-do text is required." };
  }
  if (!label) {
    return { error: "Please select a label." };
  }

  const validOwnerId = await validateOwnerId(ownerId);
  if (!validOwnerId) {
    return { error: "Please choose a valid member." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  if (validOwnerId !== user.id) {
    return { error: "You can only add your own todos." };
  }

  const { error } = await supabase.from("todos").insert({
    title,
    label,
    priority,
    created_by: validOwnerId,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/todos");
  redirect(todosPath(validOwnerId));
}

export async function updateTodo(
  id: string,
  _prev: TodoFormState,
  formData: FormData,
): Promise<TodoFormState> {
  const title = String(formData.get("title") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  const priority = parsePriority(formData.get("priority"));
  const ownerId = String(formData.get("ownerId") ?? "");

  if (!title) {
    return { error: "To-do text is required." };
  }
  if (!label) {
    return { error: "Please select a label." };
  }

  const validOwnerId = await validateOwnerId(ownerId);
  if (!validOwnerId) {
    return { error: "Please choose a valid member." };
  }

  const ownership = await assertTodoOwner(id);
  if ("error" in ownership) {
    return { error: ownership.error };
  }

  const { supabase } = ownership;
  const { error } = await supabase
    .from("todos")
    .update({ title, label, priority })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/todos");
  redirect(todosPath(validOwnerId));
}

export async function toggleTodo(
  id: string,
  completed: boolean,
  memberId: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in.");
  }

  const { data: todo, error: fetchError } = await supabase
    .from("todos")
    .select("created_by")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  if (!todo) {
    throw new Error("Todo not found.");
  }

  if (todo.created_by === user.id) {
    throw new Error("Only your friend can mark your todos as done.");
  }

  const { error } = await supabase
    .from("todos")
    .update({
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/todos");
  revalidatePath(todosPath(memberId));
}

export async function deleteTodo(id: string, memberId: string) {
  const ownership = await assertTodoOwner(id);
  if ("error" in ownership) {
    throw new Error(ownership.error);
  }

  const { supabase } = ownership;

  const { data: todo, error: fetchError } = await supabase
    .from("todos")
    .select("image_path")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  if (todo?.image_path) {
    await removeStoredTodoImage(supabase, todo.image_path);
  }

  const { error } = await supabase.from("todos").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/todos");
  revalidatePath(todosPath(memberId));
}
