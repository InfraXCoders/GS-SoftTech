(function () {
  const PROXIES = [
    'https://corsproxy.io/?',
    'https://api.allorigins.win/get?url=',
  ];
  const GNEWS = 'https://news.google.com/rss/search?q=';
  const PARAMS = '&hl=en-US&gl=US&ceid=US:en';

  const CATEGORIES = [
    { id: 'latest',    label: '🔥 Latest',    query: 'artificial intelligence 2025' },
    { id: 'ai',        label: '🤖 AI News',   query: 'AI machine learning deep learning 2025' },
    { id: 'spacex',    label: '🚀 SpaceX AI', query: 'SpaceX AI Starship Elon Musk 2025' },
    { id: 'cursor',    label: '⌨️ Cursor',    query: 'Cursor AI code editor IDE 2025' },
    { id: 'gemini',    label: '✨ Gemini',    query: 'Google Gemini AI model 2025' },
    { id: 'claude',    label: '🧠 Claude',    query: 'Anthropic Claude AI 2025' },
  ];

  const cache = {};
  let currentCat = 'latest';
  let open = false;

  function timeAgo(dateStr) {
    const diff = (Date.now() - new Date(dateStr)) / 1000;
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return Math.floor(diff / 86400) + 'd ago';
  }

  function parseRSS(xml) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    const items = Array.from(doc.querySelectorAll('item')).slice(0, 8);
    return items.map(item => {
      const title = item.querySelector('title')?.textContent || '';
      const link  = item.querySelector('link')?.textContent || '#';
      const pub   = item.querySelector('pubDate')?.textContent || '';
      const src   = item.querySelector('source')?.textContent || '';
      const desc  = item.querySelector('description')?.textContent || '';
      const cleanDesc = desc.replace(/<[^>]+>/g, '').trim().slice(0, 100);
      return { title: title.replace(/ - [^-]+$/, ''), link, pub, src, cleanDesc };
    });
  }

  async function fetchNews(catId) {
    if (cache[catId]) return cache[catId];
    const cat = CATEGORIES.find(c => c.id === catId);
    const url = GNEWS + encodeURIComponent(cat.query) + PARAMS;
    let lastErr;
    for (const proxy of PROXIES) {
      try {
        const proxyUrl = proxy + encodeURIComponent(url);
        const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) });
        const text = proxy.includes('allorigins')
          ? (await res.json()).contents
          : await res.text();
        const items = parseRSS(text);
        if (items.length) { cache[catId] = items; return items; }
      } catch(e) { lastErr = e; }
    }
    throw lastErr || new Error('All proxies failed');
  }

  function renderSkeleton() {
    return Array(4).fill(0).map(() => `
      <div class="nb-skeleton">
        <div class="nb-sk-line nb-sk-title"></div>
        <div class="nb-sk-line nb-sk-src"></div>
      </div>`).join('');
  }

  function renderItems(items) {
    if (!items.length) return '<div class="nb-empty">No news found. Try again later.</div>';
    return items.map(it => `
      <a class="nb-item" href="${it.link}" target="_blank" rel="noopener">
        <div class="nb-item-title">${it.title}</div>
        ${it.cleanDesc ? `<div class="nb-item-desc">${it.cleanDesc}…</div>` : ''}
        <div class="nb-item-meta">
          ${it.src ? `<span class="nb-source">${it.src}</span>` : ''}
          ${it.pub ? `<span class="nb-time">${timeAgo(it.pub)}</span>` : ''}
        </div>
      </a>`).join('');
  }

  async function loadCategory(catId) {
    const list = document.getElementById('nb-list');
    list.innerHTML = renderSkeleton();
    currentCat = catId;
    document.querySelectorAll('.nb-tab').forEach(t => {
      t.classList.toggle('nb-tab-active', t.dataset.cat === catId);
    });
    try {
      const items = await fetchNews(catId);
      list.innerHTML = renderItems(items);
    } catch {
      list.innerHTML = '<div class="nb-empty">⚠️ Could not load news. Check your connection.</div>';
    }
  }

  function buildNewsbot() {
    const tabs = CATEGORIES.map(c =>
      `<button class="nb-tab${c.id === currentCat ? ' nb-tab-active' : ''}" data-cat="${c.id}">${c.label}</button>`
    ).join('');

    const html = `
<div id="gs-newsbot">
  <button id="nb-toggle" aria-label="Open news feed">
    <svg viewBox="0 0 24 24" fill="white" width="22" height="22"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-1 14H5L10 13l2.5 3 3.5-4.5 3 5.5zM6.5 10c-.83 0-1.5-.67-1.5-1.5S5.67 7 6.5 7 8 7.67 8 8.5 7.33 10 6.5 10z"/></svg>
    <span id="nb-badge">AI</span>
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
    <div id="nb-tabs">${tabs}</div>
    <div id="nb-list">${renderSkeleton()}</div>
    <div id="nb-footer">
      <span>Powered by Google News</span>
      <button id="nb-refresh" title="Refresh">↻ Refresh</button>
    </div>
  </div>
</div>`;

    document.body.insertAdjacentHTML('beforeend', html);

    const toggle = document.getElementById('nb-toggle');
    const win    = document.getElementById('nb-window');

    toggle.addEventListener('click', () => {
      open = !open;
      win.classList.toggle('nb-open', open);
      win.setAttribute('aria-hidden', !open);
      if (open && !cache[currentCat]) loadCategory(currentCat);
    });

    document.getElementById('nb-tabs').addEventListener('click', e => {
      const tab = e.target.closest('.nb-tab');
      if (tab) loadCategory(tab.dataset.cat);
    });

    document.getElementById('nb-refresh').addEventListener('click', () => {
      delete cache[currentCat];
      loadCategory(currentCat);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildNewsbot);
  } else {
    buildNewsbot();
  }
})();
