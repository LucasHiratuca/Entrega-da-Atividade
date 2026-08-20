const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { requireLogin } = require('../middleware/auth');

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
      [req.session.userId, parseInt(tmdb_movie_id), texto.trim()]
    );
    req.flash('success', 'Comentário adicionado!');
  } catch (err) {
    console.error('Erro ao comentar:', err);
    req.flash('error', 'Erro ao adicionar comentário.');
  }

  return res.redirect(`/filme/${tmdb_movie_id}`);
});

// POST /comentario/remover
router.post('/comentario/remover', requireLogin, async (req, res) => {
  const { comentario_id, tmdb_movie_id } = req.body;

  try {
    // Garante que só apaga comentário do próprio usuário
    await pool.query(
      'DELETE FROM comentarios WHERE id = ? AND usuario_id = ?',
      [parseInt(comentario_id), req.session.userId]
    );
    req.flash('success', 'Comentário removido.');
  } catch (err) {
    console.error('Erro ao remover comentário:', err);
    req.flash('error', 'Erro ao remover comentário.');
  }

  return res.redirect(`/filme/${tmdb_movie_id}`);
});

module.exports = router;
