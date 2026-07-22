"use client";

import { ChatButton } from "@/components/chat-button";
import { ScoreHistoryButton } from "@/components/score-history-button";
import { SignOutButton } from "@/components/sign-out-button";

type TodosHeaderActionsProps = {
  memberId: string;
  currentUserId: string;
  isOtherOnline: boolean;
  otherMemberLabel: string;
};

export function TodosHeaderActions({
  memberId,
  currentUserId,
  isOtherOnline,
  otherMemberLabel,
}: TodosHeaderActionsProps) {
  return (
    <div className="flex items-center gap-1">
      <ChatButton
        currentUserId={currentUserId}
        isOtherOnline={isOtherOnline}
        otherMemberLabel={otherMemberLabel}
      />
      <ScoreHistoryButton
        memberId={memberId}
        currentUserId={currentUserId}
      />
      <SignOutButton />
    </div>
  );
}
