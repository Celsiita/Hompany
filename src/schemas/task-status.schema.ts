import { z } from 'zod';

import { TASK_STATUS_VALUES } from '@/types/task-status';

/**
 * Zod schema for validating task status values from API payloads and database rows.
 */
export const taskStatusSchema = z.enum(TASK_STATUS_VALUES);
