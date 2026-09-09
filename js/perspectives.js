document.addEventListener('DOMContentLoaded', () => {
            const grid = document.getElementById('theses-grid');
            const filters = document.getElementById('theme-filters');
            if (!grid || typeof INVESTMENT_THESES === 'undefined') return;

            const pillStyle = (active) => `
                font-size: 0.85rem; font-weight: 600; padding: 0.5rem 1.1rem; border-radius: 999px;
                border: 1px solid ${active ? 'var(--accent-color)' : 'var(--border-color)'};
                background: ${active ? 'var(--accent-color)' : 'transparent'};
                color: ${active ? '#fff' : 'var(--text-secondary)'};
                cursor: pointer; transition: all 0.2s;
            `;

            let activeTheme = 'all';

            function renderFilters() {
                const themeKeys = Object.keys(THEMES).filter(k => INVESTMENT_THESES.some(p => p.theme === k));
                const all = [{ key: 'all', label: 'All Perspectives' }, ...themeKeys.map(k => ({ key: k, label: THEMES[k].label }))];
                filters.innerHTML = all.map(t => `<button type="button" data-theme="${escapeText(t.key)}" aria-pressed="${t.key === activeTheme}" style="${pillStyle(t.key === activeTheme)}">${escapeText(t.label)}</button>`).join('');
                filters.querySelectorAll('button').forEach(btn => {
                    btn.addEventListener('click', () => {
                        activeTheme = btn.getAttribute('data-theme');
                        filters.querySelectorAll('button').forEach(control => {
                            const selected = control.dataset.theme === activeTheme;
                            control.setAttribute('aria-pressed', String(selected));
                            control.style.cssText = pillStyle(selected);
                        });
                        renderGrid();
                    });
                });
            }

            function renderGrid() {
                const cards = grid.querySelectorAll('[data-theme]');
                let shown = 0;
                cards.forEach(card => {
                    const visible = activeTheme === 'all' || card.dataset.theme === activeTheme;
                    card.hidden = !visible;
                    if (visible) shown += 1;
                });
                document.getElementById('filter-status').textContent = `${shown} perspectives shown`;
            }

            renderFilters();
            renderGrid();
        });
