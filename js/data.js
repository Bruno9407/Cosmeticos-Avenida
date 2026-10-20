/* Cosméticos Avenida — dados: catálogo (100 produtos, ampliável sem limite), configurações, estado */
(function () {
  'use strict';
  const AV = window.AV;
  const DATA_VERSION = 3;

  /* ---------- listas base ---------- */
  const BRANDS = ['Avenida', 'Lumina', 'Bella Cor', 'Rosa Pura', 'Vitta', 'Encanto', 'Aurora', 'Dona Flor'];
  const CATS = {
    'Tintas para cabelo': ['Coloração permanente', 'Coloração fantasia'],
    'Tratamentos': ['Hidratação', 'Reconstrução', 'Shampoo e condicionador', 'Finalizadores', 'Química'],
    'Maquiagem': ['Lábios', 'Rosto', 'Olhos', 'Sobrancelhas'],
    'Cuidados': ['Facial', 'Corporal', 'Proteção solar'],
    'Perfumes': ['Perfumes', 'Body splash', 'Colônias'],
    'Acessórios': ['Cabelo', 'Maquiagem', 'Coloração'],
  };
  const TINT = [['1.0', 'Preto natural', '#1a1415'], ['2.0', 'Preto azulado', '#1b1b2a'], ['3.0', 'Castanho escuro', '#3a2418'], ['4.0', 'Castanho médio', '#533320'], ['5.0', 'Castanho claro', '#6e4527'], ['5.7', 'Chocolate', '#5b3022'], ['6.0', 'Louro escuro', '#8a6236'], ['6.4', 'Cobre intenso', '#a55a2a'], ['6.66', 'Vermelho intenso', '#8e1b2b'], ['7.0', 'Louro médio', '#a98353'], ['7.1', 'Louro acinzentado', '#9a8a72'], ['7.3', 'Louro dourado', '#b8934e'], ['8.0', 'Louro claro', '#c4a36a'], ['8.1', 'Louro claro cinza', '#b2a58b'], ['9.0', 'Louro muito claro', '#d6bd88'], ['9.1', 'Louro pérola', '#cdc2a8'], ['10.0', 'Louro platinado', '#e6d9b5'], ['4.6', 'Acaju', '#5e1f25'], ['5.5', 'Mogno', '#6d2a2a'], ['66.46', 'Vermelho vibrante', '#b01832']];
  const VSET = {
    labio: [['Rosé', '#c97b84'], ['Vermelho', '#b01832'], ['Vinho', '#6d1034'], ['Nude', '#b98a78']],
    base: [['Claro 10', '#f0cfb2'], ['Médio 20', '#e0b48e'], ['Moreno 30', '#c18f66'], ['Escuro 40', '#8f5b3a']],
    blush: [['Pêssego', '#f0a58f'], ['Rosa', '#e88aa5'], ['Coral', '#ee7d6b']],
    olhos: [['Terrosos', '#8a5a44'], ['Rosados', '#d48a9b'], ['Neutros', '#b9a79a']],
  };
  // [categoria, subcategoria, nome, forma, preço, conjunto de variações, cor padrão, finalidade]
  const BASE = [];
  TINT.forEach((t) => BASE.push(['Tintas para cabelo', 'Coloração permanente', 'Coloração ' + t[1], 'box', 17.9, null, t[2], 'Cobertura de brancos e mudança de cor.', t]));
  [
    ['Hidratação', 'Máscara hidratação intensa', 'jar', 29.9, '#c05a86'], ['Reconstrução', 'Máscara reconstrução', 'jar', 34.9, '#8a3f5e'], ['Shampoo e condicionador', 'Shampoo nutrição', 'bottle', 19.9, '#d97fa0'],
    ['Shampoo e condicionador', 'Condicionador nutrição', 'bottle', 19.9, '#e39ab4'], ['Shampoo e condicionador', 'Shampoo matizador', 'bottle', 27.9, '#6c4a8f'], ['Reconstrução', 'Ampola reparadora', 'tube', 9.9, '#3f7f7a'],
    ['Finalizadores', 'Leave-in protetor térmico', 'bottle', 24.9, '#e0a14a'], ['Finalizadores', 'Óleo capilar reparador', 'bottle', 32.9, '#b8782f'], ['Finalizadores', 'Sérum pontas duplas', 'bottle', 21.9, '#9c6b8f'],
    ['Finalizadores', 'Creme para pentear cachos', 'jar', 26.9, '#d4668e'], ['Finalizadores', 'Gelatina definição', 'jar', 18.9, '#5aa0a8'], ['Finalizadores', 'Finalizador anti-frizz', 'bottle', 22.9, '#c9728f'],
    ['Reconstrução', 'Tônico fortalecedor', 'bottle', 28.9, '#4f8a5b'], ['Shampoo e condicionador', 'Shampoo anticaspa', 'bottle', 23.9, '#3e7cb1'], ['Finalizadores', 'Spray fixador', 'bottle', 17.9, '#7d7d86'],
    ['Química', 'Pó descolorante', 'jar', 14.9, '#6f78a8'], ['Química', 'Água oxigenada 20 volumes', 'bottle', 9.9, '#4a90b8'], ['Hidratação', 'Cauterização capilar', 'jar', 39.9, '#a83a62'],
  ].forEach((r) => BASE.push(['Tratamentos', r[0], r[1], r[2], r[3], null, r[4], 'Cuidado e manutenção dos fios.']));
  [
    ['Lábios', 'Batom matte', 'lipstick', 19.9, 'labio'], ['Lábios', 'Batom cremoso', 'lipstick', 17.9, 'labio'], ['Lábios', 'Gloss labial', 'tube', 14.9, 'labio'], ['Rosto', 'Base líquida', 'bottle', 39.9, 'base'],
    ['Rosto', 'Corretivo líquido', 'tube', 24.9, 'base'], ['Rosto', 'Pó compacto', 'jar', 29.9, 'base'], ['Rosto', 'Pó solto translúcido', 'jar', 27.9, null], ['Rosto', 'Blush compacto', 'jar', 22.9, 'blush'],
    ['Rosto', 'Iluminador facial', 'jar', 26.9, null], ['Olhos', 'Rímel à prova d\'água', 'tube', 24.9, null], ['Olhos', 'Rímel volume extremo', 'tube', 27.9, null], ['Olhos', 'Delineador líquido', 'tube', 18.9, null],
    ['Olhos', 'Lápis de olho preto', 'lipstick', 9.9, null], ['Olhos', 'Paleta de sombras', 'jar', 44.9, 'olhos'], ['Rosto', 'Primer facial', 'bottle', 34.9, null], ['Rosto', 'Fixador de maquiagem', 'bottle', 29.9, null],
    ['Sobrancelhas', 'Lápis de sobrancelha', 'lipstick', 12.9, null], ['Sobrancelhas', 'Gel de sobrancelha', 'tube', 16.9, null], ['Olhos', 'Máscara de cílios curvatura', 'tube', 25.9, null], ['Lábios', 'Lip tint', 'tube', 15.9, 'labio'],
    ['Rosto', 'Contorno em bastão', 'lipstick', 23.9, null], ['Rosto', 'Removedor de maquiagem bifásico', 'bottle', 21.9, null],
  ].forEach((r) => BASE.push(['Maquiagem', r[0], r[1], r[2], r[3], r[4], '#c0527a', 'Maquiagem para o dia a dia.']));
  [
    ['Facial', 'Hidratante facial', 'jar', 29.9], ['Corporal', 'Hidratante corporal', 'bottle', 24.9], ['Proteção solar', 'Protetor solar facial FPS 50', 'tube', 39.9], ['Proteção solar', 'Protetor solar corporal FPS 30', 'bottle', 34.9],
    ['Facial', 'Sabonete facial', 'bottle', 19.9], ['Facial', 'Esfoliante facial', 'tube', 21.9], ['Corporal', 'Creme para as mãos', 'tube', 12.9], ['Facial', 'Água micelar', 'bottle', 26.9],
    ['Facial', 'Sérum vitamina C', 'bottle', 49.9], ['Facial', 'Creme anti-idade', 'jar', 54.9], ['Facial', 'Máscara facial de argila', 'jar', 18.9], ['Corporal', 'Gel pós-sol', 'tube', 22.9],
    ['Facial', 'Hidratante labial', 'tube', 9.9], ['Corporal', 'Óleo corporal', 'bottle', 31.9], ['Corporal', 'Desodorante em creme', 'jar', 17.9], ['Facial', 'Bruma facial', 'bottle', 23.9],
  ].forEach((r) => BASE.push(['Cuidados', r[0], r[1], r[2], r[3], null, '#4f9a8f', 'Cuidado diário com a pele.']));
  [
    ['Perfumes', 'Eau de parfum floral', 'perfume', 89.9, '#d27aa0'], ['Colônias', 'Colônia fresca', 'perfume', 59.9, '#6bb3c9'], ['Body splash', 'Body splash baunilha', 'bottle', 34.9, '#d9b46a'], ['Body splash', 'Body splash frutas vermelhas', 'bottle', 34.9, '#c0304f'],
    ['Perfumes', 'Perfume amadeirado', 'perfume', 99.9, '#7a5238'], ['Perfumes', 'Perfume cítrico', 'perfume', 79.9, '#d8b93a'], ['Perfumes', 'Perfume doce gourmand', 'perfume', 94.9, '#b5653a'], ['Perfumes', 'Mini perfume de bolsa', 'perfume', 29.9, '#9a6bb0'],
    ['Colônias', 'Colônia infantil suave', 'perfume', 39.9, '#7fc4a8'], ['Perfumes', 'Perfume unissex', 'perfume', 84.9, '#4a6a86'], ['Colônias', 'Desodorante colônia', 'perfume', 44.9, '#5a8fb0'], ['Perfumes', 'Perfume feminino noturno', 'perfume', 109.9, '#5a1a3e'],
  ].forEach((r) => BASE.push(['Perfumes', r[0], r[1], r[2], r[3], null, r[4], 'Fragrância para qualquer ocasião.']));
  [
    ['Cabelo', 'Escova cerâmica', 'brush', 39.9], ['Cabelo', 'Escova raquete', 'brush', 24.9], ['Cabelo', 'Pente fino', 'brush', 7.9], ['Cabelo', 'Pente garfo', 'brush', 8.9], ['Cabelo', 'Kit presilhas tic-tac', 'brush', 9.9],
    ['Cabelo', 'Touca de cetim', 'brush', 19.9], ['Maquiagem', 'Pincel de base', 'brush', 16.9], ['Maquiagem', 'Pincel de pó', 'brush', 18.9], ['Maquiagem', 'Kit esponjas de maquiagem', 'brush', 14.9],
    ['Coloração', 'Tigela para tintura', 'brush', 6.9], ['Coloração', 'Pincel aplicador de tintura', 'brush', 5.9], ['Coloração', 'Kit luvas descartáveis', 'brush', 8.9],
  ].forEach((r) => BASE.push(['Acessórios', r[0], r[1], r[2], r[3], null, '#850037', 'Acessório de uso diário.']));
  AV.BASE_COUNT = BASE.length; // 100

  const LINES = ['Premium', 'Pro', 'Classic', 'Plus', 'Max', 'Soft', 'Intense', 'Glow'];
  const DESCS = {
    'Tintas para cabelo': ['Coloração permanente com cobertura total dos fios brancos e brilho intenso.', 'Misture com o oxidante e aplique nos fios secos. Deixe agir por 30 a 40 minutos e enxágue.', 'Faça o teste de mecha 48 horas antes. Mantenha fora do alcance de crianças.'],
    'Tratamentos': ['Fórmula desenvolvida para devolver maciez, brilho e resistência aos fios.', 'Aplique nos cabelos úmidos, massageie e deixe agir. Enxágue bem.', 'Uso externo. Evite contato com os olhos.'],
    'Maquiagem': ['Acabamento uniforme, alta pigmentação e longa duração.', 'Aplique sobre a pele limpa e hidratada. Retire com demaquilante.', 'Suspenda o uso em caso de irritação.'],
    'Cuidados': ['Cuidado diário que mantém a pele hidratada, macia e protegida.', 'Aplique sobre a pele limpa, com movimentos suaves.', 'Uso externo. Se houver irritação, interrompa o uso.'],
    'Perfumes': ['Fragrância envolvente com excelente fixação.', 'Borrife a 15 cm da pele nos pontos de pulsação.', 'Inflamável. Mantenha longe do calor e dos olhos.'],
    'Acessórios': ['Acessório prático e durável para o seu dia a dia.', 'Use conforme a necessidade e higienize após o uso.', 'Mantenha em local seco.'],
  };

  /* Gera o produto de índice i. Para i >= 100 cria variações novas (marca/linha), sem limite. */
  AV.makeProduct = (i) => {
    const b = BASE[i % BASE.length];
    const cycle = Math.floor(i / BASE.length);
    const r = AV.rng(i * 7919 + 13);
    const cat = b[0];
    const brand = cat === 'Tintas para cabelo' && cycle === 0 ? 'Avenida' : BRANDS[(i + cycle * 3 + Math.floor(r() * 3)) % BRANDS.length];
    let name = b[2];
    if (cycle > 0) name += ' ' + LINES[cycle % LINES.length] + (cycle >= LINES.length ? ' ' + cycle : '');
    const price = Math.round((b[4] * (1 + (r() * 0.18 - 0.04))) * 10) / 10 + (r() > 0.5 ? 0 : -0.1);
    const roll = r();
    const qty = roll < 0.06 ? 0 : roll < 0.18 ? Math.floor(r() * 4) + 1 : Math.floor(r() * 55) + 6;
    const promo = r() < 0.2;
    const p = {
      id: 'p' + AV.pad(i + 1, 4), sku: 'AV-' + AV.pad(i + 1, 4), name, brand, category: cat, subcategory: b[1], shade: '', shadeCode: '',
      color: b[6], shape: b[3], price: Math.max(2.9, Math.round(price * 10) / 10), oldprice: 0, qty, minqty: 5, active: true,
      featured: r() < 0.16, promo, isNew: r() < 0.16, sales: Math.floor(r() * 180), images: [], variations: [],
      desc: DESCS[cat][0], purpose: b[7], how: DESCS[cat][1], notes: 'Produto ilustrativo no protótipo. Consulte a embalagem.', warnings: DESCS[cat][2], createdAt: Date.now() - Math.floor(r() * 90) * 86400000,
    };
    if (b[8]) { p.shadeCode = b[8][0]; p.shade = b[8][1]; p.name = 'Coloração ' + b[8][1] + ' ' + b[8][0]; if (cycle > 0) p.name += ' ' + LINES[cycle % LINES.length]; p.subcategory = b[1]; }
    if (promo) p.oldprice = Math.round(p.price * (1.15 + r() * 0.2) * 10) / 10;
    if (b[5] && VSET[b[5]]) {
      p.variations = VSET[b[5]].map((v, k) => ({ id: p.id + 'v' + (k + 1), name: v[0], code: '', color: v[1], price: Math.round((p.price + (k > 2 ? 2 : 0)) * 10) / 10, qty: roll < 0.06 ? 0 : Math.floor(r() * 25) + (k === 3 ? 0 : 3) }));
      p.qty = 0;
    }
    return p;
  };
  AV.genCatalog = (n, start) => { const a = []; for (let i = start || 0; i < (start || 0) + n; i++) a.push(AV.makeProduct(i)); return a; };

  /* ---------- padrões ---------- */
  AV.defaultPolicies = () => ({
    trocas: ['Trocas e devoluções', 'Texto provisório — a loja deve revisar.\n\nVocê pode solicitar a troca em até 7 dias após o recebimento, com o produto lacrado e a nota/comprovante. Produtos de uso pessoal já abertos não podem ser trocados, salvo defeito de fabricação.'],
    cancelamento: ['Cancelamento de pedido', 'Texto provisório — a loja deve revisar.\n\nO pedido pode ser cancelado enquanto estiver em "Aguardando pagamento" ou "Em separação". Fale com a loja pelo WhatsApp informando o número do pedido.'],
    privacidade: ['Política de privacidade', 'Texto provisório — a loja deve revisar.\n\nUsamos seus dados (nome, telefone, endereço) apenas para processar e entregar o seu pedido. Não vendemos seus dados a terceiros. Você pode pedir a exclusão dos seus dados a qualquer momento.'],
    entrega: ['Entrega e retirada', 'Texto provisório — a loja deve revisar.\n\nEntregamos em Governador Valadares (MG). Também é possível retirar o pedido na loja. Valor da entrega e regra de frete grátis definidos nas configurações da loja.'],
    atendimento: ['Atendimento', 'Texto provisório — a loja deve revisar.\n\nFale com a gente pelo WhatsApp ou pelo Instagram. Informe o número do pedido para agilizar.'],
  });
  AV.defaultSettings = () => ({
    storeName: 'Cosméticos Avenida', slogan: 'Tudo que você precisa em um só lugar', city: 'Governador Valadares', state: 'MG',
    whatsappFloat: true, whatsapp: '', instagram: '', address: '', hours: '', email: '',
    deliveryFee: 8, freeShipEnabled: true, freeShipMin: 70, pickupEnabled: true, deliveryEnabled: true,
    lowStockEmail: '', alertsEmail: false,
    payment: { provider: 'Mercado Pago', status: 'aguardando_dados', publicKey: '', note: 'Aguardando dados da conta bancária/Mercado Pago. Nenhuma cobrança é feita no site por enquanto.' },
    sheetsUrl: '', policies: AV.defaultPolicies(), pageSize: 24, orderSeq: 0,
  });
  AV.PERMS_ALL = ['painel', 'pedidos', 'produtos', 'editar', 'importar', 'estoque', 'categorias', 'campanhas', 'cupons', 'naoencontrei', 'relatorios', 'usuarios', 'historico', 'config'];
  AV.PERM_LABEL = { painel: 'Painel de controle', pedidos: 'Pedidos e pagamentos', produtos: 'Todos os produtos', editar: 'Adicionar / editar produto', importar: 'Importar planilha', estoque: 'Estoque e alertas', categorias: 'Categorias e marcas', campanhas: 'Campanhas e banners', cupons: 'Cupons', naoencontrei: 'Não encontrei', relatorios: 'Relatórios', usuarios: 'Usuários e permissões', historico: 'Histórico de alterações', config: 'Configurações' };
  AV.defaultRoles = () => ({
    admin: AV.PERMS_ALL.slice(),
    gerente: ['painel', 'pedidos', 'produtos', 'editar', 'importar', 'estoque', 'categorias', 'campanhas', 'cupons', 'naoencontrei', 'relatorios', 'historico'],
    funcionario: ['painel', 'pedidos', 'produtos', 'estoque', 'naoencontrei'],
  });
  AV.simpleHash = (s) => 'h' + AV.hash('avenida::' + s).toString(36);
  AV.defaultUsers = () => ([
    { id: 'u1', name: 'Administrador', email: 'admin@avenida.com', pass: AV.simpleHash('admin123'), role: 'admin', active: true },
    { id: 'u2', name: 'Gerente (exemplo)', email: 'gerente@avenida.com', pass: AV.simpleHash('gerente123'), role: 'gerente', active: true },
    { id: 'u3', name: 'Funcionária (exemplo)', email: 'funcionario@avenida.com', pass: AV.simpleHash('func123'), role: 'funcionario', active: true },
  ]);
  AV.defaultCampaigns = () => ([
    { id: 'c1', title: 'Tudo que você precisa em um só lugar', subtitle: 'Cores, tratamentos e maquiagem com entrega em Governador Valadares.', cta: 'Ver novidades', link: 'novidades', device: 'all', active: true, start: '', end: '', color: '#850037' },
    { id: 'c2', title: 'Promoções da semana', subtitle: 'Ofertas selecionadas com preço especial.', cta: 'Ver promoções', link: 'promocoes', device: 'all', active: true, start: '', end: '', color: '#a70048' },
    { id: 'c3', title: 'Frete grátis acima de R$ 70', subtitle: 'Regra de exemplo — a loja ainda vai decidir.', cta: 'Comprar agora', link: 'categoria/Tintas para cabelo', device: 'mobile', active: true, start: '', end: '', color: '#da015f' },
  ]);
  AV.defaultCoupons = () => ([
    { id: 'k1', code: 'BEMVINDA10', type: 'percent', value: 10, min: 30, active: true, uses: 0, max: 0, expires: '' },
    { id: 'k2', code: 'FRETEGRATIS', type: 'frete', value: 0, min: 40, active: true, uses: 0, max: 0, expires: '' },
  ]);
  AV.synonyms = { tinta: 'coloracao', tintura: 'coloracao', pintar: 'coloracao', colorir: 'coloracao', batom: 'batom', labial: 'batom', gloss: 'gloss', hidratante: 'hidrat', creme: 'creme', xampu: 'shampoo', perfume: 'perfume', colonia: 'colonia', cilios: 'rimel', mascara: 'mascara', escova: 'escova', sombra: 'sombra', protetor: 'protetor', solar: 'solar', loiro: 'louro', preto: 'preto', vermelho: 'vermelho', ruivo: 'cobre' };

  /* ---------- estado ---------- */
  AV.initState = () => {
    const S = AV.S;
    const ver = AV.load('dataver', 0);
    if (ver !== DATA_VERSION) {
      // dados de versões antigas do protótipo: recomeça o catálogo mantendo nada antigo
      ['products', 'categories', 'brands'].forEach((k) => AV.removeKey(k));
      AV.save('dataver', DATA_VERSION);
    }
    S.products = AV.load('products', null);
    if (!S.products || !S.products.length) { S.products = AV.genCatalog(AV.BASE_COUNT, 0); AV.save('products', S.products); }
    S.categories = AV.load('categories', null);
    if (!S.categories) { S.categories = Object.keys(CATS).map((n) => ({ name: n, subs: CATS[n].slice(), active: true })); AV.save('categories', S.categories); }
    S.brands = AV.load('brands', null);
    if (!S.brands) { S.brands = BRANDS.map((n) => ({ name: n, active: true })); AV.save('brands', S.brands); }
    S.cart = AV.load('cart', []);
    S.favs = AV.load('favs', []);
    S.orders = AV.load('orders', []);
    S.requests = AV.load('requests', []);
    S.campaigns = AV.load('campaigns', null) || AV.defaultCampaigns();
    S.coupons = AV.load('coupons', null) || AV.defaultCoupons();
    S.users = AV.load('users', null) || AV.defaultUsers();
    S.roles = AV.load('roles', null) || AV.defaultRoles();
    S.audit = AV.load('audit', []);
    S.customers = AV.load('customers', []);
    S.zeroSearches = AV.load('zeroSearches', []);
    const def = AV.defaultSettings(); const cur = AV.load('settings', {});
    S.settings = Object.assign({}, def, cur, { payment: Object.assign({}, def.payment, cur.payment || {}), policies: Object.assign({}, def.policies, cur.policies || {}) });
    S.session = AV.load('session', null);
    S.customer = AV.load('customer', null);
    S.coupon = null;
    ['campaigns', 'coupons', 'users', 'roles', 'settings'].forEach((k) => AV.save(k, S[k]));
  };
  AV.resetAll = () => AV.clearAll().then(() => { location.hash = '#/'; location.reload(); });

  /* ---------- consultas ---------- */
  AV.stock = (p) => (p.variations && p.variations.length ? p.variations.reduce((s, v) => s + (Number(v.qty) || 0), 0) : Number(p.qty) || 0);
  AV.product = (id) => AV.S.products.find((p) => p.id === id);
  AV.variation = (p, vid) => (p.variations || []).find((v) => v.id === vid);
  AV.priceOf = (p, v) => (v && v.price ? Number(v.price) : Number(p.price));
  AV.available = (p, v) => (v ? Number(v.qty) > 0 : AV.stock(p) > 0);
  AV.visible = (p) => p.active && (AV.S.categories.find((c) => c.name === p.category) || { active: true }).active !== false && (AV.S.brands.find((b) => b.name === p.brand) || { active: true }).active !== false;
  AV.catalog = () => AV.S.products.filter(AV.visible);
  AV.stockState = (p) => { const q = AV.stock(p); return q <= 0 ? 'zero' : q <= (Number(p.minqty) || 0) ? 'low' : 'ok'; };
  AV.nextProductId = () => { let m = 0; AV.S.products.forEach((p) => { const n = parseInt(String(p.id).replace(/\D/g, ''), 10); if (n > m) m = n; }); return 'p' + AV.pad(m + 1, 4); };

  /* ---------- histórico e permissões ---------- */
  AV.currentUser = () => (AV.S.session ? AV.S.users.find((u) => u.id === AV.S.session.id && u.active) : null);
  AV.can = (perm) => { const u = AV.currentUser(); return !!u && (AV.S.roles[u.role] || []).includes(perm); };
  AV.log = (action, detail) => {
    const u = AV.currentUser();
    AV.S.audit.unshift({ id: AV.uid('a'), at: Date.now(), user: u ? u.name : 'Cliente/Sistema', role: u ? u.role : '-', action, detail: detail || '' });
    if (AV.S.audit.length > 1500) AV.S.audit.length = 1500;
    AV.save('audit', AV.S.audit);
  };
})();
