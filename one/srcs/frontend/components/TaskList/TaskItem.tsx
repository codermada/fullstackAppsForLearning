'use client';

import { useState } from 'react';
import type { Task } from '@/lib/schemas';
import { updateTask, deleteTask } from '@/lib/api';
import { Button } from '@/components/ui';
import { Toggle } from '@/components/ui/Toggle';

export default function TaskItem({
  task,
  onChange,
}: {
  task: Task;
  onChange: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function toggleCompleted() {
    setLoading(true);
    try {
      await updateTask(task.id, { completed: !task.completed });
      onChange();
    } finally {
      setLoading(false);
    }
  }

  async function remove() {
    setLoading(true);
    try {
      await deleteTask(task.id);
      onChange();
    } finally {
      setLoading(false);
    }
  }

  return (
    <li
      className={`flex items-center justify-between gap-4 rounded-md border border-border bg-card px-4 py-3 shadow-sm transition-opacity ${
        loading ? 'opacity-50' : ''
      }`}
    >
      <Toggle
        checked={task.completed}
        onChange={toggleCompleted}
        disabled={loading}
        label={task.task}
        className="flex-1"
      />

      <Button
        variant="destructive"
        size="sm"
        onClick={remove}
        disabled={loading}
      >
        Delete
      </Button>
    </li>
  );
}