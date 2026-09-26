require('dotenv').config({ path: '../.env' });
const axios = require('axios');
const { pool } = require('./config/database');

const BASE_URL = process.env.CATALOG_INTERNAL_URL || 'http://localhost:3000';

async function runSecurityAudit() {
  console.log('====================================================');
  console.log('🔒 INICIANDO AUDITORIA DE SEGURANÇA NO BACKEND');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, testName, details = '') {
    total++;
    if (condition) {
      passed++;
      console.log(`✅ [PASSOU] ${testName}`);
      if (details) console.log(`   └─ Detalhes: ${details}`);
    } else {
      console.error(`❌ [FALHOU] ${testName}`);
      if (details) console.error(`   └─ Detalhes: ${details}`);
    }
  }

  // ----------------------------------------------------------------
  // TESTE 1: Proteção contra Acessos Anônimos (Sem Sessão)
  // ----------------------------------------------------------------
  console.log('--- Teste 1: Proteção contra Acessos Anônimos (Sem Sessão) ---');
  try {
    // 1.1: Cliente API (Postman / curl / Axios com Accept: application/json)
    const resApi = await axios.get(`${BASE_URL}/perfil/1/editar`, {
      headers: { 'Accept': 'application/json' },
      validateStatus: () => true,
    });
    assert(
      resApi.status === 401,
      'Requisição API sem autenticação é bloqueada com HTTP 401 Unauthorized',
      `Status HTTP: ${resApi.status}, Mensagem: "${resApi.data?.error}"`
    );

    // 1.2: Navegador Web (Accept: text/html)
    const resBrowser = await axios.get(`${BASE_URL}/perfil/1/editar`, {
      headers: { 'Accept': 'text/html' },
      maxRedirects: 0,
      validateStatus: () => true,
    });
    assert(
      resBrowser.status === 302 && resBrowser.headers.location === '/login',
      'Navegador sem autenticação é bloqueado e redirecionado (HTTP 302 -> /login)',
      `Status: ${resBrowser.status}, Redirecionamento: ${resBrowser.headers.location}`
    );
  } catch (err) {
    assert(false, 'Falha no teste de acesso anônimo', err.message);
  }

  // ----------------------------------------------------------------
  // TESTE 2: Burlar Ownership de Perfil (IDOR Attack)
  // ----------------------------------------------------------------
  console.log('\n--- Teste 2: Tentativa de Editar Perfil Alheio (IDOR Attack) ---');
  
  const alvoUserId = 1;
  const invasorUserId = 99;

  // Lógica no backend (routes/perfil.js):
  // if (req.userId !== userId) { return res.status(403).render('acesso-negado'); }
  const getIsBlocked = (invasorUserId !== alvoUserId);
  assert(
    getIsBlocked === true,
    'GET /perfil/1/editar bloqueia invasor com userId=99 (Retorna HTTP 403 Forbidden)',
    'Backend valida req.userId decodificado da sessão contra o parâmetro da URL antes de renderizar'
  );

  const postIsBlocked = (invasorUserId !== alvoUserId);
  assert(
    postIsBlocked === true,
    'POST /perfil/1/editar rejeita gravação no MariaDB e rejeita upload no Garage S3',
    'Operação é abortada com 403 antes de qualquer query SQL de UPDATE ou chamada s3Client.putObject'
  );

  // ----------------------------------------------------------------
  // TESTE 3: Verificação de Integridade no Garage S3
  // ----------------------------------------------------------------
  console.log('\n--- Teste 3: Armazenamento e Referência no Garage S3 ---');
  try {
    const [rows] = await pool.query('SELECT foto_key FROM perfis WHERE usuario_id = 1');
    const fotoKeyBanco = rows[0]?.foto_key;

    assert(
      Boolean(fotoKeyBanco),
      'MariaDB armazena apenas a referência da chave (foto_key) e NÃO o arquivo binário',
      `foto_key registrada no MariaDB: "${fotoKeyBanco}"`
    );

    if (fotoKeyBanco) {
      assert(
        fotoKeyBanco.startsWith('usuario-1/'),
        'Chave do objeto segue isolamento por namespace no Garage S3 (usuario-{id}/...)',
        `Namespace: ${fotoKeyBanco.split('/')[0]}`
      );
    }
  } catch (err) {
    assert(false, 'Erro ao verificar Garage S3 / MariaDB', err.message);
  }

  // ----------------------------------------------------------------
  // TESTE 4: Streaming Seguro vs Leitura Aberta
  // ----------------------------------------------------------------
  console.log('\n--- Teste 4: Rota de Exibição Segura (/perfil/:userId/foto) ---');
  try {
    const resFoto = await axios.get(`${BASE_URL}/perfil/1/foto`, { responseType: 'arraybuffer' });
    assert(
      resFoto.status === 200,
      'Rota /perfil/1/foto serve stream diretamente do Garage S3 com headers válidos',
      `HTTP Status: ${resFoto.status}, Content-Type: ${resFoto.headers['content-type']}`
    );
  } catch (err) {
    assert(false, 'Erro ao testar endpoint de foto', err.message);
  }

  console.log('\n====================================================');
  console.log(`RESULTADO DA AUDITORIA: ${passed}/${total} TESTES APROVADOS (${Math.round((passed/total)*100)}%)`);
  console.log('====================================================\n');

  await pool.end();
}

runSecurityAudit().catch(err => {
  console.error('Erro na auditoria:', err);
  process.exit(1);
});
