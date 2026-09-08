/**
 * audit.js — Helper para emitir eventos ao log-service
 * 
 * Uso: await auditLog(req, 'login', 'Login realizado com sucesso');
 * 
 * Fire-and-forget: nunca bloqueia a request principal se o log-service
 * estiver fora do ar (falha silenciosa com aviso no console).
 */

const axios = require('axios');

const LOG_SERVICE_URL = process.env.LOG_SERVICE_URL || 'http://log-service:5000';

/**
 * @param {Object} req - Objeto request do Express (para extrair userId, IP)
 * @param {string} acao - Identificador da ação (ex: 'login', 'favoritar_filme')
 * @param {string} [detalhes] - Descrição humana legível da ação
 * @param {number|string} [overrideUserId] - Substitui o userId da sessão (ex: para logar ID antes do login)
 */
async function auditLog(req, acao, detalhes = '', overrideUserId = null) {
  try {
    const usuario_id = overrideUserId || req.userId || req.session?.user?.userId || null;
    const usuario_nome = req.session?.user?.nome || req.auditNome || 'desconhecido';
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'sem-ip';

    // Fire-and-forget: não await completo para não bloquear a request
    axios.post(`${LOG_SERVICE_URL}/log`, {
      usuario_id,
      usuario_nome,
      acao,
      detalhes,
      ip,
    }, { timeout: 2000 }).catch(err => {
      // Falha silenciosa — log-service indisponível não derruba a aplicação principal
      console.warn(`[Auditoria] Falha ao registrar evento "${acao}": ${err.message}`);
    });
  } catch (err) {
    console.warn(`[Auditoria] Erro inesperado: ${err.message}`);
  }
}

module.exports = { auditLog };
