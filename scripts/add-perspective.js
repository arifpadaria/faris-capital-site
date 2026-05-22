#!/usr/bin/env node

/**
 * CLI Tool to publish new Perspectives to Faris Capital
 * Usage: node scripts/add-perspective.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const STATES = {
  TITLE: 'TITLE',
  LINKEDIN_URL: 'LINKEDIN_URL',
  TEASER: 'TEASER',
  CONTENT: 'CONTENT',
  DEPLOY: 'DEPLOY'
};

let currentState = STATES.TITLE;
let title = '';
let linkedinUrl = '';
let teaserLines = [];
let contentLines = [];

console.log("\n=== Faris Capital Publishing Assistant ===");
console.log("Add a LinkedIn post to your Perspectives page.\n");
console.log("1. Enter Article Title:");

rl.on('line', (line) => {
  const trimmed = line.trim();
  
  switch (currentState) {
    case STATES.TITLE:
      if (trimmed) {
        title = trimmed;
        currentState = STATES.LINKEDIN_URL;
        console.log("\n2. Enter LinkedIn Post URL:");
      } else {
        console.log("Title cannot be empty. Please enter Article Title:");
      }
      break;
      
    case STATES.LINKEDIN_URL:
      if (trimmed) {
        linkedinUrl = trimmed;
        currentState = STATES.TEASER;
        console.log("\n3. Paste the Teaser (1-3 sentences).");
        console.log("-> To finish, press Enter, type 'END' on a new line, and press Enter:");
      } else {
        console.log("URL cannot be empty. Please enter LinkedIn Post URL:");
      }
      break;
      
    case STATES.TEASER:
      if (trimmed === 'END') {
        const teaserText = teaserLines.join('\n').trim();
        if (!teaserText) {
          console.log("Teaser cannot be empty. Please paste the teaser and type 'END':");
        } else {
          currentState = STATES.CONTENT;
          console.log("\n4. Paste the Full Article Content.");
          console.log("-> To finish, press Enter, type 'END' on a new line, and press Enter:");
        }
      } else {
        teaserLines.push(line);
      }
      break;
      
    case STATES.CONTENT:
      if (trimmed === 'END') {
        const contentText = contentLines.join('\n').trim();
        if (!contentText) {
          console.log("Content cannot be empty. Please paste the content and type 'END':");
        } else {
          // Process and save
          savePerspective();
          currentState = STATES.DEPLOY;
          console.log("\n------------------------------------------------");
          console.log("Do you want to deploy these changes now to GitHub & Firebase? (y/n):");
        }
      } else {
        contentLines.push(line);
      }
      break;
      
    case STATES.DEPLOY:
      if (trimmed.toLowerCase() === 'y' || trimmed.toLowerCase() === 'yes') {
        deployChanges();
        rl.close();
      } else if (trimmed.toLowerCase() === 'n' || trimmed.toLowerCase() === 'no') {
        console.log("\nSkipped deployment. Your local files are updated. You can run 'firebase deploy' manually later.");
        rl.close();
      } else {
        console.log("Please enter 'y' or 'n' to confirm deployment:");
      }
      break;
  }
});

function toSlug(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // remove non-alphanumeric except spaces/hyphens
    .replace(/\s+/g, '-')         // replace spaces with hyphens
    .replace(/-+/g, '-')          // replace multiple hyphens with single
    .trim();
}

function formatContent(text) {
  return text
    .split(/\n\s*\n/) // Split into paragraphs by double newlines
    .map(para => para.trim())
    .filter(para => para.length > 0)
    .map(para => `<p>${para.replace(/\n/g, '<br>')}</p>`) // Wrap in P, handle single line breaks
    .join('\n      ');
}

function savePerspective() {
  const id = toSlug(title);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const dateString = new Date().toLocaleDateString('en-US', options);
  
  const teaserText = teaserLines.join('\n').trim();
  const rawContent = contentLines.join('\n').trim();
  const formattedContent = formatContent(rawContent);

  const newEntry = `  {
    id: ${JSON.stringify(id)},
    title: ${JSON.stringify(title)},
    date: ${JSON.stringify(dateString)},
    teaser: ${JSON.stringify(teaserText)},
    content: \`
      ${formattedContent}
    \`,
    linkedinUrl: ${JSON.stringify(linkedinUrl)}
  },\n`;

  const dataFilePath = path.join(__dirname, '../js/perspectives-data.js');
  if (!fs.existsSync(dataFilePath)) {
    console.error(`\nError: Database file not found at ${dataFilePath}`);
    process.exit(1);
  }

  let fileContent = fs.readFileSync(dataFilePath, 'utf8');
  const marker = 'const PERSPECTIVES = [';
  const insertIndex = fileContent.indexOf(marker);

  if (insertIndex === -1) {
    console.error("\nError: Could not find 'const PERSPECTIVES = [' in database file.");
    process.exit(1);
  }

  // Prepend new entry
  const position = insertIndex + marker.length + 1;
  const updatedContent = fileContent.slice(0, position) + newEntry + fileContent.slice(position);
  
  fs.writeFileSync(dataFilePath, updatedContent, 'utf8');
  console.log(`\n[Success] Added "${title}" to perspectives-data.js (ID: ${id})`);
}

function deployChanges() {
  const repoDir = path.join(__dirname, '..');
  
  try {
    console.log("\nStaging changes...");
    execSync('git add .', { cwd: repoDir, stdio: 'inherit' });
    
    console.log("Committing...");
    execSync(`git commit -m "Add perspective: ${title.replace(/"/g, '\\"')}"`, { cwd: repoDir, stdio: 'inherit' });
    
    console.log("Pushing to GitHub...");
    execSync('git push origin main', { cwd: repoDir, stdio: 'inherit' });
    
    console.log("Deploying to Firebase Hosting...");
    execSync('firebase deploy --only hosting', { cwd: repoDir, stdio: 'inherit' });
    
    console.log("\n[Success] Deployment completed successfully! Your changes are now live.");
  } catch (error) {
    console.error("\n[Error] Deployment failed:", error.message);
  }
}
