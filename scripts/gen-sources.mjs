// Copies each demo's source into /public/sources/<slug>.txt so the Code tab
// can lazy-fetch it. Runs automatically before `dev` and `build`.
// A demo = src/demos/<category>/<slug>.tsx plus any helpers named <slug>.*.ts(x)
import { readdirSync, readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const demosDir = join(root, 'src', 'demos');
const out = join(root, 'public', 'sources');
mkdirSync(out, { recursive: true });

let count = 0;
for (const cat of readdirSync(demosDir)) {
  const dir = join(demosDir, cat);
  if (!statSync(dir).isDirectory()) continue;
  const files = readdirSync(dir).filter((f) => /\.(tsx?|glsl)$/.test(f));
  const mains = files.filter((f) => f.split('.').length === 2 && f.endsWith('.tsx'));
  for (const main of mains) {
    const slug = basename(main, '.tsx');
    const parts = [main, ...files.filter((f) => f !== main && f.startsWith(slug + '.'))];
    const text = parts
      .map((f) => (parts.length > 1 ? `// ───────── src/demos/${cat}/${f} ─────────\n` : '') + readFileSync(join(dir, f), 'utf8'))
      .join('\n\n');
    writeFileSync(join(out, `${slug}.txt`), text);
    count++;
  }
}
console.log(`gen-sources: ${count} demo sources → public/sources`);
