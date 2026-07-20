"use client";

import { ScoreHistoryButton } from "@/components/score-history-button";
import { SignOutButton } from "@/components/sign-out-button";

export function TodosHeaderActions({ userId }: { userId: string }) {
  return (
    <div className="flex items-center gap-1">
      <ScoreHistoryButton userId={userId} />
      <SignOutButton />
    </div>
  );
}
