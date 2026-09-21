'use client';

import { useTasks } from '@/lib/useTasks';
import TaskForm from './TaskForm';
import TaskItem from './TaskItem';

export default function TaskList() {
  const { tasks, loading, error, addTask, toggleTask, removeTask } = useTasks();

  return (
    <div className="w-full max-w-xl">
      <TaskForm onSubmit={addTask} />

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && !error && tasks.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No tasks yet. Add one above ☝️
        </p>
      )}

      <ul className="space-y-2">
        {tasks.map((t) => (
          <TaskItem
            key={t.id}
            task={t}
            onToggle={toggleTask}
            onDelete={removeTask}
          />
        ))}
      </ul>
    </div>
  );
}