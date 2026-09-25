import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="font-display text-8xl font-bold text-[var(--cat)]">404</p>
      <p className="text-dim">This experiment doesn&apos;t exist (yet).</p>
      <Link href="/" className="btn btn-primary">Back to the lab</Link>
    </div>
  );
}
