# Prompt para colar no Claude Code

> **Como usar:** abra o Claude Code numa pasta vazia, cole **tudo abaixo da linha** e envie. Se você já tem a pasta `site-avenida` pronta, cole só o “Modo rápido”.

## Modo rápido (se a pasta site-avenida já existe)
```
Leia RELATORIO.md e a pasta site-avenida. Abra index.html num servidor local, teste a loja e o painel (todos os botões), corrija o que falhar e depois prepare a pasta para publicar no Netlify. Não mude o visual nem ligue o pagamento: o Mercado Pago continua em aberto.
```

---

## Prompt completo (cria o site do zero)

```
Você é um desenvolvedor sênior. Crie o site completo "Cosméticos Avenida" (loja de cosméticos em Governador Valadares - MG) em HTML + CSS + JavaScript puro (sem framework, sem build, abre com duplo clique em index.html). Eu sou leigo em TI: explique tudo em português simples. Antes de começar, me faça no máximo 3 perguntas só se algo for impossível de decidir; senão, decida e siga. No fim, teste tudo com Playwright (headless) e me entregue um relatório.

## Identidade visual
Cores: vinho #850037, berry #a70048, rosa #da015f, blush #fff0f5, fundo #fffafa, texto #2b1a22. Títulos em Georgia (serifa), corpo em Inter/system-ui. Cartões arredondados, sombras suaves, mobile-first. Slogan: "Tudo que você precisa em um só lugar". Use logo.png e hero.png da pasta assets (se não houver, crie um logotipo em texto).

## Estrutura de arquivos
index.html, css/styles.css, js/core.js, js/data.js, js/payment.js, js/shop.js, js/admin.js, js/admin2.js, js/app.js, manifest.json, sw.js, assets/.
Scripts clássicos (não módulos) para funcionar em file://. Um único objeto global AV com: AV.A (ações de clique), AV.F (envio de formulários), AV.I (eventos input/change), AV.V (telas da loja), AV.AD (abas do painel), AV.S (estado).
REGRA DE OURO: todo botão usa data-act="nome", todo formulário data-form="nome", todo campo reativo data-input/data-change="nome", com delegação de eventos em document. Escreva um teste que percorre a página e garante que NENHUM data-act/data-form/data-change fica sem função.
Roteamento por hash (#/, #/categoria/X, #/busca?q=, #/produto/id, #/carrinho, #/checkout, #/pedido/N, #/acompanhar, #/favoritos, #/politica/slug, #/nao-encontrei, #/conta, #/admin/aba).

## Armazenamento
IndexedDB (com cópia em memória, carregada antes de renderizar; fallback localStorage) para: products, categories, brands, cart, favs, orders, requests, campaigns, coupons, users, roles, audit, customers, settings, session. Funções AV.load/AV.save/AV.persist isoladas para trocar depois por um banco na nuvem.

## Catálogo: 100 produtos, ampliável sem limite
Gere 100 produtos de demonstração (determinísticos) em 6 categorias: Tintas para cabelo (20 tons com código, ex.: 1.0 Preto natural ... 10.0 Louro platinado), Tratamentos (18), Maquiagem (22; batons, bases, blush, paletas com VARIAÇÕES de cor/tom, cada uma com preço e estoque), Cuidados (16), Perfumes (12), Acessórios (12). Marcas fictícias (Avenida, Lumina, Bella Cor, Rosa Pura, Vitta, Encanto, Aurora, Dona Flor).
Campos: id, sku, name, brand, category, subcategory, shade, shadeCode, color, shape, price, oldprice, qty, minqty, active, featured, promo, isNew, sales, images[], variations[{id,name,code,color,price,qty}], desc, purpose, how, notes, warnings, createdAt.
Imagens: ilustrações SVG geradas por código (3 vistas por produto), usadas quando não há foto enviada.
Crescimento infinito: função makeProduct(i) que gera produtos novos para qualquer i; botão no painel "Gerar produtos de demonstração" (até 5000); importação CSV; cadastro manual. Listas paginadas ("Carregar mais", 24 por vez) e tabelas do painel com 25 por página.

## Loja (comprador)
- Cabeçalho fixo: logo, busca com sugestões ao digitar (produtos e categorias), favoritos, conta, carrinho com contador, menu de categorias (hambúrguer no celular).
- Início: banners/carrossel das campanhas ativas (respeitando datas e dispositivo desktop/celular), categorias, Novidades, Promoções, Sugestões, Top 10 mais vendidos numerados, Marcas, chamada "Não encontrei".
- Busca: sem acento/maiúsculas, com sinônimos (tinta/tintura→coloração, batom/labial, xampu→shampoo...), pontua por nome. Buscas sem resultado são registradas.
- Listagem: filtros (marca, preço mín/máx, tom/cor, só disponíveis), ordenação (relevância, menor, maior, novidades, nome), subcategorias em chips, vazio com botão "Não encontrei".
- Produto: galeria de 3 fotos, seletor de cor/tom que muda foto, preço e disponibilidade, quantidade (limitada ao estoque), adicionar, comprar agora, favoritar, compartilhar, consulta de CEP (350xx = Governador Valadares), acordeões (descrição, para que serve, como usar, observações, avisos), relacionados. A cliente NUNCA vê a quantidade em estoque: só "Disponível/Indisponível".
- Carrinho: toast de 3 segundos com link "Ver carrinho", +/−/remover, limpar, cupom (percentual, valor, frete grátis; mínimo, validade, limite de usos), barra de frete grátis.
- Checkout: sem conta obrigatória (conta opcional com cadastro/login/meus pedidos); nome, telefone, e-mail opcional; entrega em Governador Valadares (taxa fixa configurável, padrão R$ 8, frete grátis acima de R$ 70 — valores de exemplo editáveis) ou retirada; endereço obrigatório só na entrega; validações; resumo atualizado ao trocar entrega/retirada; baixa de estoque ao criar pedido; número AV-ANO-0001; página de confirmação com linha do tempo; página "Acompanhar pedido" (número + telefone).
- Outros: favoritos, formulário "Não encontrei" (máx. 200 caracteres), 5 políticas (trocas, cancelamento, privacidade, entrega, atendimento — texto provisório editável), botão flutuante de WhatsApp (liga/desliga e número em Configurações; sem número avisa que não foi configurado), botão no rodapé "Quem criou esse site?" abrindo https://wa.me/5533988295818, "Área da loja" no rodapé, PWA (manifest, service worker, ícones 192/512, botão instalar).

## PAGAMENTO: DEIXAR EM ABERTO (importante)
O pagamento será pelo Mercado Pago, mas AINDA NÃO TEMOS os dados da conta/banco. Portanto: NÃO peça cartão, NÃO peça dados bancários, NÃO simule cobrança. No checkout mostre um quadro claro "Mercado Pago — em breve; seu pedido ficará Aguardando pagamento e a loja chamará no WhatsApp". Pedido salvo com pagamento "Aguardando pagamento". Em js/payment.js crie AV.payment.start(order) retornando {status:'pending_setup'} com comentários explicando como integrar depois (servidor cria a preferência Checkout Pro; o access token NUNCA fica no navegador; webhook atualiza o status). Em Configurações, quadro "Mercado Pago — aguardando dados" com campos desabilitados.

## Painel da loja (14 menus, só com login)
Login por e-mail/senha (hash simples; avisar na tela e no relatório que isso é só demonstração e que segurança real exige servidor). Usuários padrão: admin@avenida.com/admin123, gerente@avenida.com/gerente123, funcionario@avenida.com/func123. Menu lateral mostra só o que o perfil pode ver; acesso direto por URL também é barrado ("Sem permissão").
1 Painel de controle: KPIs (pedidos hoje, aguardando pagamento, vendas confirmadas, produtos ativos, estoque baixo, sem estoque, "não encontrei" novos), gráfico de 7 dias, atalhos, últimos pedidos, alertas de estoque.
2 Pedidos e pagamentos: busca, filtro por status, detalhe em janela, status (Aguardando pagamento → Pago · separar → Em separação → Pronto para entrega → Saiu para entrega → Concluído / Cancelado), "Marcar como pago", cancelar devolve estoque (e reativar baixa de novo), histórico do pedido, WhatsApp do cliente, imprimir, exportar CSV.
3 Todos os produtos: busca, filtro categoria/situação, ativar/desativar, duplicar (cópia inativa), excluir com confirmação, seleção em massa (ativar, desativar, promoção, destaque, reajuste % de preço, trocar categoria, excluir, "selecionar todos os filtrados").
4 Adicionar/editar produto: todos os campos, subcategoria dependente da categoria, até 6 fotos (upload redimensionado para 640px JPEG ou link), variações com nome/código/cor/preço/estoque, pré-visualização, validações (nome, preço > 0, SKU único).
5 Importar planilha: baixar modelo CSV, exportar produtos, enviar CSV (separador ; ou ,), pré-visualização com erros por linha, atualiza por SKU ou cria, cria categorias/marcas automaticamente (opção), Google Planilhas por link CSV publicado (fetch), gerar produtos de demonstração.
6 Estoque e alertas: filtros baixo/zero/normal, ajuste +/−/digitado por produto e por variação, estoque mínimo, exportar alertas CSV, preferência de alerta por e-mail (envio automático fica como etapa futura).
7 Categorias e marcas: criar, renomear (propaga aos produtos), subcategorias, ativar/desativar (some da loja), excluir só se não estiver em uso.
8 Campanhas e banners: criar/editar/ativar/excluir, datas, desktop/celular, destino.
9 Cupons: CRUD, tipos percentual/valor/frete, mínimo, limite, validade.
10 Não encontrei: lista com situação, WhatsApp, "Criar produto" a partir do pedido, excluir, e ranking de buscas sem resultado.
11 Relatórios: período, faturamento, ticket médio, mais vendidos, vendas por categoria, pedidos por status, valor em estoque, exportar CSV.
12 Usuários e permissões: CRUD, perfis admin/gerente/funcionário, matriz de permissões editável (admin sempre tudo), não permitir excluir/desativar a si mesmo nem o último admin.
13 Histórico de alterações: toda ação relevante registra quem/quando/o quê; busca, exportar CSV, limpar (só admin).
14 Configurações: dados da loja, WhatsApp, entrega/retirada/frete grátis, e-mail de alerta, tamanho da página, textos das políticas, backup JSON (baixar/restaurar), apagar tudo e voltar ao demonstrativo.

## Qualidade
- Acessível (aria-label nos ícones, foco visível), responsivo (testar 390px e 1280px), sem erros no console.
- Escape de HTML em tudo que vem do usuário.
- Teste Playwright: compra completa, todos os menus do painel, CRUD, importação CSV com erro, 3000 produtos gerados (lista continua rápida), persistência após recarregar, perfil funcionário limitado, reset. Corrija tudo que falhar.
- Entregue: pasta pronta para arrastar no Netlify, RELATORIO.md em português simples (o que foi feito, como abrir, o que está em aberto) e a lista do que depende de mim: dados do Mercado Pago, número de WhatsApp/Instagram/endereço/horário da loja, taxa de entrega, textos das políticas, fotos reais.
```
