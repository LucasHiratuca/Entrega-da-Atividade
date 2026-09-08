const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { requireLogin } = require('../middleware/auth');
const { auditLog } = require('../utils/audit');

// POST /comentario/adicionar
router.post('/comentario/adicionar', requireLogin, async (req, res) => {
  const { tmdb_movie_id, texto } = req.body;
  if (!tmdb_movie_id || !texto || !texto.trim()) {
    req.flash('error', 'O comentário não pode estar vazio.');
    return res.redirect(`/filme/${tmdb_movie_id}`);
  }
  try {
    await pool.query(
      'INSERT INTO comentarios (usuario_id, tmdb_movie_id, texto) VALUES (?, ?, ?)',
      [req.userId, parseInt(tmdb_movie_id), texto.trim()]
    );
    auditLog(req, 'comentar', `Comentou no filme ${tmdb_movie_id}: "${texto.trim().substring(0, 80)}"`);
    req.flash('success', 'Comentário adicionado!');
  } catch (err) {
    console.error('Erro ao comentar:', err);
    req.flash('error', 'Erro ao adicionar comentário.');
  }
  return res.redirect(`/filme/${tmdb_movie_id}`);
});

// POST /comentario/remover — RBAC: admin pode remover qualquer um, usuario só o próprio
router.post('/comentario/remover', requireLogin, async (req, res) => {
  const { comentario_id, tmdb_movie_id } = req.body;

  try {
    const [rows] = await pool.query(
      'SELECT id, usuario_id FROM comentarios WHERE id = ?',
      [parseInt(comentario_id)]
    );

    if (rows.length === 0) {
      req.flash('error', 'Comentário não encontrado.');
      return res.redirect(`/filme/${tmdb_movie_id}`);
    }

    const comentario = rows[0];

    // ENFORCEMENT REAL: usuario comum só pode excluir o próprio comentário
    if (req.userRole !== 'admin' && comentario.usuario_id !== req.userId) {
      auditLog(req, 'permissao_negada_403', `Tentou apagar comentário id=${comentario_id} de outro usuário (filme ${tmdb_movie_id})`);
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.status(403).json({ error: 'Você não tem permissão para excluir este comentário.' });
      }
      req.flash('error', 'Você não tem permissão para excluir este comentário.');
      return res.redirect(`/filme/${tmdb_movie_id}`);
    }

    await pool.query('DELETE FROM comentarios WHERE id = ?', [parseInt(comentario_id)]);

    if (req.userRole === 'admin' && comentario.usuario_id !== req.userId) {
      console.log(`[RBAC] Admin userId=${req.userId} removeu comentário id=${comentario_id} do usuario_id=${comentario.usuario_id}`);
      auditLog(req, 'moderacao_apagar_comentario', `Admin apagou comentário id=${comentario_id} do usuario_id=${comentario.usuario_id} (filme ${tmdb_movie_id})`);
    } else {
      auditLog(req, 'apagar_comentario', `Apagou próprio comentário id=${comentario_id} (filme ${tmdb_movie_id})`);
    }

    req.flash('success', 'Comentário removido.');
  } catch (err) {
    console.error('Erro ao remover comentário:', err);
    req.flash('error', 'Erro ao remover comentário.');
  }
  return res.redirect(`/filme/${tmdb_movie_id}`);
});

module.exports = router;
