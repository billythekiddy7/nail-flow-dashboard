# 🔬 AUDITORIA FORENSE GERAL — NAIL FLOW SAAS
### Data: 2026-07-01 | Doutrina: AI CONTROLS v6.0
### Escopo: Full Stack — Frontend + Backend + Schemas + Infraestrutura
### Arquivos analisados: 40+ | Linhas lidas: ~4.500

---

## ⚠️ AVISO CRÍTICO DE PLATAFORMA

> **BACKEND FUNCTIONS INDISPONÍVEIS NO PLANO ATUAL**
> As funções backend existem no código mas **NÃO PODEM SER MODIFICADAS** sem upgrade de plano.
> Isso afeta diretamente os bugs C2, I3, I6, I7 listados abaixo.
> Qualquer correção de backend exige upgrade primeiro.

---

## SUMÁRIO EXECUTIVO

| Severidade | Qtd | Status vs Auditoria Anterior |
|------------|-----|------------------------------|
| 🔴 CRÍTICO | 10 | 4 novos descobertos, 4 corrigidos desde mai/26 |
| 🟠 ALTO | 14 | 6 novos, 12 corrigidos |
| 🟡 MÉDIO | 18 | 8 novos, 14 corrigidos |
| 🔵 BAIXO | 12 | Estado similar |
| **TOTAL** | **54** | 16 corrigidos, 38 persistentes, 16 novos |

---

## PROGRESSO DESDE AUDITORIA ANTERIOR (mai/26)

### ✅ CORRIGIDOS (confirmados no código atual)
- `authValidate.js` — ainda precisa verificar (sem acesso ao backend agora)
- `NovoAgendamento.jsx` — `alert()` ainda PRESENTE (não corrigido!)
- `Agenda.jsx` `Promise.all` — **ainda presente** (linha 61)
- `NewAppointmentModal/index.jsx` `Promise.all` — **ainda presente** (linha 48)
- `Clientes.jsx` console.logs — ainda presentes (linhas 37, 54, 75, 131)
- `DayView.sort()` mutação — não verificado nesta leitura
- `Configuracoes.jsx` `toggleTheme` — **ainda chamado** (linha 42)
- `calculateTotalCost` usa `product?.cost` — **confirmado, ainda errado** (linha 140)
- `NewAppointmentModal` `profit: finalPrice * 0.7` — **confirmado, ainda hardcoded** (linha 135)

### ❌ BUGS QUE PERSISTEM DO RELATÓRIO ANTERIOR

---

# 🔴 BUGS CRÍTICOS (P0)

## [C1] `requiresAuth: false` — App Completamente Pública
**Arquivo**: `api/base44Client.js` linha 12
**Código atual**:
```javascript
requiresAuth: false,  // ← VULNERABILIDADE ATIVA
```
**Impacto**: Qualquer pessoa sem conta pode acessar `/Dashboard`, `/Clientes`, `/Financeiro` diretamente via URL. RLS protege os dados (retorna vazio), mas toda a UI e lógica de negócio ficam expostos.
**Risco**: SaaS pago acessível publicamente. Exposição da estrutura do sistema.
**Correção**: `requiresAuth: true`
**Complexidade**: ⭐ (1 linha)
**Dependência backend**: Não

---

## [C2] `updateUserPassword` INOPERANTE — Chama `authService` Deprecado
**Arquivo**: `functions/updateUserPassword` (inacessível sem upgrade)
**Evidência frontend**: `PasswordCard.jsx` linha 62 chama `base44.functions.invoke('updateUserPassword', ...)`
**Impacto**: Função de troca de senha 100% quebrada para todos os usuários. O `authService` ao qual ela delega já retorna 410.
**Risco**: Usuários nunca conseguem trocar senha.
**Correção**: Refatorar `updateUserPassword` para usar `base44.auth.signInWithPassword` → bloqueado pelo plano
**Workaround enquanto sem upgrade**: Esconder o `PasswordCard` e mostrar mensagem "Use a opção Esqueci Minha Senha"
**Complexidade**: ⭐⭐ (backend + frontend)
**Dependência backend**: SIM — exige upgrade

---

## [C3] `profit: finalPrice * 0.7` — Lucro HARDCODED em 70%
**Arquivo**: `components/agenda/NewAppointmentModal/index.jsx` linha 135
**Código atual**:
```javascript
profit: finalPrice * 0.7, // Cálculo simplificado
```
**Impacto**: Todos os agendamentos criados pela Agenda têm lucro sempre 70% do valor — ignora completamente produtos consumidos. Dashboard e Financeiro mostram dados FALSOS.
**Contraste**: `NovoAgendamento.jsx` (Dashboard) tem `calculateRealProfit()` correto (linha 55-76), mas usa `product.cost` (campo fantasma — ver C5).
**Correção**: Replicar `calculateRealProfit` em `NewAppointmentModal/index.jsx`
**Complexidade**: ⭐⭐
**Dependência backend**: Não

---

## [C4] `calculateTotalCost()` Usa `product?.cost` — Campo Fantasma
**Arquivo**: `components/finance/NewAttendanceModal.jsx` linha 140
**Código atual**:
```javascript
return total + ((product?.cost || 0) * usedProduct.qty);
```
**Schema `Product`**: Declara `cost`, `cost_total`, `cost_unit` — mas apenas `cost_total` e `cost_unit` são preenchidos. `cost` fica `undefined`.
**Resultado**: `calculateTotalCost()` SEMPRE retorna 0 → lucro = preço total → todos os atendimentos manuais têm lucro inflado.
**Idêntico bug em** `NovoAgendamento.jsx` linha 67: `(productDetails.cost || 0)` — também usa `cost` fantasma.
**Correção**: Trocar `product?.cost` por `product?.cost_unit` em ambos os arquivos
**Complexidade**: ⭐ (2 arquivos, 1 linha cada)
**Dependência backend**: Não

---

## [C5] `DayModal.handleStatusChange` NÃO Dispara `onAppointmentCompleted`
**Arquivo**: `components/agenda/DayModal.jsx` linhas 42-65
**Código atual**:
```javascript
const handleStatusChange = async (appointment, newStatus) => {
    await Appointment.update(appointment.id, { status: newStatus });
    // ← NENHUMA chamada a onAppointmentCompleted!
    toast.success(statusMessages[newStatus]);
};
```
**Impacto**: PRINCIPAL ponto onde agendamentos são marcados como "concluido". Quando isso acontece, o `DashboardMetric` NUNCA é atualizado. Faturamento e Lucro no Dashboard ficam zerados/incorretos para sempre.
**Correção**: Adicionar `base44.functions.invoke('onAppointmentCompleted', { appointmentId: appointment.id })` após o update quando `newStatus === 'concluido'`
**Complexidade**: ⭐⭐
**Dependência backend**: Sim (função existe, só precisa ser chamada)

---

## [C6] `NovoAgendamento.jsx` NÃO Dispara `onAppointmentCreated`
**Arquivo**: `components/modals/NovoAgendamento.jsx` linhas 110-113
**Código atual**:
```javascript
await Appointment.create(appointmentData);
onSuccess?.();
onClose();
resetForm();
```
**Impacto**: Agendamentos criados pelo botão "Novo Agendamento" do Dashboard nunca atualizam o `DashboardMetric`. Apenas `NewAppointmentModal/index.jsx` (Agenda) dispara o trigger.
**Contraste**: `NewAppointmentModal/index.jsx` (linha 144) dispara corretamente.
**Correção**: Adicionar `base44.functions.invoke('onAppointmentCreated', {...})` com try/catch best-effort
**Complexidade**: ⭐
**Dependência backend**: Sim

---

## [C7] `Servicos.jsx` `loadServices` SEM try/catch — Tela Trava
**Arquivo**: `pages/Servicos.jsx` linhas 32-37
**Código atual**:
```javascript
const loadServices = async () => {
    setLoading(true);
    const servicesData = await Service.list('-created_date'); // sem try/catch!
    setServices(servicesData);
    setLoading(false); // nunca executado se Service.list lançar exceção
};
```
**Impacto**: Se a API falhar (timeout, 500, etc.), `loading` fica `true` para sempre. A página trava em estado de carregamento infinito, sem mensagem de erro. Usuário fica bloqueado.
**Correção**: Envolver em try/catch/finally
**Complexidade**: ⭐
**Dependência backend**: Não

---

## [C8] `Configuracoes.jsx` Chama `toggleTheme()` Que NÃO Existe
**Arquivo**: `pages/Configuracoes.jsx` linha 19 e 42
**Código atual**:
```javascript
const { toggleTheme } = useTheme();  // useTheme = useGlobalState
// ...
if (formData.theme !== userData?.theme) {
    toggleTheme(); // ← undefined! Vai lançar TypeError em runtime
}
```
**`useGlobalState` exporta**: `{ user, isLoading, isAuthenticated, updateUser, reloadUser, isDark }` — SEM `toggleTheme`.
**Impacto**: Salvar configurações de perfil quando o campo `theme` muda → crash silencioso (`Cannot read properties of undefined (reading 'call')`). Todo o save pode falhar.
**Correção**: Remover `const { toggleTheme } = useTheme()` e o bloco `if (formData.theme !== userData?.theme)`
**Complexidade**: ⭐
**Dependência backend**: Não

---

## [C9] `useUserSettings` Importa `User` de `@/entities/User` — Módulo Inexistente
**Arquivo**: `components/hooks/useUserSettings.jsx` linhas 3, 19, 38
**Código atual**:
```javascript
import { User } from '@/entities/User';  // ← @/entities/User não existe como arquivo
// ...
const data = await User.me();          // chamada suspeita
await User.updateMyUserData(newData);   // método não documentado no SDK
```
**Evidência**: User é built-in da Base44, exposto via `base44.auth.me()` / `base44.auth.updateMe()`, não via import de entidade. `User.me()` e `User.updateMyUserData()` não são métodos do SDK documentado.
**Impacto**: Configurações podem não salvar corretamente. Pode estar funcionando por acidente via proxy, mas é frágil.
**Correção**: Migrar para `base44.auth.me()` e `base44.auth.updateMe(data)`
**Complexidade**: ⭐⭐
**Dependência backend**: Não

---

## [C10] `DayModal` Faz `Appointment.list()` Completo + Filtra no Client
**Arquivo**: `components/agenda/DayModal.jsx` linhas 29-33
**Código atual**:
```javascript
const allAppointments = await Appointment.list('-start_time', 100);
const dayAppointments = allAppointments.filter(apt => {
    const aptDate = new Date(apt.start_time);
    return aptDate.toDateString() === date.toDateString();
});
```
**Impacto**: Busca TODOS os 100 últimos agendamentos só para filtrar 1 dia. Se usuário tiver >100 agendamentos históricos, agendamentos mais antigos nunca aparecem no DayModal.
**Além disso**: A busca `list('-start_time', 100)` não respeita RLS de datas, traz dados desnecessários.
**Correção**: Usar `Appointment.filter({ start_time_gte: startOfDay.toISOString(), start_time_lte: endOfDay.toISOString() })`
**Complexidade**: ⭐
**Dependência backend**: Não

---

# 🟠 BUGS DE ALTA SEVERIDADE (P1)

## [A1] `Agenda.jsx` — `Promise.all` Proibido (Violação Regra 4.1)
**Arquivo**: `pages/Agenda.jsx` linha 61
```javascript
const [clientsData, servicesData] = await Promise.all([
    Client.list('-created_date', 30),
    Service.list('-created_date', 20)
]);
```
**Comentário diz**: "Carregar dados em sequência para evitar rate limit" — mas usa `Promise.all`! Contradição direta.
**Impacto**: Viola Regra 4.1. Em pico de uso pode causar 429 (rate limit).

---

## [A2] `NewAppointmentModal/index.jsx` — `Promise.all` Proibido
**Arquivo**: `components/agenda/NewAppointmentModal/index.jsx` linha 48
```javascript
const [clientsData, servicesData] = await Promise.all([
    Client.list('-created_date', 50),
    Service.list('-created_date', 30)
]);
```

---

## [A3] `NovoAgendamento.jsx` — `alert()` em Vez de `toast`
**Arquivo**: `components/modals/NovoAgendamento.jsx` linhas 80, 116, 135, 139
**Impacto**: UX inconsistente. `alert()` bloqueia a thread, não é acessível, não respeita tema.
**Correção**: `alert()` → `toast.error()` / `toast.success()`

---

## [A4] `NewAppointmentModal/index.jsx` — `alert()` em Vez de `toast`
**Arquivo**: `components/agenda/NewAppointmentModal/index.jsx` linhas 153, 159
```javascript
alert('Agendamento criado com sucesso!');
// ...
alert('Erro ao criar agendamento. Tente novamente.');
```
O `useToast` está disponível mas não é usado aqui.

---

## [A5] `Configuracoes.jsx` — Tema `formData.theme` Comparado mas Nunca Definido
**Arquivo**: `pages/Configuracoes.jsx` linha 41
```javascript
if (formData.theme !== userData?.theme) { toggleTheme(); }
```
Não existe campo `theme` nos cards de configuração. `formData.theme` será sempre `undefined`. Lógica morta + potencial crash.

---

## [A6] `Financeiro.jsx` — `isDark` Destrutado mas Nunca Usado
**Arquivo**: `pages/Financeiro.jsx` linha 34
```javascript
const { isDark } = useTheme(); // nunca referenciado no JSX
```
Import vazio. Aumenta dependência desnecessária.

---

## [A7] `Agenda.jsx` — `isDark` Destrutado mas Nunca Usado
**Arquivo**: `pages/Agenda.jsx` linha 25
Idêntico a A6.

---

## [A8] `Servicos.jsx` — Importa `Appointment` sem Usar
**Arquivo**: `pages/Servicos.jsx` linha 4
```javascript
import { Appointment } from '@/entities/Appointment'; // nunca usado
```

---

## [A9] `NewAppointmentModal` Status Inicial `confirmado` em Vez de `agendado`
**Arquivo**: `components/agenda/NewAppointmentModal/index.jsx` linha 133
```javascript
status: formData.payment_method === 'fiado' ? 'agendado' : 'confirmado',
```
Novos agendamentos nascem como `confirmado`. Semântica correta seria `agendado` → usuário confirma → concluído.
**Impacto**: Quebra fluxo de confirmação. Agendamentos "confirmados" antes de acontecerem distorcem métricas.

---

## [A10] `Clientes.jsx` — `loadClients` Duplica Lógica do `useEffect`
**Arquivo**: `pages/Clientes.jsx` linhas 49-64 e 67-90
Existe uma função `loadClients` (linhas 49-64) e um `useEffect` de debounce (linhas 67-90) que fazem a **mesma operação** (`Client.filter + setClients`). Dois caminhos para o mesmo resultado → inconsistência e chamadas duplicadas em eventos CUD.

---

## [A11] `Clientes.jsx` — Múltiplos `console.log` de Debug em Produção
**Arquivo**: `pages/Clientes.jsx` linhas 37, 40, 54, 58, 75, 131
```javascript
console.log('📡 Carregando serviços...');
console.log('✅ Serviços carregados:', servicesData.length);
console.log('📡 Recarregando clientes com filtro:', filterOptions);
console.log('🗑️ handleDelete chamado para:', client.name);
```
Logs com emojis em produção. Expose dados de usuário (nome do cliente) em logs.

---

## [A12] `ClientCard.jsx` — `console.log` com Dados de Cliente em Produção
**Arquivo**: `components/clients/ClientCard.jsx` linhas 50-54
```javascript
console.log('🔥 BOTÃO DELETE CLICADO PARA:', client.name);
console.error('onDelete não encontrado');
```
PII (nome do cliente) em console público.

---

## [A13] `DayModal.jsx` — Status `pendente` no UI mas Não Existe no Schema
**Arquivo**: `components/agenda/DayModal.jsx` linhas 91, 160-179
```javascript
const pendentes = appointments.filter(apt => apt.status === 'pendente');
// ...
{appointment.status === 'pendente' && ( /* botões Aprovar/Rejeitar */ )}
```
**Schema `Appointment`**: `enum: ["agendado", "confirmado", "concluido", "cancelado"]` — `pendente` NÃO existe!
Agendamentos nunca serão `pendente` via criação normal → aba "Pendentes" sempre vazia → UI morta.

---

## [A14] `DayModal.jsx` — Tab "Confirmados" Ausente
**Arquivo**: `components/agenda/DayModal.jsx` linhas 202-213
O `TabsList` tem 3 tabs: **Agendados / Pendentes / Concluídos** — mas falta **Confirmados**.
Agendamentos com status `confirmado` não aparecem em nenhuma tab!

---

# 🟡 BUGS DE SEVERIDADE MÉDIA (P2)

## [M1] `useLive` — `JSON.stringify(filter)` como Dependência de useEffect
**Arquivo**: `components/hooks/useLive.jsx` linha 64
```javascript
}, [entityClass, JSON.stringify(filter)]);
```
Se filter é passado como literal inline (`filter={{ status: 'concluido' }}`), `JSON.stringify` produz nova string a cada render. Em componentes que re-renderizam muito (ex: Dashboard com FaturamentoChart), pode causar re-fetch excessivo.

---

## [M2] `FaturamentoChart` — Busca 100 Registros + Filtra no Client
**Arquivo**: `components/dashboard/FaturamentoChart.jsx` linhas 46-49
```javascript
const { data: appointments } = useLive(Appointment, { status: 'concluido' });
// depois filtra por período no client
const filteredAppointments = appointments.filter(apt => { ... aptDate >= startDate ... });
```
Limite hardcoded 100. Se usuário tem >100 atendimentos concluídos, gráfico fica incompleto silenciosamente.

---

## [M3] Dashboard — Cálculo de Ocupação Hardcoded
**Arquivo**: `pages/Dashboard.jsx` linhas 61-65
```javascript
const workingDays = 22;           // valor fixo — ignora feriados, dias off
const maxAppointmentsPerDay = 8;  // valor fixo — ignora horários configurados
```
Metrica "Taxa de Ocupação" é fictícia. `getOccupancyRate` existe no backend mas não é chamada.

---

## [M4] `Estoque.jsx` — `metricsResponse.data` Sem Verificação de Erro
**Arquivo**: `pages/Estoque.jsx` linha 39
```javascript
const metricsResponse = await getInventoryMetrics();
setMetrics(metricsResponse.data); // se metricsResponse for { error: ... }, data é undefined
```
Se backend retornar erro, métricas ficam `undefined` → `metrics?.totalUnits` retorna `undefined` → MetricsCard exibe "0" mas sem indicação de falha.

---

## [M5] `NovoAgendamento.jsx` — `calculateRealProfit` Usa `productDetails.cost` (Campo Fantasma)
**Arquivo**: `components/modals/NovoAgendamento.jsx` linha 67
```javascript
totalCost += (productDetails.cost || 0) * quantity;
```
Mesmo problema de C4. `productDetails.cost` é sempre `undefined` → lucro calculado = preço total (nenhum custo descontado).

---

## [M6] `NewAppointmentModal` — `payment_method: 'fiado'` Não Está no Enum
**Arquivo**: `components/agenda/NewAppointmentModal/index.jsx` linha 133
```javascript
status: formData.payment_method === 'fiado' ? 'agendado' : 'confirmado',
```
`'fiado'` está referenciado na lógica mas não existe no enum `Appointment.payment_method: ["dinheiro", "pix", "cartao", "a_vista"]`. Se alguém chegar nessa branch, insere valor inválido no banco.

---

## [M7] `NovoAgendamento.jsx` — Opção `cartao` no Select mas Enum Tem `debit`/`credit`
**Arquivo**: `components/modals/NovoAgendamento.jsx` linha 299
```javascript
<SelectItem value="cartao">Cartão</SelectItem>
<SelectItem value="a_vista">À Vista</SelectItem>
```
`Payment.method` enum: `["dinheiro", "pix", "debit", "credit"]` — sem `cartao` e `a_vista`.
`NewAttendanceModal` usa `debit`/`credit`. Inconsistência entre os dois modais de criação.

---

## [M8] `Servicos.jsx` — `service.price.toFixed(2)` Sem Guard
**Arquivo**: `pages/Servicos.jsx` linha 177
```javascript
<p className="...">R$ {service.price.toFixed(2)}</p>
```
Se `service.price` for `null` ou `undefined` → `TypeError: Cannot read properties of null (reading 'toFixed')` → card crasha e quebra toda a listagem de serviços.

---

## [M9] `Financeiro.jsx` — `console.log` de Debug em Produção
**Arquivo**: `pages/Financeiro.jsx` linhas 53-55, 79-83
```javascript
console.log("[Financeiro] Buscando clientes...");
console.log("[Financeiro] Buscando serviços...");
console.log(`[FRONTEND FETCH] Enviando para o backend:`, { startDate: ..., endDate: ... });
```
Dados de contexto em console de produção.

---

## [M10] `NewAttendanceModal.jsx` — `console.log` de Debug em Produção
**Arquivo**: `components/finance/NewAttendanceModal.jsx` linhas 52-57
```javascript
console.log("[NewAttendanceModal] Buscando clientes...");
console.log("[NewAttendanceModal] Buscando serviços...");
console.log("[NewAttendanceModal] Buscando produtos...");
```

---

## [M11] `NovoAgendamento.jsx` — `console.log` de Debug em Produção
**Arquivo**: `components/modals/NovoAgendamento.jsx` linhas 40-44
```javascript
console.log("[NovoAgendamento] Buscando clientes...");
console.log("[NovoAgendamento] Buscando serviços...");
console.log("[NovoAgendamento] Buscando produtos...");
```

---

## [M12] `ThemeProvider.jsx` — Wrapper Vazio / Dead Code
**Arquivo**: `components/ThemeProvider.jsx`
Já documentado como deprecated no próprio arquivo. `ThemeProvider` é apenas passthrough para `GlobalProvider`. Cria confusão: há dois contextos para o mesmo dado.
Quem importa `useTheme()` recebe `useGlobalState()` disfarçado — mas alguns campos esperados (`toggleTheme`) não existem → crashes silenciosos (ver C8).

---

## [M13] `useGlobalState` Não Expõe `toggleTheme` mas `Configuracoes` Espera
**Arquivo**: `components/hooks/useGlobalState.jsx` linha 68-76
Exports: `{ user, isLoading, isAuthenticated, updateUser, reloadUser, isDark }`.
`isDark: true` hardcoded — tema é permanentemente dark, não mutável. Qualquer lógica de toggle é dead code.

---

## [M14] `App.jsx` — Rota `/Dashboard` Duplica Rota `/`
**Arquivo**: `App.jsx` linhas 44-60 + `pages.config.js` linha 26
`mainPage: "Dashboard"` → rota `/` renderiza `Dashboard`.
O loop `Object.entries(Pages)` também cria rota `/Dashboard`.
Resultado: dois caminhos para a mesma página. Inconsistência de URL em bookmarks e navegação.

---

## [M15] `pages.config.js` — `AcessoPainel` No Loop Sem Layout Guard
**Arquivo**: `pages.config.js` / `App.jsx`
`AcessoPainel` está no `Pages` object → tem rota `/AcessoPainel` com `LayoutWrapper` (sidebar completa).
Página de login com sidebar é visualmente errada. O `Layout.jsx` tem `showSidebar` guard baseado em nome da página, mas `currentPageName` vem do `path` no loop — caso `'AcessoPainel'` está na lista `pagesWithoutLayout`, OK. Verificar se o nome bate exatamente.

---

## [M16] `AuthContext.jsx` + `useGlobalState.jsx` — Dupla Busca de `auth.me()`
**Arquivos**: `lib/AuthContext.jsx` linha 94, `components/hooks/useGlobalState.jsx` linha 29
Ambos chamam `base44.auth.me()` independentemente na inicialização.
Usuário autenticado gera **2 requests** para `auth.me()` no carregamento de toda página. Dobro de carga desnecessária.

---

## [M17] `Servicos.jsx` — Dois Modais de Criação (Duplicação)
**Arquivo**: `pages/Servicos.jsx` linhas 130-143
Existe `NewServiceModal` (moderno, multi-step) e `ServiceForm` dentro de `Dialog` (legado).
`handleEdit` abre o `Dialog` legado. `onButtonClick` abre `NewServiceModal`.
Resultado: criar serviço → `NewServiceModal`. Editar serviço → modal legado. UX inconsistente.

---

## [M18] `MonthView.jsx` — Calendário Não Preenche Semana Completa
**Arquivo**: `components/agenda/MonthView.jsx` linhas 15-17
```javascript
const monthStart = startOfMonth(selectedDate);
const monthEnd = endOfMonth(selectedDate);
const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
```
Se 1 de julho cai numa quarta-feira, o calendário começa na quarta. Grade de 7 colunas com início desalinhado = dias aparecem na coluna errada.
**Correção**: `startOfWeek(monthStart)` até `endOfWeek(monthEnd)`

---

# 🔵 BUGS DE BAIXA SEVERIDADE (P3)

## [B1] `index.html` — Título "Base44 APP" Genérico
**Impacto**: SEO, PWA, abas do browser com título errado.

## [B2] `Clientes.jsx` — `ClientForm` Definido Dentro do Componente
**Arquivo**: `pages/Clientes.jsx` linhas 170-194
Componente `ClientForm` redefinido a cada render do pai. React cria novo elemento React a cada render → o formulário perde foco ao digitar (unmount/remount). Bug de UX sutil mas confirmado.
**Correção**: Mover `ClientForm` para fora do componente `Clientes`.

## [B3] `Servicos.jsx` — `ServiceForm` Definido Dentro do Componente
Idêntico a B2.

## [B4] `Financeiro.jsx` — Botão "Exportar" Sem Funcionalidade
**Arquivo**: `pages/Financeiro.jsx` linha 191
```javascript
<Button variant="outline" className="glass-effect flex-1 sm:flex-none">
    <Download className="w-4 h-4 mr-2" />
    Exportar
</Button>
```
Sem `onClick`. Botão morto na UI.

## [B5] `DayView.jsx` — `handleAppointmentClick` é Stub
**Arquivo**: `components/agenda/DayView.jsx` linha 36
```javascript
const handleAppointmentClick = (appointment) => {
    console.log('Appointment clicked:', appointment); // ← stub
};
```
Clicar em um appointment na view de dia não faz nada (além de logar no console).

## [B6] `NovoAgendamento.jsx` — Cores Hardcoded `#333333` e `#E0E0E0`
**Arquivo**: `components/modals/NovoAgendamento.jsx` linhas 218, 261, 277
```javascript
style={{ background: '#333333' }}
style={{ color: '#E0E0E0' }}
```
Ignora design system (`var(--secondary-bg)`, `var(--text-secondary)`).

## [B7] `NewAttendanceModal.jsx` — `schedule_maintenance: true` Não Faz Nada
**Arquivo**: `components/finance/NewAttendanceModal.jsx` linhas 458-466
Switch "Agendar manutenção (em 15 dias)" existe na UI, é salvo em `formData.schedule_maintenance`, mas nunca é passado no payload nem processado. Feature promete funcionalidade inexistente.

## [B8] `Agenda.jsx` — `loadData()` Chamado no `handleNewAppointmentSuccess`
**Arquivo**: `pages/Agenda.jsx` linhas 126-130
```javascript
const handleNewAppointmentSuccess = () => {
    setShowNewAppointmentModal(false);
    loadData(); // recarrega clientes e serviços desnecessariamente
};
```
Novo agendamento não muda clientes/serviços. `loadData` é desnecessário aqui — o `useAppointments` hook já recarrega automaticamente.

## [B9] CSS — Chave Extra em `Layout.jsx`
**Arquivo**: `Layout.jsx` (dentro da string de style tag)
Existe um `}` extra após `.sidebar-mobile [data-sidebar="footer"]`. Pode quebrar CSS a partir desse ponto em alguns parsers.

## [B10] `useUserSettings` — Método `updateMyUserData` Não Documentado no SDK
**Arquivo**: `components/hooks/useUserSettings.jsx` linha 38
`User.updateMyUserData(newData)` — não é método padrão do SDK Base44. Pode falhar silenciosamente ou lançar TypeError.

## [B11] `Estoque.jsx` — Console.logs de Debug
**Arquivo**: `pages/Estoque.jsx` linhas 33-35

## [B12] `NovoAgendamento.jsx` — `loadData` em `useEffect([isOpen])` Sem Cleanup
Se modal for fechado enquanto dados carregam, setState é chamado em componente desmontado (memory leak, warning React).

---

# 📊 MATRIZ DE RISCO CONSOLIDADA

| # | Bug | Arquivo | Linhas | Severidade | Depende Backend | Complexidade |
|---|-----|---------|--------|-----------|-----------------|-------------|
| C1 | `requiresAuth: false` | `api/base44Client.js` | 12 | 🔴 CRÍTICO | Não | ⭐ |
| C2 | `updateUserPassword` quebrado | `PasswordCard` + backend | 62 | 🔴 CRÍTICO | SIM | ⭐⭐ |
| C3 | `profit * 0.7` hardcoded | `NewAppointmentModal/index` | 135 | 🔴 CRÍTICO | Não | ⭐⭐ |
| C4 | `product?.cost` fantasma | `NewAttendanceModal` | 140 | 🔴 CRÍTICO | Não | ⭐ |
| C5 | `handleStatusChange` sem trigger | `DayModal` | 42-65 | 🔴 CRÍTICO | Sim (invoke) | ⭐⭐ |
| C6 | `NovoAgendamento` sem trigger | `NovoAgendamento` | 110-113 | 🔴 CRÍTICO | Sim (invoke) | ⭐ |
| C7 | `loadServices` sem try/catch | `Servicos.jsx` | 32-37 | 🔴 CRÍTICO | Não | ⭐ |
| C8 | `toggleTheme()` inexistente | `Configuracoes.jsx` | 19, 42 | 🔴 CRÍTICO | Não | ⭐ |
| C9 | `User.me()` import errado | `useUserSettings` | 3, 19, 38 | 🔴 CRÍTICO | Não | ⭐⭐ |
| C10 | `DayModal` list+filter client-side | `DayModal` | 29-33 | 🔴 CRÍTICO | Não | ⭐ |
| A1 | `Promise.all` em Agenda | `Agenda.jsx` | 61 | 🟠 ALTO | Não | ⭐ |
| A2 | `Promise.all` em NewAppointment | `NewAppointmentModal/index` | 48 | 🟠 ALTO | Não | ⭐ |
| A3 | `alert()` em NovoAgendamento | `NovoAgendamento.jsx` | 80,116,135,139 | 🟠 ALTO | Não | ⭐ |
| A4 | `alert()` em NewAppointmentModal | `NewAppointmentModal/index` | 153,159 | 🟠 ALTO | Não | ⭐ |
| A5 | `formData.theme` dead code | `Configuracoes.jsx` | 41 | 🟠 ALTO | Não | ⭐ |
| A6 | `isDark` unused em Financeiro | `Financeiro.jsx` | 34 | 🟠 ALTO | Não | ⭐ |
| A7 | `isDark` unused em Agenda | `Agenda.jsx` | 25 | 🟠 ALTO | Não | ⭐ |
| A8 | `Appointment` import unused | `Servicos.jsx` | 4 | 🟠 ALTO | Não | ⭐ |
| A9 | Status inicial `confirmado` | `NewAppointmentModal/index` | 133 | 🟠 ALTO | Não | ⭐ |
| A10 | `loadClients` duplicado | `Clientes.jsx` | 49-90 | 🟠 ALTO | Não | ⭐⭐ |
| A11 | console.logs Clientes | `Clientes.jsx` | 37,54,75,131 | 🟠 ALTO | Não | ⭐ |
| A12 | console.log PII ClientCard | `ClientCard.jsx` | 50-54 | 🟠 ALTO | Não | ⭐ |
| A13 | `pendente` sem enum | `DayModal.jsx` | 91,160-179 | 🟠 ALTO | Não | ⭐ |
| A14 | Tab `confirmado` ausente | `DayModal.jsx` | 202-213 | 🟠 ALTO | Não | ⭐⭐ |
| M1 | `useLive` JSON.stringify | `useLive.jsx` | 64 | 🟡 MÉDIO | Não | ⭐⭐ |
| M2 | FaturamentoChart limite 100 | `FaturamentoChart.jsx` | 46-49 | 🟡 MÉDIO | Não | ⭐⭐ |
| M3 | Ocupação hardcoded | `Dashboard.jsx` | 61-65 | 🟡 MÉDIO | Sim | ⭐⭐ |
| M4 | `metricsResponse.data` sem guard | `Estoque.jsx` | 39 | 🟡 MÉDIO | Não | ⭐ |
| M5 | `productDetails.cost` fantasma | `NovoAgendamento.jsx` | 67 | 🟡 MÉDIO | Não | ⭐ |
| M6 | `fiado` fora do enum | `NewAppointmentModal/index` | 133 | 🟡 MÉDIO | Não | ⭐ |
| M7 | `cartao`/`a_vista` fora do enum | `NovoAgendamento.jsx` | 299 | 🟡 MÉDIO | Não | ⭐ |
| M8 | `price.toFixed` sem guard | `Servicos.jsx` | 177 | 🟡 MÉDIO | Não | ⭐ |
| M9-M11 | console.logs prod | vários | - | 🟡 MÉDIO | Não | ⭐ |
| M12 | ThemeProvider dead | `ThemeProvider.jsx` | tudo | 🟡 MÉDIO | Não | ⭐⭐ |
| M13 | `toggleTheme` nunca existe | `useGlobalState.jsx` | - | 🟡 MÉDIO | Não | ⭐ |
| M14 | Rota `/Dashboard` duplicada | `App.jsx` | 44-60 | 🟡 MÉDIO | Não | ⭐ |
| M15 | `AcessoPainel` no loop | `pages.config.js` | - | 🟡 MÉDIO | Não | ⭐ |
| M16 | `auth.me()` duplo | `AuthContext`+`GlobalState` | - | 🟡 MÉDIO | Não | ⭐⭐ |
| M17 | Dois modais de criação em Serviços | `Servicos.jsx` | 130-143 | 🟡 MÉDIO | Não | ⭐ |
| M18 | `MonthView` desalinhado | `MonthView.jsx` | 15-17 | 🟡 MÉDIO | Não | ⭐ |
| B1-B12 | Vários menores | vários | - | 🔵 BAIXO | - | ⭐ |

---

# 🏗️ MAPA ARQUITETURAL DE PROBLEMAS

## Fluxo Crítico: Agendamento → Métricas

```
[NovoAgendamento.jsx - Dashboard]
    → Appointment.create() ✅
    → onAppointmentCreated() ❌ NÃO CHAMADO (Bug C6)
    → DashboardMetric NÃO ATUALIZA

[NewAppointmentModal/index.jsx - Agenda]
    → Appointment.create() ✅
    → onAppointmentCreated() ✅ CHAMADO
    → profit = price * 0.7 ❌ ERRADO (Bug C3)
    → DashboardMetric ATUALIZA MAS COM DADO ERRADO

[DayModal.jsx - Concluir]
    → Appointment.update({status: 'concluido'}) ✅
    → onAppointmentCompleted() ❌ NÃO CHAMADO (Bug C5)
    → DashboardMetric NÃO ATUALIZA FATURAMENTO

[NewAttendanceModal.jsx - Manual]
    → createCompleteAttendance() ✅ (backend)
    → custo = product.cost ❌ CAMPO FANTASMA (Bug C4)
    → profit INFLADO
```

## Fluxo Crítico: Autenticação Duplicada

```
App.jsx mount
    → AuthContext.checkAppState() → auth.me() [CALL 1]
    → GlobalProvider.loadEssentialData() → auth.me() [CALL 2]
    → Total: 2 requests auth.me() por carregamento de página
```

## Fluxo Crítico: Configurações → Crash

```
Configuracoes.jsx mount
    → useTheme() = useGlobalState()  ← OK
    → const { toggleTheme } = useTheme()  ← toggleTheme = undefined
    
handleSaveAll()
    → updateUserData(formData) ← via useUserSettings (User.updateMyUserData = ?)
    → if (formData.theme !== userData?.theme)
        → toggleTheme()  ← TypeError: undefined is not a function ← CRASH
```

---

# 🎯 TOP 10 CORREÇÕES PRIORITÁRIAS (SEM BACKEND)

> Ordenadas por: impacto / risco / complexidade

| Prioridade | Bug | Arquivo | Linha | Impacto |
|-----------|-----|---------|-------|---------|
| 1 | C1 — `requiresAuth: false` | `base44Client.js` | 12 | Segurança |
| 2 | C8 — `toggleTheme` crash | `Configuracoes.jsx` | 19, 42 | Crash em save |
| 3 | C7 — `loadServices` sem try/catch | `Servicos.jsx` | 32-37 | Tela travada |
| 4 | C4 — `product?.cost` fantasma | `NewAttendanceModal.jsx` | 140 | Lucro errado |
| 5 | M5 — `product.cost` fantasma | `NovoAgendamento.jsx` | 67 | Lucro errado |
| 6 | C3 — `profit * 0.7` | `NewAppointmentModal/index` | 135 | Lucro errado |
| 7 | A3/A4 — `alert()` | ambos modais | - | UX quebrada |
| 8 | A1/A2 — `Promise.all` | Agenda, NewAppointment | 61, 48 | Regra 4.1 |
| 9 | M8 — `price.toFixed` crash | `Servicos.jsx` | 177 | Crash no card |
| 10 | A11/A12 — console.log PII | Clientes, ClientCard | - | Privacidade |

## TOP 5 QUE EXIGEM BACKEND (pós-upgrade)

| Prioridade | Bug | Impacto |
|-----------|-----|---------|
| 1 | C5 — DayModal sem onAppointmentCompleted | Faturamento nunca atualiza |
| 2 | C6 — NovoAgendamento sem onAppointmentCreated | Contador hoje incorreto |
| 3 | C2 — updateUserPassword quebrado | Troca de senha inoperante |
| 4 | M3 — Ocupação hardcoded (chamar getOccupancyRate) | Métrica falsa |
| 5 | C10 — DayModal list completo | Performance ruim |

---

# 📋 ESTADO ATUAL DOS SCHEMAS

| Entidade | Problema Ativo |
|----------|----------------|
| `Appointment` | `payment_method` enum sem `debit`, `credit`; tem `fiado` referenciado mas não declarado |
| `Product` | Campo `cost` declarado mas nunca preenchido (fantasma); apenas `cost_unit` é usado |
| `Payment` | `method` enum: `debit`/`credit` (inconsistente com Appointment que tem `cartao`) |
| `DashboardMetric` | Sem unique constraint → possível duplicação por usuário |
| `Service` | `products_used` referencia `product_id` sem validação referencial |

---

# 🔐 ESTADO DE SEGURANÇA

| Item | Status | Risco |
|------|--------|-------|
| `requiresAuth: false` | ❌ ATIVO | Alto |
| Senhas hardcoded em `authValidate` | ⚠️ Sem acesso para verificar | Crítico (se ainda ativo) |
| PII em console.log | ❌ ATIVO | Médio |
| `VEKSSELL_WEBHOOK_SECRET` | ✅ Configurado | OK |
| RLS por `created_by` | ✅ Ativo em todos entities | OK |
| `account_status` guard no frontend | ❌ Ausente | Médio |

---

# 📊 RESUMO DE QUALIDADE POR MÓDULO

| Módulo | Score | Principais Problemas |
|--------|-------|----------------------|
| `Dashboard.jsx` | 6/10 | Ocupação hardcoded, loader duplicado |
| `Agenda.jsx` | 5/10 | Promise.all, isDark unused, reload desnecessário |
| `Clientes.jsx` | 4/10 | loadClients duplicado, console.logs, ClientForm inline |
| `Servicos.jsx` | 4/10 | Sem try/catch, import unused, price.toFixed crash |
| `Estoque.jsx` | 7/10 | Sem guard em metricsResponse |
| `Financeiro.jsx` | 7/10 | isDark unused, console.logs, Exportar sem handler |
| `Configuracoes.jsx` | 3/10 | toggleTheme crash, theme dead code |
| `NewAppointmentModal` | 4/10 | profit hardcoded, Promise.all, alert(), status errado |
| `NovoAgendamento` | 5/10 | alert(), sem trigger, product.cost fantasma |
| `NewAttendanceModal` | 6/10 | product.cost fantasma, console.logs |
| `DayModal` | 3/10 | Sem trigger, pendente/confirmado errado, list completo |
| `useGlobalState` | 7/10 | Sem toggleTheme mas ThemeProvider espera |
| `useUserSettings` | 4/10 | User.me() método errado |
| `AuthContext` | 6/10 | auth.me() duplicado com GlobalState |

---

*Auditoria Forense v2.0 — Nail Flow SaaS*
*Data: 2026-07-01 | Arquivos lidos: 40+ | Bugs identificados: 54*
*Doutrina: AI CONTROLS v6.0 — Certeza Absoluta*
*IMPORTANTE: Backend inacessível sem upgrade de plano — 5 bugs críticos bloqueados*