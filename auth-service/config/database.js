const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
});

async function initDatabase() {
  const conn = await pool.getConnection();
  try {
    // Tabela de usuários com campo de role
    await conn.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        senha_hash VARCHAR(255) NOT NULL,
        role ENUM('usuario', 'admin') NOT NULL DEFAULT 'usuario',
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Tabela de tokens de recuperação de senha
    await conn.query(`
      CREATE TABLE IF NOT EXISTS reset_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        token VARCHAR(255) UNIQUE NOT NULL,
        usuario_id INT NOT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expira_em TIMESTAMP NOT NULL,
        usado BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Adiciona coluna role se não existir (para quem já tinha a tabela da atividade 2)
    try {
      await conn.query(`
        ALTER TABLE usuarios ADD COLUMN role ENUM('usuario', 'admin') NOT NULL DEFAULT 'usuario'
      `);
      console.log('Coluna "role" adicionada à tabela de usuários.');
    } catch (err) {
      // Coluna já existe — segue normalmente
    }

    console.log('[Auth Service] Tabelas criadas/verificadas com sucesso.');
  } finally {
    conn.release();
  }
}

module.exports = { pool, initDatabase };
