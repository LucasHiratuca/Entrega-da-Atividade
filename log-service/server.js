require('dotenv').config();

const express = require('express');
const logRoutes = require('./routes/logs');

const app = express();
const PORT = process.env.LOG_SERVICE_PORT || 5000;

app.use(express.json());
app.use('/', logRoutes);

app.listen(PORT, () => {
  console.log(`[Log-Service] Microsserviço de auditoria rodando na porta ${PORT}`);
});
