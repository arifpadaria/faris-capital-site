'use strict';

// New publisher input is plain text. Existing curated HTML remains unchanged.
function escapeHtml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatContent(text) {
  return String(text).split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)
    .map(p => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`).join('\n      ');
}

function serializeEntry(entry) {
  // JSON string values cannot execute template-literal interpolation or break
  // out through backticks. Escaping '<' also makes script-tag embedding safe.
  return '  ' + JSON.stringify(entry, null, 2).replace(/</g, '\\u003c') + ',\n';
}

module.exports = { escapeHtml, formatContent, serializeEntry };

function validateDatabase(data) {
  if (!data || !data.themes || !Array.isArray(data.posts)) throw new Error('Invalid content database');
  const ids = new Set();
  for (const [key, theme] of Object.entries(data.themes)) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key) || typeof theme.label !== 'string') throw new Error('Invalid theme');
  }
  for (const post of data.posts) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.id || '')) throw new Error('Invalid article slug');
    if (ids.has(post.id)) throw new Error(`Duplicate article slug: ${post.id}`);
    ids.add(post.id);
    for (const key of ['title', 'teaser', 'content', 'date']) {
      if (typeof post[key] !== 'string' || !post[key].trim()) throw new Error(`Missing article ${key}`);
    }
    if (!Number.isFinite(Date.parse(post.date))) throw new Error('Invalid publication date');
    if (post.theme && !Object.hasOwn(data.themes, post.theme)) throw new Error('Unknown article theme');
    // The existing library contains only paragraphs and line breaks. Preserve
    // those exactly; reject every other raw HTML construct and all attributes.
    if (post.content.replace(/<\/?p>|<br\s*\/?>/g, '').includes('<')) throw new Error('Unsupported article HTML');
    if (post.image && !/^\/images\/covers\/[a-z0-9-]+\.(jpg|png)$/.test(post.image)) throw new Error('Invalid article image path');
    if (post.linkedinUrl) {
      const url = new URL(post.linkedinUrl);
      if (url.protocol !== 'https:' || !['linkedin.com', 'www.linkedin.com'].includes(url.hostname) || url.username || url.password || url.port) {
        throw new Error('Article link must be an HTTPS LinkedIn URL');
      }
    }
  }
  return data;
}
module.exports.validateDatabase = validateDatabase;
