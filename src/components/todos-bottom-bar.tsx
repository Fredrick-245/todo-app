"use client";

import { Plus } from "lucide-react";
import type { AppMember } from "@/lib/allowed-users";
import { getMemberLabel } from "@/lib/members";

type TodosBottomBarProps = {
  members: AppMember[];
  selectedMemberId: string;
  onMemberChange: (memberId: string) => void;
  onAddTodo: () => void;
};

export function TodosBottomBar({
  members,
  selectedMemberId,
  onMemberChange,
  onAddTodo,
}: TodosBottomBarProps) {
  return (
    <div className="flex w-full items-center gap-3">
      {members.length > 0 ? (
        <div
          className="flex min-w-0 flex-1 rounded-2xl bg-white p-1 shadow-lg shadow-black/5 ring-1 ring-black/[0.04]"
          role="tablist"
          aria-label="Choose whose todos to show"
        >
          {members.map((member) => {
            const isSelected = member.id === selectedMemberId;
            const label = getMemberLabel(member.email);

            return (
              <button
                key={member.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => onMemberChange(member.id)}
                className={`min-w-0 flex-1 truncate rounded-xl px-2 py-2.5 text-xs font-semibold transition sm:px-3 sm:py-3 sm:text-sm ${
                  isSelected
                    ? "bg-blue-500 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      ) : null}

      <button
        type="button"
        aria-label="Add todo"
        onClick={onAddTodo}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-500 text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-600 sm:h-14 sm:w-14"
      >
        <Plus className="h-5 w-5 sm:h-7 sm:w-7" strokeWidth={2.25} />
      </button>
    </div>
  );
}
