(function () {
  const HN = 'https://hn.algolia.com/api/v1/search?tags=story&hitsPerPage=8&query=';
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
  let loaded = false;

  function timeAgo(iso) {
    const diff = (Date.now() - new Date(iso)) / 1000;
    if (diff < 3600)  return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return Math.floor(diff / 86400) + 'd ago';
  }

  async function fetchOne(query) {
    const res  = await fetch(HN + encodeURIComponent(query), { signal: AbortSignal.timeout(8000) });
    const data = await res.json();
    return (data.hits || []).map(h => ({
      title:  h.title || '',
      link:   h.url || ('https://news.ycombinator.com/item?id=' + h.objectID),
      pub:    h.created_at || '',
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
        if (item.title && !seen.has(item.title)) {
          seen.add(item.title);
          all.push(item);
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
        <div class="nb-sk-line nb-sk-title" style="width:65%;margin-top:5px"></div>
        <div class="nb-sk-line nb-sk-src"></div>
      </div>`).join('');
  }

  function renderItems(items) {
    if (!items.length) return '<div class="nb-empty">No articles found. Try refreshing.</div>';
    return items.map(it => `
      <a class="nb-item" href="${it.link}" target="_blank" rel="noopener">
        <div class="nb-item-title">${it.title}</div>
        <div class="nb-item-meta">
          <span class="nb-source">${it.source}</span>
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
    if (!force && cached) { list.innerHTML = renderItems(cached); return; }
    list.innerHTML = renderSkeleton();
    try {
      cached = await fetchAll();
      list.innerHTML = renderItems(cached);
    } catch (e) {
      list.innerHTML = '<div class="nb-empty">Could not load articles. Try refreshing.</div>';
    }
    loaded = true;
  }

  function build() {
    const html = `
<div id="gs-newsbot">
  <button id="nb-toggle" aria-label="Open AI news feed">
    <span id="nb-ai-label">AI</span>
  </button>
  <div id="nb-window" aria-hidden="true">
    <div id="nb-header">
      <div id="nb-header-left">
        <span id="nb-header-icon">📰</span>
        <div>
          <strong>AI News Feed</strong>
          <span>Live · AI · SpaceX · Cursor · Gemini · Claude</span>
        </div>
      </div>
      <div id="nb-live-dot"></div>
    </div>
    <div id="nb-list">${renderSkeleton()}</div>
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
      load(true);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
