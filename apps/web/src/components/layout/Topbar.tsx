export function Topbar() {
  return (
    <header className="flex items-center gap-4 px-4 lg:px-6 h-14 border-b border-[--color-border] bg-[--color-canvas]/80 backdrop-blur sticky top-0 z-10">
      <div className="flex-1">
        <input
          type="search"
          placeholder="Поиск по всему…"
          className="w-full max-w-md px-3 py-2 rounded-lg border border-[--color-border] bg-[--color-surface] text-sm focus:outline-none focus:ring-2 focus:ring-[--color-brand-from]"
        />
      </div>
    </header>
  );
}
