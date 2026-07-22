"use client";

type MemberPresenceLabelProps = {
  isOnline: boolean;
  statusLabel: string | null;
};

export function MemberPresenceLabel({
  isOnline,
  statusLabel,
}: MemberPresenceLabelProps) {
  if (!statusLabel) return null;

  return (
    <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-gray-500 sm:text-base">
      {isOnline ? (
        <span className="h-2 w-2 shrink-0 rounded-full bg-green-500" aria-hidden />
      ) : null}
      <span>{statusLabel}</span>
    </p>
  );
}
