"use client";

import { ChatButton } from "@/components/chat-button";
import { ScoreHistoryButton } from "@/components/score-history-button";
import { SignOutButton } from "@/components/sign-out-button";
import type { AppMember } from "@/lib/allowed-users";

type TodosHeaderActionsProps = {
  members: AppMember[];
  memberId: string;
  currentUserId: string;
};

export function TodosHeaderActions({
  members,
  memberId,
  currentUserId,
}: TodosHeaderActionsProps) {
  return (
    <div className="flex items-center gap-1">
      <ChatButton members={members} currentUserId={currentUserId} />
      <ScoreHistoryButton
        memberId={memberId}
        currentUserId={currentUserId}
      />
      <SignOutButton />
    </div>
  );
}
