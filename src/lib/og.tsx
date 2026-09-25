// Shared layout for generated social-share images (1200×630).
import { ImageResponse } from 'next/og';
import { site } from './site';

export const ogSize = { width: 1200, height: 630 };

export function ogImage({ eyebrow, title, subtitle, hue = 320 }: { eyebrow: string; title: string; subtitle: string; hue?: number }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 72,
          color: '#ecebf5', backgroundColor: '#07070b',
          backgroundImage: `radial-gradient(900px 500px at 85% 0%, hsla(${hue}, 90%, 60%, 0.45), transparent 60%), radial-gradient(700px 400px at 0% 100%, hsla(${hue + 60}, 80%, 55%, 0.3), transparent 60%)`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 30, fontWeight: 700 }}>
          <div style={{ width: 40, height: 40, borderRadius: 999, border: `6px solid hsl(${hue}, 90%, 70%)`, display: 'flex' }} />
          {site.name}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ fontSize: 26, letterSpacing: 4, textTransform: 'uppercase', color: `hsl(${hue}, 90%, 75%)` }}>{eyebrow}</div>
          <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2 }}>{title}</div>
          <div style={{ fontSize: 32, color: '#b3b2c6', maxWidth: 960 }}>{subtitle}</div>
        </div>
        <div style={{ display: 'flex', fontSize: 24, color: '#8a89a0' }}>{site.url.replace('https://', '')}</div>
      </div>
    ),
    ogSize,
  );
}
