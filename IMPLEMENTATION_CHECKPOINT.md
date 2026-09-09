# Website improvement checkpoint

Updated: 2026-09-09 (ET). Baseline: `cf19c2c`. All changes remain uncommitted and local. No Git push or production deployment has been executed.

## Completed locally

### Publishing and content

- Canonical content migrated to `content/perspectives.json`. All 20 original article records and theme definitions were compared with the baseline and preserved exactly.
- Runtime publishing and generation use JSON parsing, not VM evaluation. Browser card data is generated separately without full article bodies: 13,479 bytes versus 106,168 before.
- Required fields, slugs, duplicate IDs, dates, themes, body markup and HTTPS LinkedIn URLs are validated before output generation. Existing paragraph/line-break markup is preserved; new body input is escaped plain text.
- Titles, teasers and theme labels are escaped at browser and generated-HTML boundaries. The card list sorts by publication date.
- Complete output is rendered before writes. Source comparisons prevent stale overwrites; an exclusive writer lock prevents concurrent writes. Original files and a manifest are saved under `.publisher-backups/`. Individual file replacements use rename; detected write errors restore originals. This is not a transaction across a machine/process crash; recovery instructions are in PUBLISH.md.
- The legacy publisher now delegates to the maintained workflow.
- The publisher never stages or commits files and never directly invokes Firebase. Its explicit `--deploy` command only pushes a clean, reviewed main branch; CI handles one deployment. Interactive saves finish locally.

### Browser security and packaging

- Executable inline scripts moved into external files. Proposed CSP allows same-origin scripts without unsafe-inline or eval. Inline CSS remains allowed for existing styles; Google Fonts origins are explicitly permitted.
- Added nosniff, framing restrictions, referrer and permissions policies in Firebase configuration.
- Firebase now serves `dist/`, built from an explicit 47-file list. Content sources, scripts, Medium exports, arbitrary root files and credentials are absent. The existing public business-card page is preserved.
- CI runs tests, verifies generated-source consistency, builds public output, and deploys with pinned Firebase CLI 15.29.0. Read-only GitHub contents permissions and serialized deployments are configured. The existing Firebase secret remains the identity mechanism; migration away from the deprecated user token is still pending.

### Desktop/mobile

- Header logo/gutters and menu button fit at 320 CSS pixels.
- Closed mobile links are hidden from interaction/accessibility; open state is announced. Escape closes and restores focus. Outside clicks, focus departure and switching to desktop close the disclosure appropriately.
- Filter controls preserve keyboard focus and expose pressed state plus result count.
- The homepage's three newest perspective cards and all 20 Perspectives cards are generated into the HTML. Visitors can read and open them without JavaScript; JavaScript now only filters the existing cards.
- Arif's 1.44 MB PNG headshot is retained as a local source only. The public build serves a 15.7 KB WebP with a 28.5 KB JPEG fallback, sized appropriately for its fixed 84px display.
- Card metadata wraps; phone gutters and partner-experience pills fit; small gold text is darker for contrast.
- Skip link added; active navigation exposes aria-current. Essential content no longer waits for scroll-triggered fade animations. Metrics have final values in HTML; reduced-motion styles are respected.
- Branding and article content remain unchanged. Asset references use version 40.

## Validation

`node --test scripts/publisher-safety.test.js`: 22 passing tests. Includes hostile text, script/HTML injection boundaries, URL/path rejection, safe server-rendered cards, actual save and generation against fixtures, duplicate rejection before mutation, failure rollback, stale-source detection, concurrent-write lock, public-output exclusions, and clean-branch push behavior with mocked subprocesses.

Generated files exactly match canonical input; all JavaScript syntax and diff whitespace checks passed. All built HTML file references resolve inside the public build and no executable inline scripts remain. HTTP preview checks verified CSP/security headers, private content 404 and a configured legacy redirect 301.

Local Lighthouse measured 100/100/100/100 for desktop Performance, Accessibility, Best Practices and SEO, with 0.4s FCP/LCP, zero total blocking time and zero layout shift. Two mobile-emulated samples measured 93 and 99 Performance, while Accessibility, Best Practices and SEO were 100 in both; FCP/LCP ranged from 1.6s to 2.6s, with zero blocking time and zero layout shift.

Chrome: 30 combinations of six pages and widths 320/390/768/1024/1440 passed element-bound, image-load and h1 checks. No console warning/error was captured in the inspected preview navigation. Explicit checks passed for menu open/close/Escape/focus, filter results/focus/pressed state, service deep link and arrow keys, legacy article redirect and skip link. Desktop and phone screenshots were visually reviewed.

Safari 27.0 WebDriver loaded the Perspectives page with 20 cards, five filters and no broken images. Its Physical AI filter correctly exposed ten cards. At a 390px-wide Safari window, Home and About had no horizontal overflow, and Safari selected the optimized WebP portrait successfully.

The iPhone 17 Pro iOS 26.2 simulator rendered the native Safari homepage and Perspectives page cleanly. The homepage header, menu control, hero and calls to action fit the device viewport. The Perspectives title, copy, all five filters and first card were fully visible without clipping.

## Preview and next work

Local preview is running at http://127.0.0.1:8766, backed by the built public files. Restart with:

```bash
node scripts/build-public.js
node scripts/preview.js
```

The server binds to localhost and applies the proposed headers and exact configured redirects. It was rebuilt after the final checks, including 20 server-rendered Perspective cards, three homepage cards and optimized portrait delivery. The reviewed public package contains 48 files and 820,127 bytes. Full updated publishing instructions: PUBLISH.md.

Next: physical iPhone/Android, Firefox/Edge, zoom/screen-reader coverage and post-deployment validation. Review the preview and complete release checks before committing/pushing. Production headers and exclusions are not yet live. No credential or account permissions have changed.

Continue from this checkpoint and the working diff. The baseline audit is AUDIT_2026-09-08.md; do not repeat the entire audit.
