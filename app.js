(function () {
  'use strict';

  const REFRESH_MS = 30000;
  const STATE_URL = './state.json?v=' + Date.now();

  let state = null;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }

  function relTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso).getTime();
    const diff = (Date.now() - d) / 1000;
    if (diff < 60) return Math.floor(diff) + 's ago';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
    return new Date(iso).toLocaleDateString();
  }

  function relFuture(iso) {
    if (!iso) return '—';
    const d = new Date(iso).getTime();
    const diff = (d - Date.now()) / 1000;
    if (diff < -60) return relTime(iso);
    if (diff < 60) return 'now';
    if (diff < 3600) return 'in ' + Math.floor(diff / 60) + 'm';
    if (diff < 86400) return 'in ' + Math.floor(diff / 3600) + 'h';
    return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function escape(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function renderMetrics(m) {
    const row = $('#metric-row');
    if (!m) return;
    row.innerHTML = `
      <div class="metric-card"><div class="m-label">Active automations</div><div class="m-value">${m.activeAutomations ?? '—'}</div></div>
      <div class="metric-card"><div class="m-label">Tools available</div><div class="m-value">${m.toolsAvailable ?? '—'}</div></div>
      <div class="metric-card"><div class="m-label">Posts this week</div><div class="m-value">${m.postsThisWeek ?? '—'}</div></div>
      <div class="metric-card"><div class="m-label">Articles in pipeline</div><div class="m-value">${m.articlesInPipeline ?? '—'}</div></div>
    `;
  }

  function renderRunning(items) {
    const root = $('#running-list');
    if (!items || items.length === 0) { root.innerHTML = '<div class="empty">No automations scheduled in the next 24h.</div>'; return; }
    root.innerHTML = items.map(it => `
      <div class="card">
        <div class="card-head">
          <div class="card-title">${escape(it.title || it.name)}</div>
          <div class="card-time">${escape(relFuture(it.nextRunAt))}</div>
        </div>
        <div class="card-meta">
          <span class="badge badge-cat">${escape(it.category || 'cron')}</span>
          ${it.tz ? `<span>${escape(it.tz)}</span>` : ''}
          ${it.cronExpr ? `<span class="badge badge-mute">${escape(it.cronExpr)}</span>` : ''}
        </div>
        ${it.summary ? `<div class="card-summary">${escape(it.summary)}</div>` : ''}
      </div>
    `).join('');
  }

  function renderCompleted(items) {
    const root = $('#completed-list');
    if (!items || items.length === 0) { root.innerHTML = '<div class="empty">No completed runs yet.</div>'; return; }
    root.innerHTML = items.map(it => {
      const cls = it.status === 'ok' ? 'badge-ok' : (it.status === 'failed' ? 'badge-err' : 'badge-warn');
      return `
        <div class="card">
          <div class="card-head">
            <div class="card-title">${escape(it.title || it.jobName)}</div>
            <div class="card-time">${escape(relTime(it.finishedAt || it.runAt))}</div>
          </div>
          <div class="card-meta">
            <span class="badge ${cls}">${escape(it.status || 'unknown')}</span>
            ${it.delivered ? '<span class="badge badge-cat">delivered</span>' : ''}
            ${it.durationMs != null ? `<span class="badge badge-mute">${Math.round(it.durationMs/1000)}s</span>` : ''}
          </div>
          ${it.summary ? `<div class="card-summary">${escape(it.summary)}</div>` : ''}
        </div>
      `;
    }).join('');
  }

  function renderPipeline(items) {
    const root = $('#pipeline-list');
    if (!items || items.length === 0) { root.innerHTML = '<div class="empty">No active initiatives.</div>'; return; }
    root.innerHTML = items.map(it => {
      const sCls = it.status === 'active' ? 'badge-ok' : (it.status === 'paused' ? 'badge-warn' : 'badge-mute');
      const crons = (it.crons && it.crons.length) ? `<div class="card-meta" style="margin-top:0.5rem">${it.crons.map(c => `<span class="badge badge-mute">${escape(c)}</span>`).join('')}</div>` : '';
      return `
        <div class="card">
          <div class="card-head">
            <div class="card-title">${escape(it.title)}</div>
            <div class="card-time">${escape(it.createdAt || '')}</div>
          </div>
          <div class="card-meta">
            <span class="badge badge-cat">${escape(it.category || 'misc')}</span>
            <span class="badge ${sCls}">${escape(it.status || 'unknown')}</span>
          </div>
          ${it.summary ? `<div class="card-summary">${escape(it.summary)}</div>` : ''}
          ${crons}
        </div>
      `;
    }).join('');
  }

  function renderSuggestions(items) {
    const root = $('#suggestions-list');
    if (!items || items.length === 0) { root.innerHTML = '<div class="empty">No suggestions right now.</div>'; return; }
    root.innerHTML = items.map((s, i) => `
      <div class="card">
        <div class="card-head">
          <div class="card-title">${escape(s.title || ('Idea ' + (i+1)))}</div>
        </div>
        ${s.category ? `<div class="card-meta"><span class="badge badge-cat">${escape(s.category)}</span></div>` : ''}
        ${s.body ? `<div class="card-summary">${escape(s.body)}</div>` : ''}
      </div>
    `).join('');
  }

  function setStatus(text, cls) {
    const pill = $('#status-pill');
    pill.classList.remove('warn', 'err');
    if (cls) pill.classList.add(cls);
    $('#status-text').textContent = text;
  }

  function applyState(s) {
    state = s;
    if (s.store && s.store.name) document.title = 'Voyage Ops · ' + s.store.name;
    renderMetrics(s.metrics);
    renderRunning(s.running);
    renderCompleted(s.completed);
    renderPipeline(s.pipeline);
    renderSuggestions(s.suggestions);
    $('#updated-text').textContent = 'Updated ' + relTime(s.generatedAt);
    setStatus('Live', null);
  }

  async function fetchState() {
    try {
      const url = './state.json?t=' + Date.now();
      const r = await fetch(url, { cache: 'no-store' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const s = await r.json();
      applyState(s);
    } catch (e) {
      setStatus('Offline', 'err');
      console.warn('fetch state failed:', e);
    }
  }

  function setupTabs() {
    const tabs = $$('.tab');
    tabs.forEach(t => t.addEventListener('click', () => {
      tabs.forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      $$('.panel').forEach(p => p.classList.remove('active'));
      $('#panel-' + t.dataset.tab).classList.add('active');
    }));
  }

  function setupRefreshBtn() {
    $('#refresh-now').addEventListener('click', fetchState);
  }

  // PWA: register service worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }

  setupTabs();
  setupRefreshBtn();
  fetchState();
  setInterval(() => {
    fetchState();
    // also tick relative timestamps
    if (state) $('#updated-text').textContent = 'Updated ' + relTime(state.generatedAt);
  }, REFRESH_MS);
})();
