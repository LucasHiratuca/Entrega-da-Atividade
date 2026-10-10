const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const { pool } = require('../config/database');
const { requireLogin } = require('../middleware/auth');
const { auditLog } = require('../utils/audit');

// Inicializa cliente Stripe se a chave secreta estiver configurada
function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  return new Stripe(secretKey);
}

// ─── GET /premium — Página informativa do Plano Premium ────────────────────────
router.get('/premium', requireLogin, async (req, res) => {
  try {
    const cancelado = req.query.cancelado === 'true';

    // Busca detalhes do usuário e status da assinatura no banco
    const [[usuario]] = await pool.query(
      'SELECT is_premium, stripe_customer_id, stripe_subscription_id FROM usuarios WHERE id = ?',
      [req.userId]
    );

    const [favRows] = await pool.query(
      'SELECT COUNT(*) AS total FROM favoritos WHERE usuario_id = ?',
      [req.userId]
    );

    res.render('premium', {
      user: req.session.user,
      userRole: req.userRole,
      isPremium: Boolean(usuario?.is_premium),
      totalFavoritos: favRows[0]?.total || 0,
      limiteGratuito: 15,
      stripeCustomerId: usuario?.stripe_customer_id,
      cancelado,
      error: req.flash('error'),
      success: req.flash('success'),
    });
  } catch (err) {
    console.error('[Premium] Erro ao carregar página de assinatura:', err);
    req.flash('error', 'Erro ao carregar informações do plano.');
    res.redirect('/filmes');
  }
});

// ─── POST /premium/checkout — Cria sessão de checkout hospedada no Stripe ──────
router.post('/premium/checkout', requireLogin, async (req, res) => {
  const stripe = getStripeClient();

  if (!stripe) {
    console.error('[Premium] STRIPE_SECRET_KEY não foi configurada nas variáveis de ambiente.');
    req.flash('error', 'Serviço de pagamento Stripe ainda não configurado no servidor (.env).');
    return res.redirect('/premium');
  }

  try {
    // Se o usuário já for premium, não precisa assinar novamente
    if (req.isPremium) {
      req.flash('success', 'Você já é um assinante Premium!');
      return res.redirect('/premium');
    }

    const publicUrl = process.env.CATALOG_PUBLIC_URL || `${req.protocol}://${req.get('host')}`;

    // Configuração da sessão do Stripe Checkout
    const sessionConfig = {
      payment_method_types: ['card'],
      mode: 'subscription',
      client_reference_id: String(req.userId),
      customer_email: req.session.user?.email || undefined,
      metadata: {
        userId: String(req.userId),
        userEmail: req.session.user?.email || '',
      },
      success_url: `${publicUrl}/premium/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${publicUrl}/premium?cancelado=true`,
    };

    // Permite usar um Price ID fixo do Stripe Dashboard OU cria price_data dinâmico em BRL
    if (process.env.STRIPE_PRICE_ID && process.env.STRIPE_PRICE_ID.trim()) {
      sessionConfig.line_items = [
        {
          price: process.env.STRIPE_PRICE_ID.trim(),
          quantity: 1,
        },
      ];
    } else {
      sessionConfig.line_items = [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: 'Plano Premium — Catálogo Tom Hanks',
              description: 'Favoritos ilimitados, badge de apoiador e destaque em comentários',
            },
            unit_amount: 990, // R$ 9,90
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ];
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    auditLog(
      req,
      'checkout_iniciado',
      `Iniciou Checkout Stripe (sessão: ${session.id}) para o usuário #${req.userId}`
    );

    // Redireciona para o formulário de pagamento seguro hospedado no Stripe
    return res.redirect(303, session.url);

  } catch (err) {
    console.error('[Premium] Erro ao criar Checkout Session do Stripe:', err);
    req.flash('error', `Erro ao iniciar checkout com o Stripe: ${err.message}`);
    return res.redirect('/premium');
  }
});

// ─── GET /premium/sucesso — Tela pós-checkout com confirmação ──────────────────
router.get('/premium/sucesso', requireLogin, async (req, res) => {
  const sessionId = req.query.session_id;
  const stripe = getStripeClient();

  try {
    // Se houver session_id e Stripe disponível, verifica e valida imediatamente
    if (sessionId && stripe) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (session && (session.status === 'complete' || session.payment_status === 'paid')) {
          const userId = parseInt(session.client_reference_id || session.metadata?.userId || req.userId);
          if (userId === req.userId) {
            await pool.query(
              'UPDATE usuarios SET is_premium = TRUE, stripe_customer_id = ?, stripe_subscription_id = ? WHERE id = ?',
              [session.customer || null, session.subscription || null, userId]
            );
            req.session.user.is_premium = true;
            req.isPremium = true;
          }
        }
      } catch (stripeErr) {
        console.warn('[Premium Sucesso] Não foi possível verificar sessão diretamente:', stripeErr.message);
      }
    }

    res.render('premium-sucesso', {
      user: req.session.user,
      userRole: req.userRole,
      isPremium: true,
      error: null,
      success: 'Pagamento confirmado com sucesso! Bem-vindo ao Plano Premium!',
    });
  } catch (err) {
    console.error('[Premium] Erro ao renderizar tela de sucesso:', err);
    res.redirect('/perfil/' + req.userId);
  }
});

// ─── WEBHOOK HANDLER — Notificações assíncronas do Stripe ──────────────────────
// ATENÇÃO: Esta função DEVE receber o corpo como RAW Buffer (express.raw)
async function webhookHandler(req, res) {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripe = getStripeClient();

  if (!stripe) {
    console.error('[Stripe Webhook] Stripe não inicializado (STRIPE_SECRET_KEY ausente).');
    return res.status(500).json({ error: 'Stripe não configurado no servidor.' });
  }

  let event;

  try {
    if (webhookSecret && webhookSecret.trim()) {
      // VALIDAÇÃO CRIPTOGRÁFICA DA ASSINATURA: Garante autenticidade da chamada
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret.trim());
    } else {
      console.warn('[Stripe Webhook] AVISO: STRIPE_WEBHOOK_SECRET não configurado. Parseando JSON diretamente (Apenas desenvolvimento).');
      event = JSON.parse(req.body.toString('utf8'));
    }
  } catch (err) {
    console.error(`[Stripe Webhook] Falha na verificação da assinatura: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`[Stripe Webhook] Evento recebido com sucesso: ${event.type} (ID: ${event.id})`);

  try {
    switch (event.type) {
      // 1. Checkout concluído com sucesso
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = parseInt(session.client_reference_id || session.metadata?.userId);
        const customerId = session.customer ? String(session.customer) : null;
        const subscriptionId = session.subscription ? String(session.subscription) : null;

        if (userId) {
          // Atualiza usuário no banco como PREMIUM e salva referências do Stripe (sem dados de cartão!)
          await pool.query(
            `UPDATE usuarios 
             SET is_premium = TRUE, 
                 stripe_customer_id = ?, 
                 stripe_subscription_id = ? 
             WHERE id = ?`,
            [customerId, subscriptionId, userId]
          );

          auditLog(
            {
              userId,
              userName: session.metadata?.userEmail || `Usuário #${userId}`,
              userRole: 'usuario',
              headers: req.headers,
              socket: req.socket,
            },
            'premium_ativado',
            `Assinatura Premium ativada via Stripe Checkout (Sessão: ${session.id}, Customer: ${customerId}, Sub: ${subscriptionId})`
          );

          console.log(`[Stripe Webhook] Usuário #${userId} promovido a PREMIUM com sucesso!`);
        } else {
          console.warn('[Stripe Webhook] checkout.session.completed recebido sem userId associado.');
        }
        break;
      }

      // 2. Fatura de assinatura paga com sucesso
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const customerId = invoice.customer;
        if (customerId) {
          await pool.query(
            'UPDATE usuarios SET is_premium = TRUE WHERE stripe_customer_id = ?',
            [String(customerId)]
          );
          console.log(`[Stripe Webhook] Fatura paga para customer ${customerId}. Premium mantido.`);
        }
        break;
      }

      // 3. Assinatura cancelada ou expirada
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const subscriptionId = subscription.id;
        if (subscriptionId) {
          await pool.query(
            'UPDATE usuarios SET is_premium = FALSE WHERE stripe_subscription_id = ?',
            [String(subscriptionId)]
          );
          console.log(`[Stripe Webhook] Assinatura ${subscriptionId} cancelada. Usuário retornou ao plano gratuito.`);
        }
        break;
      }

      default:
        console.log(`[Stripe Webhook] Evento ignorado: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('[Stripe Webhook] Erro ao processar evento:', err);
    return res.status(500).json({ error: 'Erro interno ao processar webhook.' });
  }
}

module.exports = {
  router,
  webhookHandler,
};
