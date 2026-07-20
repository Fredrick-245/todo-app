"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import type { AppMember } from "@/lib/allowed-users";
import { getMemberLabel } from "@/lib/members";

type TodosBottomBarProps = {
  members: AppMember[];
  selectedMemberId: string;
};

export function TodosBottomBar({
  members,
  selectedMemberId,
}: TodosBottomBarProps) {
  const router = useRouter();

  return (
    <div className="fixed bottom-6 left-1/2 z-10 flex w-[calc(100%-2.5rem)] max-w-lg -translate-x-1/2 items-center gap-3">
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
                onClick={() => router.push(`/todos?member=${member.id}`)}
                className={`min-w-0 flex-1 truncate rounded-xl px-3 py-3 text-sm font-semibold transition ${
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

      <Link
        href={`/todos/new?member=${selectedMemberId}`}
        aria-label="Add todo"
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-500 text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-600"
      >
        <Plus className="h-7 w-7" strokeWidth={2.25} />
      </Link>
    </div>
  );
}
