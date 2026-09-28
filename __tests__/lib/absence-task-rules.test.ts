import {
  canViewerParticipateInTasks,
  excludeAbsentAssigneeTasks,
  filterTasksForAbsentViewer,
} from '@/features/tasks/lib/absence-task-rules';
import type { TaskWithRelations } from '@/types/database.types';
import { TASK_STATUS } from '@/types/task-status';

const ANA = '11111111-1111-1111-1111-111111111111';
const BRUNO = '22222222-2222-2222-2222-222222222222';

function makeTask(overrides: Partial<TaskWithRelations> = {}): TaskWithRelations {
  return {
    id: 'task-1',
    home_id: 'home-1',
    title: 'Fregar',
    description: null,
    status: TASK_STATUS.PENDING,
    category: 'QUICK',
    item_type_id: null,
    icon: 'checklist',
    recurrence: 'ONCE',
    is_template: false,
    template_id: null,
    created_by: null,
    base_title: 'Fregar',
    auto_assign: false,
    recurrence_config: {},
    assigned_to: ANA,
    completed_by: null,
    due_at: '2026-08-20T18:00:00.000Z',
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
    task_assignees: [
      {
        id: 'assignee-1',
        home_id: 'home-1',
        task_id: 'task-1',
        user_id: ANA,
        created_at: '2026-08-16T00:00:00.000Z',
        profiles: { id: ANA, display_name: 'Ana', avatar_url: null },
      },
    ],
    ...overrides,
  } as TaskWithRelations;
}

describe('absence-task-rules', () => {
  const absences = [
    {
      user_id: ANA,
      start_date: '2026-08-18',
      end_date: '2026-08-25',
    },
  ];

  it('hides absent viewer tasks on due date', () => {
    const visible = filterTasksForAbsentViewer([makeTask()], absences, ANA);
    expect(visible).toHaveLength(0);
    expect(filterTasksForAbsentViewer([makeTask()], absences, BRUNO)).toHaveLength(1);
  });

  it('excludes absent assignees from home metrics', () => {
    const metrics = excludeAbsentAssigneeTasks([makeTask()], absences);
    expect(metrics).toHaveLength(0);
  });

  it('blocks task participation while absent today', () => {
    expect(canViewerParticipateInTasks(absences, ANA, new Date(2026, 7, 20))).toBe(false);
    expect(canViewerParticipateInTasks(absences, ANA, new Date(2026, 7, 10))).toBe(true);
  });
});
