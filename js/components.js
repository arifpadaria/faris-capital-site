
/*
 * Reusable Components for Faris Capital
 */

// Note: Links use root-absolute paths so the header/footer work from any URL
// depth (e.g. /theses/ pages and the 404 page, which can render at any path).

const Header = `
<div class="header-container container">
    <a href="/index.html" class="logo">
  <img src="/images/faris-capital-wordmark-v2-med.svg?v=27" alt="Faris Capital" class="logo-desktop">
  <img src="/images/faris-capital-wordmark-stacked.svg?v=27" alt="Faris Capital" class="logo-mobile">
</a>
    <nav class="nav-desktop">
        <a href="/index.html" class="nav-link">Home</a>
        <a href="/what-we-do.html" class="nav-link">What We Do</a>
        <a href="/investment-theses.html" class="nav-link">Investment Theses</a>
        <a href="/about.html" class="nav-link">About</a>
        <a href="/contact.html" class="btn btn-primary" style="padding: 0.75rem 1.5rem; font-size: 0.85rem;">Contact</a>
    </nav>

    <button class="mobile-menu-btn" aria-label="Toggle Menu">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
    </button>
</div>

<!-- Mobile Nav -->
<div class="mobile-nav">
    <a href="/index.html" class="nav-link">Home</a>
    <a href="/what-we-do.html" class="nav-link">What We Do</a>
    <a href="/investment-theses.html" class="nav-link">Investment Theses</a>
    <a href="/about.html" class="nav-link">About</a>
    <a href="/contact.html" class="btn btn-primary" style="width: 100%;">Contact</a>
</div>
`;

const Footer = `
<div class="container">
    <div class="footer-grid">
        <div>
            <img src="/images/faris-capital-wordmark-v2-reversed.svg?v=27" alt="Faris Capital">
            <p class="footer-tagline">Advisory for growth-stage ventures, institutional capital, and enterprises across global markets.</p>
        </div>
        <div>
            <div class="footer-heading">Site</div>
            <nav class="footer-nav">
                <a href="/index.html">Home</a>
                <a href="/what-we-do.html">What We Do</a>
                <a href="/investment-theses.html">Investment Theses</a>
                <a href="/about.html">About</a>
                <a href="/contact.html">Contact</a>
            </nav>
        </div>
        <div>
            <div class="footer-heading">Connect</div>
            <div class="footer-line" style="margin-bottom: 0.85rem;">
                <a href="mailto:contact@faris-capital.com" class="footer-contact">contact@faris-capital.com</a>
            </div>
            <div class="footer-line" style="margin-bottom: 0.85rem;">
                <a href="https://wa.me/16172978222" class="footer-contact">+1.617.297.8222</a>
            </div>
            <a href="https://www.linkedin.com/company/fariscapital/" target="_blank" rel="noopener" class="footer-social">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                LinkedIn
            </a>
        </div>
    </div>
    <div class="footer-bottom">
        <span>&copy; 2026 Faris Capital LLC. All rights reserved.</span>
    </div>
</div>
`;
