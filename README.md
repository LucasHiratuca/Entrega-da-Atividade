# 🎬 Catálogo Tom Hanks — ISW055

Projeto da disciplina **ISW055**, orientado pelo professor [@siriani](https://github.com/siriani).

Aplicação web que exibe a filmografia de Tom Hanks consumindo a [API do TMDB](https://www.themoviedb.org/), permitindo favoritar filmes e realizar comentários.

---

## 🏗️ Arquitetura — Atividades 3 e 4

O projeto evoluiu de uma arquitetura monolítica (Atividade 2) para **microsserviços desacoplados** (Atividade 3) e agora conta com **controle de acesso por papel (RBAC)** (Atividade 4).

```text
Navegador do Usuário
       ↓ (HTTP)
[ catalogo-service (Porta 3000 → Host: 8217) ]  --- Único ponto público
       ↓ (Rede Interna Docker — JWT no header)
[ auth-service (Porta 4000 → Isolado) ]
       ↓
    MariaDB (usuarios, reset_tokens, favoritos, comentarios)
       ↓
   Mailtrap (Disparo de E-mails de recuperação)
```

### `catalogo-service` — porta pública
- Serve o frontend (EJS) e rotas de filmes, favoritos e comentários
- **Decodifica o JWT localmente** para verificar o papel (`role`) do usuário — Padrão B
- Aplica as regras de permissão no backend (enforcement no servidor)

### `auth-service` — sem porta pública
- Acessível apenas pela rede interna Docker (`http://auth-service:4000`)
- Login, cadastro, papéis de usuário, recuperação de senha e gerenciamento de usuários
- Emite JWT contendo `userId`, `nome`, `email` e `role`

---

## 🔐 Atividade 4 — RBAC (Role-Based Access Control)

### Permissões por Papel

| Ação | `usuario` | `admin` |
|---|:---:|:---:|
| Ver catálogo de filmes | ✅ | ✅ |
| Favoritar / desfavoritar | ✅ | ✅ |
| Comentar em filmes | ✅ | ✅ |
| Excluir **seus próprios** comentários | ✅ | ✅ |
| Excluir comentário **de qualquer usuário** (moderação) | ❌ 403 | ✅ |
| Ver painel de administração (listar usuários) | ❌ 403 | ✅ |
| Promover/rebaixar papel de outro usuário | ❌ 403 | ✅ |

### Ação Exclusiva de Admin
- **Moderação de comentários**: um admin pode excluir o comentário de qualquer usuário diretamente na página do filme. Um usuário comum só consegue excluir os seus.
- **Painel de administração** (`/admin/usuarios`): lista todos os usuários cadastrados e permite promover para `admin` ou rebaixar para `usuario`.

### Enforcement no Backend
A verificação de permissão acontece **no servidor**, nunca no cliente:
- O middleware `requireAdmin` retorna **HTTP 403 Forbidden** quando um usuário comum tenta acessar rotas administrativas — mesmo que a requisição venha via Postman ou curl, sem passar pela interface.
- A rota `POST /comentario/remover` verifica no servidor se o `usuario_id` do comentário corresponde ao `userId` do JWT antes de permitir a exclusão. Se não corresponder e o papel não for `admin`, retorna **403**.

---

## 🏛️ Padrão A ou B? Justificativa

**Este projeto usa o Padrão B — claims no JWT.**

O papel (`role`) do usuário já vem embutido dentro do token JWT que é emitido no momento do login. Quando o `catalogo-service` precisa decidir se permite ou nega uma ação, ele **decodifica o token localmente** usando `jsonwebtoken.verify()` e lê o campo `role` — sem precisar fazer uma chamada de rede ao `auth-service`.

**Vantagem:** Cada verificação de permissão é instantânea (não depende do `auth-service` estar online ou responder rápido). O `auth-service` só é chamado para operações que realmente precisam dele (login, cadastro, alterar papel, recuperar senha).

**Tradeoff:** Se o papel de um usuário for alterado (ex: promovido a admin), a mudança só tem efeito quando ele fizer logout e login novamente, porque o token antigo ainda carrega o papel anterior até expirar (24h). Em um sistema de produção, isso poderia ser mitigado com tokens de curta duração + refresh tokens.

---

## 📦 Tabelas do Banco

| Tabela | Serviço responsável | Descrição |
|---|---|---|
| `usuarios` | `auth-service` | Dados de login, e-mail e `role ENUM('usuario','admin')` |
| `reset_tokens` | `auth-service` | Tokens de recuperação de senha com expiração de 30min |
| `favoritos` | `catalogo-service` | Filmes favoritados por usuário |
| `comentarios` | `catalogo-service` | Comentários por usuário e filme (moderáveis por admin) |

---

## 🚀 Como executar localmente

### Pré-requisitos
- Docker e Docker Compose
- Conta no [Mailtrap](https://mailtrap.io/) para testes de e-mail

### Variáveis de ambiente
Crie um `.env` na raiz:
```env
TMDB_API_KEY=sua_chave_tmdb
DB_HOST=seu_host
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=nome_do_banco
DB_PORT=3306
SESSION_SECRET=segredo_sessao
JWT_SECRET=segredo_jwt
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=usuario_mailtrap
MAIL_PASS=senha_mailtrap
```

### Subir os containers
```bash
docker-compose up -d --build
```
Acesse: `http://localhost:8217`

---

## 🧪 Checklist de Entrega

### Atividade 3 — Microsserviços
- [x] Dois containers separados no `docker-compose.yml`
- [x] `auth-service` sem porta publicada para o host
- [x] Rede interna Docker compartilhada (`app_network`)
- [x] Recuperação de senha com token UUID + expiração de 30 minutos
- [x] Envio real de e-mail (Mailtrap)

### Atividade 4 — RBAC
- [x] Permissões documentadas por papel (tabela acima)
- [x] Ação exclusiva de admin: moderar comentários de qualquer usuário
- [x] Enforcement no backend com 403 (testável via Postman)
- [x] Painel de administração para promover/rebaixar usuários
- [x] Resposta justificada: Padrão B (claims no JWT)

---

## 🪣 Atividade 6 — Perfil de Usuário & Object Storage com Garage S3

### Por que a imagem não mora no banco de dados?
Armazenar arquivos binários (como fotos em colunas `BLOB`) dentro de um banco relacional como o MariaDB é uma má prática em arquiteturas de produção:
1. **Infla o banco:** Backups (`mysqldump`) ficam gigantescos e lentos.
2. **Degradação de cache e I/O:** Consultas que buscam dados de texto acabam varrendo megabytes desnecessários de memória.
3. **Escala independente:** O tráfego de arquivos estáticos deve ser servido e armazenado de forma desacoplada das transações SQL.

**Padrão adotado:** O arquivo binário vai para o **Garage S3** (Object Storage S3-compatible dedicado), e o MariaDB guarda apenas uma **referência** (`foto_key`).

### 📦 Por que Garage S3?
O **Garage S3** (`dxflrs/garage`) é um engine de object storage moderno, open-source e distribuído, escrito em **Rust**:
- **Consumo mínimo de recursos:** Consome frações de memória e CPU em relação ao MinIO tradicional, ideal para pequenos clusters e ambientes containerizados.
- **100% compatível com a API S3 (AWS Signature V4):** Permite o uso de qualquer SDK padrão da indústria (como AWS SDK ou o cliente S3/MinIO no Node.js).
- **Resiliente e auto-contido:** Opera com motor de metadados SQLite local e replicação de dados.

### 🖼️ Exibição da Imagem e Trade-offs de Design

**Decisão implementada: Leitura controlada via Streaming Backend (`/perfil/:userId/foto`)**

| Critério | Bucket com Leitura Pública Direta | Streaming Controlado via Backend ✅ |
|---|---|---|
| **Segurança** | ❌ Arquivos expostos a raspagem pública direta | ✅ Acesso controlado e autenticado pela aplicação |
| **Isolamento de Rede** | ❌ Exige expor a porta do S3 (3900) para a internet | ✅ Garage fica 100% isolado na rede interna Docker (`app_network`) |
| **Compatibilidade em Nuvem** | ❌ Em proxies reversos como Cloudflare/Portainer, portas adicionais não são mapeadas | ✅ Funciona tanto em `localhost:8217` quanto na URL pública do professor |
| **Cache** | ✅ Cache nativo HTTP | ✅ Cabeçalho `Cache-Control: public, max-age=3600` adicionado no backend |

### 🔒 Controle de Acesso ao Perfil
- Cada usuário só pode editar o seu próprio perfil.
- As rotas `GET /perfil/:userId/editar` e `POST /perfil/:userId/editar` verificam a identidade real decodificada da sessão/JWT (`req.userId`).
- Tentativas de enviar um ID de outro usuário na URL ou no corpo da requisição são recusadas no backend com **HTTP 403 Forbidden** (página `acesso-negado`).

### ⚙️ Inicialização do Garage S3
O Garage é configurado pelo arquivo `garage.toml` e inicializado com:
```bash
# 1. Atribuir capacidade ao nó
docker exec garage_s3 /garage layout assign -z dc1 -c 1G $(docker exec garage_s3 /garage node id -q)
# 2. Aplicar layout
docker exec garage_s3 /garage layout apply --version 1
# 3. Criar chave de acesso e bucket
docker exec garage_s3 /garage key import --yes -n app-key GK9ae6ab4a2d12a3227b1a0d9a f46bb999a2d2615ad200369932ccff5454f113c74c4614e6027dc2380dcc5632
docker exec garage_s3 /garage bucket create perfis
docker exec garage_s3 /garage bucket allow perfis --key GK9ae6ab4a2d12a3227b1a0d9a --read --write
```

