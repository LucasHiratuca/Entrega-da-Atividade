# 🎬 Catálogo de Filmes — Tom Hanks

Aplicação web que consome a API do [TMDB](https://www.themoviedb.org/) para listar filmes com Tom Hanks e permite que cada usuário cadastrado favorite e comente filmes de forma isolada.

Desenvolvido para a disciplina **ISW055** — Professor **@siriani**.

## 🚀 Funcionalidades

- **Cadastro e Login** de usuários com senha criptografada (bcrypt).
- **Consumo de API:** Listagem de filmes do Tom Hanks com pôster, título e sinopse vindos diretamente e ao vivo da TMDB, sem salvar o catálogo no banco.
- **Persistência:** Favoritar/desfavoritar e comentar filmes (salvos no MariaDB individual).
- **Isolamento total:** Cada usuário só vê seus próprios favoritos e comentários (Filtro por `usuario_id`).
- **Segurança:** Nenhuma credencial (TMDB ou MariaDB) está exposta no código-fonte ou no frontend.

## 🛠️ Tecnologias

- **Backend:** Node.js + Express
- **Template Engine:** EJS (Server-side rendering)
- **Banco de Dados:** MariaDB
- **API Externa:** TMDB API v3
- **Autenticação:** express-session + bcrypt
- **Deploy:** Docker + Docker Compose

## 💻 Como rodar localmente

1. Clone o repositório:
   ```bash
   git clone https://github.com/SEU_USUARIO/catalogo-tom-hanks.git
   cd catalogo-tom-hanks
   ```

2. Crie seu arquivo de variáveis de ambiente com base no template:
   ```bash
   cp .env.example .env
   ```
   *Abra o `.env` e preencha com a sua `TMDB_API_KEY` e os dados do seu MariaDB.*

3. Instale as dependências e inicie a aplicação:
   ```bash
   npm install
   npm start
   ```
   *O banco de dados e as tabelas serão criadas automaticamente ao iniciar o servidor.*

## 🐳 Deploy no Portainer (via Stacks / Docker Compose)

A forma recomendada de publicar a aplicação no Portainer é utilizando a aba **Stacks**.

1. No Portainer, vá em **Stacks > Add stack**.
2. Selecione **Repository** e cole a URL deste repositório GitHub.
3. No campo **Compose path**, deixe como `docker-compose.yml`.
4. Em **Environment variables**, adicione todas as variáveis necessárias (TMDB, host, porta, senha do banco, etc).
5. Certifique-se de que a porta mapeada no compose seja exatamente a porta reservada para você pelo professor.
6. Clique em **Deploy the stack**.

### Alternativa: Docker Hub

Se preferir enviar a imagem para o Docker Hub antes de puxar no Portainer:

```bash
# Fazer login
docker login

# Criar a imagem (substitua pelo seu usuário do Docker Hub)
docker build -t seu_usuario/catalogo-tom-hanks:latest .

# Enviar para o Docker Hub
docker push seu_usuario/catalogo-tom-hanks:latest
```
*Lembre-se de alterar o `docker-compose.yml` para usar a sua `image` em vez de `build: .` se for seguir por esse caminho.*
