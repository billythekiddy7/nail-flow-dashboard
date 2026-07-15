# 🔍 AUDITORIA FORENSE NAIL FLOW — 15/07/2026

## RELATÓRIO TÉCNICO FULL-STACK ULTRA DETALHADO

---

## 1. ESTRUTURA DO PROJETO

### 1.1 Arquitetura Geral
- **Stack**: React 18 + Vite + Tailwind CSS + Base44 BaaS
- **Auth**: Base44 SDK nativo (signInWithPassword, auth.me, auth.logout)
- **DB**: 7 Entidades (User, Client, Service, Product, Appointment, Payment, DashboardMetric)
- **Backend**: 18 Funções Deno (INACESSÍVEIS — plano atual sem Builder+)
- **Frontend**: 9 Páginas + 30+ Componentes + 6 Hooks customizados

### 1.2 Rotas (src/App.jsx + pages.config.js)
| Rota | Página | Layout | Status |
|------|--------|--------|--------|
| / | Dashboard | ✅ Layout | Funcional |
| /AcessoPainel | AcessoPainel | ❌ Sem layout | Funcional |
| /Agenda | Agenda | ✅ Layout | Funcional |
| /Clientes | Clientes | ✅ Layout | Funcional |
| /Configuracoes | Configuracoes | ✅ Layout | Funcional |
| /Estoque | Estoque | ✅ Layout | Funcional |
| /Financeiro | Financeiro | ✅ Layout | Funcional |
| /Servicos | Servicos | ✅ Layout | Funcional |
| /obrigado | obrigado | ❌ Sem layout | Funcional |

**⚠️ ALERTA M14**: Rota `/` aponta para Dashboard via `mainPage: "Dashboard"` no pagesConfig. O loop `Object.entries(Pages)` também cria `/Dashboard` — rota duplicada potencial.

---

## 2. AUTENTICAÇÃO & SEGURANÇA

### 2.1 Fluxo de Login (AcessoPainel.jsx)
- Usa `base44.auth.signInWithPassword()` + `base44.auth.me()` ✅
- Verifica `account_status` (pending_payment, inactive, active) ✅
- Redireciona para Dashboard após sucesso ✅
- Tratamento de erros com mensagens amigáveis ✅

### 2.2 AuthContext (lib/AuthContext.jsx)
- Verifica public settings + auth na inicialização ✅
- `navigateToLogin()` redireciona para login da Base44 ✅
- `logout()` limpa token e redireciona ✅

### 2.3 GlobalProvider (hooks/useGlobalState.jsx)
- Busca `base44.auth.me()` no mount ✅
- Single Source of Truth para user ✅
- `reloadUser()` disponível para refresh ✅

### 2.4 🔴 PROBLEMAS CRÍTICOS DE SEGURANÇA

| # | Arquivo | Problema | Severidade |
|---|---------|----------|------------|
| S1 | `base44/functions/authValidate/entry.ts` | **CREDENCIAIS HARDCODED** — 6 usuários/senhas em texto plano (admin@nailflow.com:nailflow2024, hugolemes@gmail.com:moderador, etc.) | 🔴 CRÍTICO |
| S2 | `base44/entities/User.jsonc` | **RLS AUSENTE** — User não tem `rls` configurado. Todos os usuários podem ler/editar todos os perfis | 🔴 CRÍTICO |
| S3 | `base44/functions/updateUserPassword/entry.ts` | Armazena `temp_password_hash` (SHA-256) no campo do usuário — não é seguro e não altera a senha real | 🟡 ALTO |
| S4 | `base44/functions/authValidate/entry.ts` | Gera token com `btoa()` — não é JWT seguro, vulnerável a falsificação | 🔴 CRÍTICO |

### 2.5 Webhook Veksell (processVeksellWebhook/entry.ts)
- ✅ Valida token com `timingSafeEqual` (timing attack safe)
- ✅ Cria usuário via `inviteUser()` + `entities.User.create()`
- ✅ Atualiza `account_status` (active/inactive) baseado em evento
- ✅ Detecta múltiplos formatos de status (paid, approved, completed, subscription.canceled)
- ⚠️ Necessita secret `VEKSSELL_WEBHOOK_SECRET` configurado no ambiente
- ⚠️ Race condition tratada com retry de busca+update

---

## 3. ENTIDADES (base44/entities/)

### 3.1 Entidades e RLS
| Entidade | Campos Principais | RLS | Status |
|----------|-------------------|-----|--------|
| User | business_name, bio, phone, instagram, profile_image, account_status, monthly_goals | ❌ **AUSENTE** | 🔴 CRÍTICO |
| Client | name, phone, email, notes, loyalty_points, total_spent, last_visit | ✅ created_by | OK |
| Service | name, price, duration, description, products_used, category, color, commission, slug | ✅ created_by | OK |
| Product | name, cost, cost_total, cost_unit, stock, min_stock, unit | ✅ created_by | OK |
| Appointment | client_id, service_id, start/end_time, status, final_price, profit, payment_method, products_used | ✅ created_by | OK |
| Payment | client_id, appointment_id, amount, method, date, status | ✅ created_by | OK |
| DashboardMetric | revenueTotal, netProfit, newClientsCount, todayAppointmentsCount, completedAppointmentsCount | ✅ created_by | OK |

### 3.2 🔴 INCONSISTÊNCIAS DE SCHEMA

| # | Problema | Impacto |
|---|---------|---------|
| E1 | **Payment não tem `service_id`** — VirtualizedPaymentsTable mostra "Serviço não encontrado" | 🟡 BUG |
| E2 | **Appointment.payment_method** usa enum: `dinheiro, pix, cartao, a_vista` — mas NewAttendanceModal usa `dinheiro, pix, debit, credit` | 🔴 BUG |
| E3 | **Payment.method** usa enum: `dinheiro, pix, debit, credit` — inconsistente com Appointment | 🟡 BUG |
| E4 | User não tem campo `work_hours` no schema, mas `getOccupancyRate` busca `userProfile.work_hours` | 🟡 BUG |
| E5 | User não tem campos `password_last_updated`, `password_change_requested`, `temp_password_hash` no schema, mas updateUserPassword tenta escrever | 🟡 BUG |

---

## 4. BACKEND — FUNÇÕES (INACESSÍVEIS — PLANO ATUAL)

### 4.1 🔴 BLOQUEIO CRÍTICO
> **O plano atual NÃO inclui backend functions.** Todas as 18 funções Deno estão inacessíveis (retornam 402). O sistema foi migrado para cálculos no frontend como workaround.

### 4.2 Funções e Status
| Função | Propósito | Status Frontend | Usada? |
|--------|-----------|-----------------|--------|
| processVeksellWebhook | Webhook pagamento Veksell | — | Webhook externo ✅ |
| authValidate | Login hardcoded (DEPRECATED) | — | ❌ Substituído |
| preRegisterUser | Pré-cadastro (DEPRECATED) | — | ❌ HTTP 410 |
| validateActiveUserLogin | Validação (DEPRECATED) | — | ❌ HTTP 410 |
| authenticateUser | Login nativo | Frontend faz direto | ❌ Não usado |
| authService | Validação interna de senha | Chamado por updateUserPassword | ⚠️ Indireto |
| updateUserPassword | Alterar senha | PasswordCard chama → **402** | 🔴 QUEBRADO |
| updateDashboardMetrics | Sync métricas | Dashboard não chama | ⚠️ Não usado |
| onAppointmentCreated | Trigger criação agendamento | NewAppointmentModal chama → **402** | 🔴 FALLBACK |
| onAppointmentCompleted | Trigger conclusão | **NÃO IMPLEMENTADO no frontend** | 🔴 DESCONECTADO |
| onClientCreated | Trigger novo cliente | Clientes.jsx chama → **402** | 🔴 FALLBACK |
| getFinancialSummary | Resumo financeiro | Financeiro calcula local | ✅ Não usa |
| getInventoryMetrics | Métricas estoque | Estoque calcula local | ✅ Não usa |
| getClientSummary | Resumo cliente | ClientDetailsModal calcula local | ✅ Não usa |
| createCompleteAttendance | Atendimento completo | NewAttendanceModal faz direto | ✅ Não usa |
| deleteService | Excluir serviço | Servicos.jsx usa entity.delete | ✅ Não usa |
| getOccupancyRate | Taxa ocupação | Dashboard calcula local | ✅ Não usa |
| DEPRECATED_updateDashboardMetrics | (obsoleto) | — | ❌ |

### 4.3 🔴 TRIGGERS DESCONECTADOS
- **C5 (onAppointmentCompleted)**: Quando um agendamento é marcado como concluído no DayModal, o trigger `onAppointmentCompleted` NÃO é disparado. Resultado: métricas de receita/lucro não são atualizadas.
- **C9 (useUserSettings)**: Usa `User.me()` e `User.updateMyUserData()` — factories legadas que provavelmente quebram.

---

## 5. FRONTEND — PÁGINAS

### 5.1 Dashboard (src/pages/Dashboard.jsx)
- ✅ Lê métricas de `base44.entities.DashboardMetric`
- ✅ Calcula taxa de ocupação localmente (fallback)
- ✅ Loading states com skeleton
- ✅ Event listener `dashboardSynced` para refresh
- 🔴 **Problema**: Se `DashboardMetric` estiver vazia (usuário novo), mostra zeros — não recalcula
- ⚠️ `NovoAgendamento` modal usa factories legadas (linha 13: `import { Appointment, Client, Service, Product } from "@/entities/all"`)

### 5.2 Agenda (src/pages/Agenda.jsx)
- ✅ 3 visualizações: Dia, Semana, Mês
- ✅ Filtros avançados (status, cliente, serviço, pagamento, período)
- ✅ Hook `useAppointments` com debounce e filtro server-side
- ✅ Busca por nome de cliente/serviço
- ⚠️ `navigateDate` para mês avança 30 dias (não 1 mês calendário)
- ⚠️ Resumo do período não aparece na view "month"

### 5.3 Clientes (src/pages/Clientes.jsx)
- ✅ CRUD completo com `base44.entities.Client`
- ✅ Busca server-side com debounce (300ms)
- ✅ Modal de confirmação de exclusão
- ✅ Integração com NewAppointmentModal (agendar para cliente específica)
- 🔴 Chama `base44.functions.invoke('onClientCreated')` → **402** (best-effort, não bloqueia)
- ⚠️ ClientForm inline no arquivo (deveria ser componente separado — B2)

### 5.4 Servicos (src/pages/Servicos.jsx)
- ✅ CRUD com `base44.entities.Service`
- ✅ Modal de confirmação via `useConfirm` hook
- ✅ NewServiceModal com wizard de 2 passos
- ⚠️ ServiceForm inline (deveria ser componente separado — B3)
- ⚠️ NewServiceModal usa `Service` factory legada (linha 7: `import { Service } from '@/entities/Service'`)

### 5.5 Estoque (src/pages/Estoque.jsx)
- ✅ Métricas calculadas localmente (totalUnits, totalCost)
- ✅ NewProductModal para criar/editar
- ✅ Alerta de estoque baixo
- ⚠️ Métricas "Valor Recebido (Uso)" e "Lucro Realizado (Uso)" sempre mostram 0 (hardcoded no estado inicial)
- ⚠️ NewProductModal usa `Product` factory legada (linha 7: `import { Product } from '@/entities/Product'`)

### 5.6 Financeiro (src/pages/Financeiro.jsx)
- ✅ Calcula resumo localmente (faturamento, lucro, ticket médio)
- ✅ Filtro por período (hoje, semana, mês, ano, custom)
- ✅ Exportação CSV
- ✅ VirtualizedPaymentsTable (sem virtualização real — fallback)
- ⚠️ Lucro líquido calculado como `revenueTotal * 0.7` — estimativa fixa de 70%
- ⚠️ DateRangePicker recebe `dateRange` mas espera `startDate, endDate` separados — **PROPS INCOMPATIVEIS**

### 5.7 Configuracoes (src/pages/Configuracoes.jsx)
- ✅ 4 cards: Perfil Negócio, Página Pública, Configurações Avançadas, Alterar Senha
- 🔴 **3 cards bloqueados com overlay "Em Breve"** (BusinessProfileCard, PublicPageCard, AdvancedCard)
- 🔴 **PasswordCard chama `base44.functions.invoke('updateUserPassword')` → 402**
- ⚠️ `useUserSettings` usa factories `User.me()` e `User.updateMyUserData()`

### 5.8 AcessoPainel (src/pages/AcessoPainel.jsx)
- ✅ Login funcional via Base44 SDK
- ✅ Verificação de account_status
- ⚠️ Sem link para recuperação de senha

### 5.9 obrigado (src/pages/obrigado.jsx)
- ✅ Página de confirmação de pagamento
- ✅ Link para login

---

## 6. FRONTEND — COMPONENTES PRINCIPAIS

### 6.1 Modais
| Modal | Arquivo | Funcionalidade | Status |
|-------|---------|---------------|--------|
| NewAppointmentModal | agenda/NewAppointmentModal/index.jsx | Wizard 3 passos (Cliente → Data → Serviço) | ✅ Funcional |
| NovoAgendamento | modals/NovoAgendamento.jsx | Wizard 3 passos (alternativo) | 🔴 Factory legada |
| RelatorioModal | modals/RelatorioModal.jsx | Relatórios (financeiro, clientes, serviços) | 🔴 Factory legada |
| NewAttendanceModal | finance/NewAttendanceModal.jsx | Atendimento manual + baixa estoque | ✅ Funcional |
| NewProductModal | inventory/NewProductModal.jsx | Criar/editar produto | 🔴 Factory legada |
| NewServiceModal | services/NewServiceModal/index.jsx | Wizard 2 passos | 🔴 Factory legada |
| FiltersModal | agenda/FiltersModal/index.jsx | Filtros avançados agenda | ✅ Funcional |
| DayModal | agenda/DayModal.jsx | Detalhes do dia (tabs: agendados/pendentes/concluídos) | ✅ Migrado |
| ClientDetailsModal | clients/ClientDetailsModal.jsx | Perfil cliente + histórico + pagamento | ✅ Migrado |
| PaymentModal | clients/PaymentModal.jsx | Registrar pagamento manual | ✅ Migrado |
| GoalsModal | finance/GoalsModal.jsx | Definir metas mensais | 🔴 Factory legada |
| ConfirmDialog | ui/ConfirmDialog.jsx | Confirmação genérica | ✅ Funcional |

### 6.2 Hooks
| Hook | Arquivo | Propósito | Status |
|------|---------|-----------|--------|
| useGlobalState | hooks/useGlobalState.jsx | Estado global (user) | ✅ Funcional |
| useUserSettings | hooks/useUserSettings.jsx | Dados usuário | 🔴 Factory legada |
| useDateRange | hooks/useDateRange.jsx | Range de datas financeiro | ✅ Funcional |
| useAppointments | agenda/AppointmentHook.jsx | Busca agendamentos | ✅ Funcional |
| useLive | hooks/useLive.jsx | Busca genérica entidades | ⚠️ Usado por FaturamentoChart |
| useConfirm | hooks/useConfirm.jsx | Confirmação Promise-based | ✅ Funcional |

### 6.3 Componentes de UI
| Componente | Propósito | Status |
|------------|-----------|--------|
| Layout (Layout.jsx) | Sidebar + Header + Footer | ✅ Funcional |
| Sidebar | Navegação lateral | ✅ Funcional |
| MetricsCard | Cards de KPI | ✅ Funcional |
| FaturamentoChart | Gráfico faturamento | 🔴 Factory legada |
| LazyFinanceChart | Gráfico financeiro | ✅ Funcional |
| VirtualizedPaymentsTable | Tabela pagamentos | ⚠️ Sem virtualização |
| WeekCards | Visualização semana | ✅ Funcional |
| DayView | Visualização dia | ✅ Funcional |
| MonthView | Visualização mês | ✅ Funcional |
| ViewToggle | Toggle Dia/Semana/Mês | ✅ Funcional |
| ClientSelect | Busca + criar cliente | ✅ Migrado |
| ProductCard | Card de produto | ✅ Funcional |
| ClientCard | Card de cliente | ✅ Funcional |

---

## 7. 🔴 IMPORTS LEGADOS (FACTORIES ANTIGAS)

Estes arquivos ainda importam de `@/entities/*` em vez de `base44.entities`:

| # | Arquivo | Linha | Import Legado |
|---|---------|-------|---------------|
| F1 | `src/components/modals/NovoAgendamento.jsx` | 13 | `import { Appointment, Client, Service, Product } from "@/entities/all"` |
| F2 | `src/components/modals/RelatorioModal.jsx` | 11 | `import { Appointment, Client, Service } from "@/entities/all"` |
| F3 | `src/components/hooks/useUserSettings.jsx` | 3 | `import { User } from '@/entities/User'` |
| F4 | `src/components/finance/GoalsModal.jsx` | 9 | `import { User } from '@/entities/User'` |
| F5 | `src/components/inventory/NewProductModal.jsx` | 7 | `import { Product } from '@/entities/Product'` |
| F6 | `src/components/services/NewServiceModal/index.jsx` | 7 | `import { Service } from '@/entities/Service'` |
| F7 | `src/components/dashboard/FaturamentoChart.jsx` | 8 | `import { Appointment } from '@/entities/Appointment'` |

**Impacto**: Se os arquivos `@/entities/*` não existirem mais, estes componentes **quebrarão em runtime**.

---

## 8. FLUXOS E CONEXÕES

### 8.1 Fluxo: Novo Agendamento (Dashboard)
```
Dashboard → botão "Novo Agendamento"
  → NovoAgendamento modal (modals/NovoAgendamento.jsx)
    → Appointment.create() [factory legada]
    → base44.functions.invoke('onAppointmentCreated') → 402
    → onSuccess → fetchMetrics()
```
🔴 **Factory legada pode quebrar**. Trigger 402 (best-effort).

### 8.2 Fluxo: Novo Agendamento (Agenda)
```
Agenda → botão "Novo Agendamento"
  → NewAppointmentModal (agenda/NewAppointmentModal/index.jsx)
    → base44.entities.Appointment.create() ✅
    → base44.functions.invoke('onAppointmentCreated') → 402
    → onSuccess → fecha modal
```
✅ Entity direta. Trigger 402 (best-effort, não bloqueia).

### 8.3 Fluxo: Registrar Atendimento (Financeiro)
```
Financeiro → botão "Registrar Atendimento"
  → NewAttendanceModal
    → base44.entities.Appointment.create() [status: concluido]
    → base44.entities.Payment.create()
    → base44.entities.Product.update() [baixa estoque]
    → onSuccess → fetchFinancials()
```
✅ Fluxo completo e funcional. **Mas não dispara onAppointmentCompleted**.

### 8.4 Fluxo: Concluir Agendamento (DayModal)
```
WeekCards/MonthView → click no dia
  → DayModal
    → botão "Concluir"
      → base44.entities.Appointment.update(id, {status: 'concluido'}) ✅
      → NÃO dispara onAppointmentCompleted 🔴
      → Métricas não atualizadas
```
🔴 **DESCONECTADO** — métricas de receita/lucro não são atualizadas quando agendamento é concluído manualmente.

### 8.5 Fluxo: Login
```
AcessoPainel → base44.auth.signInWithPassword()
  → base44.auth.me()
  → verifica account_status
  → navigate('/Dashboard')
  → AuthContext.checkAppState() roda no mount
  → GlobalProvider.loadEssentialData() roda no mount
```
⚠️ **Dupla chamada auth.me()** — AuthContext e GlobalProvider ambos chamam `base44.auth.me()` na inicialização (M16).

### 8.6 Fluxo: Logout
```
Layout → botão "Sair"
  → base44.auth.logout()
  → navigate('/AcessoPainel')
```
✅ Funcional.

### 8.7 Fluxo: Webhook Veksell
```
Veksell (checkout) → POST /functions/processVeksellWebhook
  → valida token com timingSafeEqual
  → se paid: inviteUser() + User.create() [account_status: active]
  → se canceled: User.update() [account_status: inactive]
```
✅ Funcional (requer secret configurado).

### 8.8 Fluxo: Alterar Senha
```
Configuracoes → PasswordCard
  → base44.functions.invoke('updateUserPassword') → 402 🔴
  → toast.error
```
🔴 **QUEBRADO** — backend inacessível.

---

## 9. BUGS E FALHAS IDENTIFICADOS

### 9.1 🔴 CRÍTICOS
| # | Descrição | Arquivo |
|---|-----------|---------|
| B1 | Credenciais hardcoded em authValidate.ts | base44/functions/authValidate/entry.ts |
| B2 | User entity sem RLS — dados de todos visíveis | base44/entities/User.jsonc |
| B3 | updateUserPassword não altera senha (só armazena hash) | base44/functions/updateUserPassword/entry.ts |
| B4 | PasswordCard chama função inacessível (402) | src/components/config/PasswordCard.jsx |
| B5 | 7 imports de factories legadas podem quebrar | Ver seção 7 |
| B6 | onAppointmentCompleted nunca disparado | DayModal.jsx |
| B7 | Inconsistência enum payment_method (cartao vs debit/credit) | Appointment vs Payment |

### 9.2 🟡 ALTOS
| # | Descrição | Arquivo |
|---|-----------|---------|
| B8 | Payment não tem service_id → "Serviço não encontrado" na tabela | base44/entities/Payment.jsonc |
| B9 | DateRangePicker recebe props erradas de Financeiro | finance/DateRangePicker.jsx |
| B10 | Lucro líquido fixo em 70% no Financeiro | src/pages/Financeiro.jsx:90 |
| B11 | Métricas Estoque (valor recebido/lucro) sempre 0 | src/pages/Estoque.jsx:36 |
| B12 | Dupla chamada auth.me() (AuthContext + GlobalProvider) | lib/AuthContext + useGlobalState |
| B13 | Dashboard não recalcula se DashboardMetric vazia | src/pages/Dashboard.jsx |
| B14 | getOccupancyRate busca work_hours que não existe no schema User | base44/functions/getOccupancyRate/entry.ts |

### 9.3 🟢 MÉDIOS
| # | Descrição | Arquivo |
|---|-----------|---------|
| B15 | DayView.handleAppointmentClick só faz console.log | agenda/DayView.jsx:36 |
| B16 | navigateDate mês avança 30 dias não mês calendário | src/pages/Agenda.jsx:113 |
| B17 | VirtualizedPaymentsTable não é virtualizado | finance/VirtualizedPaymentsTable.jsx |
| B18 | Title do index.html = "Base44 APP" | index.html:8 |
| B19 | NewServiceModal onOpenChange não reseta formulário | services/NewServiceModal/index.jsx:123 |
| B20 | AdvancedCard.exportData usa alert() | config/AdvancedCard/index.jsx:28 |

---

## 10. RESPONSIVIDADE

### 10.1 ✅ Bem Implementado
- Layout.jsx: Sidebar fixa no desktop, drawer no mobile (com CSS customizado)
- Agenda: Controles em coluna no mobile, linha no desktop
- MonthView: Grid 7 colunas com gaps responsivos (gap-1 mobile, gap-2 desktop)
- Dashboard: Grid 1→2→4 colunas responsivo
- NewServiceModal: Botões em coluna no mobile, linha no desktop

### 10.2 ⚠️ Pontos de Atenção
| # | Problema | Arquivo |
|---|---------|---------|
| R1 | WeekCards: `grid-cols-7` no desktop pode ficar apertado em telas pequenas — 7 cards lado a lado | agenda/WeekCards.jsx:54 |
| R2 | NewServiceModal: `maxWidth: 95vw` pode causar overflow horizontal | services/NewServiceModal/index.jsx:128 |
| R3 | ClientDetailsModal: KPIs em `grid-cols-2 md:grid-cols-4` — OK | clients/ClientDetailsModal.jsx |
| R4 | VirtualizedPaymentsTable: items em `flex` pode estourar em mobile | finance/VirtualizedPaymentsTable.jsx:41 |
| R5 | RelatorioModal: Classes Tailwind muito longas inline — difícil manter | modals/RelatorioModal.jsx |

---

## 11. PONTOS DE MELHORIA

### 11.1 Arquitetura
1. **Migrar todas factories legadas** para `base44.entities` (7 arquivos pendentes)
2. **Eliminar AuthContext duplicado** — GlobalProvider já faz auth.me(). Unificar.
3. **Excluir funções deprecadas** (authValidate, preRegisterUser, validateActiveUserLogin)
4. **Remover updateUserPassword** e direcionar para fluxo de recuperação nativo Base44

### 11.2 Segurança
5. **Adicionar RLS na User entity** — crítico
6. **Remover credenciais hardcoded** do authValidate (já deprecated, deletar arquivo)
7. **Não armazenar temp_password_hash** — remover lógica insegura

### 11.3 Funcionalidade
8. **Disparar onAppointmentCompleted** quando agendamento é concluído no DayModal (ou calcular métricas localmente)
9. **Adicionar service_id ao Payment** ou resolver via join com Appointment
10. **Padronizar enums** de payment_method entre Appointment e Payment
11. **Recalcular DashboardMetric** quando vazia (chamar updateDashboardMetrics ou calcular local)
12. **Corrigir DateRangePicker** props (receber dateRange objeto ou startDate/endDate separados)
13. **Calcular lucro real** no Financeiro em vez de 70% fixo
14. **Título do index.html** → "Nail Flow Dashboard"

### 11.4 UX
15. **DayView**: implementar modal de detalhes ao clicar (hoje só console.log)
16. **navigateDate mês**: usar addMonths em vez de addDays(30)
17. **Loading states**: padronizar skeleton em todas as páginas
18. **Empty states**: mensagens mais acionáveis

---

## 12. RESUMO EXECUTIVO

### ✅ O QUE FUNCIONA
- Login e logout via Base44 SDK
- Webhook Veksell (provisionamento de usuários)
- CRUD de Clientes (com busca server-side)
- CRUD de Serviços (com wizard)
- CRUD de Produtos (com cálculo de custo unitário)
- Agenda (3 visualizações + filtros + busca)
- Novo Agendamento (wizard multi-step)
- Atendimento manual (com baixa de estoque)
- Financeiro (resumo, gráfico, tabela, CSV export)
- Dashboard (métricas + gráfico de faturamento)
- Metas mensais (salvas no perfil)
- Sidebar com indicadores dinâmicos

### 🔴 O QUE NÃO FUNCIONA
- Alterar senha (backend 402)
- Triggers de métricas (onAppointmentCreated, onAppointmentCompleted, onClientCreated — todos 402)
- 3 cards de Configurações (bloqueados com "Em Breve")
- Componentes com factories legadas (7 arquivos — risco de quebra)
- Métricas de estoque (valor recebido/lucro sempre 0)
- Atualização de métricas ao concluir agendamento manualmente
- "Serviço não encontrado" na tabela de pagamentos

### 🔴 RISCOS CRÍTICOS
1. **User sem RLS** — qualquer usuário logado pode ver/editar perfis de todos
2. **Credenciais hardcoded** expostas no código
3. **7 arquivos com imports que podem não resolver** se factories forem deletadas

---

**Auditoria executada em 15/07/2026 — 40+ arquivos analisados.**