# 📝 Publishing Perspectives to Faris Capital

A simple, interactive way to publish your writing—from LinkedIn posts or Obsidian notes—directly to your site.

**Batch mode supported:** Add multiple perspectives locally, then deploy once.

## Quick Start

```bash
cd /Users/arifpadaria/Documents/faris-capital-site
node scripts/publish.js
```

The tool will guide you through everything—add one or more perspectives, then choose when to deploy.

---

## Option 1: From LinkedIn Posts

Perfect for publishing existing LinkedIn posts to your Perspectives page.

**What you'll need:**
- The post title
- The LinkedIn post URL (link to the original)
- The teaser (1-3 sentences)
- The full article content

**How it works:**
1. Run `node scripts/publish.js`
2. Select "LinkedIn Post"
3. Paste your content when prompted
4. Review and confirm
5. Choose to deploy immediately or push manually later

---

## Option 2: From Obsidian Markdown

Directly import and publish from your Obsidian vault.

**What you'll need:**
- A markdown file in your Obsidian "08 - Writing" folder

**How it works:**
1. Run `node scripts/publish.js`
2. Select "Obsidian Markdown file"
3. Choose from your recent files or type a filename
4. The tool auto-extracts:
   - Title (from frontmatter or filename)
   - Teaser (first paragraph)
   - Content (remaining paragraphs)
5. Review and confirm
6. Choose to deploy

**Front matter example:**
```yaml
---
title: "My Perspective on AI"
date: 2026-05-22
---

Your first paragraph becomes the teaser...

This and everything below becomes the full content.
```

---

## Batch Mode Workflow

Add multiple perspectives in one session:

1. Run `node scripts/publish.js`
2. Add perspective #1 (LinkedIn or Obsidian)
3. Choose "Add another perspective" when prompted
4. Add perspective #2, #3, etc.
5. When done, choose "Deploy all changes now"

All perspectives are added locally, then pushed and deployed together in a single commit.

## What Happens After Publishing

✓ Your perspective(s) added to `js/perspectives-data.js`  
✓ New card(s) appear on your Perspectives page  
✓ Full reading page(s) auto-created at `article.html?id=<slug>`  
✓ Browser cache automatically invalidated (version bumped)  
✓ All changes committed to Git and pushed to GitHub in one go  
✓ Site deployed live to Firebase Hosting  

---

## Deploy Locally-Saved Perspectives

If you saved perspectives locally without deploying:

```bash
node scripts/publish.js --deploy
```

Or manually:

```bash
git push origin main
firebase deploy
```

---

## Tips

- **Formatting:** Paragraphs are separated by double newlines (`\n\n`)
- **Dates:** Automatically set to today (customize in the tool if needed)
- **Slugs:** Titles are auto-converted to URL-safe IDs (spaces → hyphens)
- **Obsidian:** Make sure iCloud sync is up-to-date before importing
- **Cache:** Browser caches are auto-bumped; hard refresh if needed (`Cmd+Shift+R`)

---

## Troubleshooting

**"node: command not found"**  
Use the full path: `/Users/arifpadaria/.lmstudio/.internal/utils/node scripts/publish.js`

**"Cannot access Obsidian vault"**  
Make sure your vault is synced via iCloud and the path is correct.

**"Deploy failed"**  
Check that Firebase CLI is logged in: `firebase login`

---

## Future Improvements

Once you've published 3-4 existing posts, we can:
- **Auto-watch** your Obsidian vault for new files
- **Scheduled publishing** for future posts
- **Preview** before deployment
- **Batch imports** from LinkedIn directly

Reach out when you're ready!
