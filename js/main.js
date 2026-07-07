
document.addEventListener('DOMContentLoaded', () => {
    // Inject Header
    const headerElement = document.querySelector('header');
    if (headerElement && typeof Header !== 'undefined') {
        headerElement.innerHTML = Header;
        headerElement.classList.add('site-header');
    }

    // Inject Footer
    const footerElement = document.querySelector('footer');
    if (footerElement && typeof Footer !== 'undefined') {
        footerElement.innerHTML = Footer;
        footerElement.classList.add('site-footer');
    }

    // Mobile Menu Logic
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const mobileNav = document.querySelector('.mobile-nav');

    if (menuBtn && mobileNav) {
        menuBtn.addEventListener('click', () => {
            mobileNav.classList.toggle('open');
            // Toggle icon (optional simple switch)
            if (mobileNav.classList.contains('open')) {
                menuBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
            } else {
                menuBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>';
            }
        });
    }

    // Highlight Active Link (Fixed for relative links)
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        const linkPath = (link.getAttribute('href') || '').split('/').pop();
        // Compare filenames only, since nav hrefs are root-absolute
        if (linkPath === currentPath) {
            link.classList.add('active');
        }
    });

    // Header scroll effect
    const header = document.querySelector('.site-header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 10) {
                header.style.boxShadow = '0 10px 30px -10px rgba(0,0,0,0.1)';
                header.style.background = 'rgba(255, 255, 255, 0.98)';
            } else {
                header.style.boxShadow = 'none';
                header.style.background = 'rgba(255, 255, 255, 0.95)';
            }
        });
    }

    // Animation Observer (Oomph!)
    // Select all sections and main blocks to animate
    const animatedElements = document.querySelectorAll('section, .content-block, .radius-card, h1, h2, p, .hero-subhead');

    // Add fade-up class initially to things we want to animate (if not already there)
    // Actually, let's just observe them and add the class 'fade-up' in JS to avoid messing HTML too much
    // Or better: Let's assume everything we want to animate has class 'fade-up' in HTML? 
    // No, let's do it programmatically for this refactor to save touching 10 files.

    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    // Apply fade-up to common elements for instant jazz
    const elementsToAnimate = document.querySelectorAll('main > section > .container > *');

    elementsToAnimate.forEach((el, index) => {
        el.classList.add('fade-up');
        // Add random delay for stagger effect if siblings
        if (index % 2 === 0) el.classList.add('delay-100');
        if (index % 3 === 0) el.classList.add('delay-200');
        observer.observe(el);
    });

    // Also animate Hero elements specifically (direct children, or children
    // of a nested .container for full-bleed heroes like .hero-home)
    const heroElements = document.querySelectorAll('.hero > *:not(.container), .hero > .container > *');
    heroElements.forEach((el, index) => {
        el.classList.add('fade-up');
        el.style.transitionDelay = `${index * 100}ms`; // Manual stagger
        observer.observe(el);
    });

});
