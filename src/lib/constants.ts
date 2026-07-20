import type { TodoPriority } from "./types";

export const TODO_LABELS = ["Home", "Food", "Music", "Work", "Personal"] as const;

export const PRIORITY_OPTIONS: { value: TodoPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export const PRIORITY_STYLES: Record<
  TodoPriority,
  { label: string; className: string }
> = {
  high: {
    label: "High",
    className: "bg-red-50 text-red-500 border-red-100",
  },
  medium: {
    label: "Medium",
    className: "bg-violet-50 text-violet-500 border-violet-100",
  },
  low: {
    label: "Low",
    className: "bg-sky-50 text-sky-500 border-sky-100",
  },
};
