> 🚀 **Este projeto continua em https://github.com/LucasHiratuca/slotmatrix**
> *(Transição da P1 para o SaaS B2B — Atividade 9 em diante)*

# 🎬 Catálogo Tom Hanks — ISW055

Projeto da disciplina **ISW055 — Computação em Nuvem**, orientado pelo professor [@siriani](https://github.com/siriani).

Aplicação web que exibe a filmografia de Tom Hanks consumindo a [API do TMDB](https://www.themoviedb.org/), permitindo favoritar filmes, realizar comentários com moderação, auditoria via Redis Streams, perfil com upload de fotos no **Garage S3** e assinatura **Premium com Stripe**.

> 📚 **Documentação Reversa Completa:** Consulte o arquivo [`DOCUMENTACAO.md`](./DOCUMENTACAO.md) para a especificação funcional de ponta a ponta, diagrama arquitetural ("big picture"), lista formal de regras de negócio (*"Se X, então Y"*) e modelo de dados (DER).

---

## 📅 Escopo e Registro de Entregas da Disciplina

> **Status:** Todas as 8 atividades do cronograma foram 100% concluídas com código funcional, testes e comprovação em histórico de commits no Git.

| Nº | Atividade | Data Planejada | Data Realizada | Repositório / Prova no Git | Evidência / Status |
|:---:|---|:---:|:---:|---|---|
| **1** | **Agenda telefônica em Flask** | 07/08/2026 | **07/08/2026** | [`LucasHiratuca/aula_01_cloud`](https://github.com/LucasHiratuca/aula_01_cloud) (Commit `28230dc` e `738ce73`) | Realizada em sala — Flask + MySQL |
| **2** | **Catálogo de filmes — Tom Hanks** | 20/08/2026 | **20/08/2026** | Commit [`9a57391`](https://github.com/LucasHiratuca/Entrega-da-Atividade/commit/9a57391) | Monólito inicial consumindo TMDB + Favoritos |
| **3** | **Desacoplando o login — microsserviço** | 28/08/2026 | **27/08/2026** | Commit [`320028a`](https://github.com/LucasHiratuca/Entrega-da-Atividade/commit/320028a) | Microsserviço `auth-service` + `docker-compose.yml` |
| **4** | **Controle de acesso por papel — RBAC** | 04/09/2026 | **01/09/2026** | Commits [`6636f4d`](https://github.com/LucasHiratuca/Entrega-da-Atividade/commit/6636f4d) e [`a8e31ef`](https://github.com/LucasHiratuca/Entrega-da-Atividade/commit/a8e31ef) | Enforcement 403, moderação e painel admin |
| **5** | **Logs e auditoria** | 25/09/2026 | **08/09/2026** *(Prints: 15/09)* | Commits [`e6c6682`](https://github.com/LucasHiratuca/Entrega-da-Atividade/commit/e6c6682) e [`8bc9faa`](https://github.com/LucasHiratuca/Entrega-da-Atividade/commit/8bc9faa) | Microsserviço `log-service` com Redis Streams |
| **6** | **Upload e perfil de usuário** | 02/10/2026 | **26/09/2026** | Commits [`27856a8`](https://github.com/LucasHiratuca/Entrega-da-Atividade/commit/27856a8) e [`8ca3fb6`](https://github.com/LucasHiratuca/Entrega-da-Atividade/commit/8ca3fb6) | Object storage com **Garage S3**, streaming e auditoria OWASP |
| **7** | **Plano Premium com Stripe** | 09/10/2026 | **10/10/2026** | Commits [`db428bf`](https://github.com/LucasHiratuca/Entrega-da-Atividade/commit/db428bf) e [`3e95dd0`](https://github.com/LucasHiratuca/Entrega-da-Atividade/commit/3e95dd0) | Stripe Checkout, Webhooks assinados e Favoritos Ilimitados |
| **8** | **Encerramento — SaaS, PaaS, IaaS & Docs** | 16/10/2026 | **16/10/2026** | [`DOCUMENTACAO.md`](./DOCUMENTACAO.md) | Classificação das 3 camadas de nuvem, especificação reversa e DER |

---

## ☁️ Classificação SaaS, PaaS e IaaS do Projeto (Atividade 8)

As três siglas descrevem quanto da pilha de infraestrutura é gerenciada pela equipe de desenvolvimento *versus* quanto é gerenciado por provedores terceiros:

* **IaaS (Infrastructure as a Service):** Você gerencia o sistema operacional para cima. O provedor entrega apenas máquina virtual, disco e rede. Você instala o SO, Docker, kernel patches e firewall. Mais controle e maior responsabilidade.
* **PaaS (Platform as a Service):** Você entrega apenas a imagem ou o código da aplicação. O provedor cuida do SO subjacente, runtime, orquestração e isolamento de processos. Menos preocupação com infraestrutura básica, maior foco em negócio e velocidade.
* **SaaS (Software as a Service):** Você apenas consome o produto pronto via API ou dashboard. Nenhuma infraestrutura sua está envolvida na execução daquela funcionalidade.

O ecossistema do **Catálogo Tom Hanks** atravessa propositalmente as três camadas ao mesmo tempo:

| Componente do Sistema | Camada de Nuvem | Justificativa Técnica e Teórica |
|---|:---:|---|
| **VM Proxmox / Ubuntu Server na Fatec** | **IaaS** | A Fatec/Proxmox entrega exclusivamente a infraestrutura de hardware virtualizado (vCPU, RAM, disco e rede). A equipe administra o sistema operacional Ubuntu, aplica atualizações de kernel, gerencia firewall e provisiona o Docker Engine manualmente. |
| **Containers da Aplicação (`catalogo-service`, `auth-service`, `log-service`)** | **PaaS** | A equipe entrega somente o código da aplicação empacotado em imagens Docker. O runtime Node.js, isolamento de processos, ciclo de vida dos containers e roteamento de rede interna (`app_network`) são abstraídos e geridos pela plataforma Docker/Portainer. |
| **Object Storage (`garage_s3`) e Cache (`redis_audit`)** | **PaaS** | Motores de armazenamento S3 e mensageria em memória operando como serviços conteinerizados gerenciados pela plataforma local, sem a necessidade de provisionar servidores físicos dedicados. |
| **Banco Relacional MariaDB (GCP Cloud SQL)** | **PaaS** | Instância consumida como plataforma de banco de dados gerenciado em nuvem (`DB_HOST`). Backups físicos, replicação e manutenção da integridade do engine são geridos pelo provedor cloud. |
| **Stripe (Checkout & Assinaturas)** | **SaaS** | Provedor de pagamento pronto consumido 100% via API e Webhooks. Nenhuma infraestrutura de cartões reside no projeto, delegando integralmente a conformidade PCI-DSS Nível 1 ao Stripe. |
| **Mailtrap / Provedor SMTP** | **SaaS** | Solução de entrega e inspeção de e-mails transacionais de recuperação de senha consumida via protocolo pronto, eliminando a necessidade de hospedar servidores SMTP (Postfix), chaves DKIM e reputação de IP. |
| **The Movie Database (TMDB API)** | **SaaS** | Serviço pronto consumido via REST API para alimentação dinâmica de sinopses, elenco e cartazes cinematográficos sem armazenamento próprio do acervo de filmes. |

---

## 🏗️ Arquitetura Geral da Aplicação

O projeto opera sob uma **arquitetura de microsserviços desacoplados e distribuídos** em rede interna isolada:

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
* Adoção de claims no JWT para verificação instantânea no servidor:
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
* Object storage com **Garage S3** (`dxflrs/garage:v1.0.1`) em Rust:
  * Streaming seguro via backend (`/perfil/:userId/foto`): zero portas do storage expostas para a internet.
  * O MariaDB armazena apenas a referência (`foto_key`), mantendo o banco leve e otimizado.
  * Relatório de segurança OWASP disponível em [`SECURITY_AUDIT.md`](./SECURITY_AUDIT.md).

### Atividade 7 — Serviço Baseado em Pagamento: Plano Premium com Stripe
* **Data Planejada:** 09/10/2026 | **Data Realizada:** 10/10/2026
* **Commits:** [`db428bf`](https://github.com/LucasHiratuca/Entrega-da-Atividade/commit/db428bf) e [`3e95dd0`](https://github.com/LucasHiratuca/Entrega-da-Atividade/commit/3e95dd0)
* **Orientador:** [@siriani](https://github.com/siriani)
* O formulário de pagamento é 100% hospedado pelo próprio Stripe (`Stripe Checkout`). O backend valida a assinatura recebida no header `stripe-signature` via webhook assíncrono (`POST /webhook/stripe`).
* **Benefícios Reais:** Favoritos ilimitados para assinantes Premium (com limite restrito de 15 para contas gratuitas), selo `⭐ Assinante Premium` no perfil, na navbar e destaque em comentários.

### Atividade 8 — Encerramento do Projeto: SaaS, PaaS, IaaS e Documentação Reversa
* **Data Planejada:** 16/10/2026 | **Data Realizada:** 16/10/2026
* **Orientador:** [@siriani](https://github.com/siriani)
* Documentação de engenharia reversa completa consolidada no arquivo dedicado [`DOCUMENTACAO.md`](./DOCUMENTACAO.md):
  * **Especificação Funcional:** Descrição completa de todos os fluxos e casos de uso do sistema legado.
  * **Arquitetura Geral:** Diagrama visual Mermaid conectando os 5 serviços e provedores externos.
  * **Regras de Negócio:** Extração formal de 25 regras no padrão estrito *"Se X, então Y"*.
  * **Modelo de Dados (DER):** Diagrama entidade-relacionamento das tabelas MariaDB, Garage S3 e Redis Streams.
  * **Mapeamento em Camadas de Nuvem:** Classificação teórica e prática de cada componente nas camadas IaaS, PaaS e SaaS.

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
* **Aplicação Principal:** `http://localhost:8217`
* **Página do Plano Premium:** `http://localhost:8217/premium`
* **Garage S3 (API Interna):** `http://localhost:3900`

---

## 🧪 Suíte de Testes de Segurança

Para rodar a bateria de testes de permissão e conformidade OWASP no container:
```bash
docker exec catalogo_service node owasp-security-suite.js
```

---

## 📋 Checklist Geral de Entregas (P1 e Atividades Finais)

- [x] **Atividade 1:** Agenda telefônica em Flask (`LucasHiratuca/aula_01_cloud`)
- [x] **Atividade 2:** Catálogo de filmes do Tom Hanks com favoritos
- [x] **Atividade 3:** Microsserviço de autenticação desacoplado
- [x] **Atividade 4:** Controle de acesso por papel (RBAC) com 403
- [x] **Atividade 5:** Logs e auditoria com Redis Streams
- [x] **Atividade 6:** Upload de foto e perfil com Garage S3 e streaming seguro
- [x] **Atividade 7:** Plano Premium com Stripe Checkout, Webhooks assinados e Favoritos Ilimitados
- [x] **Atividade 8:** Documentação reversa completa em [`DOCUMENTACAO.md`](./DOCUMENTACAO.md) e classificação SaaS/PaaS/IaaS no `README.md`
- [x] Menção ao orientador [@siriani](https://github.com/siriani) mantida
