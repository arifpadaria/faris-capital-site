
/* 
 * Reusable Components for Faris Capital (Relative Paths Fix)
 */

// Note: Links now use "./" or just filename to ensure they work relative to the current folder
// This works for flat directory structures.

const Header = `
<div class="header-container container">
    <a href="index.html" class="logo">Faris Capital</a>
    
    <nav class="nav-desktop">
        <a href="index.html" class="nav-link">Home</a>
        <a href="about.html" class="nav-link">About</a>
        <a href="growth-advisory.html" class="nav-link">Growth-Stage Advisory</a>
        <a href="corporate-development.html" class="nav-link">Corporate & Venture Dev</a>
        <a href="capital-alignment.html" class="nav-link">Capital Alignment</a>
        <a href="global-markets.html" class="nav-link">Global Markets</a>
        <a href="perspectives.html" class="nav-link">Perspectives</a>
        <a href="contact.html" class="btn btn-primary" style="padding: 0.75rem 1.5rem; font-size: 0.85rem;">Contact</a>
    </nav>

    <button class="mobile-menu-btn" aria-label="Toggle Menu">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
    </button>
</div>

<!-- Mobile Nav -->
<div class="mobile-nav">
    <a href="index.html" class="nav-link">Home</a>
    <a href="about.html" class="nav-link">About</a>
    <a href="growth-advisory.html" class="nav-link">Growth-Stage Advisory</a>
    <a href="corporate-development.html" class="nav-link">Corporate & Venture Development</a>
    <a href="capital-alignment.html" class="nav-link">Capital Alignment & Syndication</a>
    <a href="global-markets.html" class="nav-link">Global Markets</a>
    <a href="perspectives.html" class="nav-link">Perspectives</a>
    <a href="contact.html" class="btn btn-primary" style="width: 100%;">Contact</a>
</div>
`;

const Footer = `
<div class="container">
    <div class="grid grid-2" style="gap: 2rem;">
        <div>
            <div class="footer-line footer-line-1">Faris Capital</div>
            <div class="footer-line" style="font-size: 0.9rem; opacity: 0.8;">Arif Padaria</div>
            <div class="footer-line" style="font-size: 0.9rem; margin-top: 1.5rem; line-height: 1.6; max-width: 300px;">
                Growth-Stage Venture Advisory<br>Corporate & Venture Development<br>Capital Alignment
            </div>
        </div>
        <div style="display: flex; flex-direction: column; justify-content: center; align-items: flex-start; opacity: 0.9;">
            <div class="footer-line">
                <a href="mailto:arif@faris-capital.com" style="font-weight: 500;">arif@faris-capital.com</a>
            </div>
            <div class="footer-line">
                <a href="https://wa.me/16179030786" style="font-weight: 500;">+1.617.903.0786</a>
            </div>
        </div>
    </div>
</div>
`;
