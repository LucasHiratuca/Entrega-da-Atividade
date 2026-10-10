const express = require('express');
const router = express.Router();
const multer = require('multer');
const { pool } = require('../config/database');
const { requireLogin } = require('../middleware/auth');
const { auditLog } = require('../utils/audit');
const { s3Client, BUCKET } = require('../utils/s3');
const { randomUUID } = require('crypto');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo
});

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// GET /perfil/:userId — Visualizar perfil
router.get('/perfil/:userId', requireLogin, async (req, res) => {
  const userId = parseInt(req.params.userId);
  try {
    // Garante que o perfil existe no banco (cria vazio se necessário)
    await pool.query(
      'INSERT IGNORE INTO perfis (usuario_id) VALUES (?)',
      [userId]
    );

    const [[perfil]] = await pool.query(
      'SELECT bio, foto_key FROM perfis WHERE usuario_id = ?',
      [userId]
    );

    const [favoritos] = await pool.query(
      'SELECT titulo, poster_path, tmdb_movie_id FROM favoritos WHERE usuario_id = ? ORDER BY criado_em DESC',
      [userId]
    );

    const [[usuarioInfo]] = await pool.query(
      'SELECT is_premium FROM usuarios WHERE id = ?',
      [userId]
    );
    const perfilIsPremium = Boolean(usuarioInfo?.is_premium);

    // URL da foto aponta para a rota que serve o stream do Garage S3
    const fotoUrl = perfil?.foto_key ? `/perfil/${userId}/foto` : null;
    const ehDono = req.userId === userId;

    const nomeExibicao = ehDono ? (req.session.user?.nome || `Usuário #${userId}`) : `Usuário #${userId}`;

    res.render('perfil', {
      user: req.session.user,
      userRole: req.userRole,
      perfilUsuarioId: userId,
      perfilIsPremium,
      isPremium: Boolean(req.isPremium),
      nomeExibicao,
      bio: perfil?.bio || '',
      fotoUrl,
      favoritos,
      ehDono,
      error: req.flash('error'),
      success: req.flash('success'),
    });
  } catch (err) {
    console.error('Erro ao carregar perfil:', err);
    res.status(500).send('Erro ao carregar perfil.');
  }
});

// GET /perfil/:userId/foto — Recupera a foto armazenada no Garage S3 e serve via streaming
router.get('/perfil/:userId/foto', async (req, res) => {
  const userId = parseInt(req.params.userId);
  try {
    const [[perfil]] = await pool.query(
      'SELECT foto_key FROM perfis WHERE usuario_id = ?',
      [userId]
    );

    if (!perfil || !perfil.foto_key) {
      return res.status(404).send('Foto não encontrada');
    }

    const dataStream = await s3Client.getObject(BUCKET, perfil.foto_key);

    const ext = perfil.foto_key.split('.').pop().toLowerCase();
    const mimeTypes = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
    };

    if (mimeTypes[ext]) {
      res.setHeader('Content-Type', mimeTypes[ext]);
    }
    res.setHeader('Cache-Control', 'public, max-age=3600');

    dataStream.pipe(res);
  } catch (err) {
    console.error('[Garage S3] Erro ao buscar foto:', err.message);
    res.status(404).send('Foto não encontrada');
  }
});

// GET /perfil/:userId/editar — Formulário de edição
router.get('/perfil/:userId/editar', requireLogin, async (req, res) => {
  const userId = parseInt(req.params.userId);

  // CONTROLE DE ACESSO: backend valida sessão, recusando edição de perfil alheio
  if (req.userId !== userId) {
    return res.status(403).render('acesso-negado', {
      user: req.session.user,
      userRole: req.userRole,
      mensagem: `Você não tem permissão para editar o perfil de outro usuário. (Você é #${req.userId}, tentou editar #${userId})`,
    });
  }

  try {
    await pool.query('INSERT IGNORE INTO perfis (usuario_id) VALUES (?)', [userId]);
    const [[perfil]] = await pool.query(
      'SELECT bio, foto_key FROM perfis WHERE usuario_id = ?',
      [userId]
    );
    res.render('editar-perfil', {
      user: req.session.user,
      userRole: req.userRole,
      perfilUsuarioId: userId,
      perfil: perfil || { bio: '', foto_key: null },
      error: req.flash('error'),
      success: req.flash('success'),
    });
  } catch (err) {
    console.error('Erro ao carregar edição de perfil:', err);
    res.status(500).send('Erro interno.');
  }
});

// POST /perfil/:userId/editar — Atualizar bio e enviar foto para Garage S3
router.post('/perfil/:userId/editar', requireLogin, upload.single('foto'), async (req, res) => {
  const userId = parseInt(req.params.userId);

  // CONTROLE DE ACESSO: idêntico ao GET
  if (req.userId !== userId) {
    return res.status(403).render('acesso-negado', {
      user: req.session.user,
      userRole: req.userRole,
      mensagem: `Você não tem permissão para editar o perfil de outro usuário. (Você é #${req.userId}, tentou editar #${userId})`,
    });
  }

  const bio = (req.body.bio || '').trim().slice(0, 500);
  let fotoKeyNova = null;

  if (req.file) {
    if (!TIPOS_PERMITIDOS.includes(req.file.mimetype)) {
      req.flash('error', 'Tipo de arquivo inválido. Envie JPEG, PNG, GIF ou WebP.');
      return res.redirect(`/perfil/${userId}/editar`);
    }

    const ext = req.file.originalname.split('.').pop().toLowerCase();
    fotoKeyNova = `usuario-${userId}/${randomUUID()}.${ext}`;

    try {
      await s3Client.putObject(
        BUCKET,
        fotoKeyNova,
        req.file.buffer,
        req.file.size,
        { 'Content-Type': req.file.mimetype }
      );
      console.log(`[Garage S3] Objeto '${fotoKeyNova}' gravado com sucesso no bucket '${BUCKET}'.`);
    } catch (err) {
      console.error('[Garage S3] Erro no upload:', err);
      req.flash('error', 'Erro ao enviar a foto para o Garage S3. Tente novamente.');
      return res.redirect(`/perfil/${userId}/editar`);
    }
  }

  try {
    if (fotoKeyNova) {
      await pool.query(
        'UPDATE perfis SET bio = ?, foto_key = ? WHERE usuario_id = ?',
        [bio, fotoKeyNova, userId]
      );
    } else {
      await pool.query(
        'UPDATE perfis SET bio = ? WHERE usuario_id = ?',
        [bio, userId]
      );
    }
    auditLog(req, 'editar_perfil', `Atualizou o perfil${fotoKeyNova ? ' e foto (Garage S3)' : ''}`);
    req.flash('success', 'Perfil atualizado com sucesso!');
    return res.redirect(`/perfil/${userId}`);
  } catch (err) {
    console.error('Erro ao salvar perfil:', err);
    req.flash('error', 'Erro ao salvar. Tente novamente.');
    return res.redirect(`/perfil/${userId}/editar`);
  }
});

module.exports = router;
