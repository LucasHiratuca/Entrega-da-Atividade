require('dotenv').config();

const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const cookieParser = require('cookie-parser');
const path = require('path');

const { initDatabase } = require('./config/database');
const { garantirBucket } = require('./utils/s3');
const authRoutes = require('./routes/auth');
const movieRoutes = require('./routes/movies');
const favoriteRoutes = require('./routes/favorites');
const commentRoutes = require('./routes/comments');
const adminRoutes = require('./routes/admin');
const perfilRoutes = require('./routes/perfil');
const { router: premiumRoutes, webhookHandler } = require('./routes/premium');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// WEBHOOK DO STRIPE (Atividade 7):
// Deve receber o corpo em formato RAW (Buffer) ANTES do express.json() para validar a assinatura criptográfica
app.post('/webhook/stripe', express.raw({ type: 'application/json' }), webhookHandler);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Sessão
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'segredo-temporario-dev',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

// Flash messages
app.use(flash());

// Rotas
app.use('/', authRoutes);
app.use('/', movieRoutes);
app.use('/', favoriteRoutes);
app.use('/', commentRoutes);
app.use('/', adminRoutes);
app.use('/', perfilRoutes);
app.use('/', premiumRoutes);

// Rota raiz
app.get('/', (req, res) => {
  if (req.session.user) return res.redirect('/filmes');
  return res.redirect('/login');
});

// Inicialização
async function start() {
  try {
    await initDatabase();
    await garantirBucket();
    app.listen(PORT, () => {
      console.log(`[Catálogo] Servidor público rodando em http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[Catálogo] Erro ao iniciar:', err);
    process.exit(1);
  }
}

start();
