/* Cosméticos Avenida — loja (parte do comprador) */
(function () {
  'use strict';
  const AV = window.AV, esc = AV.esc, S = () => AV.S;
  const STATUS = ['Aguardando pagamento', 'Pago · separar', 'Em separação', 'Pronto para entrega', 'Saiu para entrega', 'Concluído', 'Cancelado'];
  AV.STATUS = STATUS;

  /* ---------- busca ---------- */
  AV.expand = (tok) => { const s = AV.synonyms[tok]; return s ? [tok, s] : [tok]; };
  AV.search = (q) => {
    const toks = AV.norm(q).split(/\s+/).filter(Boolean);
    if (!toks.length) return [];
    const res = [];
    AV.catalog().forEach((p) => {
      const name = AV.norm(p.name);
      const hay = name + ' ' + AV.norm([p.brand, p.category, p.subcategory, p.shade, p.shadeCode, p.sku, (p.variations || []).map((v) => v.name).join(' ')].join(' '));
      let score = 0;
      for (const t of toks) {
        const alts = AV.expand(t);
        const hit = alts.some((a) => hay.includes(a));
        if (!hit) return;
        score += alts.some((a) => name.startsWith(a)) ? 5 : alts.some((a) => name.includes(a)) ? 3 : 1;
      }
      res.push([score + (p.featured ? 0.5 : 0) + p.sales / 1000, p]);
    });
    return res.sort((a, b) => b[0] - a[0]).map((x) => x[1]);
  };

  /* ---------- carrinho ---------- */
  AV.cartItems = () => S().cart.map((c) => {
    const p = AV.product(c.id); if (!p) return null;
    const v = c.vid ? AV.variation(p, c.vid) : null;
    const max = v ? Number(v.qty) : AV.stock(p);
    return { c, p, v, price: AV.priceOf(p, v), max, qty: Math.min(c.qty, Math.max(max, 0)) || 0 };
  }).filter(Boolean);
  AV.couponCheck = (code, subtotal) => {
    const k = S().coupons.find((x) => AV.norm(x.code) === AV.norm(code));
    if (!k || !k.active) return { error: 'Cupom inválido ou desativado.' };
    if (k.expires && new Date(k.expires + 'T23:59:59') < new Date()) return { error: 'Este cupom expirou.' };
    if (k.max && k.uses >= k.max) return { error: 'Este cupom já atingiu o limite de usos.' };
    if (subtotal < (Number(k.min) || 0)) return { error: 'Compra mínima de ' + AV.money(k.min) + ' para este cupom.' };
    return { coupon: k };
  };
  AV.totals = (mode) => {
    const items = AV.cartItems().filter((i) => i.qty > 0);
    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    let discount = 0, freeByCoupon = false;
    const k = S().coupon && AV.couponCheck(S().coupon.code, subtotal).coupon;
    if (k) { if (k.type === 'percent') discount = subtotal * k.value / 100; else if (k.type === 'value') discount = Math.min(k.value, subtotal); else freeByCoupon = true; }
    discount = Math.round(discount * 100) / 100;
    const st = S().settings; const base = subtotal - discount;
    let shipping = 0;
    if (mode !== 'retirada') shipping = freeByCoupon || (st.freeShipEnabled && base >= st.freeShipMin) ? 0 : Number(st.deliveryFee) || 0;
    return { items, subtotal, discount, shipping, total: base + shipping, count: items.reduce((s, i) => s + i.qty, 0), coupon: k || null };
  };
  const saveCart = () => AV.persist('cart');

  AV.A.addCart = (el) => {
    const p = AV.product(el.dataset.id); if (!p) return;
    let vid = el.dataset.vid || '';
    if (p.variations && p.variations.length && !vid) { AV.go('produto/' + p.id); AV.toast('Escolha a cor/tom do produto'); return; }
    const v = vid ? AV.variation(p, vid) : null;
    const max = v ? Number(v.qty) : AV.stock(p);
    const input = AV.$('#pq'); const qty = Math.max(1, parseInt(el.dataset.qty || (input && input.value) || 1, 10) || 1);
    const ex = S().cart.find((c) => c.id === p.id && (c.vid || '') === vid);
    const have = ex ? ex.qty : 0;
    if (max <= 0) { AV.toast('Produto indisponível no momento.'); return; }
    if (have + qty > max) { AV.toast('Quantidade máxima disponível atingida.'); if (ex) ex.qty = max; else S().cart.push({ id: p.id, vid, qty: max }); saveCart(); AV.updateChrome(); return; }
    if (ex) ex.qty += qty; else S().cart.push({ id: p.id, vid, qty });
    saveCart(); AV.updateChrome();
    AV.toast('Adicionado ao carrinho', '<a href="#/carrinho">Ver carrinho</a>');
    if (el.dataset.buy) AV.go('carrinho');
  };
  AV.A.buyNow = (el) => { el.dataset.buy = '1'; AV.A.addCart(el); };
  AV.A.cartQty = (el) => {
    const c = S().cart.find((x) => x.id === el.dataset.id && (x.vid || '') === (el.dataset.vid || '')); if (!c) return;
    const p = AV.product(c.id), v = c.vid ? AV.variation(p, c.vid) : null; const max = v ? v.qty : AV.stock(p);
    const nq = c.qty + Number(el.dataset.d);
    if (nq < 1) return AV.A.cartRemove(el);
    if (nq > max) { AV.toast('Quantidade máxima disponível atingida.'); return; }
    c.qty = nq; saveCart(); AV.render({ keepScroll: true });
  };
  AV.A.cartRemove = (el) => { S().cart = S().cart.filter((x) => !(x.id === el.dataset.id && (x.vid || '') === (el.dataset.vid || ''))); saveCart(); AV.render({ keepScroll: true }); AV.toast('Item removido'); };
  AV.A.cartClear = () => AV.confirm('Esvaziar o carrinho?', () => { S().cart = []; S().coupon = null; saveCart(); AV.render(); }, 'Esvaziar');
  AV.F.coupon = (f) => {
    const code = f.code.value.trim(); if (!code) return;
    const t = AV.totals(); const r = AV.couponCheck(code, t.subtotal);
    if (r.error) { AV.toast(r.error); return; }
    S().coupon = { code: r.coupon.code }; AV.toast('Cupom aplicado!'); AV.render({ keepScroll: true });
  };
  AV.A.couponRemove = () => { S().coupon = null; AV.render({ keepScroll: true }); };

  /* ---------- favoritos ---------- */
  AV.A.fav = (el, e) => {
    if (e) e.preventDefault();
    const id = el.dataset.id; const i = S().favs.indexOf(id);
    if (i >= 0) { S().favs.splice(i, 1); AV.toast('Removido dos favoritos'); } else { S().favs.push(id); AV.toast('Adicionado aos favoritos ♥'); }
    AV.persist('favs'); AV.updateChrome();
    AV.$$('[data-act="fav"][data-id="' + id + '"]').forEach((b) => b.classList.toggle('on', i < 0));
    if (AV.route().parts[0] === 'favoritos') AV.render({ keepScroll: true });
  };

  /* ---------- peças de interface ---------- */
  const badge = (p) => (!AV.available(p) && !(p.variations || []).length ? '<span class="tag off">Indisponível</span>' : p.variations && p.variations.length && AV.stock(p) <= 0 ? '<span class="tag off">Indisponível</span>' : p.promo && p.oldprice ? '<span class="tag promo">Promoção</span>' : p.isNew ? '<span class="tag new">Novo</span>' : '');
  AV.card = (p) => {
    const av = AV.stock(p) > 0; const hasVar = p.variations && p.variations.length;
    const prices = hasVar ? p.variations.map((v) => AV.priceOf(p, v)) : [p.price]; const from = Math.min.apply(null, prices);
    return '<article class="card"><div class="card-img"><a href="#/produto/' + p.id + '"><img loading="lazy" alt="' + esc(p.name) + '" src="' + AV.img(p) + '"></a>' + badge(p) +
      '<button class="heart' + (S().favs.includes(p.id) ? ' on' : '') + '" data-act="fav" data-id="' + p.id + '" aria-label="Favoritar">♥</button></div>' +
      '<div class="card-body"><small class="brand">' + esc(p.brand) + '</small><a class="card-name" href="#/produto/' + p.id + '">' + esc(p.name) + '</a>' +
      (p.shade && p.shadeCode ? '<span class="shade-chip"><i style="background:' + esc(p.color) + '"></i>' + esc(p.shadeCode) + '</span>' : hasVar ? '<span class="shade-chip">' + p.variations.length + ' opções</span>' : '') +
      '<div class="price">' + (p.oldprice && p.promo ? '<s>' + AV.money(p.oldprice) + '</s> ' : '') + (hasVar ? '<small>a partir de</small> ' : '') + '<b>' + AV.money(from) + '</b></div>' +
      (av ? '<button class="btn sm" data-act="addCart" data-id="' + p.id + '">' + (hasVar ? 'Escolher opção' : 'Adicionar') + '</button>' : '<button class="btn sm ghost" disabled>Indisponível</button>') + '</div></article>';
  };
  const grid = (arr) => '<div class="grid">' + arr.map(AV.card).join('') + '</div>';
  const section = (title, link, arr) => arr.length ? '<section class="sec"><div class="sec-h"><h2>' + title + '</h2>' + (link ? '<a href="#/' + link + '">Ver tudo →</a>' : '') + '</div><div class="hscroll">' + arr.map(AV.card).join('') + '</div></section>' : '';

  AV.updateChrome = () => {
    const t = AV.totals(); const n = t.count;
    const set = (id, v) => { const e = AV.$(id); if (e) { e.textContent = v; e.style.display = v ? '' : 'none'; } };
    set('#cartCount', n || ''); set('#favCount', S().favs.length || '');
    const nav = AV.$('#catnav');
    if (nav) nav.innerHTML = '<a href="#/">Início</a>' + S().categories.filter((c) => c.active !== false).map((c) => '<a href="#/categoria/' + encodeURIComponent(c.name) + '">' + esc(c.name) + '</a>').join('') + '<a href="#/promocoes" class="hl">Promoções</a>';
    const st = S().settings; const w = AV.$('#waFloat'); if (w) w.style.display = st.whatsappFloat ? '' : 'none';
    const ft = AV.$('#footInfo');
    if (ft) ft.innerHTML = '<p><b>' + esc(st.storeName) + '</b><br>' + esc(st.slogan) + '</p><p>' + (st.address ? esc(st.address) : 'Endereço: <em>a definir</em>') + '<br>' + (st.hours ? esc(st.hours) : 'Horário: <em>a definir</em>') + '</p><p>' + (st.instagram ? '<a target="_blank" rel="noopener" href="' + esc(/^http/.test(st.instagram) ? st.instagram : 'https://instagram.com/' + st.instagram.replace('@', '')) + '">Instagram</a>' : 'Instagram: <em>a definir</em>') + '</p>';
    AV.$('#adminLink').textContent = AV.currentUser() ? 'Painel da loja' : 'Área da loja';
    const mb = AV.$('#installBtn'); if (mb) mb.style.display = AV.ui.installEvt ? '' : 'none';
  };

  /* ---------- roteamento da loja ---------- */
  AV.shopView = (r) => {
    const p = r.parts; const k = p[0] || '';
    switch (k) {
      case '': return AV.V.home();
      case 'categoria': return AV.V.list(r, decodeURIComponent(p[1] || ''), { cat: p[1] });
      case 'marca': return AV.V.list(r, 'Marca ' + p[1], { brand: p[1] });
      case 'busca': return AV.V.list(r, 'Resultados para “' + (r.q.get('q') || '') + '”', { q: r.q.get('q') || '' });
      case 'novidades': return AV.V.list(r, 'Novidades', { kind: 'new' });
      case 'promocoes': return AV.V.list(r, 'Promoções', { kind: 'promo' });
      case 'mais-vendidos': return AV.V.list(r, 'Mais vendidos', { kind: 'top' });
      case 'sugestoes': return AV.V.list(r, 'Sugestões para você', { kind: 'feat' });
      case 'produto': return AV.V.product(p[1]);
      case 'carrinho': return AV.V.cart();
      case 'checkout': return AV.V.checkout();
      case 'pedido': return AV.V.order(p[1], r.q.get('tel'));
      case 'acompanhar': return AV.V.track();
      case 'favoritos': return AV.V.favs();
      case 'politica': return AV.V.policy(p[1]);
      case 'nao-encontrei': return AV.V.request();
      case 'conta': return AV.V.account();
      default: return '<div class="page center"><h2>Página não encontrada</h2><a class="btn" href="#/">Voltar ao início</a></div>';
    }
  };

  /* ---------- home ---------- */
  const inRange = (c) => { const t = AV.day(Date.now()); return c.active && (!c.start || c.start <= t) && (!c.end || c.end >= t); };
  AV.banners = () => S().campaigns.filter(inRange).filter((c) => c.device === 'all' || (c.device === 'mobile') === (window.innerWidth < 760));
  AV.V.home = () => {
    const cat = AV.catalog(); const bn = AV.banners();
    const i = (AV.ui.banner || 0) % Math.max(bn.length, 1); const b = bn[i];
    const hero = b ? '<section class="hero" style="--hc:' + esc(b.color) + '"><div class="hero-t"><span class="eyebrow">Cosméticos Avenida</span><h1>' + esc(b.title) + '</h1><p>' + esc(b.subtitle) + '</p><a class="btn light" href="#/' + esc(b.link.split('/').map(encodeURIComponent).join('/')) + '">' + esc(b.cta || 'Ver mais') + '</a></div><img class="hero-img" alt="" src="assets/hero.png">' +
      (bn.length > 1 ? '<div class="dots"><button data-act="banner" data-d="-1" aria-label="Anterior">‹</button>' + bn.map((x, j) => '<i class="' + (j === i ? 'on' : '') + '" data-act="banner" data-i="' + j + '"></i>').join('') + '<button data-act="banner" data-d="1" aria-label="Próximo">›</button></div>' : '') + '</section>' : '';
    const cats = '<section class="cats">' + S().categories.filter((c) => c.active !== false).map((c) => '<a class="cat" href="#/categoria/' + encodeURIComponent(c.name) + '"><span>' + esc(c.name) + '</span><small>' + cat.filter((p) => p.category === c.name).length + ' produtos</small></a>').join('') + '</section>';
    const news = cat.filter((p) => p.isNew).sort((a, b) => b.createdAt - a.createdAt).slice(0, 12);
    const promos = cat.filter((p) => p.promo && p.oldprice && AV.stock(p) > 0).slice(0, 12);
    const feat = cat.filter((p) => p.featured && AV.stock(p) > 0).slice(0, 12);
    const top = cat.slice().sort((a, b) => b.sales - a.sales).slice(0, 10);
    const brands = S().brands.filter((x) => x.active !== false);
    return '<div class="page">' + hero + cats + section('Novidades', 'novidades', news) + section('Promoções', 'promocoes', promos) + section('Sugestões para você', 'sugestoes', feat) +
      '<section class="sec"><div class="sec-h"><h2>Top 10 mais vendidos</h2><a href="#/mais-vendidos">Ver tudo →</a></div><div class="hscroll rank">' + top.map((p, n) => '<div class="rk"><b class="rkn">' + (n + 1) + '</b>' + AV.card(p) + '</div>').join('') + '</div></section>' +
      '<section class="sec"><div class="sec-h"><h2>Marcas</h2></div><div class="chips">' + brands.map((x) => '<a class="chip" href="#/marca/' + encodeURIComponent(x.name) + '">' + esc(x.name) + '</a>').join('') + '</div></section>' +
      '<section class="notfound"><h3>Não encontrou o que procura?</h3><p>Conte pra gente o que você quer e vamos tentar trazer.</p><a class="btn" href="#/nao-encontrei">Não encontrei</a></section></div>';
  };
  AV.A.banner = (el) => {
    const n = AV.banners().length || 1;
    AV.ui.banner = el.dataset.i !== undefined ? Number(el.dataset.i) : ((AV.ui.banner || 0) + Number(el.dataset.d) + n) % n;
    AV.render({ keepScroll: true });
  };

  /* ---------- listagem com filtros e carregamento sob demanda ---------- */
  AV.V.list = (r, title, f) => {
    const key = r.parts.join('/') + '?' + (r.q.get('q') || '') + (r.q.get('sub') || '');
    if (AV.ui.listKey !== key) { AV.ui.listKey = key; AV.ui.filters = { brand: '', min: '', max: '', shade: '', avail: false, sort: 'rel' }; AV.ui.limit = S().settings.pageSize || 24; }
    const F = AV.ui.filters;
    let arr = f.q !== undefined ? AV.search(f.q) : AV.catalog();
    if (f.q !== undefined && !arr.length && f.q.trim()) { const z = S().zeroSearches; if (!z.find((x) => x.q === AV.norm(f.q) && Date.now() - x.at < 5000)) { z.unshift({ q: AV.norm(f.q), at: Date.now() }); z.length = Math.min(z.length, 300); AV.persist('zeroSearches'); } }
    if (f.cat) arr = arr.filter((p) => p.category === f.cat);
    const sub = r.q.get('sub'); if (sub) arr = arr.filter((p) => p.subcategory === sub);
    if (f.brand) arr = arr.filter((p) => p.brand === f.brand);
    if (f.kind === 'new') arr = arr.filter((p) => p.isNew);
    if (f.kind === 'promo') arr = arr.filter((p) => p.promo && p.oldprice);
    if (f.kind === 'feat') arr = arr.filter((p) => p.featured);
    if (f.kind === 'top') arr = arr.slice().sort((a, b) => b.sales - a.sales);
    const baseArr = arr;
    if (F.brand) arr = arr.filter((p) => p.brand === F.brand);
    if (F.min !== '') arr = arr.filter((p) => p.price >= AV.numRaw(F.min));
    if (F.max !== '') arr = arr.filter((p) => p.price <= AV.numRaw(F.max));
    if (F.shade) { const s = AV.norm(F.shade); arr = arr.filter((p) => AV.norm(p.shade + ' ' + p.shadeCode + ' ' + (p.variations || []).map((v) => v.name).join(' ')).includes(s)); }
    if (F.avail) arr = arr.filter((p) => AV.stock(p) > 0);
    const so = { menor: (a, b) => a.price - b.price, maior: (a, b) => b.price - a.price, novos: (a, b) => b.createdAt - a.createdAt, nome: (a, b) => a.name.localeCompare(b.name), rel: null }[F.sort];
    if (so) arr = arr.slice().sort(so); else if (f.q === undefined && f.kind !== 'top') arr = arr.slice().sort((a, b) => (b.featured - a.featured) || (b.sales - a.sales));
    const total = arr.length; const shown = arr.slice(0, AV.ui.limit);
    const brandsIn = Array.from(new Set(baseArr.map((p) => p.brand))).sort();
    const cobj = f.cat && S().categories.find((c) => c.name === f.cat);
    const subs = cobj ? '<div class="chips">' + '<a class="chip' + (!sub ? ' on' : '') + '" href="#/categoria/' + encodeURIComponent(f.cat) + '">Todos</a>' + cobj.subs.map((s) => '<a class="chip' + (sub === s ? ' on' : '') + '" href="#/categoria/' + encodeURIComponent(f.cat) + '?sub=' + encodeURIComponent(s) + '">' + esc(s) + '</a>').join('') + '</div>' : '';
    const filters = '<aside class="filters" id="filters"><div class="f-h"><b>Filtros</b><button class="link" data-act="clearFilters">Limpar</button></div>' +
      '<label>Marca<select data-change="filter" data-k="brand"><option value="">Todas</option>' + brandsIn.map((b) => '<option ' + (F.brand === b ? 'selected' : '') + '>' + esc(b) + '</option>').join('') + '</select></label>' +
      '<div class="two"><label>Preço mín.<input type="number" min="0" step="0.01" value="' + esc(F.min) + '" data-change="filter" data-k="min" placeholder="0"></label><label>Preço máx.<input type="number" min="0" step="0.01" value="' + esc(F.max) + '" data-change="filter" data-k="max" placeholder="999"></label></div>' +
      '<label>Tom / cor<input type="text" value="' + esc(F.shade) + '" data-change="filter" data-k="shade" placeholder="ex.: louro, 7.0, nude"></label>' +
      '<label class="chk"><input type="checkbox" ' + (F.avail ? 'checked' : '') + ' data-change="filter" data-k="avail"> Somente disponíveis</label></aside>';
    const head = '<div class="list-h"><div><h1>' + esc(title) + '</h1><small>' + total + ' produto' + (total === 1 ? '' : 's') + '</small></div><div class="row gap"><button class="btn ghost sm only-m" data-act="toggleFilters">Filtros</button><label class="sort">Ordenar<select data-change="filter" data-k="sort">' + [['rel', 'Relevância'], ['menor', 'Menor preço'], ['maior', 'Maior preço'], ['novos', 'Novidades'], ['nome', 'Nome (A–Z)']].map((o) => '<option value="' + o[0] + '" ' + (F.sort === o[0] ? 'selected' : '') + '>' + o[1] + '</option>').join('') + '</select></label></div></div>';
    let body;
    if (!total) {
      body = '<div class="empty"><h3>Nenhum produto encontrado</h3><p>Tente outra palavra ou limpe os filtros.</p><div class="row gap center"><button class="btn ghost" data-act="clearFilters">Limpar filtros</button><a class="btn" href="#/nao-encontrei' + (f.q ? '?q=' + encodeURIComponent(f.q) : '') + '">Não encontrei o que procuro</a></div></div>';
    } else body = grid(shown) + (total > shown.length ? '<div class="center more"><button class="btn" data-act="more">Carregar mais (' + (total - shown.length) + ' restantes)</button></div>' : '<p class="center muted">Fim da lista</p>');
    return '<div class="page"><nav class="crumb"><a href="#/">Início</a> › ' + esc(title) + '</nav>' + subs + head + '<div class="layout">' + filters + '<div>' + body + '</div></div></div>';
  };
  AV.I.filter = (el) => { AV.ui.filters[el.dataset.k] = el.type === 'checkbox' ? el.checked : el.value; AV.ui.limit = S().settings.pageSize || 24; AV.render({ keepScroll: true }); };
  AV.A.clearFilters = () => { AV.ui.filters = { brand: '', min: '', max: '', shade: '', avail: false, sort: 'rel' }; AV.render({ keepScroll: true }); };
  AV.A.more = () => { AV.ui.limit += S().settings.pageSize || 24; AV.render({ keepScroll: true }); };
  AV.A.toggleFilters = () => AV.$('#filters').classList.toggle('open');

  /* ---------- produto ---------- */
  AV.V.product = (id) => {
    const p = AV.product(id);
    if (!p || !AV.visible(p)) return '<div class="page center"><h2>Produto não encontrado</h2><a class="btn" href="#/">Voltar</a></div>';
    AV.ui.vid = AV.ui.vid || {};
    const hasVar = p.variations && p.variations.length;
    const v = hasVar ? (AV.variation(p, AV.ui.vid[p.id]) || p.variations.find((x) => x.qty > 0) || p.variations[0]) : null;
    if (v) AV.ui.vid[p.id] = v.id;
    const imgs = AV.imgs(p, v); const price = AV.priceOf(p, v); const avail = AV.available(p, v); const max = v ? v.qty : AV.stock(p);
    const rel = AV.catalog().filter((x) => x.id !== p.id && (x.category === p.category)).sort((a, b) => (b.brand === p.brand) - (a.brand === p.brand) || b.sales - a.sales).slice(0, 8);
    const st = S().settings;
    const delivery = '<div class="deliv"><b>Entrega e retirada</b><p>' + (st.deliveryEnabled ? 'Entregamos em ' + esc(st.city) + ' — taxa ' + AV.money(st.deliveryFee) + (st.freeShipEnabled ? ' (grátis acima de ' + AV.money(st.freeShipMin) + ')' : '') + '.' : 'Entrega indisponível no momento.') + (st.pickupEnabled ? ' Retirada na loja sem custo.' : '') + '</p>' +
      '<form class="row gap" data-form="cep"><input name="cep" placeholder="Seu CEP ou bairro" aria-label="CEP"><button class="btn sm ghost">Consultar</button></form><small id="cepOut" class="muted"></small></div>';
    return '<div class="page"><nav class="crumb"><a href="#/">Início</a> › <a href="#/categoria/' + encodeURIComponent(p.category) + '">' + esc(p.category) + '</a> › ' + esc(p.name) + '</nav>' +
      '<div class="pdp"><div class="gal"><img id="mainImg" alt="' + esc(p.name) + '" src="' + imgs[0] + '"><div class="thumbs">' + imgs.map((s, i) => '<button data-act="thumb" data-src="' + esc(s) + '" class="' + (i === 0 ? 'on' : '') + '" aria-label="Foto ' + (i + 1) + '"><img alt="" src="' + s + '"></button>').join('') + '</div></div>' +
      '<div class="info"><small class="brand">' + esc(p.brand) + ' · Cód. ' + esc(p.sku) + '</small><h1>' + esc(p.name) + '</h1>' +
      (p.shade ? '<p class="shade-line"><i style="background:' + esc(p.color) + '"></i> Tom ' + esc(p.shadeCode) + ' — ' + esc(p.shade) + '</p>' : '') +
      '<div class="price big">' + (p.oldprice && p.promo ? '<s>' + AV.money(p.oldprice) + '</s> ' : '') + '<b>' + AV.money(price) + '</b></div>' +
      (hasVar ? '<div class="vars"><span>Cor / tom: <b>' + esc(v.name) + '</b></span><div class="chips">' + p.variations.map((x) => '<button class="vchip' + (x.id === v.id ? ' on' : '') + (x.qty <= 0 ? ' off' : '') + '" data-act="pickVar" data-id="' + p.id + '" data-vid="' + x.id + '" title="' + esc(x.name) + (x.qty <= 0 ? ' (indisponível)' : '') + '"><i style="background:' + esc(x.color) + '"></i>' + esc(x.name) + '</button>').join('') + '</div></div>' : '') +
      '<p class="avail ' + (avail ? 'ok' : 'no') + '">' + (avail ? '● Disponível' : '● Indisponível no momento') + '</p>' +
      (avail ? '<div class="buy"><div class="qty"><button data-act="pqty" data-d="-1" aria-label="Menos">−</button><input id="pq" value="1" inputmode="numeric" data-max="' + max + '" aria-label="Quantidade"><button data-act="pqty" data-d="1" aria-label="Mais">+</button></div>' +
        '<button class="btn" data-act="addCart" data-id="' + p.id + '" data-vid="' + (v ? v.id : '') + '">Adicionar ao carrinho</button></div><button class="btn light-b" data-act="buyNow" data-id="' + p.id + '" data-vid="' + (v ? v.id : '') + '">Comprar agora</button>' :
        '<div class="buy"><button class="btn ghost" disabled>Indisponível</button><a class="btn ghost" href="#/nao-encontrei?q=' + encodeURIComponent(p.name) + '">Avise-me quando chegar</a></div>') +
      '<div class="row gap acts"><button class="btn ghost sm heart-b' + (S().favs.includes(p.id) ? ' on' : '') + '" data-act="fav" data-id="' + p.id + '">♥ Favoritar</button><button class="btn ghost sm" data-act="share" data-id="' + p.id + '">Compartilhar</button></div>' + delivery +
      '<div class="acc">' + [['Descrição', p.desc], ['Para que serve', p.purpose], ['Como usar', p.how], ['Observações', p.notes], ['Cuidados e avisos', p.warnings]].filter((x) => x[1]).map((x, i) => '<details ' + (i === 0 ? 'open' : '') + '><summary>' + x[0] + '</summary><p>' + esc(x[1]) + '</p></details>').join('') + '</div></div></div>' +
      section('Produtos relacionados', 'categoria/' + encodeURIComponent(p.category), rel) + '</div>';
  };
  AV.A.thumb = (el) => { AV.$('#mainImg').src = el.dataset.src; AV.$$('.thumbs button').forEach((b) => b.classList.toggle('on', b === el)); };
  AV.A.pickVar = (el) => { AV.ui.vid = AV.ui.vid || {}; AV.ui.vid[el.dataset.id] = el.dataset.vid; AV.render({ keepScroll: true }); };
  AV.A.pqty = (el) => { const i = AV.$('#pq'); const max = Number(i.dataset.max) || 1; i.value = Math.min(max, Math.max(1, (parseInt(i.value, 10) || 1) + Number(el.dataset.d))); };
  AV.A.share = (el) => {
    const p = AV.product(el.dataset.id); const url = location.href;
    if (navigator.share) navigator.share({ title: p.name, url }).catch(() => {});
    else if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => AV.toast('Link copiado!'), () => AV.toast('Copie o link na barra do navegador.'));
    else AV.toast('Copie o link na barra do navegador.');
  };
  AV.F.cep = (f) => {
    const v = f.cep.value.replace(/\D/g, ''); const st = S().settings; const out = AV.$('#cepOut');
    if (!f.cep.value.trim()) { out.textContent = 'Digite o CEP ou bairro.'; return; }
    if (v.length >= 5 && !/^350[0-6]/.test(v)) out.textContent = 'Este CEP parece ficar fora de ' + st.city + '. Fale com a loja para combinar a entrega.';
    else out.textContent = 'Entrega em ' + st.city + ': ' + AV.money(st.deliveryFee) + (st.freeShipEnabled ? ' (grátis acima de ' + AV.money(st.freeShipMin) + ')' : '') + '. (estimativa)';
  };

  /* ---------- carrinho ---------- */
  AV.V.cart = () => {
    const t = AV.totals(); const st = S().settings;
    if (!t.items.length) return '<div class="page center"><h1>Seu carrinho</h1><div class="empty"><h3>Seu carrinho está vazio</h3><p>Adicione produtos para continuar.</p><a class="btn" href="#/">Continuar comprando</a></div></div>';
    const prog = st.freeShipEnabled ? (t.subtotal - t.discount >= st.freeShipMin ? '<p class="ship ok">🎉 Você ganhou frete grátis!</p>' : '<p class="ship">Faltam ' + AV.money(st.freeShipMin - (t.subtotal - t.discount)) + ' para frete grátis</p><div class="bar"><i style="width:' + Math.min(100, (t.subtotal - t.discount) / st.freeShipMin * 100) + '%"></i></div>') : '';
    return '<div class="page"><h1>Seu carrinho</h1><div class="cart-l"><div class="items">' + t.items.map((i) => '<div class="ci"><a href="#/produto/' + i.p.id + '"><img alt="" src="' + AV.img(i.p, i.v) + '"></a><div class="ci-i"><small class="brand">' + esc(i.p.brand) + '</small><a href="#/produto/' + i.p.id + '">' + esc(i.p.name) + '</a>' + (i.v ? '<small>Cor/tom: ' + esc(i.v.name) + '</small>' : '') + '<b>' + AV.money(i.price) + '</b></div>' +
      '<div class="qty"><button data-act="cartQty" data-d="-1" data-id="' + i.p.id + '" data-vid="' + (i.c.vid || '') + '" aria-label="Menos">−</button><span>' + i.qty + '</span><button data-act="cartQty" data-d="1" data-id="' + i.p.id + '" data-vid="' + (i.c.vid || '') + '" aria-label="Mais">+</button></div>' +
      '<div class="ci-t"><b>' + AV.money(i.price * i.qty) + '</b><button class="link" data-act="cartRemove" data-id="' + i.p.id + '" data-vid="' + (i.c.vid || '') + '">Remover</button></div></div>').join('') + '<button class="link" data-act="cartClear">Esvaziar carrinho</button></div>' +
      '<aside class="sum"><h3>Resumo</h3><div class="ln"><span>Subtotal</span><b>' + AV.money(t.subtotal) + '</b></div>' + (t.discount ? '<div class="ln"><span>Cupom ' + esc(t.coupon.code) + ' <button class="link" data-act="couponRemove">remover</button></span><b>− ' + AV.money(t.discount) + '</b></div>' : t.coupon ? '<div class="ln"><span>Cupom ' + esc(t.coupon.code) + ': frete grátis <button class="link" data-act="couponRemove">remover</button></span></div>' : '') +
      '<div class="ln"><span>Entrega</span><small>calculada no checkout</small></div><div class="ln tot"><span>Total parcial</span><b>' + AV.money(t.subtotal - t.discount) + '</b></div>' + prog +
      '<form class="row gap" data-form="coupon"><input name="code" placeholder="Cupom de desconto"><button class="btn sm ghost">Aplicar</button></form>' +
      '<a class="btn block" href="#/checkout">Finalizar compra</a><a class="btn ghost block" href="#/">Continuar comprando</a></aside></div></div>';
  };

  /* ---------- checkout ---------- */
  AV.V.checkout = () => {
    const t = AV.totals(); const st = S().settings; const cu = S().customer;
    if (!t.items.length) return '<div class="page center"><h2>Seu carrinho está vazio</h2><a class="btn" href="#/">Ver produtos</a></div>';
    const mode = AV.ui.mode || (st.deliveryEnabled ? 'entrega' : 'retirada');
    return '<div class="page"><h1>Finalizar pedido</h1><form data-form="checkout" class="cart-l" novalidate><div>' +
      (cu ? '<p class="note">Comprando como <b>' + esc(cu.name) + '</b>.</p>' : '<p class="note">Você pode comprar sem criar conta. <a href="#/conta">Entrar ou criar conta</a> (opcional).</p>') +
      '<fieldset><legend>1. Seus dados</legend><label>Nome completo<input name="name" required value="' + esc(cu ? cu.name : '') + '" autocomplete="name"></label><div class="two"><label>Telefone / WhatsApp<input name="phone" required inputmode="tel" value="' + esc(cu ? cu.phone || '' : '') + '" autocomplete="tel" placeholder="(33) 99999-9999"></label><label>E-mail (opcional)<input name="email" type="email" value="' + esc(cu ? cu.email : '') + '" autocomplete="email"></label></div></fieldset>' +
      '<fieldset><legend>2. Entrega ou retirada</legend><div class="radios">' + (st.deliveryEnabled ? '<label class="radio"><input type="radio" name="mode" value="entrega" data-change="checkoutMode" ' + (mode === 'entrega' ? 'checked' : '') + '><span><b>Entrega em ' + esc(st.city) + '</b><small>' + AV.money(st.deliveryFee) + (st.freeShipEnabled ? ' · grátis acima de ' + AV.money(st.freeShipMin) : '') + '</small></span></label>' : '') + (st.pickupEnabled ? '<label class="radio"><input type="radio" name="mode" value="retirada" data-change="checkoutMode" ' + (mode === 'retirada' ? 'checked' : '') + '><span><b>Retirar na loja</b><small>Sem custo' + (st.address ? ' · ' + esc(st.address) : '') + '</small></span></label>' : '') + '</div>' +
      '<div id="addrBox" class="' + (mode === 'entrega' ? '' : 'hidden') + '"><div class="two"><label>Rua / avenida<input name="street" value="' + esc(cu && cu.street || '') + '"></label><label>Número<input name="number" value="' + esc(cu && cu.number || '') + '"></label></div><div class="two"><label>Bairro<input name="district" value="' + esc(cu && cu.district || '') + '"></label><label>CEP<input name="cep" inputmode="numeric" value="' + esc(cu && cu.cep || '') + '"></label></div><label>Complemento / ponto de referência<input name="complement"></label><small class="muted">Cidade: ' + esc(st.city) + ' – ' + esc(st.state) + '</small></div></fieldset>' +
      '<fieldset><legend>3. Pagamento</legend><div class="pay-box"><b>' + esc(AV.payment.provider) + '</b><span class="tag off">Em breve</span><p>O pagamento online ainda <b>não está ativo</b> (aguardando os dados da conta). Seu pedido será registrado como <b>“Aguardando pagamento”</b> e a loja entra em contato pelo WhatsApp para combinar a forma de pagar.</p><small>Nenhum dado de cartão ou conta bancária é pedido aqui.</small></div></fieldset>' +
      '<label>Observações do pedido (opcional)<textarea name="notes" rows="2" maxlength="300"></textarea></label></div>' +
      '<aside class="sum" id="sumbox"></aside></form></div>';
  };
  const sumHtml = (mode) => {
    const t = AV.totals(mode);
    return '<h3>Resumo do pedido</h3>' + t.items.map((i) => '<div class="ln"><span>' + i.qty + '× ' + esc(i.p.name) + (i.v ? ' (' + esc(i.v.name) + ')' : '') + '</span><b>' + AV.money(i.price * i.qty) + '</b></div>').join('') +
      '<hr><div class="ln"><span>Subtotal</span><b>' + AV.money(t.subtotal) + '</b></div>' + (t.discount ? '<div class="ln"><span>Cupom</span><b>− ' + AV.money(t.discount) + '</b></div>' : '') + '<div class="ln"><span>Entrega</span><b>' + (t.shipping ? AV.money(t.shipping) : 'Grátis') + '</b></div><div class="ln tot"><span>Total</span><b>' + AV.money(t.total) + '</b></div><button class="btn block" type="submit">Finalizar pedido</button><a class="btn ghost block" href="#/carrinho">Voltar ao carrinho</a>';
  };
  AV.afterRender = (r) => {
    clearInterval(AV.ui.timer);
    if (r.parts[0] === 'checkout') { const m = (AV.$('input[name=mode]:checked') || {}).value || 'retirada'; AV.$('#sumbox').innerHTML = sumHtml(m); }
    if ((r.parts[0] || '') === '' && AV.banners().length > 1) AV.ui.timer = setInterval(() => { if (!(AV.route().parts[0])) { AV.ui.banner = (AV.ui.banner || 0) + 1; AV.render({ keepScroll: true }); } }, 6000);
    if (r.parts[0] === 'nao-encontrei' && r.q.get('q')) { const t = AV.$('textarea[name=text]'); if (t && !t.value) t.value = 'Estou procurando: ' + r.q.get('q'); }
    if (AV.afterAdmin) AV.afterAdmin(r);
  };
  AV.I.checkoutMode = (el) => { AV.ui.mode = el.value; AV.$('#addrBox').classList.toggle('hidden', el.value !== 'entrega'); AV.$('#sumbox').innerHTML = sumHtml(el.value); };
  AV.F.checkout = (f) => {
    const mode = f.mode ? f.mode.value : 'retirada'; const val = (n) => (f[n] ? f[n].value.trim() : '');
    if (val('name').length < 3) return AV.toast('Informe seu nome completo.');
    if (val('phone').replace(/\D/g, '').length < 10) return AV.toast('Informe um telefone válido com DDD.');
    if (val('email') && !/^\S+@\S+\.\S+$/.test(val('email'))) return AV.toast('E-mail inválido.');
    if (mode === 'entrega' && (!val('street') || !val('number') || !val('district'))) return AV.toast('Preencha rua, número e bairro para a entrega.');
    const t = AV.totals(mode);
    if (!t.items.length) return AV.toast('Seu carrinho está vazio.');
    for (const i of t.items) { const have = i.v ? i.v.qty : AV.stock(i.p); if (i.c.qty > have) return AV.toast('“' + i.p.name + '” não tem estoque suficiente. Ajuste o carrinho.'); }
    const st = S().settings; st.orderSeq = (st.orderSeq || 0) + 1;
    const n = 'AV-' + new Date().getFullYear() + '-' + AV.pad(st.orderSeq, 4);
    const order = { n, at: Date.now(), customer: { name: val('name'), phone: val('phone'), email: val('email') }, mode, address: mode === 'entrega' ? { street: val('street'), number: val('number'), district: val('district'), cep: val('cep'), complement: val('complement'), city: st.city } : null,
      items: t.items.map((i) => ({ id: i.p.id, vid: i.c.vid || '', name: i.p.name + (i.v ? ' — ' + i.v.name : ''), sku: i.p.sku, price: i.price, qty: i.qty, category: i.p.category })), subtotal: t.subtotal, discount: t.discount, coupon: t.coupon ? t.coupon.code : '', shipping: t.shipping, total: t.total,
      payment: { method: AV.payment.provider, status: 'Aguardando pagamento' }, status: 'Aguardando pagamento', notes: val('notes'), history: [{ at: Date.now(), status: 'Aguardando pagamento', by: 'Cliente' }], customerId: S().customer ? S().customer.id : '' };
    AV.payment.start(order);
    t.items.forEach((i) => { if (i.v) i.v.qty -= i.qty; else i.p.qty -= i.qty; i.p.sales = (i.p.sales || 0) + i.qty; });
    if (t.coupon) t.coupon.uses = (t.coupon.uses || 0) + 1;
    S().orders.unshift(order); S().cart = []; S().coupon = null; AV.ui.justOrdered = n;
    AV.persist('orders', 'cart', 'products', 'coupons', 'settings'); AV.log('Novo pedido', n + ' · ' + AV.money(order.total));
    AV.go('pedido/' + n);
  };

  /* ---------- pedido / acompanhar ---------- */
  AV.V.order = (n, tel) => {
    const o = S().orders.find((x) => x.n === n);
    const okAccess = o && (AV.ui.justOrdered === n || AV.currentUser() || (S().customer && o.customerId === S().customer.id) || (tel && o.customer.phone.replace(/\D/g, '').endsWith(String(tel).replace(/\D/g, '').slice(-4)) && String(tel).replace(/\D/g, '').length >= 4));
    if (!o || !okAccess) return '<div class="page center"><h2>Pedido não encontrado</h2><p>Confira o número e o telefone usados na compra.</p><a class="btn" href="#/acompanhar">Acompanhar pedido</a></div>';
    const steps = o.mode === 'retirada' ? ['Aguardando pagamento', 'Pago · separar', 'Em separação', 'Pronto para entrega', 'Concluído'] : ['Aguardando pagamento', 'Pago · separar', 'Em separação', 'Pronto para entrega', 'Saiu para entrega', 'Concluído'];
    const idx = steps.indexOf(o.status);
    return '<div class="page narrow"><div class="ok-box"><div class="check">✓</div><h1>' + (AV.ui.justOrdered === n ? 'Pedido recebido!' : 'Pedido ' + esc(n)) + '</h1><p>Número do pedido: <b class="big">' + esc(o.n) + '</b></p></div>' +
      (o.status === 'Cancelado' ? '<p class="tag off">Pedido cancelado</p>' : '<ol class="steps">' + steps.map((s, i) => '<li class="' + (i <= idx ? 'done' : '') + '">' + s.replace('Pronto para entrega', o.mode === 'retirada' ? 'Pronto para retirada' : 'Pronto para entrega') + '</li>').join('') + '</ol>') +
      '<div class="pay-box"><b>Pagamento: ' + esc(o.payment.status) + '</b><p>O pagamento online via Mercado Pago ainda não está ativo. A loja vai chamar você no WhatsApp para combinar o pagamento.</p></div>' +
      '<div class="sum static"><h3>Itens</h3>' + o.items.map((i) => '<div class="ln"><span>' + i.qty + '× ' + esc(i.name) + '</span><b>' + AV.money(i.price * i.qty) + '</b></div>').join('') + '<hr><div class="ln"><span>Subtotal</span><b>' + AV.money(o.subtotal) + '</b></div>' + (o.discount ? '<div class="ln"><span>Cupom ' + esc(o.coupon) + '</span><b>− ' + AV.money(o.discount) + '</b></div>' : '') + '<div class="ln"><span>Entrega</span><b>' + (o.shipping ? AV.money(o.shipping) : 'Grátis') + '</b></div><div class="ln tot"><span>Total</span><b>' + AV.money(o.total) + '</b></div></div>' +
      '<p class="muted">' + (o.mode === 'retirada' ? 'Retirada na loja.' : 'Entrega: ' + esc(o.address.street) + ', ' + esc(o.address.number) + ' — ' + esc(o.address.district) + ', ' + esc(o.address.city)) + '</p>' +
      '<div class="row gap center"><a class="btn" href="#/">Continuar comprando</a><button class="btn ghost" data-act="printPage">Imprimir</button><a class="btn ghost" target="_blank" rel="noopener" href="' + AV.waLink('Olá! Meu pedido é ' + o.n + '.') + '">Falar com a loja</a></div></div>';
  };
  AV.V.track = () => '<div class="page narrow"><h1>Acompanhar pedido</h1><form data-form="track" class="stack"><label>Número do pedido<input name="n" placeholder="AV-2026-0001" required></label><label>Telefone usado na compra<input name="tel" inputmode="tel" required placeholder="(33) 99999-9999"></label><button class="btn">Buscar pedido</button></form></div>';
  AV.F.track = (f) => AV.go('pedido/' + encodeURIComponent(f.n.value.trim().toUpperCase()) + '?tel=' + encodeURIComponent(f.tel.value));
  AV.A.printPage = () => window.print();
  AV.waLink = (msg) => { const n = (S().settings.whatsapp || '').replace(/\D/g, ''); return 'https://wa.me/' + n + '?text=' + encodeURIComponent(msg || ''); };

  /* ---------- favoritos / políticas / não encontrei / conta ---------- */
  AV.V.favs = () => { const arr = S().favs.map(AV.product).filter((p) => p && AV.visible(p)); return '<div class="page"><h1>Meus favoritos</h1>' + (arr.length ? grid(arr) : '<div class="empty"><h3>Você ainda não favoritou nada</h3><p>Toque no ♥ de um produto para guardá-lo aqui.</p><a class="btn" href="#/">Ver produtos</a></div>') + '</div>'; };
  AV.V.policy = (slug) => { const pl = S().settings.policies[slug]; if (!pl) return '<div class="page center"><h2>Página não encontrada</h2></div>'; return '<div class="page narrow"><h1>' + esc(pl[0]) + '</h1>' + pl[1].split('\n\n').map((t) => '<p>' + esc(t).replace(/\n/g, '<br>') + '</p>').join('') + '</div>'; };
  AV.V.request = () => '<div class="page narrow"><h1>Não encontrei o que procuro</h1><p>Conte o produto, a marca ou o tom que você quer. Vamos analisar e avisar você.</p><form data-form="request" class="stack"><label>O que você procura? <small id="cnt">0/200</small><textarea name="text" rows="4" maxlength="200" required data-input="count"></textarea></label><div class="two"><label>Seu nome (opcional)<input name="name"></label><label>WhatsApp (opcional)<input name="phone" inputmode="tel"></label></div><button class="btn">Enviar pedido</button></form></div>';
  AV.I.count = (el) => { AV.$('#cnt').textContent = el.value.length + '/200'; };
  AV.F.request = (f) => {
    const text = f.text.value.trim(); if (text.length < 3) return AV.toast('Escreva o que você procura.');
    S().requests.unshift({ id: AV.uid('r'), at: Date.now(), text: text.slice(0, 200), name: f.name.value.trim(), phone: f.phone.value.trim(), status: 'Novo' }); AV.persist('requests');
    AV.toast('Recebemos seu pedido! Obrigada.'); AV.go('');
  };
  AV.V.account = () => {
    const cu = S().customer;
    if (cu) { const mine = S().orders.filter((o) => o.customerId === cu.id); return '<div class="page narrow"><h1>Olá, ' + esc(cu.name.split(' ')[0]) + '!</h1><p>' + esc(cu.email) + '</p><h3>Meus pedidos</h3>' + (mine.length ? mine.map((o) => '<a class="ord" href="#/pedido/' + o.n + '"><b>' + o.n + '</b><span>' + AV.date(o.at) + '</span><span class="tag">' + esc(o.status) + '</span><b>' + AV.money(o.total) + '</b></a>').join('') : '<p class="muted">Você ainda não fez pedidos logada.</p>') + '<div class="row gap"><a class="btn ghost" href="#/favoritos">Meus favoritos</a><button class="btn ghost" data-act="logoutCustomer">Sair</button></div></div>'; }
    return '<div class="page narrow"><h1>Minha conta</h1><p class="muted">A conta é opcional — você pode comprar sem cadastro.</p><div class="two top"><form data-form="login" class="stack"><h3>Entrar</h3><label>E-mail<input name="email" type="email" required></label><label>Senha<input name="pass" type="password" required></label><button class="btn">Entrar</button></form><form data-form="register" class="stack"><h3>Criar conta</h3><label>Nome<input name="name" required></label><label>E-mail<input name="email" type="email" required></label><label>Telefone<input name="phone" inputmode="tel"></label><label>Senha (mín. 6)<input name="pass" type="password" minlength="6" required></label><button class="btn">Criar conta</button></form></div><p><a href="#/acompanhar">Acompanhar pedido sem conta</a></p></div>';
  };
  AV.F.register = (f) => {
    const email = AV.norm(f.email.value); if (S().customers.find((c) => c.email === email)) return AV.toast('Este e-mail já tem cadastro. Faça login.');
    if (f.pass.value.length < 6) return AV.toast('A senha precisa ter ao menos 6 caracteres.');
    const c = { id: AV.uid('cu'), name: f.name.value.trim(), email, phone: f.phone.value.trim(), pass: AV.simpleHash(f.pass.value) };
    S().customers.push(c); S().customer = c; AV.persist('customers'); AV.save('customer', c); AV.toast('Conta criada!'); AV.render();
  };
  AV.F.login = (f) => {
    const c = S().customers.find((x) => x.email === AV.norm(f.email.value) && x.pass === AV.simpleHash(f.pass.value)); if (!c) return AV.toast('E-mail ou senha incorretos.');
    S().customer = c; AV.save('customer', c); AV.toast('Bem-vinda de volta!'); AV.render();
  };
  AV.A.logoutCustomer = () => { S().customer = null; AV.save('customer', null); AV.render(); };

  /* ---------- cabeçalho: busca com sugestões, menu, WhatsApp, instalar ---------- */
  AV.F.search = (f) => { const q = f.q.value.trim(); if (!q) return; AV.$('#suggest').classList.remove('open'); AV.go('busca?q=' + encodeURIComponent(q)); };
  AV.I.suggest = (el) => {
    const q = el.value.trim(); const box = AV.$('#suggest');
    if (q.length < 2) { box.classList.remove('open'); return; }
    const res = AV.search(q).slice(0, 6);
    const cats = S().categories.filter((c) => c.active !== false && AV.norm(c.name).includes(AV.norm(q))).slice(0, 2);
    box.innerHTML = cats.map((c) => '<a href="#/categoria/' + encodeURIComponent(c.name) + '" data-act="closeSuggest"><span>🗂 ' + esc(c.name) + '</span></a>').join('') + res.map((p) => '<a href="#/produto/' + p.id + '" data-act="closeSuggest"><img alt="" src="' + AV.img(p) + '"><span>' + esc(p.name) + '<small>' + esc(p.brand) + ' · ' + AV.money(p.price) + '</small></span></a>').join('') +
      (res.length ? '<a href="#/busca?q=' + encodeURIComponent(q) + '" data-act="closeSuggest" class="all">Ver todos os resultados</a>' : '<div class="none">Nada encontrado. <a href="#/nao-encontrei?q=' + encodeURIComponent(q) + '" data-act="closeSuggest">Pedir este produto</a></div>');
    box.classList.add('open');
  };
  AV.A.closeSuggest = () => { AV.$('#suggest').classList.remove('open'); };
  AV.A.toggleMenu = () => { document.body.classList.toggle('menu-open'); };
  AV.A.toggleSearch = () => { document.body.classList.toggle('search-open'); const i = AV.$('#q'); if (i) i.focus(); };
  AV.A.whatsapp = () => {
    const st = S().settings;
    if (!st.whatsapp.replace(/\D/g, '')) { AV.toast('O WhatsApp da loja ainda não foi configurado.'); return; }
    window.open(AV.waLink('Olá! Vim pelo site da ' + st.storeName + '.'), '_blank', 'noopener');
  };
  AV.A.creator = () => window.open('https://wa.me/5533988295818', '_blank', 'noopener');
  AV.A.install = () => { const e = AV.ui.installEvt; if (!e) return AV.toast('Use o menu do navegador > “Adicionar à tela inicial”.'); e.prompt(); AV.ui.installEvt = null; AV.updateChrome(); };
  AV.A.top = () => window.scrollTo({ top: 0, behavior: 'smooth' });
})();
