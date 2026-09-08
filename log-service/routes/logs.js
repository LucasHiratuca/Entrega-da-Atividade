const express = require('express');
const router = express.Router();
const redis = require('../config/redis');
const jwt = require('jsonwebtoken');

const STREAM_KEY = 'audit:events';
const MAX_STREAM_LENGTH = 10000; // Limite máximo de eventos guardados no Redis

// ─── Middleware: verifica JWT e exige role admin ──────────────────────────────
function requireAdminJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido.' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem consultar os logs.' });
    }
    req.adminUser = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

// ─── POST /log — Recebe e grava um evento de auditoria ───────────────────────
// Chamado internamente pelos outros microsserviços (sem autenticação — rede interna)
router.post('/log', async (req, res) => {
  const { usuario_id, usuario_nome, acao, detalhes, ip } = req.body;

  if (!acao) {
    return res.status(400).json({ error: 'Campo "acao" é obrigatório.' });
  }

  try {
    // XADD — grava no Redis Stream com ID automático (timestamp + sequência)
    // MAXLEN ~ MAX_STREAM_LENGTH — descarta eventos antigos automaticamente
    await redis.xadd(
      STREAM_KEY,
      'MAXLEN', '~', MAX_STREAM_LENGTH,
      '*', // ID automático (timestamp)
      'usuario_id', String(usuario_id || 'anonimo'),
      'usuario_nome', String(usuario_nome || 'desconhecido'),
      'acao', String(acao),
      'detalhes', String(detalhes || ''),
      'ip', String(ip || 'sem-ip'),
      'timestamp', new Date().toISOString()
    );

    return res.status(201).json({ message: 'Evento registrado.' });
  } catch (err) {
    console.error('[Log-Service] Erro ao gravar evento:', err.message);
    return res.status(500).json({ error: 'Erro interno ao registrar evento.' });
  }
});

// ─── GET /logs — Lista os últimos N eventos (somente admin) ──────────────────
router.get('/logs', requireAdminJWT, async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 100, 500);
  const acao = req.query.acao || null; // filtro opcional por tipo de ação

  try {
    // XREVRANGE — lê do mais recente para o mais antigo
    const entries = await redis.xrevrange(STREAM_KEY, '+', '-', 'COUNT', limit * 3);

    // Converte o formato do Redis Stream (array de pares) para objetos legíveis
    const events = entries.map(([id, fields]) => {
      const obj = { stream_id: id };
      for (let i = 0; i < fields.length; i += 2) {
        obj[fields[i]] = fields[i + 1];
      }
      return obj;
    });

    // Aplica filtro por ação se fornecido
    const filtered = acao
      ? events.filter(e => e.acao && e.acao.toLowerCase().includes(acao.toLowerCase()))
      : events;

    return res.json({
      total: filtered.length,
      eventos: filtered.slice(0, limit),
    });
  } catch (err) {
    console.error('[Log-Service] Erro ao ler logs:', err.message);
    return res.status(500).json({ error: 'Erro interno ao consultar logs.' });
  }
});

// ─── GET /health — Health check ──────────────────────────────────────────────
router.get('/health', async (req, res) => {
  try {
    await redis.ping();
    return res.json({ status: 'ok', redis: 'connected' });
  } catch (err) {
    return res.status(503).json({ status: 'error', redis: 'disconnected' });
  }
});

module.exports = router;
