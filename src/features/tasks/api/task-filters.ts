import { createTaskInputSchema } from '@/schemas/task.schema';
import { requireHomeId } from '@/lib/home/require-home-id';

/**
 * Builds a home-scoped task query filter.
 * Use this whenever composing Supabase filters for the tasks table.
 *
 * @param homeId - Active home identifier.
 * @returns Object with validated `home_id` ready for `.eq('home_id', ...)`.
 */
export function buildTasksHomeFilter(homeId: string): { home_id: string } {
  return { home_id: requireHomeId(homeId) };
}

/**
 * Validates a create-task payload and returns the scoped home_id.
 *
 * @param payload - Raw input from UI or API.
 * @returns Parsed create-task input.
 */
export function parseCreateTaskPayload(payload: unknown) {
  const parsed = createTaskInputSchema.parse(payload);
  requireHomeId(parsed.home_id);
  return parsed;
}
