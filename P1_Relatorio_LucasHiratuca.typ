// Relatório P1 — ISW055 (Computação em Nuvem) — FATEC Pompeia
// Orientador: Prof. Allan Lincoln Rodrigues Siriani
// Aluno: Lucas Tetsuya Hiratuca

#set document(
  title: "P1 — ISW055 — Lucas Tetsuya Hiratuca",
  author: "Lucas Tetsuya Hiratuca",
  date: datetime(year: 2026, month: 10, day: 7)
)

#set page(
  paper: "a4",
  margin: (x: 2.5cm, top: 2.5cm, bottom: 2.5cm),
  header: context {
    let page_num = counter(page).get().first()
    if page_num > 1 [
      #grid(
        columns: (1fr, 1fr),
        align: (left, right),
        text(size: 8.5pt, fill: luma(80))[ISW055 – P1 – Relatório bimestral],
        text(size: 8.5pt, fill: luma(80))[Lucas Tetsuya Hiratuca]
      )
      #v(-4pt)
      #line(length: 100%, stroke: 0.4pt + luma(180))
    ]
  },
  footer: context {
    let page_num = counter(page).get().first()
    if page_num > 1 [
      #align(center)[#text(size: 9pt, fill: luma(80))[#page_num]]
    ]
  }
)

#set text(
  font: "Libertinus Serif",
  lang: "pt",
  region: "BR",
  size: 10pt,
  spacing: 120%
)

#set par(
  justify: true,
  leading: 0.7em
)

#let print-placeholder(arquivo: none, legenda: "") = figure(
  if arquivo != none {
    image(arquivo, width: 100%)
  } else {
    rect(
      width: 100%,
      height: 6cm,
      fill: rgb("#f4f4f5"),
      stroke: (paint: rgb("#cbd5e1"), dash: "dashed"),
      radius: 4pt,
      align(center + horizon)[
        #text(fill: luma(110), size: 10pt, weight: "bold")[cole o print aqui] \
        #v(4pt)
        #text(fill: luma(130), size: 8.5pt)[`troque arquivo: none por arquivo: "prints/nome.png"`]
      ]
    )
  },
  caption: legenda
)

#let ficha-atividade(
  descricao: "",
  planejada: "",
  realizada: "",
  situacao: "entregue",
  evidencia: "",
  link: ""
) = {
  table(
    columns: (3.2cm, 1fr),
    stroke: 0.4pt + luma(180),
    fill: (col, row) => if row == 0 { rgb("#1e293b") } else if calc.even(row) { rgb("#f8fafc") } else { none },
    inset: (x: 8pt, y: 6pt),
    align: (col, row) => if row == 0 { center + horizon } else if col == 0 { left + top } else { left + top },
    table.cell(text(fill: white, weight: "bold", size: 8.5pt)[Campo]),
    table.cell(text(fill: white, weight: "bold", size: 8.5pt)[Valor]),

    text(weight: "bold", size: 8.5pt)[Descrição],
    text(size: 8.5pt)[#descricao],

    text(weight: "bold", size: 8.5pt)[Data planejada],
    text(size: 8.5pt)[#planejada],

    text(weight: "bold", size: 8.5pt)[Data realizada],
    text(size: 8.5pt)[#realizada],

    text(weight: "bold", size: 8.5pt)[Situação],
    text(size: 8.5pt, fill: rgb("#166534"), weight: "bold")[#situacao],

    text(weight: "bold", size: 8.5pt)[Evidência],
    text(size: 8.5pt)[#evidencia],

    text(weight: "bold", size: 8.5pt)[Link],
    text(size: 8pt)[`#link`]
  )
}

// ══════════════════════════════════════════════════════
// CAPA
// ══════════════════════════════════════════════════════

#align(center)[
  #v(2.5cm)
  #text(size: 13pt, weight: "bold", tracking: 1pt)[FATEC POMPEIA] \
  #v(0.2cm)
  #text(size: 10.5pt)[Introdução à Computação em Nuvem – ISW055 – 161_SIST. INTELIGENTES_N]

  #v(4.5cm)
  #text(size: 28pt, weight: "bold")[P1] \
  #v(0.3cm)
  #text(size: 18pt)[Relatório bimestral de atividades] \
  #v(0.2cm)
  #text(size: 11pt, fill: luma(80))[Avaliação individual – 2026.2]

  #v(4.5cm)
  #text(size: 14pt, weight: "bold")[Lucas Tetsuya Hiratuca]

  #v(3.5cm)
  #text(size: 10.5pt)[Prof. Allan Lincoln Rodrigues Siriani] \
  #v(0.1cm)
  #text(size: 10.5pt)[Pompeia, 07/10/2026]
]

#pagebreak()

// ══════════════════════════════════════════════════════
// SUMÁRIO
// ══════════════════════════════════════════════════════

#outline(
  title: [Sumário],
  depth: 2,
  indent: auto
)

#pagebreak()

// ══════════════════════════════════════════════════════
// 1 INTRODUÇÃO
// ══════════════════════════════════════════════

= Introdução

A disciplina *ISW055 – Introdução à Computação em Nuvem*, ministrada pelo Prof. Allan Lincoln Rodrigues Siriani na FATEC Pompeia no semestre letivo 2026.2, tem como propósito central proporcionar aos alunos a vivência prática e conceitual na construção, conteinerização e orquestração de aplicações modernas para ambientes em nuvem.

O projeto condutor ao longo deste primeiro bimestre foi o desenvolvimento e a evolução do *Catálogo de Filmes de Tom Hanks*. Partindo de uma arquitetura inicial monolítica, a solução progrediu de forma incremental para uma infraestrutura desacoplada em microsserviços conteinerizados com Docker. Foram incorporados requisitos reais de engenharia de software em nuvem: autenticação segura via JSON Web Tokens (JWT), controle de acesso baseado em papéis (RBAC), auditoria assíncrona de eventos com Redis Streams e persistência de mídia em object storage compatível com S3 (Garage S3).

Este relatório bimestral documenta minuciosamente as seis atividades propostas e entregues, detalhando as decisões de arquitetura adotadas, as dificuldades técnicas superadas, as evidências de entrega com carimbo temporal no Git e os resultados operacionais comprovados do sistema.

= Metodologia

Todas as atividades foram desenvolvidas com controle de versão via Git em repositórios públicos no GitHub. As datas e os horários de entrega foram rigorosamente extraídos do histórico de commits (`git log`) e conferidos diretamente na interface web do GitHub, garantindo rastreabilidade e imutabilidade das comprovações.

O ambiente de execução e teste foi estruturado com *Docker Desktop* e *Docker Compose*, padronizando os contêineres entre os ambientes de desenvolvimento e produção. O deploy final em nuvem é gerenciado via *Portainer* no servidor disponibilizado pelo orientador (`lucas-hiratuca-isw055.lapps.studio`), exposto por túnel seguro Cloudflare. As imagens oficiais foram publicadas no Docker Hub no namespace `lucashiratuca/`.

Os testes de conformidade e segurança foram realizados com suítes automatizadas locais e no contêiner, inspecionando o cumprimento das diretrizes do OWASP Top 10:2021.

= Quadro de entregas

#table(
  columns: (0.9cm, 3.8cm, 5.2cm, 2.3cm, 2.5cm, 1.8cm),
  stroke: 0.4pt + luma(180),
  fill: (col, row) => if row == 0 { rgb("#1e293b") } else if calc.even(row) { rgb("#f8fafc") } else { none },
  inset: (x: 5pt, y: 6pt),
  align: (col, row) => if row == 0 { center + horizon } else if col == 0 or col >= 3 { center + horizon } else { left + horizon },
  table.cell(text(fill: white, weight: "bold", size: 8pt)[Nº]),
  table.cell(text(fill: white, weight: "bold", size: 8pt)[Atividade]),
  table.cell(text(fill: white, weight: "bold", size: 8pt)[Descrição]),
  table.cell(text(fill: white, weight: "bold", size: 8pt)[Data planejada]),
  table.cell(text(fill: white, weight: "bold", size: 8pt)[Data realizada]),
  table.cell(text(fill: white, weight: "bold", size: 8pt)[Situação]),

  [1], [Agenda telefônica em Flask], [Nivelamento em sala: sistema monolítico Flask + Jinja com persistência em MariaDB.], [07/08/2026], [07/08/2026 20:03], text(fill: rgb("#166534"), weight: "bold")[entregue],
  [2], [Catálogo de filmes – Tom Hanks], [Consumo da API TMDB, persistência em MariaDB e segregação por usuário.], [20/08/2026], [20/08/2026 20:54], text(fill: rgb("#166534"), weight: "bold")[entregue],
  [3], [Desacoplando o login – microsserviço de autenticação], [Login, cadastro e esqueci-minha-senha num serviço à parte na rede interna do Docker.], [28/08/2026], [27/08/2026 13:00], text(fill: rgb("#166534"), weight: "bold")[entregue],
  [4], [Controle de acesso por papel – RBAC], [O campo role passa a decidir permissões reais no backend (403 para usuário comum).], [04/09/2026], [01/09/2026 00:48], text(fill: rgb("#166534"), weight: "bold")[entregue],
  [5], [Logs e auditoria], [Novo log-service com Redis registrando login, ações sensíveis e tentativas negadas.], [25/09/2026], [08/09/2026 12:57], text(fill: rgb("#166534"), weight: "bold")[entregue],
  [6], [Upload e perfil de usuário], [Página de perfil com avatar no Garage S3; só a referência fica no banco relacional.], [02/10/2026], [26/09/2026 14:43], text(fill: rgb("#166534"), weight: "bold")[entregue],
)

#v(0.4cm)

= Atividades realizadas

== Atividade 1 – Agenda telefônica em Flask

#ficha-atividade(
  descricao: "Nivelamento em sala: sistema monolítico Flask + Jinja com persistência em banco de dados MariaDB na nuvem.",
  planejada: "07/08/2026",
  realizada: "07/08/2026 20:03",
  situacao: "entregue",
  evidencia: "GitHub – commits 28230dc e 738ce73 + README com menção ao professor + print do sistema",
  link: "https://github.com/LucasHiratuca/aula_01_cloud"
)

*O que foi feito.* Durante a aula inicial de nivelamento, foi desenvolvida uma aplicação web em Python utilizando o framework Flask e o motor de templates Jinja2. A aplicação implementa um CRUD de contatos telefônicos conectado a uma instância remota do MariaDB hospedada no IP `35.226.64.52`.

Como decisão técnica, a camada de acesso a dados foi isolada utilizando a biblioteca `PyMySQL`, configurando codificação `utf8mb4` e tratamento de erros de conexão. Posteriormente, foi aplicado saneamento de credenciais via variáveis de ambiente com arquivo `.gitignore` (commit `fa5f58d`).

#print-placeholder(arquivo: none, legenda: [Atividade 1 – evidência da entrega (link, data e hora visíveis)])

#print-placeholder(arquivo: none, legenda: [Atividade 1 – resultado (o sistema/mapa/artigo funcionando)])

*Dificuldades e como foram resolvidas.* A principal dificuldade inicial consistiu na latência e na autenticação segura contra a base de dados remota do laboratório. O problema foi sanado com o correto ajuste da porta MySQL e a parametrização das variáveis no ambiente local.

#pagebreak()

== Atividade 2 – Catálogo de filmes – Tom Hanks

#ficha-atividade(
  descricao: "Consumo da API TMDB, persistência em MariaDB e segregação por usuário com sistema de favoritos.",
  planejada: "20/08/2026",
  realizada: "20/08/2026 20:54",
  situacao: "entregue",
  evidencia: "GitHub – commit 9a57391 + README com menção ao professor + print do catálogo",
  link: "https://github.com/LucasHiratuca/Entrega-da-Atividade/commit/9a57391"
)

*O que foi feito.* Criação da aplicação principal do projeto utilizando Node.js, Express e EJS. A aplicação consome a API pública do The Movie Database (TMDB), filtrando e exibindo a filmografia completa do ator Tom Hanks com posters, títulos originais, sinopses e notas de avaliação.

Foi construído o sistema de autenticação local com `express-session` e senhas criptografadas com `bcryptjs`. Adicionalmente, foi implementada a funcionalidade de filmes favoritos vinculada ao ID do usuário autenticado no MariaDB, segregando a lista de favoritos por sessão ativa.

#print-placeholder(arquivo: none, legenda: [Atividade 2 – evidência da entrega (link, data e hora visíveis)])

#print-placeholder(arquivo: none, legenda: [Atividade 2 – resultado (o sistema/mapa/artigo funcionando)])

*Dificuldades e como foram resolvidas.* A API do TMDB utiliza paginação de resultados. Para garantir que toda a filmografia do ator fosse renderizada sem cortes, foi implementada uma rotina assíncrona que itera sobre as páginas da API e consolida os dados em memória antes da renderização EJS.

#pagebreak()

== Atividade 3 – Desacoplando o login – microsserviço de autenticação

#ficha-atividade(
  descricao: "Login, cadastro e esqueci-minha-senha num serviço à parte na rede interna do Docker.",
  planejada: "28/08/2026",
  realizada: "27/08/2026 13:00",
  situacao: "entregue",
  evidencia: "GitHub – commit 320028a + docker-compose.yml + print do login funcionando",
  link: "https://github.com/LucasHiratuca/Entrega-da-Atividade/commit/320028a"
)

*O que foi feito.* A arquitetura do sistema foi refatorada sob o padrão Backend-for-Frontend (BFF). O serviço de catálogo (`catalogo-service`) foi mantido como único ponto de entrada público (porta 8217), enquanto toda a lógica de identidade, login, cadastro de novos usuários e redefinição de senha foi isolada no novo `auth-service` (porta interna 4000).

O `auth-service` não expõe portas ao host, comunicando-se exclusivamente pela rede interna Docker `app_network`. Ele emite tokens JWT criptograficamente assinados contendo a identidade do usuário. O fluxo de recuperação de senha foi integrado ao serviço SMTP do Mailtrap para despacho de e-mails com tokens descartáveis com expiração de 30 minutos.

#print-placeholder(arquivo: none, legenda: [Atividade 3 – evidência da entrega (link, data e hora visíveis)])

#print-placeholder(arquivo: none, legenda: [Atividade 3 – resultado (o sistema/mapa/artigo funcionando)])

*Dificuldades e como foram resolvidas.* Ajustar a comunicação segura entre contêineres na mesma rede virtual do Docker Compose sem depender de IPs estáticos. A resolução foi alcançada utilizando os nomes dos serviços como hostnames DNS internos do Docker (`http://auth-service:4000`).

#pagebreak()

== Atividade 4 – Controle de acesso por papel – RBAC

#ficha-atividade(
  descricao: "O campo role passa a decidir permissões reais no backend (403 para usuário comum).",
  planejada: "04/09/2026",
  realizada: "01/09/2026 00:48",
  situacao: "entregue",
  evidencia: "GitHub – commits 6636f4d e a8e31ef + print do 403 e da ação de admin",
  link: "https://github.com/LucasHiratuca/Entrega-da-Atividade/commit/6636f4d"
)

*O que foi feito.* Implementou-se o modelo de autorização Role-Based Access Control (RBAC) adotando o Padrão B (claims embutidas diretamente no payload do JWT). O campo `role` (`usuario` ou `admin`) trafega assinado no token, permitindo verificação instantânea no `catalogo-service` sem overhead de consultas repetidas ao banco de dados.

Foram criados os middlewares `requireLogin` e `requireAdmin`. Usuários autenticados com perfil comum têm acesso restrito ao catálogo, favoritos e comentários próprios. Tentativas de acessar rotas de moderação ou painel de gestão de usuários (`/admin/usuarios`) são barradas com status HTTP 403 Forbidden diretamente na camada do servidor.

#print-placeholder(arquivo: none, legenda: [Atividade 4 – evidência da entrega (link, data e hora visíveis)])

#print-placeholder(arquivo: "outputs/admin_output.png", legenda: [Atividade 4 – resultado (painel de administração de usuários e RBAC em funcionamento)])

*Dificuldades e como foram resolvidas.* Garantir que tipos de dados inteiros para `userId` não causassem falhas na comparação estrita (`===`) no JavaScript. Foi adotado parsing consistente com `parseInt()` em todos os middlewares e controladores de permissão.

#pagebreak()

== Atividade 5 – Logs e auditoria

#ficha-atividade(
  descricao: "Novo log-service com Redis registrando login, ações sensíveis e tentativas negadas.",
  planejada: "25/09/2026",
  realizada: "08/09/2026 12:57",
  situacao: "entregue",
  evidencia: "GitHub – commits e6c6682 e 8bc9faa + print da consulta de logs pelo admin",
  link: "https://github.com/LucasHiratuca/Entrega-da-Atividade/commit/e6c6682"
)

*O que foi feito.* Foi introduzido um terceiro microsserviço dedicado, o `log-service` (porta 5000), acoplado a uma instância do Redis 7. O serviço implementa ingestão assíncrona de eventos via HTTP POST, persistindo as entradas de auditoria na estrutura de alta performance Redis Streams.

O `catalogo-service` consome o utilitário de auditoria registrando eventos críticos: logins com sucesso, encerramentos de sessão, falhas de autenticação, exclusão de comentários e edições de perfil. A interface `/admin/logs` foi criada com restrição exclusiva a administradores para visualização e filtragem cronológica reversa dos registros em tempo real.

#print-placeholder(arquivo: none, legenda: [Atividade 5 – evidência da entrega (link, data e hora visíveis)])

#print-placeholder(arquivo: "outputs/logs_output.png", legenda: [Atividade 5 – resultado (tela de consulta de logs de auditoria via Redis Streams)])

*Dificuldades e como foram resolvidas.* Garantir a sobrevivência dos logs a reinicializações de contêineres. Foi configurado um volume nomeado persistente para o contêiner do Redis no `docker-compose.yml`, além de timeout não-bloqueante no envio de logs para evitar impacto na experiência do usuário final caso o Redis ficasse temporariamente indisponível.

#pagebreak()

== Atividade 6 – Upload e perfil de usuário

#ficha-atividade(
  descricao: "Página de perfil com avatar no Garage S3; só a referência fica no banco relacional.",
  planejada: "02/10/2026",
  realizada: "26/09/2026 14:43",
  situacao: "entregue",
  evidencia: "GitHub – commits 4219f05, 27856a8 e 8ca3fb6 + print do perfil com foto + SECURITY_AUDIT.md",
  link: "https://github.com/LucasHiratuca/Entrega-da-Atividade/commit/27856a8"
)

*O que foi feito.* Construção da página de perfil com suporte a upload de foto de avatar persistida em object storage. Foi integrado o *Garage S3* (`dxflrs/garage:v1.0.1`), um engine leve e distribuído escrito em Rust compatível com AWS S3 API (Signature V4). A tabela `perfis` no MariaDB armazena apenas a biografia e a chave textual do objeto (`foto_key`), desacoplando o binário do banco relacional.

A entrega da imagem foi arquitetada via *streaming seguro pelo backend* (`/perfil/:userId/foto`): o `catalogo-service` obtém o stream do Garage S3 via rede interna e o devolve ao navegador com cabeçalhos HTTP adequados (`Content-Type` validado e `Cache-Control`). O upload exige validação de MIME type (JPEG/PNG/WebP/GIF), limite de 5MB e geração de nomes via `randomUUID()`. Foi realizada ainda auditoria OWASP Top 10 com 100% de aprovação e remediação do CWE-640 (Password Reset Poisoning).

#print-placeholder(arquivo: none, legenda: [Atividade 6 – evidência da entrega (link, data e hora visíveis)])

#print-placeholder(arquivo: "outputs/foto_perfil.png", legenda: [Atividade 6 – resultado (perfil do usuário exibindo foto de avatar carregada do Garage S3 e bio)])

*Dificuldades e como foram resolvidas.* Em outubro de 2025, a imagem oficial do MinIO foi descontinuada do Docker Hub, motivando a migração definitiva para o Garage S3. Além disso, URLs pré-assinadas geravam links com o host interno do contêiner (`garage:3900`), inacessível aos navegadores dos clientes. A substituição por streaming direto no backend resolveu a compatibilidade universalmente em ambientes locais e Cloudflare.

#pagebreak()

// ══════════════════════════════════════════════════════
// 5 CONSIDERAÇÕES FINAIS
// ══════════════════════════════════════════════

= Considerações finais

O percurso de desenvolvimento percorrido ao longo do primeiro bimestre de ISW055 permitiu consolidar na prática os fundamentos de arquiteturas em nuvem modernas. A transição de um script inicial monolítico em Python para um ecossistema completo composto por microsserviços conteinerizados em Node.js, mensageria com Redis e storage compatível com S3 proporcionou um aprendizado expressivo sobre segregação de responsabilidades e resiliência.

A maior complexidade encontrada ocorreu na Atividade 6, onde a descontinuidade do MinIO no Docker Hub exigiu adaptabilidade imediata para selecionar, configurar e implantar o Garage S3 em Rust, ajustando o layout de cluster e o roteamento interno de rede. Essa experiência evidenciou o valor de adotar padrões abertos de mercado (como a S3 API), permitindo trocar a engine de armazenamento sem alterar as rotas da aplicação.

Como aprendizado contínuo, destaca-se a relevância de conceber sistemas com foco em segurança desde a camada de design (Security by Design). A auditoria baseada no OWASP Top 10 permitiu antecipar vetores de ataque como enumeração de credenciais e envenenamento de links. Para o segundo bimestre, pretende-se aprofundar na instrumentação de métricas com Prometheus e automação de pipelines de entrega contínua (CI/CD).

= Declaração de autoria

Declaro que este relatório foi elaborado por mim, individualmente, e que as evidências apresentadas correspondem a entregas de minha autoria, verificáveis nos links informados. Nas atividades realizadas em grupo, o conteúdo aqui descrito refere-se à minha participação.

#v(3.5cm)

#grid(
  columns: (1fr, 1fr),
  align: (left, right),
  [
    #line(length: 6.5cm, stroke: 0.6pt + luma(80))
    #text(weight: "bold")[Lucas Tetsuya Hiratuca]
  ],
  [
    #v(10pt)
    Pompeia, 07/10/2026
  ]
)
