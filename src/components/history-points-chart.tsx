"use client";

import type { HistoryDayPoints } from "@/lib/history-todos";

type HistoryPointsChartProps = {
  data: HistoryDayPoints[];
  totalPoints: number;
  rangeLabel: string;
};

function formatBarLabel(date: string, compact: boolean) {
  const parsed = new Date(`${date}T12:00:00`);

  if (compact) {
    return new Intl.DateTimeFormat(undefined, { day: "numeric" }).format(parsed);
  }

  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(parsed);
}

export function HistoryPointsChart({
  data,
  totalPoints,
  rangeLabel,
}: HistoryPointsChartProps) {
  const maxPoints = Math.max(...data.map((day) => day.points), 1);
  const compact = data.length > 10;
  const chartHeight = 140;
  const chartWidth = 320;
  const paddingX = 12;
  const paddingTop = 18;
  const paddingBottom = 28;
  const plotHeight = chartHeight - paddingTop - paddingBottom;
  const dayCount = Math.max(data.length, 1);
  const slotWidth = (chartWidth - paddingX * 2) / dayCount;
  const barWidth = Math.max(6, Math.min(28, slotWidth * 0.55));
  const labelStep = Math.max(1, Math.ceil(dayCount / 6));

  return (
    <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-sky-50 via-white to-blue-50 p-4 ring-1 ring-sky-100 [scrollbar-width:none]">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-sky-600">
            Points · {rangeLabel}
          </p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
            {totalPoints}
          </p>
          <p className="text-xs text-gray-400">Low 3 · Medium 5 · High 8</p>
        </div>
        <div className="rounded-xl bg-white/80 px-3 py-2 text-right shadow-sm ring-1 ring-black/[0.04]">
          <p className="text-[11px] text-gray-400">Avg / day</p>
          <p className="text-sm font-semibold text-blue-500">
            {data.length > 0 ? Math.round(totalPoints / data.length) : 0}
          </p>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="h-40 w-full"
        role="img"
        aria-label={`Points chart for ${rangeLabel}`}
      >
        <defs>
          <linearGradient id="historyBarGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#93c5fd" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = paddingTop + plotHeight * (1 - ratio);
          return (
            <line
              key={ratio}
              x1={paddingX}
              x2={chartWidth - paddingX}
              y1={y}
              y2={y}
              stroke="#e2e8f0"
              strokeDasharray="3 3"
            />
          );
        })}

        {data.map((day, index) => {
          const barHeight =
            day.points === 0 ? 0 : Math.max(4, (day.points / maxPoints) * plotHeight);
          const x = paddingX + index * slotWidth + (slotWidth - barWidth) / 2;
          const y = paddingTop + plotHeight - barHeight;
          const label = formatBarLabel(day.date, compact);
          const showLabel =
            !compact ||
            index === 0 ||
            index === data.length - 1 ||
            index % labelStep === 0;

          return (
            <g key={day.date}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={Math.min(8, barWidth / 2)}
                fill="url(#historyBarGradient)"
                className="transition-all duration-300"
              >
                <title>
                  {formatBarLabel(day.date, false)}: {day.points} pts ·{" "}
                  {day.todoCount} todo{day.todoCount === 1 ? "" : "s"}
                </title>
              </rect>
              {day.points > 0 && data.length <= 10 ? (
                <text
                  x={x + barWidth / 2}
                  y={y - 6}
                  textAnchor="middle"
                  className="fill-gray-500 text-[9px] font-medium"
                >
                  {day.points}
                </text>
              ) : null}
              {showLabel ? (
                <text
                  x={x + barWidth / 2}
                  y={chartHeight - 8}
                  textAnchor="middle"
                  className="fill-gray-400 text-[9px]"
                >
                  {label}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
