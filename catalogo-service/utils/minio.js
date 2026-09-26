const Minio = require('minio');

const BUCKET = process.env.MINIO_BUCKET || 'perfis';

const minioClient = new Minio.Client({
  endPoint: (process.env.MINIO_ENDPOINT || 'minio:9000').split(':')[0],
  port: parseInt((process.env.MINIO_ENDPOINT || 'minio:9000').split(':')[1] || '9000'),
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

async function garantirBucket() {
  try {
    const exists = await minioClient.bucketExists(BUCKET);
    if (!exists) {
      await minioClient.makeBucket(BUCKET, 'us-east-1');
      console.log(`[MinIO] Bucket '${BUCKET}' criado.`);
    }
  } catch (e) {
    console.error('[MinIO] Erro ao verificar/criar bucket:', e.message);
  }
}

async function getFotoUrl(fotoKey) {
  if (!fotoKey) return null;
  try {
    return await minioClient.presignedGetObject(BUCKET, fotoKey, 60 * 60);
  } catch (e) {
    return null;
  }
}

module.exports = { minioClient, BUCKET, garantirBucket, getFotoUrl };
