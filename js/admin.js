/* Cosméticos Avenida — painel da loja (parte 1): login, painel, pedidos, produtos, editar */
(function () {
  'use strict';
  const AV = window.AV, esc = AV.esc, S = () => AV.S;
  const AD = AV.AD;
  AV.ui.ad = { prodQ: '', prodCat: '', prodSt: '', prodPage: 1, sel: [], ordQ: '', ordSt: '', ordPage: 1 };
  const U = () => AV.ui.ad;
  const TABS = [['painel', '📊'], ['pedidos', '🧾'], ['produtos', '📦'], ['editar', '➕'], ['importar', '📥'], ['estoque', '📉'], ['categorias', '🗂'], ['campanhas', '🎯'], ['cupons', '🏷'], ['naoencontrei', '🔎'], ['relatorios', '📈'], ['usuarios', '👥'], ['historico', '🕘'], ['config', '⚙']];
  const PER = 25;

  AV.adminView = (r) => {
    const u = AV.currentUser();
    if (!u) return loginView();
    let tab = r.parts[1] || 'painel';
    if (!AD[tab]) tab = 'painel';
    const allowed = TABS.filter((t) => AV.can(t[0]));
    const body = AV.can(tab) ? AD[tab](r) : '<div class="empty"><h3>Sem permissão</h3><p>Seu perfil (' + esc(u.role) + ') não acessa esta área. Peça ao administrador.</p></div>';
    return '<div class="adm"><aside class="adm-side" id="admSide"><div class="adm-brand"><img alt="Avenida" src="assets/logo.png"><small>Painel da loja</small></div><nav>' +
      allowed.map((t) => '<a class="' + (tab === t[0] ? 'on' : '') + '" href="#/admin/' + t[0] + '"><span>' + t[1] + '</span>' + esc(AV.PERM_LABEL[t[0]]) + (t[0] === 'pedidos' && S().orders.filter((o) => o.status === 'Aguardando pagamento').length ? '<em>' + S().orders.filter((o) => o.status === 'Aguardando pagamento').length + '</em>' : '') + (t[0] === 'naoencontrei' && S().requests.filter((x) => x.status === 'Novo').length ? '<em>' + S().requests.filter((x) => x.status === 'Novo').length + '</em>' : '') + '</a>').join('') +
      '</nav><div class="adm-user"><b>' + esc(u.name) + '</b><small>' + esc(u.role) + '</small><a href="#/" class="btn sm ghost">Ver loja</a><button class="btn sm ghost" data-act="adminLogout">Sair</button></div></aside>' +
      '<main class="adm-main"><div class="adm-top"><button class="btn sm ghost only-m" data-act="admMenu">☰ Menu</button><h1>' + esc(AV.PERM_LABEL[tab]) + '</h1></div>' + body + '</main></div>';
  };
  AV.A.admMenu = () => AV.$('#admSide').classList.toggle('open');
  const loginView = () => '<div class="login"><div class="login-box"><img alt="Avenida" src="assets/logo.png"><h2>Área da loja</h2><form data-form="adminLogin" class="stack"><label>E-mail<input name="email" type="email" required autocomplete="username"></label><label>Senha<input name="pass" type="password" required autocomplete="current-password"></label><button class="btn block">Entrar</button></form>' +
    '<details class="demo"><summary>Acessos de demonstração</summary><p><b>Administrador</b><br>admin@avenida.com / admin123</p><p><b>Gerente</b><br>gerente@avenida.com / gerente123</p><p><b>Funcionário</b><br>funcionario@avenida.com / func123</p><small>Troque essas senhas em “Usuários e permissões”. Esta proteção funciona só no navegador (demonstração); para uso real é preciso um servidor.</small></details><a href="#/" class="link">← Voltar à loja</a></div></div>';
  AV.F.adminLogin = (f) => {
    const u = S().users.find((x) => AV.norm(x.email) === AV.norm(f.email.value) && x.pass === AV.simpleHash(f.pass.value));
    if (!u) return AV.toast('E-mail ou senha incorretos.');
    if (!u.active) return AV.toast('Usuário desativado.');
    S().session = { id: u.id }; AV.save('session', S().session); AV.log('Login no painel', u.email); AV.go('admin/painel');
  };
  AV.A.adminLogout = () => { AV.log('Logout', ''); S().session = null; AV.save('session', null); AV.go('admin'); };
  AV.A.adminLink = () => AV.go('admin');

  const kpi = (l, v, s, cls) => '<div class="kpi ' + (cls || '') + '"><small>' + l + '</small><b>' + v + '</b>' + (s ? '<span>' + s + '</span>' : '') + '</div>';

  /* ---------- painel ---------- */
  AD.painel = () => {
    const P = S().products, O = S().orders; const today = AV.day(Date.now());
    const oToday = O.filter((o) => AV.day(o.at) === today && o.status !== 'Cancelado');
    const paid = O.filter((o) => !['Aguardando pagamento', 'Cancelado'].includes(o.status));
    const low = P.filter((p) => p.active && AV.stockState(p) === 'low'), zero = P.filter((p) => p.active && AV.stockState(p) === 'zero');
    const days = []; for (let i = 6; i >= 0; i--) { const d = AV.day(Date.now() - i * 86400000); days.push([d.slice(8) + '/' + d.slice(5, 7), O.filter((o) => AV.day(o.at) === d && o.status !== 'Cancelado').reduce((s, o) => s + o.total, 0)]); }
    const mx = Math.max.apply(null, days.map((d) => d[1]).concat([1]));
    return '<div class="kpis">' + kpi('Pedidos hoje', oToday.length, AV.money(oToday.reduce((s, o) => s + o.total, 0))) + kpi('Aguardando pagamento', O.filter((o) => o.status === 'Aguardando pagamento').length, 'precisam de atenção', 'warn') + kpi('Vendas confirmadas', AV.money(paid.reduce((s, o) => s + o.total, 0)), paid.length + ' pedidos') + kpi('Produtos ativos', P.filter((p) => p.active).length.toLocaleString('pt-BR'), P.length.toLocaleString('pt-BR') + ' no catálogo') + kpi('Estoque baixo', low.length, 'abaixo do mínimo', low.length ? 'warn' : '') + kpi('Sem estoque', zero.length, 'indisponíveis', zero.length ? 'bad' : '') + kpi('“Não encontrei” novos', S().requests.filter((r) => r.status === 'Novo').length, '') + '</div>' +
      '<div class="cols"><section class="box"><h3>Vendas — últimos 7 dias</h3><div class="bars">' + days.map((d) => '<div><i style="height:' + Math.max(3, d[1] / mx * 100) + '%" title="' + AV.money(d[1]) + '"></i><small>' + d[0] + '</small></div>').join('') + '</div></section>' +
      '<section class="box"><h3>Atalhos</h3><div class="quick">' + [['editar/novo', '➕ Novo produto'], ['pedidos', '🧾 Ver pedidos'], ['estoque', '📉 Estoque'], ['importar', '📥 Importar planilha'], ['campanhas', '🎯 Campanhas'], ['relatorios', '📈 Relatórios']].filter((a) => AV.can(a[0].split('/')[0])).map((a) => '<a class="btn ghost" href="#/admin/' + a[0] + '">' + a[1] + '</a>').join('') + '</div></section></div>' +
      '<div class="cols"><section class="box"><h3>Últimos pedidos</h3>' + (O.length ? '<table class="tbl"><tbody>' + O.slice(0, 6).map((o) => '<tr><td><button class="link" data-act="orderOpen" data-n="' + o.n + '">' + o.n + '</button></td><td>' + esc(o.customer.name) + '</td><td>' + AV.money(o.total) + '</td><td><span class="tag">' + esc(o.status) + '</span></td></tr>').join('') + '</tbody></table>' : '<p class="muted">Nenhum pedido ainda. Faça uma compra de teste na loja!</p>') + '</section>' +
      '<section class="box"><h3>Atenção ao estoque</h3>' + (low.length + zero.length ? '<table class="tbl"><tbody>' + zero.slice(0, 4).concat(low.slice(0, 4)).map((p) => '<tr><td>' + esc(p.name) + '</td><td>' + stBadge(p) + '</td></tr>').join('') + '</tbody></table><a class="link" href="#/admin/estoque">Ver estoque completo →</a>' : '<p class="muted">Tudo certo com o estoque.</p>') + '</section></div>';
  };
  const stBadge = (p) => { const s = AV.stockState(p); return '<span class="tag ' + (s === 'zero' ? 'off' : s === 'low' ? 'warn' : 'ok') + '">' + AV.stock(p) + (s === 'zero' ? ' · sem estoque' : s === 'low' ? ' · baixo' : '') + '</span>'; };
  AV.stBadge = stBadge;

  /* ---------- pedidos ---------- */
  const filtOrders = () => { const q = AV.norm(U().ordQ); return S().orders.filter((o) => (!U().ordSt || o.status === U().ordSt) && (!q || AV.norm(o.n + ' ' + o.customer.name + ' ' + o.customer.phone).includes(q))); };
  AD.pedidos = () => {
    const arr = filtOrders(); const pages = Math.max(1, Math.ceil(arr.length / PER)); U().ordPage = Math.min(U().ordPage, pages);
    const rows = arr.slice((U().ordPage - 1) * PER, U().ordPage * PER);
    return '<div class="toolbar"><input placeholder="Buscar nº, cliente ou telefone" value="' + esc(U().ordQ) + '" data-change="ordQ"><select data-change="ordSt"><option value="">Todos os status</option>' + AV.STATUS.map((s) => '<option ' + (U().ordSt === s ? 'selected' : '') + '>' + s + '</option>').join('') + '</select><button class="btn ghost" data-act="ordersCsv">Exportar CSV</button></div>' +
      (rows.length ? '<div class="tbl-w"><table class="tbl"><thead><tr><th>Pedido</th><th>Data</th><th>Cliente</th><th>Tipo</th><th>Total</th><th>Pagamento</th><th>Status</th><th></th></tr></thead><tbody>' + rows.map((o) => '<tr><td><b>' + o.n + '</b></td><td>' + AV.date(o.at) + '</td><td>' + esc(o.customer.name) + '<br><small>' + esc(o.customer.phone) + '</small></td><td>' + (o.mode === 'retirada' ? 'Retirada' : 'Entrega') + '</td><td>' + AV.money(o.total) + '</td><td>' + esc(o.payment.status) + '</td><td><span class="tag">' + esc(o.status) + '</span></td><td><button class="btn sm" data-act="orderOpen" data-n="' + o.n + '">Abrir</button></td></tr>').join('') + '</tbody></table></div>' : '<div class="empty"><h3>Nenhum pedido encontrado</h3></div>') + pager(arr.length, U().ordPage, 'ordPage');
  };
  const pager = (total, page, act) => { const pages = Math.max(1, Math.ceil(total / PER)); return total > PER ? '<div class="pager"><button class="btn sm ghost" data-act="' + act + '" data-p="' + (page - 1) + '" ' + (page <= 1 ? 'disabled' : '') + '>‹ Anterior</button><span>Página ' + page + ' de ' + pages + ' · ' + total.toLocaleString('pt-BR') + ' itens</span><button class="btn sm ghost" data-act="' + act + '" data-p="' + (page + 1) + '" ' + (page >= pages ? 'disabled' : '') + '>Próxima ›</button></div>' : '<div class="pager"><span>' + total + ' itens</span></div>'; };
  AV.pager = pager;
  AV.I.ordQ = (el) => { U().ordQ = el.value; U().ordPage = 1; AV.render({ keepScroll: true }); };
  AV.I.ordSt = (el) => { U().ordSt = el.value; U().ordPage = 1; AV.render({ keepScroll: true }); };
  AV.A.ordPage = (el) => { U().ordPage = Number(el.dataset.p); AV.render(); };
  AV.A.ordersCsv = () => { const rows = [['Pedido', 'Data', 'Cliente', 'Telefone', 'Tipo', 'Subtotal', 'Desconto', 'Frete', 'Total', 'Pagamento', 'Status', 'Itens']].concat(filtOrders().map((o) => [o.n, AV.date(o.at), o.customer.name, o.customer.phone, o.mode, o.subtotal, o.discount, o.shipping, o.total, o.payment.status, o.status, o.items.map((i) => i.qty + 'x ' + i.name).join(' | ')])); AV.download('pedidos.csv', AV.toCSV(rows), 'text/csv;charset=utf-8'); AV.toast('Pedidos exportados'); };
  const orderHtml = (o) => '<h3>Pedido ' + o.n + '</h3><p class="muted">' + AV.date(o.at) + ' · ' + (o.mode === 'retirada' ? 'Retirada na loja' : 'Entrega') + '</p>' +
    '<div class="cols"><div><b>Cliente</b><p>' + esc(o.customer.name) + '<br>' + esc(o.customer.phone) + (o.customer.email ? '<br>' + esc(o.customer.email) : '') + '</p>' + (o.address ? '<b>Endereço</b><p>' + esc(o.address.street) + ', ' + esc(o.address.number) + '<br>' + esc(o.address.district) + ' — ' + esc(o.address.city) + (o.address.cep ? ' · CEP ' + esc(o.address.cep) : '') + (o.address.complement ? '<br>' + esc(o.address.complement) : '') + '</p>' : '') + (o.notes ? '<b>Observações do cliente</b><p>' + esc(o.notes) + '</p>' : '') + '</div>' +
    '<div><b>Pagamento</b><p>' + esc(o.payment.method) + ' — ' + esc(o.payment.status) + '</p><label>Status do pedido<select id="ordStatus">' + AV.STATUS.map((s) => '<option ' + (o.status === s ? 'selected' : '') + '>' + s + '</option>').join('') + '</select></label><div class="row gap wrap"><button class="btn sm" data-act="orderStatus" data-n="' + o.n + '">Salvar status</button>' + (o.status === 'Aguardando pagamento' ? '<button class="btn sm ghost" data-act="orderPaid" data-n="' + o.n + '">Marcar como pago</button>' : '') + '</div></div></div>' +
    '<table class="tbl"><tbody>' + o.items.map((i) => '<tr><td>' + i.qty + '×</td><td>' + esc(i.name) + '<br><small>' + esc(i.sku) + '</small></td><td>' + AV.money(i.price * i.qty) + '</td></tr>').join('') + '<tr><td colspan="2">Subtotal</td><td>' + AV.money(o.subtotal) + '</td></tr>' + (o.discount ? '<tr><td colspan="2">Cupom ' + esc(o.coupon) + '</td><td>− ' + AV.money(o.discount) + '</td></tr>' : '') + '<tr><td colspan="2">Entrega</td><td>' + AV.money(o.shipping) + '</td></tr><tr><td colspan="2"><b>Total</b></td><td><b>' + AV.money(o.total) + '</b></td></tr></tbody></table>' +
    '<b>Histórico</b><ul class="hist">' + o.history.slice().reverse().map((h) => '<li>' + AV.date(h.at) + ' — ' + esc(h.status) + ' <small>(' + esc(h.by) + ')</small></li>').join('') + '</ul>' +
    '<div class="row gap wrap end"><a class="btn ghost sm" target="_blank" rel="noopener" href="https://wa.me/55' + o.customer.phone.replace(/\D/g, '').replace(/^55/, '') + '?text=' + encodeURIComponent('Olá ' + o.customer.name.split(' ')[0] + '! Sobre o seu pedido ' + o.n + ' na ' + S().settings.storeName + ':') + '">WhatsApp do cliente</a><button class="btn ghost sm" data-act="printPage">Imprimir</button></div>';
  AV.A.orderOpen = (el) => { const o = S().orders.find((x) => x.n === el.dataset.n); if (o) AV.modal(orderHtml(o), true); };
  const setStatus = (o, st, by) => {
    if (o.status === st) return;
    const was = o.status; o.status = st; o.history.push({ at: Date.now(), status: st, by: by || (AV.currentUser() || {}).name || 'Sistema' });
    if (st === 'Cancelado') o.items.forEach((i) => { const p = AV.product(i.id); if (!p) return; const v = i.vid ? AV.variation(p, i.vid) : null; if (v) v.qty += i.qty; else p.qty += i.qty; });
    else if (was === 'Cancelado') o.items.forEach((i) => { const p = AV.product(i.id); if (!p) return; const v = i.vid ? AV.variation(p, i.vid) : null; if (v) v.qty = Math.max(0, v.qty - i.qty); else p.qty = Math.max(0, p.qty - i.qty); });
    if (st === 'Pago · separar') o.payment.status = 'Pago (confirmado manualmente)';
    if (st === 'Aguardando pagamento') o.payment.status = 'Aguardando pagamento';
    AV.persist('orders', 'products'); AV.log('Status do pedido', o.n + ': ' + was + ' → ' + st);
  };
  AV.A.orderStatus = (el) => { const o = S().orders.find((x) => x.n === el.dataset.n); setStatus(o, AV.$('#ordStatus').value); AV.toast('Status atualizado'); AV.closeModal(); AV.render({ keepScroll: true }); };
  AV.A.orderPaid = (el) => { const o = S().orders.find((x) => x.n === el.dataset.n); setStatus(o, 'Pago · separar'); AV.toast('Pedido marcado como pago'); AV.closeModal(); AV.render({ keepScroll: true }); };

  /* ---------- produtos (lista) ---------- */
  const filtProducts = () => { const q = AV.norm(U().prodQ); return S().products.filter((p) => (!U().prodCat || p.category === U().prodCat) && (!U().prodSt || (U().prodSt === 'ativo' ? p.active : U().prodSt === 'inativo' ? !p.active : U().prodSt === 'zero' ? AV.stockState(p) === 'zero' : U().prodSt === 'baixo' ? AV.stockState(p) === 'low' : U().prodSt === 'promo' ? p.promo : p.featured)) && (!q || AV.norm(p.name + ' ' + p.sku + ' ' + p.brand + ' ' + p.shadeCode).includes(q))); };
  AD.produtos = () => {
    const arr = filtProducts(); const pages = Math.max(1, Math.ceil(arr.length / PER)); U().prodPage = Math.min(U().prodPage, pages);
    const rows = arr.slice((U().prodPage - 1) * PER, U().prodPage * PER); const sel = U().sel;
    return '<div class="toolbar"><input placeholder="Buscar nome, SKU, marca…" value="' + esc(U().prodQ) + '" data-change="prodQ"><select data-change="prodCat"><option value="">Todas categorias</option>' + S().categories.map((c) => '<option ' + (U().prodCat === c.name ? 'selected' : '') + '>' + esc(c.name) + '</option>').join('') + '</select><select data-change="prodSt">' + [['', 'Todos'], ['ativo', 'Ativos'], ['inativo', 'Inativos'], ['zero', 'Sem estoque'], ['baixo', 'Estoque baixo'], ['promo', 'Em promoção'], ['feat', 'Destaques']].map((o) => '<option value="' + o[0] + '" ' + (U().prodSt === o[0] ? 'selected' : '') + '>' + o[1] + '</option>').join('') + '</select><a class="btn" href="#/admin/editar/novo">+ Novo produto</a></div>' +
      '<div class="bulk ' + (sel.length ? 'on' : '') + '"><b>' + sel.length + ' selecionado(s)</b><select id="bulkAct"><option value="">Ação em massa…</option><option value="ativar">Ativar</option><option value="desativar">Desativar</option><option value="promo_on">Colocar em promoção</option><option value="promo_off">Tirar da promoção</option><option value="destaque_on">Marcar destaque</option><option value="destaque_off">Tirar destaque</option><option value="preco_pct">Reajustar preço em %</option><option value="categoria">Mudar categoria</option><option value="excluir">Excluir</option></select><input id="bulkVal" placeholder="valor (% ou categoria)" size="14"><button class="btn sm" data-act="bulkApply">Aplicar</button><button class="btn sm ghost" data-act="bulkAllFiltered">Selecionar todos os ' + arr.length.toLocaleString('pt-BR') + ' filtrados</button><button class="btn sm ghost" data-act="bulkClear">Limpar</button></div>' +
      (rows.length ? '<div class="tbl-w"><table class="tbl"><thead><tr><th><input type="checkbox" data-change="selPage" ' + (rows.every((p) => sel.includes(p.id)) ? 'checked' : '') + ' aria-label="Selecionar página"></th><th></th><th>Produto</th><th>Categoria</th><th>Preço</th><th>Estoque</th><th>Ativo</th><th></th></tr></thead><tbody>' + rows.map((p) => '<tr><td><input type="checkbox" data-change="selOne" data-id="' + p.id + '" ' + (sel.includes(p.id) ? 'checked' : '') + '></td><td><img class="th" alt="" loading="lazy" src="' + AV.img(p) + '"></td><td><b>' + esc(p.name) + '</b><br><small>' + esc(p.sku) + ' · ' + esc(p.brand) + (p.promo ? ' · <span class="tag promo">promo</span>' : '') + (p.featured ? ' · ★' : '') + '</small></td><td>' + esc(p.category) + '</td><td>' + AV.money(p.price) + '</td><td>' + stBadge(p) + '</td><td><button class="switch ' + (p.active ? 'on' : '') + '" data-act="toggleActive" data-id="' + p.id + '" aria-label="Ativar/desativar"><i></i></button></td><td class="nw"><a class="btn sm ghost" href="#/admin/editar/' + p.id + '">Editar</a> <button class="btn sm ghost" data-act="prodDup" data-id="' + p.id + '">Duplicar</button> <button class="btn sm danger" data-act="prodDel" data-id="' + p.id + '">Excluir</button></td></tr>').join('') + '</tbody></table></div>' : '<div class="empty"><h3>Nenhum produto encontrado</h3></div>') + pager(arr.length, U().prodPage, 'prodPage');
  };
  AV.I.prodQ = (el) => { U().prodQ = el.value; U().prodPage = 1; AV.render({ keepScroll: true }); };
  AV.I.prodCat = (el) => { U().prodCat = el.value; U().prodPage = 1; AV.render({ keepScroll: true }); };
  AV.I.prodSt = (el) => { U().prodSt = el.value; U().prodPage = 1; AV.render({ keepScroll: true }); };
  AV.A.prodPage = (el) => { U().prodPage = Number(el.dataset.p); AV.render(); };
  AV.I.selOne = (el) => { const s = U().sel; const i = s.indexOf(el.dataset.id); if (el.checked && i < 0) s.push(el.dataset.id); if (!el.checked && i >= 0) s.splice(i, 1); AV.render({ keepScroll: true }); };
  AV.I.selPage = (el) => { const rows = filtProducts().slice((U().prodPage - 1) * PER, U().prodPage * PER); rows.forEach((p) => { const i = U().sel.indexOf(p.id); if (el.checked && i < 0) U().sel.push(p.id); if (!el.checked && i >= 0) U().sel.splice(i, 1); }); AV.render({ keepScroll: true }); };
  AV.A.bulkClear = () => { U().sel = []; AV.render({ keepScroll: true }); };
  AV.A.bulkAllFiltered = () => { U().sel = filtProducts().map((p) => p.id); AV.render({ keepScroll: true }); };
  AV.A.bulkApply = () => {
    const act = AV.$('#bulkAct').value, val = AV.$('#bulkVal').value.trim(); const ids = U().sel;
    if (!ids.length) return AV.toast('Selecione ao menos um produto.');
    if (!act) return AV.toast('Escolha a ação.');
    const set = new Set(ids); const list = S().products.filter((p) => set.has(p.id));
    const run = () => {
      if (act === 'ativar') list.forEach((p) => (p.active = true));
      if (act === 'desativar') list.forEach((p) => (p.active = false));
      if (act === 'promo_on') list.forEach((p) => { p.promo = true; if (!p.oldprice) p.oldprice = Math.round(p.price * 1.2 * 10) / 10; });
      if (act === 'promo_off') list.forEach((p) => (p.promo = false));
      if (act === 'destaque_on') list.forEach((p) => (p.featured = true));
      if (act === 'destaque_off') list.forEach((p) => (p.featured = false));
      if (act === 'preco_pct') { const pc = AV.numRaw(val); list.forEach((p) => { p.price = Math.max(0.1, Math.round(p.price * (1 + pc / 100) * 100) / 100); (p.variations || []).forEach((v) => { if (v.price) v.price = Math.max(0.1, Math.round(v.price * (1 + pc / 100) * 100) / 100); }); }); }
      if (act === 'categoria') list.forEach((p) => { p.category = val; if (!(S().categories.find((c) => c.name === val) || { subs: [] }).subs.includes(p.subcategory)) p.subcategory = ''; });
      if (act === 'excluir') S().products = S().products.filter((p) => !set.has(p.id));
      AV.persist('products'); AV.log('Ação em massa: ' + act, list.length + ' produto(s)'); U().sel = []; AV.toast('Ação aplicada a ' + list.length + ' produto(s)'); AV.render({ keepScroll: true });
    };
    if (act === 'preco_pct' && (val === '' || isNaN(AV.numRaw(val)))) return AV.toast('Informe o percentual (ex.: 10 ou -5).');
    if (act === 'categoria' && !S().categories.find((c) => c.name === val)) return AV.toast('Digite o nome exato de uma categoria existente.');
    if (act === 'excluir') AV.confirm('Excluir ' + list.length + ' produto(s)? Não dá para desfazer.', run, 'Excluir'); else run();
  };
  AV.A.toggleActive = (el) => { const p = AV.product(el.dataset.id); p.active = !p.active; AV.persist('products'); AV.log(p.active ? 'Produto ativado' : 'Produto desativado', p.sku + ' ' + p.name); AV.render({ keepScroll: true }); };
  AV.A.prodDel = (el) => { const p = AV.product(el.dataset.id); AV.confirm('Excluir “' + esc(p.name) + '”? Não dá para desfazer.', () => { S().products = S().products.filter((x) => x.id !== p.id); S().cart = S().cart.filter((c) => c.id !== p.id); S().favs = S().favs.filter((f) => f !== p.id); AV.persist('products', 'cart', 'favs'); AV.log('Produto excluído', p.sku + ' ' + p.name); AV.toast('Produto excluído'); AV.render({ keepScroll: true }); }, 'Excluir'); };
  AV.A.prodDup = (el) => { const p = AV.product(el.dataset.id); const c = JSON.parse(JSON.stringify(p)); c.id = AV.nextProductId(); c.sku = p.sku + '-COPIA'; c.name = p.name + ' (cópia)'; c.active = false; c.createdAt = Date.now(); (c.variations || []).forEach((v, i) => (v.id = c.id + 'v' + (i + 1))); S().products.unshift(c); AV.persist('products'); AV.log('Produto duplicado', p.sku); AV.toast('Cópia criada (inativa). Edite e ative.'); AV.go('admin/editar/' + c.id); };

  /* ---------- adicionar / editar ---------- */
  const blank = () => ({ id: '', sku: '', name: '', brand: (S().brands[0] || {}).name || '', category: (S().categories[0] || {}).name || '', subcategory: '', shade: '', shadeCode: '', color: '#850037', shape: 'bottle', price: '', oldprice: '', qty: 0, minqty: 5, active: true, featured: false, promo: false, isNew: true, sales: 0, images: [], variations: [], desc: '', purpose: '', how: '', notes: '', warnings: '' });
  AD.editar = (r) => {
    const id = r.parts[2] || 'novo';
    if (!AV.ui.draft || AV.ui.draftId !== id) { AV.ui.draftId = id; AV.ui.draft = id === 'novo' ? blank() : JSON.parse(JSON.stringify(AV.product(id) || blank())); if (id !== 'novo' && !AV.product(id)) return '<div class="empty"><h3>Produto não encontrado</h3><a class="btn" href="#/admin/produtos">Voltar</a></div>'; }
    const d = AV.ui.draft; const cat = S().categories.find((c) => c.name === d.category) || { subs: [] };
    const hasV = d.variations.length > 0;
    const sel = (name, opts, cur, extra) => '<select name="' + name + '" ' + (extra || '') + '>' + opts.map((o) => '<option ' + (o === cur ? 'selected' : '') + '>' + esc(o) + '</option>').join('') + '</select>';
    return '<form id="pform" data-form="product" class="pform" novalidate><div class="cols"><section class="box"><h3>Informações básicas</h3><label>Nome do produto *<input name="name" value="' + esc(d.name) + '" required></label><div class="two"><label>Código (SKU)<input name="sku" value="' + esc(d.sku) + '" placeholder="automático se vazio"></label><label>Marca<select name="brand">' + S().brands.map((b) => '<option ' + (b.name === d.brand ? 'selected' : '') + '>' + esc(b.name) + '</option>').join('') + '</select></label></div><div class="two"><label>Categoria<select name="category" data-change="catChange">' + S().categories.map((c) => '<option ' + (c.name === d.category ? 'selected' : '') + '>' + esc(c.name) + '</option>').join('') + '</select></label><label>Subcategoria<select name="subcategory"><option value="">—</option>' + cat.subs.map((s) => '<option ' + (s === d.subcategory ? 'selected' : '') + '>' + esc(s) + '</option>').join('') + '</select></label></div>' +
      '<div class="two"><label>Tom / cor (texto)<input name="shade" value="' + esc(d.shade) + '" placeholder="ex.: Louro claro"></label><label>Código do tom<input name="shadeCode" value="' + esc(d.shadeCode) + '" placeholder="ex.: 8.0"></label></div><div class="two"><label>Cor da ilustração<input type="color" name="color" value="' + esc(d.color || '#850037') + '"></label><label>Formato da ilustração<select name="shape">' + ['bottle', 'box', 'jar', 'tube', 'lipstick', 'perfume', 'brush'].map((s) => '<option ' + (s === d.shape ? 'selected' : '') + '>' + s + '</option>').join('') + '</select></label></div></section>' +
      '<section class="box"><h3>Preço e estoque</h3><div class="two"><label>Preço (R$) *<input name="price" value="' + esc(d.price) + '" inputmode="decimal" required></label><label>Preço antigo (R$)<input name="oldprice" value="' + esc(d.oldprice || '') + '" inputmode="decimal"></label></div><div class="two"><label>Quantidade em estoque<input name="qty" type="number" min="0" value="' + esc(hasV ? d.variations.reduce((s, v) => s + Number(v.qty || 0), 0) : d.qty) + '" ' + (hasV ? 'disabled title="Soma das variações"' : '') + '></label><label>Estoque mínimo (alerta)<input name="minqty" type="number" min="0" value="' + esc(d.minqty) + '"></label></div><div class="checks"><label class="chk"><input type="checkbox" name="active" ' + (d.active ? 'checked' : '') + '> Ativo na loja</label><label class="chk"><input type="checkbox" name="promo" ' + (d.promo ? 'checked' : '') + '> Em promoção</label><label class="chk"><input type="checkbox" name="featured" ' + (d.featured ? 'checked' : '') + '> Destaque / sugestão</label><label class="chk"><input type="checkbox" name="isNew" ' + (d.isNew ? 'checked' : '') + '> Novidade</label></div><small class="muted">O cliente nunca vê a quantidade — só “Disponível” ou “Indisponível”.</small></section></div>' +
      '<section class="box"><h3>Fotos</h3><p class="muted">Até 6 fotos. Sem fotos, a loja usa uma ilustração automática.</p><div class="imgs">' + d.images.map((s, i) => '<div class="im"><img alt="" src="' + esc(s) + '"><button type="button" class="x" data-act="imgDel" data-i="' + i + '" aria-label="Remover">×</button></div>').join('') + '</div><div class="row gap wrap"><input type="file" accept="image/*" multiple data-change="imgFiles"><input id="imgUrl" placeholder="ou cole o link de uma imagem (https://…)" size="30"><button type="button" class="btn sm ghost" data-act="imgUrl">Adicionar link</button></div></section>' +
      '<section class="box"><h3>Variações (cores / tons)</h3><p class="muted">Cada variação tem preço e estoque próprios; o cliente escolhe na página do produto.</p>' + (hasV ? '<table class="tbl vtbl"><thead><tr><th>Nome</th><th>Código</th><th>Cor</th><th>Preço</th><th>Estoque</th><th></th></tr></thead><tbody>' + d.variations.map((v, i) => '<tr><td><input name="vn' + i + '" value="' + esc(v.name) + '"></td><td><input name="vc' + i + '" value="' + esc(v.code || '') + '" size="6"></td><td><input type="color" name="vk' + i + '" value="' + esc(v.color || '#850037') + '"></td><td><input name="vp' + i + '" value="' + esc(v.price || '') + '" size="7" inputmode="decimal"></td><td><input type="number" min="0" name="vq' + i + '" value="' + esc(v.qty) + '" size="5"></td><td><button type="button" class="btn sm danger" data-act="varDel" data-i="' + i + '">×</button></td></tr>').join('') + '</tbody></table>' : '') + '<button type="button" class="btn sm ghost" data-act="varAdd">+ Adicionar variação</button></section>' +
      '<section class="box"><h3>Textos da página do produto</h3><label>Descrição<textarea name="desc" rows="3">' + esc(d.desc) + '</textarea></label><label>Para que serve<textarea name="purpose" rows="2">' + esc(d.purpose) + '</textarea></label><label>Como usar<textarea name="how" rows="2">' + esc(d.how) + '</textarea></label><label>Observações<textarea name="notes" rows="2">' + esc(d.notes) + '</textarea></label><label>Cuidados e avisos<textarea name="warnings" rows="2">' + esc(d.warnings) + '</textarea></label></section>' +
      '<div class="row gap wrap end sticky"><a class="btn ghost" href="#/admin/produtos">Cancelar</a><button class="btn ghost" type="button" data-act="prodPreview">Pré-visualizar</button><button class="btn">Salvar produto</button></div></form>';
  };
  const readForm = () => {
    const f = AV.$('#pform'); if (!f) return AV.ui.draft; const d = AV.ui.draft; const g = (n) => (f.elements[n] ? f.elements[n].value : '');
    ['name', 'sku', 'brand', 'category', 'subcategory', 'shade', 'shadeCode', 'color', 'shape', 'desc', 'purpose', 'how', 'notes', 'warnings'].forEach((n) => (d[n] = g(n).trim ? g(n).trim() : g(n)));
    d.price = g('price'); d.oldprice = g('oldprice'); d.minqty = Number(g('minqty')) || 0;
    ['active', 'promo', 'featured', 'isNew'].forEach((n) => (d[n] = f.elements[n].checked));
    if (!d.variations.length) d.qty = Math.max(0, parseInt(g('qty'), 10) || 0);
    d.variations.forEach((v, i) => { v.name = g('vn' + i).trim(); v.code = g('vc' + i).trim(); v.color = g('vk' + i); v.price = g('vp' + i); v.qty = Math.max(0, parseInt(g('vq' + i), 10) || 0); });
    return d;
  };
  AV.I.catChange = () => { readForm(); const c = S().categories.find((x) => x.name === AV.ui.draft.category); if (c && !c.subs.includes(AV.ui.draft.subcategory)) AV.ui.draft.subcategory = ''; AV.render({ keepScroll: true }); };
  AV.A.varAdd = () => { const d = readForm(); d.variations.push({ id: (d.id || 'novo') + 'v' + Date.now().toString(36), name: '', code: '', color: d.color || '#850037', price: '', qty: 0 }); AV.render({ keepScroll: true }); };
  AV.A.varDel = (el) => { const d = readForm(); d.variations.splice(Number(el.dataset.i), 1); if (!d.variations.length) d.qty = 0; AV.render({ keepScroll: true }); };
  AV.A.imgDel = (el) => { const d = readForm(); d.images.splice(Number(el.dataset.i), 1); AV.render({ keepScroll: true }); };
  AV.A.imgUrl = () => { const d = readForm(); const u = AV.$('#imgUrl').value.trim(); if (!/^https?:\/\//.test(u)) return AV.toast('Cole um link que comece com https://'); if (d.images.length >= 6) return AV.toast('Máximo de 6 fotos.'); d.images.push(u); AV.render({ keepScroll: true }); };
  const shrink = (file) => new Promise((res, rej) => { const fr = new FileReader(); fr.onerror = rej; fr.onload = () => { const im = new Image(); im.onerror = rej; im.onload = () => { const m = 640, k = Math.min(1, m / Math.max(im.width, im.height)); const c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', 0.72)); }; im.src = fr.result; }; fr.readAsDataURL(file); });
  AV.shrinkImage = shrink;
  AV.I.imgFiles = async (el) => { const d = readForm(); const files = Array.from(el.files).slice(0, 6 - d.images.length); for (const f of files) { try { d.images.push(await shrink(f)); } catch (e) { AV.toast('Não consegui ler “' + f.name + '”.'); } } AV.render({ keepScroll: true }); };
  AV.A.prodPreview = () => { const d = readForm(); const p = Object.assign({}, d, { id: d.id || 'preview', price: AV.numRaw(d.price), oldprice: AV.numRaw(d.oldprice), active: true }); AV.modal('<h3>Pré-visualização</h3><div class="grid one">' + AV.card(p) + '</div>'); };
  AV.F.product = (f) => {
    const d = readForm(); const errs = [];
    if (d.name.length < 2) errs.push('Informe o nome do produto.');
    if (!(AV.numRaw(d.price) > 0)) errs.push('Informe um preço maior que zero.');
    if (d.variations.some((v) => !v.name)) errs.push('Toda variação precisa de um nome.');
    if (errs.length) return AV.toast(errs[0]);
    const isNew = !d.id; const id = d.id || AV.nextProductId();
    if (!d.sku) d.sku = 'AV-' + id.replace(/\D/g, '');
    if (S().products.some((p) => p.sku === d.sku && p.id !== id)) return AV.toast('Já existe outro produto com este SKU.');
    const prod = Object.assign({}, d, { id, price: AV.numRaw(d.price), oldprice: AV.numRaw(d.oldprice) || 0, createdAt: d.createdAt || Date.now() });
    prod.variations = prod.variations.map((v, i) => ({ id: v.id && !/^novo/.test(v.id) ? v.id : id + 'v' + (i + 1) + Date.now().toString(36).slice(-3), name: v.name, code: v.code, color: v.color, price: AV.numRaw(v.price) || 0, qty: Number(v.qty) || 0 }));
    if (prod.variations.length) prod.qty = 0;
    if (prod.promo && !prod.oldprice) prod.oldprice = Math.round(prod.price * 1.2 * 10) / 10;
    if (isNew) S().products.unshift(prod); else S().products[S().products.findIndex((p) => p.id === id)] = prod;
    if (!AV.persist('products')) return;
    AV.log(isNew ? 'Produto criado' : 'Produto editado', prod.sku + ' ' + prod.name); AV.ui.draft = null; AV.toast('Produto salvo!'); AV.go('admin/produtos');
  };
  AV.afterAdmin = (r) => { if (r.parts[0] === 'admin' && r.parts[1] !== 'editar') { AV.ui.draft = null; } };
})();
