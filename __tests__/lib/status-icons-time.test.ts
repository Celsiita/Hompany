import { parseTimeInput, sanitizeTimeDraft } from '@/components/ui/DateTimePickerModal';
import {
  createCustomIconPack,
  parseImportedIconPackJson,
} from '@/lib/icons/packs';
import { expenseStatusBadge, taskStatusBadge } from '@/lib/status-badges';
import { TASK_STATUS } from '@/types/task-status';

describe('parseTimeInput', () => {
  it('accepts HH:mm and HHmm', () => {
    expect(parseTimeInput('18:30')).toEqual({ hours: 18, minutes: 30 });
    expect(parseTimeInput('9:05')).toEqual({ hours: 9, minutes: 5 });
    expect(parseTimeInput('2330')).toEqual({ hours: 23, minutes: 30 });
  });

  it('rejects invalid times', () => {
    expect(parseTimeInput('25:00')).toBeNull();
    expect(parseTimeInput('12:60')).toBeNull();
    expect(parseTimeInput('noon')).toBeNull();
  });
});

describe('sanitizeTimeDraft', () => {
  it('strips non time characters including plus/minus', () => {
    expect(sanitizeTimeDraft('+18:30')).toBe('18:30');
    expect(sanitizeTimeDraft('18-30')).toBe('1830');
    expect(sanitizeTimeDraft('9:5a')).toBe('9:5');
  });
});

describe('status badges', () => {
  it('maps task statuses to semantic labels', () => {
    expect(taskStatusBadge(TASK_STATUS.PENDING).label).toBe('Pendiente');
    expect(taskStatusBadge(TASK_STATUS.SUBMITTED).label).toBe('En revisión');
    expect(taskStatusBadge(TASK_STATUS.COMPLETED).label).toBe('Completada');
  });

  it('shows Pendiente for open expenses instead of Abierto', () => {
    expect(expenseStatusBadge({ status: 'OPEN' }).label).toBe('Pendiente');
    expect(expenseStatusBadge({ status: 'SETTLED' }).label).toBe('Saldado');
  });
});

describe('icon pack import', () => {
  it('parses JSON and fills missing glyphs from classic', () => {
    const pack = parseImportedIconPackJson(
      JSON.stringify({
        name: 'Fiesta',
        tasks: { checklist: '🎉' },
        expenses: { PEER: '🥳' },
      }),
    );
    expect(pack.name).toBe('Fiesta');
    expect(pack.tasks.checklist).toBe('🎉');
    expect(pack.tasks.trash).toBe('🗑');
    expect(pack.expenses.PEER).toBe('🥳');
    expect(pack.expenses.GROCERY).toBe('🛒');
    expect(pack.id.startsWith('custom:')).toBe(true);
  });

  it('creates packs with a stable suffix', () => {
    const pack = createCustomIconPack({ name: 'Test' }, 'abc');
    expect(pack.id).toBe('custom:abc');
  });
});
