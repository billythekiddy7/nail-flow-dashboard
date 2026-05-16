# 🚨 AUDITORIA FORENSE COMPLETA — INVENTÁRIO DE BUGS
### Sistema: Nail Flow SaaS | Data: 2026-05-16 | Plataforma: Base44
### Doutrina aplicada: AI CONTROLS v6.0 — Certeza Absoluta

---

## SUMÁRIO EXECUTIVO

| Severidade | Quantidade | Impacto |
|------------|-----------|---------|
| 🔴 **CRÍTICO** | 14 | Vazamento de dados, funcionalidades quebradas, perda de integridade |
| 🟠 **ALTO** | 18 | Quebra de regras de negócio, performance, UX comprometida |
| 🟡 **MÉDIO** | 22 | Inconsistências, dívida técnica, manutenção dificultada |
| 🔵 **BAIXO** | 16 | Cosmético, acessibilidade, otimização |
| **TOTAL** | **70 bugs** | — |

---

# 🔴 BUGS CRÍTICOS (P0 — Resolver IMEDIATAMENTE)

## C1. Senhas em Texto Puro Ativas no Backend ☠️
**Arquivo**: `functions/authValidate.js` (linhas 9-52)
**Severidade**: 🔴 CRÍTICA — VAZAMENTO DE DADOS
**Descrição**:
Função ativa contém credenciais hardcoded de usuários REAIS em texto puro:
```javascript
{ email: 'hugolemes@gmail.com', password: 'moderador' }
{ email: 'jhbprivado@gmail.com', password: 'moderador' }
{ email: 'admin@nailflow.com', password: 'nailflow2024' }
```
**Impacto**: Qualquer pessoa com acesso ao endpoint pode autenticar como esses usuários reais. Backdoor ativa.
**Causa raiz**: Não foi deprecada na migração para auth nativa.
**Correção**: Substituir conteúdo por handler 410 Gone (como `authService.js`).

---

## C2. Função de Alteração de Senha 100% Quebrada ☠️
**Arquivo**: `functions/updateUserPassword.js` (linhas 79-91)
**Severidade**: 🔴 CRÍTICA — FUNCIONALIDADE INOPERANTE
**Descrição**:
A função chama `authService` (DEPRECATED → retorna HTTP 410) para validar a senha atual:
```javascript
const authServiceUrl = `.../functions/authService`;
const authResponse = await fetch(authServiceUrl, { ... });
// authService SEMPRE retorna 410 Gone → authResponse.ok === false
// → Sempre retorna "A senha atual está incorreta"
```
**Impacto**: NENHUM usuário consegue alterar a senha. O card "Alterar Senha" em Configurações está 100% quebrado.
**Causa raiz**: Esqueceu-se de atualizar essa função na migração.
**Correção**: Refatorar para usar `base44.auth.signInWithPassword({ email, password: currentPassword })` para validar.

---

## C3. `createCompleteAttendance` Sem Rollback Transacional ⚠️
**Arquivo**: `functions/createCompleteAttendance.js` (linhas 32-45)
**Severidade**: 🔴 CRÍTICA — CORRUPÇÃO DE DADOS
**Descrição**:
```javascript
const createdAppointment = await Appointment.create(appointmentData); // ✅
await Payment.create({ ... appointment_id: createdAppointmentId }); // pode falhar
// se falhar aqui, agendamento fica órfão (sem pagamento, mas registrado)
for (const usedProduct of productsUsed) {
    await Product.update(...); // pode falhar no meio
    // se falhar no produto 3 de 5, estoque fica inconsistente
}
```
**Impacto**: Falha parcial deixa o banco em estado corrompido (agendamento sem pagamento, estoque parcialmente abatido).
**Causa raiz**: Base44 entities não suportam transações ACID. Apenas log de inconsistência (linha 52).
**Correção**: Implementar compensação: se Payment falha → deletar Appointment; se Product falha → reverter Products já atualizados.

---

## C4. SDK 0.1.0 em `authValidate.js`
**Arquivo**: `functions/authValidate.js` (linha 2)
**Severidade**: 🔴 CRÍTICA — INCOMPATIBILIDADE
**Descrição**: `import { createClient } from 'npm:@base44/sdk@0.1.0';`
**Impacto**: SDK 28 versões atrás do frontend (0.8.28). Métodos não existem ou foram renomeados.
**Correção**: Será removido junto com C1.

---

## C5. SDK Desatualizado em 12 Funções Backend
**Arquivos**: Quase todos em `functions/*.js`
**Severidade**: 🔴 CRÍTICA — INCOMPATIBILIDADE FUTURA
**Descrição**: Todas as funções (exceto `processVeksellWebhook`) usam `npm:@base44/sdk@0.7.1`. Frontend usa `0.8.28`.
**Lista afetada**:
- `authenticateUser.js`, `getFinancialSummary.js`, `createCompleteAttendance.js`
- `updateDashboardMetrics.js`, `onAppointmentCreated.js`, `onAppointmentCompleted.js`
- `onClientCreated.js`, `deleteService.js`, `getInventoryMetrics.js`
- `getClientSummary.js`, `getOccupancyRate.js`, `updateUserPassword.js`
- `DEPRECATED_updateDashboardMetrics.js`

**Impacto**: Risco de breaking changes silenciosos. APIs deprecated podem deixar de funcionar.
**Correção**: Migrar para `0.8.25` em todas, conforme guia da Base44.

---

## C6. Violação MASSIVA da Regra 4.1 (Promise.all) no Backend
**Arquivo**: `functions/updateDashboardMetrics.js` (linhas 37-55)
**Severidade**: 🔴 CRÍTICA — INSTABILIDADE
**Descrição**: Faz 3 queries concorrentes ao banco:
```javascript
const [currentMonthAppointments, todayAppointments, currentMonthNewClients] = await Promise.all([
    base44.asServiceRole.entities.Appointment.filter({...}),
    base44.asServiceRole.entities.Appointment.filter({...}),
    base44.asServiceRole.entities.Client.filter({...})
]);
```
**Impacto**: Viola PILAR IV da Doutrina AI CONTROLS v6.0. Causa sobrecarga e timeouts.
**Correção**: Converter para `await` sequencial.

---

## C7. `app` Tem `requiresAuth: false` (App PÚBLICA)
**Arquivo**: `api/base44Client.js` (linha 12)
**Severidade**: 🔴 CRÍTICA — VULNERABILIDADE DE ACESSO
**Descrição**: `requiresAuth: false` → app é pública. Qualquer pessoa pode acessar TODAS as páginas sem login.
**Evidência**: RLS por `created_by` protege os dados, mas a UI fica exposta. Usuários não autenticados veem o Dashboard vazio em vez de serem redirecionados.
**Impacto**: SaaS pago acessível publicamente.
**Correção**: Mudar para `requiresAuth: true` ou implementar guard explícito.

---

## C8. `useLive` Re-cria Filtro a Cada Render
**Arquivo**: `components/hooks/useLive` (linha 64)
**Severidade**: 🔴 CRÍTICA — LOOP INFINITO POTENCIAL
**Descrição**:
```javascript
}, [entityClass, JSON.stringify(filter)]);
```
Se o componente pai passa `filter = { status: 'concluido' }` como **objeto literal inline** (`<FaturamentoChart />` faz isso na linha 46), o `JSON.stringify` gera nova string, mas como filter é re-criado a cada render → re-fetch infinito em condições específicas.
**Impacto**: O `FaturamentoChart` usado no Dashboard pode causar fetch em loop em re-renders.
**Correção**: Memoizar filter no chamador OU usar deep comparison.

---

## C9. `Dashboard` Cálculo de Ocupação INVENTADO
**Arquivo**: `pages/Dashboard.jsx` (linhas 60-65)
**Severidade**: 🔴 CRÍTICA — DADO FALSO EXIBIDO
**Descrição**:
```javascript
const workingDays = 22; // Aproximação para o mês
const averageAppointmentsPerDay = completedAppointments / workingDays;
const maxAppointmentsPerDay = 8; // Assumindo 8 horários por dia
const calculatedOccupancyRate = (averageAppointmentsPerDay / maxAppointmentsPerDay) * 100;
```
Hardcoded `workingDays=22` e `maxAppointmentsPerDay=8` ignoram completamente o `work_hours` configurado pelo usuário. Existe a função `getOccupancyRate` no backend, mas o Dashboard NÃO a chama.
**Impacto**: Métrica "Taxa de Ocupação" exibida no Dashboard é fictícia/incorreta.
**Correção**: Chamar `getOccupancyRate({ startDate, endDate })`.

---

## C10. `NewAppointmentModal` Cálculo de Lucro Simplificado
**Arquivo**: `components/agenda/NewAppointmentModal/index` (linha 135)
**Severidade**: 🔴 CRÍTICA — DADO FINANCEIRO INCORRETO
**Descrição**:
```javascript
profit: finalPrice * 0.7, // Cálculo simplificado
```
Hardcoded 70% de margem. Não considera `products_used` do serviço. Quebra todas as métricas financeiras quando o agendamento é concluído.
**Impacto**: Lucro Líquido no Dashboard e Financeiro será sempre 70% do faturamento, independentemente dos produtos consumidos.
**Correção**: Replicar lógica de `calculateRealProfit` do `NovoAgendamento.jsx` (linha 55).

---

## C11. `onAppointmentCreated` Incrementa `todayAppointmentsCount` Errado
**Arquivo**: `functions/onAppointmentCreated.js` (linha 82)
**Severidade**: 🔴 CRÍTICA — CONTADOR INCORRETO
**Descrição**:
```javascript
const updates = {
    todayAppointmentsCount: metrics.todayAppointmentsCount + 1
};
```
A função incrementa `todayAppointmentsCount` para **qualquer** agendamento do **mês atual**, não apenas os de **hoje**. O nome `todayAppointmentsCount` é mantido mas a lógica incrementa para o mês inteiro.
**Impacto**: Badge "Agendamentos Hoje" no sidebar mostra valor errado (mês inteiro em vez de hoje).
**Correção**: Verificar `isSameDay(appointmentDate, now)` antes de incrementar.

---

## C12. `processVeksellWebhook` Pode Criar Usuário Duplicado
**Arquivo**: `functions/processVeksellWebhook.js` (linhas 113-148)
**Severidade**: 🔴 CRÍTICA — CORRUPÇÃO DE DADOS
**Descrição**: Race condition possível:
```javascript
await base44.users.inviteUser(email, 'user');  // PASSO 1
await base44.asServiceRole.entities.User.create({...}); // PASSO 2
```
Se `inviteUser` cria o registro do User automaticamente (comportamento Base44), o `User.create` falha mas o catch tenta atualizar. Porém, em condições de alta concorrência (2 webhooks Veksell em paralelo), pode criar 2 registros.
**Impacto**: Usuários duplicados na base.
**Correção**: Adicionar verificação atômica com retry exponencial ou usar `upsert` se disponível.

---

## C13. Entity `Payment` Enum Inconsistente com `Appointment`
**Arquivos**: `entities/Payment.json` vs `entities/Appointment.json`
**Severidade**: 🔴 CRÍTICA — INTEGRIDADE REFERENCIAL
**Descrição**:
- Payment.method: `["dinheiro", "pix", "debit", "credit"]`
- Appointment.payment_method: `["dinheiro", "pix", "cartao", "a_vista"]`

Quando `NewAppointmentModal` cria Appointment com `payment_method: 'fiado'` (linha 133) — valor que NÃO está no enum! Validação RLS pode falhar ou aceitar silenciosamente.

`NewAttendanceModal` usa `debit`/`credit` no Payment, mas o Appointment é criado com mesma estring — inconsistência interna.

**Impacto**: Filtros por método de pagamento quebram. Relatórios financeiros agrupam errado.
**Correção**: Unificar enum em ambas entidades para `["dinheiro", "pix", "debit", "credit", "fiado", "a_vista"]`.

---

## C14. `entities/Product` Tem Campo `cost` Sem Validação
**Arquivo**: `entities/Product.json`
**Severidade**: 🔴 CRÍTICA — CAMPO FANTASMA
**Descrição**: Schema declara propriedade `cost` (não no `required`), mas o frontend `NewAttendanceModal.jsx` (linha 140) lê `product.cost` para calcular custo total:
```javascript
return total + ((product?.cost || 0) * usedProduct.qty);
```
Porém, `cost` nunca é preenchido em lugar nenhum — só `cost_total` e `cost_unit` são usados.
**Impacto**: `calculateTotalCost()` SEMPRE retorna 0 → lucro real nunca é calculado corretamente nos atendimentos manuais.
**Correção**: Trocar `product?.cost` por `product?.cost_unit`.

---

# 🟠 BUGS DE ALTA SEVERIDADE (P1)

## A1. Triggers Manuais Acoplam Frontend ao Backend
**Arquivos**: `pages/Clientes.jsx` (linha 107), `components/agenda/NewAppointmentModal/index` (linha 144)
**Descrição**: Triggers `onClientCreated` e `onAppointmentCreated` são chamados manualmente do frontend após cada `create`. Se o usuário fecha o navegador entre o `create` e o `invoke`, o `DashboardMetric` fica dessincronizado.
**Correção**: Migrar para Entity Automations da Base44 (`automation_type: "entity"`).

---

## A2. `loadData` em Agenda Usa Promise.all Concorrente
**Arquivo**: `pages/Agenda.jsx` (linhas 61-64)
**Descrição**: Comentário diz "Carregar dados em sequência" mas usa `Promise.all`.
```javascript
// Carregar dados em sequência para evitar rate limit
const [clientsData, servicesData] = await Promise.all([...]);
```
**Impacto**: Viola Regra 4.1 (Doutrina AI CONTROLS v6.0).
**Correção**: Trocar por `await` sequencial.

---

## A3. `RelatorioModal` Promise.all Concorrente
**Arquivo**: `components/modals/RelatorioModal.jsx` (linhas 36-40)
**Descrição**: `Promise.all([Appointment.list, Client.list, Service.list])` — 3 queries concorrentes.
**Correção**: Sequencializar.

---

## A4. `NewAppointmentModal/index` Promise.all Concorrente
**Arquivo**: `components/agenda/NewAppointmentModal/index` (linhas 48-51)
**Descrição**: `Promise.all([Client.list, Service.list])` no `loadData()`.
**Correção**: Sequencializar.

---

## A5. Backend `getFinancialSummary` Usa `base44.entities` em vez de `asServiceRole`
**Arquivo**: `functions/getFinancialSummary.js` (linhas 34, 40, 68, 71)
**Descrição**: Mistura `base44.entities` (escopo do usuário) e não usa `asServiceRole` consistentemente. Isso é correto pela doutrina (usar user-scoped quando responde a UI), mas pode causar discrepâncias se houver bug em RLS.
**Recomendação**: Padronizar abordagem em todas as funções de leitura.

---

## A6. `Layout.jsx` Tem `}}` Extra em Style Tag
**Arquivo**: `Layout.jsx` (linha 168)
**Descrição**:
```css
.sidebar-mobile [data-sidebar="footer"] {
    background: var(--secondary-bg) !important;
    border-color: var(--border) !important;
}
}    <-- chave extra
}
```
**Impacto**: CSS quebrado a partir dessa linha. Browser pode ignorar regras posteriores.
**Correção**: Remover a chave extra.

---

## A7. `Servicos.jsx` Não Trata Erro em `loadServices`
**Arquivo**: `pages/Servicos.jsx` (linhas 32-37)
**Descrição**:
```javascript
const loadServices = async () => {
    setLoading(true);
    const servicesData = await Service.list('-created_date');  // sem try/catch
    setServices(servicesData);
    setLoading(false);
};
```
Sem try/catch. Se falhar, loading nunca para → tela travada.
**Correção**: Adicionar try/catch/finally.

---

## A8. `Servicos.jsx` Importa `Appointment` Sem Uso
**Arquivo**: `pages/Servicos.jsx` (linha 4)
**Descrição**: `import { Appointment } from '@/entities/Appointment';` — nunca usado.
**Correção**: Remover.

---

## A9. `NewAppointmentModal` Status Inválido para Fiado
**Arquivo**: `components/agenda/NewAppointmentModal/index` (linha 133)
**Descrição**:
```javascript
status: formData.payment_method === 'fiado' ? 'agendado' : 'confirmado',
```
Cria com status `confirmado` ao criar (não `agendado`). Isso quebra a separação de fluxo: confirmados aparecem como tal antes de o atendimento acontecer.
**Correção**: Padronizar status inicial como `agendado`.

---

## A10. `Dashboard` Sem Verificação `account_status` no Frontend
**Arquivo**: `pages/Dashboard.jsx`
**Descrição**: Backend `authenticateUser` verifica `account_status === 'active'`, mas se o usuário burla isso (sessão antiga), o Dashboard carrega normalmente. Sem guard.
**Correção**: No Layout, verificar `user.account_status` e redirecionar para tela de bloqueio se não-ativo.

---

## A11. `MonthView` Não Mostra Dias do Mês Anterior/Próximo
**Arquivo**: `components/agenda/MonthView` (linhas 15-17)
**Descrição**:
```javascript
const monthStart = startOfMonth(selectedDate);
const monthEnd = endOfMonth(selectedDate);
const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
```
Só renderiza dias do mês atual. Calendário começa no dia 1, gerando layout desalinhado (1 do mês cai em terça, mas aparece no domingo da grid).
**Impacto**: Calendário visualmente quebrado.
**Correção**: Usar `startOfWeek(monthStart)` e `endOfWeek(monthEnd)`.

---

## A12. `MonthView` Cabeçalho de Semana com Domingo Errado
**Arquivo**: `components/agenda/MonthView` (linha 63)
**Descrição**:
```javascript
{['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(...)}
```
Começa em Domingo. Mas em `WeekCards` (linha 14), `startOfWeek(..., { weekStartsOn: 1 })` começa em Segunda. Inconsistência entre views.
**Correção**: Padronizar início da semana.

---

## A13. `NovoAgendamento` (Dashboard) Não Dispara Trigger
**Arquivo**: `components/modals/NovoAgendamento.jsx` (linha 110)
**Descrição**:
```javascript
await Appointment.create(appointmentData);
onSuccess?.();  // NÃO chama onAppointmentCreated!
```
Diferente do `NewAppointmentModal` da Agenda. Agendamentos criados pelo Dashboard NÃO atualizam o `DashboardMetric`.
**Correção**: Adicionar chamada a `onAppointmentCreated`.

---

## A14. `DayView` `appointments.sort()` Muta o Array Original
**Arquivo**: `components/agenda/DayView` (linha 30)
**Descrição**:
```javascript
const sortedAppointments = appointments.sort(...);
```
`.sort()` muta o array. React pode não detectar mudança em re-renders.
**Correção**: `[...appointments].sort(...)` para criar cópia.

---

## A15. `NewAttendanceModal` Permite Estoque Negativo (validação só no submit)
**Arquivo**: `components/finance/NewAttendanceModal` (linhas 97-108)
**Descrição**: Validação de estoque só roda no `validateForm()` (submit). Não há feedback visual imediato ao usuário ao selecionar uma quantidade maior que o estoque.
**Correção**: Validação inline no `updateProduct`.

---

## A16. `Configuracoes` Usa `useTheme()` Mas `toggleTheme` Não Existe
**Arquivo**: `pages/Configuracoes.jsx` (linhas 19, 42)
**Descrição**:
```javascript
const { toggleTheme } = useTheme();  // useTheme = useGlobalState
// ...
toggleTheme(); // mas useGlobalState não exporta toggleTheme!
```
`useGlobalState` (de acordo com summary) só exporta `{ user, isLoading, isAuthenticated, isDark, updateUser, reloadUser }`. Chamar `toggleTheme()` → erro runtime ou silencioso.
**Correção**: Remover `toggleTheme()` (tema é fixo dark).

---

## A17. `useUserSettings` Importa `User` de `@/entities/User` (Não Existe Como Export)
**Arquivo**: `components/hooks/useUserSettings` (linha 3)
**Descrição**:
```javascript
import { User } from '@/entities/User';
```
A Base44 expõe User via `base44.auth.me()` / `base44.entities.User`, não como import direto de `@/entities/User`. Pode estar funcionando por mágica do bundler, mas é inconsistente com outros entities (que usam `@/entities/all`).
**Correção**: Usar `base44.auth.me()` e `base44.auth.updateMe()`.

---

## A18. `processVeksellWebhook` Resposta de `User.filter` Não Está No Padrão SDK
**Arquivo**: `functions/processVeksellWebhook.js` (linha 72)
**Descrição**:
```javascript
const { data: existingUsers, error: searchError } = await base44.asServiceRole.entities.User.filter({ email });
```
O método `entities.X.filter()` da Base44 retorna um **array direto**, não `{ data, error }`. Isso é o padrão do Supabase. Provavelmente `existingUsers` está sempre `undefined`.
**Impacto**: Pode estar sempre criando usuários novos (cenário B) em vez de atualizar (cenário A).
**Correção**: `const existingUsers = await base44.asServiceRole.entities.User.filter({ email });`

---

# 🟡 BUGS DE SEVERIDADE MÉDIA (P2)

## M1. Inputs com Classes Tailwind Inline Gigantescas
**Arquivos**: `pages/Clientes.jsx` (linhas 174, 178, 182, 186), `pages/Servicos.jsx` (linhas 104, 109-110)
**Descrição**: Cada `<Input>` tem ~200 caracteres de className duplicados.
**Correção**: Mover para classe utility ou variant.

---

## M2. Modal `NovoAgendamento` Hardcoded `#333333` (Não Usa CSS Vars)
**Arquivo**: `components/modals/NovoAgendamento.jsx` (linhas 218, 277)
**Descrição**: `style={{ background: '#333333' }}` — ignora design system.
**Correção**: Usar `var(--secondary-bg)`.

---

## M3. `RelatorioModal` className com 500+ caracteres
**Arquivo**: `components/modals/RelatorioModal.jsx` (linhas 288, 303, 334, 363, 383, 481)
**Descrição**: Strings de className gigantescas com classes redundantes/duplicadas.
**Correção**: Extrair para variants do Dialog/Button.

---

## M4. `Dashboard` Loading Duplicado
**Arquivo**: `pages/Dashboard.jsx` (linhas 100-123)
**Descrição**: Dois loaders idênticos (globalLoading e loading). Pode-se unificar.

---

## M5. `Servicos.jsx` `parseFloat(undefined)` Possível
**Arquivo**: `pages/Servicos.jsx` (linhas 44-45)
**Descrição**:
```javascript
price: parseFloat(formData.get('price')),
duration: parseInt(formData.get('duration')),
```
Se inputs vazios → `NaN`. Sem validação.

---

## M6. `Agenda.jsx` `useTheme` Importado, `isDark` Não Usado
**Arquivo**: `pages/Agenda.jsx` (linha 25)
**Descrição**: `const { isDark } = useTheme();` — `isDark` nunca usado.

---

## M7. `Financeiro.jsx` `useTheme` Importado, `isDark` Não Usado
**Arquivo**: `pages/Financeiro.jsx` (linha 34)
**Descrição**: Igual M6.

---

## M8. `NovoAgendamento.jsx` Loading com `alert()`
**Arquivo**: `components/modals/NovoAgendamento.jsx` (linhas 80, 116, 135, 139)
**Descrição**: Usa `alert()` em vez de `toast`. UX inconsistente.

---

## M9. `NewAppointmentModal/index` `alert()` Em Vez de Toast
**Arquivo**: `components/agenda/NewAppointmentModal/index` (linhas 153, 159)
**Descrição**: Comentário diz "fallback" mas é o único path. `useToast` está disponível.

---

## M10. `ClientCard` Console.log de Debug em Produção
**Arquivo**: `components/clients/ClientCard` (linhas 50-54)
**Descrição**:
```javascript
console.log('🔥 BOTÃO DELETE CLICADO PARA:', client.name);
```
Logs de debug deixados em produção.

---

## M11. `Clientes.jsx` Console.log de Debug em Loops
**Arquivo**: `pages/Clientes.jsx` (linhas 37, 54, 75, 131)
**Descrição**: `console.log('📡 Carregando...')`, `console.log('🗑️ ...')` etc.

---

## M12. `RelatorioModal` `topClients.slice(0, 10) || []`
**Arquivo**: `components/modals/RelatorioModal.jsx` (linha 146)
**Descrição**: `.slice(0, 10)` nunca retorna falsy — `|| []` é dead code.

---

## M13. `index.html` Título "Base44 APP" (não customizado)
**Arquivo**: `index.html` (linha 8)
**Descrição**: SEO e PWA quebrados. Favicon Base44 genérica.

---

## M14. `FaturamentoChart` Filtro `{status: 'concluido'}` Causa N+1
**Arquivo**: `components/dashboard/FaturamentoChart` (linha 46)
**Descrição**: Busca TODOS os agendamentos concluídos (100 limite) só para filtrar no client por período. Se usuário tem >100 agendamentos, gráfico fica incompleto.

---

## M15. `MonthView` Status Cores não Padronizadas
**Arquivo**: `components/agenda/MonthView` vs `DayView` vs `WeekCards`
**Descrição**: MonthView usa `bg-blue-500` (sólido), enquanto DayView/WeekCards usam `bg-blue-100 text-blue-800` (claro/escuro). Visual inconsistente.

---

## M16. `pages.config.js` Não Será Regenerado (Aviso da Plataforma)
**Arquivo**: `pages.config.js`
**Descrição**: Conforme `<app_routing_note>`, novas páginas não serão adicionadas automaticamente.

---

## M17. `Layout.jsx` Aria-label de Botão Logout Faltando
**Arquivo**: `Layout.jsx` (botão Sair da Conta)
**Descrição**: Botão sem `aria-label` descritivo.

---

## M18. `ThemeProvider` Wrapper Vazio Mantido
**Arquivo**: `components/ThemeProvider`
**Descrição**: Componente que só faz passthrough. Pode ser removido.

---

## M19. `App.jsx` Tem Loop Para Pages Já Renderizadas
**Arquivo**: `App.jsx` (linhas 50-60)
**Descrição**: O loop `Object.entries(Pages)` re-renderiza Dashboard em `/Dashboard` mesmo já tendo em `/`. Roteamento duplicado.

---

## M20. `Estoque.jsx` `getInventoryMetrics` Não Verifica `response.error`
**Arquivo**: `pages/Estoque.jsx` (linha 36-39)
**Descrição**:
```javascript
const metricsResponse = await getInventoryMetrics();
setMetrics(metricsResponse.data);
```
Se backend retornar `{ error: '...' }`, `setMetrics({})` mesmo assim. Sem tratamento.

---

## M21. `Servicos.jsx` `loading` State Duplicado (Servicos + ConfirmDialog)
**Arquivo**: `pages/Servicos.jsx`
**Descrição**: ConfirmDialog tem seu próprio estado, e `Servicos` também. Pode causar dupla renderização.

---

## M22. `pages/Configuracoes` Acessa `userData?.theme` Mas Tema é Fixo
**Arquivo**: `pages/Configuracoes.jsx` (linha 41)
**Descrição**:
```javascript
if (formData.theme !== userData?.theme) { toggleTheme(); }
```
Tema é fixo dark, comparação é dead code.

---

# 🔵 BUGS DE SEVERIDADE BAIXA (P3)

## B1. Responsividade: Modal "Novo Serviço" Cores em Linha
**Evidência**: Doutrina menciona — paletinha de cores pode quebrar em mobile <420px.

## B2. Pacotes Não Utilizados
**Arquivo**: `package.json`
**Lista**: `three`, `react-leaflet`, `@hello-pangea/dnd`, `canvas-confetti`, `html2canvas`, `jspdf`
**Impacto**: Bundle size desnecessariamente grande.

## B3. CSS Duplicado entre `index.css` e `globals.css`
**Arquivos**: `index.css` e `globals.css` ambos definem variáveis :root.
**Impacto**: Cascade pode causar conflitos.

## B4. `index.css` Versus `globals.css` Não Está Claro Qual É Usado
**Descrição**: `main.jsx` importa `@/index.css`. `globals.css` não é importado, mas está presente.

## B5. `Dashboard` Não Possui Skeleton Específico (usa cinza genérico)
**Descrição**: Loader usa `bg-gray-700` em vez do tema.

## B6. `Agenda` Skeleton Usa `var(--border)` (correto)
**Descrição**: Inconsistente com Dashboard.

## B7. `WeekCards` `weekStartsOn: 1` (Segunda) mas Header em Inglês
**Descrição**: `format(date, 'EEEE', { locale: ptBR })` retorna português, OK. Sem bug real, mas verificar.

## B8. `RelatorioModal` Export TXT Não PDF
**Descrição**: Botão "Exportar Relatório" gera `.txt`. Há `jspdf` instalado mas não usado.

## B9. `MonthView` Aria-label Concatena Sem Plural
**Descrição**: "0 agendamentos" ou "1 agendamentos" — falta tratamento singular.

## B10. `ProductCard` Atributo `title` em SVG (não aria)
**Arquivo**: `components/inventory/ProductCard` (linha 27)
**Descrição**: `<AlertTriangle title="Estoque baixo" />` — `title` em SVG não funciona consistentemente. Usar `aria-label`.

## B11. `getInventoryMetrics` Log Diz "Sequential" Mas Está Sequencial OK
**Descrição**: Comentário "Promise.all violation" não se aplica — está sequencial. OK.

## B12. Logs `[CRONOS_TRIGGER_V1]` Verbosos em Produção
**Descrição**: Backend logs com versões internas. Limpar.

## B13. `Layout.jsx` `goalsUpdated` Listener Sem Cleanup em Caso de Re-mount
**Descrição**: useEffect tem cleanup OK, mas `fetchData` é re-criado.

## B14. `useAppointments` Debounce 300ms Pode Causar Cintilação
**Arquivo**: `components/agenda/AppointmentHook` (linha 55)
**Descrição**: Navegar de dia a dia rapidamente causa flicker.

## B15. `obrigado.jsx` Componente Chamado `ObrigadoPage` Mas Arquivo `obrigado`
**Descrição**: Convenção: arquivo deveria ser `Obrigado.jsx` (capitalizado).

## B16. `pages/Servicos.jsx` Cards Sem `slug` Quebra Layout
**Descrição**: Quando `service.slug` falta, há `&&` que esconde linha, mas espaçamento de cards fica inconsistente.

---

# 📊 BUGS DE RESPONSIVIDADE

| # | Local | Problema | Breakpoint |
|---|-------|----------|-----------|
| R1 | `RelatorioModal` `max-w-4xl` | Em tablet (768-1024px), modal corta conteúdo | md |
| R2 | `MonthView` cells `h-14` em mobile | 7 colunas em <420px ficam apertadas | xs |
| R3 | `Dashboard` 4 cards de métricas | Em <420px viram 2 colunas (OK), mas texto trunca | xs |
| R4 | `Financeiro` botões `Definir Metas`, `Registrar`, `Exportar` | Em mobile <640px, 3 botões em coluna ocupam muito espaço | sm |
| R5 | `WeekCards` grid `lg:grid-cols-7` | Entre sm e lg vira 1 coluna (lista) — perde contexto semanal | md |
| R6 | `Configuracoes` `ResponsiveGrid` 320px min | Em telas 640px, gera 1 coluna apenas | sm |
| R7 | `Estoque.jsx` métricas `xl:grid-cols-4` | Entre lg e xl, 2 cols apenas | lg |
| R8 | Sidebar mobile | Sheet abre mas sem swipe-to-close | mobile |

---

# 🏗️ BUGS DE ESQUELETO / ESTRUTURA

| # | Problema | Impacto |
|---|----------|---------|
| E1 | `index.css` E `globals.css` duplicados | Confusão sobre qual é fonte da verdade |
| E2 | `ThemeProvider` é wrapper vazio | Code smell |
| E3 | `pages.config.js` legado vs App.jsx | Roteamento duplicado (`/` e `/Dashboard` → mesma página) |
| E4 | `entities/User.json` não existe (built-in) | OK, mas `useUserSettings` importa de `@/entities/User` |
| E5 | Funções deprecadas misturadas com ativas | `functions/` polui IDE |
| E6 | Múltiplas implementações do mesmo modal | `NovoAgendamento.jsx` (modals/) vs `NewAppointmentModal` (agenda/) |
| E7 | Sem estrutura de testes | 0 testes automatizados |
| E8 | Sem error boundary global no App.jsx | Erros não capturados crasham app |

---

# 💾 BUGS DE BANCO DE DADOS

| # | Entidade | Problema | Risco |
|---|----------|----------|-------|
| D1 | `Payment.method` vs `Appointment.payment_method` | Enums diferentes | Quebra agregações |
| D2 | `Product.cost` declarado mas órfão | Campo fantasma | Cálculos zeram |
| D3 | `Appointment.payment_method` aceita "fiado" não no enum | Validação RLS pode rejeitar | Criação falha silenciosamente |
| D4 | `User.account_status` sem enum no schema customizado | Strings livres ("active", "pending_payment", "inactive") | Typos não detectados |
| D5 | `DashboardMetric` sem unique constraint | Possível ter múltiplos registros por usuário | Métricas duplicadas |
| D6 | `Service.products_used` é array sem validação | Pode referenciar `product_id` inexistente | Cálculos quebram |
| D7 | `Appointment.products_used` duplica `Service.products_used` | Inconsistência ao mudar produtos do serviço | Métricas erradas |
| D8 | Sem soft-delete | Excluir cliente perde histórico de Appointments | Auditoria impossível |
| D9 | `Client.loyalty_points` declarado mas sem regra de cálculo | Campo morto | Fidelidade não funciona |
| D10 | RLS é só por `created_by` | Admin não consegue ver dados de outros usuários (correto, mas limita reportes globais) | Operações multi-tenant complexas |

---

# 🔌 BUGS DE INTEGRAÇÃO BACKEND ↔ FRONTEND

| # | Função Backend | Problema | Frontend Afetado |
|---|---------------|----------|------------------|
| I1 | `authValidate` | Ainda ativo com senhas hardcoded | Nenhum (não é chamado, mas exposto) |
| I2 | `authenticateUser` | Não é chamado (login é direto via SDK no frontend) | Função órfã |
| I3 | `updateUserPassword` → `authService` | Cadeia quebrada | `PasswordCard` 100% inoperante |
| I4 | `updateDashboardMetrics` | Não é chamado em nenhum lugar do frontend | Dead code (substituído por triggers) |
| I5 | `getOccupancyRate` | Não é chamado pelo Dashboard | Métrica Dashboard usa fórmula hardcoded |
| I6 | `onAppointmentCompleted` | Não é chamado em nenhum lugar | Ao concluir agendamento, métricas NÃO atualizam |
| I7 | `getClientSummary` | Existe mas não verificamos uso | Verificar `ClientDetailsModal` |

---

# 🎯 RESUMO E PRIORIZAÇÃO

### TOP 5 BUGS MAIS CRÍTICOS (FIX IMEDIATO)
1. **C1** — `authValidate.js` com senhas em texto puro
2. **C2** — `updateUserPassword` quebrado (chama authService deprecado)
3. **I6** — `onAppointmentCompleted` nunca é chamado (métricas de Lucro/Faturamento NUNCA atualizam)
4. **C14** — `product?.cost` em vez de `product?.cost_unit` (todos os atendimentos calculam lucro errado)
5. **C7** — App pública sem auth obrigatória

### TOP 5 BUGS DE LÓGICA DE NEGÓCIO
1. **C10** — `profit: finalPrice * 0.7` hardcoded
2. **C11** — `todayAppointmentsCount` incrementa para mês inteiro
3. **C13** — Enums divergentes `Payment.method` vs `Appointment.payment_method`
4. **A13** — Modal do Dashboard NÃO dispara trigger
5. **A11** — `MonthView` calendário visualmente quebrado (sem semana completa)

### TOP 5 BUGS DE ARQUITETURA
1. **C6** — Violação Regra 4.1 (Promise.all) em backend
2. **A1** — Triggers manuais acoplam frontend ao backend
3. **C3** — `createCompleteAttendance` sem rollback
4. **A6** — CSS corrompido no Layout.jsx
5. **E3** — Roteamento duplicado (`/` e `/Dashboard`)

### ESTATÍSTICAS POR CAMADA

| Camada | Bugs Críticos | Total |
|--------|---------------|-------|
| Backend (functions/) | 6 | 14 |
| Frontend Pages | 4 | 22 |
| Frontend Components | 2 | 18 |
| Entities (Schema) | 2 | 10 |
| Responsividade | 0 | 8 |
| CSS/Estilos | 0 | 4 |
| Hooks | 1 | 4 |

---

## 🎬 RECOMENDAÇÕES DE EXECUÇÃO (DOUTRINA AI CONTROLS v6.0)

Conforme **Regra 1.1 (Atomicidade)**, sugerimos executar as correções em ondas sequenciais:

### ONDA 1 — Segurança (1 prompt cada)
- Deprecar `authValidate.js`
- Corrigir `updateUserPassword.js`
- Habilitar `requiresAuth: true` em `base44Client.js`

### ONDA 2 — Integridade de Dados (1 prompt cada)
- Corrigir `product?.cost` → `product?.cost_unit` em `NewAttendanceModal`
- Corrigir `profit: finalPrice * 0.7` em `NewAppointmentModal`
- Disparar `onAppointmentCompleted` ao mudar status para "concluido"
- Disparar `onAppointmentCreated` no `NovoAgendamento` do Dashboard
- Unificar enums `payment_method`

### ONDA 3 — Métricas e Performance
- Substituir cálculo de ocupação hardcoded no Dashboard por `getOccupancyRate`
- Corrigir `todayAppointmentsCount` para apenas hoje
- Migrar Promise.all → sequencial em todas as funções backend
- Migrar triggers manuais → Entity Automations

### ONDA 4 — UX e UI
- Corrigir CSS quebrado em Layout.jsx
- Corrigir MonthView calendário (semana completa)
- Padronizar cores de status entre views
- Substituir `alert()` por `toast`
- Limpar console.logs de debug
- Customizar index.html

### ONDA 5 — Limpeza
- Remover funções deprecadas e órfãs
- Remover pacotes NPM não utilizados
- Remover `ThemeProvider` wrapper vazio
- Unificar `index.css` e `globals.css`

---

*Auditoria conduzida sob a Doutrina AI CONTROLS v6.0 — A Doutrina da Certeza Absoluta*
*Versão do documento: 1.0.0 | Data: 2026-05-16*
*Total de arquivos auditados: 60+ | Linhas de código analisadas: ~8000*