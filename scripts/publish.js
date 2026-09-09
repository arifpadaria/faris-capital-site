#!/usr/bin/env node

/**
 * Enhanced Publishing Tool for Faris Capital Perspectives
 * Accepts reviewed plain text copied from LinkedIn or other sources
 * Batch mode: Add multiple perspectives before deploying
 * Usage: node scripts/publish.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execFileSync } = require('child_process');
const { formatContent, validateDatabase } = require('./publisher-safety');
const { writeMediumFile } = require('./medium-export');

// ANSI colors for terminal UI
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  bgBlue: '\x1b[44m',
  bgGreen: '\x1b[42m'
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true
});

let title = '';
let linkedinUrl = '';
let teaserLines = [];
let contentLines = [];
let publishDate = '';
let theme = '';
let addedPerspectives = []; // Track what we've added in this session

const THEME_OPTIONS = [
  { key: 'physical-ai', label: 'Physical AI & Robotics' },
  { key: 'governance', label: 'AI Governance & Trust' },
  { key: 'agentic-infra', label: 'Agentic Infrastructure' },
  { key: 'venture', label: 'Venture & Capital Strategy' }
];

function clear() {
  console.clear();
}

function header() {
  console.log(`${colors.bgBlue}${colors.bright} FARIS CAPITAL - PERSPECTIVE PUBLISHER ${colors.reset}\n`);
}

function section(title) {
  console.log(`${colors.cyan}${colors.bright}▶ ${title}${colors.reset}`);
}

function prompt(msg) {
  return new Promise(resolve => {
    rl.question(`${colors.yellow}▸ ${msg}${colors.reset}\n`, (ans) => {
      resolve(ans.trim());
    });
  });
}

function success(msg) {
  console.log(`${colors.green}✓ ${msg}${colors.reset}`);
}

function error(msg) {
  console.log(`${colors.red}✗ ${msg}${colors.reset}`);
}

function info(msg) {
  console.log(`${colors.dim}ℹ ${msg}${colors.reset}`);
}

async function selectSource() {
  await linkedinFlow();
}

async function linkedinFlow() {
  clear();
  header();
  section('Publishing from LinkedIn Post');

  title = await prompt('Article Title');
  if (!title) {
    error('Title cannot be empty.');
    return linkedinFlow();
  }

  linkedinUrl = await prompt('LinkedIn Post URL (optional — press Enter to skip)');
  // LinkedIn URL is optional for manual entry

  console.log('\n' + colors.dim + 'Paste the teaser (1-3 sentences). Type END on a new line when done:' + colors.reset);
  teaserLines = await multilineInput();

  if (!teaserLines.join('\n').trim()) {
    error('Teaser cannot be empty.');
    return linkedinFlow();
  }

  console.log('\n' + colors.dim + 'Paste the full article content. Type END on a new line when done:' + colors.reset);
  contentLines = await multilineInput();

  if (!contentLines.join('\n').trim()) {
    error('Content cannot be empty.');
    return linkedinFlow();
  }

  const detectedDate = extractDateFromText(contentLines.join('\n'));
  publishDate = detectedDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/New_York' });

  await selectTheme();
}

async function selectTheme() {
  console.log('\n' + colors.dim + 'Which theme does this belong to?' + colors.reset);
  THEME_OPTIONS.forEach((t, i) => console.log(`  ${colors.bright}${i + 1}${colors.reset} ${t.label}`));

  const choice = await prompt(`Choose (1-${THEME_OPTIONS.length})`);
  const idx = parseInt(choice, 10) - 1;

  if (idx < 0 || idx >= THEME_OPTIONS.length || isNaN(idx)) {
    error('Invalid choice.');
    return selectTheme();
  }

  theme = THEME_OPTIONS[idx].key;
  await reviewAndConfirm();
}


async function multilineInput() {
  const lines = [];
  return new Promise(resolve => {
    rl.on('line', (line) => {
      if (line.trim() === 'END') {
        rl.removeAllListeners('line');
        resolve(lines);
      } else {
        lines.push(line);
      }
    });
  });
}

async function reviewAndConfirm() {
  clear();
  header();
  section('Preview: What Will Be Posted');

  console.log(`\n${colors.bright}Title:${colors.reset}`);
  console.log(`  ${title}\n`);

  console.log(`${colors.bright}Date:${colors.reset}`);
  console.log(`  ${publishDate}\n`);

  console.log(`${colors.bright}Theme:${colors.reset}`);
  console.log(`  ${THEME_OPTIONS.find(t => t.key === theme).label}\n`);

  console.log(`${colors.bright}Teaser (appears on grid card):${colors.reset}`);
  const teaserText = teaserLines.join('\n').trim();
  console.log(`  ${teaserText}\n`);

  console.log(`${colors.bright}Full Content (on article page):${colors.reset}`);
  const rawContent = contentLines.join('\n').trim();
  const formattedContent = formatContent(rawContent);
  const htmlPreview = formattedContent
    .split('\n')
    .map(line => '  ' + line)
    .join('\n');
  console.log(htmlPreview);
  console.log('');

  if (linkedinUrl) {
    console.log(`${colors.bright}LinkedIn URL:${colors.reset}`);
    console.log(`  ${linkedinUrl}\n`);
  }

  console.log(`${colors.bright}Article ID (auto-generated from title):${colors.reset}`);
  console.log(`  ${toSlug(title)}\n`);

  const confirm = await prompt('Does this look correct? Save locally? (y/n)');

  if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
    const id = savePerspective();
    addedPerspectives.push({ id, title });
    success(`Added "${title}"`);
    await continueOrDeploy();
  } else {
    const restart = await prompt('Start over? (y/n)');
    if (restart.toLowerCase() === 'y') {
      await selectSource();
    } else {
      rl.close();
    }
  }
}

async function continueOrDeploy() {
  clear();
  header();
  section('What\'s Next?');

  console.log(`\n${colors.bright}Perspectives added in this session:${colors.reset}`);
  addedPerspectives.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.title}`);
  });

  console.log(`\n${colors.bright}Options:${colors.reset}`);
  console.log(`  ${colors.bright}1${colors.reset} Add another perspective (batch mode)`);
  console.log(`  ${colors.bright}2${colors.reset} Finish and show review steps`);
  console.log(`  ${colors.bright}3${colors.reset} Save locally only (deploy manually later)\n`);

  const choice = await prompt('Choose (1, 2, or 3)');

  if (choice === '1') {
    title = '';
    linkedinUrl = '';
    teaserLines = [];
    contentLines = [];
    theme = '';
    await selectSource();
  } else if (choice === '2') {
    await skipDeploy();
    rl.close();
  } else if (choice === '3') {
    await skipDeploy();
    rl.close();
  } else {
    error('Invalid choice. Please select 1, 2, or 3.');
    await continueOrDeploy();
  }
}

// Strip LinkedIn copy-paste artifacts: trailing hashtag blocks, inline
// "hashtag#Foo" prefixes (keeping the word, since inline hashtags are usually
// real names like Automate), and a leading standalone date line (the site
// renders the date separately).
function extractDateFromText(text) {
  const months = '(?:January|February|March|April|May|June|July|August|September|October|November|December)';
  const match = text.trim().match(new RegExp(`^(${months} \\d{1,2}, \\d{4})`));
  return match ? match[1] : null;
}

function sanitizeText(text) {
  let out = text.trim();
  // Drop a trailing block made only of hashtag tokens (optionally comma-separated)
  out = out.replace(/(?:\s|,)*(?:hashtag#\w+(?:\s|,)*)+$/g, '').trim();
  // Inline occurrences: keep the word itself
  out = out.replace(/hashtag#(\w+)/g, '$1');
  const months = '(?:January|February|March|April|May|June|July|August|September|October|November|December)';
  out = out.replace(new RegExp(`^${months} \\d{1,2}, \\d{4}\\s*\\n+`), '');
  return out;
}

function toSlug(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function savePerspective() {
  const id = toSlug(title);
  const teaserText = sanitizeText(teaserLines.join('\n'));
  const rawContent = sanitizeText(contentLines.join('\n'));
  const formattedContent = formatContent(rawContent);

  const repoDir = path.join(__dirname, '..');
  const dataFilePath = path.join(repoDir, 'content/perspectives.json');
  const originalDatabase = fs.readFileSync(dataFilePath, 'utf8');
  const database = JSON.parse(originalDatabase);
  database.posts.unshift({ id, theme, title, date: publishDate, teaser: teaserText,
    content: formattedContent, linkedinUrl: linkedinUrl || null });
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
  info(`Recovery snapshot: ${path.relative(repoDir, backup)}`);

  // Stage a Medium-ready Markdown file at medium-export/<id>.md. Medium has
  // no public API for creating posts, so this is a local file you paste
  // from into Medium's editor by hand.
  const mediumPath = writeMediumFile(
    { id, theme, title, date: publishDate, teaser: teaserText, content: formattedContent, linkedinUrl },
    database.themes,
    repoDir
  );
  info(`Medium draft ready: ${path.relative(repoDir, mediumPath)}`);

  return id;
}

async function performDeploy() {
  const repoDir = path.join(__dirname, '..');
  try {
    const dirty = execFileSync('git', ['status', '--porcelain'], { cwd: repoDir, encoding: 'utf8' });
    if (dirty.trim()) throw new Error('Review and commit the intended changes first. The publisher never stages or commits files.');
    const branch = execFileSync('git', ['branch', '--show-current'], { cwd: repoDir, encoding: 'utf8' }).trim();
    if (branch !== 'main') throw new Error('Push reviewed commits from main only.');
    execFileSync('git', ['push', 'origin', 'main'], { cwd: repoDir, stdio: 'inherit', env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } });
    success('Reviewed commits pushed. GitHub Actions will validate and deploy; check its result before treating the site as live.');
  } catch (err) {
    process.exitCode = 1;
    error(`Push failed: ${err.message}`);
  }
}

async function skipDeploy() {
  clear();
  header();
  section('Changes Saved Locally');

  console.log(`\n${colors.green}✓ ${addedPerspectives.length} thesis(es) saved to content/perspectives.json${colors.reset}\n`);

  console.log(`${colors.bright}When you\'re ready to deploy, run:${colors.reset}`);
  console.log(`\n  ${colors.dim}node scripts/publish.js --deploy${colors.reset}\n`);
  console.log(`${colors.dim}Or manually:${colors.reset}`);
  console.log(`  git push origin main`);
  console.log(`  # Check the GitHub Actions deployment result\n`);
}

// Handle CLI arguments
const args = process.argv.slice(2);

if (args.includes('--deploy')) {
  // Deploy-only mode
  performDeploy().then(() => {
    rl.close();
  }).catch(err => {
    error(`Fatal error: ${err.message}`);
    process.exit(1);
  });
} else {
  // Start the interactive flow
  selectSource().catch(err => {
    error(`Fatal error: ${err.message}`);
    process.exit(1);
  });
}
