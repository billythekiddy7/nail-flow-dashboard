import Dashboard from './pages/Dashboard';
import Agenda from './pages/Agenda';
import Clientes from './pages/Clientes';
import Servicos from './pages/Servicos';
import Estoque from './pages/Estoque';
import Configuracoes from './pages/Configuracoes';
import Financeiro from './pages/Financeiro';
import obrigado from './pages/obrigado';
import AcessoPainel from './pages/AcessoPainel';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Agenda": Agenda,
    "Clientes": Clientes,
    "Servicos": Servicos,
    "Estoque": Estoque,
    "Configuracoes": Configuracoes,
    "Financeiro": Financeiro,
    "obrigado": obrigado,
    "AcessoPainel": AcessoPainel,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};