# 🔬 DOCUMENTAÇÃO FORENSE COMPLETA — NAIL FLOW SaaS
### Versão: 1.0.0 | Data: 2026-05-16 | Plataforma: Base44

---

## ÍNDICE GERAL

1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Design System & Identidade Visual](#2-design-system--identidade-visual)
3. [Infraestrutura Frontend](#3-infraestrutura-frontend)
4. [Mapa Completo de Páginas](#4-mapa-completo-de-páginas)
5. [Mapa Completo de Componentes](#5-mapa-completo-de-componentes)
6. [Entidades (Banco de Dados)](#6-entidades-banco-de-dados)
7. [Backend Functions (Deno Deploy)](#7-backend-functions-deno-deploy)
8. [Fluxo de Autenticação](#8-fluxo-de-autenticação)
9. [Hooks Customizados](#9-hooks-customizados)
10. [Automações](#10-automações)
11. [Secrets & Variáveis de Ambiente](#11-secrets--variáveis-de-ambiente)
12. [Dependências (NPM)](#12-dependências-npm)
13. [Mapa de Modais & Pop-ups](#13-mapa-de-modais--pop-ups)
14. [Fluxos de Dados](#14-fluxos-de-dados)
15. [Vulnerabilidades & Débitos Técnicos](#15-vulnerabilidades--débitos-técnicos)
16. [Inventário de Arquivos Deprecados](#16-inventário-de-arquivos-deprecados)

---

## 1. VISÃO GERAL DA ARQUITETURA

### O que é o Nail Flow?
SaaS de gestão profissional para **nail designers** (manicures/pedicures). Permite gerenciar clientes, agenda, serviços, estoque de produtos, finanças e metas — tudo em uma interface dark premium.

### Stack Técnico
| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | React 18 + Vite + Tailwind CSS |
| **UI Library** | shadcn/ui (Radix primitives) |
| **Icons** | Lucide React |
| **Charts** | Recharts |
| **State** | Context API (GlobalProvider) + React Query |
| **Routing** | React Router DOM v6 |
| **Backend** | Deno Deploy (serverless functions) |
| **Database** | Base44 Entities (BaaS) |
| **Auth** | Base44 Native Auth (signInWithPassword + inviteUser) |
| **Payments** | Veksell (webhook de pagamento) |

### Diagrama de Arquitetura
```
┌──────────────────────────────────────────────────────────────────────┐
│                         NAIL FLOW - ARQUITETURA                      │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐    ┌──────────────────┐    ┌───────────────────┐   │
│  │   VEKSELL   │───▶│ processVeksell   │───▶│  base44.users     │   │
│  │  (Checkout)  │    │   Webhook.js     │    │  .inviteUser()    │   │
│  └─────────────┘    └──────────────────┘    └───────────────────┘   │
│                              │                       │               │
│                              ▼                       ▼               │
│  ┌─────────────┐    ┌──────────────────┐    ┌───────────────────┐   │
│  │  Browser     │───▶│   AcessoPainel   │───▶│  base44.auth      │   │
│  │  (React)     │    │   (Login Page)   │    │ .signInWithPwd()  │   │
│  └─────────────┘    └──────────────────┘    └───────────────────┘   │
│        │                                             │               │
│        ▼                                             ▼               │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    FRONTEND (React + Vite)                   │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │    │
│  │  │Dashboard │ │ Agenda   │ │ Clientes │ │ Serviços │       │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                    │    │
│  │  │ Estoque  │ │Financeiro│ │  Config  │                    │    │
│  │  └──────────┘ └──────────┘ └──────────┘                    │    │
│  └─────────────────────────────────────────────────────────────┘    │
│        │                                                             │
│        ▼                                                             │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              BACKEND FUNCTIONS (Deno Deploy)                  │    │
│  │  ┌────────────────────┐ ┌────────────────────────┐          │    │
│  │  │getFinancialSummary │ │createCompleteAttendance │          │    │
│  │  └────────────────────┘ └────────────────────────┘          │    │
│  │  ┌────────────────────┐ ┌────────────────────────┐          │    │
│  │  │updateDashboardMet. │ │  getInventoryMetrics   │          │    │
│  │  └────────────────────┘ └────────────────────────┘          │    │
│  │  ┌────────────────────┐ ┌────────────────────────┐          │    │
│  │  │ onAppointmentComp. │ │   onClientCreated      │          │    │
│  │  └────────────────────┘ └────────────────────────┘          │    │
│  └─────────────────────────────────────────────────────────────┘    │
│        │                                                             │
│        ▼                                                             │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              BASE44 ENTITIES (Database)                       │    │
│  │  Client │ Service │ Product │ Appointment │ Payment │ User   │    │
│  │  DashboardMetric                                              │    │
│  └─────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. DESIGN SYSTEM & IDENTIDADE VISUAL

### Paleta de Cores (CSS Variables)
| Variável | Valor | Uso |
|----------|-------|-----|
| `--primary-bg` | `#111111` | Fundo principal de todas as páginas |
| `--secondary-bg` | `#1a1a1a` | Sidebar, footers, headers |
| `--card-bg` | `#222222` | Cards, modais, popups |
| `--text-primary` | `#ffffff` | Todo texto principal |
| `--text-secondary` | `#a1a1aa` | Subtítulos, labels, hints |
| `--accent` | `#E6007A` | Cor principal da marca (rosa) |
| `--accent-hover` | `#c7006a` | Hover em botões accent |
| `--border` | `#333333` | Bordas de cards e separadores |
| `--hover-bg` | `#2a2a2a` | Background em hover |

### Gradientes Principais
| Nome | CSS | Uso |
|------|-----|-----|
| **Gradient Text** | `linear-gradient(135deg, #E6007A, #ff6b9d)` | Títulos de páginas, logo text |
| **Gradient Button** | `from-pink-500 to-purple-600` | CTAs principais |
| **Gradient Green** | `from-green-500 to-emerald-600` | Botões financeiros |
| **Gradient Orange** | `from-orange-500 to-red-600` | Botão de senha |
| **Gradient Badge** | `from-pink-500 to-purple-600` | Badges de contagem |

### Efeitos CSS
| Efeito | Propriedades | Uso |
|--------|-------------|-----|
| **Glass Effect** | `backdrop-filter: blur(12px) + rgba bg + border translúcida` | Cards de controle, modais |
| **Card 3D** | `perspective(1000px) rotateX(2deg) rotateY(5deg) + sombra rosa` | Cards interativos com hover |
| **Neon Glow** | `box-shadow: 0 0 20px rgba(230, 0, 122, 0.3)` | Logo do sidebar |
| **Fade In** | `animation: fadeIn 0.3s` | Entrada de componentes |
| **Slide In** | `animation: slideIn 0.3s` | Sidebar mobile |
| **Spinner** | `border-top: 2px solid #E6007A + rotate` | Loading indicators |

### Tipografia
- **Font principal**: Inter (via system fonts)
- **H1**: `text-2xl md:text-3xl font-bold gradient-text`
- **H2**: `text-xl font-semibold`
- **Body**: `text-sm md:text-base`
- **Labels**: `text-xs sm:text-sm font-medium`
- **Badges**: `text-xs font-medium`

### Responsividade
| Breakpoint | Comportamento |
|-----------|---------------|
| `< 420px` | Grid 2 colunas para métricas, títulos reduzidos |
| `< 640px` | Botões full-width, forms single column, cards 1 col |
| `< 768px` | Sidebar mobile (Sheet), modais 95vw, tabelas com scroll horizontal |
| `≥ 1024px` | Layout desktop completo, sidebar fixa, grids multi-coluna |

### Acessibilidade (WCAG 2.1)
- Focus ring: `outline: 2px solid #E6007A` em todos elementos interativos
- `focus-visible` para navegação por teclado
- `prefers-reduced-motion: reduce` desabilita animações
- `prefers-contrast: high` força bordas e remove gradientes
- `aria-labels` em botões e regiões
- Touch targets mínimo 44px

### Scrollbar Customizada
```css
::-webkit-scrollbar-thumb { background: #E6007A; border-radius: 3px; }
::-webkit-scrollbar-track { background: var(--secondary-bg); }
```

---

## 3. INFRAESTRUTURA FRONTEND

### Ponto de Entrada
```
index.html → main.jsx → App.jsx → AuthProvider → Router → Pages
```

### `index.html`
- Título: "Base44 APP" (⚠️ não customizado)
- Favicon: Logo Base44 genérica (⚠️ não customizado)
- Manifest: `/manifest.json` para PWA

### `main.jsx`
- Renderiza `<App />` no `#root`
- Importa `index.css` (design tokens)

### `App.jsx` — Router Principal
```
AuthProvider
  └── QueryClientProvider
       └── BrowserRouter
            ├── NavigationTracker
            └── AuthenticatedApp
                 └── Routes
                      ├── / → Dashboard (via pagesConfig)
                      ├── /AcessoPainel
                      ├── /Agenda
                      ├── /Clientes
                      ├── /Configuracoes
                      ├── /Dashboard
                      ├── /Estoque
                      ├── /Financeiro
                      ├── /Servicos
                      ├── /obrigado
                      └── /* → PageNotFound (404)
```

### `pages.config.js` — Registro de Páginas
```js
mainPage: "Dashboard"  // Rota "/" renderiza Dashboard
Layout: __Layout        // Todas as páginas passam pelo Layout
Pages: { AcessoPainel, Agenda, Clientes, Configuracoes, Dashboard, Estoque, Financeiro, Servicos, obrigado }
```

### `Layout.jsx` — Layout Principal
**Estrutura**: `GlobalProvider → ToastProvider → ThemeProvider → MainLayout`

**Sidebar (Desktop + Mobile)**:
| Item | Rota | Ícone |
|------|------|-------|
| Dashboard | `/Dashboard` | LayoutDashboard |
| Agenda | `/Agenda` | Calendar |
| Clientes | `/Clientes` | Users |
| Serviços | `/Servicos` | Scissors |
| Estoque | `/Estoque` | Package |
| Financeiro | `/Financeiro` | TrendingUp |
| Configurações | `/Configuracoes` | Settings |

**Sidebar — Seção "Status"**:
- Badge "Agendamentos Hoje" (puxado de DashboardMetric)
- Barra de progresso "Meta Mensal" (calculada a partir de monthly_goals do User)

**Sidebar — Footer**:
- Avatar do usuário (profile_image ou ícone Heart)
- Nome do negócio (business_name)
- Botão "Sair da Conta" (vermelho)

**Páginas sem sidebar**: `obrigado`, `AcessoPainel`

### `AuthContext.jsx` — Contexto de Autenticação (Plataforma)
- Verifica public settings da app
- Checa `appParams.token` para autenticação
- Redireciona para login se `auth_required`
- Exibe `UserNotRegisteredError` se necessário

### `GlobalProvider (useGlobalState)` — Estado Global da Aplicação
```js
{
  user: Object,          // Dados do usuário autenticado
  isLoading: Boolean,    // Flag de carregamento inicial
  isAuthenticated: Boolean,
  isDark: true,          // Tema fixo dark
  updateUser(data),      // Atualizar dados locais do user
  reloadUser()           // Recarregar do servidor
}
```

### `ThemeProvider` — DEPRECATED
- Apenas wrapper de compatibilidade que delega para `useGlobalState()`
- Usado por `Agenda.jsx` e `Financeiro.jsx` via `useTheme()`

### `base44Client.js` — SDK Client
```js
requiresAuth: false  // App pública com verificação manual de auth
```

---

## 4. MAPA COMPLETO DE PÁGINAS

### 4.1 Dashboard (`/Dashboard` = `/`)
**Arquivo**: `pages/Dashboard.jsx` (207 linhas)
**Propósito**: Visão geral executiva do negócio

**Componentes utilizados**:
- `MetricsCard` × 4 (Faturamento, Lucro, Novas Clientes, Ocupação)
- `FaturamentoChart` (Recharts)
- Modal `NovoAgendamento`
- Modal `RelatorioModal`

**Dados consumidos**:
- `DashboardMetric.list()` → métricas pré-calculadas
- `user` via `useGlobalState()`

**Botões**:
| Botão | Ação |
|-------|------|
| "Ver Relatório" | Abre `RelatorioModal` |
| "Novo Agendamento" | Abre `NovoAgendamento` (3 steps) |

**Eventos escutados**: `dashboardSynced` (recarrega métricas)

---

### 4.2 Agenda (`/Agenda`)
**Arquivo**: `pages/Agenda.jsx` (313 linhas)
**Propósito**: Gerenciamento visual de agendamentos

**Modos de Visualização**:
| Modo | Componente | Descrição |
|------|-----------|-----------|
| `week` | `WeekCards` | Cards organizados por dia da semana |
| `day` | `DayView` | Timeline vertical de horários |
| `month` | `MonthView` | Calendário mensal com indicadores |

**Filtros Avançados** (via `FiltersModal`):
- Período (startDate/endDate)
- Status: `todos`, `agendado`, `confirmado`, `concluido`, `cancelado`
- Cliente específico
- Serviços específicos (multi-select)
- Forma de pagamento

**Controles**:
- Navegação temporal (← / →)
- Toggle de visualização (Dia / Semana / Mês)
- Busca por texto (cliente ou serviço)
- Badge com contagem de filtros ativos

**Card "Resumo do Período"** (apenas day/week):
- Total de Agendamentos
- Faturamento Previsto
- Concluídos

**Modais**:
- `NewAppointmentModal` (3 steps via wizard)
- `FiltersModal`

---

### 4.3 Clientes (`/Clientes`)
**Arquivo**: `pages/Clientes.jsx` (305 linhas)
**Propósito**: CRUD completo de clientes

**Grid de Cards** (`ClientCard`):
- Nome, telefone, email
- Botões: Editar, Excluir, Visualizar

**Busca**: Debounce 300ms → `Client.filter({ name_contains })` no servidor

**Modais**:
| Modal | Trigger | Campos/Ações |
|-------|---------|-------------|
| **Formulário Cliente** | "Nova Cliente" ou Editar | nome*, telefone*, email, notas |
| **Confirmação Exclusão** | Botão lixeira | Warning irreversível + confirmar |
| **Detalhes Cliente** | Botão "ver" | Histórico, estatísticas, ações |
| **Novo Agendamento** | Via detalhes | Pré-seleciona cliente |

**Trigger Backend**: Ao criar cliente → `onClientCreated` (atualiza DashboardMetric)

---

### 4.4 Serviços (`/Servicos`)
**Arquivo**: `pages/Servicos.jsx` (196 linhas)
**Propósito**: Gestão de serviços oferecidos

**Grid de Cards**:
- Cor identificadora (bolinha colorida)
- Nome, preço (R$), duração (min), descrição, slug

**Modais**:
| Modal | Trigger | Campos |
|-------|---------|--------|
| **NewServiceModal** (wizard) | "Novo Serviço" | StepInfo + StepConfirm |
| **Edição rápida** | Botão editar | nome, preço, duração, categoria, descrição |
| **ConfirmDialog** | Botão excluir | Validação de dependências via `deleteService` |

**Exclusão segura**: Backend verifica se há agendamentos vinculados (409 Conflict)

---

### 4.5 Estoque (`/Estoque`)
**Arquivo**: `pages/Estoque.jsx` (167 linhas)
**Propósito**: Controle de produtos e insumos

**Métricas** (via `getInventoryMetrics` backend):
| Métrica | Ícone | Cor |
|---------|-------|-----|
| Total de Unidades | Box | blue |
| Custo Total | Calculator | orange |
| Valor Recebido (Uso) | DollarSign | green |
| Lucro Realizado (Uso) | TrendingUp | blue |

**Grid de ProductCards**:
- Nome, estoque atual, custo unitário, unidade de medida
- Alerta visual quando estoque < min_stock
- Botões: Editar, Excluir

**Modais**:
- `NewProductModal` (criar/editar)
- `ConfirmDialog` (exclusão)

---

### 4.6 Financeiro (`/Financeiro`)
**Arquivo**: `pages/Financeiro.jsx` (281 linhas)
**Propósito**: Dashboard financeiro com filtros por período

**Métricas**:
| Métrica | Ícone | Cor |
|---------|-------|-----|
| Faturamento Total | DollarSign | green |
| Lucro Líquido | TrendingUp | blue |
| Ticket Médio | Calendar | pink |
| Total de Atendimentos | BarChart3 | orange |

**Filtros de Período** (`PeriodToggle`):
- Hoje, Semana, Mês, Ano, Personalizado
- `DateRangePicker` para período customizado

**Seções**:
- `LazyFinanceChart` — gráfico de evolução (Recharts)
- `VirtualizedPaymentsTable` — histórico de pagamentos (virtualizado)

**Modais**:
| Modal | Trigger | Funcionalidade |
|-------|---------|---------------|
| **NewAttendanceModal** | "Registrar Atendimento" | Registro manual completo (serviço + pagamento + baixa estoque) |
| **GoalsModal** | "Definir Metas" | revenue_target, profit_target, clients_target |

**Dados**: Buscados via `getFinancialSummary` (backend function)

---

### 4.7 Configurações (`/Configuracoes`)
**Arquivo**: `pages/Configuracoes.jsx` (122 linhas)
**Propósito**: Personalização da conta e negócio

**Cards**:
| Card | Campos/Funcionalidades |
|------|----------------------|
| **BusinessProfileCard** | business_name, bio, phone, instagram, profile_image (com upload + compressão) |
| **PublicPageCard** | Configurações da página pública de agendamento, slug |
| **AdvancedCard** | Horários de trabalho (WorkingHoursModal), Programa de fidelidade (LoyaltyModal) |
| **PasswordCard** | Senha atual, nova senha, confirmar (chama `updateUserPassword`) |

**Comportamento**:
- Indicador flutuante "Alterações não salvas" (canto inferior direito)
- Botão "Salvar Alterações" no header (desabilitado se sem mudanças)
- Hook `useUserSettings` gerencia estado + persistência

---

### 4.8 Login (`/AcessoPainel`)
**Arquivo**: `pages/AcessoPainel.jsx`
**Propósito**: Autenticação do usuário

**Fluxo**:
1. Input email + senha
2. `base44.auth.signInWithPassword({ email, password })`
3. `base44.auth.me()` → obtém user
4. Verifica `account_status`:
   - `pending_payment` → "Aguarda confirmação de pagamento"
   - `inactive` → "Conta inativa"
   - `active` → Redireciona para Dashboard

**UI**:
- Logo Nail Flow
- Card centralizado com glass effect
- Loading state no botão
- Toast de erro/sucesso

**SEM sidebar** (excluído via `pagesWithoutLayout` no Layout)

---

### 4.9 Obrigado (`/obrigado`)
**Arquivo**: `pages/obrigado.jsx` (61 linhas)
**Propósito**: Confirmação pós-pagamento (landing page)

**Conteúdo**:
- Ícone CheckCircle verde
- "Pagamento Confirmado!"
- Step 1: Ativação da Conta (ícone Clock)
- Step 2: E-mail de Boas-Vindas (ícone Mail)
- Botão "Ir para a Página de Login"

**SEM sidebar**

---

## 5. MAPA COMPLETO DE COMPONENTES

### Componentes UI Base (shadcn/ui)
| Componente | Arquivo | Uso |
|-----------|---------|-----|
| Button | `components/ui/button` | Todos os botões (variants: default, outline, ghost, destructive) |
| Card | `components/ui/card` | Cards de métricas, serviços, estoque, config |
| Dialog | `components/ui/dialog` | Todos os modais |
| Input | `components/ui/input` | Campos de texto |
| Label | `components/ui/label` | Labels de formulários |
| Select | `components/ui/select` | Dropdowns (cliente, serviço, status, etc.) |
| Badge | `components/ui/badge` | Contadores, status, categorias |
| Progress | `components/ui/progress` | Barra de meta mensal no sidebar |
| Calendar | `components/ui/calendar` | Seleção de datas nos modais |
| Popover | `components/ui/popover` | Wrapper para calendários |
| Textarea | `components/ui/textarea` | Campos de observações |
| Separator | `components/ui/separator` | Divisores visuais |
| Sheet | `components/ui/sheet` | Sidebar mobile |
| Skeleton | `components/ui/skeleton` | Loading placeholders |
| Switch | `components/ui/switch` | Toggles de configuração |
| Sidebar | `components/ui/sidebar` | Sidebar completa com contexto |
| Tooltip | `components/ui/tooltip` | Tooltips de ícones |
| Tabs | `components/ui/tabs` | Abas de configuração |

### Componentes Customizados
| Componente | Arquivo | Uso |
|-----------|---------|-----|
| **MetricsCard** | `components/ui/metrics-card` | Card de métrica com ícone, cor e valor |
| **GradientButton** | `components/ui/GradientButton` | Botão rosa/roxo padronizado |
| **PageHeader** | `components/PageHeader` | Header padrão de todas as páginas (título + subtítulo + botão) |
| **NumberInput** | `components/ui/NumberInput` | Input numérico sem spinners |
| **ConfirmDialog** | `components/ui/ConfirmDialog` | Modal de confirmação de exclusão |
| **ResponsiveGrid** | `components/ui/ResponsiveGrid` | Grid com auto-fit responsivo |
| **ModalContainer** | `components/ui/ModalContainer` | Container padrão de modais |
| **AccessibleTable** | `components/ui/AccessibleTable` | Tabela acessível |
| **GridAutoFit** | `components/ui/GridAutoFit` | Grid auto-ajustável |
| **Toast/ToastProvider** | `components/ui/Toast` | Sistema de notificações toast |

### Componentes de Domínio
| Componente | Arquivo | Descrição |
|-----------|---------|-----------|
| **ClientCard** | `components/clients/ClientCard` | Card de cliente no grid |
| **ClientDetailsModal** | `components/clients/ClientDetailsModal` | Modal completo de detalhes |
| **PaymentModal** | `components/clients/PaymentModal` | Modal de pagamento |
| **ProductCard** | `components/inventory/ProductCard` | Card de produto no estoque |
| **NewProductModal** | `components/inventory/NewProductModal` | Modal criar/editar produto |
| **NewServiceModal** | `components/services/NewServiceModal/index` | Wizard de novo serviço (2 steps) |
| **StepInfo** | `components/services/NewServiceModal/StepInfo` | Step 1: Informações |
| **StepConfirm** | `components/services/NewServiceModal/StepConfirm` | Step 2: Confirmação |
| **FaturamentoChart** | `components/dashboard/FaturamentoChart` | Gráfico de faturamento (Recharts) |
| **LazyFinanceChart** | `components/charts/LazyFinanceChart` | Chart financeiro com lazy loading |
| **NewAttendanceModal** | `components/finance/NewAttendanceModal` | Registro completo de atendimento |
| **GoalsModal** | `components/finance/GoalsModal` | Definição de metas mensais |
| **PeriodToggle** | `components/finance/PeriodToggle` | Toggle de período (hoje/semana/mês/ano) |
| **DateRangePicker** | `components/finance/DateRangePicker` | Seleção de período customizado |
| **VirtualizedPaymentsTable** | `components/finance/VirtualizedPaymentsTable` | Tabela virtualizada |
| **PaymentsTable** | `components/finance/PaymentsTable` | Tabela normal de pagamentos |
| **FinanceErrorBoundary** | `components/finance/FinanceErrorBoundary` | Error boundary do financeiro |

### Componentes de Agenda
| Componente | Arquivo | Descrição |
|-----------|---------|-----------|
| **ViewToggle** | `components/agenda/ViewToggle` | Toggle dia/semana/mês |
| **WeekCards** | `components/agenda/WeekCards` | Visualização semanal |
| **DayView** | `components/agenda/DayView` | Visualização diária (timeline) |
| **MonthView** | `components/agenda/MonthView` | Visualização mensal (calendário) |
| **MonthPlaceholder** | `components/agenda/MonthPlaceholder` | Placeholder do mês |
| **DayModal** | `components/agenda/DayModal` | Modal de detalhes do dia |
| **ClientSelect** | `components/agenda/ClientSelect` | Select de clientes na agenda |
| **NewAppointmentModal** | `components/agenda/NewAppointmentModal/index` | Wizard 3 steps |
| **StepClient** | `components/agenda/NewAppointmentModal/StepClient` | Step 1: Cliente |
| **StepDateTime** | `components/agenda/NewAppointmentModal/StepDateTime` | Step 2: Data/Hora |
| **StepPayment** | `components/agenda/NewAppointmentModal/StepPayment` | Step 3: Pagamento |
| **FiltersModal** | `components/agenda/FiltersModal/index` | Modal de filtros avançados |
| **AppointmentHook** | `components/agenda/AppointmentHook` | Hook de agendamentos |
| **DateUtils** | `components/agenda/DateUtils` | Utilitários de data |

### Componentes de Configuração
| Componente | Arquivo | Descrição |
|-----------|---------|-----------|
| **BusinessProfileCard** | `components/config/BusinessProfileCard` | Perfil do negócio |
| **PublicPageCard** | `components/config/PublicPageCard` | Página pública |
| **AdvancedCard** | `components/config/AdvancedCard/index` | Config avançadas |
| **WorkingHoursModal** | `components/config/AdvancedCard/WorkingHoursModal` | Horários de trabalho |
| **LoyaltyModal** | `components/config/AdvancedCard/LoyaltyModal` | Programa de fidelidade |
| **PasswordCard** | `components/config/PasswordCard` | Alterar senha |
| **ConfigErrorBoundary** | `components/config/ConfigErrorBoundary` | Error boundary |
| **ImageCompressor** | `components/config/ImageCompressor` | Compressão de imagens |
| **SlugValidator** | `components/config/SlugValidator` | Validação de slug |
| **UploadLogoButton** | `components/config/UploadLogoButton` | Upload de logo |

---

## 6. ENTIDADES (BANCO DE DADOS)

### 6.1 Client
```json
{
  "name": "string (required)",
  "phone": "string (required)",
  "email": "string",
  "notes": "string",
  "loyalty_points": "number (default: 0)",
  "total_spent": "number (default: 0)",
  "last_visit": "date"
}
```
**RLS**: `created_by: {{user.email}}` (read + write)
**Built-in**: id, created_date, updated_date, created_by

### 6.2 Service
```json
{
  "name": "string (required)",
  "price": "number (required)",
  "duration": "number (required, minutos)",
  "description": "string",
  "products_used": "array[{product_id, quantity}]",
  "category": "enum: manicure | pedicure | nail_art | manutencao | outros",
  "color": "string (hex)",
  "commission": "number (%)",
  "slug": "string (URL amigável)"
}
```
**RLS**: `created_by: {{user.email}}`

### 6.3 Product
```json
{
  "name": "string (required)",
  "cost_total": "number (required)",
  "cost_unit": "number (required, calculado)",
  "stock": "number (required)",
  "min_stock": "number (required)",
  "unit": "string (required: ml, g, unidade)"
}
```
**RLS**: `created_by: {{user.email}}`

### 6.4 Appointment
```json
{
  "client_id": "string (required)",
  "service_id": "string (required)",
  "start_time": "datetime (required)",
  "end_time": "datetime (required)",
  "status": "enum: agendado | confirmado | concluido | cancelado (default: agendado)",
  "final_price": "number",
  "profit": "number",
  "notes": "string",
  "payment_method": "enum: dinheiro | pix | cartao | a_vista",
  "products_used": "array[{product_id, qty}]"
}
```
**RLS**: `created_by: {{user.email}}`

### 6.5 Payment
```json
{
  "client_id": "string (required)",
  "appointment_id": "string (required)",
  "amount": "number (required)",
  "method": "enum: dinheiro | pix | debit | credit (required)",
  "date": "date (required)",
  "notes": "string",
  "status": "enum: pendente | confirmado | cancelado (default: confirmado)"
}
```
**RLS**: `created_by: {{user.email}}`
**⚠️ INCONSISTÊNCIA**: Enum `method` usa `debit/credit`, mas Appointment usa `cartao`

### 6.6 DashboardMetric
```json
{
  "revenueTotal": "number (default: 0)",
  "netProfit": "number (default: 0)",
  "newClientsCount": "number (default: 0)",
  "todayAppointmentsCount": "number (default: 0)",
  "completedAppointmentsCount": "number (default: 0)"
}
```
**RLS**: `created_by: {{user.email}}`
**Propósito**: Cache pré-calculado (padrão Compute-on-Write)

### 6.7 User (Extensão)
```json
{
  "business_name": "string",
  "bio": "string",
  "phone": "string",
  "instagram": "string",
  "profile_image": "string (URL)",
  "account_status": "string (active | pending_payment | inactive)",
  "monthly_goals": {
    "revenue_target": "number",
    "profit_target": "number",
    "clients_target": "number",
    "last_updated": "datetime"
  }
}
```
**Built-in (read-only)**: id, created_date, full_name, email, role

---

## 7. BACKEND FUNCTIONS (Deno Deploy)

### 7.1 ATIVAS

#### `processVeksellWebhook.js` — Motor de Crescimento ✅ v2.0
| Atributo | Valor |
|----------|-------|
| **SDK** | `0.8.6` ✅ (atualizado) |
| **Auth** | Token Veksell (timingSafeEqual) |
| **Propósito** | Processar pagamentos e criar usuários |
| **Cenário A** | Usuário existe → atualiza account_status |
| **Cenário B** | Novo → `inviteUser(email, 'user')` + `entities.User.create()` |
| **Eventos** | paid, approved, completed → active; canceled, refunded → inactive |
| **Proteção** | try/catch em inviteUser (email já convidado) + retry em create |

#### `authenticateUser.js` — Autenticação Backend
| Atributo | Valor |
|----------|-------|
| **SDK** | `0.7.1` ⚠️ |
| **Auth** | `signInWithPassword` |
| **Propósito** | Login + verificação account_status |
| **Status Check** | pending_payment → 403; inactive → 403; active → 200 + token |

#### `getFinancialSummary.js` — Resumo Financeiro
| Atributo | Valor |
|----------|-------|
| **SDK** | `0.7.1` ⚠️ |
| **Input** | startDate, endDate, summaryOnly? |
| **Cálculos** | revenueTotal, netProfit, ticketMedio, totalApts, series (daily) |
| **Output** | summary + details (payments, lookup clients/services) |

#### `createCompleteAttendance.js` — Registro Completo
| Atributo | Valor |
|----------|-------|
| **SDK** | `0.7.1` ⚠️ |
| **Input** | appointmentData, paymentData, productsUsed |
| **Ações** | 1) Cria Appointment → 2) Cria Payment → 3) Baixa estoque |
| **Rollback** | Log de inconsistência se falha parcial (⚠️ sem rollback real) |

#### `updateDashboardMetrics.js` — Sincronização de Métricas
| Atributo | Valor |
|----------|-------|
| **SDK** | `0.7.1` ⚠️ |
| **Propósito** | Recalcular DashboardMetric do zero |
| **Queries** | Appointments concluídos (mês), Appointments hoje, Clientes novos (mês) |
| **⚠️ Nota** | Usa `Promise.all` (viola Regra 4.1 da Doutrina) |

#### `onAppointmentCompleted.js` — Trigger: Conclusão
| Atributo | Valor |
|----------|-------|
| **SDK** | `0.7.1` ⚠️ |
| **Input** | appointmentId |
| **Ação** | Incrementa revenueTotal, netProfit, completedAppointmentsCount |
| **Validação** | Só atualiza se agendamento é do mês atual |

#### `onAppointmentCreated.js` — Trigger: Criação
| Atributo | Valor |
|----------|-------|
| **SDK** | `0.7.1` ⚠️ |
| **Input** | appointmentId |
| **Ação** | Incrementa todayAppointmentsCount + métricas se já concluído |

#### `onClientCreated.js` — Trigger: Novo Cliente
| Atributo | Valor |
|----------|-------|
| **SDK** | `0.7.1` ⚠️ |
| **Input** | clientId |
| **Ação** | Incrementa newClientsCount no DashboardMetric |

#### `deleteService.js` — Exclusão Segura de Serviço
| Atributo | Valor |
|----------|-------|
| **SDK** | `0.7.1` ⚠️ |
| **Validação** | Busca agendamentos vinculados (limit 1) |
| **Resposta** | 409 Conflict se há dependências; 200 se excluído |

#### `getInventoryMetrics.js` — Métricas do Estoque
| Atributo | Valor |
|----------|-------|
| **SDK** | `0.7.1` ⚠️ |
| **Cálculos** | totalUnits, totalCost, totalValueReceived, totalProfit |

#### `getClientSummary.js` — Resumo de Cliente
| Atributo | Valor |
|----------|-------|
| **SDK** | `0.7.1` ⚠️ |
| **Input** | clientId |
| **Output** | totalAppointments, totalPaidValue, averageTicket, pendingBalance |

#### `getOccupancyRate.js` — Taxa de Ocupação
| Atributo | Valor |
|----------|-------|
| **SDK** | `0.7.1` ⚠️ |
| **Input** | startDate, endDate |
| **Lógica** | Calcula horas disponíveis (work_hours do user) vs horas trabalhadas |

#### `updateUserPassword.js` — Alteração de Senha
| Atributo | Valor |
|----------|-------|
| **SDK** | `0.7.1` ⚠️ |
| **⚠️ PROBLEMA GRAVE** | Chama `authService` deprecado para validar senha atual |
| **⚠️ LIMITAÇÃO** | SDK não permite atualizar senha → salva hash + nota no User |

### 7.2 DEPRECADAS

| Função | Status | Motivo | Retorno |
|--------|--------|--------|---------|
| `authService.js` | ☠️ DEPRECATED | Senhas hardcoded | HTTP 410 Gone |
| `validateActiveUserLogin.js` | ☠️ DEPRECATED | Substituído por auth nativa | HTTP 410 Gone |
| `preRegisterUser.js` | ☠️ DEPRECATED | Webhook faz criação | HTTP 410 Gone |
| `DEPRECATED_updateDashboardMetrics.js` | ☠️ DEPRECATED | Substituído por triggers | HTTP 410 Gone |

### 7.3 PERIGOSA (NÃO DEPRECADA MAS DEVERIA SER)

#### `authValidate.js` — ☠️ LIXO TÓXICO ATIVO
**CONTEÚDO**: Lista de senhas hardcoded em texto puro:
```
admin@nailflow.com / nailflow2024
demo@nailflow.com / demo123
hugolemes@gmail.com / moderador
hugolemes@gmail.com / hugo123
jhbprivado@gmail.com / moderador
test@nailflow.com / test123
```
**SDK**: `0.1.0` (extremamente desatualizado)
**STATUS**: ⚠️ **ATIVO E ACESSÍVEL** — não foi deprecado na migração
**RISCO**: Qualquer pessoa que descubra o endpoint pode ler senhas reais

---

## 8. FLUXO DE AUTENTICAÇÃO

### Fluxo de Onboarding (Novo Cliente)
```
1. Cliente → Checkout Veksell → Paga
2. Veksell → POST webhook com token + client data
3. processVeksellWebhook.js:
   a) timingSafeEqual(token, VEKSSELL_WEBHOOK_SECRET)
   b) Busca User por email
   c) Se não existe:
      - base44.users.inviteUser(email, 'user')
      - base44.asServiceRole.entities.User.create({...})
   d) Se existe: atualiza account_status
4. Cliente recebe email da Base44 → Define senha
5. Cliente acessa /AcessoPainel
6. base44.auth.signInWithPassword({ email, password })
7. Verifica account_status === 'active'
8. Redireciona para Dashboard
```

### Fluxo de Login (Usuário Existente)
```
1. /AcessoPainel → email + senha
2. base44.auth.signInWithPassword()
3. base44.auth.me() → user object
4. if account_status !== 'active' → bloqueia com mensagem
5. if active → navigate('/Dashboard')
```

### Fluxo de Logout
```
1. Sidebar Footer → "Sair da Conta"
2. base44.auth.logout()
3. Redireciona para /AcessoPainel
```

---

## 9. HOOKS CUSTOMIZADOS

| Hook | Arquivo | Propósito |
|------|---------|-----------|
| `useGlobalState` | `components/hooks/useGlobalState` | Estado global (user, auth, tema) |
| `useUserSettings` | `components/hooks/useUserSettings` | CRUD de configurações do user |
| `useDateRange` | `components/hooks/useDateRange` | Filtros de período (financeiro) |
| `useAppointments` | `components/agenda/AppointmentHook` | Busca agendamentos por range |
| `useFinanceStats` | `components/hooks/useFinanceStats` | Estatísticas financeiras |
| `useFinanceCache` | `components/hooks/useFinanceCache` | Cache de dados financeiros |
| `usePaymentsHistory` | `components/hooks/usePaymentsHistory` | Histórico de pagamentos |
| `useConfirm` | `components/hooks/useConfirm` | Confirmação assíncrona (Promise) |
| `useWorkingHours` | `components/hooks/useWorkingHours` | Horários de trabalho |
| `useLive` | `components/hooks/useLive` | Dados em tempo real |
| `useTheme` | `components/ThemeProvider` | DEPRECATED → delega para useGlobalState |
| `useAuth` | `lib/AuthContext` | Contexto de auth da plataforma |

---

## 10. AUTOMAÇÕES

**Status**: Nenhuma automação cadastrada na plataforma.

**Triggers manuais** (chamados do frontend):
- `onAppointmentCreated` → chamado após criar agendamento no Dashboard
- `onAppointmentCompleted` → chamado após concluir agendamento
- `onClientCreated` → chamado após criar cliente

**⚠️ Oportunidade**: Esses triggers deveriam ser Entity Automations da Base44, não chamadas manuais do frontend.

---

## 11. SECRETS & VARIÁVEIS DE AMBIENTE

| Secret | Valor Esperado | Uso |
|--------|---------------|-----|
| `VEKSSELL_WEBHOOK_SECRET` | Token secreto | Validação de webhooks Veksell |
| `JWT_SECRET` | Token JWT | ⚠️ LEGADO — não mais utilizado |
| `BASE44_APP_ID` | Auto-populado | ID da app (built-in) |

---

## 12. DEPENDÊNCIAS (NPM)

### Principais
| Pacote | Versão | Uso |
|--------|--------|-----|
| react | 18.2.0 | Framework principal |
| react-router-dom | 6.26.0 | Routing |
| @tanstack/react-query | 5.84.1 | Data fetching |
| recharts | 2.15.4 | Gráficos |
| date-fns | 3.6.0 | Manipulação de datas |
| framer-motion | 11.16.4 | Animações |
| lucide-react | 0.475.0 | Ícones |
| lodash | 4.17.21 | Utilitários |
| @base44/sdk | 0.8.28 | SDK da plataforma |

### UI (shadcn/ui + Radix)
`@radix-ui/react-*` (dialog, select, popover, etc.) — 20+ pacotes

### Extras
| Pacote | Uso |
|--------|-----|
| html2canvas | Captura de tela (relatórios) |
| jspdf | Geração de PDF |
| canvas-confetti | Efeitos visuais de celebração |
| three | 3D (não utilizado ativamente) |
| react-leaflet | Mapas (não utilizado ativamente) |
| @hello-pangea/dnd | Drag & Drop (não utilizado ativamente) |

---

## 13. MAPA DE MODAIS & POP-UPS

| Modal | Página | Tipo | Steps |
|-------|--------|------|-------|
| **NovoAgendamento** | Dashboard | Dialog Wizard | 3 (Cliente → Data → Pagamento) |
| **RelatorioModal** | Dashboard | Dialog | 1 (Tipo + Período → Relatório) |
| **NewAppointmentModal** | Agenda, Clientes | Dialog Wizard | 3 (StepClient → StepDateTime → StepPayment) |
| **FiltersModal** | Agenda | Dialog | 1 (Filtros avançados) |
| **DayModal** | Agenda (Month) | Dialog | 1 (Detalhes do dia) |
| **Formulário Cliente** | Clientes | Dialog | 1 (CRUD) |
| **Confirmação Exclusão** | Clientes | Dialog | 1 (Warning + Confirm) |
| **ClientDetailsModal** | Clientes | Dialog | 1 (Detalhes + Ações) |
| **NewServiceModal** | Serviços | Dialog Wizard | 2 (StepInfo → StepConfirm) |
| **ConfirmDialog** | Serviços, Estoque | Dialog | 1 (Confirmação) |
| **Edição Serviço** | Serviços | Dialog | 1 (Form) |
| **NewProductModal** | Estoque | Dialog | 1 (Criar/Editar) |
| **NewAttendanceModal** | Financeiro | Dialog | 1 (Registro completo) |
| **GoalsModal** | Financeiro | Dialog | 1 (Metas mensais) |
| **WorkingHoursModal** | Configurações | Dialog | 1 (Horários) |
| **LoyaltyModal** | Configurações | Dialog | 1 (Fidelidade) |

---

## 14. FLUXOS DE DADOS

### Fluxo: Novo Agendamento (Dashboard)
```
[UI] NovoAgendamento → Step1 (cliente/serviço) → Step2 (data/hora) → Step3 (pagamento)
  ↓
[Entity] Appointment.create({...})
  ↓
[Backend] onAppointmentCreated(appointmentId) → DashboardMetric.update(+1)
  ↓
[UI] fetchMetrics() → Dashboard re-renderiza
```

### Fluxo: Registro de Atendimento Completo (Financeiro)
```
[UI] NewAttendanceModal → Seleciona serviço/cliente/produtos
  ↓
[Backend] createCompleteAttendance({appointmentData, paymentData, productsUsed})
  ↓
  ├─→ Appointment.create(appointmentData)
  ├─→ Payment.create(paymentData)
  └─→ Product.update(stock -= qty) [para cada produto usado]
  ↓
[UI] fetchFinancials() → Financeiro re-renderiza
```

### Fluxo: Métricas do Dashboard (Compute-on-Write)
```
Evento: Cliente criado → onClientCreated → DashboardMetric.newClientsCount++
Evento: Agendamento criado → onAppointmentCreated → DashboardMetric.todayAppointmentsCount++
Evento: Agendamento concluído → onAppointmentCompleted → DashboardMetric.revenueTotal += price
  ↓
Dashboard.fetchMetrics() → DashboardMetric.list() → Leitura instantânea
```

### Fluxo: Exclusão Segura de Serviço
```
[UI] Botão Excluir → ConfirmDialog
  ↓
[Backend] deleteService(serviceId)
  ├─→ Appointment.filter({service_id}) → Verifica dependências
  ├─→ Se tem agendamentos → 409 Conflict
  └─→ Se não tem → Service.delete(serviceId) → 200 OK
```

---

## 15. VULNERABILIDADES & DÉBITOS TÉCNICOS

### 🔴 CRÍTICOS

| # | Descrição | Arquivo | Impacto |
|---|-----------|---------|---------|
| C1 | **`authValidate.js` ATIVO com senhas em texto puro** | `functions/authValidate.js` | Emails e senhas reais expostos no código-fonte de uma função ativa |
| C2 | **`updateUserPassword.js` chama `authService` deprecado** | `functions/updateUserPassword.js` (linha 79) | Funcionalidade de troca de senha **100% quebrada** — chama endpoint que retorna 410 |
| C3 | **SDK 0.7.1 em 12 funções** | Todas exceto processVeksellWebhook | Possíveis incompatibilidades com SDK 0.8.28 do frontend |

### 🟠 IMPORTANTES

| # | Descrição | Arquivo | Impacto |
|---|-----------|---------|---------|
| I1 | **Enum `payment_method` inconsistente** | Payment entity vs Appointment | Payment usa `debit/credit`, Appointment usa `cartao` |
| I2 | **`updateDashboardMetrics` usa Promise.all** | `functions/updateDashboardMetrics.js` | Viola Regra 4.1 (queries concorrentes) |
| I3 | **Triggers são chamados manualmente do frontend** | Clientes.jsx, modais | Se o frontend não chama, métricas ficam desatualizadas |
| I4 | **`authenticateUser.js` é redundante** | `functions/authenticateUser.js` | Login agora é feito no frontend via SDK; função não é mais chamada |
| I5 | **`base44Client.js` tem `requiresAuth: false`** | `api/base44Client.js` | App pública — qualquer pessoa pode acessar sem login |
| I6 | **`createCompleteAttendance` sem rollback** | `functions/createCompleteAttendance.js` | Se Payment.create falha, Appointment fica órfão |

### 🟡 MENORES

| # | Descrição | Arquivo | Impacto |
|---|-----------|---------|---------|
| M1 | **`index.html` não customizado** | `index.html` | Título "Base44 APP", favicon genérica |
| M2 | **`ThemeProvider` é wrapper vazio** | `components/ThemeProvider.jsx` | Importado por 2 páginas sem necessidade |
| M3 | **Pacotes não utilizados** | `package.json` | three, react-leaflet, @hello-pangea/dnd, canvas-confetti |
| M4 | **Página pública não implementada** | PublicPageCard + slug | Configuração existe mas página não existe |
| M5 | **RelatorioModal usa Promise.all** | `components/modals/RelatorioModal.jsx` | Viola Regra 4.1 no frontend (menos crítico) |
| M6 | **`cost` field no Product entity** | `entities/Product.json` | Campo `cost` declarado mas não é `required`; `cost_total` e `cost_unit` são required |

---

## 16. INVENTÁRIO DE ARQUIVOS DEPRECADOS

| Arquivo | Status | Data | Retorno HTTP |
|---------|--------|------|-------------|
| `functions/authService.js` | ☠️ DEPRECATED | 2026-01-03 | 410 Gone |
| `functions/validateActiveUserLogin.js` | ☠️ DEPRECATED | 2026-01-03 | 410 Gone |
| `functions/preRegisterUser.js` | ☠️ DEPRECATED | 2026-01-03 | 410 Gone |
| `functions/DEPRECATED_updateDashboardMetrics.js` | ☠️ DEPRECATED | Anterior | 410 Gone |
| `functions/authValidate.js` | ⚠️ **ATIVO MAS DEVERIA SER DEPRECATED** | — | 200 com senhas |
| `functions/authenticateUser.js` | ⚠️ **REDUNDANTE** | — | 200 (funcional mas não chamado) |

---

## RESUMO EXECUTIVO

### Números do Projeto
| Métrica | Valor |
|---------|-------|
| **Páginas** | 9 |
| **Componentes customizados** | ~50+ |
| **Hooks customizados** | 12 |
| **Backend functions** | 18 (12 ativas, 4 deprecated, 2 problemáticas) |
| **Entidades** | 7 (6 de negócio + 1 User) |
| **Modais** | 16 |
| **Secrets** | 2 |
| **Automações** | 0 (triggers são manuais) |

### Prioridades de Correção
1. **URGENTE**: Deprecar `authValidate.js` (senhas expostas)
2. **URGENTE**: Corrigir `updateUserPassword.js` (funcionalidade quebrada)
3. **IMPORTANTE**: Atualizar SDK para 0.8.25+ em todas as functions
4. **IMPORTANTE**: Converter triggers manuais em Entity Automations
5. **DESEJÁVEL**: Customizar index.html (título, favicon)
6. **DESEJÁVEL**: Resolver inconsistência de enums payment_method

---

*Documento gerado por auditoria forense automatizada — Nail Flow SaaS*
*Data: 2026-05-16 | Plataforma: Base44*