const express = require('express');
const router = express.Router();
const axios = require('axios');
const { requireAdmin } = require('../middleware/auth');

const AUTH_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:4000';

// GET /admin/usuarios — Painel de administração (lista todos os usuários)
router.get('/admin/usuarios', requireAdmin, async (req, res) => {
  try {
    const response = await axios.get(`${AUTH_URL}/users`, {
      headers: { Authorization: `Bearer ${req.session.token}` },
    });

    res.render('admin', {
      usuarios: response.data,
      user: req.session.user,
      error: req.flash('error'),
      success: req.flash('success'),
    });
  } catch (err) {
    const msg = err.response?.data?.error || 'Erro ao carregar painel de administração.';
    req.flash('error', msg);
    return res.redirect('/filmes');
  }
});

// POST /admin/usuarios/:id/role — Promover ou rebaixar um usuário
router.post('/admin/usuarios/:id/role', requireAdmin, async (req, res) => {
  const targetId = parseInt(req.params.id);
  const { role } = req.body;

  try {
    await axios.put(`${AUTH_URL}/users/${targetId}/role`, { role }, {
      headers: { Authorization: `Bearer ${req.session.token}` },
    });
    req.flash('success', `Papel do usuário alterado para "${role}" com sucesso.`);
  } catch (err) {
    const msg = err.response?.data?.error || 'Erro ao alterar papel do usuário.';
    req.flash('error', msg);
  }
  return res.redirect('/admin/usuarios');
});

// GET /admin/logs — Visualizar logs de auditoria
router.get('/admin/logs', requireAdmin, async (req, res) => {
  const limit = req.query.limit || 100;
  try {
    const LOG_SERVICE_URL = process.env.LOG_SERVICE_URL || 'http://log-service:5000';
    const response = await axios.get(`${LOG_SERVICE_URL}/logs?limit=${limit}`, {
      headers: { Authorization: `Bearer ${req.session.token}` }
    });

    res.render('admin-logs', {
      logs: response.data.eventos || [],
      totalLogs: response.data.total || 0,
      user: req.session.user,
      error: req.flash('error'),
      success: req.flash('success'),
    });
  } catch (err) {
    console.error('Erro ao buscar logs:', err.message);
    req.flash('error', 'Erro ao carregar logs de auditoria.');
    return res.redirect('/admin/usuarios');
  }
});

module.exports = router;
