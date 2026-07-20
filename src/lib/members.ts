import type { AppMember } from "@/lib/allowed-users";

export function getMemberLabel(email: string): string {
  const local = email.split("@")[0] ?? email;
  return local.charAt(0).toUpperCase() + local.slice(1);
}

export function resolveSelectedMemberId(
  members: AppMember[],
  memberParam: string | undefined,
  currentUserId: string | undefined,
): string | null {
  if (members.length === 0) return null;

  if (memberParam && members.some((member) => member.id === memberParam)) {
    return memberParam;
  }

  if (currentUserId && members.some((member) => member.id === currentUserId)) {
    return currentUserId;
  }

  return members[0]?.id ?? null;
}
