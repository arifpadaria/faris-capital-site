/**
 * Generates a Medium-ready Markdown file for one perspective at
 * medium-export/<id>.md. Not deployed with the site — a local staging
 * area you paste from into Medium's editor by hand (Medium has no
 * public API for creating posts anymore).
 */

const fs = require('fs');
const path = require('path');

const SITE = 'https://faris-capital.com';

// Minimal HTML -> Markdown for the simple tag set used in the data file
// (<p>, <br>, plain text). Good enough for Medium's paste importer.
function htmlToMarkdown(html) {
  return html
    .trim()
    .split(/\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const m = line.match(/^<p>([\s\S]*)<\/p>$/);
      const inner = m ? m[1] : line;
      return inner.replace(/<br\s*\/?>/gi, '  \n');
    })
    .join('\n\n');
}

function writeMediumFile(thesis, THEMES, repoDir) {
  const outDir = path.join(repoDir, 'medium-export');
  fs.mkdirSync(outDir, { recursive: true });

  const themeLabel = thesis.theme && THEMES[thesis.theme] ? THEMES[thesis.theme].label : '';
  const canonicalUrl = `${SITE}/theses/${thesis.id}.html`;
  const body = htmlToMarkdown(thesis.content);
  const teaser = String(thesis.teaser || '').split(/\n+/).filter(Boolean).join(' ');

  const md = `<!--
Title: ${thesis.title}
Subtitle (use as Medium subtitle): ${teaser}
Date originally published: ${thesis.date}
Theme: ${themeLabel}
Canonical URL to set in Medium (Story settings -> ... -> "Change canonical link"): ${canonicalUrl}
Original LinkedIn post: ${thesis.linkedinUrl || 'N/A'}
-->

# ${thesis.title}

${body}

---

*Originally published on [LinkedIn](${thesis.linkedinUrl || ''}) and [Faris Capital](${canonicalUrl}).*
`;

  const outPath = path.join(outDir, `${thesis.id}.md`);
  fs.writeFileSync(outPath, md, 'utf8');
  return outPath;
}

module.exports = { writeMediumFile };
