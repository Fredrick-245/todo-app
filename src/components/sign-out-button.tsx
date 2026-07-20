"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { signOut } from "@/actions/auth";

export function SignOutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-label="Sign out"
      disabled={isPending}
      onClick={() => startTransition(() => signOut())}
      className="rounded-full p-2 text-gray-400 transition-colors hover:bg-white hover:text-gray-600 disabled:opacity-50"
    >
      <LogOut className="h-5 w-5" strokeWidth={1.75} />
    </button>
  );
}
