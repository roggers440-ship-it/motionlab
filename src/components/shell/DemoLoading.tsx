export function DemoLoading() {
  return (
    <div className="flex h-full min-h-[50vh] w-full items-center justify-center" role="status" aria-label="Loading demo">
      <span className="size-8 rounded-full border-2 border-white/15 border-t-[var(--cat)]" style={{ animation: 'ml-spin 0.8s linear infinite' }} />
    </div>
  );
}
