'use client';

import { useState } from 'react';
import { createTaskSchema, type CreateTaskInput } from '@/lib/schemas';
import { Button, Form, Input } from '@/components/ui';

interface TaskFormProps {
  onSubmit: (input: CreateTaskInput) => Promise<unknown>;
}

export default function TaskForm({ onSubmit }: TaskFormProps) {
  const [task, setTask] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const parsed = createTaskSchema.safeParse({ task });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setPending(true);
    const previous = task;
    setTask('');
    try {
      await onSubmit(parsed.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
      setTask(previous);
    } finally {
      setPending(false);
    }
  }

  return (
    <Form onSubmit={handleSubmit} className="mb-6 space-y-2">
      <div className="flex gap-2">
        <Input
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="What needs to be done?"
          disabled={pending}
          className="flex-1"
        />
        <Button type="submit" disabled={pending}>
          {pending ? 'Adding…' : 'Add'}
        </Button>
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </Form>
  );
}