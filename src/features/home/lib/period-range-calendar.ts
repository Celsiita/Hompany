import { startOfDay } from '@/features/home/lib/agenda-items';
import { localDateKey } from '@/lib/recurrence';

export type PeriodRangeMark = {
  start_date: string;
  end_date: string;
  tone: 'silence' | 'absence' | 'mine-silence' | 'mine-absence';
};

/**
 * True when the day falls inside a period mark.
 */
export function isDateInPeriodMark(day: Date, mark: PeriodRangeMark): boolean {
  const key = localDateKey(day);
  return key >= mark.start_date && key <= mark.end_date;
}

/**
 * True when the day is blocked for new registration (own periods only).
 */
export function isMineBlockedDay(day: Date, marks: readonly PeriodRangeMark[]): boolean {
  return marks.some(
    (mark) =>
      (mark.tone === 'mine-silence' || mark.tone === 'mine-absence') &&
      isDateInPeriodMark(day, mark),
  );
}

/**
 * True when a date range overlaps any own blocked period.
 */
export function rangeOverlapsMineBlocked(
  start: Date,
  end: Date,
  marks: readonly PeriodRangeMark[],
): boolean {
  const startKey = localDateKey(start);
  const endKey = localDateKey(end);
  const from = startKey <= endKey ? startKey : endKey;
  const to = startKey <= endKey ? endKey : startKey;

  return marks.some((mark) => {
    if (mark.tone !== 'mine-silence' && mark.tone !== 'mine-absence') {
      return false;
    }
    return mark.start_date <= to && mark.end_date >= from;
  });
}

/**
 * Applies range-selection rules respecting blocked days.
 */
export function applyPeriodRangeSelection(params: {
  date: Date;
  rangeStart: Date | null;
  rangeEnd: Date | null;
  marks: readonly PeriodRangeMark[];
}): { rangeStart: Date | null; rangeEnd: Date | null; error: string | null } {
  const { marks } = params;
  const date = startOfDay(params.date);

  if (isMineBlockedDay(date, marks)) {
    return {
      rangeStart: params.rangeStart,
      rangeEnd: params.rangeEnd,
      error: 'Ese día ya tiene un periodo registrado.',
    };
  }

  if (!params.rangeStart || (params.rangeStart && params.rangeEnd)) {
    return { rangeStart: date, rangeEnd: null, error: null };
  }

  const rangeStart = startOfDay(params.rangeStart);

  if (date.getTime() < rangeStart.getTime()) {
    if (rangeOverlapsMineBlocked(date, rangeStart, marks)) {
      return {
        rangeStart: params.rangeStart,
        rangeEnd: params.rangeEnd,
        error: 'El rango incluye días ya registrados.',
      };
    }
    return { rangeStart: date, rangeEnd: rangeStart, error: null };
  }

  if (rangeOverlapsMineBlocked(rangeStart, date, marks)) {
    return {
      rangeStart: params.rangeStart,
      rangeEnd: params.rangeEnd,
      error: 'El rango incluye días ya registrados.',
    };
  }

  return { rangeStart, rangeEnd: date, error: null };
}
