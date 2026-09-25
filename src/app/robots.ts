import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';

// /robots.txt
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/sources/'] }, // raw demo sources: no need to index
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
