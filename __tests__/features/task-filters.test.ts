import { buildTasksHomeFilter, parseCreateTaskPayload } from '@/features/tasks/api/task-filters';
import {
  applyTaskBoardFilters,
  filterOpenBoardTasks,
  filterReviewBoardTasks,
  filterTasksByAssigneeScope,
  filterTasksByBoardStatus,
  filterTasksByCategory,
  filterTasksByRecurrence,
} from '@/features/tasks/lib/board-filters';
import { MissingHomeIdError } from '@/lib/home/require-home-id';
import type { TaskWithRelations } from '@/types/database.types';
import { TASK_STATUS } from '@/types/task-status';

const CUSTOM_TYPE = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

function makeTask(overrides: Partial<TaskWithRelations> = {}): TaskWithRelations {
  return {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    home_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    title: 'Test',
    description: null,
    status: TASK_STATUS.PENDING,
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
    ...overrides,
  };
}

describe('task filters', () => {
  it('builds a home_id filter for task queries', () => {
    expect(buildTasksHomeFilter('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')).toEqual({
      home_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    });
  });

  it('rejects task filters without home_id', () => {
    expect(() => buildTasksHomeFilter('')).toThrow(MissingHomeIdError);
  });

  it('parses create-task payloads with home_id', () => {
    const parsed = parseCreateTaskPayload({
      home_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      title: 'Fregar',
      due_at: '2026-08-18T10:00:00.000Z',
    });

    expect(parsed.title).toBe('Fregar');
    expect(parsed.category).toBe('QUICK');
  });
});

describe('board filters', () => {
  const userId = '11111111-1111-1111-1111-111111111111';
  const otherId = '22222222-2222-2222-2222-222222222222';

  const tasks = [
    makeTask({
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      item_type_id: CUSTOM_TYPE,
      title: 'Cocina',
      assigned_to: userId,
      task_assignees: [
        {
          id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
          home_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          task_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
          user_id: userId,
          created_at: '2026-08-16T00:00:00.000Z',
          profiles: null,
        },
      ],
    }),
    makeTask({
      id: 'dddddddd-dddd-dddd-dddd-ddddddddddd2',
      item_type_id: CUSTOM_TYPE,
      title: 'Baño',
      status: TASK_STATUS.SUBMITTED,
      assigned_to: otherId,
      task_assignees: [
        {
          id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
          home_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          task_id: 'dddddddd-dddd-dddd-dddd-ddddddddddd2',
          user_id: otherId,
          created_at: '2026-08-16T00:00:00.000Z',
          profiles: null,
        },
      ],
    }),
    makeTask({
      id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
      title: 'Basura',
      assigned_to: otherId,
      task_assignees: [
        {
          id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
          home_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          task_id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
          user_id: otherId,
          created_at: '2026-08-16T00:00:00.000Z',
          profiles: null,
        },
      ],
    }),
    makeTask({
      id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
      category: 'GROCERY',
      title: 'Compra',
      assigned_to: userId,
    }),
  ];

  it('filters by type chip and hides grocery from the board', () => {
    expect(filterTasksByCategory(tasks, 'ALL').map((t) => t.title)).toEqual([
      'Cocina',
      'Baño',
      'Basura',
    ]);
    expect(filterTasksByCategory(tasks, CUSTOM_TYPE).map((t) => t.title)).toEqual([
      'Cocina',
      'Baño',
    ]);
    expect(filterTasksByCategory(tasks, 'QUICK').map((t) => t.title)).toEqual(['Basura']);
  });

  it('filters mine vs other roommates', () => {
    expect(filterTasksByAssigneeScope(tasks, 'MINE', userId).map((t) => t.title)).toEqual([
      'Cocina',
      'Compra',
    ]);
    expect(filterTasksByAssigneeScope(tasks, 'OTHERS', userId).map((t) => t.title)).toEqual([
      'Baño',
      'Basura',
    ]);
    expect(filterTasksByAssigneeScope(tasks, 'ALL', userId).map((t) => t.title)).toEqual([
      'Cocina',
      'Baño',
      'Basura',
      'Compra',
    ]);
  });

  it('applies both filters together', () => {
    const mineCustom = applyTaskBoardFilters({
      tasks,
      category: CUSTOM_TYPE,
      scope: 'MINE',
      userId,
    });
    expect(mineCustom.map((t) => t.title)).toEqual(['Cocina']);

    const othersCustom = applyTaskBoardFilters({
      tasks,
      category: CUSTOM_TYPE,
      scope: 'OTHERS',
      userId,
    });
    expect(othersCustom.map((t) => t.title)).toEqual(['Baño']);
  });

  it('splits open work from the review feed', () => {
    expect(filterOpenBoardTasks(tasks).map((t) => t.title)).toEqual([
      'Cocina',
      'Baño',
      'Basura',
      'Compra',
    ]);
    expect(filterReviewBoardTasks(tasks).map((t) => t.title)).toEqual(['Baño']);
  });

  it('filters by recurrence', () => {
    const withWeekly = [
      ...tasks,
      makeTask({ id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa9', title: 'Semanal', recurrence: 'WEEKLY' }),
    ];
    expect(filterTasksByRecurrence(withWeekly, 'WEEKLY').map((t) => t.title)).toEqual(['Semanal']);
    expect(filterTasksByRecurrence(withWeekly, 'ONCE').map((t) => t.title)).toEqual([
      'Cocina',
      'Baño',
      'Basura',
      'Compra',
    ]);
  });

  it('separates completed from peer-resolved in history filters', () => {
    const history = [
      makeTask({
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa10',
        title: 'Hecha',
        status: TASK_STATUS.COMPLETED,
      }),
      makeTask({
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa11',
        title: 'Por otro',
        status: TASK_STATUS.RESOLVED_BY_PEER,
      }),
    ];
    expect(filterTasksByBoardStatus(history, 'COMPLETED').map((t) => t.title)).toEqual(['Hecha']);
    expect(filterTasksByBoardStatus(history, 'RESOLVED_BY_PEER').map((t) => t.title)).toEqual([
      'Por otro',
    ]);
  });
});
