import {
  homeMemberSchema,
  homeSchema,
} from '@/schemas/home.schema';
import {
  createTaskInputSchema,
  taskBoardCategoryFilterSchema,
  taskSchema,
} from '@/schemas/task.schema';
import { taskStatusSchema } from '@/schemas/task-status.schema';
import { TASK_STATUS } from '@/types/task-status';

describe('domain schemas', () => {
  it('accepts every task lifecycle status', () => {
    Object.values(TASK_STATUS).forEach((status) => {
      expect(taskStatusSchema.parse(status)).toBe(status);
    });
  });

  it('rejects an unknown task status', () => {
    expect(() => taskStatusSchema.parse('DONE')).toThrow();
  });

  it('validates a home row', () => {
    const home = homeSchema.parse({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      name: 'Piso Demo',
      invite_code: 'DEMO2026',
      created_by: '11111111-1111-1111-1111-111111111111',
      created_at: '2026-08-16T00:00:00.000Z',
      updated_at: '2026-08-16T00:00:00.000Z',
    });

    expect(home.name).toBe('Piso Demo');
    expect(home.proof_mode).toBe('OPTIONAL');
    expect(home.proof_capture).toBe('CAMERA_OR_GALLERY');
  });

  it('validates a home member row', () => {
    const member = homeMemberSchema.parse({
      id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
      home_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      user_id: '11111111-1111-1111-1111-111111111111',
      role: 'owner',
      reputation_points: 100,
      joined_at: '2026-08-16T00:00:00.000Z',
    });

    expect(member.role).toBe('owner');
  });

  it('requires home_id on task rows', () => {
    expect(() =>
      taskSchema.parse({
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        title: 'Fregar',
        description: null,
        status: 'PENDING',
        category: 'QUICK',
        icon: 'checklist',
        recurrence: 'ONCE',
        is_template: false,
        template_id: null,
        assigned_to: null,
        completed_by: null,
        due_at: '2026-08-18T00:00:00.000Z',
        proof_image_url: null,
        points_value: 10,
        created_at: '2026-08-16T00:00:00.000Z',
        updated_at: '2026-08-16T00:00:00.000Z',
      }),
    ).toThrow();
  });

  it('validates create task input with home_id and defaults', () => {
    const input = createTaskInputSchema.parse({
      home_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      title: 'Sacar la basura',
      due_at: '2026-08-18T10:00:00.000Z',
    });

    expect(input.home_id).toBe('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
    expect(input.category).toBe('QUICK');
    expect(input.icon).toBe('checklist');
    expect(input.assignee_ids).toEqual([]);
  });

  it('accepts board category filter chips', () => {
    expect(taskBoardCategoryFilterSchema.parse('ALL')).toBe('ALL');
    expect(taskBoardCategoryFilterSchema.parse('QUICK')).toBe('QUICK');
    expect(() => taskBoardCategoryFilterSchema.parse('ZONE')).toThrow();
    expect(() => taskBoardCategoryFilterSchema.parse('GROCERY')).toThrow();
  });
});
