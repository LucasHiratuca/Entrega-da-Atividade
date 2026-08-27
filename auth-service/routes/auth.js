const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const SALT_ROUNDS = 10;

// POST /register — Cadastro de novo usuário
router.post('/register', async (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ error: 'Preencha todos os campos.' });
  }

  if (senha.length < 6) {
    return res.status(400).json({ error: 'A senha precisa ter pelo menos 6 caracteres.' });
  }

  try {
    const [existing] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
    }

    const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);
    const [result] = await pool.query(
      'INSERT INTO usuarios (nome, email, senha_hash, role) VALUES (?, ?, ?, ?)',
      [nome.trim(), email.trim().toLowerCase(), senhaHash, 'usuario']
    );

    return res.status(201).json({
      message: 'Conta criada com sucesso!',
      userId: result.insertId,
    });
  } catch (err) {
    console.error('[Auth] Erro no cadastro:', err);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// POST /login — Autenticação e emissão de JWT
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: 'Preencha e-mail e senha.' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, nome, email, senha_hash, role FROM usuarios WHERE email = ?',
      [email.trim().toLowerCase()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }

    const usuario = rows[0];
    const senhaOk = await bcrypt.compare(senha, usuario.senha_hash);

    if (!senhaOk) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }

    // Gera o JWT com dados do usuário (nunca inclui a senha!)
    const token = jwt.sign(
      {
        userId: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      message: 'Login realizado com sucesso!',
      token,
      user: {
        userId: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
      },
    });

  } catch (err) {
    console.error('[Auth] Erro no login:', err);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// GET /validate — Valida um JWT e retorna os dados do usuário
router.get('/validate', async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido.' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    return res.json({
      valid: true,
      user: {
        userId: decoded.userId,
        nome: decoded.nome,
        email: decoded.email,
        role: decoded.role,
      },
    });
  } catch (err) {
    return res.status(401).json({ valid: false, error: 'Token inválido ou expirado.' });
  }
});

// GET /user/:id — Busca dados públicos de um usuário pelo ID
router.get('/user/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, nome, role FROM usuarios WHERE id = ?',
      [parseInt(req.params.id)]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error('[Auth] Erro ao buscar usuário:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

module.exports = router;
