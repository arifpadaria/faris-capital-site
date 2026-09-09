document.addEventListener('DOMContentLoaded', () => {
            const tabs = Array.from(document.querySelectorAll('.audience-tab'));
            const panels = document.querySelectorAll('.audience-panel');

            function activate(name, { focus = false } = {}) {
                tabs.forEach(t => {
                    const isActive = t.dataset.tab === name;
                    t.classList.toggle('active', isActive);
                    t.setAttribute('aria-selected', isActive);
                    t.tabIndex = isActive ? 0 : -1;
                    if (isActive && focus) t.focus();
                });
                panels.forEach(p => p.classList.toggle('active', p.id === `panel-${name}`));
            }

            tabs.forEach((tab, index) => {
                tab.addEventListener('click', () => activate(tab.dataset.tab));

                // Arrow-key navigation per the WAI-ARIA tabs pattern
                tab.addEventListener('keydown', (e) => {
                    let targetIndex = null;
                    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                        targetIndex = (index + 1) % tabs.length;
                    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                        targetIndex = (index - 1 + tabs.length) % tabs.length;
                    } else if (e.key === 'Home') {
                        targetIndex = 0;
                    } else if (e.key === 'End') {
                        targetIndex = tabs.length - 1;
                    }
                    if (targetIndex !== null) {
                        e.preventDefault();
                        activate(tabs[targetIndex].dataset.tab, { focus: true });
                    }
                });
            });

            const hash = window.location.hash.replace('#', '');
            if (['ventures', 'capital', 'enterprises'].includes(hash)) {
                activate(hash);
            }
        });
