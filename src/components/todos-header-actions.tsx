"use client";

import { ScoreHistoryButton } from "@/components/score-history-button";
import { SignOutButton } from "@/components/sign-out-button";

type TodosHeaderActionsProps = {
  memberId: string;
  currentUserId: string;
};

export function TodosHeaderActions({
  memberId,
  currentUserId,
}: TodosHeaderActionsProps) {
  return (
    <div className="flex items-center gap-1">
      <ScoreHistoryButton
        memberId={memberId}
        currentUserId={currentUserId}
      />
      <SignOutButton />
    </div>
  );
}
