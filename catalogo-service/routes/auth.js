const express = require('express');
const router = express.Router();
const axios = require('axios');

const AUTH_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:4000';

// GET /login
router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/filmes');
  res.render('login', {
    error: req.flash('error'),
    success: req.flash('success'),
  });
});

// GET /cadastro
router.get('/cadastro', (req, res) => {
  if (req.session.user) return res.redirect('/filmes');
  res.render('cadastro', {
    error: req.flash('error'),
  });
});

// POST /cadastro — repassa para o auth-service
router.post('/cadastro', async (req, res) => {
  const { nome, email, senha, confirmarSenha } = req.body;

  if (!nome || !email || !senha || !confirmarSenha) {
    req.flash('error', 'Preencha todos os campos.');
    return res.redirect('/cadastro');
  }

  if (senha !== confirmarSenha) {
    req.flash('error', 'As senhas não coincidem.');
    return res.redirect('/cadastro');
  }

  try {
    await axios.post(`${AUTH_URL}/register`, { nome, email, senha });
    req.flash('success', 'Conta criada com sucesso! Faça login.');
    return res.redirect('/login');
  } catch (err) {
    const msg = err.response?.data?.error || 'Erro ao criar conta. Tente novamente.';
    req.flash('error', msg);
    return res.redirect('/cadastro');
  }
});

// POST /login — repassa para o auth-service, salva JWT na sessão
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    req.flash('error', 'Preencha e-mail e senha.');
    return res.redirect('/login');
  }

  try {
    const response = await axios.post(`${AUTH_URL}/login`, { email, senha });
    const { token, user } = response.data;

    // Guarda o token JWT e os dados do usuário na sessão do Express
    req.session.token = token;
    req.session.user = user;

    return res.redirect('/filmes');
  } catch (err) {
    const msg = err.response?.data?.error || 'Erro ao fazer login. Tente novamente.';
    req.flash('error', msg);
    return res.redirect('/login');
  }
});

// GET /logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// GET /esqueci-senha
router.get('/esqueci-senha', (req, res) => {
  res.render('esqueci-senha', {
    error: req.flash('error'),
    success: req.flash('success'),
  });
});

// POST /esqueci-senha — repassa para o auth-service
router.post('/esqueci-senha', async (req, res) => {
  const { email } = req.body;

  try {
    const publicUrl = process.env.CATALOG_PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
    await axios.post(`${AUTH_URL}/forgot-password`, { email, resetBaseUrl: publicUrl });
    req.flash('success', 'Se o e-mail estiver cadastrado, você receberá um link de recuperação. Verifique sua caixa de entrada.');
    return res.redirect('/esqueci-senha');
  } catch (err) {
    req.flash('error', 'Erro ao processar sua solicitação. Tente novamente.');
    return res.redirect('/esqueci-senha');
  }
});

// GET /redefinir-senha/:token — valida o token no auth-service e exibe o formulário
router.get('/redefinir-senha/:token', async (req, res) => {
  const { token } = req.params;

  try {
    await axios.get(`${AUTH_URL}/reset-password/${token}`);
    // Token válido — exibe formulário de nova senha
    res.render('redefinir-senha', {
      token,
      error: req.flash('error'),
      success: req.flash('success'),
    });
  } catch (err) {
    const msg = err.response?.data?.error || 'Link inválido ou expirado.';
    res.render('redefinir-senha', {
      token: null,
      error: [msg],
      success: [],
    });
  }
});

// POST /redefinir-senha/:token — repassa a nova senha para o auth-service
router.post('/redefinir-senha/:token', async (req, res) => {
  const { token } = req.params;
  const { novaSenha, confirmarNovaSenha } = req.body;

  if (!novaSenha || !confirmarNovaSenha) {
    req.flash('error', 'Preencha todos os campos.');
    return res.redirect(`/redefinir-senha/${token}`);
  }

  if (novaSenha !== confirmarNovaSenha) {
    req.flash('error', 'As senhas não coincidem.');
    return res.redirect(`/redefinir-senha/${token}`);
  }

  try {
    await axios.post(`${AUTH_URL}/reset-password/${token}`, { novaSenha });
    req.flash('success', 'Senha redefinida com sucesso! Faça login com a nova senha.');
    return res.redirect('/login');
  } catch (err) {
    const msg = err.response?.data?.error || 'Erro ao redefinir a senha. O link pode ter expirado.';
    req.flash('error', msg);
    return res.redirect(`/redefinir-senha/${token}`);
  }
});

module.exports = router;
