require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./config/database');
const authRoutes = require('./routes/auth');
const passwordRoutes = require('./routes/password');

const app = express();
const PORT = process.env.AUTH_PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth-service' });
});

// Rotas de autenticação
app.use('/', authRoutes);
app.use('/', passwordRoutes);

// Inicialização
async function start() {
  try {
    await initDatabase();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[Auth Service] Rodando internamente na porta ${PORT}`);
    });
  } catch (err) {
    console.error('[Auth Service] Erro ao iniciar:', err);
    process.exit(1);
  }
}

start();
