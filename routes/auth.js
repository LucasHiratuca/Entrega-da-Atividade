const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { pool } = require('../config/database');

const SALT_ROUNDS = 10;

// GET /login
router.get('/login', (req, res) => {
  if (req.session.userId) return res.redirect('/filmes');
  res.render('login', {
    error: req.flash('error'),
    success: req.flash('success'),
  });
});

// GET /cadastro
router.get('/cadastro', (req, res) => {
  if (req.session.userId) return res.redirect('/filmes');
  res.render('cadastro', {
    error: req.flash('error'),
  });
});

// POST /cadastro
router.post('/cadastro', async (req, res) => {
  const { nome, email, senha, confirmarSenha } = req.body;

  if (!nome || !email || !senha || !confirmarSenha) {
    req.flash('error', 'Preencha todos os campos.');
    return res.redirect('/cadastro');
  }

  if (senha.length < 6) {
    req.flash('error', 'A senha precisa ter pelo menos 6 caracteres.');
    return res.redirect('/cadastro');
  }

  if (senha !== confirmarSenha) {
    req.flash('error', 'As senhas não coincidem.');
    return res.redirect('/cadastro');
  }

  try {
    const [existing] = await pool.query(
      'SELECT id FROM usuarios WHERE email = ?',
      [email]
    );
    if (existing.length > 0) {
      req.flash('error', 'Este e-mail já está cadastrado.');
      return res.redirect('/cadastro');
    }

    const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);
    await pool.query(
      'INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)',
      [nome.trim(), email.trim().toLowerCase(), senhaHash]
    );

    req.flash('success', 'Conta criada com sucesso! Faça login.');
    return res.redirect('/login');
  } catch (err) {
    console.error('Erro no cadastro:', err);
    req.flash('error', 'Erro interno. Tente novamente.');
    return res.redirect('/cadastro');
  }
});

// POST /login
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    req.flash('error', 'Preencha e-mail e senha.');
    return res.redirect('/login');
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, nome, senha_hash FROM usuarios WHERE email = ?',
      [email.trim().toLowerCase()]
    );

    if (rows.length === 0) {
      req.flash('error', 'E-mail ou senha inválidos.');
      return res.redirect('/login');
    }

    const usuario = rows[0];
    const senhaOk = await bcrypt.compare(senha, usuario.senha_hash);

    if (!senhaOk) {
      req.flash('error', 'E-mail ou senha inválidos.');
      return res.redirect('/login');
    }

    req.session.userId = usuario.id;
    req.session.userName = usuario.nome;
    return res.redirect('/filmes');
  } catch (err) {
    console.error('Erro no login:', err);
    req.flash('error', 'Erro interno. Tente novamente.');
    return res.redirect('/login');
  }
});

// GET /logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;
