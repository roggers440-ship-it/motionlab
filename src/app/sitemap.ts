import type { MetadataRoute } from 'next';
import { categories, demos } from '@/demos/registry';
import { site } from '@/lib/site';

// /sitemap.xml — every page, generated from the registry (new demos are added automatically)
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: site.url, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    ...categories.map((c) => ({ url: `${site.url}/lab/${c.id}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.8 })),
    ...demos.map((d) => ({
      url: `${site.url}/lab/${d.category}/${d.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: d.depth === 'showcase' ? 0.7 : 0.5,
    })),
  ];
}
