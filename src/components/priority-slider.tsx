"use client";

import { PRIORITY_OPTIONS } from "@/lib/constants";
import type { TodoPriority } from "@/lib/types";

type PrioritySliderProps = {
  value: TodoPriority;
  onChange: (value: TodoPriority) => void;
};

export function PrioritySlider({ value, onChange }: PrioritySliderProps) {
  const index = PRIORITY_OPTIONS.findIndex((option) => option.value === value);
  const safeIndex = index >= 0 ? index : 0;

  const progress = `${(safeIndex / 2) * 100}%`;

  return (
    <div className="w-full">
      <input
        type="range"
        min={0}
        max={2}
        step={1}
        value={safeIndex}
        onChange={(event) => {
          const next = PRIORITY_OPTIONS[Number(event.target.value)];
          if (next) onChange(next.value);
        }}
        style={{ ["--priority-progress" as string]: progress }}
        className="priority-range w-full"
        aria-label="Priority"
      />
      <div className="mt-2 flex justify-between px-0.5 text-sm text-gray-400">
        {PRIORITY_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={
              option.value === value
                ? "font-medium text-sky-500"
                : "text-gray-400"
            }
          >
            {option.label}
          </button>
        ))}
      </div>
      <input type="hidden" name="priority" value={value} />
    </div>
  );
}
