'use client';

import { useCallback, useEffect, useState } from 'react';
import { taskListSchema, type Task } from '@/lib/schemas';
import TaskForm from './TaskForm';
import TaskItem from './TaskItem';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/nest';

export default function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`${API_URL}/tasks`, { cache: 'no-store' });
      if (!res.ok) throw new Error(await res.text());
      const data = taskListSchema.parse(await res.json());
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return (
    <div className="w-full max-w-xl">
      <TaskForm onCreated={fetchTasks} />

      {loading && (
        <p className="text-sm text-muted-foreground">Loading…</p>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && !error && tasks.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No tasks yet. Add one above ☝️
        </p>
      )}

      <ul className="space-y-2">
        {tasks.map((t) => (
          <TaskItem key={t.id} task={t} onChange={fetchTasks} />
        ))}
      </ul>
    </div>
  );
}