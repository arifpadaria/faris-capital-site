document.addEventListener('DOMContentLoaded', () => {
            // Latest Thinking: the three newest theses (array is newest-first)
            const grid = document.getElementById('latest-thinking-grid');
            if (grid && typeof INVESTMENT_THESES !== 'undefined') {
                grid.innerHTML = INVESTMENT_THESES.slice(0, 3).map(p => `
                    <div class="thesis-card">
                        <div class="thesis-date">${escapeText(p.date)}</div>
                        <h3>${escapeText(p.title)}</h3>
                        <p>${escapeText(p.teaser.split('\n')[0])}</p>
                        <a href="theses/${encodeURIComponent(p.id)}.html" class="accent-link">Read Perspective <span>→</span></a>
                    </div>
                `).join('');
            }

        });
