import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  categories,
  categoryById,
  demosIn,
  isCategory,
} from "@/demos/registry";
import { DemoCard } from "@/components/shell/DemoCard";
import { HueSetter } from "@/components/shell/HueSetter";

type Props = { params: Promise<{ category: string }> };

export function generateStaticParams() {
  return categories.map((c) => ({ category: c.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const c = isCategory(category) ? categoryById.get(category) : undefined;
  if (!c) return {};
  const url = `/lab/${c.id}`;
  return {
    title: `${c.index} ${c.title}`,
    description: c.tagline,
    alternates: { canonical: url },
    openGraph: {
      url,
      title: `${c.title} · web animation demos`,
      description: c.tagline,
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  if (!isCategory(category)) notFound();
  const c = categoryById.get(category)!;
  const list = demosIn(category);
  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-24 pt-10 md:px-8">
      <HueSetter hue={c.hue} />
      <nav aria-label="Breadcrumb" className="eyebrow mb-6">
        <Link href="/" className="hover:text-fg">
          Lab
        </Link>{" "}
        / {c.index}
      </nav>
      <div className="mb-12 flex flex-wrap items-end gap-6">
        <span className="font-display text-8xl font-bold leading-none text-[var(--cat)]">
          {c.index}
        </span>
        <div className="max-w-2xl">
          <h1 className="font-display text-5xl font-semibold tracking-tight">
            {c.title}
          </h1>
          <p className="mt-2 text-lg text-dim">{c.tagline}</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {list.map((d, i) => (
          <DemoCard key={d.slug} d={d} i={i} />
        ))}
      </div>
    </div>
  );
}
