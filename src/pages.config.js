import AcessoPainel from './pages/AcessoPainel';
import Agenda from './pages/Agenda';
import Clientes from './pages/Clientes';
import Configuracoes from './pages/Configuracoes';
import Dashboard from './pages/Dashboard';
import Estoque from './pages/Estoque';
import Financeiro from './pages/Financeiro';
import Servicos from './pages/Servicos';
import obrigado from './pages/obrigado';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AcessoPainel": AcessoPainel,
    "Agenda": Agenda,
    "Clientes": Clientes,
    "Configuracoes": Configuracoes,
    "Dashboard": Dashboard,
    "Estoque": Estoque,
    "Financeiro": Financeiro,
    "Servicos": Servicos,
    "obrigado": obrigado,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};