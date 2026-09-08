const axios = require('axios');

const LOG_SERVICE_URL = process.env.LOG_SERVICE_URL || 'http://log-service:5000';

/**
 * Helper de auditoria para o auth-service
 * Fire-and-forget: nunca bloqueia a operação de auth se o log-service cair.
 */
async function auditLog({ usuario_id, usuario_nome = 'desconhecido', acao, detalhes = '', ip = 'sem-ip' }) {
  try {
    axios.post(`${LOG_SERVICE_URL}/log`, {
      usuario_id,
      usuario_nome,
      acao,
      detalhes,
      ip,
    }, { timeout: 2000 }).catch(err => {
      console.warn(`[Auth-Auditoria] Falha ao registrar evento "${acao}": ${err.message}`);
    });
  } catch (err) {
    console.warn(`[Auth-Auditoria] Erro inesperado: ${err.message}`);
  }
}

module.exports = { auditLog };
