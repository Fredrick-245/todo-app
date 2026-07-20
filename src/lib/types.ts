export type TodoPriority = "low" | "medium" | "high";

export type Todo = {
  id: string;
  title: string;
  label: string;
  priority: TodoPriority | null;
  completed: boolean;
  completed_at: string | null;
  image_path: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type TodoComment = {
  id: string;
  todo_id: string;
  author_id: string;
  body: string;
  created_at: string;
};
