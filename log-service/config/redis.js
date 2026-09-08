const Redis = require('ioredis');

// Suporte a Redis Cloud (URL completa) ou variáveis separadas (host/port/password)
let redis;

if (process.env.REDIS_URL) {
  // Redis Cloud / Upstash / Redis Labs — formato: redis://:senha@host:port
  redis = new Redis(process.env.REDIS_URL, {
    tls: process.env.REDIS_URL.startsWith('rediss://') ? {} : undefined,
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 100, 3000),
  });
} else {
  // Fallback para configuração manual
  redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 100, 3000),
  });
}

redis.on('connect', () => console.log('[Log-Service] Conectado ao Redis.'));
redis.on('error', (err) => console.error('[Log-Service] Erro no Redis:', err.message));

module.exports = redis;
