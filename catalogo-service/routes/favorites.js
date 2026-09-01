const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { requireLogin } = require('../middleware/auth');

const LIMITE_FAVORITOS_USUARIO = 15;

// POST /favorito/adicionar
router.post('/favorito/adicionar', requireLogin, async (req, res) => {
  const { tmdb_movie_id, titulo, poster_path } = req.body;
  if (!tmdb_movie_id || !titulo) {
    req.flash('error', 'Dados inválidos.');
    return res.redirect('/filmes');
  }

  try {
    // ENFORCEMENT: usuário comum tem limite de 15 favoritos
    if (req.userRole !== 'admin') {
      const [countRows] = await pool.query(
        'SELECT COUNT(*) AS total FROM favoritos WHERE usuario_id = ?',
        [req.userId]
      );
      if (countRows[0].total >= LIMITE_FAVORITOS_USUARIO) {
        req.flash('error', `Você atingiu o limite de ${LIMITE_FAVORITOS_USUARIO} favoritos. Remova um antes de adicionar outro.`);
        return res.redirect(`/filme/${tmdb_movie_id}`);
      }
    }

    await pool.query(
      'INSERT IGNORE INTO favoritos (usuario_id, tmdb_movie_id, titulo, poster_path) VALUES (?, ?, ?, ?)',
      [req.userId, parseInt(tmdb_movie_id), titulo, poster_path || null]
    );
    req.flash('success', 'Filme favoritado!');
  } catch (err) {
    console.error('Erro ao favoritar:', err);
    req.flash('error', 'Erro ao favoritar o filme.');
  }
  return res.redirect(`/filme/${tmdb_movie_id}`);
});

// POST /favorito/remover
router.post('/favorito/remover', requireLogin, async (req, res) => {
  const { tmdb_movie_id } = req.body;
  try {
    await pool.query(
      'DELETE FROM favoritos WHERE usuario_id = ? AND tmdb_movie_id = ?',
      [req.userId, parseInt(tmdb_movie_id)]
    );
    req.flash('success', 'Filme removido dos favoritos.');
  } catch (err) {
    console.error('Erro ao remover favorito:', err);
    req.flash('error', 'Erro ao remover o favorito.');
  }
  return res.redirect(`/filme/${tmdb_movie_id}`);
});

// GET /favoritos
router.get('/favoritos', requireLogin, async (req, res) => {
  try {
    const [favoritos] = await pool.query(
      'SELECT id, tmdb_movie_id, titulo, poster_path, criado_em FROM favoritos WHERE usuario_id = ? ORDER BY criado_em DESC',
      [req.userId]
    );
    res.render('favoritos', {
      favoritos,
      user: req.session.user,
      userRole: req.userRole,
      totalFavoritos: favoritos.length,
      limiteFavoritos: LIMITE_FAVORITOS_USUARIO,
    });
  } catch (err) {
    console.error('Erro ao listar favoritos:', err);
    res.render('favoritos', {
      favoritos: [],
      user: req.session.user,
      userRole: req.userRole,
      totalFavoritos: 0,
      limiteFavoritos: LIMITE_FAVORITOS_USUARIO,
    });
  }
});

module.exports = router;
