// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import { readFileSync, readdirSync } from 'node:fs';

// Sitemap lastmod comes from static dates only: src/data/page-dates.json for pages,
// updatedDate (or pubDate) in guide frontmatter for guides. Never the build date.
const pageDates = JSON.parse(readFileSync(new URL('./src/data/page-dates.json', import.meta.url), 'utf8'));
const guidesDir = new URL('./src/content/guides/', import.meta.url);
for (const file of readdirSync(guidesDir).filter((f) => f.endsWith('.md'))) {
  const frontmatter = readFileSync(new URL(file, guidesDir), 'utf8').split('---')[1] ?? '';
  const field = (name) => frontmatter.match(new RegExp(`^${name}:\\s*["']?([^"'\\n]+)`, 'm'))?.[1].trim();
  const slug = field('urlSlug');
  const date = field('updatedDate') ?? field('pubDate');
  if (slug && date) pageDates[`/guides/${slug}/`] = date;
}

export default defineConfig({
  site: 'https://recastcalc.com',
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/admin/'),
      changefreq: 'weekly',
      priority: 0.8,
      serialize(item) {
        const date = pageDates[new URL(item.url).pathname];
        if (date) item.lastmod = new Date(`${date}T00:00:00Z`).toISOString();
        return item;
      },
    }),
    tailwind({
      applyBaseStyles: false,
    }),
  ],
  build: {
    inlineStylesheets: 'auto',
    assets: '_astro',
  },
  compressHTML: true,
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
});
