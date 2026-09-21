import {
  taskSchema,
  taskListSchema,
  type CreateTaskInput,
  type UpdateTaskInput,
  type Task,
} from './schemas';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/nest';

async function handle<T>(
  res: Response,
  parser: (data: unknown) => T,
): Promise<T> {
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  const json = await res.json();
  return parser(json);
}

export async function getTasks(): Promise<Task[]> {
  const res = await fetch(`${API_URL}/tasks`, { cache: 'no-store' });
  return handle(res, (d) => taskListSchema.parse(d));
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const res = await fetch(`${API_URL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handle(res, (d) => taskSchema.parse(d));
}

export async function updateTask(
  id: number,
  input: UpdateTaskInput,
): Promise<Task> {
  const res = await fetch(`${API_URL}/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handle(res, (d) => taskSchema.parse(d));
}

export async function deleteTask(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/tasks/${id}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) {
    throw new Error(`API ${res.status}`);
  }
}