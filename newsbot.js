(function () {
  const RSS2JSON = 'https://api.rss2json.com/v1/api.json?rss_url=';
  const GNEWS   = 'https://news.google.com/rss/search?q=';
  const PARAMS  = '&hl=en-US&gl=US&ceid=US:en';

  const QUERIES = [
    'artificial intelligence 2025',
    'AI machine learning 2025',
    'SpaceX AI Starship 2025',
    'Cursor AI code editor 2025',
    'Google Gemini AI 2025',
    'Anthropic Claude AI 2025',
  ];

  let loaded = false;
  let open   = false;
  let cached = null;

  function timeAgo(dateStr) {
    const diff = (Date.now() - new Date(dateStr)) / 1000;
    if (diff < 3600)  return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return Math.floor(diff / 86400) + 'd ago';
  }

  async function fetchOne(query) {
    const rssUrl  = GNEWS + encodeURIComponent(query) + PARAMS;
    const apiUrl  = RSS2JSON + encodeURIComponent(rssUrl) + '&count=6';
    const res     = await fetch(apiUrl, { signal: AbortSignal.timeout(10000) });
    const data    = await res.json();
    return (data.items || []).map(it => ({
      title:  (it.title  || '').replace(/ - [^-]+$/, '').trim(),
      link:   it.link  || '#',
      pub:    it.pubDate || '',
      source: it.author || '',
    }));
  }

  async function fetchAll() {
    const results = await Promise.allSettled(QUERIES.map(fetchOne));
    const seen    = new Set();
    const all     = [];
    for (const r of results) {
      if (r.status === 'fulfilled') {
        for (const item of r.value) {
          if (!seen.has(item.title)) { seen.add(item.title); all.push(item); }
        }
      }
    }
    all.sort((a, b) => new Date(b.pub) - new Date(a.pub));
    return all;
  }

  function renderSkeleton() {
    return Array(5).fill(0).map(() => `
      <div class="nb-skeleton">
        <div class="nb-sk-line nb-sk-title"></div>
        <div class="nb-sk-line nb-sk-title" style="width:70%;margin-top:5px"></div>
        <div class="nb-sk-line nb-sk-src"></div>
      </div>`).join('');
  }

  function renderItems(items) {
    if (!items.length) return '<div class="nb-empty">No news found right now. Try refreshing.</div>';
    return items.map(it => `
      <a class="nb-item" href="${it.link}" target="_blank" rel="noopener">
        <div class="nb-item-title">${it.title}</div>
        <div class="nb-item-meta">
          ${it.source ? `<span class="nb-source">${it.source}</span>` : ''}
          ${it.pub    ? `<span class="nb-time">${timeAgo(it.pub)}</span>` : ''}
        </div>
      </a>`).join('');
  }

  async function load(force) {
    const list = document.getElementById('nb-list');
    if (!force && cached) { list.innerHTML = renderItems(cached); return; }
    list.innerHTML = renderSkeleton();
    try {
      cached = await fetchAll();
      list.innerHTML = renderItems(cached);
    } catch {
      list.innerHTML = '<div class="nb-empty">Could not load news right now. Try again shortly.</div>';
    }
    loaded = true;
  }

  function build() {
    const html = `
<div id="gs-newsbot">
  <button id="nb-toggle" aria-label="Open AI news feed">
    <svg viewBox="0 0 24 24" fill="white" width="22" height="22"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-1 14H5L10 13l2.5 3 3.5-4.5 3 5.5zM6.5 10c-.83 0-1.5-.67-1.5-1.5S5.67 7 6.5 7 8 7.67 8 8.5 7.33 10 6.5 10z"/></svg>
    <span id="nb-badge">AI</span>
  </button>
  <div id="nb-window" aria-hidden="true">
    <div id="nb-header">
      <div id="nb-header-left">
        <span id="nb-header-icon">📰</span>
        <div>
          <strong>AI News Feed</strong>
          <span>Live · Mixed topics</span>
        </div>
      </div>
      <div id="nb-live-dot"></div>
    </div>
    <div id="nb-list">${renderSkeleton()}</div>
    <div id="nb-footer">
      <span>Powered by Google News</span>
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
      cached = null; load(true);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
