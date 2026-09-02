const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const { pool } = require('../config/database');

const SALT_ROUNDS = 10;

// Configura o transportador de e-mail (Mailtrap para desenvolvimento)
function createMailTransporter() {
  const port = parseInt(process.env.MAIL_PORT) || 587;
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.gmail.com', // Padrão para Gmail, mas aceita SendGrid, Brevo, etc.
    port: port,
    secure: port === 465, // true para 465 (SSL), false para 587 (TLS)
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
    const senderEmail = process.env.MAIL_USER || 'noreply@catalogo-tomhanks.com';
    
    await transporter.sendMail({
      from: `"Catálogo Tom Hanks" <${senderEmail}>`,
      to: email.trim().toLowerCase(),
      subject: '🔑 Recuperação de Senha — Catálogo Tom Hanks',
      html: `
        <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px 20px; background: #09090b; color: #fafafa; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.05);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #f59e0b; margin: 0; font-size: 24px; letter-spacing: -0.5px;">🎬 Catálogo Tom Hanks</h2>
          </div>
          <div style="background: rgba(24, 24, 27, 0.8); padding: 30px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.08);">
            <p style="margin-top: 0; font-size: 16px;">Olá, <strong>${usuario.nome}</strong>!</p>
            <p style="color: #d4d4d8; line-height: 1.6;">Recebemos uma solicitação para redefinir a sua senha. Clique no botão abaixo para criar uma nova:</p>
            <div style="text-align: center; margin: 35px 0;">
              <a href="${resetLink}" style="background: #f59e0b; color: #000; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.25);">
                Redefinir minha senha
              </a>
            </div>
            <p style="color: #a1a1aa; font-size: 13px; margin-bottom: 5px;">⏳ Este link expira em <strong>30 minutos</strong>.</p>
            <p style="color: #71717a; font-size: 13px; margin: 0;">Se você não solicitou essa redefinição, ignore este e-mail.</p>
          </div>
          <div style="text-align: center; margin-top: 25px;">
            <p style="color: #52525b; font-size: 12px; margin: 0;">ISW055 — Professor @siriani</p>
          </div>
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
