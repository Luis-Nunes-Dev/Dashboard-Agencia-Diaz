# Dashboard Agência

Sistema web para gerenciamento de uma agência, desenvolvido para centralizar clientes, demandas, agenda e controle financeiro em um único lugar.

O projeto possui uma interface moderna e simples, com os dados armazenados em banco de dados e autenticação de usuários.

## ✨ Funcionalidades

### 📊 Dashboard

- Visão geral da agência
- Quantidade de clientes ativos
- Valores pagos
- Valores a receber
- Gráfico financeiro mensal/anual
- Pontos de atenção
- Demandas recentes
- Próximos compromissos

### 👥 Clientes

- Cadastro de clientes
- Edição de clientes
- Exclusão de clientes
- Informações básicas como nome, email e segmento

### 📋 Demandas

- Cadastro de demandas
- Associação com clientes
- Definição de responsável
- Prazo de entrega
- Status da demanda
- Edição e exclusão
- Atualização do status

### 📅 Agenda

- Cadastro de compromissos
- Data e horário
- Descrição
- Responsável
- Conclusão e reabertura de compromissos

### 💰 Financeiro

- Contratos recorrentes
- Controle de recebimentos
- Serviços avulsos
- Pagamentos parciais
- Histórico de pagamentos
- Valores pagos
- Valores pendentes
- Controle de vencimentos
- Visão mensal e anual
- Histórico financeiro por cliente

### 👤 Usuários

- Login com autenticação
- Controle de usuários
- Perfis de acesso
- Criação de novos usuários
- Exclusão de usuários

### ⚙️ Configurações

- Configurações básicas da agência

---

## 🛠️ Tecnologias

- **React**
- **Vite**
- **JavaScript**
- **Supabase**
  - PostgreSQL
  - Authentication
  - Row Level Security (RLS)
  - Edge Functions
- **Vercel**

---

## 🏗️ Arquitetura

O frontend é desenvolvido em React e utiliza o Supabase como backend.

```text
React + Vite
     │
     ├── Supabase Auth
     │
     ├── PostgreSQL
     │
     └── Supabase Edge Functions
              │
              └── Operações administrativas
