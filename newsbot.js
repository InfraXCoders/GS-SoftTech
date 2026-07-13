(function () {
  // `search_by_date` is important here: the regular search endpoint ranks by
  // relevance and can surface stories that are weeks or months old.
  const HN = 'https://hn.algolia.com/api/v1/search_by_date?tags=story&hitsPerPage=10&query=';
  const QUERIES = [
    'artificial intelligence',
    'machine learning LLM',
    'SpaceX Starship',
    'Cursor AI editor',
    'Google Gemini',
    'Anthropic Claude',
  ];

  let open   = false;
  let cached = null;
  let cachedAt = 0;
  let loaded = false;

  const CACHE_FOR = 10 * 60 * 1000;

  function timeAgo(iso) {
    const diff = (Date.now() - new Date(iso)) / 1000;
    if (diff < 3600)  return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return Math.floor(diff / 86400) + 'd ago';
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    })[char]);
  }

  function safeLink(value, id) {
    const fallback = 'https://news.ycombinator.com/item?id=' + encodeURIComponent(id || '');
    try {
      const url = new URL(value || fallback);
      return /^https?:$/.test(url.protocol) ? url.href : fallback;
    } catch (e) {
      return fallback;
    }
  }

  async function fetchWithTimeout(url, timeout) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        cache: 'no-store',
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) throw new Error('News API returned ' + response.status);
      return response;
    } finally {
      window.clearTimeout(timer);
    }
  }

  async function fetchOne(query) {
    const res = await fetchWithTimeout(HN + encodeURIComponent(query), 10000);
    const data = await res.json();
    return (data.hits || []).map(h => ({
      title:  h.title || '',
      link:   safeLink(h.url, h.objectID),
      pub:    h.created_at || '',
      timestamp: h.created_at_i || 0,
      source: h.author ? 'HN · ' + h.author : 'Hacker News',
      points: h.points || 0,
    }));
  }

  async function fetchAll() {
    const results = await Promise.allSettled(QUERIES.map(fetchOne));
    const seen = new Set();
    const all  = [];
    for (const r of results) {
      if (r.status !== 'fulfilled') continue;
      for (const item of r.value) {
        const key = item.title.trim().toLowerCase();
        if (item.title && !seen.has(key)) {
          seen.add(key);
          all.push(item);
        }
      }
    }
    if (!all.length) throw new Error('No news sources responded');
    return all.sort((a, b) => b.timestamp - a.timestamp).slice(0, 12);
  }

  function renderSkeleton() {
    return Array(5).fill(0).map(() => `
      <div class="nb-skeleton">
        <div class="nb-sk-line nb-sk-title"></div>
        <div class="nb-sk-line nb-sk-title" style="width:65%;margin-top:5px"></div>
        <div class="nb-sk-line nb-sk-src"></div>
      </div>`).join('');
  }

  function renderItems(items) {
    if (!items.length) return '<div class="nb-empty">No articles found. Try refreshing.</div>';
    return items.map(it => `
      <a class="nb-item" href="${escapeHtml(it.link)}" target="_blank" rel="noopener">
        <div class="nb-item-title">${escapeHtml(it.title)}</div>
        <div class="nb-item-meta">
          <span class="nb-source">${escapeHtml(it.source)}</span>
          <div style="display:flex;gap:8px;align-items:center">
            ${it.points ? `<span class="nb-points">▲ ${it.points}</span>` : ''}
            ${it.pub ? `<span class="nb-time">${timeAgo(it.pub)}</span>` : ''}
          </div>
        </div>
      </a>`).join('');
  }

  async function load(force) {
    const list = document.getElementById('nb-list');
    if (!list) return;
    if (!force && cached && Date.now() - cachedAt < CACHE_FOR) {
      list.innerHTML = renderItems(cached);
      return;
    }
    list.innerHTML = renderSkeleton();
    try {
      cached = await fetchAll();
      cachedAt = Date.now();
      list.innerHTML = renderItems(cached);
      loaded = true;
    } catch (e) {
      list.innerHTML = '<div class="nb-empty">Latest articles are temporarily unavailable. Try refreshing.</div>';
      loaded = false;
    }
  }

  function build() {
    const html = `
<div id="gs-newsbot">
  <button id="nb-toggle" aria-label="Open AI news feed">
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="30" height="30">
      <rect x="10" y="6" width="30" height="36" rx="3" fill="white" opacity="0.95"/>
      <rect x="6" y="10" width="6" height="28" rx="2" fill="white" opacity="0.85"/>
      <rect x="14" y="11" width="18" height="3" rx="1.5" fill="#0891b2"/>
      <rect x="14" y="17" width="9" height="2" rx="1" fill="#0891b2" opacity="0.5"/>
      <rect x="14" y="21" width="9" height="2" rx="1" fill="#0891b2" opacity="0.5"/>
      <rect x="14" y="25" width="6" height="2" rx="1" fill="#0891b2" opacity="0.4"/>
      <text x="24" y="37" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="10" font-weight="900" fill="#0891b2" letter-spacing="0.5">AI</text>
    </svg>
  </button>
  <div id="nb-window" aria-hidden="true">
    <div id="nb-header">
      <div id="nb-header-left">
        <span id="nb-header-icon">📰</span>
        <div>
          <strong>AI News Feed</strong>
          <span>Live updates</span>
        </div>
      </div>
      <div id="nb-live-dot"></div>
    </div>
    <div id="nb-list" aria-live="polite">${renderSkeleton()}</div>
    <div id="nb-footer">
      <span>via Hacker News</span>
      <button id="nb-refresh">↻ Refresh</button>
    </div>
  </div>
</div>`;

    document.body.insertAdjacentHTML('beforeend', html);

    document.getElementById('nb-toggle').addEventListener('click', () => {
      open = !open;
      const win = document.getElementById('nb-window');
      win.classList.toggle('nb-open', open);
      win.setAttribute('aria-hidden', !open);
      if (open && !loaded) load();
    });

    document.getElementById('nb-refresh').addEventListener('click', () => {
      cached = null;
      cachedAt = 0;
      load(true);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
