(() => {
  'use strict';

  const STATUS = { 1: '已废止', 2: '已修改', 3: '有效', 4: '尚未生效' };
  const CAT_ORDER = [100, 110, 120, 130, 140, 150, 155, 160, 170, 180, 102];
  const FS_STEPS = [0.9, 1, 1.1, 1.2, 1.35];
  const LH_STEPS = [1.7, 1.9, 2.15];
  const PAGE_SIZE = 30;

  const S = {
    index: null,
    famById: new Map(),
    famByB: new Map(),
    lawCache: new Map(),
    shards: {},
    view: 'list',
    q: '',
    ft: null,
    ftBusy: false,
    cat: 0,
    status: JSON.parse(localStorage.getItem('law-status') || '[3,4]'),
    yearFrom: '', yearTo: '',
    agency: '',
    sort: 'lx',
    page: 1,
    expanded: new Set(),
    recent: JSON.parse(localStorage.getItem('law-recent') || '[]'),
    prefs: JSON.parse(localStorage.getItem('law-prefs') || '{"fs":1,"lh":1}'),
  };

  const app = () => document.getElementById('law-app');

  try { localStorage.removeItem('law-favs'); } catch (e) {}

  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const saveLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

  const normTitle = t => String(t || '').replace(/\s+/g, '');

  function catName(c) { return (S.index.cats && S.index.cats[c]) || '其他'; }

  function statusBadge(s) {
    return `<span class="law-badge s${s}">${STATUS[s] || '未知'}</span>`;
  }

  function statusOK(s) { return S.status.includes(s); }

  function primaryVersion(fam) {
    for (let i = fam.v.length - 1; i >= 0; i--) {
      if (statusOK(fam.v[i].s)) return fam.v[i];
    }
    return null;
  }

  function versionMatch(fam) {
    return fam.v.filter(v => statusOK(v.s));
  }

  async function fetchJSON(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + url);
    return r.json();
  }

  function ensureShard(cat) {
    if (S.shards[cat]) return S.shards[cat];
    S.shards[cat] = fetchJSON(`/laws/search/cat-${cat}.json`).catch(() => null);
    return S.shards[cat];
  }

  function bigrams(text) {
    const out = new Set();
    let buf = [];
    const flush = () => {
      if (buf.length) {
        const s = buf.join('');
        if (/[a-z0-9]/i.test(buf[0])) { out.add(s.slice(0, 24)); }
        else {
          for (let i = 0; i < s.length - 1; i++) out.add(s.slice(i, i + 2));
          if (s.length === 1) out.add(s);
        }
        buf = [];
      }
    };
    for (const ch of String(text)) {
      if (/[\u4e00-\u9fff]/.test(ch)) { buf.push(ch); }
      else if (/[a-zA-Z0-9]/.test(ch)) { buf.push(ch.toLowerCase()); }
      else { flush(); }
    }
    flush();
    return [...out];
  }

  async function fullTextSearch(q) {
    const toks = bigrams(q);
    if (!toks.length) { S.ft = null; return; }
    const cats = S.cat ? [S.cat]
      : [...new Set(S.index.families.map(f => f.c))].filter(c => c);
    const shards = (await Promise.all(cats.map(ensureShard))).filter(Boolean);
    const hits = [];
    for (const sh of shards) {
      if (!sh || !sh.d) continue;
      const lists = toks.map(t => sh.i[t]);
      if (lists.some(l => !l || !l.length)) continue;
      const cnt = new Map();
      for (const l of lists) for (const di of l) cnt.set(di, (cnt.get(di) || 0) + 1);
      const need = toks.length;
      const scored = [];
      for (const [di, c] of cnt) if (c === need) scored.push([di, c]);
      if (!scored.length) {
        for (const [di, c] of cnt) scored.push([di, c]);
      }
      scored.sort((a, b) => b[1] - a[1]);
      for (const [di] of scored.slice(0, 80)) hits.push(sh.d[di]);
    }
    S.ft = hits.slice(0, 60);
  }

  function highlight(text, q) {
    const e = esc(text);
    if (!q) return e;
    try {
      const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      return e.replace(re, m => `<mark>${m}</mark>`);
    } catch (err) { return e; }
  }

  function filterFamilies() {
    const qn = normTitle(S.q);
    const yf = parseInt(S.yearFrom, 10) || 0;
    const yt = parseInt(S.yearTo, 10) || 9999;
    return S.index.families.filter(f => {
      if (S.cat && f.c !== S.cat) return false;
      if (!versionMatch(f).length) return false;
      if (S.agency && !f.v.some(v => v.o === S.agency)) return false;
      if (yf || yt !== 9999) {
        const inRange = f.v.some(v => {
          if (!statusOK(v.s) || !v.g) return false;
          const y = parseInt(v.g.slice(0, 4), 10) || 0;
          return y >= yf && y <= yt;
        });
        if (!inRange) return false;
      }
      if (qn && !normTitle(f.t).includes(qn)) return false;
      return true;
    });
  }

  function sortFamilies(arr) {
    const arr2 = arr.slice();
    if (S.sort === 'lx') arr2.sort((a, b) => (b.lx || '').localeCompare(a.lx || ''));
    else if (S.sort === 'gd') arr2.sort((a, b) => (b.lg || '').localeCompare(a.lg || ''));
    else if (S.sort === 'ga') arr2.sort((a, b) => (a.lg || '').localeCompare(b.lg || ''));
    else arr2.sort((a, b) => a.t.localeCompare(b.t, 'zh-Hans-CN'));
    return arr2;
  }

  function yearsRange() {
    const ys = new Set();
    for (const f of S.index.families) for (const v of f.v) {
      if (v.g) ys.add(parseInt(v.g.slice(0, 4), 10) || 0);
    }
    return [...ys].filter(Boolean).sort((a, b) => a - b);
  }

  function agencyOptions() {
    const set = new Set();
    for (const f of S.index.families) for (const v of f.v) if (v.o) set.add(v.o);
    return [...set].sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));
  }

  function famCard(f) {
    const pv = primaryVersion(f) || f.v[f.v.length - 1];
    const expanded = S.expanded.has(f.id);
    const nver = f.v.length;
    let versions = '';
    if (expanded) {
      versions = `<div class="law-versions">` + f.v.slice().reverse().map(v => {
        const cur = v.b === pv.b ? '<span class="law-current-tag">当前展示</span>' : '';
        return `<div class="law-vrow">${statusBadge(v.s)}<a href="#/law/${v.b}">公布 ${esc(v.g || '—')} · 施行 ${esc(v.x || '—')}${cur}</a></div>`;
      }).join('') + `</div>`;
    }
    return `<div class="law-card" data-fam="${f.id}">
      <div class="law-card-head">
        <div class="law-card-title"><a href="#/law/${pv.b}">${esc(f.t)}</a> <span class="law-cat-badge">${esc(catName(f.c))}</span></div>
      </div>
      <div class="law-card-meta">
        ${statusBadge(pv.s)}
        <span class="law-date">公布 ${esc(pv.g || '—')}</span>
        <span class="law-date">施行 ${esc(pv.x || '—')}</span>
        <span>${esc(pv.o || '')}</span>
        ${nver > 1 ? `<button class="law-vtoggle" data-act="vexp" data-fam="${f.id}">${nver} 个版本 ${expanded ? '▴' : '▾'}</button>` : ''}
      </div>
      ${versions}
    </div>`;
  }

  function buildLibraryList() {
    const fams = sortFamilies(filterFamilies());
    const q = S.q.trim();
    let listPart = '';
    if (q && S.ft && S.ft.length) {
      const titleHits = fams.slice(0, 8);
      const byFam = new Map();
      for (const d of S.ft) {
        if (!byFam.has(d.f)) byFam.set(d.f, []);
        byFam.get(d.f).push(d);
      }
      const hitsHtml = [...byFam.entries()].map(([fid, docs]) => {
        const fam = S.famById.get(fid);
        if (!fam) return '';
        const first = docs[0];
        const more = docs.length > 1 ? ` 等 ${docs.length} 处` : '';
        return `<div class="law-hit">
          <div class="law-hit-head"><a href="#/law/${first.b}/${encodeURIComponent(first.a || '')}">${esc(fam.t)}</a>${statusBadge((S.famByB.get(first.b) || {}).s || fam.ls)}<span class="law-cat-badge">${esc(catName(fam.c))}</span></div>
          <div class="law-hit-snippet">${first.a ? `<b>${esc(first.a)}</b>　` : ''}${highlight(first.s, q)}${more}</div>
        </div>`;
      }).join('');
      listPart = `
        ${titleHits.length ? `<div class="law-section-title">标题匹配</div>${titleHits.map(famCard).join('')}` : ''}
        <div class="law-section-title">全文命中（${S.ft.length}）</div>
        <div class="law-search-results">${hitsHtml || '<p class="law-stats">没有找到条文内容。</p>'}</div>`;
    } else {
      const shown = fams.slice(0, S.page * PAGE_SIZE);
      listPart = `${shown.map(famCard).join('')}
        ${fams.length > shown.length ? `<div class="law-more"><button data-act="more">加载更多（已显示 ${shown.length} / ${fams.length}）</button></div>` : ''}`;
    }
    return listPart;
  }

  function renderLibrary(options = {}) {
    if (options.resultsOnly) {
      const results = document.getElementById('law-results');
      if (results) {
        results.innerHTML = buildLibraryList();
        return;
      }
    }

    const listPart = buildLibraryList();
    const fams = sortFamilies(filterFamilies());
    const q = S.q.trim();
    const catsPresent = [...new Set(S.index.families.map(f => f.c))]
      .sort((a, b) => CAT_ORDER.indexOf(a) - CAT_ORDER.indexOf(b));
    const catChips = [`<button class="law-chip${S.cat === 0 ? ' active' : ''}" data-act="cat" data-v="0">全部</button>`]
      .concat(catsPresent.map(c => `<button class="law-chip${S.cat === c ? ' active' : ''}" data-act="cat" data-v="${c}">${esc(catName(c))}</button>`)).join('');
    const statusChips = [3, 4, 2, 1].map(s =>
      `<button class="law-chip${S.status.includes(s) ? ' active' : ''}" data-act="status" data-v="${s}">${STATUS[s]}</button>`).join('');
    const ys = yearsRange();
    const yearOpts = ys.map(y => `<option value="${y}">${y}</option>`).join('');
    const agOpts = agencyOptions().map(a => `<option value="${esc(a)}"${S.agency === a ? ' selected' : ''}>${esc(a)}</option>`).join('');
    const sortOpts = `
      <option value="lx"${S.sort === 'lx' ? ' selected' : ''}>按施行日期 新→旧</option>
      <option value="gd"${S.sort === 'gd' ? ' selected' : ''}>按公布日期 新→旧</option>
      <option value="ga"${S.sort === 'ga' ? ' selected' : ''}>按公布日期 旧→新</option>
      <option value="tt"${S.sort === 'tt' ? ' selected' : ''}>按标题</option>`;
    const recentChips = S.recent.slice(0, 8).map(r =>
      `<a class="law-chip" href="#/law/${r.b}" title="${esc(r.t)}">${esc(r.t.length > 14 ? r.t.slice(0, 14) + '…' : r.t)}</a>`).join('');

    app().innerHTML = `
      <div class="law-toolbar">
        <div class="law-searchbox">
          <input id="law-q" type="text" autocomplete="off" enterkeyhint="search" placeholder="搜索法律名称或条文内容，回车执行全文检索" value="${esc(S.q)}">
          <button class="law-clear" data-act="clearq" title="清空"${q ? '' : ' hidden'}>✕</button>
        </div>
        <div class="law-view-toggle">
          <button class="${S.view === 'list' ? 'active' : ''}" data-act="viewlist">列表</button>
          <button class="${S.view === 'timeline' ? 'active' : ''}" data-act="viewtl">时间轴</button>
        </div>
      </div>
      <div class="law-stats">共 ${S.index.families.length} 部法律 · ${S.index.families.reduce((a, f) => a + f.v.length, 0)} 个版本 · 数据更新于 ${esc(S.index.generated)}</div>
      <div class="law-filters">
        <div class="law-filter-row"><span class="law-filter-label">分类</span>${catChips}</div>
        <div class="law-filter-row"><span class="law-filter-label">状态</span>${statusChips}
          <span class="law-filter-label" style="margin-left:8px">公布年份</span>
          <select class="law-select" id="law-yf"><option value="">从</option>${yearOpts}</select>
          <select class="law-select" id="law-yt"><option value="">至</option>${yearOpts}</select>
          <select class="law-select" id="law-agency"><option value="">全部机关</option>${agOpts}</select>
          <select class="law-select" id="law-sort">${sortOpts}</select>
        </div>
      </div>
      ${recentChips ? `<div class="law-recent-row"><span class="law-filter-label">最近浏览</span>${recentChips}</div>` : ''}
      ${S.view === 'list' ? `<div id="law-results">${listPart}</div>` : `<div id="law-results">${renderTimeline(fams)}</div>`}
    `;

    const yf = document.getElementById('law-yf');
    const yt = document.getElementById('law-yt');
    if (yf) yf.value = S.yearFrom;
    if (yt) yt.value = S.yearTo;
    const inp = document.getElementById('law-q');
    if (inp) {
      inp.addEventListener('compositionstart', () => {
        isComposing = true;
        clearTimeout(searchTimer);
      });
      inp.addEventListener('compositionend', e => {
        isComposing = false;
        S.q = e.target.value;
        if (S.q.trim().length >= 2) runSearch(S.q);
        else { S.ft = null; renderLibrary({ resultsOnly: true }); }
      });
      inp.addEventListener('input', onSearchInput);
      inp.addEventListener('keydown', e => {
        if (e.isComposing || isComposing) return;
        if (e.key === 'Enter') { e.preventDefault(); runSearch(inp.value); }
      });
      if (q) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
    }
  }

  function renderTimeline(fams) {
    const byYear = new Map();
    for (const f of fams) {
      for (const v of versionMatch(f)) {
        if (!v.x && !v.g) continue;
        const y = (v.x || v.g).slice(0, 4);
        if (!byYear.has(y)) byYear.set(y, []);
        byYear.get(y).push({ f, v });
      }
    }
    const years = [...byYear.keys()].sort((a, b) => b.localeCompare(a));
    if (!years.length) return '<p class="law-stats">当前筛选下没有可展示的版本。</p>';
    return years.map(y => {
      const items = byYear.get(y).sort((a, b) => (b.v.x || b.v.g || '').localeCompare(a.v.x || a.v.g || ''));
      return `<div class="law-tl-year">${y}</div>` + items.map(({ f, v }) =>
        `<div class="law-tl-item"><span class="law-tl-date">${esc(v.x || v.g)}</span><a href="#/law/${v.b}">${esc(f.t)}</a>${statusBadge(v.s)}</div>`
      ).join('');
    }).join('');
  }

  let searchTimer = null;
  let isComposing = false;

  function onSearchInput(e) {
    const val = e.target.value;
    S.q = val;
    const clearBtn = document.querySelector('.law-clear');
    if (clearBtn) clearBtn.hidden = !val;
    if (isComposing || e.isComposing) return;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      if (val.trim().length >= 2) runSearch(val);
      else { S.ft = null; renderLibrary({ resultsOnly: true }); }
    }, 350);
  }

  async function runSearch(val) {
    S.q = val;
    if (val.trim().length < 2) { S.ft = null; renderLibrary(); return; }
    if (S.ftBusy) return;
    S.ftBusy = true;
    try { await fullTextSearch(val.trim()); } finally { S.ftBusy = false; }
    renderLibrary({ resultsOnly: true });
  }

  async function fetchLaw(bbbs) {
    if (S.lawCache.has(bbbs)) return S.lawCache.get(bbbs);
    const law = await fetchJSON(`/laws/data/${bbbs}.json`);
    S.lawCache.set(bbbs, law);
    return law;
  }

  function buildTOC(law) {
    const items = [];
    law.blocks.forEach((b, i) => {
      if (b.t === 'h1' || b.t === 'h2' || b.t === 'h3') {
        items.push(`<a href="#/law/${law.b}/${i}" data-blk="${i}" class="lv-${b.t}">${esc(b.x)}</a>`);
      } else if (b.t === 'art') {
        items.push(`<a href="#/law/${law.b}/${i}" data-blk="${i}" class="lv-art">${esc(b.l)}</a>`);
      }
    });
    return items.join('');
  }

  function renderBlocks(law) {
    let firstP = true;
    return law.blocks.map((b, i) => {
      if (b.t === 'h1') return `<h2 class="law-h1" id="blk-${i}">${esc(b.x)}</h2>`;
      if (b.t === 'h2') return `<h3 class="law-h2" id="blk-${i}">${esc(b.x)}</h3>`;
      if (b.t === 'h3') return `<h4 class="law-h3" id="blk-${i}">${esc(b.x)}</h4>`;
      if (b.t === 'p') {
        const cls = firstP ? 'law-p first' : 'law-p';
        firstP = false;
        return `<p class="${cls}" id="blk-${i}">${esc(b.x)}</p>`;
      }
      if (b.t === 'art') {
        return `<div class="law-art" id="blk-${i}"><button class="law-copy" data-act="copy" data-blk="${i}" title="复制本条">⧉ 复制</button>${esc(b.x)}</div>`;
      }
      return '';
    }).join('');
  }

  async function renderReader(bbbs, target) {
    const ref = S.famByB.get(bbbs);
    if (!ref) { app().innerHTML = '<div class="law-error">未找到该法律，<a href="#/">返回文库</a>。</div>'; return; }
    const fam = ref.fam;
    let law;
    try { law = await fetchLaw(bbbs); }
    catch (e) { app().innerHTML = `<div class="law-error">加载失败：${esc(e.message)}，<a href="#/law/${fam.lb}">尝试最新版本</a></div>`; return; }

    S.recent = [{ b: bbbs, f: fam.id, t: law.t, ts: Date.now() }]
      .concat(S.recent.filter(r => r.f !== fam.id)).slice(0, 12);
    saveLS('law-recent', S.recent);

    const vchips = fam.v.slice().reverse().map(v =>
      `<a class="law-vchip${v.b === bbbs ? ' active' : ''}" href="#/law/${v.b}" title="${esc(v.o || '')}"><span class="law-vdot s${v.s}"></span>${STATUS[v.s]} ${esc(v.g || '')}</a>`).join('');

    app().innerHTML = `
      <div class="law-reader-head">
        <a class="law-back" href="#/">← 返回文库</a>
        <div class="law-reader-title">${esc(law.t)}</div>
        <div class="law-reader-meta">
          ${statusBadge(law.m.s)}
          <span>公布 ${esc(law.m.g || '—')}</span>
          <span>施行 ${esc(law.m.x || '—')}</span>
          <span>${esc(law.m.o || '')}</span>
          <a href="https://flk.npc.gov.cn/detail?id=${encodeURIComponent(law.b)}" target="_blank" rel="noopener">官网原文 ↗</a>
        </div>
        ${fam.v.length > 1 ? `<div class="law-vswitch">${vchips}</div>` : ''}
        <div class="law-reader-actions">
          <button class="law-abtn" data-act="fsdown">A−</button>
          <button class="law-abtn" data-act="fsup">A+</button>
          <button class="law-abtn" data-act="lh">行距</button>
        </div>
      </div>
      <div class="law-reader-body">
        <nav class="law-toc" id="law-toc">
          <div class="law-toc-title">目录 <button data-act="tocfold">收起</button></div>
          <div class="law-toc-links">${buildTOC(law)}</div>
        </nav>
        <div class="law-doc">${renderBlocks(law)}</div>
      </div>`;
    const toc = document.getElementById('law-toc');
    const tocToggle = toc?.querySelector('button');
    const syncTocToggle = () => {
      if (!toc || !tocToggle) return;
      const collapsed = toc.classList.contains('collapsed');
      tocToggle.textContent = collapsed ? '展开' : '收起';
      tocToggle.setAttribute('aria-label', collapsed ? '展开目录' : '收起目录');
      try { localStorage.setItem('lawTocCollapsed', collapsed ? '1' : '0'); } catch (e) {}
    };
    try {
      if (localStorage.getItem('lawTocCollapsed') === '1') toc.classList.add('collapsed');
    } catch (e) {}
    syncTocToggle();
    toc.classList.add('visible');
    applyPrefs();
    bindTocHighlight();

    if (target != null) {
      const el = document.getElementById('blk-' + target);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ block: 'start' });
          el.classList.add('flash');
          setTimeout(() => el.classList.remove('flash'), 1800);
        }, 60);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }

  function applyPrefs() {
    const el = app();
    if (!el) return;
    el.style.setProperty('--law-fs', FS_STEPS[S.prefs.fs] + 'rem');
    el.style.setProperty('--law-lh', LH_STEPS[S.prefs.lh]);
  }

  let tocHandler = null;
  function bindTocHighlight() {
    if (tocHandler) window.removeEventListener('scroll', tocHandler);
    const links = [...document.querySelectorAll('#law-toc a[data-blk]')];
    if (!links.length) return;
    tocHandler = () => {
      let active = links[0];
      for (const a of links) {
        const el = document.getElementById('blk-' + a.dataset.blk);
        if (el && el.getBoundingClientRect().top < 130) active = a;
      }
      links.forEach(a => a.classList.toggle('active', a === active));
      if (active && active.getBoundingClientRect().top < 0 || active.getBoundingClientRect().bottom > innerHeight) {
        active.scrollIntoView({ block: 'nearest' });
      }
    };
    window.addEventListener('scroll', tocHandler, { passive: true });
    tocHandler();
  }

  function copyText(text) {
    const done = () => {
      const tip = document.createElement('div');
      tip.className = 'law-copy-tip';
      tip.textContent = '已复制到剪贴板';
      document.body.appendChild(tip);
      setTimeout(() => tip.remove(), 1400);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => {});
    } else {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) {}
      ta.remove();
    }
  }

  function route() {
    const h = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
    const parts = h.split('/').filter(Boolean);
    document.body.classList.add('law-page');
    if (parts[0] === 'law' && parts[1]) {
      const target = parts[2] && /^\d+$/.test(parts[2]) ? parseInt(parts[2], 10) : null;
      renderReader(parts[1], target);
    } else if (parts[0] === 'timeline') {
      S.view = 'timeline';
      renderLibrary();
    } else {
      if (parts[0] !== 'timeline' && S.view === 'timeline' && !parts.length) S.view = 'list';
      renderLibrary();
    }
  }

  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const act = btn.dataset.act;
    if (act === 'vexp') {
      e.preventDefault();
      const id = btn.dataset.fam;
      if (S.expanded.has(id)) S.expanded.delete(id); else S.expanded.add(id);
      renderLibrary();
    } else if (act === 'more') {
      S.page += 1; renderLibrary();
    } else if (act === 'cat') {
      S.cat = parseInt(btn.dataset.v, 10) || 0; S.page = 1; S.ft = null; renderLibrary();
    } else if (act === 'status') {
      const v = parseInt(btn.dataset.v, 10);
      const i = S.status.indexOf(v);
      if (i >= 0) { if (S.status.length > 1) S.status.splice(i, 1); }
      else S.status.push(v);
      saveLS('law-status', S.status); S.page = 1; renderLibrary();
    } else if (act === 'viewlist') {
      S.view = 'list'; renderLibrary();
    } else if (act === 'viewtl') {
      S.view = 'timeline'; renderLibrary();
    } else if (act === 'clearq') {
      S.q = ''; S.ft = null; renderLibrary();
    } else if (act === 'copy') {
      e.preventDefault();
      const idx = parseInt(btn.dataset.blk, 10);
      const b = route_bbbs();
      const law = S.lawCache.get(b);
      if (law && law.blocks[idx]) {
        copyText(`${law.t}${law.blocks[idx].l || ''}：${law.blocks[idx].x}`);
      }
    } else if (act === 'fsdown') {
      S.prefs.fs = Math.max(0, S.prefs.fs - 1); saveLS('law-prefs', S.prefs); applyPrefs();
    } else if (act === 'fsup') {
      S.prefs.fs = Math.min(FS_STEPS.length - 1, S.prefs.fs + 1); saveLS('law-prefs', S.prefs); applyPrefs();
    } else if (act === 'lh') {
      S.prefs.lh = (S.prefs.lh + 1) % LH_STEPS.length; saveLS('law-prefs', S.prefs); applyPrefs();
    } else if (act === 'tocfab') {
      const toc = document.getElementById('law-toc');
      if (toc) toc.classList.toggle('open');
    } else if (act === 'tocfold') {
      const toc = document.getElementById('law-toc');
      if (toc) {
        toc.classList.toggle('collapsed');
        btn.textContent = toc.classList.contains('collapsed') ? '展开' : '收起';
        btn.setAttribute('aria-label', toc.classList.contains('collapsed') ? '展开目录' : '收起目录');
        try { localStorage.setItem('lawTocCollapsed', toc.classList.contains('collapsed') ? '1' : '0'); } catch (e) {}
      }
    }
  });

  function route_bbbs() {
    const h = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
    const parts = h.split('/').filter(Boolean);
    return parts[0] === 'law' ? parts[1] : null;
  }

  document.addEventListener('change', e => {
    if (e.target.id === 'law-yf') { S.yearFrom = e.target.value; S.page = 1; renderLibrary(); }
    else if (e.target.id === 'law-yt') { S.yearTo = e.target.value; S.page = 1; renderLibrary(); }
    else if (e.target.id === 'law-agency') { S.agency = e.target.value; S.page = 1; renderLibrary(); }
    else if (e.target.id === 'law-sort') { S.sort = e.target.value; renderLibrary(); }
  });

  window.addEventListener('hashchange', route);

  async function init() {
    try {
      S.index = await fetchJSON('/laws/index.json');
      for (const f of S.index.families) {
        S.famById.set(f.id, f);
        f.v.forEach((v, vi) => S.famByB.set(v.b, { fam: f, vi, s: v.s }));
      }
      route();
    } catch (e) {
      app().innerHTML = `<div class="law-error">数据加载失败：${esc(e.message)}</div>`;
    }
  }

  init();
})();
