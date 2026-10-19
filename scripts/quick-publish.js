#!/usr/bin/env node

/**
 * Non-interactive publisher: pass title/teaser/body/link as flags and it
 * saves, commits, and pushes in one run. Deployment is CI-only: the push
 * triggers GitHub Actions, which deploys via keyless Workload Identity
 * Federation. There is no Firebase login or local deploy step. For the guided
 * copy-paste-and-confirm flow, use scripts/publish.js instead.
 *
 * Usage:
 *   node scripts/quick-publish.js \
 *     --title "Post Title" \
 *     --teaser "1-3 sentence teaser for the grid card" \
 *     --body-file /path/to/body.txt \
 *     --link "https://www.linkedin.com/pulse/..." \
 *     [--theme physical-ai|governance|agentic-infra|venture]  (default: agentic-infra) \
 *     [--no-push]    save + commit locally, skip git push (so nothing deploys)
 *
 * --body can be used instead of --body-file for short inline text.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { formatContent, validateDatabase } = require('./publisher-safety');
const { writeMediumFile } = require('./medium-export');

const repoDir = path.join(__dirname, '..');
const THEME_KEYS = ['physical-ai', 'governance', 'agentic-infra', 'venture'];

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) {
      out[key] = true;
    } else {
      out[key] = next;
      i++;
    }
  }
  return out;
}

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

function toSlug(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Same LinkedIn copy-paste cleanup as the interactive publisher.
function sanitizeText(text) {
  let out = text.trim();
  out = out.replace(/(?:\s|,)*(?:hashtag#\w+(?:\s|,)*)+$/g, '').trim();
  out = out.replace(/hashtag#(\w+)/g, '$1');
  const months = '(?:January|February|March|April|May|June|July|August|September|October|November|December)';
  out = out.replace(new RegExp(`^${months} \\d{1,2}, \\d{4}\\s*\\n+`), '');
  return out;
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(
      'Usage: node scripts/quick-publish.js --title "..." --teaser "..." ' +
      '(--body "..." | --body-file path.txt) [--link URL] ' +
      `[--theme ${THEME_KEYS.join('|')}] [--no-push]`
    );
    return;
  }

  const title = args.title;
  const teaser = args.teaser;
  const link = typeof args.link === 'string' ? args.link : null;
  const theme = args.theme || 'agentic-infra';
  let body = typeof args.body === 'string' ? args.body : null;
  if (args['body-file']) {
    body = fs.readFileSync(path.resolve(String(args['body-file'])), 'utf8');
  }

  if (!title || typeof title !== 'string') fail('--title is required');
  if (!teaser || typeof teaser !== 'string') fail('--teaser is required');
  if (!body) fail('--body or --body-file is required');
  if (!THEME_KEYS.includes(theme)) fail(`--theme must be one of: ${THEME_KEYS.join(', ')}`);

  const dirty = execFileSync('git', ['status', '--porcelain'], { cwd: repoDir, encoding: 'utf8' });
  if (dirty.trim()) fail('Working tree is not clean. Commit or stash existing changes before publishing.');

  const id = toSlug(title);
  const teaserText = sanitizeText(teaser);
  const rawContent = sanitizeText(body);
  const formattedContent = formatContent(rawContent);
  const publishDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/New_York'
  });

  const dataFilePath = path.join(repoDir, 'content/perspectives.json');
  const originalDatabase = fs.readFileSync(dataFilePath, 'utf8');
  const database = JSON.parse(originalDatabase);
  database.posts.unshift({
    id, theme, title, date: publishDate, teaser: teaserText, content: formattedContent, linkedinUrl: link
  });
  validateDatabase(database);

  const indexHtml = fs.readFileSync(path.join(repoDir, 'index.html'), 'utf8');
  const version = Number(indexHtml.match(/\?v=(\d+)/)?.[1] || 1) + 1;
  const output = {};
  const expected = { 'content/perspectives.json': originalDatabase };
  for (const name of fs.readdirSync(repoDir).filter(f => f.endsWith('.html'))) {
    expected[name] = fs.readFileSync(path.join(repoDir, name), 'utf8');
    output[name] = expected[name].replace(/\?v=\d+/g, `?v=${version}`);
  }
  expected['js/components.js'] = fs.readFileSync(path.join(repoDir, 'js/components.js'), 'utf8');
  output['js/components.js'] = expected['js/components.js'].replace(/\?v=\d+/g, `?v=${version}`);
  Object.assign(output, require('./generate-thesis-pages').buildSite(database, output['index.html'], output['investment-theses.html']));
  output['content/perspectives.json'] = JSON.stringify(database, null, 2) + '\n';
  const backup = require('./site-writer').writeOutputs(repoDir, output, fs, expected);
  console.log(`ℹ Recovery snapshot: ${path.relative(repoDir, backup)}`);

  const mediumPath = writeMediumFile(
    { id, theme, title, date: publishDate, teaser: teaserText, content: formattedContent, linkedinUrl: link },
    database.themes,
    repoDir
  );
  console.log(`ℹ Medium draft ready: ${path.relative(repoDir, mediumPath)}`);
  console.log(`✓ Saved perspective "${title}" (${id})`);

  require('./build-public').buildPublic(repoDir);
  console.log('✓ Rebuilt dist/');

  execFileSync('git', ['add', '-A'], { cwd: repoDir });
  execFileSync('git', ['commit', '-m', `Add perspective: ${title}\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`], {
    cwd: repoDir, stdio: 'inherit'
  });
  console.log('✓ Committed');

  if (args['no-push']) {
    console.log('Skipping push (--no-push). Run `git push origin main` when ready.');
    return;
  }
  execFileSync('git', ['push', 'origin', 'main'], {
    cwd: repoDir, stdio: 'inherit', env: { ...process.env, GIT_TERMINAL_PROMPT: '0' }
  });
  console.log('✓ Pushed to origin/main. GitHub Actions now tests, builds and deploys; check the run (gh run list --limit 1) and the live site.');
}

main();
