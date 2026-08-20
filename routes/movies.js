const express = require('express');
const router = express.Router();
const axios = require('axios');
const { pool } = require('../config/database');
const { requireLogin } = require('../middleware/auth');

const TMDB_BASE = 'https://api.themoviedb.org/3';

// GET /filmes — lista filmes do Tom Hanks via TMDB
router.get('/filmes', requireLogin, async (req, res) => {
  try {
    // 1. Buscar o person_id do Tom Hanks
    const searchRes = await axios.get(`${TMDB_BASE}/search/person`, {
      params: {
        api_key: process.env.TMDB_API_KEY,
        query: 'Tom Hanks',
        language: 'pt-BR',
      },
    });

    const person = searchRes.data.results && searchRes.data.results[0];
    if (!person) {
      return res.render('filmes', {
        filmes: [],
        userName: req.session.userName,
        favoritosIds: [],
        error: 'Não foi possível encontrar Tom Hanks na TMDB.',
      });
    }

    // 2. Buscar os créditos de filmes
    const creditsRes = await axios.get(
      `${TMDB_BASE}/person/${person.id}/movie_credits`,
      {
        params: {
          api_key: process.env.TMDB_API_KEY,
          language: 'pt-BR',
        },
      }
    );

    // Combinar cast e crew, remover duplicatas, ordenar por popularidade
    const allMovies = [...(creditsRes.data.cast || [])];
    const seen = new Set(allMovies.map((m) => m.id));
    for (const m of creditsRes.data.crew || []) {
      if (!seen.has(m.id)) {
        seen.add(m.id);
        allMovies.push(m);
      }
    }
    const filmes = allMovies
      .filter((m) => m.poster_path && m.title)
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

    // 3. Buscar IDs dos filmes que o usuário logado já favoritou
    const [favRows] = await pool.query(
      'SELECT tmdb_movie_id FROM favoritos WHERE usuario_id = ?',
      [req.session.userId]
    );
    const favoritosIds = favRows.map((r) => r.tmdb_movie_id);

    res.render('filmes', {
      filmes,
      userName: req.session.userName,
      favoritosIds,
      error: null,
    });
  } catch (err) {
    console.error('Erro ao buscar filmes:', err.message);
    res.render('filmes', {
      filmes: [],
      userName: req.session.userName,
      favoritosIds: [],
      error: 'Erro ao buscar filmes da TMDB. Tente novamente.',
    });
  }
});

// GET /filme/:id — detalhes de um filme
router.get('/filme/:id', requireLogin, async (req, res) => {
  const tmdbId = parseInt(req.params.id);

  try {
    // Buscar detalhes do filme na TMDB
    const movieRes = await axios.get(`${TMDB_BASE}/movie/${tmdbId}`, {
      params: {
        api_key: process.env.TMDB_API_KEY,
        language: 'pt-BR',
      },
    });
    const filme = movieRes.data;

    // Verificar se é favorito do usuário logado
    const [favRows] = await pool.query(
      'SELECT id FROM favoritos WHERE usuario_id = ? AND tmdb_movie_id = ?',
      [req.session.userId, tmdbId]
    );
    const isFavorito = favRows.length > 0;

    // Buscar comentários do usuário logado para este filme
    const [comentarios] = await pool.query(
      'SELECT id, texto, criado_em FROM comentarios WHERE usuario_id = ? AND tmdb_movie_id = ? ORDER BY criado_em DESC',
      [req.session.userId, tmdbId]
    );

    res.render('filme', {
      filme,
      isFavorito,
      comentarios,
      userName: req.session.userName,
      error: req.flash('error'),
      success: req.flash('success'),
    });
  } catch (err) {
    console.error('Erro ao buscar filme:', err.message);
    req.flash('error', 'Erro ao buscar detalhes do filme.');
    return res.redirect('/filmes');
  }
});

module.exports = router;
