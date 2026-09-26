"""
Gera o relatório P1 (ISW055) preenchido com o contexto real do projeto
Catálogo Tom Hanks — LucasHiratuca/Entrega-da-Atividade

Execute com:  python gerar_relatorio_p1.py
Saída:        P1_Relatorio_LucasHiratuca.pdf
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable,
    PageBreak, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY

# ─────────────────────────────────────────────────────────────
# DADOS DO ALUNO — edite se necessário
# ─────────────────────────────────────────────────────────────
NOME_ALUNO = "Lucas Hiratuca"
DATA_ENTREGA = "07/10/2026"
REPO_CATALOGO = "https://github.com/LucasHiratuca/Entrega-da-Atividade"
REPO_AULA01  = "https://github.com/LucasHiratuca/aula_01_cloud"

# ─────────────────────────────────────────────────────────────
# ESTILOS
# ─────────────────────────────────────────────────────────────
doc = SimpleDocTemplate(
    "P1_Relatorio_LucasHiratuca.pdf",
    pagesize=A4,
    leftMargin=3*cm, rightMargin=2*cm,
    topMargin=2.5*cm, bottomMargin=2.5*cm,
    title=f"ISW055 — P1 — Relatório Bimestral — {NOME_ALUNO}",
    author=NOME_ALUNO,
    subject="Relatório Bimestral ISW055 — Catálogo Tom Hanks",
)

styles = getSampleStyleSheet()

AZUL  = colors.HexColor("#1a3a5c")
CINZA = colors.HexColor("#4a4a4a")
AMBAR = colors.HexColor("#f59e0b")
CLARO = colors.HexColor("#f5f5f5")

titulo_capa  = ParagraphStyle("titulo_capa",  parent=styles["Title"],
                               fontName="Helvetica-Bold", fontSize=22,
                               textColor=AZUL, leading=28, alignment=TA_CENTER, spaceAfter=8)
subtit_capa  = ParagraphStyle("subtit_capa",  parent=styles["Normal"],
                               fontName="Helvetica", fontSize=13,
                               textColor=CINZA, leading=18, alignment=TA_CENTER, spaceAfter=6)
secao        = ParagraphStyle("secao",        parent=styles["Heading1"],
                               fontName="Helvetica-Bold", fontSize=13,
                               textColor=AZUL, leading=18, spaceAfter=4, spaceBefore=14)
subsecao     = ParagraphStyle("subsecao",     parent=styles["Heading2"],
                               fontName="Helvetica-Bold", fontSize=11,
                               textColor=AZUL, leading=16, spaceAfter=4, spaceBefore=10)
corpo        = ParagraphStyle("corpo",        parent=styles["Normal"],
                               fontName="Helvetica", fontSize=10,
                               textColor=CINZA, leading=15, spaceAfter=6,
                               alignment=TA_JUSTIFY)
mono         = ParagraphStyle("mono",         parent=styles["Code"],
                               fontName="Courier", fontSize=8.5,
                               textColor=CINZA, leading=12, spaceAfter=4,
                               backColor=CLARO, borderPadding=4)
aviso        = ParagraphStyle("aviso",        parent=styles["Normal"],
                               fontName="Helvetica-BoldOblique", fontSize=9,
                               textColor=colors.HexColor("#b45309"),
                               backColor=colors.HexColor("#fef3c7"),
                               borderPadding=6, leading=14,
                               borderColor=AMBAR, borderWidth=1,
                               spaceAfter=8)
rodape_capa  = ParagraphStyle("rodape_capa",  parent=styles["Normal"],
                               fontName="Helvetica", fontSize=10,
                               textColor=CINZA, alignment=TA_CENTER, leading=16)

def p(texto, estilo=corpo):
    return Paragraph(texto, estilo)

def sp(n=6):
    return Spacer(1, n)

def hr():
    return HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#d1d5db"),
                      spaceBefore=6, spaceAfter=6)

def ficha(descricao, planejada, realizada, situacao, evidencia, link):
    data = [
        ["Campo", "Valor"],
        ["Descrição",      descricao],
        ["Data planejada", planejada],
        ["Data realizada", realizada],
        ["Situação",       situacao],
        ["Evidência",      evidencia],
        ["Link",           link],
    ]
    t = Table(data, colWidths=[3.8*cm, 12*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND",   (0,0), (-1,0), AZUL),
        ("TEXTCOLOR",    (0,0), (-1,0), colors.white),
        ("FONTNAME",     (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE",     (0,0), (-1,0), 9),
        ("BACKGROUND",   (0,1), (0,-1), colors.HexColor("#e8eef5")),
        ("FONTNAME",     (0,1), (0,-1), "Helvetica-Bold"),
        ("FONTSIZE",     (0,1), (-1,-1), 9),
        ("TEXTCOLOR",    (0,1), (-1,-1), CINZA),
        ("ROWBACKGROUNDS",(0,1),(-1,-1),[colors.white, CLARO]),
        ("GRID",         (0,0), (-1,-1), 0.4, colors.HexColor("#d1d5db")),
        ("VALIGN",       (0,0), (-1,-1), "TOP"),
        ("TOPPADDING",   (0,0), (-1,-1), 4),
        ("BOTTOMPADDING",(0,0), (-1,-1), 4),
        ("LEFTPADDING",  (0,0), (-1,-1), 6),
        ("RIGHTPADDING", (0,0), (-1,-1), 6),
        ("FONTNAME",     (1,6), (1,6), "Courier"),
        ("FONTSIZE",     (1,6), (1,6), 8),
    ]))
    return t

def placeholder_print(numero, legenda):
    """Caixa cinza clara onde o aluno colará o print."""
    conteudo = (
        f"<b>[ PRINT {numero} — {legenda} ]</b><br/>"
        f"Veja as instruções ao final deste documento."
    )
    t = Table([[Paragraph(conteudo, ParagraphStyle(
        "ph", fontName="Helvetica-Oblique", fontSize=9,
        textColor=colors.HexColor("#6b7280"), alignment=TA_CENTER, leading=14))]],
        colWidths=[15.8*cm], rowHeights=[2.8*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), colors.HexColor("#f3f4f6")),
        ("BOX",        (0,0), (-1,-1), 1, colors.HexColor("#d1d5db")),
        ("VALIGN",     (0,0), (-1,-1), "MIDDLE"),
    ]))
    return t

# ─────────────────────────────────────────────────────────────
# CONSTRUÇÃO DO DOCUMENTO
# ─────────────────────────────────────────────────────────────
story = []

# ══════════════════════════════════════════════
# CAPA
# ══════════════════════════════════════════════
story.append(sp(60))
story.append(p("FATEC POMPEIA", ParagraphStyle("inst", fontName="Helvetica-Bold",
               fontSize=14, textColor=AZUL, alignment=TA_CENTER, spaceAfter=4)))
story.append(p("Introdução à Computação em Nuvem — ISW055", subtit_capa))
story.append(sp(30))
story.append(p("P1", titulo_capa))
story.append(p("Relatório Bimestral de Atividades", subtit_capa))
story.append(p("Avaliação Individual — 2026.2", subtit_capa))
story.append(sp(50))
story.append(p(NOME_ALUNO, ParagraphStyle("nome_capa", fontName="Helvetica-Bold",
               fontSize=16, textColor=AZUL, alignment=TA_CENTER, spaceAfter=8)))
story.append(sp(10))
story.append(p("Prof. Allan Lincoln Rodrigues Siriani", rodape_capa))
story.append(sp(4))
story.append(p(f"Pompeia, {DATA_ENTREGA}", rodape_capa))
story.append(PageBreak())

# ══════════════════════════════════════════════
# SUMÁRIO (manual)
# ══════════════════════════════════════════════
story.append(p("Sumário", secao))
sumario = [
    "1  Introdução",
    "2  Metodologia",
    "3  Quadro de Entregas",
    "4  Atividades Realizadas",
    "    4.1  Atividade 1 — Agenda Telefônica em Flask",
    "    4.2  Atividade 2 — Catálogo de Filmes — Tom Hanks",
    "    4.3  Atividade 3 — Desacoplando o Login — Microsserviço de Autenticação",
    "    4.4  Atividade 4 — Controle de Acesso por Papel — RBAC",
    "    4.5  Atividade 5 — Logs e Auditoria",
    "    4.6  Atividade 6 — Upload e Perfil de Usuário (Garage S3)",
    "5  Considerações Finais",
    "6  Declaração de Autoria",
    "7  Guia de Prints — O Que o Aluno Deve Capturar",
]
for item in sumario:
    story.append(p(item, ParagraphStyle("sum", fontName="Helvetica", fontSize=10,
                   textColor=CINZA, leading=16, spaceAfter=2)))
story.append(PageBreak())

# ══════════════════════════════════════════════
# 1. INTRODUÇÃO
# ══════════════════════════════════════════════
story.append(p("1  Introdução", secao))
story.append(p(
    "A disciplina <b>ISW055 — Introdução à Computação em Nuvem</b>, ministrada pelo "
    "Prof. Allan Lincoln Rodrigues Siriani na FATEC Pompeia no segundo semestre de 2026, "
    "tem como proposta central conduzir o aluno por uma jornada incremental de desenvolvimento "
    "de software orientado à nuvem: partindo de uma aplicação monolítica simples, "
    "o projeto evolui, atividade após atividade, até uma arquitetura real de microsserviços "
    "com autenticação, controle de acesso, auditoria e armazenamento de objetos em nuvem."
))
story.append(p(
    "O fio condutor do bimestre foi o <b>Catálogo de Filmes de Tom Hanks</b> — uma aplicação web "
    "construída em Node.js/Express/EJS que consome a API pública do TMDB para exibir a filmografia "
    "completa do ator. Sobre essa base, cada atividade acrescentou uma camada de funcionalidade e "
    "segurança: cadastro e login com JWT, favoritos por usuário, comentários moderados, controle "
    "de acesso baseado em papel (RBAC), auditoria com Redis Streams e, por fim, perfil de usuário "
    "com upload de foto em object storage distribuído (Garage S3)."
))
story.append(p(
    "Este relatório documenta todas as seis atividades entregues, com datas, commits verificáveis "
    "no GitHub, descrição das decisões técnicas e indicação das evidências (prints) que comprovam "
    "o funcionamento de cada entrega. O repositório principal do projeto é "
    f"<b>LucasHiratuca/Entrega-da-Atividade</b> ({REPO_CATALOGO})."
))
story.append(hr())

# ══════════════════════════════════════════════
# 2. METODOLOGIA
# ══════════════════════════════════════════════
story.append(p("2  Metodologia", secao))
story.append(p(
    "Todas as atividades foram desenvolvidas em repositórios públicos no GitHub, com controle "
    "de versão via Git. A data e a hora de cada entrega foram extraídas do <b>histórico de commits</b> "
    "(<code>git log</code>) e conferidas na página do commit no GitHub, onde o timestamp é exibido "
    "publicamente e imutável."
))
story.append(p(
    "O ambiente de desenvolvimento utilizado foi <b>Docker Desktop no Windows 10/11</b>, com orquestração "
    "via <code>docker compose</code>. O deploy em produção é realizado via <b>Portainer</b> no servidor "
    "do professor (<code>lucas-hiratuca-isw055.lapps.studio</code>), exposto com Cloudflare Tunnel. "
    "As imagens Docker são publicadas no <b>Docker Hub</b> sob o namespace <code>lucashiratuca/</code>."
))
story.append(p(
    "Os prints foram coletados a partir das interfaces web em execução local (<code>localhost:8217</code>) "
    "ou em produção, mostrando: o README do repositório no GitHub com a menção ao professor, "
    "o sistema em funcionamento e, quando aplicável, o resultado de testes de segurança."
))
story.append(hr())

# ══════════════════════════════════════════════
# 3. QUADRO DE ENTREGAS
# ══════════════════════════════════════════════
story.append(p("3  Quadro de Entregas", secao))
quadro_header = ["Nº", "Atividade", "Data Planejada", "Data Realizada", "Situação"]
quadro_data = [quadro_header] + [
    ["1", "Agenda telefônica em Flask",                "07/08/2026", "07/08/2026 20:03", "entregue"],
    ["2", "Catálogo de filmes — Tom Hanks",            "20/08/2026", "20/08/2026 20:54", "entregue"],
    ["3", "Microsserviço de autenticação",             "28/08/2026", "27/08/2026 13:00", "entregue"],
    ["4", "Controle de acesso por papel — RBAC",       "04/09/2026", "01/09/2026 00:48", "entregue"],
    ["5", "Logs e auditoria com Redis",                "25/09/2026", "08/09/2026 12:57", "entregue"],
    ["6", "Upload e perfil — Garage S3",               "02/10/2026", "26/09/2026 14:43", "entregue"],
]
t_quadro = Table(quadro_data, colWidths=[1*cm, 5.5*cm, 3.2*cm, 3.5*cm, 2.6*cm])
t_quadro.setStyle(TableStyle([
    ("BACKGROUND",   (0,0), (-1,0), AZUL),
    ("TEXTCOLOR",    (0,0), (-1,0), colors.white),
    ("FONTNAME",     (0,0), (-1,0), "Helvetica-Bold"),
    ("FONTSIZE",     (0,0), (-1,0), 9),
    ("ALIGN",        (0,0), (-1,-1), "CENTER"),
    ("ALIGN",        (1,1), (1,-1), "LEFT"),
    ("FONTSIZE",     (0,1), (-1,-1), 9),
    ("TEXTCOLOR",    (0,1), (-1,-1), CINZA),
    ("ROWBACKGROUNDS",(0,1),(-1,-1),[colors.white, CLARO]),
    ("GRID",         (0,0), (-1,-1), 0.4, colors.HexColor("#d1d5db")),
    ("VALIGN",       (0,0), (-1,-1), "MIDDLE"),
    ("TOPPADDING",   (0,0), (-1,-1), 5),
    ("BOTTOMPADDING",(0,0), (-1,-1), 5),
    # Destaca situação
    ("TEXTCOLOR",    (4,1), (4,-1), colors.HexColor("#15803d")),
    ("FONTNAME",     (4,1), (4,-1), "Helvetica-Bold"),
]))
story.append(t_quadro)
story.append(sp(8))
story.append(p(
    "<i>Todas as datas foram extraídas do histórico de commits do Git e são verificáveis publicamente "
    "nas páginas de commit do repositório no GitHub.</i>",
    ParagraphStyle("nota", fontName="Helvetica-Oblique", fontSize=8.5,
                   textColor=colors.HexColor("#6b7280"), alignment=TA_CENTER)
))
story.append(PageBreak())

# ══════════════════════════════════════════════
# 4. ATIVIDADES REALIZADAS
# ══════════════════════════════════════════════
story.append(p("4  Atividades Realizadas", secao))

# ─── 4.1 Atividade 1 ─────────────────────────
story.append(p("4.1  Atividade 1 — Agenda Telefônica em Flask", subsecao))
story.append(ficha(
    descricao="Nivelamento em sala: sistema monolítico Flask + Jinja2 com persistência em banco de dados MySQL (MariaDB na nuvem).",
    planejada="07/08/2026",
    realizada="07/08/2026  20:03  (Commit 28230dc)",
    situacao="entregue",
    evidencia="Repositório público no GitHub com histórico de commits e README com menção ao professor.",
    link=f"{REPO_AULA01}",
))
story.append(sp(8))
story.append(p(
    "A Atividade 1 foi realizada integralmente durante a aula de nivelamento do dia 07/08/2026. "
    "Desenvolveu-se uma aplicação web em <b>Python/Flask</b> com templates <b>Jinja2</b> para cadastro "
    "e consulta de contatos telefônicos, com persistência em <b>MariaDB hospedado na nuvem</b> "
    "(servidor do professor em 35.226.64.52). O sistema foi versionado no repositório "
    "<code>LucasHiratuca/aula_01_cloud</code> e inclui: formulário de cadastro, listagem de contatos "
    "e conexão via <code>PyMySQL</code>."
))
story.append(p(
    "Decisão técnica relevante: optou-se por utilizar variáveis de ambiente para as credenciais do banco "
    "de dados (DSN), evitando expô-las no código-fonte. O commit de fix <code>fa5f58d</code> "
    "(14/09/2026) removeu credenciais que tinham sido expostas acidentalmente e adicionou <code>.gitignore</code>."
))
story.append(sp(6))
story.append(placeholder_print("1A", "Atividade 1 — Evidência: README do repo LucasHiratuca/aula_01_cloud no GitHub com commit visível e menção ao professor"))
story.append(sp(6))
story.append(placeholder_print("1B", "Atividade 1 — Resultado: tela da agenda telefônica em Flask com um contato cadastrado e listado"))
story.append(sp(6))
story.append(p(
    "<b>Dificuldades:</b> A configuração da conexão com o banco de dados remoto exigiu ajustes "
    "na string de conexão e no tratamento de encoding. Resolvida consultando a documentação do "
    "PyMySQL e ajustando o charset para utf8mb4."
))
story.append(PageBreak())

# ─── 4.2 Atividade 2 ─────────────────────────
story.append(p("4.2  Atividade 2 — Catálogo de Filmes — Tom Hanks", subsecao))
story.append(ficha(
    descricao="Consumo da API TMDB para exibir a filmografia de Tom Hanks, persistência em MariaDB e segregação por usuário com sistema de favoritos.",
    planejada="20/08/2026",
    realizada="20/08/2026  20:54  (Commit 9a57391)",
    situacao="entregue",
    evidencia="GitHub — commit 9a57391 + README com menção ao professor + print do catálogo em funcionamento.",
    link=f"{REPO_CATALOGO}/commit/9a57391",
))
story.append(sp(8))
story.append(p(
    "Nesta atividade foi criada a aplicação principal do projeto: um catálogo web em <b>Node.js/Express</b> "
    "com templates <b>EJS</b>, consumindo a <b>API REST do TMDB</b> para listar todos os filmes de "
    "Tom Hanks com poster, título, ano e nota. O sistema inclui cadastro e login de usuários "
    "com senhas em <b>bcrypt</b> e sessões com <code>express-session</code>, além de um sistema "
    "de <b>favoritos</b> persistido em MariaDB por usuário autenticado."
))
story.append(p(
    "A aplicação foi containerizada desde o início com <b>Docker</b> e <code>docker-compose.yml</code>, "
    "exposta na porta 8217. O banco de dados MariaDB na nuvem foi acessado diretamente pelo "
    "<code>catalogo-service</code>, com inicialização automática das tabelas no startup."
))
story.append(sp(6))
story.append(placeholder_print("2A", "Atividade 2 — Evidência: página do commit 9a57391 no GitHub (URL + timestamp visíveis)"))
story.append(sp(6))
story.append(placeholder_print("2B", "Atividade 2 — Resultado: tela do catálogo Tom Hanks com grid de filmes e posters carregados da API TMDB"))
story.append(sp(6))
story.append(p(
    "<b>Dificuldades:</b> A paginação da API TMDB retorna 20 filmes por página; foi necessário "
    "concatenar múltiplas requisições para obter a filmografia completa. Resolvido com um loop "
    "de <code>fetch</code> que acumula todas as páginas disponíveis."
))
story.append(PageBreak())

# ─── 4.3 Atividade 3 ─────────────────────────
story.append(p("4.3  Atividade 3 — Desacoplando o Login — Microsserviço de Autenticação", subsecao))
story.append(ficha(
    descricao="Separação do serviço de autenticação (login, cadastro, esqueci-minha-senha) num microsserviço isolado na rede interna do Docker.",
    planejada="28/08/2026",
    realizada="27/08/2026  13:00  (Commit 320028a)",
    situacao="entregue",
    evidencia="GitHub — commit 320028a + docker-compose.yml com auth-service sem portas públicas + print do login funcionando.",
    link=f"{REPO_CATALOGO}/commit/320028a",
))
story.append(sp(8))
story.append(p(
    "O sistema foi refatorado para o padrão <b>BFF (Backend For Frontend)</b>: o "
    "<code>catalogo-service</code> passou a ser o único serviço com porta exposta publicamente, "
    "enquanto o novo <code>auth-service</code> — executando na porta 4000 — opera "
    "<b>exclusivamente na rede interna Docker</b> (<code>app_network</code>), inacessível pela internet."
))
story.append(p(
    "O <code>auth-service</code> emite <b>tokens JWT</b> assinados com segredo compartilhado, "
    "gerencia as tabelas <code>usuarios</code> e <code>reset_tokens</code> no MariaDB, e envia "
    "e-mails reais de recuperação de senha via <b>Mailtrap</b> (SMTP). O <code>catalogo-service</code> "
    "valida o JWT a cada requisição protegida, sem tocar no banco de usuários diretamente."
))
story.append(sp(6))
story.append(placeholder_print("3A", "Atividade 3 — Evidência: commit 320028a no GitHub com docker-compose.yml mostrando auth-service sem ports públicas"))
story.append(sp(6))
story.append(placeholder_print("3B", "Atividade 3 — Resultado: tela de login do catálogo com autenticação funcionando (acesso ao catálogo após login)"))
story.append(sp(6))
story.append(p(
    "<b>Dificuldades:</b> A comunicação entre serviços via rede interna Docker exigiu entender "
    "a resolução de nomes por hostname de container. O token JWT precisou incluir o campo "
    "<code>userId</code> para identificar o usuário nas rotas do catálogo."
))
story.append(PageBreak())

# ─── 4.4 Atividade 4 ─────────────────────────
story.append(p("4.4  Atividade 4 — Controle de Acesso por Papel — RBAC", subsecao))
story.append(ficha(
    descricao="O campo role no JWT decide permissões reais no backend: HTTP 403 para usuário comum tentando ações de administrador.",
    planejada="04/09/2026",
    realizada="01/09/2026  00:48  (Commits 6636f4d e a8e31ef)",
    situacao="entregue",
    evidencia="GitHub — commits 6636f4d e a8e31ef + print do HTTP 403 e do painel admin funcionando.",
    link=f"{REPO_CATALOGO}/commit/6636f4d",
))
story.append(sp(8))
story.append(p(
    "Foi implementado o <b>Padrão B de RBAC</b>: as claims de papel (<code>role</code>) são embutidas "
    "diretamente no JWT pelo <code>auth-service</code>, permitindo que o <code>catalogo-service</code> "
    "tome decisões de autorização instantaneamente, sem consultas adicionais ao banco de dados."
))
story.append(p(
    "O middleware <code>requireAdmin</code> foi criado para proteger as rotas <code>/admin/*</code>. "
    "Usuários com <code>role: 'usuario'</code> recebem <b>HTTP 403 Forbidden</b> ao tentar acessar: "
    "painel de usuários (<code>/admin/usuarios</code>), moderação de comentários ou visualização de logs. "
    "Administradores têm acesso exclusivo a alterar o papel de outros usuários e excluir comentários alheios. "
    "O controle é realizado <b>100% no backend</b>, independentemente da interface."
))
story.append(sp(6))
story.append(placeholder_print("4A", "Atividade 4 — Evidência: commit 6636f4d ou a8e31ef no GitHub com timestamp visível"))
story.append(sp(6))
story.append(placeholder_print("4B", "Atividade 4 — Resultado: tela do painel admin (/admin/usuarios) e/ou tela de erro 403 ao tentar acessar como usuário comum"))
story.append(sp(6))
story.append(p(
    "<b>Dificuldades:</b> Garantir que o campo <code>userId</code> no JWT fosse sempre um inteiro "
    "(e não string) para comparação correta no backend. Resolvido com <code>parseInt()</code> "
    "explícito nas comparações de autorização."
))
story.append(PageBreak())

# ─── 4.5 Atividade 5 ─────────────────────────
story.append(p("4.5  Atividade 5 — Logs e Auditoria com Redis", subsecao))
story.append(ficha(
    descricao="Novo log-service com Redis 7 registrando eventos de login, ações sensíveis e tentativas negadas. Visualização restrita a administradores.",
    planejada="25/09/2026",
    realizada="08/09/2026  12:57  (Commits e6c6682 e 8bc9faa)",
    situacao="entregue",
    evidencia="GitHub — commits e6c6682 e 8bc9faa + print da consulta de logs pelo admin em /admin/logs.",
    link=f"{REPO_CATALOGO}/commit/e6c6682",
))
story.append(sp(8))
story.append(p(
    "Foi criado um terceiro microsserviço dedicado, o <code>log-service</code> (porta 5000), "
    "conectado a uma instância do <b>Redis 7</b>. O serviço expõe uma API REST interna que recebe "
    "eventos de auditoria via HTTP POST e os persiste em <b>Redis Streams</b> — a estrutura de dados "
    "ideal para logs imutáveis e sequenciais."
))
story.append(p(
    "O <code>catalogo-service</code> dispara logs assincronamente para o <code>log-service</code> "
    "em cada evento relevante: login com sucesso, logout, falha de autenticação, exclusão de "
    "comentário e edição de perfil. A rota <code>/admin/logs</code> lista os eventos em ordem "
    "cronológica inversa, protegida pelo middleware <code>requireAdmin</code>."
))
story.append(sp(6))
story.append(placeholder_print("5A", "Atividade 5 — Evidência: commit e6c6682 no GitHub com timestamp visível"))
story.append(sp(6))
story.append(placeholder_print("5B", "Atividade 5 — Resultado: tela /admin/logs mostrando eventos de auditoria em tempo real (login, logout, etc.)"))
story.append(sp(6))
story.append(p(
    "<b>Dificuldades:</b> A persistência dos logs no Redis exigiu entendimento da API de Streams "
    "(<code>XADD</code> / <code>XRANGE</code>). Inicialmente os logs somem ao recriar o container "
    "por falta de volume; resolvido declarando um volume nomeado para o Redis no compose."
))
story.append(PageBreak())

# ─── 4.6 Atividade 6 ─────────────────────────
story.append(p("4.6  Atividade 6 — Upload e Perfil de Usuário (Garage S3)", subsecao))
story.append(ficha(
    descricao="Página de perfil com avatar no Garage S3; o banco relacional guarda só a referência (foto_key). Auditoria OWASP Top 10 com 100% aprovado.",
    planejada="02/10/2026",
    realizada="26/09/2026  14:43  (Commits 4219f05, 27856a8, 8ca3fb6)",
    situacao="entregue",
    evidencia="GitHub — commits 4219f05, 27856a8, 8ca3fb6 + print do perfil com foto carregada + relatório SECURITY_AUDIT.md.",
    link=f"{REPO_CATALOGO}/commit/27856a8",
))
story.append(sp(8))
story.append(p(
    "Foi implementada a página de perfil de usuário com upload de foto armazenada no "
    "<b>Garage S3</b> (<code>dxflrs/garage:v1.0.1</code>), um object storage distribuído "
    "escrito em Rust, 100% compatível com a API S3 da AWS (Signature V4). "
    "O banco de dados MariaDB passou a armazenar apenas a <b>chave do objeto</b> (<code>foto_key</code>) "
    "na nova tabela <code>perfis</code>, jamais o binário da imagem."
))
story.append(p(
    "A exibição da foto é feita via <b>streaming seguro pelo backend</b>: a rota "
    "<code>/perfil/:userId/foto</code> do <code>catalogo-service</code> recupera o objeto do "
    "Garage S3 internamente e retransmite os bytes para o navegador com os cabeçalhos corretos "
    "(<code>Content-Type</code> e <code>Cache-Control: public, max-age=3600</code>). "
    "O bucket permanece 100% privado na rede interna do Docker."
))
story.append(p(
    "O upload é validado com <b>whitelist de tipos MIME</b> (jpeg, png, gif, webp), "
    "limite de <b>5MB</b> via Multer e nomes de objeto gerados com <code>randomUUID()</code> "
    "para prevenir path traversal. O controle de acesso garante que <b>somente o dono do perfil</b> "
    "pode editar — tentativas de editar perfis alheios retornam <b>HTTP 403</b> no backend."
))
story.append(p(
    "Ainda nesta atividade foi realizada uma auditoria completa de segurança seguindo a metodologia "
    "<b>OWASP Top 10:2021</b>, com suíte de testes automatizados (<code>owasp-security-suite.js</code>) "
    "e relatório detalhado em <code>SECURITY_AUDIT.md</code>. Duas vulnerabilidades foram identificadas "
    "e corrigidas: <b>CWE-640 Password Reset Poisoning</b> e <b>CWE-614 Session Cookie sem flags</b>."
))
story.append(sp(6))
story.append(placeholder_print("6A", "Atividade 6 — Evidência: commit 27856a8 no GitHub com timestamp visível e lista de arquivos alterados"))
story.append(sp(6))
story.append(placeholder_print("6B", "Atividade 6 — Resultado: tela /perfil/<id> com foto de avatar carregada e bio exibida"))
story.append(sp(6))
story.append(p(
    "<b>Dificuldades:</b> A imagem oficial do MinIO foi removida do Docker Hub em outubro de 2025, "
    "exigindo migração para o Garage S3. A exibição da foto via URL pré-assinada falhou porque a "
    "URL continha o hostname interno Docker (<code>minio:9000</code>), inacessível pelo navegador. "
    "A solução foi implementar a rota de streaming no backend, que resolve o problema definitivamente "
    "em qualquer ambiente (local, Portainer, Cloudflare)."
))
story.append(PageBreak())

# ══════════════════════════════════════════════
# 5. CONSIDERAÇÕES FINAIS
# ══════════════════════════════════════════════
story.append(p("5  Considerações Finais", secao))
story.append(p(
    "O primeiro bimestre de ISW055 foi uma experiência intensa e muito produtiva. Partir de uma "
    "aplicação monolítica Flask e chegar a uma arquitetura de microsserviços com autenticação JWT, "
    "RBAC, auditoria em tempo real e object storage distribuído foi um salto técnico considerável. "
    "Cada atividade foi entregue antes ou na data planejada, o que demonstra que o ritmo proposto "
    "pelo professor foi bem absorvido."
))
story.append(p(
    "A parte mais desafiadora foi a <b>Atividade 6</b>: a migração inesperada do MinIO para o "
    "Garage S3 (por remoção da imagem oficial do Docker Hub) e a depuração do problema das URLs "
    "internas do Docker. A solução de streaming pelo backend acabou sendo mais elegante do que "
    "a URL pré-assinada original, pois mantém o bucket privado e funciona em qualquer infraestrutura."
))
story.append(p(
    "O que levo para o próximo bimestre: a necessidade de testar a aplicação em cenários adversariais "
    "desde o início (security-first design). A auditoria OWASP revelou vulnerabilidades sutis "
    "(como o Password Reset Poisoning) que só foram descobertas por uma revisão sistemática do código. "
    "No P2, pretendo incorporar testes automatizados de segurança no próprio pipeline de desenvolvimento."
))
story.append(hr())

# ══════════════════════════════════════════════
# 6. DECLARAÇÃO DE AUTORIA
# ══════════════════════════════════════════════
story.append(p("6  Declaração de Autoria", secao))
story.append(p(
    "Declaro que este relatório foi elaborado por mim, individualmente, e que as evidências "
    "apresentadas correspondem a entregas de minha autoria, verificáveis nos links informados. "
    "Nas atividades realizadas em grupo, o conteúdo aqui descrito refere-se à minha participação."
))
story.append(sp(30))
story.append(Table([
    [Paragraph(f"<b>{NOME_ALUNO}</b>", corpo),
     Paragraph(f"Pompeia, {DATA_ENTREGA}", corpo)]
], colWidths=[8*cm, 7.8*cm]))
story.append(PageBreak())

# ══════════════════════════════════════════════
# 7. GUIA DE PRINTS — INSTRUÇÕES AO ALUNO
# ══════════════════════════════════════════════
story.append(p("7  Guia de Prints — O Que Você Deve Capturar", secao))
story.append(p(
    "Insira os prints diretamente neste PDF (ou numa versão Word/Google Docs) nos espaços "
    "indicados pelos blocos cinzas ao longo do documento. Cada print deve ser feito em alta "
    "resolução (recomendado: zoom do browser em 100%, resolução ≥ 1280×720).",
    corpo
))
story.append(sp(6))

instrucoes = [
    ("Print 1A", "Atividade 1 — Evidência",
     "1. Abra o browser.\n2. Acesse: https://github.com/LucasHiratuca/aula_01_cloud\n"
     "3. Role até a seção de commits. Clique em 'commits'.\n"
     "4. Capture a tela mostrando o commit '28230dc' com data '07/08/2026' e o README "
     "com o nome do professor visível.\n5. A URL da página deve estar visível na barra do browser."),

    ("Print 1B", "Atividade 1 — Sistema Funcionando",
     "1. Suba localmente o projeto da Atividade 1 (aula_01_cloud).\n"
     "2. Acesse http://localhost:5000 (ou a porta configurada).\n"
     "3. Cadastre um contato e faça uma busca.\n"
     "4. Capture a tela mostrando o formulário preenchido e a lista de contatos."),

    ("Print 2A", "Atividade 2 — Evidência",
     "1. Acesse: https://github.com/LucasHiratuca/Entrega-da-Atividade/commit/9a57391\n"
     "2. Capture a página inteira mostrando: hash do commit, data '20/08/2026 20:54', "
     "lista de arquivos alterados e a URL na barra do browser."),

    ("Print 2B", "Atividade 2 — Sistema Funcionando",
     "1. Suba a stack: docker compose up -d --build (no diretório catalogo-tom-hanks)\n"
     "2. Acesse: http://localhost:8217/filmes (faça login antes)\n"
     "3. Capture a tela com o grid de filmes do Tom Hanks, posters carregados e a navbar visível."),

    ("Print 3A", "Atividade 3 — Evidência",
     "1. Acesse: https://github.com/LucasHiratuca/Entrega-da-Atividade/commit/320028a\n"
     "2. Capture mostrando: data '27/08/2026 13:00', e o diff do docker-compose.yml "
     "com o auth-service SEM ports publicas."),

    ("Print 3B", "Atividade 3 — Sistema Funcionando",
     "1. Com a stack subida, acesse: http://localhost:8217/login\n"
     "2. Faça login com um usuário cadastrado.\n"
     "3. Capture a tela após o login mostrando que está autenticado (nome do usuário na navbar)."),

    ("Print 4A", "Atividade 4 — Evidência",
     "1. Acesse: https://github.com/LucasHiratuca/Entrega-da-Atividade/commit/6636f4d\n"
     "2. Capture mostrando: data '01/09/2026 00:48' e os arquivos modificados."),

    ("Print 4B", "Atividade 4 — RBAC em Ação",
     "Opção A (403): Faça login como usuário COMUM. Tente acessar http://localhost:8217/admin/usuarios. "
     "Capture a tela de erro HTTP 403.\n"
     "Opção B (Admin): Faça login como ADMIN. Acesse /admin/usuarios. "
     "Capture a lista de usuários com a opção de alterar roles."),

    ("Print 5A", "Atividade 5 — Evidência",
     "1. Acesse: https://github.com/LucasHiratuca/Entrega-da-Atividade/commit/e6c6682\n"
     "2. Capture mostrando: data '08/09/2026 12:57' e lista de arquivos (log-service/)."),

    ("Print 5B", "Atividade 5 — Logs em Ação",
     "1. Faça login como ADMIN.\n2. Acesse: http://localhost:8217/admin/logs\n"
     "3. Capture a tela mostrando os eventos de auditoria listados "
     "(login, logout, edição de perfil, etc.)."),

    ("Print 6A", "Atividade 6 — Evidência",
     "1. Acesse: https://github.com/LucasHiratuca/Entrega-da-Atividade/commit/27856a8\n"
     "2. Capture mostrando: data '26/09/2026 15:11', lista de arquivos (garage.toml, s3.js, perfil.js)."),

    ("Print 6B", "Atividade 6 — Perfil com Foto",
     "1. Com a stack subida e o Garage S3 inicializado (.\\ init-garage.ps1), faça login.\n"
     "2. Acesse: http://localhost:8217/perfil/<seu-id>/editar\n"
     "3. Faça upload de uma foto (JPEG/PNG) e salve.\n"
     "4. Acesse: http://localhost:8217/perfil/<seu-id>\n"
     "5. Capture a tela mostrando o avatar carregado, a bio e a grade de favoritos."),
]

for (titulo, subtitulo, instrucao) in instrucoes:
    story.append(KeepTogether([
        p(f"<b>{titulo} — {subtitulo}</b>", ParagraphStyle(
            "inst_titulo", fontName="Helvetica-Bold", fontSize=10,
            textColor=AZUL, spaceAfter=4, spaceBefore=10)),
        p(instrucao.replace("\n", "<br/>"),
          ParagraphStyle("inst_texto", fontName="Courier", fontSize=8.5,
                         textColor=CINZA, leading=13, spaceAfter=6,
                         backColor=CLARO, borderPadding=6)),
    ]))

story.append(sp(10))
story.append(p(
    "✅ Após inserir todos os prints, salve o arquivo como PDF e envie conforme instrução do professor.",
    ParagraphStyle("final", fontName="Helvetica-Bold", fontSize=10,
                   textColor=colors.HexColor("#15803d"), alignment=TA_CENTER,
                   spaceAfter=0)
))

# ──────────────── GERA PDF ────────────────────
doc.build(story)
print("✅  PDF gerado: P1_Relatorio_LucasHiratuca.pdf")
