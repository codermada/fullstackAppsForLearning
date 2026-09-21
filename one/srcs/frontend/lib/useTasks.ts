'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createTask, deleteTask, getTasks, updateTask } from './api';
import { taskSchema, type Task, type CreateTaskInput } from './schemas';
import { getSocket } from './socket';

// ============================================================
//  Types
// ============================================================

type TaskEvent = 'created' | 'updated' | 'deleted';

interface TaskUpdatePayload {
  event: TaskEvent;
  task: Task;
}

// ============================================================
//  Helpers
// ============================================================

/** Newest first, stable for tasks created in the same millisecond. */
function sortDesc(list: Task[]): Task[] {
  return [...list].sort((a, b) => {
    const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return diff !== 0 ? diff : b.id - a.id;
  });
}

/** How long a pending-id lock stays valid before auto-expiring (ms). */
const PENDING_TTL = 5000;

// ============================================================
//  Hook
// ============================================================

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // id → timestamp when it was marked pending.
  // Entries older than PENDING_TTL are treated as expired.
  const pendingIds = useRef(new Map<number, number>());

  // -- pendingId helpers -------------------------------------
  const markPending = useCallback((id: number) => {
    pendingIds.current.set(id, Date.now());
  }, []);

  const isPending = useCallback((id: number): boolean => {
    const ts = pendingIds.current.get(id);
    if (ts === undefined) return false;
    if (Date.now() - ts > PENDING_TTL) {
      pendingIds.current.delete(id);
      return false;
    }
    return true;
  }, []);

  const clearPending = useCallback((id: number) => {
    pendingIds.current.delete(id);
  }, []);

  // ----------------------------------------------------------
  //  Fetch
  // ----------------------------------------------------------
  const fetchTasks = useCallback(async () => {
    setError(null);
    try {
      const data = await getTasks();
      setTasks(sortDesc(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // ----------------------------------------------------------
  //  Realtime subscription
  // ----------------------------------------------------------
  useEffect(() => {
    const socket = getSocket();

    function handleTaskUpdate(payload: TaskUpdatePayload) {
      const parsed = taskSchema.safeParse(payload.task);
      if (!parsed.success) {
        console.error('[ws] invalid task payload', parsed.error);
        return;
      }
      const task = parsed.data;

      // Skip the echo of a mutation we already applied optimistically —
      // but only if the lock is still fresh (not a stale leftover).
      if (isPending(task.id)) {
        clearPending(task.id);
        return;
      }

      setTasks((prev) => {
        switch (payload.event) {
          case 'created':
            if (prev.some((t) => t.id === task.id)) return prev;
            return sortDesc([task, ...prev]);

          case 'updated':
            return prev.map((t) => (t.id === task.id ? task : t));

          case 'deleted':
            return prev.filter((t) => t.id !== task.id);

          default:
            return prev;
        }
      });
    }

    socket.on('taskUpdated', handleTaskUpdate);
    return () => {
      socket.off('taskUpdated', handleTaskUpdate);
    };
  }, [isPending, clearPending]);

  // ----------------------------------------------------------
  //  Mutations (optimistic)
  // ----------------------------------------------------------

  const addTask = useCallback(
    async (input: CreateTaskInput) => {
      const tempId = -Date.now();
      const now = new Date().toISOString();

      const optimistic: Task = {
        id: tempId,
        task: input.task,
        completed: input.completed ?? false,
        createdAt: now,
        updatedAt: now,
        completedAt: input.completed ? now : null,
      };

      setTasks((prev) => sortDesc([optimistic, ...prev]));

      try {
        const created = await createTask(input);
        markPending(created.id);

        // Idempotent swap: remove temp, insert real only if not already present
        setTasks((prev) => {
          const withoutTemp = prev.filter((t) => t.id !== tempId);
          if (withoutTemp.some((t) => t.id === created.id)) return withoutTemp;
          return sortDesc([created, ...withoutTemp]);
        });

        return created;
      } catch (err) {
        setTasks((prev) => prev.filter((t) => t.id !== tempId));
        clearPending(tempId);
        throw err;
      }
    },
    [markPending, clearPending],
  );

  const toggleTask = useCallback(
    async (id: number, completed: boolean) => {
      const snapshot = tasks;
      markPending(id);

      setTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                completed,
                completedAt: completed ? new Date().toISOString() : null,
              }
            : t,
        ),
      );

      try {
        await updateTask(id, { completed });
        // No explicit clear here — the WS echo clears it, and if the echo
        // never arrives, the lock auto-expires after PENDING_TTL.
      } catch (err) {
        clearPending(id);
        setTasks(snapshot);
        throw err;
      }
    },
    [tasks, markPending, clearPending],
  );

  const removeTask = useCallback(
    async (id: number) => {
      const snapshot = tasks;
      markPending(id);

      setTasks((prev) => prev.filter((t) => t.id !== id));

      try {
        await deleteTask(id);
        // Same as toggle — the WS echo or TTL handles cleanup.
      } catch (err) {
        clearPending(id);
        setTasks(snapshot);
        throw err;
      }
    },
    [tasks, markPending, clearPending],
  );

  return {
    tasks,
    loading,
    error,
    refetch: fetchTasks,
    addTask,
    toggleTask,
    removeTask,
  };
}