const DEFAULT_APP_TIMEZONE = "Africa/Nairobi";

export function getAppTimeZone(): string {
  return process.env.NEXT_PUBLIC_APP_TIMEZONE ?? DEFAULT_APP_TIMEZONE;
}

function getZonedParts(
  date: Date,
  timeZone: string,
): { year: number; month: number; day: number; hour: number; minute: number; second: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);

  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");

  const hour = read("hour");

  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour: hour === 24 ? 0 : hour,
    minute: read("minute"),
    second: read("second"),
  };
}

function getTimeZoneOffsetMs(timeZone: string, date: Date): number {
  const parts = getZonedParts(date, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return asUtc - date.getTime();
}

/** Convert a calendar date at 00:00 in `timeZone` to a UTC Date. */
export function zonedStartOfDay(
  year: number,
  month: number,
  day: number,
  timeZone: string = getAppTimeZone(),
): Date {
  let utc = Date.UTC(year, month - 1, day, 0, 0, 0);
  const offset = getTimeZoneOffsetMs(timeZone, new Date(utc));
  utc -= offset;
  const refinedOffset = getTimeZoneOffsetMs(timeZone, new Date(utc));
  return new Date(utc - (refinedOffset - offset));
}

export function getZonedCalendarDate(
  date: Date = new Date(),
  timeZone: string = getAppTimeZone(),
): { year: number; month: number; day: number } {
  const parts = getZonedParts(date, timeZone);
  return { year: parts.year, month: parts.month, day: parts.day };
}

export function getStartOfToday(timeZone: string = getAppTimeZone()): Date {
  const { year, month, day } = getZonedCalendarDate(new Date(), timeZone);
  return zonedStartOfDay(year, month, day, timeZone);
}

export function getEndOfToday(timeZone: string = getAppTimeZone()): Date {
  const start = getStartOfToday(timeZone);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000);
}

export function getTodayRangeISO(
  timeZone: string = getAppTimeZone(),
): { start: string; end: string } {
  return {
    start: getStartOfToday(timeZone).toISOString(),
    end: getEndOfToday(timeZone).toISOString(),
  };
}

export function isCreatedToday(
  createdAt: string,
  timeZone: string = getAppTimeZone(),
): boolean {
  const created = new Date(createdAt);
  const start = getStartOfToday(timeZone);
  const end = getEndOfToday(timeZone);
  return created >= start && created < end;
}

export function formatLocalDateISO(
  date: Date,
  timeZone: string = getAppTimeZone(),
): string {
  const { year, month, day } = getZonedCalendarDate(date, timeZone);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export type ScoreHistoryRange = 1 | 7 | 30;

export function getScoreRangeStartDate(
  rangeDays: ScoreHistoryRange,
  timeZone: string = getAppTimeZone(),
): string {
  const shifted = new Date(
    getStartOfToday(timeZone).getTime() - (rangeDays - 1) * 24 * 60 * 60 * 1000,
  );
  return formatLocalDateISO(shifted, timeZone);
}

export function getHistoryRangeISO(
  rangeDays: ScoreHistoryRange,
  timeZone: string = getAppTimeZone(),
): {
  start: string;
  end: string;
} {
  // 1D shows yesterday only; 7D/30D are rolling windows ending today.
  if (rangeDays === 1) {
    const todayStart = getStartOfToday(timeZone);
    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);

    return {
      start: yesterdayStart.toISOString(),
      end: todayStart.toISOString(),
    };
  }

  const end = getEndOfToday(timeZone);
  const start = new Date(
    getStartOfToday(timeZone).getTime() - (rangeDays - 1) * 24 * 60 * 60 * 1000,
  );

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

export function listHistoryDates(
  rangeDays: ScoreHistoryRange,
  timeZone: string = getAppTimeZone(),
): string[] {
  if (rangeDays === 1) {
    const yesterday = new Date(getStartOfToday(timeZone).getTime() - 24 * 60 * 60 * 1000);
    return [formatLocalDateISO(yesterday, timeZone)];
  }

  const dates: string[] = [];
  const todayStart = getStartOfToday(timeZone);

  for (let i = rangeDays - 1; i >= 0; i -= 1) {
    const day = new Date(todayStart.getTime() - i * 24 * 60 * 60 * 1000);
    dates.push(formatLocalDateISO(day, timeZone));
  }

  return dates;
}
