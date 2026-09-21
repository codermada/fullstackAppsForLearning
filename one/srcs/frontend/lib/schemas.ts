import { z } from 'zod';

// ---- Matches CreateTaskDto ----
export const createTaskSchema = z.object({
  task: z.string().min(1, 'Task is required'),
  completed: z.boolean().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

// ---- Matches UpdateTaskDto (all fields optional) ----
export const updateTaskSchema = createTaskSchema.partial();
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

// ---- Matches the Prisma Task model (as returned over JSON) ----
export const taskSchema = z.object({
  id: z.number(),
  task: z.string(),
  completed: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  completedAt: z.string().nullable(),
});

export type Task = z.infer<typeof taskSchema>;

export const taskListSchema = z.array(taskSchema);