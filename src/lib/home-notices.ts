import { getAppLocale } from '@/lib/i18n/locale-store';
import { translate } from '@/lib/i18n/strings';
import { localDateKey } from '@/lib/recurrence';
import type { CalendarNoticeKind, HomeNotice } from '@/schemas/home-notice.schema';

export const CALENDAR_NOTICE_GLYPH: Record<CalendarNoticeKind, string> = {
  REPAIR: '🔧',
  VISIT: '🚪',
  EVENT: '📅',
};

const CALENDAR_NOTICE_LABEL_KEY: Record<CalendarNoticeKind, string> = {
  REPAIR: 'visit.kind.repair',
  VISIT: 'visit.kind.visit',
  EVENT: 'visit.kind.event',
};

/**
 * Localized calendar notice kind label.
 */
export function calendarNoticeLabel(kind: CalendarNoticeKind): string {
  return translate(getAppLocale(), CALENDAR_NOTICE_LABEL_KEY[kind]);
}

/** Localized labels; reads current app locale on each access. */
export const CALENDAR_NOTICE_LABEL: Record<CalendarNoticeKind, string> = {
  get REPAIR() {
    return calendarNoticeLabel('REPAIR');
  },
  get VISIT() {
    return calendarNoticeLabel('VISIT');
  },
  get EVENT() {
    return calendarNoticeLabel('EVENT');
  },
};

type CalendarNoticeLike = Pick<HomeNotice, 'kind' | 'starts_on' | 'ends_on' | 'title'>;

/**
 * True when a calendar notice covers the local calendar day.
 */
export function isNoticeOnDate(notice: CalendarNoticeLike, date: Date): boolean {
  if (!notice.starts_on || !notice.ends_on) {
    return false;
  }
  const key = localDateKey(date);
  return key >= notice.starts_on && key <= notice.ends_on;
}

/**
 * Calendar notices (VISIT/REPAIR/EVENT) active on a given day.
 */
export function noticesOnDate(
  notices: readonly CalendarNoticeLike[],
  date: Date,
): CalendarNoticeLike[] {
  return notices.filter((notice) => isNoticeOnDate(notice, date));
}

/**
 * True when any calendar notice covers the day.
 */
export function hasNoticesOnDate(notices: readonly CalendarNoticeLike[], date: Date): boolean {
  return noticesOnDate(notices, date).length > 0;
}

/**
 * Unique emoji markers for calendar notices on a day (max one per kind).
 */
export function noticeEmojisOnDate(
  notices: readonly CalendarNoticeLike[],
  date: Date,
): { key: string; glyph: string }[] {
  const seen = new Set<string>();
  const emojis: { key: string; glyph: string }[] = [];
  for (const notice of noticesOnDate(notices, date)) {
    if (notice.kind !== 'VISIT' && notice.kind !== 'REPAIR' && notice.kind !== 'EVENT') {
      continue;
    }
    if (seen.has(notice.kind)) {
      continue;
    }
    seen.add(notice.kind);
    emojis.push({ key: `notice-${notice.kind}`, glyph: CALENDAR_NOTICE_GLYPH[notice.kind] });
  }
  return emojis;
}
