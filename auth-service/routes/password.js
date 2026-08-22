const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const { pool } = require('../config/database');

const SALT_ROUNDS = 10;

// Configura o transportador de e-mail (Mailtrap para desenvolvimento)
function createMailTransporter() {
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'sandbox.smtp.mailtrap.io',
    port: parseInt(process.env.MAIL_PORT) || 2525,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
}

// POST /forgot-password — Gera token e envia e-mail de recuperação
router.post('/forgot-password', async (req, res) => {
  const { email, resetBaseUrl } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Informe o e-mail.' });
  }

  try {
    // 1. Busca o usuário pelo e-mail
    const [rows] = await pool.query(
      'SELECT id, nome FROM usuarios WHERE email = ?',
      [email.trim().toLowerCase()]
    );

    // Responde com sucesso mesmo se o e-mail não existir (segurança: não revela se o e-mail está cadastrado)
    if (rows.length === 0) {
      return res.json({ message: 'Se o e-mail estiver cadastrado, você receberá um link de recuperação.' });
    }

    const usuario = rows[0];

    // 2. Gera token único e define expiração de 30 minutos
    const token = uuidv4();
    const agora = new Date();
    const expiraEm = new Date(agora.getTime() + 30 * 60 * 1000); // +30 minutos

    // 3. Salva o token no banco
    await pool.query(
      'INSERT INTO reset_tokens (token, usuario_id, criado_em, expira_em, usado) VALUES (?, ?, ?, ?, FALSE)',
      [token, usuario.id, agora, expiraEm]
    );

    // 4. Monta o link de redefinição (aponta para o catálogo, que é o ponto público)
    const baseUrl = resetBaseUrl || process.env.CATALOG_PUBLIC_URL || 'http://localhost:3000';
    const resetLink = `${baseUrl}/redefinir-senha/${token}`;

    // 5. Envia o e-mail
    const transporter = createMailTransporter();
    await transporter.sendMail({
      from: '"Catálogo Tom Hanks" <noreply@catalogo-tomhanks.com>',
      to: email.trim().toLowerCase(),
      subject: '🔑 Recuperação de Senha — Catálogo Tom Hanks',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; background: #1a1a2e; color: #eee; border-radius: 8px;">
          <h2 style="color: #e94560; text-align: center;">🎬 Catálogo Tom Hanks</h2>
          <p>Olá, <strong>${usuario.nome}</strong>!</p>
          <p>Recebemos uma solicitação para redefinir a sua senha. Clique no botão abaixo:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${resetLink}" style="background: #e94560; color: #fff; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
              Redefinir minha senha
            </a>
          </div>
          <p style="color: #aaa; font-size: 0.85rem;">⏳ Este link expira em <strong>30 minutos</strong>.</p>
          <p style="color: #aaa; font-size: 0.85rem;">Se você não solicitou essa redefinição, ignore este e-mail.</p>
          <hr style="border-color: #333;">
          <p style="color: #666; font-size: 0.75rem; text-align: center;">ISW055 — Professor @siriani</p>
        </div>
      `,
    });

    console.log(`[Auth] E-mail de recuperação enviado para ${email} — Token: ${token}`);

    return res.json({ message: 'Se o e-mail estiver cadastrado, você receberá um link de recuperação.' });
  } catch (err) {
    console.error('[Auth] Erro no forgot-password:', err);
    return res.status(500).json({ error: 'Erro interno ao processar a solicitação.' });
  }
});

// GET /reset-password/:token — Valida se o token existe, não expirou e não foi usado
router.get('/reset-password/:token', async (req, res) => {
  const { token } = req.params;

  try {
    const [rows] = await pool.query(
      'SELECT id, usuario_id, expira_em, usado FROM reset_tokens WHERE token = ?',
      [token]
    );

    if (rows.length === 0) {
      return res.status(404).json({ valid: false, error: 'Token não encontrado.' });
    }

    const resetToken = rows[0];

    if (resetToken.usado) {
      return res.status(410).json({ valid: false, error: 'Este link já foi utilizado. Solicite um novo.' });
    }

    if (new Date() > new Date(resetToken.expira_em)) {
      return res.status(410).json({ valid: false, error: 'Este link expirou. Solicite um novo.' });
    }

    return res.json({ valid: true, message: 'Token válido.' });
  } catch (err) {
    console.error('[Auth] Erro ao validar token:', err);
    return res.status(500).json({ valid: false, error: 'Erro interno.' });
  }
});

// POST /reset-password/:token — Redefine a senha se o token for válido
router.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { novaSenha } = req.body;

  if (!novaSenha || novaSenha.length < 6) {
    return res.status(400).json({ error: 'A nova senha precisa ter pelo menos 6 caracteres.' });
  }

  try {
    // 1. Busca e valida o token
    const [rows] = await pool.query(
      'SELECT id, usuario_id, expira_em, usado FROM reset_tokens WHERE token = ?',
      [token]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Token não encontrado.' });
    }

    const resetToken = rows[0];

    if (resetToken.usado) {
      return res.status(410).json({ error: 'Este link já foi utilizado. Solicite um novo.' });
    }

    if (new Date() > new Date(resetToken.expira_em)) {
      return res.status(410).json({ error: 'Este link expirou. Solicite um novo.' });
    }

    // 2. Troca a senha do usuário
    const novaSenhaHash = await bcrypt.hash(novaSenha, SALT_ROUNDS);
    await pool.query('UPDATE usuarios SET senha_hash = ? WHERE id = ?', [
      novaSenhaHash,
      resetToken.usuario_id,
    ]);

    // 3. Marca o token como usado (impede reutilização)
    await pool.query('UPDATE reset_tokens SET usado = TRUE WHERE id = ?', [resetToken.id]);

    console.log(`[Auth] Senha redefinida com sucesso para usuario_id=${resetToken.usuario_id}`);

    return res.json({ message: 'Senha redefinida com sucesso! Faça login com a nova senha.' });
  } catch (err) {
    console.error('[Auth] Erro ao redefinir senha:', err);
    return res.status(500).json({ error: 'Erro interno ao redefinir a senha.' });
  }
});

module.exports = router;
