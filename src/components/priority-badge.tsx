import { PRIORITY_STYLES } from "@/lib/constants";
import type { TodoPriority } from "@/lib/types";

export function PriorityBadge({ priority }: { priority: TodoPriority | null }) {
  if (!priority) return null;

  const style = PRIORITY_STYLES[priority];

  return (
    <span
      className={`inline-flex w-fit rounded-md border px-2 py-0.5 text-xs font-medium ${style.className}`}
    >
      {style.label}
    </span>
  );
}
