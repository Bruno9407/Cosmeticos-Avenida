/* Cosméticos Avenida — núcleo: utilitários, armazenamento, roteador, eventos, imagens */
(function () {
  'use strict';
  const AV = (window.AV = { A: {}, F: {}, I: {}, V: {}, AD: {}, ui: {}, S: {} });

  /* ---------- armazenamento (localStorage com fallback em memória) ---------- */
  // Armazenamento: IndexedDB (centenas de MB — comporta catálogo enorme) com cópia em memória.
  // Se o IndexedDB não existir, cai para localStorage (limite ~5 MB).
  const mem = {};
  let idb = null;
  AV.KEY = 'avenida_';
  AV.initStorage = () => new Promise((resolve) => {
    let done = false; const fin = () => { if (!done) { done = true; resolve(); } };
    try {
      const req = indexedDB.open('avenida-db', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('kv');
      req.onerror = () => { idb = null; fin(); };
      req.onsuccess = () => {
        idb = req.result;
        try {
          const tx = idb.transaction('kv', 'readonly'); const st = tx.objectStore('kv');
          const cur = st.openCursor();
          cur.onsuccess = () => { const c = cur.result; if (c) { mem[c.key] = c.value; c.continue(); } else fin(); };
          cur.onerror = () => { idb = null; fin(); };
        } catch (e) { idb = null; fin(); }
      };
      setTimeout(fin, 4000);
    } catch (e) { idb = null; fin(); }
  });
  AV.load = (k, d) => {
    if (k in mem) return mem[k];
    if (!idb) { try { const v = localStorage.getItem(AV.KEY + k); if (v) return JSON.parse(v); } catch (e) { /* sem localStorage */ } }
    return d;
  };
  AV.save = (k, v) => {
    mem[k] = v;
    if (idb) {
      try { const tx = idb.transaction('kv', 'readwrite'); tx.objectStore('kv').put(JSON.parse(JSON.stringify(v === undefined ? null : v)), k); tx.onerror = () => AV.toast('Não consegui salvar no navegador.'); return true; }
      catch (e) { AV.toast('Não consegui salvar no navegador.'); return false; }
    }
    try { localStorage.setItem(AV.KEY + k, JSON.stringify(v)); return true; }
    catch (e) { AV.toast('Memória do navegador cheia. Exporte um backup em Configurações.'); return false; }
  };
  AV.removeKey = (k) => { delete mem[k]; if (idb) { try { idb.transaction('kv', 'readwrite').objectStore('kv').delete(k); } catch (e) {} } try { localStorage.removeItem(AV.KEY + k); } catch (e) {} };
  AV.clearAll = () => new Promise((res) => { Object.keys(mem).forEach((k) => delete mem[k]); try { Object.keys(localStorage).filter((k) => k.indexOf(AV.KEY) === 0).forEach((k) => localStorage.removeItem(k)); } catch (e) {} if (idb) { try { const tx = idb.transaction('kv', 'readwrite'); tx.objectStore('kv').clear(); tx.oncomplete = res; tx.onerror = res; } catch (e) { res(); } } else res(); });
  AV.persist = (...keys) => keys.map((k) => AV.save(k, AV.S[k])).every(Boolean);

  /* ---------- utilitários ---------- */
  AV.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const esc = AV.esc;
  AV.money = (n) => 'R$ ' + (Number(n) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  AV.num = (v) => { const n = parseFloat(String(v).replace(/\./g, '').replace(',', '.')); return isNaN(n) ? 0 : n; };
  AV.numRaw = (v) => { const s = String(v).trim(); if (/,/.test(s)) return AV.num(s); const n = parseFloat(s); return isNaN(n) ? 0 : n; };
  AV.norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  AV.uid = (p) => (p || 'id') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  AV.pad = (n, l) => String(n).padStart(l, '0');
  AV.date = (t) => new Date(t).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  AV.day = (t) => new Date(t).toISOString().slice(0, 10);
  AV.$ = (s, r) => (r || document).querySelector(s);
  AV.$$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  AV.hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  AV.rng = (seed) => () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  AV.download = (name, content, type) => {
    const blob = new Blob([content], { type: type || 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };

  /* ---------- toast (3 segundos) e modal ---------- */
  let toastTimer;
  AV.toast = (msg, actionHtml) => {
    const t = AV.$('#toast'); if (!t) return;
    t.innerHTML = '<span>' + msg + '</span>' + (actionHtml || '');
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
  };
  AV.modal = (html, wide) => {
    const m = AV.$('#modal');
    m.innerHTML = '<div class="modal-box' + (wide ? ' wide' : '') + '"><button class="modal-x" data-act="closeModal" aria-label="Fechar">×</button>' + html + '</div>';
    m.classList.add('open'); document.body.classList.add('noscroll');
  };
  AV.closeModal = () => { AV.$('#modal').classList.remove('open'); AV.$('#modal').innerHTML = ''; document.body.classList.remove('noscroll'); };
  AV.confirm = (msg, fn, okLabel) => {
    AV.ui.confirmFn = fn;
    AV.modal('<h3>Confirmar</h3><p>' + msg + '</p><div class="row end gap"><button class="btn ghost" data-act="closeModal">Cancelar</button><button class="btn danger" data-act="confirmOk">' + (okLabel || 'Confirmar') + '</button></div>');
  };
  AV.A.closeModal = () => AV.closeModal();
  AV.A.confirmOk = () => { const f = AV.ui.confirmFn; AV.closeModal(); if (f) f(); };

  /* ---------- imagens de produto geradas (SVG) — não ocupam espaço ---------- */
  const artCache = new Map();
  const wrap = (t, n) => {
    const words = String(t).split(' '); const lines = [''];
    words.forEach((w) => { const l = lines[lines.length - 1]; if ((l + ' ' + w).trim().length > n && lines.length < 3) lines.push(w); else lines[lines.length - 1] = (l + ' ' + w).trim(); });
    return lines.slice(0, 3);
  };
  const shade = (hex, amt) => { const n = parseInt(hex.slice(1), 16); const f = (v) => Math.max(0, Math.min(255, v + amt)); return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => AV.pad(f(v).toString(16), 2)).join(''); };
  AV.art = (p, v, view) => {
    view = view || 0;
    const c = (v && v.color) || p.color || '#850037';
    const key = [p.id, p.name, p.brand, p.shape, c, v && v.name, view].join('|');
    if (artCache.has(key)) return artCache.get(key);
    const lines = wrap(p.name, 15);
    const text = (x, y, size, fill, arr, w) => arr.map((l, i) => `<text x="${x}" y="${y + i * (size + 6)}" font-family="Georgia,serif" font-size="${size}" font-weight="700" fill="${fill}" text-anchor="middle">${esc(l)}</text>`).join('');
    const brand = `<text x="280" y="__Y__" font-family="Arial,sans-serif" font-size="20" font-weight="700" letter-spacing="3" fill="#850037" text-anchor="middle">${esc(String(p.brand || 'AVENIDA').toUpperCase().slice(0, 16))}</text>`;
    const code = p.shadeCode || (v && v.code) || '';
    let body = '';
    const sh = p.shape || 'bottle';
    if (sh === 'box') {
      body = `<g transform="rotate(-3 280 330)"><rect x="130" y="110" width="300" height="420" rx="6" fill="#4a1f33" transform="translate(26 -26)"/><rect x="130" y="110" width="300" height="420" rx="6" fill="#fff"/><rect x="130" y="110" width="300" height="70" fill="#850037"/><text x="280" y="156" font-family="Arial,sans-serif" font-size="34" font-weight="800" fill="#fff" text-anchor="middle">AVENIDA</text>${text(280, 230, 26, '#6b1236', lines)}<rect x="165" y="320" width="230" height="130" fill="${c}"/><rect x="165" y="460" width="230" height="46" rx="8" fill="#fffafa"/><text x="190" y="492" font-family="Georgia,serif" font-size="28" font-weight="700" fill="#850037">${esc(code)}</text><text x="270" y="492" font-family="Arial,sans-serif" font-size="16" font-weight="700" fill="#4a1f33">${esc(String((v && v.name) || p.shade || '').slice(0, 16))}</text></g>`;
    } else if (sh === 'jar') {
      body = `<rect x="150" y="170" width="260" height="60" rx="14" fill="${c}"/><rect x="170" y="150" width="220" height="30" rx="8" fill="${shade(c, -30)}"/><rect x="160" y="228" width="240" height="260" rx="30" fill="#fff" stroke="#e6d9de" stroke-width="3"/><rect x="160" y="300" width="240" height="140" fill="${shade(c, 20)}" opacity=".18"/>${brand.replace('__Y__', 290)}${text(280, 350, 26, '#6b1236', lines)}`;
    } else if (sh === 'tube') {
      body = `<path d="M200 150 H360 L378 460 Q280 490 182 460 Z" fill="#fff" stroke="#e6d9de" stroke-width="3"/><rect x="215" y="110" width="130" height="50" rx="10" fill="${shade(c, -20)}"/><rect x="190" y="320" width="180" height="70" fill="${c}" opacity=".9"/>${brand.replace('__Y__', 215)}${text(280, 260, 24, '#6b1236', lines)}`;
    } else if (sh === 'lipstick') {
      body = `<rect x="225" y="330" width="110" height="190" rx="10" fill="#2b2026"/><rect x="225" y="310" width="110" height="30" fill="#c9a24b"/><rect x="238" y="170" width="84" height="145" rx="14" fill="${c}"/><path d="M238 185 L322 150 V170 Q280 150 238 185Z" fill="${shade(c, 25)}"/><text x="280" y="445" font-family="Arial,sans-serif" font-size="15" font-weight="700" fill="#fff" text-anchor="middle" letter-spacing="2">${esc(String(p.brand || 'AVENIDA').toUpperCase().slice(0, 10))}</text><text x="280" y="570" font-family="Georgia,serif" font-size="22" font-weight="700" fill="#6b1236" text-anchor="middle">${esc(lines.join(' ').slice(0, 24))}</text>`;
    } else if (sh === 'perfume') {
      body = `<rect x="250" y="110" width="60" height="60" rx="8" fill="#c9a24b"/><rect x="262" y="165" width="36" height="30" fill="#e6d9de"/><rect x="170" y="190" width="220" height="300" rx="28" fill="${shade(c, 70)}" opacity=".35" stroke="#d8c3cb" stroke-width="3"/><rect x="185" y="320" width="190" height="155" rx="18" fill="${c}" opacity=".75"/><rect x="215" y="240" width="130" height="70" rx="6" fill="#fff"/><text x="280" y="270" font-family="Georgia,serif" font-size="19" font-weight="700" fill="#850037" text-anchor="middle">${esc(lines[0] || '')}</text><text x="280" y="294" font-family="Georgia,serif" font-size="19" font-weight="700" fill="#850037" text-anchor="middle">${esc(lines[1] || '')}</text>`;
    } else if (sh === 'brush') {
      body = `<g transform="rotate(25 280 330)"><rect x="262" y="250" width="36" height="270" rx="16" fill="${c}"/><rect x="258" y="215" width="44" height="45" fill="#c9a24b"/><path d="M250 215 Q280 90 310 215Z" fill="#3a2a30"/></g><text x="280" y="585" font-family="Georgia,serif" font-size="22" font-weight="700" fill="#6b1236" text-anchor="middle">${esc(lines.join(' ').slice(0, 26))}</text>`;
    } else {
      body = `<rect x="240" y="110" width="80" height="52" rx="10" fill="${shade(c, -25)}"/><rect x="255" y="158" width="50" height="30" fill="#e6d9de"/><rect x="170" y="186" width="220" height="310" rx="40" fill="#fff" stroke="#e6d9de" stroke-width="3"/><rect x="170" y="300" width="220" height="110" fill="${c}"/>${brand.replace('__Y__', 250)}${text(280, 340, 24, '#fff', lines)}`;
    }
    let inner = body;
    if (view === 1) inner = `<g transform="translate(40 40) scale(.86) rotate(-6 280 330)">${body}</g><circle cx="470" cy="520" r="46" fill="${c}" stroke="#fff" stroke-width="6"/>`;
    if (view === 2) inner = `<circle cx="280" cy="300" r="190" fill="${c}"/><circle cx="280" cy="300" r="190" fill="#fff" opacity=".12"/><text x="280" y="320" font-family="Georgia,serif" font-size="${code ? 74 : 34}" font-weight="700" fill="#fff" text-anchor="middle">${esc(code || (v && v.name) || p.shade || 'Detalhe')}</text><text x="280" y="372" font-family="Arial,sans-serif" font-size="22" fill="#fff" text-anchor="middle">${esc(String((v && v.name) || p.shade || p.brand || '').slice(0, 22))}</text>`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 660"><rect width="560" height="660" fill="#f8f5f4"/><ellipse cx="280" cy="565" rx="170" ry="26" fill="#e0dadc"/>${inner}</svg>`;
    const uri = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
    artCache.set(key, uri);
    return uri;
  };
  AV.imgs = (p, v) => {
    if (v && v.image) return [v.image].concat((p.images || []).slice(0, 2));
    if (p.images && p.images.length) return p.images;
    return [AV.art(p, v, 0), AV.art(p, v, 1), AV.art(p, v, 2)];
  };
  AV.img = (p, v) => AV.imgs(p, v)[0];

  /* ---------- roteador por hash ---------- */
  AV.route = () => {
    const raw = location.hash.replace(/^#\/?/, '');
    const [path, qs] = raw.split('?');
    return { parts: path.split('/').filter(Boolean).map(decodeURIComponent), q: new URLSearchParams(qs || ''), raw };
  };
  AV.go = (path) => { if (location.hash === '#/' + path) AV.render(); else location.hash = '#/' + path; };
  AV.render = (opts) => {
    opts = opts || {};
    const r = AV.route();
    const scrollY = window.scrollY;
    const isAdmin = r.parts[0] === 'admin';
    document.body.classList.toggle('is-admin', isAdmin);
    let html;
    try { html = isAdmin ? AV.adminView(r) : AV.shopView(r); }
    catch (e) { console.error(e); html = '<div class="page"><h2>Ops!</h2><p>Algo deu errado ao abrir esta página.</p><a class="btn" href="#/">Voltar ao início</a></div>'; }
    AV.$('#app').innerHTML = html;
    AV.updateChrome();
    if (AV.afterRender) AV.afterRender(r);
    window.scrollTo(0, opts.keepScroll ? scrollY : 0);
  };

  /* ---------- eventos por delegação: todo botão usa data-act ---------- */
  document.addEventListener('click', (e) => {
    const modal = AV.$('#modal');
    if (e.target === modal) { AV.closeModal(); return; }
    const el = e.target.closest('[data-act]');
    if (!el) {
      if (!e.target.closest('.search-wrap')) { const s = AV.$('#suggest'); if (s) s.classList.remove('open'); }
      return;
    }
    const fn = AV.A[el.dataset.act];
    if (!fn) { console.error('Ação sem função: ' + el.dataset.act); AV.toast('Função em desenvolvimento'); return; }
    if (el.tagName === 'A' && !el.getAttribute('href')) e.preventDefault();
    fn(el, e);
  });
  document.addEventListener('submit', (e) => {
    const f = e.target.closest('form[data-form]'); if (!f) return;
    e.preventDefault();
    const fn = AV.F[f.dataset.form];
    if (fn) fn(f, e); else console.error('Formulário sem função: ' + f.dataset.form);
  });
  document.addEventListener('input', (e) => { const el = e.target.closest('[data-input]'); if (el && AV.I[el.dataset.input]) AV.I[el.dataset.input](el, e); });
  document.addEventListener('change', (e) => { const el = e.target.closest('[data-change]'); if (el && AV.I[el.dataset.change]) AV.I[el.dataset.change](el, e); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') AV.closeModal(); });
  window.addEventListener('hashchange', () => { AV.closeModal(); AV.ui.menu = false; document.body.classList.remove('menu-open'); AV.render(); });

  /* ---------- CSV ---------- */
  AV.parseCSV = (text) => {
    text = text.replace(/^﻿/, '');
    const first = text.split(/\r?\n/)[0] || '';
    const delim = (first.match(/;/g) || []).length > (first.match(/,/g) || []).length ? ';' : ',';
    const rows = []; let row = [], cur = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
      else if (ch === '"') q = true;
      else if (ch === delim) { row.push(cur); cur = ''; }
      else if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
      else if (ch !== '\r') cur += ch;
    }
    if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
    return rows.filter((r) => r.some((c) => String(c).trim() !== ''));
  };
  AV.toCSV = (rows) => '﻿' + rows.map((r) => r.map((c) => { c = c == null ? '' : String(c); return /[";\n,]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(';')).join('\r\n');
})();
