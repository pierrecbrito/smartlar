import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def create_document():
    doc = Document()

    # Define margins (2 cm)
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.9)
        section.right_margin = Inches(0.9)

    # Styles & Colors
    PRIMARY_COLOR = RGBColor(27, 85, 155)    # #1b559b (Azul SmartLar)
    SECONDARY_COLOR = RGBColor(71, 85, 105)  # Slate 600
    TEXT_DARK = RGBColor(15, 23, 42)         # Slate 900
    MUTED_TEXT = RGBColor(100, 116, 139)     # Slate 500

    # Base font setup
    style_normal = doc.styles['Normal']
    font = style_normal.font
    font.name = 'Calibri'
    font.size = Pt(11)
    font.color.rgb = TEXT_DARK

    def set_cell_background(cell, hex_color):
        shading = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
        cell._tc.get_or_add_tcPr().append(shading)

    def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = OxmlElement('w:tcMar')
        for margin, value in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
            node = OxmlElement(f'w:{margin}')
            node.set(qn('w:w'), str(value))
            node.set(qn('w:type'), 'dxa')
            tcMar.append(node)
        tcPr.append(tcMar)

    # Title
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.LEFT
    run_title = p_title.add_run("SmartLar — Documento de Entrega do Projeto Técnico")
    run_title.font.name = 'Calibri'
    run_title.font.size = Pt(22)
    run_title.font.bold = True
    run_title.font.color.rgb = PRIMARY_COLOR
    p_title.paragraph_format.space_after = Pt(2)

    # Subtitle
    p_sub = doc.add_paragraph()
    run_sub = p_sub.add_run("Avaliação Prática — Sistema de Gestão de Vendas, Orçamentos e Instalações")
    run_sub.font.name = 'Calibri'
    run_sub.font.size = Pt(12)
    run_sub.font.italic = True
    run_sub.font.color.rgb = SECONDARY_COLOR
    p_sub.paragraph_format.space_after = Pt(14)

    # Header Card Info Table
    header_table = doc.add_table(rows=5, cols=2)
    header_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    header_data = [
        ("Candidato:", "Pierre Brito"),
        ("Aplicação em Produção (Deploy):", "https://smartlar-lac.vercel.app/"),
        ("Repositório GitHub:", "https://github.com/pierrecbrito/smartlar"),
        ("Banco de Dados & Auth:", "Supabase (PostgreSQL 16) — https://eyjfofrwjixirbuvvlmk.supabase.co"),
        ("Hospedagem & CI/CD:", "Vercel (Deploy contínuo via GitHub)")
    ]

    for i, (label, val) in enumerate(header_data):
        row = header_table.rows[i]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width = Inches(2.2)
        c1.width = Inches(4.5)
        set_cell_background(c0, "F1F5F9")
        set_cell_background(c1, "F8FAFC")
        set_cell_margins(c0, 60, 60, 100, 100)
        set_cell_margins(c1, 60, 60, 100, 100)

        p0 = c0.paragraphs[0]
        r0 = p0.add_run(label)
        r0.font.bold = True
        r0.font.size = Pt(9.5)
        r0.font.color.rgb = SECONDARY_COLOR

        p1 = c1.paragraphs[0]
        r1 = p1.add_run(val)
        r1.font.bold = (i in [0, 1, 2])
        r1.font.size = Pt(9.5)
        if i in [1, 2]:
            r1.font.color.rgb = PRIMARY_COLOR

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    def add_section_heading(number, title):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(16)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(f"{number}. {title}")
        run.font.name = 'Calibri'
        run.font.size = Pt(14)
        run.font.bold = True
        run.font.color.rgb = PRIMARY_COLOR

    def add_subsection_heading(title):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(title)
        run.font.name = 'Calibri'
        run.font.size = Pt(11.5)
        run.font.bold = True
        run.font.color.rgb = SECONDARY_COLOR

    def add_bullet(bold_prefix, text):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(2.5)
        p.paragraph_format.line_spacing = 1.15
        r_bold = p.add_run(bold_prefix + " ")
        r_bold.font.bold = True
        p.add_run(text)

    def add_callout(text, title="NOTA DE EVIDÊNCIA:"):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = tbl.cell(0, 0)
        cell.width = Inches(6.7)
        set_cell_background(cell, "EFF6FF")
        set_cell_margins(cell, 100, 100, 150, 150)
        p = cell.paragraphs[0]
        r_title = p.add_run(title + " ")
        r_title.font.bold = True
        r_title.font.size = Pt(9.5)
        r_title.font.color.rgb = PRIMARY_COLOR
        r_text = p.add_run(text)
        r_text.font.size = Pt(9.5)
        r_text.font.italic = True
        doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # =========================================================================
    # SEÇÃO 1
    # =========================================================================
    add_section_heading("1", "Link do Projeto Funcionando")
    
    p = doc.add_paragraph()
    p.add_run("A aplicação foi construída e empacotada com Vite + React 18 + TypeScript e está publicada com alta disponibilidade na Vercel:\n")
    r_link = p.add_run("👉 Link de Produção: https://smartlar-lac.vercel.app/\n")
    r_link.font.bold = True
    r_link.font.color.rgb = PRIMARY_COLOR

    add_subsection_heading("Credenciais de Acesso (Administrador Oficial):")
    add_bullet("E-mail:", "admin@smartlar.com.br")
    add_bullet("Senha:", "adminsmartlar2026")
    add_bullet("Políticas RLS:", "O acesso ao sistema exige autenticação obrigatória via Supabase Auth. Usuários deslogados são imediatamente direcionados à tela de login dedicada.")

    add_subsection_heading("Roteiro de Navegação e Validação dos Fluxos:")
    add_bullet("1. Dashboard Analítico:", "Cards com contadores e somatórios financeiros em tempo real (pedidos do mês, faturado, a receber e pendentes de agendamento), calculados no fuso oficial 'America/Sao_Paulo'.")
    add_bullet("2. Catálogo de Produtos:", "Listagem de produtos categorizados (segurança, controle, automação), estoque em tempo real e visualização adaptada para telas mobile e desktop.")
    add_bullet("3. Gestão de Clientes & Integração ViaCEP:", "Cadastro completo de clientes com preenchimento automático do endereço via consulta de CEP (ViaCEP) e visualização de rota no mapa GPS.")
    add_bullet("4. Novo Pedido / Orçamento (POS):", "Seleção pesquisável de clientes e produtos, steppers reativos de quantidade, congelamento de preço unitário e envio em transação atômica via Stored Procedure RPC.")
    add_bullet("5. Gestão de Pedidos (Kanban com Máquina de Estados):", "Fluxo estrito Orçamento ➔ Aprovado ➔ Agendado ➔ Em Andamento ➔ Concluído. Inclui modal obrigatório de agendamento com técnico e geração imediata de Proposta Comercial em PDF profissional com envio para WhatsApp.")
    add_bullet("6. Agenda Técnica (Estilo Google Calendar):", "Visão por Dia, Semana e Mês, com detecção e aviso visual automático de conflito de horários (intervalos inferiores a 2 horas para o mesmo técnico).")
    add_bullet("7. Experiência Mobile First:", "Menu inferior flutuante (BottomNav), cards verticais sem estouro de tela e notificações discretas no estilo Dynamic Island.")

    # =========================================================================
    # SEÇÃO 2
    # =========================================================================
    add_section_heading("2", "Link e Evidências do Supabase")
    p = doc.add_paragraph()
    p.add_run("O banco de dados relacional foi implementado no PostgreSQL 16 do Supabase com regras estritas de integridade referencial, triggers PL/pgSQL e isolamento de segurança:")

    add_subsection_heading("Estrutura das Tabelas e Relações:")
    add_bullet("clientes:", "Guarda identificação, telefone e endereço estruturado (cep, logradouro, numero, bairro, cidade, uf, ponto_referencia).")
    add_bullet("tecnicos:", "Cadastro dos profissionais de instalação com suas especialidades e contatos.")
    add_bullet("produtos:", "Catálogo com nome, categoria, preço unitário de tabela e controle de estoque.")
    add_bullet("pedidos:", "Tabela central com cliente_id (FK), tecnico_id (FK), status_pedido (ENUM com 6 estados), numero_pedido (Sequence sequencial), valor_total (recalculado por trigger) e congelamento de endereço.")
    add_bullet("itens_pedido:", "Tabela associativa (N:N) que implementa snapshot do preco_unitario no ato da compra e subtotal gerado pelo banco (generated always as (quantidade * preco_unitario) stored).")
    add_bullet("historico_status:", "Trilha de auditoria cronológica e imutável que registra automaticamente cada mudança de fase, usuário e timestamp.")

    add_subsection_heading("Políticas de Segurança (Row Level Security & Views):")
    add_bullet("RLS Estrito Ativo:", "Todas as 6 tabelas possuem RLS habilitado, garantindo que usuários não autenticados não consigam ler nem gravar dados diretamente.")
    add_bullet("Views com Security Invoker:", "As views v_dashboard_resumo, v_instalacoes e v_agenda_pedidos foram criadas com WITH (security_invoker = true), assegurando que respeitem as permissões do usuário logado e não executem como superusuário (UNRESTRICTED).")

    add_callout(
        "Insira aqui os 3 prints do Supabase Studio no seu documento: \n"
        "1. Table Editor mostrando a tabela 'pedidos' com os registros de teste (ex: Marina Costa totalizando R$ 1.080,00).\n"
        "2. Database > Schema Visualizer exibindo os relacionamentos (FKs) entre as 6 tabelas.\n"
        "3. Authentication > Users confirmando o usuário admin@smartlar.com.br ativo e verificado.",
        title="[ESPAÇO PARA PRINTS DO SUPABASE]"
    )

    # =========================================================================
    # SEÇÃO 3
    # =========================================================================
    add_section_heading("3", "Prints dos Workflows n8n e Evidências de Execução")
    p = doc.add_paragraph()
    p.add_run("As automações foram construídas no n8n aplicando princípios de idempotência, separação de credenciais e resiliência a condições de corrida:")

    add_subsection_heading("Automação 1: Notificação de Novo Pedido (Database Webhook)")
    add_bullet("Gatilho:", "Webhook do Supabase disparado imediatamente após o INSERT na tabela pedidos.")
    add_bullet("Padrão Re-Fetch:", "O n8n utiliza o ID recebido para realizar uma consulta autenticada via GET na REST API do Supabase, assegurando que os itens associados e o cliente já foram gravados e consolidados.")
    add_bullet("Ação:", "Nó Code formata os dados e envia notificação completa com o descritivo de produtos e valor total.")

    add_subsection_heading("Automação 2: Alerta Diário da Agenda de Instalações (Cron Job)")
    add_bullet("Gatilho:", "Agendamento cron configurado para disparar diariamente às 07:00 da manhã (fuso de Brasília).")
    add_bullet("Consulta com Timezone:", "Consulta a view v_instalacoes buscando os serviços agendados para o dia seguinte (startOf('day') + 1d até endOf('day') + 1d).")
    add_bullet("Ação:", "Agrupa os pedidos por técnico e gera o relatório matinal detalhando rotas, telefones dos clientes e ferramentas especiais necessárias (ex: escada alta para câmeras externas).")

    add_subsection_heading("Automação 3 (Bônus): Registro de Pedido Concluído e Pós-Venda")
    add_bullet("Gatilho:", "Webhook acionado na transição de status para 'concluido'.")
    add_bullet("Ação:", "Registro do faturamento e disparo de mensagem de agradecimento e pesquisa de satisfação ao cliente.")

    add_callout(
        "Insira aqui os prints do n8n no seu documento: \n"
        "1. Canvas do Workflow 1 no n8n exibindo os nós conectados.\n"
        "2. Aba 'Executions' do n8n com status verde (Success) e o payload de entrada/saída expandido.\n"
        "3. Canvas e execução da Automação 2 (Alerta Diário).",
        title="[ESPAÇO PARA PRINTS DO N8N]"
    )

    # =========================================================================
    # SEÇÃO 4
    # =========================================================================
    add_section_heading("4", "Explicação das Decisões Técnicas e Arquiteturais")

    add_subsection_heading("4.1 Por que modelou o banco assim?")
    add_bullet("Regras no Banco em vez do Frontend:", "O frontend é uma camada manipulável via DevTools ou chamadas diretas de API. Centralizar a máquina de estados, constraints de data/técnico e triggers de valor total no PostgreSQL assegura integridade absoluta, impedindo qualquer estado inconsistente independentemente da origem da requisição.")
    add_bullet("Snapshot de Preço Unitário:", "Em itens_pedido, o preco_unitario é copiado e congelado no momento da venda. Isso previne que reajustes futuros no catálogo de produtos alterem orçamentos ou pedidos já emitidos.")
    add_bullet("Subtotal Gerado pelo Banco:", "A coluna generated always as (quantidade * preco_unitario) stored elimina qualquer risco de erro de arredondamento em Javascript ou discrepância contábil.")
    add_bullet("Atomicidade via Stored Procedure (criar_pedido):", "Criar um pedido inserindo primeiro a capa e depois os itens em loop é vulnerável a quedas de conexão intermediárias, gerando pedidos órfãos com valor zerado. A procedure encapsula toda a criação em uma única transação ACID com rollback automático em caso de erro.")

    add_subsection_heading("4.2 Como resolveu os cálculos?")
    add_bullet("Prévia no Front vs. Cálculo Oficial no Banco:", "O front-end utiliza reatividade em memória (React state) exclusivamente para conforto e agilidade do operador ao montar o carrinho. O cálculo financeiro oficial é realizado exclusivamente pela trigger itens_ai no PostgreSQL, que recalcula a soma dos subtotais e atualiza pedidos.valor_total. O front relê a resposta oficial do banco.")

    add_subsection_heading("4.3 Como conectou n8n com Supabase?")
    add_bullet("Separação de Chaves e Segurança:", "O frontend consome exclusivamente a chave pública anon, filtrada por RLS. O n8n utiliza a chave administrativa service_role armazenada no cofre seguro de credenciais do n8n em backend fechado.")
    add_bullet("Tratamento de Timezone:", "Todas as datas utilizam timestamptz convertidas para 'America/Sao_Paulo' nas views e expressões Luxon do n8n, garantindo precisão nas rotinas matinais de agendamento.")

    add_subsection_heading("4.4 O que faria diferente com mais tempo?")
    add_bullet("1. Perfis de Usuário Granulares (RBAC):", "Criar perfis de 'Administrador' e 'Técnico', restringindo a visualização da agenda para que cada técnico acesse apenas os seus próprios serviços via RLS.")
    add_bullet("2. Roteirização Inteligente (Google Maps API):", "Cálculo de melhor trajeto e agrupamento de ordens de serviço do mesmo bairro para economia de tempo e combustível.")
    add_bullet("3. Fila com Dead Letter Queue (DLQ):", "Mecanismo de retry com backoff exponencial no n8n para reprocessar webhooks caso serviços de mensageria sofram instabilidade.")
    add_bullet("4. Assinatura Digital do Cliente no PWA:", "Coleta de assinatura na tela touch ao concluir a instalação para validação do termo de garantia.")

    # =========================================================================
    # SEÇÃO 5
    # =========================================================================
    add_section_heading("5", "Onde Usou IA e Pra Quê (Transparência Total)")
    p = doc.add_paragraph()
    p.add_run("A Inteligência Artificial (Google Antigravity / Gemini) foi empregada como uma ferramenta de alta produtividade e pair programming técnico, com supervisão, decisões arquiteturais e refatorações realizadas pelo desenvolvedor:")

    add_subsection_heading("O que foi acelerado via IA:")
    add_bullet("Boilerplate de Componentes:", "Estruturação inicial de componentes React, tipagens estritas em TypeScript espelhando o banco e schemas de nós JSON do n8n.")
    add_bullet("Geração de Dados de Teste:", "Criação dos scripts SQL de carga de dados realistas com equipamentos e clientes.")

    add_subsection_heading("Supervisão Humana e Onde a IA foi Corrigida:")
    add_bullet("1. Correção de Timezone:", "A IA inicialmente gerou queries baseadas em UTC. Corrigimos manualmente para o fuso brasileiro 'America/Sao_Paulo', sem o qual os relatórios mensais e o cron de alertas diários falhariam nas viradas de mês.")
    add_bullet("2. Eliminação de Dados Mockados:", "Rejeitamos qualquer tentativa da IA de simular dados com arrays estáticos; todas as telas operam 100% integradas ao Supabase em tempo real.")
    add_bullet("3. Blindagem de Regras no Banco:", "A IA sugeriu validações de máquina de estados apenas no React. Transferimos e codificamos as regras dentro de triggers PL/pgSQL no PostgreSQL para garantir integridade inviolável.")
    add_bullet("4. Redesenho para Mobile First:", "As tabelas desktop originais da IA quebravam no celular. Reescrevemos a interface criando a navegação inferior (BottomNav), foco de dia único na agenda e cards verticais responsivos.")
    add_bullet("5. Correção de Quebra de Linha no PDF:", "A rotina gerada pela IA cortava endereços longos com slice(0, 52). Refatoramos com splitTextToSize e altura dinâmica no jsPDF para garantir visualização integral.")

    # =========================================================================
    # SEÇÃO 6
    # =========================================================================
    add_section_heading("6", "Link do Repositório GitHub")
    p = doc.add_paragraph()
    r_gh = p.add_run("👉 Repositório Público: https://github.com/pierrecbrito/smartlar\n")
    r_gh.font.bold = True
    r_gh.font.color.rgb = PRIMARY_COLOR

    add_subsection_heading("Organização e Boas Práticas do Repositório:")
    add_bullet("Histórico de Commits Semânticos:", "Commits claros e atômicos seguindo o padrão conventional commits (feat, fix, refactor, style, docs), refletindo a evolução real do projeto.")
    add_bullet("Suíte Completa de Especificações (.spec/):", "Documentação estruturada contendo visão geral, regras de negócio, modelo de dados, requisitos funcionais, casos de teste e registros de decisão técnica (DECISIONS.md e IA-LOG.md).")
    add_bullet("Scripts SQL Versionados e Idempotentes:", "Pasta .spec/database/ com migrations ordenadas (01_schema.sql até 07_fix_security_invoker_views.sql).")
    add_bullet("Pipeline de CI/CD Integrada:", "Configuração com vercel.json garantindo deploys automáticos a cada commit na branch master.")

    # Save to disk
    output_path = os.path.abspath("SmartLar_Entrega_Projeto.docx")
    doc.save(output_path)
    print(f"Documento gerado com sucesso em: {output_path}")

if __name__ == '__main__':
    create_document()
