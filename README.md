# 🎬 Catálogo Tom Hanks — ISW055

Projeto da disciplina **ISW055**, orientado pelo professor [@siriani](https://github.com/siriani).

Aplicação web que exibe a filmografia de Tom Hanks consumindo a [API do TMDB](https://www.themoviedb.org/), permitindo favoritar filmes, realizar comentários com moderação, auditoria via Redis e perfil com upload de fotos no **Garage S3**.

---

## 📅 Escopo e Registro de Entregas da P1

> **Status:** Todas as atividades previstas no cronograma até 07/10 foram concluídas com comprovação em histórico de commits no Git.

| Nº | Atividade | Data Planejada | Data Realizada | Repositório / Prova no Git | Evidência / Status |
|:---:|---|:---:|:---:|---|---|
| **1** | **Agenda telefônica em Flask** | 07/08/2026 | **07/08/2026** | [`LucasHiratuca/aula_01_cloud`](https://github.com/LucasHiratuca/aula_01_cloud) (Commit `28230dc` e `738ce73`) | Realizada em sala — Flask + MySQL |
| **2** | **Catálogo de filmes — Tom Hanks** | 20/08/2026 | **20/08/2026** | Commit [`9a57391`](https://github.com/LucasHiratuca/Entrega-da-Atividade/commit/9a57391) | Monólito inicial consumindo TMDB + Favoritos |
| **3** | **Desacoplando o login — microsserviço** | 28/08/2026 | **27/08/2026** | Commit [`320028a`](https://github.com/LucasHiratuca/Entrega-da-Atividade/commit/320028a) | Microsserviço `auth-service` + `docker-compose.yml` |
| **4** | **Controle de acesso por papel — RBAC** | 04/09/2026 | **01/09/2026** | Commits [`6636f4d`](https://github.com/LucasHiratuca/Entrega-da-Atividade/commit/6636f4d) e [`a8e31ef`](https://github.com/LucasHiratuca/Entrega-da-Atividade/commit/a8e31ef) | Enforcement 403, moderação e painel admin |
| **5** | **Logs e auditoria** | 25/09/2026 | **08/09/2026** *(Prints: 15/09)* | Commits [`e6c6682`](https://github.com/LucasHiratuca/Entrega-da-Atividade/commit/e6c6682) e [`8bc9faa`](https://github.com/LucasHiratuca/Entrega-da-Atividade/commit/8bc9faa) | Microsserviço `log-service` com Redis Streams |
| **6** | **Upload e perfil de usuário** | 02/10/2026 | **26/09/2026** | Commits [`27856a8`](https://github.com/LucasHiratuca/Entrega-da-Atividade/commit/27856a8) e [`8ca3fb6`](https://github.com/LucasHiratuca/Entrega-da-Atividade/commit/8ca3fb6) | Object storage com **Garage S3**, streaming e auditoria OWASP |
| **7** | **Plano Premium com Stripe** | 09/10/2026 | **10/10/2026** | Continuação no repositório | Stripe Checkout, Webhooks assinados e Favoritos Ilimitados |

---

## 🏗️ Arquitetura Geral da Aplicação

O projeto evoluiu de uma aplicação inicial (Atividade 2) para uma **arquitetura de microsserviços desacoplados e distribuídos**:

```text
Navegador do Usuário
       ↓ (HTTP na porta 8217)
[ catalogo-service (Porta 3000 → Host: 8217) ]  --- Único ponto público
       │
       ├── (Rede Interna Docker — JWT) ──> [ auth-service (Porta 4000 → Isolado) ]
       │                                            ↓
       │                                         MariaDB (usuarios, favoritos, comentarios, perfis)
       │
       ├── (HTTP S3 API na Porta 3900) ──> [ garage_s3 (Object Storage em Rust) ]
       │                                            ↓
       │                                         Volumes: garage_meta & garage_data
       │
       ├── (HTTP REST na Porta 5000)   ──> [ log-service (Auditoria) ]
       │                                            ↓
       │                                         [ Redis (Streams de Auditoria) ]
       │
       └── (HTTPS Externo / Webhook)   ──> [ Stripe (Checkout Hosted & Webhooks) ]
```

---

## 📌 Detalhamento das Atividades

### Atividade 1 — Agenda Telefônica em Flask
* **Data Planejada:** 07/08/2026 | **Data Realizada:** 07/08/2026
* **Repositório:** [`LucasHiratuca/aula_01_cloud`](https://github.com/LucasHiratuca/aula_01_cloud)
* Realizada em sala de aula — Aplicação Flask com conexão ao banco de dados MySQL na nuvem para cadastro e listagem de clientes/telefones.

### Atividade 2 — Catálogo de Filmes (Tom Hanks)
* **Data Planejada:** 20/08/2026 | **Data Realizada:** 20/08/2026
* **Commit:** [`9a57391`](https://github.com/LucasHiratuca/Entrega-da-Atividade/commit/9a57391)
* Criação da interface com EJS, consumo da API do TMDB para listar filmografia e sistema inicial de favoritos.

### Atividade 3 — Desacoplamento do Serviço de Autenticação
* **Data Planejada:** 28/08/2026 | **Data Realizada:** 27/08/2026
* **Commit:** [`320028a`](https://github.com/LucasHiratuca/Entrega-da-Atividade/commit/320028a)
* Separação em dois microsserviços no `docker-compose.yml`. O `auth-service` opera isolado sem portas públicas, emitindo JWT e disparando e-mails reais de recuperação via Mailtrap.

### Atividade 4 — Controle de Acesso Baseado em Papel (RBAC)
* **Data Planejada:** 04/09/2026 | **Data Realizada:** 01/09/2026
* **Commits:** [`6636f4d`](https://github.com/LucasHiratuca/Entrega-da-Atividade/commit/6636f4d) e [`a8e31ef`](https://github.com/LucasHiratuca/Entrega-da-Atividade/commit/a8e31ef)
* Adoção do **Padrão B (claims no JWT)** para verificação instantânea no servidor:
  * Usuário comum: catálogo, favoritos e comentários próprios.
  * Administrador: moderação de comentários de terceiros e painel `/admin/usuarios` para alterar papéis de acesso.
  * Enforcement 100% no backend retornando **HTTP 403 Forbidden**.

### Atividade 5 — Logs e Auditoria com Redis
* **Data Planejada:** 25/09/2026 | **Data Realizada:** 08/09/2026 *(Prints em 15/09/2026)*
* **Commits:** [`e6c6682`](https://github.com/LucasHiratuca/Entrega-da-Atividade/commit/e6c6682) e [`8bc9faa`](https://github.com/LucasHiratuca/Entrega-da-Atividade/commit/8bc9faa)
* Microsserviço dedicado `log-service` na porta 5000 conectado a instância do **Redis 7**. Registro assíncrono de eventos (login, logout, falhas de autenticação, exclusão e auditoria) com visualização restrita para administradores em `/admin/logs`.

### Atividade 6 — Perfil de Usuário & Object Storage com Garage S3
* **Data Planejada:** 02/10/2026 | **Data Realizada:** 26/09/2026
* **Commits:** [`27856a8`](https://github.com/LucasHiratuca/Entrega-da-Atividade/commit/27856a8) e [`8ca3fb6`](https://github.com/LucasHiratuca/Entrega-da-Atividade/commit/8ca3fb6)

#### Por que a imagem não mora no banco de dados?
Armazenar binários (`BLOB`) no MariaDB sobrecarrega memória e infla backups (`mysqldump`). O padrão arquitetural adotado: **o arquivo binário vai para o Garage S3 e o banco guarda somente a referência (`foto_key`)**.

#### Por que Garage S3?
O **Garage S3** (`dxflrs/garage:v1.0.1`) é um engine moderno, distribuído e ultraleve escrito em **Rust**, 100% compatível com a API S3 (AWS Signature V4) e com persistência em SQLite local.

#### Trade-offs de Exibição da Imagem (Decisão Arquitetural)
Para exibir a foto de volta no perfil do usuário, foram avaliadas três abordagens principais:

| Abordagem | Vantagens | Desvantagens | Veredito |
|---|---|---|---|
| **1. Bucket com Leitura Pública** | • Implementação trivial (tag `<img src="http://storage/bucket/foto.jpg">`)<br>• Sem processamento no servidor Node.js | • Imagens e fotos de perfil ficam 100% expostas sem qualquer autenticação<br>• Exige expor a porta do object storage para a internet pública<br>• Permite enumeração e scraping de fotos de todos os usuários | ❌ **Descartado:** Violação do princípio do menor privilégio e risco de exposição de dados. |
| **2. URL Pré-assinada / Temporária** | • Acesso temporário com expiração (ex: 1 hora)<br>• O storage atende as requisições diretamente sem sobrecarregar o Node.js | • Em ambientes conteinerizados ou atrás de reverse proxy (Cloudflare/Portainer), o storage gera links com seu hostname interno (`minio:9000` ou `garage:3900`), que **não resolvem no navegador do usuário**<br>• Exigiria configurar DNS público ou hairpinning para o endpoint do storage | ⚠️ **Analisado:** Válido para nuvens públicas nativas (AWS S3), mas problemático em ambientes Docker/laboratório com proxy reverso. |
| **3. Streaming Seguro via Backend (`/perfil/:userId/foto`)** | • **Zero portas do storage expostas:** o Garage S3 fica 100% isolado na rede interna do Docker (`app_network`)<br>• Funciona perfeitamente em qualquer ambiente (localhost, Docker interno, Portainer, túnel Cloudflare)<br>• Cabeçalhos de cache otimizados (`Cache-Control: public, max-age=3600`)<br>• Permite validação de permissão antes de entregar qualquer byte | ✅ **ADOTADO:** A rota `GET /perfil/:userId/foto` recupera o stream do Garage S3 via API S3 interna e repassa ao cliente com `Content-Type` validado. Máxima segurança e portabilidade. |

#### Controle de Acesso e Segurança (OWASP Top 10)
* O backend confere a identidade autenticada (`req.userId`);
* Tentativas de editar perfis alheios são barradas com **HTTP 403 Forbidden** antes de qualquer operação no banco ou no storage;
* Relatório completo e suíte de testes em [`SECURITY_AUDIT.md`](./SECURITY_AUDIT.md).

### Atividade 7 — Serviço Baseado em Pagamento: Plano Premium com Stripe
* **Data Planejada:** 09/10/2026 | **Data Realizada:** 10/10/2026
* **Orientador:** [@siriani](https://github.com/siriani)

#### Por que Pagamento é um Serviço à Parte?
Processar dados de cartão de crédito internamente exige conformidade rigorosa com normas internacionais de segurança (**PCI-DSS Nível 1**). A arquitetura padrão de mercado adotada neste projeto delega essa responsabilidade integralmente para um provedor especializado (**Stripe**).

O sistema **nunca vê, recebe ou armazena números de cartão, datas de validade ou códigos CVV**. O formulário de pagamento é 100% hospedado pelo próprio Stripe (`Stripe Checkout`). Nosso banco de dados guarda exclusivamente o identificador do cliente (`stripe_customer_id`), da assinatura (`stripe_subscription_id`) e a flag `is_premium`.

#### Fluxo de Checkout e Webhook Assíncrono
1. **Início do Checkout:** O usuário autenticado clica em assinar (`POST /premium/checkout`);
2. **Criação da Sessão:** O `catalogo-service` cria uma `Checkout Session` na API do Stripe e redireciona o usuário (HTTP 303) para a página segura de pagamento do Stripe;
3. **Pagamento em Modo de Teste:** O usuário preenche os dados utilizando cartões de teste oficiais do Stripe (`4242 4242...`);
4. **Webhook Assíncrono (`POST /webhook/stripe`):** O Stripe envia uma chamada HTTP assíncrona notificando o evento `checkout.session.completed`;
5. **Validação Criptográfica de Assinatura:** O backend valida a assinatura recebida no header `stripe-signature` utilizando o segredo do webhook (`STRIPE_WEBHOOK_SECRET`) e o corpo em formato RAW (Buffer);
6. **Ativação no Banco de Dados:** O usuário é promovido a `is_premium = TRUE` no MariaDB, disparando log de auditoria no `log-service`.

#### Benefícios Reais e Verificáveis do Usuário Premium
* **⭐ Favoritos Ilimitados:** Usuários gratuitos são bloqueados ao atingir o limite de 15 favoritos (`LIMITE_FAVORITOS_USUARIO = 15`), enquanto usuários Premium e Administradores possuem capacidade ilimitada;
* **🎖️ Selo Exclusivo de Assinante:** Distintivo dourado no perfil público (`/perfil/:userId`) e indicador na barra de navegação;
* **💬 Destaque em Comentários:** Identificação visual especial com badge `⭐ Premium` em todos os comentários publicados na filmografia.

---

## 📦 Tabelas do Banco de Dados (MariaDB)

| Tabela | Serviço Responsável | Descrição |
|---|---|---|
| `usuarios` | `auth-service` / `catalogo-service` | Login, e-mail, hash bcrypt, role (`usuario`/`admin`), `is_premium`, IDs Stripe |
| `reset_tokens` | `auth-service` | Tokens UUID para recuperação de senha (expiração 30min) |
| `favoritos` | `catalogo-service` | Filmes favoritados vinculados ao usuário (com limite de 15 p/ free e ilimitado p/ premium) |
| `comentarios` | `catalogo-service` | Comentários em filmes com moderação administrativa e badge premium |
| `perfis` | `catalogo-service` | Bio do usuário e referência da foto (`foto_key`) |

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- Docker e Docker Compose instalados

### Subir a stack completa
```bash
docker compose up -d --build
```

### Inicialização do Garage S3 (Layout e Bucket)
```bash
# Executa o script de inicialização automatizado:
powershell -ExecutionPolicy Bypass -File .\init-garage.ps1
```

Acesse no navegador:
* **Aplicação:** `http://localhost:8217`
* **Página do Plano Premium:** `http://localhost:8217/premium`
* **Garage S3 (API):** `http://localhost:3900`

---

## 🧪 Suíte de Testes de Segurança

Para rodar a bateria de testes de permissão e conformidade OWASP no container:
```bash
docker exec catalogo_service node owasp-security-suite.js
```

---

## 📋 Checklist Geral de Entregas (P1 e Atividades)

- [x] **Atividade 1:** Agenda telefônica em Flask (`LucasHiratuca/aula_01_cloud`)
- [x] **Atividade 2:** Catálogo de filmes do Tom Hanks com favoritos
- [x] **Atividade 3:** Microsserviço de autenticação desacoplado
- [x] **Atividade 4:** Controle de acesso por papel (RBAC) com 403
- [x] **Atividade 5:** Logs e auditoria com Redis Streams
- [x] **Atividade 6:** Upload de foto e perfil com Garage S3 e streaming seguro
- [x] **Atividade 7:** Plano Premium com Stripe Checkout, Webhooks assinados e Favoritos Ilimitados
- [x] Menção ao orientador [@siriani](https://github.com/siriani) mantida

