import { isCreatedToday } from "@/lib/dates";
import type { Todo } from "@/lib/types";

export type TodosByMember = Record<string, Todo[]>;

export function sortTodos(todos: Todo[]): Todo[] {
  return [...todos].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }

    return (
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  });
}

export function filterTodaysTodos(todos: Todo[]): Todo[] {
  return sortTodos(todos.filter((todo) => isCreatedToday(todo.created_at)));
}

export function groupTodosByMember(
  todos: Todo[],
  memberIds: string[],
): TodosByMember {
  const grouped = Object.fromEntries(
    memberIds.map((memberId) => [memberId, [] as Todo[]]),
  ) as TodosByMember;

  for (const todo of todos) {
    if (
      todo.created_by &&
      grouped[todo.created_by] &&
      isCreatedToday(todo.created_at)
    ) {
      grouped[todo.created_by].push(todo);
    }
  }

  for (const memberId of memberIds) {
    grouped[memberId] = sortTodos(grouped[memberId]);
  }

  return grouped;
}

export function todosEqual(current: Todo[], next: Todo[]): boolean {
  if (current.length !== next.length) return false;

  return current.every((todo, index) => {
    const other = next[index];
    return (
      todo.id === other.id &&
      todo.updated_at === other.updated_at &&
      todo.completed === other.completed &&
      todo.completed_at === other.completed_at &&
      todo.image_path === other.image_path &&
      todo.title === other.title &&
      todo.label === other.label &&
      todo.priority === other.priority
    );
  });
}

export function mergeTodosByMember(
  current: TodosByMember,
  incoming: TodosByMember,
): TodosByMember {
  const merged: TodosByMember = { ...current };
  let changed = false;

  for (const [memberId, todos] of Object.entries(incoming)) {
    const existing = current[memberId] ?? [];

    if (!todosEqual(existing, todos)) {
      merged[memberId] = todos;
      changed = true;
    }
  }

  return changed ? merged : current;
}
