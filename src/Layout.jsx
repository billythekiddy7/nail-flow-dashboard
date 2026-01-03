import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Package,
  Scissors,
  Settings,
  TrendingUp,
  Heart,
  Target
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress"; // Added Progress import
import { GlobalProvider, useGlobalState } from "@/components/hooks/useGlobalState"; // Added GlobalProvider and useGlobalState imports - CORRECTED PATH
import { ThemeProvider } from "@/components/ThemeProvider";
import { base44 } from "@/api/base44Client"; // Added base44 import
import { ToastProvider } from "@/components/ui/Toast";

const navigationItems = [
  { title: "Dashboard", url: createPageUrl("Dashboard"), icon: LayoutDashboard },
  { title: "Agenda", url: createPageUrl("Agenda"), icon: Calendar },
  { title: "Clientes", url: createPageUrl("Clientes"), icon: Users },
  { title: "Serviços", url: createPageUrl("Servicos"), icon: Scissors },
  { title: "Estoque", url: createPageUrl("Estoque"), icon: Package },
  { title: "Financeiro", url: createPageUrl("Financeiro"), icon: TrendingUp },
  { title: "Configurações", url: createPageUrl("Configuracoes"), icon: Settings },
];

function MainLayout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  // OPERAÇÃO ZÊNITE: Consumir estado global em vez de buscar localmente
  const { user, isLoading: globalLoading } = useGlobalState(); // Changed from useTheme()

  // Lista de páginas que não devem ter o menu lateral
  const pagesWithoutLayout = ['obrigado', 'AcessoPainel'];
  const showSidebar = !pagesWithoutLayout.includes(currentPageName);

  // Estados para indicadores dinâmicos (apenas métricas, não usuário)
  const [todayAppointmentsCount, setTodayAppointmentsCount] = useState(0);
  const [monthlyGoalProgress, setMonthlyGoalProgress] = useState(0);
  const [goalInfo, setGoalInfo] = useState({ current: 0, target: 0, type: 'faturamento' });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    // OPERAÇÃO ZÊNITE: Não busca mais dados do usuário aqui
    // O GlobalProvider já cuidou disso
    if (!user) { // Added check for user from global state
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
        // Busca apenas as métricas do dashboard
        const metricsData = await base44.entities.DashboardMetric.list('', 1);
      const metrics = metricsData?.[0] || {};
      const monthlyGoals = user?.monthly_goals || {}; // Use user from global state

      // Definir contagem de agendamentos de hoje
      setTodayAppointmentsCount(metrics.todayAppointmentsCount || 0);

      // Calcular progresso da meta mensal
      const completedAppointments = metrics.completedAppointmentsCount || 0;
      const revenueTotal = metrics.revenueTotal || 0;
      const netProfit = metrics.netProfit || 0;
      
      let progress = 0;
      let currentValue = 0;
      let targetValue = 0;
      let goalType = 'faturamento';

      if (monthlyGoals.revenue_target && monthlyGoals.revenue_target > 0) {
        currentValue = revenueTotal;
        targetValue = monthlyGoals.revenue_target;
        goalType = 'faturamento';
      } else if (monthlyGoals.profit_target && monthlyGoals.profit_target > 0) {
        currentValue = netProfit;
        targetValue = monthlyGoals.profit_target;
        goalType = 'lucro';
      } else if (monthlyGoals.clients_target && monthlyGoals.clients_target > 0) {
        currentValue = completedAppointments;
        targetValue = monthlyGoals.clients_target;
        goalType = 'atendimentos';
      } else {
        currentValue = revenueTotal;
        targetValue = 5000;
        goalType = 'faturamento';
      }

      progress = targetValue > 0 ? (currentValue / targetValue) * 100 : 0;

      setMonthlyGoalProgress(Math.min(Math.round(progress), 100));
      setGoalInfo({ current: currentValue, target: targetValue, type: goalType });

    } catch (error) {
      console.error("Erro ao carregar indicadores do layout:", error);
      setTodayAppointmentsCount(0);
      setMonthlyGoalProgress(0);
      setGoalInfo({ current: 0, target: 0, type: 'faturamento' });
    } finally {
      setLoading(false);
    }
  }, [user]); // Now depends on the user object from global state

  useEffect(() => {
    fetchData();

    // Listeners para re-sincronizar
    const handleGoalsUpdate = () => fetchData();
    const handleDashboardSync = () => fetchData();
    
    window.addEventListener('goalsUpdated', handleGoalsUpdate);
    window.addEventListener('dashboardSynced', handleDashboardSync);

    return () => {
      window.removeEventListener('goalsUpdated', handleGoalsUpdate);
      window.removeEventListener('dashboardSynced', handleDashboardSync);
    };
  }, [fetchData]);

  const handleLogout = async () => {
    try {
      await base44.auth.logout(); // Changed from User.logout()
      navigate(createPageUrl('AcessoPainel'));
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  // OPERAÇÃO ZÊNITE: Loader unificado enquanto carrega estado global
  if (globalLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--primary-bg)' }}>
        <div className="text-center space-y-4">
          <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto"></div>
          <p style={{ color: 'var(--text-secondary)' }}>Carregando aplicação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dark">
      <style>{`
        :root {
          --primary-bg: #111111;
          --secondary-bg: #1a1a1a;
          --card-bg: #222222;
          --text-primary: #ffffff;
          --text-secondary: #a1a1aa;
          --accent: #E6007A;
          --accent-hover: #c7006a;
          --border: #333333;
          --hover-bg: #2a2a2a;
        }
        body {
          background: var(--primary-bg);
          color: var(--text-primary);
          transition: all 0.3s ease;
        }
        .glass-effect {
          background: rgba(34, 34, 34, 0.8);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .neon-glow {
          box-shadow: 0 0 20px rgba(230, 0, 122, 0.3);
        }
        .gradient-text {
          background: linear-gradient(135deg, #E6007A, #ff6b9d);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .card-3d {
          transform-style: preserve-3d;
          transition: all 0.3s ease-out;
        }
        .card-3d:hover {
          transform: perspective(1000px) rotateX(2deg) rotateY(5deg);
          box-shadow: 0 20px 40px rgba(230, 0, 122, 0.2);
        }

        /* Forçar tema dark na sidebar mobile */
        .sidebar-mobile {
          background: var(--secondary-bg) !important;
          color: var(--text-primary) !important;
        }
        .sidebar-mobile * {
          color: var(--text-primary) !important;
        }
        .sidebar-mobile [data-sidebar="sidebar"] {
          background: var(--secondary-bg) !important;
        }
        .sidebar-mobile [data-sidebar="header"] {
          background: var(--secondary-bg) !important;
          border-color: var(--border) !important;
        }
        .sidebar-mobile [data-sidebar="content"] {
          background: var(--secondary-bg) !important;
        }
        .sidebar-mobile [data-sidebar="footer"] {
          background: var(--secondary-bg) !important;
          border-color: var(--border) !important;
        }
      `}</style>

      <SidebarProvider>
        <div className="min-h-screen flex w-full" style={{ background: 'var(--primary-bg)' }}>
          {showSidebar && (
            <Sidebar className="border-r sidebar-mobile md:static fixed left-0 top-0 z-50 h-full w-64 md:w-auto transform transition-transform duration-300 md:transform-none" style={{ borderColor: 'var(--border)', background: 'var(--secondary-bg)' }}>
              <SidebarHeader className="border-b p-6" style={{ borderColor: 'var(--border)', background: 'var(--secondary-bg)' }}>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/274fa6f49_ChatGPTImageJun20202509_16_52PM.png"
                      alt="Nail Flow Logo"
                      className="w-10 h-10 rounded-xl neon-glow"
                    />
                  </div>
                  <div>
                    <h2 className="font-bold text-xl gradient-text">Nail Flow</h2>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Gestão Profissional</p>
                  </div>
                </div>
              </SidebarHeader>

              <SidebarContent className="p-3" style={{ background: 'var(--secondary-bg)' }}>
                <SidebarGroup>
                  <SidebarGroupLabel className="text-xs font-medium uppercase tracking-wider px-3 py-2" style={{ color: 'var(--text-secondary)' }}>
                    Navegação
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {navigationItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            asChild
                            className={`rounded-xl mb-1 transition-all duration-200 ${
                              location.pathname === item.url
                                ? 'text-white shadow-lg'
                                : 'hover:bg-opacity-50'
                            }`}
                            style={{
                              background: location.pathname === item.url
                                ? 'linear-gradient(135deg, #E6007A, #ff6b9d)'
                                : 'transparent',
                              color: 'var(--text-primary)'
                            }}
                          >
                            <Link to={item.url} className="flex items-center gap-3 px-3 py-3">
                              <item.icon className="w-5 h-5" />
                              <span className="font-medium">{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup className="mt-6">
                  <SidebarGroupLabel className="text-xs font-medium uppercase tracking-wider px-3 py-2" style={{ color: 'var(--text-secondary)' }}>
                    Status
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <div className="px-3 py-2 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          Agendamentos Hoje
                        </span>
                        <Badge variant="secondary" className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
                          {loading ? "..." : todayAppointmentsCount}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Target className="w-3 h-3" style={{ color: 'var(--text-secondary)' }} />
                          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            Meta Mensal
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
                            {loading ? "..." : `${monthlyGoalProgress}%`}
                          </span>
                          {!loading && (
                            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                              {goalInfo.type === 'atendimentos' ? (
                                `${Math.round(goalInfo.current)}/${Math.round(goalInfo.target)} atendimentos`
                              ) : (
                                `R$ ${goalInfo.current.toFixed(0)} / R$ ${goalInfo.target.toFixed(0)}`
                              )}
                            </div>
                          )}
                        </div>
                        {!loading && (
                          // Replaced custom progress div with Progress component
                          <Progress value={monthlyGoalProgress} className="h-2" />
                        )}
                      </div>
                    </div>
                  </SidebarGroupContent>
                </SidebarGroup>
              </SidebarContent>

              <SidebarFooter className="border-t p-4" style={{ borderColor: 'var(--border)', background: 'var(--secondary-bg)' }}>
                <div className="space-y-3">
                  {/* Informações do usuário */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden">
                        {user?.profile_image ? (
                          <img src={user.profile_image} alt="Avatar do usuário" className="w-full h-full object-cover" />
                        ) : (
                          <Heart className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                          {user?.business_name || user?.full_name || 'Nail Designer'}
                        </p>
                        <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                          Profissional
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Botão de Logout */}
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 text-red-400 border-red-400/30 hover:bg-red-500/10 hover:border-red-400"
                    style={{
                      borderColor: 'rgba(239, 68, 68, 0.3)',
                      color: '#f87171'
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 013-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sair da Conta
                  </Button>
                </div>
              </SidebarFooter>
            </Sidebar>
          )}

          <main className="flex-1 flex flex-col overflow-x-hidden">
            {showSidebar && (
              <header className="border-b px-4 py-4 md:hidden glass-effect" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-4">
                  <SidebarTrigger className="hover:bg-opacity-50 p-2 rounded-xl transition-all duration-200" />
                  <h1 className="text-lg font-bold gradient-text">Nail Flow</h1>
                </div>
              </header>
            )}
            <div className={`flex-1 overflow-auto ${showSidebar ? 'px-4 sm:px-6 md:pl-6' : ''}`} style={{ background: 'var(--primary-bg)' }}>
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    // GlobalProvider now wraps ThemeProvider and ToastProvider
    <GlobalProvider>
      <ToastProvider>
        <ThemeProvider>
          <MainLayout children={children} currentPageName={currentPageName} />
        </ThemeProvider>
      </ToastProvider>
    </GlobalProvider>
  );
}