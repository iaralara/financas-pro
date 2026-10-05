# FinançasPro — Mini App Web de Finanças Pessoais & Consultor Financeiro

Um mini app web mobile-first, responsivo (celular, tablet e desktop) desenvolvido com **React + TypeScript + Tailwind CSS** e preparado para **Supabase com Row Level Security (RLS)**.

---

## 🚀 Como Executar Localmente

1. Entre no diretório do projeto:
   ```bash
   cd finance-app
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Execute o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   Acesse no navegador: `http://localhost:5173` ou pela rede local (Wi-Fi) no celular/tablet: `http://<SEU_IP>:5173`

---

## 🔐 Configuração do Supabase & RLS (Produção)

1. Crie um projeto gratuito no [Supabase](https://supabase.com).
2. Acesse o **SQL Editor** do Supabase e execute o arquivo [`supabase-schema.sql`](./supabase-schema.sql). Ele cria as tabelas:
   - `profiles`: Cadastro isolado de usuários.
   - `monthly_plans`: Planejamento e fechamento de cada mês com Row Level Security ativado.
   - `transactions`: Receitas, despesas, investimentos e transferências protegidas por `auth.uid() = user_id`.
   - `installments`: Compras parceladas e dívidas com cálculo de amortização.
3. Crie um arquivo `.env` na raiz da pasta `finance-app` com as suas credenciais:
   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anonima-publica
   ```
4. Se o `.env` não for preenchido, a aplicação entra automaticamente no **Modo Demonstração Offline com Isolamento LocalStorage por Usuário**, permitindo testar todas as funcionalidades imediatamente.

---

## ✨ Funcionalidades Implementadas

### 1. Dashboard Estratégico
- Visão geral do mês ativo.
- Saldo atual, receitas, despesas e investimentos.
- Dívidas acumuladas e total de parcelas futuras.
- Próximos vencimentos de parcelas e faturas.
- Gráfico de pizza interativo com distribuição de gastos por categoria.
- **Indicador de Saúde Financeira**:
  - 🟢 Dentro do planejamento
  - 🟡 Atenção
  - 🔴 Acima do planejado

### 2. Planejamento do Mês ("PRIMEIRO DECIDIR. DEPOIS GASTAR.")
- Entradas de dinheiro disponível, receitas previstas, quanto deseja investir e metas.
- Gastos sazonais, contas fixas, gastos previstos e parcelas vencendo no mês.
- **Método 70/30 & Distribuição Visual**:
  - Gráfico de pizza colorido refletindo:
    - 55% Essencial
    - 30% Boletos pessoais / metas
    - 10% Livre
    - 5% Educação
  - Percentuais editáveis pelo usuário.
- **Teste de Realidade**:
  - Cálculo: `Dinheiro disponível + Receitas - Contas - Gastos - Parcelas - Investimentos = Saldo Planejado`.
  - Se o saldo for negativo: exibe ⚠️ *"Seu planejamento não fecha"* e apresenta **somente as 3 alternativas viáveis**:
    1. Gastar menos;
    2. Mudar algum plano;
    3. Aumentar a renda.

### 3. Fechamento do Mês
- Seleção de qualquer mês para auditar receitas, despesas, investimentos, dívidas pagas e saldo final.
- Gráfico comparativo em barras: **Planejado x Realizado**.
- Diagnóstico automatizado gerado pelo sistema (ex: *"Você gastou X% acima do planejado..."*).
- **Perguntas para reflexão**:
  - O que deu certo?
  - O que deu errado?
  - Onde gastei mais do que deveria?
  - Quais hábitos manter e quais evitar?
- Campo dedicado para **"Lições do Mês"**.

### 4. Receitas, Despesas e Fluxo de Caixa
- Cadastro, edição e exclusão de:
  - Receitas;
  - Despesas;
  - Investimentos;
  - Transferências.
- Formas de pagamento: PIX, Débito, Dinheiro, Cartão de crédito, Boleto e Outros.
- Filtros por período, categoria, forma de pagamento e tipo.
- Busca por texto em tempo real.

### 5. Compras Parceladas & Cartão (Sem Duplicação de Caixa)
- Registro da dívida total e cálculo do valor mensal da parcela.
- Exibição no padrão: `Parcela 3/12 — R$ 150 — vence dia 10`.
- Cálculos automáticos: parcelas pagas, parcelas restantes, valor já pago, valor restante, próxima parcela e mês de término.
- Botão rápido de amortização de parcelas com barra de progresso.
- Separação entre compras parceladas de cartão e dívidas/empréstimos consolidados.

### 6. Consultor Financeiro Inteligente
- Respostas diretas baseadas estritamente nos dados cadastrados:
  - Onde estou gastando demais?
  - Qual categoria aumentou comparado ao mês anterior?
  - Estou cumprindo minha meta de investimento?
  - Quais parcelas estão comprometendo os próximos meses?
- Sugestões para aumento de renda e otimização orçamentária.

### 7. Lançamento por Áudio / Voz (Web Speech API)
- Gravação com transcrição em Português do Brasil.
- Reconhecimento semântico automático (ex: *"Comprei 80 reais de supermercado hoje no PIX"* vira automaticamente `Despesa — Supermercado — R$ 80 — PIX — Hoje`).
- Modal para revisão e confirmação antes de salvar.
