# 🎬 Catálogo de Filmes — Tom Hanks

Aplicação web que consome a API do [TMDB](https://www.themoviedb.org/) para listar filmes com Tom Hanks e permite que cada usuário cadastrado favorite e comente filmes de forma isolada.

Desenvolvido para a disciplina **ISW055** — Professor [**@siriani**](https://github.com/siriani).

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

