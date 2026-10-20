/* Cosméticos Avenida — pagamento (Mercado Pago): PONTO EM ABERTO.
 *
 * Ainda NÃO há dados bancários/conta Mercado Pago. Por isso:
 *  - nenhuma cobrança é feita pelo site;
 *  - o pedido é salvo com pagamento "Aguardando pagamento";
 *  - a loja combina o pagamento com o cliente (WhatsApp) e marca "Pago" no painel.
 *
 * QUANDO A CONTA ESTIVER PRONTA:
 *  1. Crie um pequeno servidor (ex.: função serverless) que guarde o ACCESS TOKEN do Mercado Pago
 *     (NUNCA coloque o access token no navegador).
 *  2. Esse servidor cria a "preferência de pagamento" (Checkout Pro) e devolve a URL (init_point).
 *  3. Troque o corpo de AV.payment.start abaixo para chamar esse servidor e redirecionar o cliente.
 *  4. Configure o webhook do Mercado Pago para atualizar o status do pedido para "Pago · separar".
 */
(function () {
  'use strict';
  const AV = window.AV;
  AV.payment = {
    provider: 'Mercado Pago',
    // true somente quando a integração real existir
    enabled: false,
    // Chamado ao finalizar o pedido. Retorna o estado do pagamento.
    start: function (order) {
      // TODO(integração): fetch('/api/mercadopago/preference', {method:'POST', body: JSON.stringify(order)})
      //   .then(r => r.json()).then(d => { location.href = d.init_point; });
      return { ok: false, status: 'pending_setup', label: 'Aguardando pagamento' };
    },
    statusLabel: function () {
      const p = AV.S.settings.payment;
      return p.status === 'ativo' ? 'Mercado Pago ativo' : 'Mercado Pago — aguardando dados da conta';
    },
  };
})();
