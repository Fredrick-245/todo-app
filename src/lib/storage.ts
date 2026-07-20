export function getTodoImagePublicUrl(path: string | null): string | null {
  if (!path) return null;

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl) return null;

  return `${baseUrl}/storage/v1/object/public/todo-images/${path}`;
}

export function getImageExtension(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (
    fromName &&
    ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif"].includes(fromName)
  ) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }

  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  return "jpg";
}

export function buildTodoImagePath(todoId: string, file: File): string {
  return `${todoId}/${Date.now()}.${getImageExtension(file)}`;
}
