# 🎬 Catálogo Tom Hanks — ISW055

Projeto da disciplina **ISW055**, orientado pelo professor [@siriani](https://github.com/siriani).

Aplicação web que exibe a filmografia de Tom Hanks consumindo a [API do TMDB](https://www.themoviedb.org/), permitindo favoritar filmes e realizar comentários.

---

## 🏗️ Arquitetura — Atividade 3: Serviços Desacoplados

Este repositório é uma continuação direta da Atividade 2. O projeto evoluiu de uma arquitetura monolítica para uma arquitetura de **microsserviços desacoplados**, utilizando **dois containers independentes** conversando por uma rede interna do Docker.

### O que mudou?

1. **Separação de Responsabilidades:**
   - Todo o sistema de autenticação (login, cadastro, papéis de usuário, e recuperação de senha) foi isolado em um novo container (`auth-service`).
   - O Catálogo (`catalogo-service`) agora atua apenas como cliente do serviço de autenticação para gerenciar a segurança e foca apenas nas regras de negócio (filmes, favoritos e comentários).

2. **Segurança de Rede (Sem porta pública no Auth):**
   - O `auth-service` **NÃO** expõe portas para o host local/internet. Ele roda escondido na rede virtual do Docker (bridge) sob a porta interna `4000`.
   - O `catalogo-service` é o **único** ponto de entrada público (exposto na porta `8217`).

3. **Novo Fluxo de Recuperação de Senha (E-mail Real):**
   - Implementação de funcionalidade de "Esqueci minha senha" no `auth-service`.
   - Geração de tokens únicos (UUID) salvos na nova tabela `reset_tokens` com validação estrita de **30 minutos de expiração** e bloqueio de **reutilização (flag `usado`)**.
   - Envio de e-mails de recuperação utilizando o **Mailtrap** em ambiente de desenvolvimento (via `nodemailer`).

---

## 📦 Serviços e Fluxo de Dados

```text
Navegador do Usuário
       ↓ (HTTP)
[ catalogo-service (Porta 3000 -> Host: 8217) ]  --- O único ponto público
       ↓ (Comunicação JWT via Rede Interna Docker)
[ auth-service (Porta 4000 -> Isolado) ]
       ↓
    MariaDB (Tabelas: usuarios, reset_tokens, favoritos, comentarios)
       ↓
   Mailtrap (Disparo de E-mails transacionais)
```

### Tabelas do Banco de Dados
- `usuarios`: Gerenciada pelo *auth-service* (Login, e Role 'admin'/'usuario').
- `reset_tokens`: Gerenciada pelo *auth-service* (Tokens temporários).
- `favoritos`: Gerenciada pelo *catalogo-service*.
- `comentarios`: Gerenciada pelo *catalogo-service*.

---

## 🚀 Como executar localmente

### 1. Pré-requisitos
- Docker e Docker Compose instalados.
- Conta gratuita no [Mailtrap](https://mailtrap.io/) para obter credenciais SMTP.

### 2. Configurando o ambiente
Crie um arquivo `.env` na raiz do projeto contendo as seguintes credenciais (nunca versione este arquivo):

```env
TMDB_API_KEY=sua_chave_tmdb
DB_HOST=seu_banco_host
DB_USER=seu_banco_usuario
DB_PASSWORD=seu_banco_senha
DB_NAME=seu_banco_nome
DB_PORT=3306

SESSION_SECRET=segredo_sessao_catalogo
JWT_SECRET=segredo_jwt_isw055

# Credenciais do Mailtrap (Email Testing > My Sandbox)
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=seu_user_mailtrap
MAIL_PASS=sua_senha_mailtrap
```

### 3. Subindo os Containers
No terminal, na raiz do projeto, execute:
```bash
docker-compose up -d --build
```
Acesse a aplicação no seu navegador: `http://localhost:8217`

---

## 🧪 Demonstração de Entrega (Checklist)

Conforme os requisitos da entrega da Atividade 3, os testes demonstram que:
- [x] Existe apenas 1 ponto público.
- [x] `auth-service` não possui portas mapeadas no `docker-compose.yml`.
- [x] Usuários recebem o link de recuperação em suas caixas de e-mail reais (interceptados pelo Mailtrap).
- [x] O sistema **recusa** links expirados (após 30 min) e também **recusa** a reutilização do mesmo link.
