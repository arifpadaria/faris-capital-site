# Local verification, September 9, 2026

- 22 automated regression tests passed, including real fixture generation and rollback failure injection.
- Original 20 articles/themes match baseline cf19c2c exactly in canonical JSON.
- Generated article/card/sitemap output matches source deterministically.
- 47-file public output contains all referenced local assets, excludes source/staging/development files and has no executable inline scripts.
- Main browser card bundle: 106,168 to 13,479 uncompressed bytes.
- Responsive Chrome checked Home, About, Contact, What We Do, Perspectives and The Silence Was the Signal at 320, 390, 768, 1024 and 1440 CSS pixels. All 30 combinations had no detected horizontal element overflow, no broken images and one h1.
- Menu open/Escape/focus return, closed-menu semantics, filter focus/pressed state/count, service tab keyboard/deep link, article redirect and skip-link navigation passed.
- Proposed HTTP CSP and other security headers were exercised in the local preview; inspected browser logs had no warning/error. Local private source URL returned 404; configured legacy service redirect returned 301.
- All source JS syntax checks and git diff whitespace checks passed.
- The local public build was rebuilt after final verification. Its homepage contains three server-rendered Perspective cards and its Perspectives page contains 20, with all links present in the fetched HTML. Interactive filtering remains available in Chrome.
- The About page now serves Arif's portrait as a 15.7 KB WebP with a 28.5 KB JPEG fallback. The original 1.44 MB PNG is excluded from the public build. The final local public package is 820,127 bytes across 48 approved files.
- Lighthouse, local preview: desktop scored 100 for Performance, Accessibility, Best Practices and SEO, with 0.4s FCP/LCP, zero total blocking time and zero layout shift. Two independent mobile-emulated runs scored 93 and 99 for Performance, with 100 for Accessibility, Best Practices and SEO; the throttled local runs recorded 1.6s and 2.6s FCP/LCP, zero blocking time and zero layout shift.
- Safari 27.0 WebDriver: the Perspectives page loaded 20 cards and five filters with no broken images; its Physical AI filter showed 10 cards and exposed its selected state. At a 390px-wide window, the home and About pages had no horizontal overflow. Safari selected the optimized 384px-wide WebP portrait successfully.
- iPhone 17 Pro simulator, iOS 26.2: native Safari rendered the homepage hero, header and menu control cleanly at the device's 1206 × 2622 pixel display. The Perspectives page displayed its title, introductory copy, all five filter pills and first card without clipping. The simulator's text-size setting was returned to its original value after the check.

No production deployment or authenticated cloud/CI execution was performed. Responsive Chrome, Safari WebDriver, the iPhone simulator and local Lighthouse are not a physical-device certification. Physical iPhone Safari, Android Chrome, Firefox/Edge, 200% zoom, full screen-reader/reduced-motion testing, identity migration and post-deployment verification remain outstanding. The localhost server is for review only, not production hosting.
