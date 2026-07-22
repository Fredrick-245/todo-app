type CommentRow = {
  todo_id: string;
  author_id: string;
  created_at: string;
};

type ReadRow = {
  todo_id: string;
  last_read_at: string;
};

export function computeUnreadTodoIds(
  todoIds: string[],
  comments: CommentRow[],
  reads: ReadRow[],
  currentUserId: string,
  expandedTodoIds: Set<string>,
): Set<string> {
  const readByTodoId = new Map(reads.map((read) => [read.todo_id, read.last_read_at]));
  const unread = new Set<string>();

  for (const todoId of todoIds) {
    if (expandedTodoIds.has(todoId)) continue;

    const lastReadAt = readByTodoId.get(todoId) ?? "1970-01-01T00:00:00.000Z";
    const hasUnread = comments.some(
      (comment) =>
        comment.todo_id === todoId &&
        comment.author_id !== currentUserId &&
        comment.created_at > lastReadAt,
    );

    if (hasUnread) {
      unread.add(todoId);
    }
  }

  return unread;
}
