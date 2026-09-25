import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { demoBySlug, demos } from '@/demos/registry';
import { DemoShell } from '@/components/shell/DemoShell';

type Props = { params: Promise<{ category: string; slug: string }> };

// Every demo is a static, shareable, indexable route.
export function generateStaticParams() {
  return demos.map((d) => ({ category: d.category, slug: d.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const d = demoBySlug.get(slug);
  return d ? { title: d.title, description: d.blurb } : {};
}

export default async function DemoPage({ params }: Props) {
  const { category, slug } = await params;
  const d = demoBySlug.get(slug);
  if (!d || d.category !== category) notFound();
  return <DemoShell slug={slug} />;
}
