'use client';

import { useState } from 'react';
import { createTaskSchema } from '@/lib/schemas';
import { createTask } from '@/lib/api';
import { Button, Form, FormField, Input } from '@/components/ui';

export default function TaskForm({ onCreated }: { onCreated: () => void }) {
  const [task, setTask] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const parsed = createTaskSchema.safeParse({ task });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      await createTask(parsed.data);
      setTask('');
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form onSubmit={handleSubmit} className="mb-6">
      <div className="flex items-start gap-2">
        <FormField
          htmlFor="new-task"
          error={error}
          className="flex-1"
        >
          <Input
            id="new-task"
            type="text"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="What needs to be done?"
          />
        </FormField>

        <Button type="submit" disabled={loading}>
          {loading ? 'Adding…' : 'Add'}
        </Button>
      </div>
    </Form>
  );
}