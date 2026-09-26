const Minio = require('minio');

const BUCKET = process.env.S3_BUCKET || 'perfis';
const ENDPOINT = process.env.S3_ENDPOINT || 'garage:3900';

const [host, port] = ENDPOINT.split(':');

// Cliente S3 configurado para o Garage S3
const s3Client = new Minio.Client({
  endPoint: host,
  port: parseInt(port || '3900'),
  useSSL: false,
  accessKey: process.env.S3_ACCESS_KEY || 'GK9ae6ab4a2d12a3227b1a0d9a',
  secretKey: process.env.S3_SECRET_KEY || 'f46bb999a2d2615ad200369932ccff5454f113c74c4614e6027dc2380dcc5632',
  region: process.env.S3_REGION || 'garage',
  pathStyle: true,
});

async function garantirBucket() {
  try {
    const exists = await s3Client.bucketExists(BUCKET);
    if (!exists) {
      await s3Client.makeBucket(BUCKET, 'garage');
      console.log(`[Garage S3] Bucket '${BUCKET}' criado com sucesso.`);
    } else {
      console.log(`[Garage S3] Bucket '${BUCKET}' verificado e pronto.`);
    }
  } catch (e) {
    console.log(`[Garage S3] Verificação do bucket '${BUCKET}':`, e.message);
  }
}

module.exports = { s3Client, BUCKET, garantirBucket };
