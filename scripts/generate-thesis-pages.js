#!/usr/bin/env node

/**
 * Generates one static HTML page per investment thesis at theses/<id>.html.
 *
 * Why static pages: LinkedIn/WhatsApp link scrapers don't execute JavaScript,
 * so the old article.html?id=… URLs shared with a generic title and no image.
 * These pages carry real per-article <title>/description/Open Graph tags.
 *
 * Run: node scripts/generate-thesis-pages.js
 * (publish.js runs this automatically after adding a thesis.)
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoDir = path.join(__dirname, '..');
const outDir = path.join(repoDir, 'theses');
const SITE = 'https://faris-capital.com';

// Load the theses array from the data file
const dataRaw = fs.readFileSync(path.join(repoDir, 'js/investment-theses-data.js'), 'utf8');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(dataRaw + '\n;__theses = INVESTMENT_THESES;', ctx);
const theses = ctx.__theses;

// Match the cache-busting version currently used by the site
const indexHtml = fs.readFileSync(path.join(repoDir, 'index.html'), 'utf8');
const vMatch = indexHtml.match(/\?v=(\d+)/);
const V = vMatch ? vMatch[1] : '1';

function escapeAttr(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Escapes a string for safe embedding inside a <script type="application/ld+json">
// block — JSON.stringify handles quoting/escaping; the extra replace guards
// against "</script>" appearing in article text and closing the tag early.
function jsonLdString(str) {
  return JSON.stringify(String(str || '')).replace(/</g, '\\u003c');
}

// First paragraph of the teaser, single line, capped for meta descriptions
function metaDescription(teaser) {
  const first = String(teaser || '').split(/\n+/)[0].trim();
  return first.length > 250 ? first.slice(0, 247).replace(/\s+\S*$/, '') + '…' : first;
}

function isoDate(dateStr) {
  const d = new Date(dateStr);
  return isNaN(d) ? null : d.toISOString().slice(0, 10);
}

function pageHtml(t) {
  const url = `${SITE}/theses/${t.id}.html`;
  const title = escapeAttr(`${t.title} — Faris Capital`);
  const desc = escapeAttr(metaDescription(t.teaser));
  const published = isoDate(t.date);

  const teaserHtml = String(t.teaser || '')
    .split(/\n+/)
    .map(l => l.trim())
    .filter(Boolean)
    .map(l => `<p style="margin-bottom: 0.75rem;">${l}</p>`)
    .join('\n                ');

  const linkedinBlock = t.linkedinUrl ? `
                <div style="border-top: 1px solid var(--border-color); padding-top: 2rem; margin-top: 3rem; display: flex; flex-direction: column; gap: 1rem;">
                    <p style="font-size: 0.95rem; color: var(--text-secondary); margin: 0; font-family: var(--font-body); font-weight: 300;">This thesis was originally published on LinkedIn. Join the discussion, add your thoughts, and follow for regular updates.</p>
                    <a href="${escapeAttr(t.linkedinUrl)}" target="_blank" rel="noopener" class="btn btn-secondary" style="display: inline-flex; align-items: center; gap: 0.5rem; align-self: flex-start; padding: 0.75rem 1.5rem; font-size: 0.8rem; font-weight: 600;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="display: inline-block; vertical-align: middle;"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                        View on LinkedIn
                    </a>
                </div>` : '';

  return `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="description" content="${desc}">
    <link rel="canonical" href="${url}">
    <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32.png">
    <link rel="icon" type="image/png" sizes="192x192" href="/images/favicon-192.png">
    <link rel="apple-touch-icon" href="/images/apple-touch-icon.png">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="Faris Capital">
    <meta property="og:title" content="${escapeAttr(t.title)}">
    <meta property="og:description" content="${desc}">
    <meta property="og:url" content="${url}">
    <meta property="og:image" content="${SITE}/images/og-image.png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">${published ? `\n    <meta property="article:published_time" content="${published}">` : ''}
    <meta property="article:author" content="Arif Padaria">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeAttr(t.title)}">
    <meta name="twitter:description" content="${desc}">
    <meta name="twitter:image" content="${SITE}/images/og-image.png">
    <link rel="stylesheet" href="/css/style.css?v=${V}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": ${jsonLdString(t.title)},
      "description": ${jsonLdString(desc)},
      "url": ${jsonLdString(url)},
      "image": "${SITE}/images/og-image.png"${published ? `,\n      "datePublished": "${published}"` : ''},
      "author": {
        "@type": "Person",
        "name": "Arif Padaria"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Faris Capital",
        "logo": {
          "@type": "ImageObject",
          "url": "${SITE}/images/favicon-192.png"
        }
      }
    }
    </script>
</head>

<body>

    <header></header>

    <main>
        <!-- Header spacer to push content below sticky nav -->
        <div style="height: var(--header-height);"></div>

        <section class="section container">
            <div style="margin-bottom: 2rem;">
                <a href="/investment-theses.html" style="font-size: 0.95rem; font-weight: 600; text-decoration: none; color: var(--accent-color); display: inline-flex; align-items: center; gap: 0.5rem;">
                    <span>←</span> Back to Investment Theses
                </a>
            </div>

            <article style="max-width: 760px; margin: 0 auto; padding: 1rem 0 4rem 0;">
                <div style="font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--accent-gold); font-weight: 600; margin-bottom: 1rem;">${escapeAttr(t.date)}</div>

                <h1 style="font-size: clamp(2rem, 5vw, 3rem); line-height: 1.2; margin-bottom: 1.5rem; color: var(--text-primary); font-family: var(--font-heading); font-weight: 700;">${escapeAttr(t.title)}</h1>

                <div style="font-size: 1.25rem; line-height: 1.6; font-weight: 400; color: var(--text-secondary); margin-bottom: 2.5rem; padding-left: 1.25rem; border-left: 3px solid var(--accent-gold); font-family: var(--font-body);">
                ${teaserHtml}
                </div>

                <div style="font-size: 1.05rem; line-height: 1.8; color: var(--text-primary); margin-bottom: 3.5rem; font-family: var(--font-body); font-weight: 300;">
${t.content.trim()}
                </div>
${linkedinBlock}
            </article>
        </section>
    </main>

    <footer></footer>

    <script src="/js/components.js?v=${V}"></script>
    <script src="/js/main.js?v=${V}"></script>
</body>

</html>
`;
}

fs.mkdirSync(outDir, { recursive: true });

// Remove pages for theses that no longer exist in the data file
const validFiles = new Set(theses.map(t => `${t.id}.html`));
for (const f of fs.readdirSync(outDir)) {
  if (f.endsWith('.html') && !validFiles.has(f)) {
    fs.unlinkSync(path.join(outDir, f));
    console.log(`Removed stale ${f}`);
  }
}

for (const t of theses) {
  if (!t.id) continue;
  fs.writeFileSync(path.join(outDir, `${t.id}.html`), pageHtml(t), 'utf8');
  console.log(`Wrote theses/${t.id}.html`);
}
console.log(`Done: ${theses.length} thesis pages (cache v=${V}).`);

// Regenerate sitemap.xml: static pages + one <url> per thesis, so new posts
// are automatically included without hand-editing this file.
function isoOrToday(dateStr) {
  const d = new Date(dateStr);
  return isNaN(d) ? new Date().toISOString().slice(0, 10) : d.toISOString().slice(0, 10);
}

const staticPages = [
  { loc: '/', priority: '1.0' },
  { loc: '/what-we-do.html', priority: '0.8' },
  { loc: '/investment-theses.html', priority: '0.8' },
  { loc: '/about.html', priority: '0.6' },
  { loc: '/contact.html', priority: '0.6' },
];

const urlEntries = [
  ...staticPages.map(p => `  <url>\n    <loc>${SITE}${p.loc}</loc>\n    <priority>${p.priority}</priority>\n  </url>`),
  ...theses.map(t => `  <url>\n    <loc>${SITE}/theses/${t.id}.html</loc>\n    <lastmod>${isoOrToday(t.date)}</lastmod>\n    <priority>0.7</priority>\n  </url>`),
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries.join('\n')}
</urlset>
`;

fs.writeFileSync(path.join(repoDir, 'sitemap.xml'), sitemap, 'utf8');
console.log(`Wrote sitemap.xml (${staticPages.length + theses.length} URLs).`);
