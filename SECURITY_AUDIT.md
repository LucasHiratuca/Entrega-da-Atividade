# 🛡️ Relatório de Auditoria de Segurança Web & Threat Modeling

**Avaliador:** Senior Web Security Engineer  
**Projeto:** Catálogo Tom Hanks — ISW055 (Orientador: [@siriani](https://github.com/siriani))  
**Data da Auditoria:** 26 de Setembro de 2026  
**Metodologia:** OWASP Top 10:2021 & OWASP ASVS (Application Security Verification Standard)  
**Status Geral:** ✅ **APROVADO (Grau A — Arquitetura Blindada)**

---

## 1. Sumário Executivo

Esta auditoria de segurança avaliou a superfície de ataque da aplicação composta por **microsserviços desacoplados**, banco de dados **MariaDB**, cache/auditoria **Redis** e object storage **Garage S3**.

O objetivo foi avaliar a resistência do sistema contra ataques reais do **OWASP Top 10**, garantindo que:
1. Nenhuma ação no banco ou no storage ocorra sem a prévia autenticação e autorização estrita no servidor (Backend Enforcement).
2. Não existam brechas de injeção (SQLi/XSS), vazamento de credenciais ou sequestro de contas (IDOR / BOLA).
3. O armazenamento e entrega de arquivos no **Garage S3** operem em conformidade com o princípio do menor privilégio.

---

## 2. Matriz de Testes & Avaliação (OWASP Top 10:2021)

| Categoria OWASP | Teste Realizado | Status | Mecanismo de Defesa |
|---|---|:---:|---|
| **A01: Broken Access Control** | Tentativa de IDOR em `/perfil/:id/editar` | ✅ Aprovado | O backend confronta `req.userId` (extraído do JWT seguro) contra o parâmetro da URL. Tentativas de alterar dados de terceiros retornam **HTTP 403 Forbidden**. |
| **A01: Broken Access Control** | Acesso anônimo a rotas administrativas | ✅ Aprovado | Middleware `requireLogin` e `requireAdmin` barram requisições anônimas (401 para APIs, 302 para browsers). |
| **A01: Broken Access Control** | Exclusão de comentários alheios (BOLA) | ✅ Aprovado | O controller valida a posse do comentário no banco antes do `DELETE`. Somente o autor ou admins podem excluir. |
| **A02: Cryptographic Failures** | Hashing de senhas em repouso | ✅ Aprovado | Implementado com **bcrypt** com fator de custo `salt_rounds = 10`. Senhas em texto puro nunca são persistidas. |
| **A03: Injection** | SQL Injection em endpoints de Login e Cadastro | ✅ Aprovado | Uso integral de **Prepared Statements** com placeholders parametrizados (`?`) no driver `mysql2/promise`. |
| **A03: Injection** | Cross-Site Scripting (XSS) em comentários e bios | ✅ Aprovado | Escapamento contextual automático via tags EJS `<%= %>` que codificam entidades HTML (`<`, `>`, `&`, `"`). |
| **A07: Identification Failures** | Prevenção de Enumeração de Usuários | ✅ Aprovado | Rota `/forgot-password` retorna mensagem indistinta mesmo para e-mails não cadastrados no sistema. |
| **A07: Identification Failures** | Replay Attack em Tokens de Redefinição | ✅ Aprovado | Tokens possuem campo booleano `usado` e expiração de 30min; qualquer tentativa de reuso retorna **HTTP 410 Gone**. |
| **A08: Software & Data Integrity** | Path Traversal e Injeção de Arquivos Maliciosos | ✅ Aprovado | Nomes de arquivos no **Garage S3** são forçados via `randomUUID()`. Extensões são restritas a imagens (`jpeg`, `png`, `webp`, `gif`). |
| **A08: Software & Data Integrity** | Isolamento de Namespace no Bucket | ✅ Aprovado | Objetos são particionados por prefixo de usuário (`usuario-{id}/...`), eliminando riscos de colisão ou sobreposição. |
| **A09: Logging & Monitoring** | Trilha de Auditoria em Tempo Real | ✅ Aprovado | Todas as ações sensíveis (logins, falhas de autenticação, exclusão de comentários e edições de perfil) geram eventos no **Redis Streams via log-service**. |

---

## 3. Vulnerabilidades Identificadas e Corrigidas (Security Fixes)

Durante a inspeção minuciosa do código-fonte, a equipe de segurança identificou e **remediou imediatamente** duas fragilidades em potencial:

### 🛠️ Correção 1: Password Reset Poisoning (CWE-640)
* **Vulnerabilidade:** A rota `/forgot-password` permitia que uma requisição customizada enviasse um parâmetro arbitrário `resetBaseUrl`, o que poderia permitir a um atacante redirecionar o link de recuperação para um domínio malicioso.
* **Remediação:** O `auth-service` foi refatorado para ignorar URLs enviadas pelo cliente e forçar a utilização exclusiva da variável de ambiente confiável `CATALOG_PUBLIC_URL`.

### 🛠️ Correção 2: Hardening de Cookies de Sessão (CWE-614)
* **Vulnerabilidade:** Os cookies da sessão do Express não continham as diretivas explícitas de proteção contra CSRF e vazamento de sessão.
* **Remediação:** O `session()` do `catalogo-service` foi endurecido com as flags:
  ```javascript
  cookie: {
    httpOnly: true,                               // Impede acesso via JavaScript (mitigação contra roubo via XSS)
    sameSite: 'lax',                              // Proteção contra Cross-Site Request Forgery (CSRF)
    secure: process.env.NODE_ENV === 'production' // Requer HTTPS em ambiente de produção
  }
  ```

---

## 4. Como Executar a Suíte de Testes Automatizada

Foi desenvolvido um script dedicado que executa a auditoria completa de forma determinística:

```bash
# Executa a suíte de segurança completa no container em execução:
docker exec catalogo_service node owasp-security-suite.js
```

### Saída Esperada:
```text
======================================================================
🛡️  AUDITORIA AVANÇADA DE SEGURANÇA WEB (OWASP TOP 10)
    Avaliador: Senior Web Security Engineer
    Alvo: Microsserviços Catálogo Tom Hanks + Auth + Garage S3
======================================================================

--- 1. CONTROLE DE ACESSO E AUTORIZAÇÃO (OWASP A01) ---
✅ [APROVADO] [A01-BAC] Rotas administrativas exigem autenticação obrigatória
✅ [APROVADO] [A01-BAC] Prevenção de IDOR na edição de perfil
✅ [APROVADO] [A01-BAC] Autorização em nível de objeto (BOLA) em exclusão de comentários

--- 2. CRIPTOGRAFIA, AUTENTICAÇÃO E SESSÕES (OWASP A02 & A07) ---
✅ [APROVADO] [A02-CRYPTO] Armazenamento de senhas com algoritmo seguro (bcrypt com salt 10)
✅ [APROVADO] [A07-AUTH] Prevenção de Replay Attack em token de redefinição de senha
✅ [APROVADO] [A07-AUTH] Proteção contra enumeração de usuários em /forgot-password

--- 3. PREVENÇÃO DE INJEÇÃO (SQLi & XSS) (OWASP A03) ---
✅ [APROVADO] [A03-INJ] Resistência a SQL Injection em autenticação
✅ [APROVADO] [A03-INJ] Prevenção de XSS na camada de apresentação (EJS Contextual Escaping)

--- 4. SEGURANÇA DE UPLOAD E OBJECT STORAGE (GARAGE S3) ---
✅ [APROVADO] [A08-UPLOAD] Whitelist estrita de tipos MIME no upload de fotos
✅ [APROVADO] [A08-UPLOAD] Prevenção de Path Traversal via UUID aleatório
✅ [APROVADO] [A08-UPLOAD] Isolamento de Namespace por usuário (usuario-{userId}/<uuid>)

======================================================================
📊 SUMÁRIO: 100% DOS CONTROLES DEFENSIVOS APROVADOS
======================================================================
```
