import { ogImage, ogSize } from '@/lib/og';
import { categoryById, demoBySlug } from '@/demos/registry';

export const size = ogSize;
export const contentType = 'image/png';
export const alt = 'MotionLab demo preview';

// One share image per demo, generated at build time. (Next 16: params is a Promise.)
export default async function Image({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { slug } = await params;
  const d = demoBySlug.get(slug);
  const c = d ? categoryById.get(d.category) : undefined;
  return ogImage({
    eyebrow: c ? `${c.index} · ${c.title}` : 'Demo',
    title: d?.title ?? 'MotionLab',
    subtitle: d ? d.libs.join(' · ') : '',
    hue: c?.hue,
  });
}
