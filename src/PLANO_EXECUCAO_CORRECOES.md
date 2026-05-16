# 🎯 PLANO DE EXECUÇÃO FORENSE — CORREÇÃO COMPLETA DO SISTEMA
### Sistema: Nail Flow SaaS | Data: 2026-05-16
### Doutrina aplicada: AI CONTROLS v6.0 — Certeza Absoluta
### Base: `AUDITORIA_FORENSE_BUGS.md` (70 bugs catalogados)

---

## 📋 ÍNDICE

1. [Princípios de Execução](#princípios-de-execução)
2. [Ordem Estratégica](#ordem-estratégica-das-ondas)
3. [ONDA 0 — Preparação](#onda-0--preparação-e-baseline)
4. [ONDA 1 — Segurança Crítica](#onda-1--segurança-crítica)
5. [ONDA 2 — Lógica de Negócio](#onda-2--lógica-de-negócio-financeira)
6. [ONDA 3 — Triggers e Sincronização](#onda-3--triggers-e-sincronização-de-métricas)
7. [ONDA 4 — Backend Performance](#onda-4--backend-performance-e-sdk)
8. [ONDA 5 — Integridade de Dados](#onda-5--integridade-de-dados-e-schemas)
9. [ONDA 6 — UX e Frontend Critical](#onda-6--ux-e-frontend-critical)
10. [ONDA 7 — Componentes e Visual](#onda-7--componentes-e-visual)
11. [ONDA 8 — Limpeza e Otimização](#onda-8--limpeza-e-otimização)
12. [ONDA 9 — Pré-Deploy](#onda-9--pré-deploy-e-validação-final)
13. [Matriz de Dependências](#matriz-de-dependências)
14. [Pontos de Não Retorno](#pontos-de-não-retorno-checkpoints)

---

## PRINCÍPIOS DE EXECUÇÃO

### Regras de Ouro (extraídas da Doutrina AI CONTROLS v6.0)

| Princípio | Aplicação |
|-----------|-----------|
| **Atomicidade (1.1)** | 1 task = 1 arquivo ou conjunto mínimo interdependente |
| **Prova de Execução (1.2)** | Toda task termina com verificação (test_backend_function ou screenshot) |
| **Contexto Herdado (3.1)** | Cada onda referencia o estado deixado pela anterior |
| **Validação de Requerimentos (3.2)** | Secrets confirmados ANTES de qualquer task |
| **Proibição de Concorrência (4.1)** | Promise.all em backend é PROIBIDO |
| **Intenção Estratégica (5.1)** | Cada task começa com "Por quê" |
| **Validação de Contexto (5.2)** | Frontend complexo: 1 prompt auditoria + 1 prompt execução |

### Filosofia de Ordenação

> **"Corrigir do MENOR risco de regressão para o MAIOR — começando pelas vulnerabilidades e seguindo para refatorações estruturais."**

A ordem **NÃO é por severidade** mas por **DEPENDÊNCIA E RISCO DE QUEBRA**:
- Primeiro: tarefas isoladas que não afetam outros módulos
- Depois: tarefas que corrigem comportamento de cascata
- Por último: refatorações estruturais e limpeza

---

## ORDEM ESTRATÉGICA DAS ONDAS

```
┌─────────────────────────────────────────────────────────────────┐
│  ONDA 0 — Preparação (Baseline)                                 │
│     ↓                                                            │
│  ONDA 1 — Segurança Crítica (sem dependências)                  │
│     ↓                                                            │
│  ONDA 2 — Lógica de Negócio Financeira (corrige cálculos)       │
│     ↓                                                            │
│  ONDA 3 — Triggers e Sincronização (depende ondas 1+2)          │
│     ↓                                                            │
│  ONDA 4 — Backend Performance + SDK (independente)              │
│     ↓                                                            │
│  ONDA 5 — Integridade de Dados / Schemas                        │
│     ↓                                                            │
│  ONDA 6 — UX e Frontend Critical                                │
│     ↓                                                            │
│  ONDA 7 — Componentes e Visual                                  │
│     ↓                                                            │
│  ONDA 8 — Limpeza e Otimização                                  │
│     ↓                                                            │
│  ONDA 9 — Pré-Deploy e Validação                                │
└─────────────────────────────────────────────────────────────────┘
```

---

# ONDA 0 — PREPARAÇÃO E BASELINE

> **Intenção Estratégica**: Estabelecer um marco de referência antes de qualquer mudança, garantindo que possamos rollback caso algo dê errado.

### Task 0.1 — Snapshot do Estado Atual
- **Tipo**: Documentação (read-only)
- **Ação**: Confirmar que `AUDITORIA_FORENSE_BUGS.md` e `DOCUMENTACAO_FORENSE.md` estão presentes no projeto
- **Risco**: Nenhum
- **Verificação**: Listar arquivos da raiz

### Task 0.2 — Confirmação de Secrets
- **Tipo**: Validação humana
- **Ação**: Confirmar que `VEKSSELL_WEBHOOK_SECRET` está configurado
- **Confirmação necessária**: Sim (Regra 3.2)
- **Risco**: Nenhum
- **Verificação**: Lista de secrets ativos

### Task 0.3 — Inventário de Funções Ativas vs Deprecadas
- **Tipo**: Listagem
- **Ação**: Mapear quais funções backend estão sendo chamadas pelo frontend (busca por `from '@/functions/'`)
- **Risco**: Nenhum
- **Output esperado**: Lista de funções órfãs (chamadas em nenhum lugar)

---

# ONDA 1 — SEGURANÇA CRÍTICA

> **Intenção Estratégica**: Eliminar vulnerabilidades de exposição de credenciais ANTES de qualquer outra mudança. Estas tasks são isoladas e não quebram nada.

### Task 1.1 — Deprecar `authValidate.js` (BUG C1)
- **Tipo**: Backend function (substituir conteúdo)
- **Arquivo**: `functions/authValidate.js`
- **Ação**: Substituir conteúdo por handler HTTP 410 Gone (padrão dos outros deprecados)
- **Bug**: C1 (senhas hardcoded em texto puro)
- **Dependências**: Nenhuma
- **Risco de quebra**: ZERO (função não é chamada pelo frontend)
- **Verificação**: `test_backend_function('authValidate', {})` deve retornar 410
- **Tempo estimado**: 5min

### Task 1.2 — Habilitar `requiresAuth: true` no SDK Client (BUG C7)
- **Tipo**: Frontend (config)
- **Arquivo**: `api/base44Client.js`
- **Ação**: Mudar `requiresAuth: false` → `requiresAuth: true`
- **Bug**: C7 (app pública sem auth)
- **Dependências**: Nenhuma
- **Risco de quebra**: MÉDIO — pode quebrar a página `obrigado` (pública por design)
- **Mitigação**: Validar se Veksell redireciona para `/obrigado` autenticado ou anônimo
- **Validação prévia**: Confirmar com usuário se `obrigado` precisa ser acessível sem login
- **Verificação**: Acessar URL sem token → deve redirecionar para login
- **Tempo estimado**: 10min

### Task 1.3 — Remover Funções Deprecated Órfãs
- **Tipo**: Backend cleanup
- **Arquivos**:
  - `functions/authService.js` (já retorna 410, manter)
  - `functions/validateActiveUserLogin.js` (já retorna 410, manter)
  - `functions/preRegisterUser.js` (já retorna 410, manter)
  - `functions/DEPRECATED_updateDashboardMetrics.js` (renomear ou deletar)
- **Ação**: Decidir se manter como tombstones ou deletar
- **Recomendação**: MANTER por 90 dias para detectar callers fantasmas via logs
- **Risco**: ZERO

### Task 1.4 — Auditoria de Frontend Sobre `authValidate`
- **Tipo**: Busca read-only
- **Ação**: Buscar referências a `authValidate` em todo o frontend
- **Risco**: Nenhum
- **Verificação**: Confirmar zero chamadas

---

# ONDA 2 — LÓGICA DE NEGÓCIO FINANCEIRA

> **Intenção Estratégica**: Corrigir todos os cálculos de lucro/custo que estão produzindo dados FALSOS, ANTES de mexer nos triggers que consomem esses dados. Estas tasks são prerequisitos da Onda 3.

### Task 2.1 — Corrigir `product?.cost` → `product?.cost_unit` (BUG C14)
- **Tipo**: Frontend (logic)
- **Arquivo**: `components/finance/NewAttendanceModal`
- **Linha**: 140
- **Ação**: `product?.cost` → `product?.cost_unit`
- **Bug**: C14 (campo fantasma zera todos os custos)
- **Dependências**: Nenhuma
- **Risco**: ZERO
- **Tempo estimado**: 2min

### Task 2.2 — Corrigir Cálculo de Lucro em `NewAppointmentModal` (BUG C10)
- **Tipo**: Frontend (refactor)
- **Arquivo**: `components/agenda/NewAppointmentModal/index`
- **Linha**: 135
- **Ação**: Substituir `profit: finalPrice * 0.7` por cálculo real usando `products_used` do serviço (replicar lógica de `calculateRealProfit` do `NovoAgendamento.jsx`)
- **Bug**: C10 (margem hardcoded 70%)
- **Dependências**: Precisa que `Product` esteja sendo carregado no modal
- **Sub-tarefa**: Adicionar carregamento de `Product.list` no `loadData()` do modal
- **Risco**: BAIXO
- **Validação prévia**: Confirmar com usuário se margem deve considerar produtos ou se prefere ainda manter aproximação
- **Tempo estimado**: 20min

### Task 2.3 — Substituir Lógica de Ocupação Hardcoded por `getOccupancyRate` (BUG C9)
- **Tipo**: Frontend (refactor)
- **Arquivo**: `pages/Dashboard.jsx`
- **Linhas**: 60-65
- **Ação**: Remover cálculo hardcoded `workingDays=22, maxAppointmentsPerDay=8`. Chamar `getOccupancyRate({ startDate: startOfMonth(now), endDate: endOfMonth(now) })`
- **Bug**: C9 (dado falso)
- **Dependências**: Função `getOccupancyRate` já existe
- **Risco**: BAIXO
- **Tempo estimado**: 10min

### Task 2.4 — Corrigir `cost` → `cost_unit` no Backend `createCompleteAttendance`
- **Tipo**: Backend audit
- **Arquivo**: `functions/createCompleteAttendance.js`
- **Ação**: Verificar se função backend usa `cost` (campo fantasma) em algum cálculo
- **Risco**: Nenhum (apenas leitura)

---

# ONDA 3 — TRIGGERS E SINCRONIZAÇÃO DE MÉTRICAS

> **Intenção Estratégica**: Garantir que as métricas do dashboard sejam ATUALIZADAS quando agendamentos são criados/concluídos/clientes criados. Atualmente, parte dos triggers nunca é disparada. Isso só funciona DEPOIS da Onda 2 (cálculos corretos).

### Task 3.1 — Disparar `onAppointmentCreated` no Modal do Dashboard (BUG A13)
- **Tipo**: Frontend
- **Arquivo**: `components/modals/NovoAgendamento.jsx`
- **Linha**: 110-111
- **Ação**: Após `Appointment.create()`, adicionar `await base44.functions.invoke('onAppointmentCreated', { appointmentId: created.id })` com try/catch best-effort
- **Bug**: A13
- **Dependências**: Onda 2 completa
- **Risco**: BAIXO
- **Tempo estimado**: 5min

### Task 3.2 — Corrigir `todayAppointmentsCount` em `onAppointmentCreated` (BUG C11)
- **Tipo**: Backend (logic)
- **Arquivo**: `functions/onAppointmentCreated.js`
- **Linhas**: 80-83
- **Ação**: Antes de incrementar `todayAppointmentsCount`, verificar `isSameDay(appointmentDate, now)` (não apenas `isCurrentMonth`)
- **Bug**: C11
- **Dependências**: Nenhuma
- **Risco**: ZERO
- **Tempo estimado**: 10min

### Task 3.3 — Implementar Trigger `onAppointmentCompleted` no Frontend (BUG I6)
- **Tipo**: Frontend (NOVA chamada)
- **Arquivos a localizar**: Componentes que mudam status de agendamento para "concluido"
- **Ação**:
  1. Auditar: buscar locais onde `status: 'concluido'` é setado (provavelmente `DayModal`, `WeekCards`, `NewAttendanceModal`)
  2. Adicionar chamada `base44.functions.invoke('onAppointmentCompleted', { appointmentId })` após update
- **Bug**: I6 (CRÍTICO — lucro/faturamento nunca atualizam)
- **Dependências**: Onda 2 (cálculo de profit correto)
- **Risco**: MÉDIO — precisa identificar todos os pontos
- **Subtask 3.3.1**: Auditoria (read-only) dos pontos de update de status
- **Subtask 3.3.2**: Aplicar a chamada nos pontos identificados
- **Tempo estimado**: 30min

### Task 3.4 — Validar que `onClientCreated` Está Sendo Chamado
- **Tipo**: Auditoria
- **Arquivo**: `pages/Clientes.jsx` (linha 107 já chama)
- **Ação**: Confirmar que não há outros pontos onde Cliente é criado sem disparar o trigger
- **Risco**: Nenhum
- **Tempo estimado**: 5min

### Task 3.5 — Decisão Estratégica: Manuais vs Entity Automations
- **Tipo**: Decisão arquitetural (apresentar ao usuário)
- **Ação**: Após Onda 3 finalizada, propor migração para `automation_type: "entity"` da Base44
- **Trade-off**:
  - Manual: simples, mas frágil se frontend trava
  - Automation: robusto, mas exige re-deploy de funções com payload diferente
- **Decisão**: Adiada para Onda 8 (após estabilizar tudo)

---

# ONDA 4 — BACKEND PERFORMANCE E SDK

> **Intenção Estratégica**: Atualizar SDK e remover violações da Regra 4.1 para garantir estabilidade da plataforma. Isolada do frontend.

### Task 4.1 — Atualizar SDK em Todas as Functions (BUG C5)
- **Tipo**: Backend (replace global)
- **Arquivos**: TODAS as `functions/*.js` exceto `processVeksellWebhook.js`
- **Ação**: `npm:@base44/sdk@0.7.1` → `npm:@base44/sdk@0.8.25`
- **Atomicidade**: 1 função por task (Regra 1.1)
- **Sub-tasks**:
  - 4.1.1 — `authenticateUser.js`
  - 4.1.2 — `getFinancialSummary.js`
  - 4.1.3 — `createCompleteAttendance.js`
  - 4.1.4 — `updateDashboardMetrics.js`
  - 4.1.5 — `onAppointmentCreated.js`
  - 4.1.6 — `onAppointmentCompleted.js`
  - 4.1.7 — `onClientCreated.js`
  - 4.1.8 — `deleteService.js`
  - 4.1.9 — `getInventoryMetrics.js`
  - 4.1.10 — `getClientSummary.js`
  - 4.1.11 — `getOccupancyRate.js`
  - 4.1.12 — `updateUserPassword.js`
- **Verificação por task**: `test_backend_function` retorna sucesso
- **Risco**: BAIXO (versão minor)
- **Tempo total**: 30min

### Task 4.2 — Remover Promise.all em `updateDashboardMetrics` (BUG C6)
- **Tipo**: Backend (refactor)
- **Arquivo**: `functions/updateDashboardMetrics.js`
- **Linhas**: 37-55
- **Ação**: Converter `Promise.all([q1, q2, q3])` para 3 `await` sequenciais
- **Bug**: C6 (Violação Regra 4.1)
- **Dependências**: Task 4.1.4
- **Risco**: ZERO (apenas troca de execução paralela → sequencial)
- **Verificação**: `test_backend_function('updateDashboardMetrics', {})` → logs mostram queries sequenciais
- **Tempo estimado**: 10min

### Task 4.3 — Remover Promise.all em Outras Funções (Auditoria)
- **Tipo**: Backend audit
- **Ação**: Buscar `Promise.all` em TODAS as `functions/*.js`
- **Esperado**: Apenas `updateDashboardMetrics` (já identificado)
- **Risco**: Nenhum

### Task 4.4 — Validar Importações Submodulares (Regra 4.2)
- **Tipo**: Backend audit
- **Ação**: Confirmar que todas as funções usam `import { fn } from "npm:date-fns@3.6.0/<submodulo>"` em vez de `import { fn } from "npm:date-fns"`
- **Status atual**: Em conformidade
- **Risco**: Nenhum

---

# ONDA 5 — INTEGRIDADE DE DADOS E SCHEMAS

> **Intenção Estratégica**: Unificar enums e corrigir inconsistências antes de tocar na UI que consome esses dados.

### Task 5.1 — Unificar Enums `payment_method` (BUG C13)
- **Tipo**: Schema migration
- **Arquivos**:
  - `entities/Payment.json`
  - `entities/Appointment.json`
- **Ação**:
  - **Decisão prévia**: Apresentar ao usuário 2 opções:
    - A) Unificar como `["dinheiro", "pix", "debit", "credit", "fiado", "a_vista"]`
    - B) Manter `cartao` (mais simples) e remover `debit`/`credit`
  - **Recomendação**: Opção A (mantém histórico)
- **Bug**: C13
- **Dependências**: Decisão do usuário
- **Risco**: MÉDIO — dados antigos com `cartao` precisam ser migrados
- **Mitigação**: Backend function de migração one-shot

### Task 5.2 — Decidir Fate do Campo `Product.cost`
- **Tipo**: Schema cleanup
- **Arquivo**: `entities/Product.json`
- **Ação**: Remover propriedade `cost` (órfã)
- **Dependências**: Task 2.1 (todos os usos já trocados para `cost_unit`)
- **Risco**: BAIXO
- **Validação prévia**: Audit final por `product?.cost`

### Task 5.3 — Adicionar Enum a `User.account_status`
- **Tipo**: Schema enforcement
- **Arquivo**: Criar/editar `entities/User.json`
- **Ação**: Adicionar `account_status: { enum: ['active', 'pending_payment', 'inactive'] }`
- **Bug**: D4
- **Risco**: BAIXO

### Task 5.4 — Validação de `Service.products_used` Integrity
- **Tipo**: Backend (verificação)
- **Ação**: Criar função one-shot `auditServiceProductsIntegrity` que detecta referências quebradas a `product_id` inexistente
- **Risco**: Nenhum (apenas leitura)
- **Opcional**: Pode ser adiado para Onda 8

---

# ONDA 6 — UX E FRONTEND CRITICAL

> **Intenção Estratégica**: Corrigir funcionalidades quebradas no frontend que afetam diretamente o usuário final. Depende das ondas anteriores estarem estáveis.

### Task 6.1 — Corrigir `updateUserPassword` Quebrado (BUG C2)
- **Tipo**: Backend (refactor crítico)
- **Arquivo**: `functions/updateUserPassword.js`
- **Linhas**: 73-117
- **Ação**: Substituir chamada ao `authService` deprecado por `base44.auth.signInWithPassword({ email: user.email, password: currentPassword })` para validar
- **Bug**: C2 (funcionalidade 100% quebrada)
- **Dependências**: Task 4.1.12 (SDK atualizado)
- **Risco**: MÉDIO — re-autenticação pode invalidar a sessão atual; precisa testar comportamento
- **Validação prévia**: Confirmar com usuário se quer manter card de senha ou usar fluxo de "reset por email" da Base44
- **Tempo estimado**: 30min

### Task 6.2 — Remover `toggleTheme()` Inexistente em Configuracoes (BUG A16)
- **Tipo**: Frontend (cleanup)
- **Arquivo**: `pages/Configuracoes.jsx`
- **Linhas**: 19, 41-43
- **Ação**: Remover destruct `{ toggleTheme }` e bloco `if (formData.theme !== userData?.theme) { toggleTheme(); }`
- **Bug**: A16, M22
- **Risco**: ZERO
- **Tempo estimado**: 3min

### Task 6.3 — Corrigir CSS Quebrado em `Layout.jsx` (BUG A6)
- **Tipo**: Frontend (CSS fix)
- **Arquivo**: `Layout.jsx`
- **Linha**: 168
- **Ação**: Remover chave `}` extra após `.sidebar-mobile [data-sidebar="footer"]`
- **Bug**: A6
- **Risco**: BAIXO — pode mexer em layout
- **Tempo estimado**: 2min

### Task 6.4 — Substituir `alert()` por `toast` (BUGS M8, M9)
- **Tipo**: Frontend (UX)
- **Arquivos**:
  - `components/modals/NovoAgendamento.jsx` (linhas 80, 116, 135, 139)
  - `components/agenda/NewAppointmentModal/index` (linhas 153, 159)
- **Ação**: `alert()` → `toast.error()` / `toast.success()`
- **Bug**: M8, M9
- **Risco**: ZERO
- **Tempo estimado**: 10min

### Task 6.5 — Add Guard de `account_status` no Layout (BUG A10)
- **Tipo**: Frontend (security)
- **Arquivo**: `Layout.jsx`
- **Ação**: No `MainLayout`, se `user.account_status !== 'active'`, exibir tela de bloqueio (similar à `obrigado`)
- **Bug**: A10
- **Dependências**: Task 5.3 (enum definido)
- **Risco**: MÉDIO — pode bloquear usuários legítimos por erro de status
- **Tempo estimado**: 20min

### Task 6.6 — Auditoria `useUserSettings` Importação Suspeita (BUG A17)
- **Tipo**: Frontend audit
- **Arquivo**: `components/hooks/useUserSettings`
- **Ação**: Verificar se `import { User } from '@/entities/User'` funciona em runtime
- **Decisão**: Se funcionar, manter. Se não, migrar para `base44.auth.me() / updateMe()`
- **Risco**: BAIXO

### Task 6.7 — Corrigir `useLive` Filter Infinito (BUG C8)
- **Tipo**: Frontend (hook fix)
- **Arquivo**: `components/hooks/useLive`
- **Linha**: 64
- **Ação**: Aceitar `filter` memoizado pelo chamador, ou estabilizar internamente com `useDeepCompareEffect`-like
- **Bug**: C8
- **Dependências**: Auditoria do `FaturamentoChart` para confirmar problema
- **Risco**: BAIXO
- **Tempo estimado**: 15min

### Task 6.8 — Auditar `processVeksellWebhook` Resposta de Filter (BUG A18)
- **Tipo**: Backend audit + fix
- **Arquivo**: `functions/processVeksellWebhook.js`
- **Linha**: 72
- **Ação**: Confirmar que `base44.entities.User.filter()` retorna array direto (não `{ data, error }`)
- **Correção**: `const existingUsers = await base44.asServiceRole.entities.User.filter({ email });`
- **Bug**: A18 (potencialmente CRÍTICO — pode estar criando duplicados)
- **Risco**: ALTO — função em produção
- **Validação**: `test_backend_function` com payload mock
- **Tempo estimado**: 20min

---

# ONDA 7 — COMPONENTES E VISUAL

> **Intenção Estratégica**: Corrigir bugs visuais e de UX que não bloqueiam negócio, mas degradam experiência.

### Task 7.1 — Corrigir Calendário `MonthView` Layout Quebrado (BUG A11)
- **Tipo**: Frontend (logic + visual)
- **Arquivo**: `components/agenda/MonthView`
- **Linhas**: 15-17
- **Ação**: Usar `startOfWeek(monthStart, { weekStartsOn: 0 })` e `endOfWeek(monthEnd, { weekStartsOn: 0 })` para preencher semana completa
- **Bug**: A11
- **Risco**: BAIXO
- **Tempo estimado**: 10min

### Task 7.2 — Padronizar Início da Semana (BUG A12)
- **Tipo**: Frontend (consistency)
- **Arquivos**: `MonthView`, `WeekCards`, `FaturamentoChart`
- **Ação**: Decidir entre Domingo (`weekStartsOn: 0`) ou Segunda (`weekStartsOn: 1`) e aplicar em todos
- **Recomendação Brasil**: Segunda (`weekStartsOn: 1`)
- **Bug**: A12
- **Risco**: BAIXO

### Task 7.3 — Padronizar Cores de Status entre Views (BUG M15)
- **Tipo**: Frontend (visual)
- **Arquivos**: `MonthView`, `DayView`, `WeekCards`
- **Ação**: Criar utilitário `getStatusColor(status, variant)` em `components/agenda/statusUtils.js`
- **Bug**: M15
- **Risco**: BAIXO
- **Tempo estimado**: 20min

### Task 7.4 — Corrigir `DayView.sort()` Mutação (BUG A14)
- **Tipo**: Frontend (bug fix)
- **Arquivo**: `components/agenda/DayView`
- **Linha**: 30
- **Ação**: `appointments.sort(...)` → `[...appointments].sort(...)`
- **Bug**: A14
- **Risco**: ZERO
- **Tempo estimado**: 2min

### Task 7.5 — Validação Estoque Inline no `NewAttendanceModal` (BUG A15)
- **Tipo**: Frontend (UX)
- **Arquivo**: `components/finance/NewAttendanceModal`
- **Ação**: Adicionar feedback inline ao alterar quantidade (ícone vermelho + mensagem)
- **Bug**: A15
- **Risco**: ZERO
- **Tempo estimado**: 15min

### Task 7.6 — Corrigir Status Inicial em `NewAppointmentModal` (BUG A9)
- **Tipo**: Frontend (logic)
- **Arquivo**: `components/agenda/NewAppointmentModal/index`
- **Linha**: 133
- **Ação**: Padronizar status inicial como `agendado` (não `confirmado`)
- **Bug**: A9
- **Risco**: BAIXO (mudança semântica)
- **Tempo estimado**: 5min

### Task 7.7 — Adicionar try/catch em `Servicos.loadServices` (BUG A7)
- **Tipo**: Frontend (defensive)
- **Arquivo**: `pages/Servicos.jsx`
- **Linhas**: 32-37
- **Ação**: Envolver em try/catch/finally
- **Bug**: A7
- **Risco**: ZERO
- **Tempo estimado**: 3min

### Task 7.8 — Remover Imports Não Utilizados
- **Tipo**: Frontend (cleanup)
- **Arquivos**:
  - `pages/Servicos.jsx` — remover `import { Appointment }` (A8)
  - `pages/Agenda.jsx` — remover `isDark` (M6)
  - `pages/Financeiro.jsx` — remover `isDark` (M7)
- **Bug**: A8, M6, M7
- **Risco**: ZERO
- **Tempo estimado**: 5min

### Task 7.9 — Remover Promise.all do Frontend (BUGS A2, A3, A4)
- **Tipo**: Frontend (compliance)
- **Arquivos**:
  - `pages/Agenda.jsx` (61-64)
  - `components/modals/RelatorioModal.jsx` (36-40)
  - `components/agenda/NewAppointmentModal/index` (48-51)
- **Ação**: Converter para await sequencial
- **Bug**: A2, A3, A4
- **Risco**: BAIXO — apenas performance ligeiramente menor
- **Tempo estimado**: 10min

### Task 7.10 — Implementar Rollback Compensação em `createCompleteAttendance` (BUG C3)
- **Tipo**: Backend (refactor crítico)
- **Arquivo**: `functions/createCompleteAttendance.js`
- **Ação**: Adicionar tentativa de rollback no catch:
  - Se Payment falha → deletar Appointment
  - Se Product falha → reverter Products já atualizados (manter snapshot inicial)
- **Bug**: C3
- **Dependências**: Task 4.1.3 (SDK atualizado)
- **Risco**: MÉDIO — lógica complexa
- **Tempo estimado**: 45min

---

# ONDA 8 — LIMPEZA E OTIMIZAÇÃO

> **Intenção Estratégica**: Reduzir dívida técnica e bundle size após estabilizar funcionalidade.

### Task 8.1 — Limpar `console.log` de Debug em Produção (BUGS M10, M11)
- **Tipo**: Frontend (cleanup)
- **Arquivos**:
  - `components/clients/ClientCard` (linhas 50-54)
  - `pages/Clientes.jsx` (linhas 37, 54, 75, 131)
  - Outras ocorrências
- **Ação**: Remover ou substituir por logger condicional
- **Risco**: ZERO

### Task 8.2 — Unificar `index.css` e `globals.css` (BUGS B3, B4)
- **Tipo**: Frontend (refactor)
- **Ação**:
  - Auditar qual é importado em `main.jsx` → `index.css`
  - Confirmar se `globals.css` é dead code
  - Deletar `globals.css` se órfão
- **Risco**: MÉDIO — verificar imports indiretos
- **Tempo estimado**: 15min

### Task 8.3 — Remover `ThemeProvider` Wrapper Vazio (BUG M18)
- **Tipo**: Frontend (refactor)
- **Arquivo**: `components/ThemeProvider.jsx` e callers
- **Ação**:
  - Substituir `useTheme()` → `useGlobalState()` em todos os callers
  - Remover `<ThemeProvider>` do `Layout.jsx`
  - Deletar arquivo `ThemeProvider.jsx`
- **Risco**: MÉDIO — múltiplos arquivos afetados
- **Tempo estimado**: 20min

### Task 8.4 — Remover Pacotes NPM Não Utilizados (BUG B2)
- **Tipo**: Frontend (bundle)
- **Pacotes**: `three`, `react-leaflet`, `@hello-pangea/dnd`, `canvas-confetti`, `html2canvas`
- **Ação**: Auditar imports → remover via package.json
- **Validação prévia**: Confirmar com usuário (alguns podem ser para features futuras)
- **Risco**: BAIXO

### Task 8.5 — Customizar `index.html` (BUG M13)
- **Tipo**: Frontend (SEO)
- **Arquivo**: `index.html`
- **Ação**:
  - Título: "Nail Flow — Gestão Profissional"
  - Favicon: customizada
  - Meta tags SEO
- **Risco**: ZERO
- **Tempo estimado**: 10min

### Task 8.6 — Migrar Triggers Manuais para Entity Automations (BUG A1)
- **Tipo**: Backend (architecture)
- **Ação**:
  - Criar 3 automations via `create_automation`:
    - `onAppointmentCreated` (event_types: ["create"])
    - `onAppointmentCompleted` (event_types: ["update"] + trigger_conditions status=concluido)
    - `onClientCreated` (event_types: ["create"])
  - Remover chamadas manuais do frontend
- **Bug**: A1
- **Dependências**: Onda 3 estabilizada + Onda 4 (SDK)
- **Risco**: ALTO — mudança de payload (event vs direto)
- **Validação**: Re-testar Dashboard após cada automation
- **Tempo estimado**: 1h

### Task 8.7 — Remover Roteamento Duplicado (BUG M19)
- **Tipo**: Frontend (refactor)
- **Arquivo**: `App.jsx`
- **Ação**: Decidir se `/` e `/Dashboard` devem coexistir ou apenas `/`
- **Recomendação**: Manter `/` e remover do loop
- **Risco**: BAIXO

### Task 8.8 — Padronizar Selects com Classes Tailwind Gigantescas (BUG M1)
- **Tipo**: Frontend (refactor)
- **Arquivos**: `pages/Clientes.jsx`, `pages/Servicos.jsx`, modais
- **Ação**: Criar `<DarkInput>` component que encapsule as classes repetidas
- **Risco**: BAIXO
- **Tempo estimado**: 30min

### Task 8.9 — Otimizar Bundle do `FaturamentoChart` (BUG M14)
- **Tipo**: Frontend (performance)
- **Arquivo**: `components/dashboard/FaturamentoChart`
- **Ação**: Mover filtro de período para query do servidor (usar `start_time_gte` no `useLive`)
- **Risco**: BAIXO

### Task 8.10 — Exportar Relatórios em PDF (BUG B8)
- **Tipo**: Feature improvement
- **Arquivo**: `components/modals/RelatorioModal.jsx`
- **Ação**: Usar `jspdf` (já instalado) em vez de gerar `.txt`
- **Risco**: BAIXO
- **Tempo estimado**: 30min

---

# ONDA 9 — PRÉ-DEPLOY E VALIDAÇÃO FINAL

> **Intenção Estratégica**: Validar que TUDO funciona em harmonia antes de publicar.

### Task 9.1 — Audit Final de Logs de Erro
- **Tipo**: Validação
- **Ação**: `get_runtime_logs` em todos os fluxos principais
- **Verificação**: Zero erros 500 ou 401 inesperados

### Task 9.2 — Smoke Test E2E Manual
- **Tipo**: Validação humana (Regra 1.3)
- **Checklist a executar pelo usuário**:
  - [ ] Login com conta válida
  - [ ] Criar cliente novo
  - [ ] Criar agendamento via Agenda
  - [ ] Criar agendamento via Dashboard
  - [ ] Concluir agendamento → verificar Dashboard
  - [ ] Registrar atendimento manual no Financeiro
  - [ ] Verificar que estoque é abatido
  - [ ] Editar configurações de perfil
  - [ ] Tentar alterar senha
  - [ ] Excluir serviço com agendamento (deve bloquear)
  - [ ] Excluir serviço sem agendamento (deve permitir)
  - [ ] Filtrar agenda por status, cliente, serviço
  - [ ] Gerar relatório financeiro
  - [ ] Logout

### Task 9.3 — Validação Responsiva
- **Tipo**: Validação humana
- **Viewports**:
  - Mobile (375px)
  - Tablet (768px)
  - Desktop (1024px+)
- **Páginas**: Todas as 9 páginas + todos os modais

### Task 9.4 — Validação de Performance
- **Tipo**: Validação técnica
- **Métricas**:
  - Tempo de carregamento do Dashboard < 2s
  - Tempo de carregamento de Agenda (mês) < 3s
  - Bundle size frontend
- **Ferramenta**: Lighthouse / Web Vitals

### Task 9.5 — Validação de Segurança
- **Tipo**: Audit final
- **Checklist**:
  - [ ] `authValidate` retorna 410
  - [ ] App requer auth para acessar páginas
  - [ ] Veksell webhook valida token
  - [ ] Senhas não aparecem em logs
  - [ ] `account_status` é respeitado em login

### Task 9.6 — Documentação de Mudanças
- **Tipo**: Documentação
- **Ação**: Criar `CHANGELOG.md` com todas as ondas executadas

### Task 9.7 — Deploy
- **Tipo**: Publicação
- **Ação**: Publicar versão final
- **Validação**: Confirmação do Comando Humano (Regra 1.3)

---

## MATRIZ DE DEPENDÊNCIAS

```
Onda 0 ──→ Onda 1 ──→ Onda 2 ──→ Onda 3 ──→ Onda 4 ──→ Onda 5
                            ↓         ↓          ↓
                          Onda 6 ←────┴──────────┘
                            ↓
                          Onda 7
                            ↓
                          Onda 8
                            ↓
                          Onda 9
```

### Tabela de Dependências Críticas

| Task | Depende de | Pode rodar em paralelo? |
|------|-----------|------------------------|
| 1.1 | — | Sim, com 1.2 |
| 1.2 | — | Sim, com 1.1 |
| 2.1 | — | Sim, com 2.2/2.3 |
| 2.2 | — | Sim, com 2.1/2.3 |
| 2.3 | — | Sim, com 2.1/2.2 |
| 3.1 | 2.2 | Sim, com 3.2 |
| 3.2 | — | Sim |
| 3.3 | 2.2 | Não |
| 4.1.x | — | Pode rodar em série |
| 4.2 | 4.1.4 | Não |
| 5.1 | Decisão humana | Não |
| 6.1 | 4.1.12 | Não |
| 6.2 | — | Sim |
| 6.3 | — | Sim |
| 6.5 | 5.3 | Não |
| 6.7 | Audit FaturamentoChart | Não |
| 6.8 | — | Sim |
| 7.x | Onda 6 estável | Várias em paralelo |
| 8.x | Onda 7 estável | — |
| 9.x | TUDO | Sequencial |

---

## PONTOS DE NÃO RETORNO (CHECKPOINTS)

> **Checkpoint = ponto onde paramos para validar antes de prosseguir.**

### CHECKPOINT 1 — Após Onda 1
**Validação**: App ainda carrega? Login funciona? `authValidate` retorna 410?
**Se falhar**: Rollback `requiresAuth: true` (Task 1.2)

### CHECKPOINT 2 — Após Onda 3
**Validação**: Criar 1 agendamento de teste. Marcar como concluído. Dashboard mostra revenue atualizado?
**Se falhar**: Auditar `onAppointmentCompleted` chamadas

### CHECKPOINT 3 — Após Onda 4
**Validação**: Todas as funções `test_backend_function` retornam 200?
**Se falhar**: Rollback SDK na função problemática

### CHECKPOINT 4 — Após Onda 5
**Validação**: Criar pagamento com cada método de enum. Filtrar por método. Histórico mostra correto?
**Se falhar**: Migration script de dados antigos

### CHECKPOINT 5 — Após Onda 6
**Validação**: Alterar senha funciona? Layout não está visualmente quebrado?
**Se falhar**: Rollback Task 6.1 ou Task 6.3

### CHECKPOINT 6 — Após Onda 8
**Validação**: Bundle size reduzido? Sem console errors? Triggers via Automation funcionam?
**Se falhar**: Reabilitar triggers manuais

### CHECKPOINT 7 — Antes de Deploy (Onda 9)
**Validação**: Smoke test E2E 100% verde
**Se falhar**: Bloquear deploy até resolução

---

## ESTIMATIVA TOTAL

| Onda | Tasks | Tempo Estimado | Risco |
|------|-------|---------------|-------|
| 0 | 3 | 15min | Zero |
| 1 | 4 | 30min | Baixo |
| 2 | 4 | 40min | Baixo |
| 3 | 5 | 1h | Médio |
| 4 | 4 (sub: 12) | 1h | Baixo |
| 5 | 4 | 1h | Médio |
| 6 | 8 | 2h | Médio-Alto |
| 7 | 10 | 3h | Médio |
| 8 | 10 | 4h | Médio |
| 9 | 7 | 2h | Validação |
| **TOTAL** | **69 tasks** | **~15h** | — |

---

## PROTOCOLO DE EXECUÇÃO (PADRÃO DOUTRINA v6.0)

Para cada task, o prompt seguirá este formato:

```
🎯 INTENÇÃO ESTRATÉGICA:
[Por que estamos fazendo isso]

📋 CONTEXTO HERDADO:
[O que foi feito antes que afeta esta task]

🔧 AÇÃO:
[Comando exato]

🧪 PROVA DE EXECUÇÃO:
[Como verificar que funcionou]

⚠️ RISCO:
[O que pode dar errado]
```

---

## DECISÕES PENDENTES (REQUEREM INPUT DO USUÁRIO)

Antes de iniciar, precisamos confirmação em:

1. **Task 1.2** (`requiresAuth: true`): A página `obrigado` precisa ser acessível sem login?
2. **Task 2.2** (cálculo de lucro): Margem deve considerar produtos consumidos ou manter aproximação de 70%?
3. **Task 5.1** (enums): Unificar enums incluindo `cartao`, `debit`, `credit`, `fiado`, `a_vista` OU consolidar em conjunto menor?
4. **Task 6.1** (alterar senha): Manter card de senha com re-autenticação OU substituir por fluxo "esqueci minha senha" da Base44?
5. **Task 6.5** (guard account_status): Como tratar usuário com `pending_payment`? Tela de bloqueio ou auto-logout?
6. **Task 8.4** (pacotes NPM): Confirmar remoção de `three`, `react-leaflet`, `@hello-pangea/dnd`, `canvas-confetti`, `html2canvas`?
7. **Task 8.6** (Entity Automations): Migrar triggers manuais para automations da Base44?

---

## RECOMENDAÇÃO DE INÍCIO

**Sugestão**: Começar por **ONDA 0** (preparação) seguida de **ONDA 1.1** (deprecar `authValidate`) — são as tasks de menor risco e maior impacto imediato de segurança.

Após cada onda concluída, executar o **CHECKPOINT** correspondente antes de avançar.

---

*Plano gerado sob a Doutrina AI CONTROLS v6.0 — A Doutrina da Certeza Absoluta*
*Versão: 1.0.0 | Data: 2026-05-16*
*Base: AUDITORIA_FORENSE_BUGS.md (70 bugs)*
*Total de tasks: 69 | Ondas: 10 | Checkpoints: 7*