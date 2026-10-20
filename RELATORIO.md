# Relatório — Site Cosméticos Avenida (loja + painel)

## 1. O que foi entregue
Um site completo em **HTML + CSS + JavaScript puro** (sem instalar nada, sem framework), com:
- **Loja** para a cliente comprar (celular e computador);
- **Painel da loja** (14 menus) para a equipe cuidar de produtos, pedidos, estoque etc.;
- **100 produtos** de demonstração, e o catálogo pode crescer **sem limite** (testei com 3.100);
- **Pagamento Mercado Pago deixado em aberto** (sem dados bancários, sem cobrança), pronto para ligar depois.

Baseei tudo nos 3 materiais enviados: protótipo HTML (visual e comportamento), lista de funções (77 do comprador + 150 do painel) e a proposta visual em PDF (cores, menus, matriz de permissões).

## 2. Como abrir
1. Descompacte a pasta `site-avenida`.
2. Dê dois cliques em `index.html` (abre no navegador). Para publicar de verdade: arraste a pasta no Netlify.
3. Painel: rodapé → **Área da loja**. Acessos de demonstração (troque depois em *Usuários e permissões*):
   - Administrador: `admin@avenida.com` / `admin123`
   - Gerente: `gerente@avenida.com` / `gerente123`
   - Funcionário: `funcionario@avenida.com` / `func123`

## 3. Loja (comprador)
- Início com banners (desktop/celular), categorias, Novidades, Promoções, Sugestões, **Top 10 mais vendidos**, Marcas e botão “Não encontrei”.
- **Busca** com sugestões enquanto digita e sinônimos (ex.: “tinta” acha “coloração”, “batom” acha “labial”). Buscas sem resultado são registradas para a loja ver o que falta.
- **Filtros** (marca, preço, tom/cor, só disponíveis) e **ordenação** (relevância, menor/maior preço, novidades, nome). Lista com **“Carregar mais”** — rápida mesmo com milhares de itens.
- **Página do produto**: 3 fotos com miniaturas, escolha de cor/tom (muda foto, preço e disponibilidade), quantidade, comprar agora, favoritar, compartilhar, consulta de CEP/bairro, textos (descrição, para que serve, como usar, observações, avisos) e produtos relacionados. A cliente vê só “Disponível/Indisponível”, nunca o estoque.
- **Carrinho**: aviso de 3 segundos ao adicionar, +/−/remover, cupom, barra “faltam R$ X para frete grátis”.
- **Finalizar**: sem obrigação de criar conta (conta é opcional), entrega em Governador Valadares ou retirada, validações, resumo. Gera **número do pedido** (AV-2026-0001) e página de **acompanhamento** (número + telefone).
- Favoritos, conta opcional (cadastro/login/meus pedidos), 5 páginas de política (textos provisórios editáveis), botão flutuante de WhatsApp (liga/desliga), **“Quem criou esse site?”** (abre o WhatsApp 33 98829-5818), instalável como app (PWA com ícone, funciona offline para o “esqueleto”).

## 4. Painel da loja (14 menus)
Painel de controle · Pedidos e pagamentos (status, marcar pago, cancelar devolvendo estoque, imprimir, WhatsApp do cliente, CSV) · Todos os produtos (busca, filtros, ativar, duplicar, excluir, **ações em massa**) · Adicionar/editar (fotos por upload ou link, variações com preço e estoque, pré-visualização) · **Importar planilha CSV** (modelo, validação linha a linha, atualiza por SKU, cria categorias/marcas) + Google Planilhas por link publicado · Estoque e alertas · Categorias e marcas (criar, renomear, ativar, excluir com proteção) · Campanhas e banners · Cupons · Não encontrei · Relatórios · Usuários e **matriz de permissões** editável (admin/gerente/funcionário) · Histórico de alterações (quem fez o quê) · Configurações (dados, WhatsApp, entrega, políticas, backup/restauração, reset).

## 5. 100 produtos e crescimento infinito
- 100 produtos em 6 categorias: Tintas (20 tons com códigos), Tratamentos (18), Maquiagem (22, vários com cores/tons), Cuidados (16), Perfumes (12), Acessórios (12). As imagens são **ilustrações geradas pelo código** (por isso não pesam); fotos reais podem ser enviadas no painel.
- Como crescer: (a) cadastrar no painel; (b) importar planilha CSV (quantos quiser); (c) botão “Gerar produtos de demonstração” (até 5.000 por vez) para testar.
- Os dados ficam no **IndexedDB** do navegador (centenas de MB), com paginação e carregamento sob demanda.

## 6. Pagamento (Mercado Pago) — EM ABERTO, como pedido
- Nenhum dado de banco/cartão é pedido; **nenhuma cobrança** acontece.
- No checkout aparece um aviso claro; o pedido é salvo como **“Aguardando pagamento”**; a loja combina o pagamento no WhatsApp e marca **“Marcar como pago”** no painel.
- Em Configurações há um quadro “Mercado Pago — aguardando dados”. O arquivo `js/payment.js` explica, passo a passo, onde ligar a integração real quando a conta existir. (O *access token* nunca pode ficar no navegador — precisa de um pequeno servidor.)

## 7. Testes feitos (navegador automatizado)
Percorri compra completa (busca → produto com variação → carrinho → cupom → checkout → pedido), “Não encontrei”, conta, 5 políticas, botão do criador, WhatsApp, login (senha errada barrada), os 14 menus do painel (nenhum botão sem função), criar/editar/duplicar/excluir produto, upload de foto, variações, ações em massa, categorias, campanhas, cupons, estoque, usuários e permissões, configurações, backup, importação CSV (com erro detectado), geração de 3.000 produtos, recarregar a página (dados persistem), perfil de funcionário limitado, reset. Resultado: **tudo passou**; um bug encontrado (não voltava à lista ao salvar produto) foi corrigido.

## 8. O que ainda depende de você / limites honestos
| Item | Situação |
|---|---|
| Pagamento Mercado Pago | Aguardando dados da conta (placeholder pronto) |
| Número do WhatsApp da loja, Instagram, endereço, horário | Preencher em Configurações |
| Taxa de entrega (R$ 8) e frete grátis (R$ 70) | Valores de exemplo — decidir |
| Textos das políticas | Provisórios — revisar |
| Fotos reais dos produtos | Enviar no painel (hoje: ilustrações) |
| Segurança do painel | Funciona só no navegador (demonstração). **Qualquer pessoa com acesso técnico ao navegador pode burlar.** Para uso real é preciso servidor/banco de dados |
| Dados compartilhados | Pedidos/produtos ficam no navegador de cada aparelho; para a loja ver os pedidos das clientes em outro aparelho é preciso servidor (próxima etapa) |
| E-mails de alerta, Google Planilhas automático, notificações | Dependem de servidor (preferências já guardadas) |

**Próxima etapa recomendada:** ligar um banco de dados na nuvem (ex.: Supabase/Firebase). O código já isola o armazenamento em `core.js` (`AV.load/AV.save`), então a troca é localizada.

## 9. Mapa dos arquivos
`index.html` · `css/styles.css` · `js/core.js` (base, imagens, rotas, armazenamento) · `js/data.js` (100 produtos, padrões) · `js/shop.js` (loja) · `js/admin.js` e `js/admin2.js` (painel) · `js/payment.js` (Mercado Pago em aberto) · `js/app.js` · `manifest.json` + `sw.js` (app instalável) · `assets/` (logo, foto, ícones, caixas do protótipo).
