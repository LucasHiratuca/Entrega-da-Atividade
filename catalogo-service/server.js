require('dotenv').config();

const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const cookieParser = require('cookie-parser');
const path = require('path');

const { initDatabase } = require('./config/database');
const authRoutes = require('./routes/auth');
const movieRoutes = require('./routes/movies');
const favoriteRoutes = require('./routes/favorites');
const commentRoutes = require('./routes/comments');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

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
    cookie: { maxAge: 1000 * 60 * 60 * 24 },
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

// Rota raiz
app.get('/', (req, res) => {
  if (req.session.user) return res.redirect('/filmes');
  return res.redirect('/login');
});

// Inicialização
async function start() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`[Catálogo] Servidor público rodando em http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[Catálogo] Erro ao iniciar:', err);
    process.exit(1);
  }
}

start();
