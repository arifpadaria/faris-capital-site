#!/usr/bin/env node

/**
 * Enhanced Publishing Tool for Faris Capital Perspectives
 * Supports: LinkedIn posts + Obsidian Markdown files
 * Batch mode: Add multiple perspectives before deploying
 * Usage: node scripts/publish.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

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
let addedPerspectives = []; // Track what we've added in this session

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
  source = 'linkedin';
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

  publishDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

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

  if (source === 'obsidian') {
    console.log(`${colors.bright}Source File:${colors.reset}`);
    console.log(`  ${obsidianFile}\n`);
  }

  console.log(`${colors.bright}Article ID (auto-generated from title):${colors.reset}`);
  console.log(`  ${toSlug(title)}\n`);

  const confirm = await prompt('Does this look correct? Publish? (y/n)');

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
  console.log(`  ${colors.bright}2${colors.reset} Deploy all changes now (push + Firebase)`);
  console.log(`  ${colors.bright}3${colors.reset} Save locally only (deploy manually later)\n`);

  const choice = await prompt('Choose (1, 2, or 3)');

  if (choice === '1') {
    title = '';
    linkedinUrl = '';
    teaserLines = [];
    contentLines = [];
    await selectSource();
  } else if (choice === '2') {
    await performDeploy();
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
    .trim();
}

function formatContent(text) {
  return text
    .split(/\n\s*\n/)
    .map(para => para.trim())
    .filter(para => para.length > 0)
    .map(para => `<p>${para.replace(/\n/g, '<br>')}</p>`)
    .join('\n      ');
}

function savePerspective() {
  const id = toSlug(title);
  const teaserText = sanitizeText(teaserLines.join('\n'));
  const rawContent = sanitizeText(contentLines.join('\n'));
  const formattedContent = formatContent(rawContent);

  const newEntry = `  {
    id: ${JSON.stringify(id)},
    title: ${JSON.stringify(title)},
    date: ${JSON.stringify(publishDate)},
    teaser: ${JSON.stringify(teaserText)},
    content: \`
      ${formattedContent}
    \`,
    linkedinUrl: ${JSON.stringify(linkedinUrl || null)}
  },\n`;

  const dataFilePath = path.join(__dirname, '../js/investment-theses-data.js');

  if (!fs.existsSync(dataFilePath)) {
    error(`Database file not found at ${dataFilePath}`);
    process.exit(1);
  }

  let fileContent = fs.readFileSync(dataFilePath, 'utf8');
  const marker = 'const INVESTMENT_THESES = [';
  const insertIndex = fileContent.indexOf(marker);

  if (insertIndex === -1) {
    error('Could not find INVESTMENT_THESES array in database file.');
    process.exit(1);
  }

  const position = insertIndex + marker.length + 1;
  const updatedContent = fileContent.slice(0, position) + newEntry + fileContent.slice(position);

  fs.writeFileSync(dataFilePath, updatedContent, 'utf8');

  // Regenerate the static thesis pages (theses/<id>.html) so the new post
  // gets a shareable page with real meta tags.
  execSync(`node "${path.join(__dirname, 'generate-thesis-pages.js')}"`, { stdio: 'pipe' });

  return id;
}

async function performDeploy() {
  const repoDir = path.join(__dirname, '..');

  try {
    console.log(`\n${colors.dim}Deploying ${addedPerspectives.length} thesis(es)...${colors.reset}\n`);

    // Bump cache version. Find the highest ?v=N currently in use across
    // HTML + components.js, then replace ALL ?v=N (regardless of number,
    // so no file can drift out of sync) with highest+1.
    let currentVersion = 1;
    try {
      const htmlContent = fs.readFileSync(path.join(repoDir, 'index.html'), 'utf8');
      const versionMatch = htmlContent.match(/\?v=(\d+)/);
      if (versionMatch) {
        currentVersion = parseInt(versionMatch[1]);
      }
    } catch (e) {
      // Use default
    }

    const newVersion = currentVersion + 1;
    console.log(`Bumping cache version: ?v=${currentVersion} → ?v=${newVersion}`);
    execSync(`sed -i '' -E 's/\\?v=[0-9]+/?v=${newVersion}/g' *.html theses/*.html js/components.js`, { cwd: repoDir, stdio: 'pipe' });

    // Git operations
    console.log('Staging changes...');
    execSync('git add .', { cwd: repoDir, stdio: 'pipe' });

    const commitMessage = addedPerspectives.length === 1
      ? `Add perspective: ${addedPerspectives[0].title.replace(/"/g, '\\"')}`
      : `Add ${addedPerspectives.length} perspectives`;

    console.log('Committing...');
    execSync(`git commit -m "${commitMessage}"`, { cwd: repoDir, stdio: 'pipe' });

    console.log('Pushing to GitHub...');
    execSync('git push origin main', { cwd: repoDir, stdio: 'inherit', env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } });

    // Firebase deploy
    console.log('Deploying to Firebase...');
    execSync('firebase deploy --only hosting', { cwd: repoDir, stdio: 'inherit' });

    success('Deployment complete! Your perspectives are now live.');
    info(`Cache version bumped to ?v=${newVersion}. Hard refresh your browser to see updates.`);
  } catch (error) {
    error(`Deployment failed: ${error.message}`);
    info('Your perspectives were saved locally. You can push manually later with:');
    info('  cd ' + repoDir);
    info('  git push origin main');
    info('  firebase deploy');
  }
}

async function skipDeploy() {
  clear();
  header();
  section('Changes Saved Locally');

  console.log(`\n${colors.green}✓ ${addedPerspectives.length} thesis(es) added to investment-theses-data.js${colors.reset}\n`);

  console.log(`${colors.bright}When you\'re ready to deploy, run:${colors.reset}`);
  console.log(`\n  ${colors.dim}node scripts/publish.js --deploy${colors.reset}\n`);
  console.log(`${colors.dim}Or manually:${colors.reset}`);
  console.log(`  git push origin main`);
  console.log(`  firebase deploy\n`);
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
