import TaskList from '@/components/TaskList/TaskList';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-background px-4 py-12">
      <div className="w-full max-w-xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Tasks</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Realtime task manager
          </p>
        </header>
        <TaskList />
      </div>
    </main>
  );
}