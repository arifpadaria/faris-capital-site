# Publishing Faris Capital Perspectives

Updated: 2026-09-09. Run commands from the iCloud `faris-capital-site` project directory.

## Add content locally

```bash
node scripts/publish.js
```

Enter the title, optional HTTPS LinkedIn link, teaser, body and theme. End multiline input with `END`. Review and save locally, then add another article or finish. The older `node scripts/add-perspective.js` entrypoint opens this same workflow.

New body input is plain text: paragraphs and line breaks are preserved, while pasted HTML displays as text. There is no direct Obsidian file-import feature. A leading date line in pasted content is recognized; otherwise the publisher uses today's date. To correct a date, edit the canonical JSON and regenerate.

Canonical content lives in `content/perspectives.json`. The save operation validates slugs, duplicates, required fields, HTML and external URLs, then generates static article pages, the sitemap and a smaller browser card bundle. Asset versions are incremented. Medium Markdown remains local under `medium-export/`. Do not edit the generated `js/investment-theses-data.js` directly.

## Review and preview

```bash
node --test scripts/*.test.js
node scripts/generate-thesis-pages.js
node scripts/build-public.js
node scripts/preview.js
```

Preview: http://127.0.0.1:8766. The server binds only to this computer and applies the proposed security headers. Firebase serves only the explicitly selected files in `dist/`; content sources, development files and Medium drafts are excluded. Add intentional new public assets to `scripts/build-public.js`.

Review the Git diff and stage/commit only the intended changes. The publisher never stages or commits files automatically.

## Push reviewed commits

```bash
node scripts/publish.js --deploy
```

This requires a clean working tree on `main`. It pushes reviewed commits to GitHub. GitHub Actions tests the publisher, verifies generated files, builds public output and deploys once. Check the Actions result and the live site; a successful push does not mean deployment succeeded. There is no second automatic local Firebase deployment.

## Recovery

Before replacing output, the publisher saves originals and a manifest under `.publisher-backups/<run>/`. Detected write failures restore the originals automatically. Individual file replacements are atomic; the full set is not a filesystem transaction. After a machine/process interruption, review the latest manifest: entries marked true have original copies in that snapshot, entries marked false were new outputs. Restore that set before clearing a leftover `.publisher.lock` or `.publisher-tmp` file and retrying. Never clear a lock while another publisher is running. Source edits detected during preparation cause publication to stop instead of overwriting newer content.

Keep snapshots until the corresponding change is verified. They are excluded from Git and hosting. The public build refuses to replace an existing `dist` directory without its ownership marker.

## Cover images (added 2026-10-19)

Each perspective can carry an `image` (a path under `/images/covers/`, 1200x630). The page generator uses it for `og:image`, `twitter:image` and the article schema, and falls back to `/images/og-image.png` when there is none. To make a navy and gold title card for every piece that lacks one:

```bash
python3 scripts/make-covers.py          # new pieces only
python3 scripts/make-covers.py --force  # rebuild generated cards
node scripts/generate-thesis-pages.js && node scripts/build-public.js
```

A hand-made cover (for example the Post 10 timing graphic) is never overwritten. Needs Google Chrome and Pillow.

## Article pipeline (added 2026-10-19)

The vault drives publishing for approved articles: see `99 - System/Publishing_Pipeline.md` in the AP_Brain vault. `publish_stage_site.py` there calls this repo's scripts, pushes over HTTPS with `gh auth git-credential`, and needs a clean tree on `main`.
