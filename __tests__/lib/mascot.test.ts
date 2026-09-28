import {
  MASCOT_NAME,
  mascotEmptyCopy,
  mascotMoodFromHealth,
  mascotPersona,
  mascotQuip,
  mascotReaction,
  mascotScreenLine,
} from '@/lib/mascot';
import { canRequestTaskSwap } from '@/features/tasks/lib/board-filters';
import type { TaskWithRelations } from '@/types/database.types';
import { TASK_STATUS } from '@/types/task-status';

describe('mascot', () => {
  it('maps health labels to moods', () => {
    expect(mascotMoodFromHealth('Excelente')).toBe('thriving');
    expect(mascotMoodFromHealth('Regular')).toBe('okay');
    expect(mascotMoodFromHealth('Crítico')).toBe('chaos');
  });

  it('exposes drawn-face persona fields', () => {
    const thriving = mascotPersona('thriving');
    expect(thriving.mouth).toBe('smile');
    expect(mascotPersona('chaos').eye).toBe('wide');
    expect(thriving.fur).toMatch(/^#/);
  });

  it('keeps empty/screen copy neutral; Mico stays in quips/reactions helpers', () => {
    expect(mascotEmptyCopy('tasks_open').body).not.toContain(MASCOT_NAME);
    expect(mascotEmptyCopy('expenses_i_owe').body).not.toContain(MASCOT_NAME);
    expect(mascotScreenLine('feed')).not.toContain(MASCOT_NAME);
    expect(mascotQuip('thriving')).toContain(MASCOT_NAME);
    expect(mascotReaction('approve').button).toMatch(/aprobado/i);
    expect(mascotReaction('complete').button).toBe('Completar');
  });
});

describe('canRequestTaskSwap', () => {
  function task(status: TaskWithRelations['status']): TaskWithRelations {
    return {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      home_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      title: 'Test',
      description: null,
      status,
      category: 'QUICK',
      item_type_id: null,
      icon: 'checklist',
      recurrence: 'ONCE',
      is_template: false,
      template_id: null,
      created_by: null,
      base_title: 'Test',
      auto_assign: false,
      recurrence_config: {},
      assigned_to: null,
      completed_by: null,
      due_at: '2026-08-18T10:00:00.000Z',
      due_mode: 'DEADLINE',
      starts_at: null,
      all_day: false,
      completed_at: null,
      proof_image_url: null,
      points_value: 10,
      review_note: null,
      review_note_kind: null,
      created_at: '2026-08-16T00:00:00.000Z',
      updated_at: '2026-08-16T00:00:00.000Z',
      task_assignees: [],
    };
  }

  it('allows pending and overdue only', () => {
    expect(canRequestTaskSwap(task(TASK_STATUS.PENDING))).toBe(true);
    expect(canRequestTaskSwap(task(TASK_STATUS.OVERDUE))).toBe(true);
    expect(canRequestTaskSwap(task(TASK_STATUS.SUBMITTED))).toBe(false);
    expect(canRequestTaskSwap(task(TASK_STATUS.COMPLETED))).toBe(false);
    expect(canRequestTaskSwap(task(TASK_STATUS.RESOLVED_LATE))).toBe(false);
    expect(canRequestTaskSwap(task(TASK_STATUS.SKIPPED))).toBe(false);
  });
});
