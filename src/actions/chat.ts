"use server";

import { createClient } from "@/lib/supabase/server";
import type { ChatMessage } from "@/lib/types";

export type ChatFormState = {
  error?: string;
  message?: ChatMessage;
};

export async function sendChatMessage(body: string): Promise<ChatFormState> {
  const trimmed = body.trim();

  if (!trimmed) {
    return { error: "Message cannot be empty." };
  }

  if (trimmed.length > 2000) {
    return { error: "Message must be 2000 characters or fewer." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const { data: member } = await supabase
    .from("app_members")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!member) {
    return { error: "You are not allowed to chat." };
  }

  const { data: message, error } = await supabase
    .from("chat_messages")
    .insert({
      sender_id: user.id,
      body: trimmed,
    })
    .select("*")
    .single();

  if (error) {
    return { error: error.message };
  }

  return { message: message as ChatMessage };
}

export async function markChatRead(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const { error } = await supabase.from("chat_reads").upsert(
    {
      user_id: user.id,
      last_read_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    return { error: error.message };
  }

  return {};
}
