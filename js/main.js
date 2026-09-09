
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

    const main = document.querySelector('main');
    if (main) { main.id = 'main-content'; main.tabIndex = -1; }
    if (menuBtn && mobileNav) {
        const openIcon = menuBtn.innerHTML;
        const closeIcon = '<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6L18 18M6 18L18 6"/></svg>';
        const setMenu = (open, restoreFocus = false) => {
            mobileNav.hidden = !open;
            mobileNav.classList.toggle('open', open);
            menuBtn.setAttribute('aria-expanded', String(open));
            menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
            menuBtn.innerHTML = open ? closeIcon : openIcon;
            if (restoreFocus) menuBtn.focus();
        };
        menuBtn.addEventListener('click', () => setMenu(mobileNav.hidden));
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && !mobileNav.hidden) {
                event.preventDefault(); setMenu(false, true);
            }
        });
        document.addEventListener('click', event => {
            if (!mobileNav.hidden && !event.composedPath().includes(headerElement)) setMenu(false);
        });
        headerElement.addEventListener('focusout', event => {
            if (event.relatedTarget && !headerElement.contains(event.relatedTarget)) setMenu(false);
        });
        mobileNav.addEventListener('click', event => {
            if (event.target.closest('a')) setMenu(false);
        });
        const desktop = window.matchMedia('(min-width: 1100px)');
        desktop.addEventListener('change', () => {
            if (desktop.matches) {
                const hadFocus = mobileNav.contains(document.activeElement) || document.activeElement === menuBtn;
                setMenu(false);
                if (hadFocus) document.querySelector('.nav-desktop a')?.focus();
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
            link.setAttribute('aria-current', 'page');
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

    // Essential content stays visible without scroll-triggered animation.
});
