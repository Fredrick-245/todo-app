export function getStartOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function getEndOfToday(): Date {
  const start = getStartOfToday();
  return new Date(start.getTime() + 24 * 60 * 60 * 1000);
}

export function getTodayRangeISO(): { start: string; end: string } {
  return {
    start: getStartOfToday().toISOString(),
    end: getEndOfToday().toISOString(),
  };
}

export function isCreatedToday(createdAt: string): boolean {
  const created = new Date(createdAt);
  const start = getStartOfToday();
  const end = getEndOfToday();
  return created >= start && created < end;
}

export function formatLocalDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export type ScoreHistoryRange = 1 | 7 | 30;

export function getScoreRangeStartDate(rangeDays: ScoreHistoryRange): string {
  const start = getStartOfToday();
  start.setDate(start.getDate() - (rangeDays - 1));
  return formatLocalDateISO(start);
}

export function getHistoryRangeISO(rangeDays: ScoreHistoryRange): {
  start: string;
  end: string;
} {
  // 1D shows yesterday only; 7D/30D are rolling windows ending today.
  if (rangeDays === 1) {
    const start = getStartOfToday();
    start.setDate(start.getDate() - 1);
    const end = getStartOfToday();

    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  }

  const end = getEndOfToday();
  const start = getStartOfToday();
  start.setDate(start.getDate() - (rangeDays - 1));

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

export function listHistoryDates(rangeDays: ScoreHistoryRange): string[] {
  if (rangeDays === 1) {
    const yesterday = getStartOfToday();
    yesterday.setDate(yesterday.getDate() - 1);
    return [formatLocalDateISO(yesterday)];
  }

  const dates: string[] = [];
  const cursor = getStartOfToday();
  cursor.setDate(cursor.getDate() - (rangeDays - 1));

  for (let i = 0; i < rangeDays; i += 1) {
    dates.push(formatLocalDateISO(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}
