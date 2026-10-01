import { useEffect, useMemo, useState } from 'react';
import { Keyboard, Modal, Pressable, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { calendarDowLabels } from '@/lib/i18n/display';
import { getAppLocale } from '@/lib/i18n/locale-store';
import { mergeStyles, palette } from '@/lib/interactive-styles';
import { useLocale } from '@/providers/LocaleProvider';

type DateTimePickerModalProps = {
  visible: boolean;
  value: Date;
  onClose: () => void;
  onConfirm: (next: Date) => void;
  /** Modal heading. */
  title?: string;
  /** `date` hides the time controls (all-day). */
  mode?: 'date' | 'datetime';
  /** When set, only enabled days are tappable. */
  isDayEnabled?: (year: number, monthIndex: number, day: number) => boolean;
};

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/**
 * Parses `HH:mm` (or H:mm / HHmm) into hours and minutes.
 */
export function parseTimeInput(raw: string): { hours: number; minutes: number } | null {
  const trimmed = raw.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/) ?? trimmed.match(/^(\d{2})(\d{2})$/);
  if (!match) {
    return null;
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return null;
  }
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }
  return { hours, minutes };
}

/**
 * Formats typed time as HH:mm, keeping the colon visible while editing.
 * Digits only; after 2 hour digits inserts `:`.
 */
export function sanitizeTimeDraft(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) {
    return digits;
  }
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

/**
 * Cross-platform calendar + time sheet (steppers and typed HH:mm).
 */
export function DateTimePickerModal({
  visible,
  value,
  onClose,
  onConfirm,
  title,
  mode = 'datetime',
  isDayEnabled,
}: DateTimePickerModalProps) {
  const { t, locale } = useLocale();
  const intlLocale = locale === 'es' ? 'es-ES' : 'en-US';
  const heading = title ?? t('schedule.dateTime');
  const weekdayLabels = calendarDowLabels(locale);
  const [cursor, setCursor] = useState(new Date(value));
  const [timeText, setTimeText] = useState(
    `${pad(value.getHours())}:${pad(value.getMinutes())}`,
  );
  const [timeError, setTimeError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      const next = new Date(value);
      setCursor(next);
      setTimeText(`${pad(next.getHours())}:${pad(next.getMinutes())}`);
      setTimeError(null);
    }
  }, [visible, value]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const totalDays = daysInMonth(year, month);

  const cells = useMemo(() => {
    const blanks = Array.from({ length: firstWeekday }, () => null);
    const days = Array.from({ length: totalDays }, (_, index) => index + 1);
    return [...blanks, ...days];
  }, [firstWeekday, totalDays]);

  const monthLabel = new Intl.DateTimeFormat(intlLocale, { month: 'long', year: 'numeric' }).format(
    cursor,
  );

  function setDay(day: number) {
    if (isDayEnabled && !isDayEnabled(year, month, day)) {
      return;
    }
    const next = new Date(cursor);
    next.setFullYear(year, month, day);
    setCursor(next);
  }

  function bumpMonth(delta: number) {
    const next = new Date(cursor);
    next.setMonth(next.getMonth() + delta);
    setCursor(next);
  }

  function bumpTime(part: 'hours' | 'minutes', delta: number) {
    Keyboard.dismiss();
    const next = new Date(cursor);
    if (part === 'hours') {
      next.setHours(next.getHours() + delta);
    } else {
      next.setMinutes(next.getMinutes() + delta);
    }
    setCursor(next);
    setTimeText(`${pad(next.getHours())}:${pad(next.getMinutes())}`);
    setTimeError(null);
  }

  function applyTypedTime(raw: string) {
    const cleaned = sanitizeTimeDraft(raw);
    setTimeText(cleaned);
    const parsed = parseTimeInput(cleaned);
    if (!parsed) {
      setTimeError(
        cleaned.length === 0 || cleaned.length < 4 ? null : t('schedule.timeErrorSingle'),
      );
      return;
    }
    const next = new Date(cursor);
    next.setHours(parsed.hours, parsed.minutes, 0, 0);
    setCursor(next);
    setTimeError(null);
  }

  function confirm() {
    if (mode === 'date') {
      const next = new Date(cursor);
      next.setHours(value.getHours(), value.getMinutes(), 0, 0);
      if (isDayEnabled && !isDayEnabled(next.getFullYear(), next.getMonth(), next.getDate())) {
        setTimeError(t('schedule.invalidDay'));
        return;
      }
      onConfirm(next);
      onClose();
      return;
    }
    const parsed = parseTimeInput(timeText);
    if (timeText.trim().length > 0 && !parsed) {
      setTimeError(t('schedule.timeErrorSingle'));
      return;
    }
    const next = new Date(cursor);
    if (parsed) {
      next.setHours(parsed.hours, parsed.minutes, 0, 0);
    }
    if (isDayEnabled && !isDayEnabled(next.getFullYear(), next.getMonth(), next.getDate())) {
      setTimeError(t('schedule.invalidDay'));
      return;
    }
    onConfirm(next);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <Pressable className="absolute inset-0" onPress={onClose} accessibilityLabel={t('a11y.close')} />
        <View className="gap-3 rounded-t-3xl bg-white p-4">
          <Text className="text-lg font-bold text-stone-900">{heading}</Text>
          <View className="flex-row items-center justify-between">
            <Pressable onPress={() => bumpMonth(-1)} className="px-3 py-2">
              <Text className="text-lg text-teal-700">‹</Text>
            </Pressable>
            <Text className="text-sm font-semibold capitalize text-stone-800">{monthLabel}</Text>
            <Pressable onPress={() => bumpMonth(1)} className="px-3 py-2">
              <Text className="text-lg text-teal-700">›</Text>
            </Pressable>
          </View>
          <View className="flex-row">
            {weekdayLabels.map((label, index) => (
              <Text
                key={`${label}-${index}`}
                className="flex-1 text-center text-[10px] font-bold text-stone-400">
                {label}
              </Text>
            ))}
          </View>
          <View className="flex-row flex-wrap">
            {cells.map((day, index) => {
              const selected = day === cursor.getDate();
              const enabled = day
                ? isDayEnabled
                  ? isDayEnabled(year, month, day)
                  : true
                : false;
              return (
                <View key={`${year}-${month}-${index}`} style={{ width: '14.28%', padding: 2 }}>
                  {day ? (
                    <Pressable
                      cssInterop={false}
                      disabled={!enabled}
                      onPress={() => setDay(day)}
                      style={mergeStyles(
                        { borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
                        selected && enabled
                          ? { backgroundColor: palette.blue600 }
                          : enabled
                            ? { backgroundColor: palette.gray50 }
                            : { backgroundColor: palette.gray100, opacity: 0.4 },
                      )}>
                      <Text
                        style={{
                          textAlign: 'center',
                          fontSize: 14,
                          fontWeight: selected && enabled ? '700' : '400',
                          color: selected && enabled ? palette.white : enabled ? '#1f2937' : '#9ca3af',
                        }}>
                        {day}
                      </Text>
                    </Pressable>
                  ) : (
                    <View style={{ paddingVertical: 8 }} />
                  )}
                </View>
              );
            })}
          </View>
          {mode === 'datetime' ? (
            <>
              <View className="flex-row items-center justify-center gap-3">
                <Pressable
                  onPress={() => bumpTime('hours', -1)}
                  accessibilityLabel={t('a11y.hourMinus')}
                  className="rounded-lg bg-stone-100 px-3 py-2">
                  <Text className="text-teal-700">−h</Text>
                </Pressable>
                <TextInput
                  value={timeText}
                  onChangeText={applyTypedTime}
                  keyboardType="number-pad"
                  maxLength={5}
                  selectTextOnFocus={false}
                  underlineColorAndroid="transparent"
                  autoCorrect={false}
                  accessibilityLabel={t('a11y.timeInput')}
                  className="min-w-[72px] rounded-lg border border-stone-300 bg-white px-3 py-2 text-center text-xl font-bold text-stone-900"
                  placeholder="HH:mm"
                  placeholderTextColor="#9ca3af"
                />
                <Pressable
                  onPress={() => bumpTime('hours', 1)}
                  accessibilityLabel={t('a11y.hourPlus')}
                  className="rounded-lg bg-stone-100 px-3 py-2">
                  <Text className="text-teal-700">+h</Text>
                </Pressable>
                <Pressable
                  onPress={() => bumpTime('minutes', -15)}
                  accessibilityLabel={t('a11y.minuteMinus')}
                  className="rounded-lg bg-stone-100 px-3 py-2">
                  <Text className="text-teal-700">−15</Text>
                </Pressable>
                <Pressable
                  onPress={() => bumpTime('minutes', 15)}
                  accessibilityLabel={t('a11y.minutePlus')}
                  className="rounded-lg bg-stone-100 px-3 py-2">
                  <Text className="text-teal-700">+15</Text>
                </Pressable>
              </View>
              {timeError ? <Text className="text-center text-xs text-red-600">{timeError}</Text> : null}
              <Text className="text-center text-xs text-stone-500">{t('schedule.timeHint')}</Text>
            </>
          ) : timeError ? (
            <Text className="text-center text-xs text-red-600">{timeError}</Text>
          ) : null}
          <View className="mb-2 flex-row gap-2">
            <View className="flex-1">
              <Button label={t('common.cancel')} variant="secondary" onPress={onClose} />
            </View>
            <View className="flex-1">
              <Button label={t('form.useDate')} onPress={confirm} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Formats a due instant for form labels (es-ES).
 */
export function formatDueDateTime(value: Date): string {
  const intlLocale = getAppLocale() === 'es' ? 'es-ES' : 'en-US';
  return new Intl.DateTimeFormat(intlLocale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value);
}
