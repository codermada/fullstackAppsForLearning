'use client';

import { useState } from 'react';
import type { Task } from '@/lib/schemas';
import { Button, Toggle } from '@/components/ui';

interface TaskItemProps {
  task: Task;
  onToggle: (id: number, completed: boolean) => Promise<unknown>;
  onDelete: (id: number) => Promise<unknown>;
}

export default function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isTemp = task.id < 0;

  async function handleToggle() {
    setPending(true);
    setError(null);
    try {
      await onToggle(task.id, !task.completed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    setPending(true);
    setError(null);
    try {
      await onDelete(task.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setPending(false);
    }
  }

  return (
    <li
      className={`flex flex-col gap-1 rounded-md border border-border bg-card px-4 py-3 shadow-sm transition-opacity ${
        pending || isTemp ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <Toggle
          checked={task.completed}
          onChange={handleToggle}
          disabled={pending || isTemp}
          label={task.task}
          className="flex-1"
        />

        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={pending || isTemp}
        >
          Delete
        </Button>
      </div>

      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </li>
  );
}