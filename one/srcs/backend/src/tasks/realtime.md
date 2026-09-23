# Realtime Feature — Main Logic & Best Practices

A reference for how realtime works in this app, and how to add a new realtime feature the same way.

---

## 🧠 The Core Mental Model

> **HTTP is for mutations. WebSocket is for propagating the results.**
>
> Every state change follows the same path: **client sends → server writes → server broadcasts → all clients (including the sender) reconcile.**

Three principles:

1. **The database is the single source of truth.** Nobody updates UI state without the server confirming.
2. **The server broadcasts after every successful write.** One emit per DB mutation. No exceptions.
3. **The client updates optimistically, then trusts the broadcast as confirmation.** The broadcast clears the "pending" lock; a timeout is the safety net.

---

## 🔄 The Main Logic

### Flow of a mutation

```
User clicks toggle
    ↓
Frontend: optimistic state update + markPending(id)
    ↓
Frontend: HTTP PATCH /tasks/:id
    ↓
Backend: validate → write to DB → emitTaskUpdate('updated', task)
    ↓
WebSocket: broadcast to all clients in 'tasks' namespace
    ↓
Frontend (all tabs):
    ├─ Tab that made the change → sees id in pendingIds → clears lock, skips state update
    └─ Other tabs → applies the event to their state
    ↓
UI re-renders everywhere
```

### The three roles

| Layer | Responsibility |
|-------|----------------|
| **Service** | Do the DB write, then call `gateway.emit(...)`. This is where the broadcast belongs. |
| **Gateway** | Pure transport. Broadcasts to a namespace. Never queries the DB. Never depends on the service. |
| **Frontend hook** | Owns state, subscribes to the WS, merges events, tracks pending IDs, rolls back on HTTP failure. |

---

## 🧩 The Five Files You Touch Per Realtime Feature

For every new realtime feature, you touch exactly these:

```
1. backend/src/<feature>/<feature>.gateway.ts     ← new gateway (namespace)
2. backend/src/<feature>/<feature>.service.ts     ← inject gateway, emit after each write
3. backend/src/<feature>/<feature>.module.ts      ← register gateway in providers
4. frontend/lib/use<Feature>.ts                   ← hook: fetch + subscribe + mutate
5. frontend/lib/socket.ts                         ← reuse (or add a namespace if needed)
```

Everything else (components, forms, list items) just consumes the hook.

---

## ✅ Best Practices

### Backend

**1. Broadcast from the service, never the controller.**

The service is the only layer that knows when a write actually succeeded. Broadcast there so any future caller (GraphQL, CLI, cron, WebSocket message) gets the broadcast for free.

```typescript
// ✅
async update(id, dto) {
  const task = await this.prisma.task.update({ ... });
  this.gateway.emitTaskUpdate('updated', task);
  return task;
}

// ❌ Controller emits — breaks the moment you add another entry point
```

**2. Emit only after the DB operation resolves.**

```typescript
// ✅
const task = await this.prisma.task.create({ ... });
this.gateway.emit('created', task);

// ❌
this.gateway.emit('created', dto);   // dto has no id, no timestamps
await this.prisma.task.create({ ... });
```

**3. Use idempotency guards on updates.**

If the client sends a value equal to the current one, don't write to the DB and don't broadcast. This prevents event floods and timestamp churn.

```typescript
if (dto.completed !== undefined && dto.completed !== existing.completed) {
  data.completed = dto.completed;
  data.completedAt = dto.completed ? new Date() : null;
}

if (Object.keys(data).length === 0) return existing;   // no-op
```

**4. One gateway per domain, one namespace per gateway.**

`tasks` namespace for tasks, `notifications` for notifications, `chat` for chat. Never reuse a namespace across unrelated features.

```typescript
@WebSocketGateway({ namespace: 'tasks', cors: { origin: true, credentials: true } })
```

**5. Register the gateway in the module's `providers`.**

Forgetting this is the #1 cause of "the app boots but `/socket.io/` returns 404".

```typescript
@Module({
  providers: [TasksService, TasksGateway],   // BOTH
})
```

**6. Keep the gateway pure.**

The gateway's only job is to broadcast. Never inject the service into the gateway. If you ever need to look up data at connect time, do it in a middleware or in the module's `onModuleInit`, not inside the gateway.

**7. Event names should be past tense.**

`created`, `updated`, `deleted` — describes what already happened. Never `create`, `update` (which implies a request).

**8. Shape events consistently.**

Always `{ event, <entity> }`. Never send bare payloads.

```typescript
this.server.emit('taskUpdated', { event: 'created', task });
```

---

### Frontend

**9. One hook per realtime feature.**

`useTasks`, `useNotifications`, `useChat`. The hook owns:
- Fetching the initial list
- The WebSocket subscription
- Optimistic mutations
- Pending-ID tracking
- Rollback on failure

Components just call the hook and render.

**10. Call the hook once, pass down as props.**

Never call `useTasks()` in multiple components. Each call creates its own state and its own WS handler — you'll get duplicate state and duplicate keys.

```typescript
// ✅ TaskList calls useTasks, passes addTask/toggleTask/removeTask down
// ❌ TaskItem calls useTasks, duplicating the entire state
```

**11. Use functional state updaters.**

```typescript
// ✅
setTasks((prev) => prev.filter((t) => t.id !== id));

// ❌ (stale closure risk)
setTasks(tasks.filter((t) => t.id !== id));
```

This is why the WS effect can safely have `[]` as its dependency array — the handler never reads `tasks` directly.

**12. The subscription effect must have `[]`.**

```typescript
useEffect(() => {
  const socket = getSocket();
  socket.on('taskUpdated', handler);
  return () => socket.off('taskUpdated', handler);
}, []);   // ← never re-run
```

Re-subscribing on every state change tears down and rebuilds the listener, opening windows where events are dropped.

**13. Validate WS payloads with Zod.**

The HTTP layer validates with `taskSchema.parse(...)`. The WS layer must too. Otherwise a schema drift silently corrupts state.

```typescript
const parsed = taskSchema.safeParse(payload.task);
if (!parsed.success) { console.error(...); return; }
```

**14. Use a self-expiring pending-ID guard.**

This is the single most important defensive pattern. It prevents the "event was skipped because of a stale lock" bug.

```typescript
const pendingIds = useRef(new Map<number, number>());

markPending(id)  // set(id, Date.now())
isPending(id)    // true only if fresh (< 5s), auto-deletes otherwise
clearPending(id) // delete(id)
```

Rules:
- Mark on every optimistic mutation
- Clear in the WS handler when the echo arrives
- Auto-expire after ~5s as a safety net

**15. Optimistic + idempotent swap for creates.**

Creating a task inserts a temp (negative ID) and swaps it for the real one when the HTTP response arrives. The swap must be idempotent, because the WS `created` event may arrive first:

```typescript
setTasks((prev) => {
  const withoutTemp = prev.filter((t) => t.id !== tempId);
  if (withoutTemp.some((t) => t.id === created.id)) return withoutTemp;
  return sortDesc([created, ...withoutTemp]);
});
```

**16. Roll back on HTTP failure.**

```typescript
const snapshot = tasks;
// ... optimistic update ...
try {
  await updateTask(id, { completed });
} catch (err) {
  setTasks(snapshot);   // restore
  throw err;
}
```

Never leave the UI in a state the server disagrees with.

**17. Never trigger a refetch after a mutation.**

The WS event is the source of truth. `refetch()` after a POST doubles the work and causes flicker. Call it once on mount, and only again on explicit user action (like a "refresh" button).

---

### Deployment / Infra

**18. nginx must proxy WebSocket upgrades for the Socket.IO path.**

```nginx
location /nest/socket.io/ {
  proxy_pass http://backend/socket.io/;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_read_timeout 86400s;
  proxy_send_timeout 86400s;
}
```

Without `Upgrade` and `Connection`, the handshake is stripped and Socket.IO falls back to polling (or fails).

**19. Match the path on both sides.**

If the frontend uses `path: '/nest/socket.io'`, nginx must have a matching `location /nest/socket.io/` that rewrites to `/socket.io/` on the backend.

**20. Don't force `transports: ['websocket']` until upgrade headers are verified.**

Let Socket.IO negotiate. Once nginx is confirmed to handle upgrades, you can force WebSocket-only for lower latency.

---

## 🧪 The Debugging Checklist

Whenever realtime doesn't work, check in this order:

| # | Check | Command / Place |
|---|-------|-----------------|
| 1 | Gateway registered? | Backend boot log: `TasksGateway subscribed to the "tasks" namespace` |
| 2 | Socket.IO mounted? | `curl http://localhost:3000/socket.io/?EIO=4&transport=polling` → starts with `0{"sid":` |
| 3 | nginx proxying? | `curl https://localhost:9000/nest/socket.io/... -k` → same |
| 4 | Clients connecting? | Backend log: `[ws] client connected: <id>` |
| 5 | Service emitting? | Backend log (add `console.log` in `emitTaskUpdate`) |
| 6 | Frames arriving? | DevTools → Network → WS → Messages: `42["taskUpdated",...]` |
| 7 | Handler processing? | Browser console: no `[ws] invalid payload`, no stale-skip log |
| 8 | State updating? | React DevTools → check the hook's state |

Each check isolates one layer. The first one that fails is where the bug lives.

---

## 🎯 The Template for a New Realtime Feature

Say you're adding realtime **notifications**.

### Backend

**`notifications/notifications.gateway.ts`**
```typescript
@WebSocketGateway({ namespace: 'notifications', cors: { origin: true, credentials: true } })
export class NotificationsGateway {
  @WebSocketServer() server!: Server;

  emitNotification(event: 'created' | 'read' | 'deleted', notification: unknown) {
    this.server.emit('notificationUpdated', { event, notification });
  }
}
```

**`notifications/notifications.service.ts`** — inject the gateway, call `emitNotification` after each write.

**`notifications/notifications.module.ts`** — register both service and gateway in `providers`.

### Frontend

**`lib/socket.ts`** — add a second namespace helper:
```typescript
export function getNotificationSocket(): Socket {
  // same pattern, namespace: 'notifications'
}
```

**`lib/useNotifications.ts`** — copy the `useTasks` structure:
- State: `notifications`, `loading`, `error`
- Fetch on mount
- Subscribe to `notificationUpdated` in an effect with `[]`
- Zod schema for `Notification`
- Pending-ID Map with TTL
- Optimistic mutations (mark, update, clear or expire)

**`components/Notifications/`** — the list, form, item. Same shape as `TaskList`, `TaskForm`, `TaskItem`.

### nginx

If the new feature uses a different path, add a matching `location` block. If it uses the same Socket.IO endpoint (just a different namespace), **no nginx change is needed** — namespaces multiplex over one connection.

---

## 📋 The Golden Rules (Condensed)

1. **Service broadcasts. Gateway transmits.**
2. **Emit only after a successful DB write.**
3. **One gateway per domain, one namespace per gateway.**
4. **Register the gateway in `providers`.**
5. **Frontend: one hook, called once, passed down as props.**
6. **Subscriptions have `[]` deps and use functional state updates.**
7. **Validate every WS payload with Zod.**
8. **Optimistic updates + idempotent swaps + rollback on failure.**
9. **Self-expiring pending-ID guard (Map with TTL).**
10. **No refetch after mutations — the WS event is the source of truth.**

Follow those ten and you can add a realtime feature for any resource in about an hour — the pattern is identical every time.