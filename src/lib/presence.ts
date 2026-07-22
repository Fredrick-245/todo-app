export function formatLastActive(lastSeenAt: string, now = Date.now()): string {
  const diffMs = Math.max(0, now - new Date(lastSeenAt).getTime());
  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) {
    return "Active just now";
  }

  if (diffMinutes < 60) {
    return `Active ${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  return `Active ${diffHours}h ago`;
}
