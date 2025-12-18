import React from 'react';
import { LayoutDashboard, Calendar, ShoppingCart, DollarSign, Settings, Users, Menu, LogOut, Package, ClipboardList, PieChart } from 'lucide-react';
import { ClubConfig } from '../types';
import { COLOR_THEMES } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
  activeView: string;
  onChangeView: (view: string) => void;
  config: ClubConfig;
  role: string;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeView, onChangeView, config, role, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const theme = COLOR_THEMES[config.courtColorTheme];

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['ADMIN'] },
    { id: 'bookings', icon: Calendar, label: 'Turnos', roles: ['ADMIN', 'OPERATOR'] },
    { id: 'activity', icon: ClipboardList, label: 'Actividad', roles: ['ADMIN'] },
    { id: 'pos', icon: ShoppingCart, label: 'Punto de Venta', roles: ['ADMIN', 'OPERATOR'] },
    { id: 'inventory', icon: Package, label: 'Inventario', roles: ['ADMIN'] },
    { id: 'cashbox', icon: DollarSign, label: 'Caja', roles: ['ADMIN', 'OPERATOR'] },
    { id: 'reports', icon: PieChart, label: 'Reportes', roles: ['ADMIN'] },
    { id: 'settings', icon: Settings, label: 'Configuración', roles: ['ADMIN'] },
    { id: 'public', icon: Users, label: 'Vista Pública', roles: ['ADMIN', 'OPERATOR'] },
  ];

  return (
    <div className={`min-h-screen text-white font-sans selection:bg-yellow-400 selection:text-black overflow-x-hidden`}>
      {/* Fondo decorativo sutil */}
      <div className={`fixed inset-0 bg-gradient-to-br ${theme.gradient} opacity-20 pointer-events-none`} />

      {/* HEADER MÓVIL: Estilo Vidrio Flotante */}
      <div className="lg:hidden flex items-center justify-between p-4 glass-panel border-b-0 sticky top-0 z-50 rounded-b-xl mx-2 mt-2">
        <h1 className="text-xl font-bold tracking-tight italic flex items-center gap-2">
           {config.logoUrl ? (<img src={config.logoUrl} alt="Logo" className="w-8 h-8 rounded object-cover"/>) : (<span className={`${theme.primary} w-3 h-3 rounded-full inline-block animate-pulse`}></span>)}
          {config.name}
        </h1>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-300 hover:text-white transition-colors"><Menu /></button>
      </div>

      <div className="flex h-screen overflow-hidden relative z-10 pt-2 lg:pt-0">
        
        {/* SIDEBAR: Estilo Vidrio Flotante en Móvil / Integrado en Desktop */}
        <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} glass-panel border-r-0 border-y-0 border-l-0 lg:border-r lg:border-white/5 flex flex-col m-2 lg:m-0 rounded-2xl lg:rounded-none h-[calc(100%-16px)] lg:h-full`}>
          <div className="p-6 border-b border-white/10">
             <div className="flex items-center gap-3">
                {config.logoUrl ? (<img src={config.logoUrl} alt="Club Logo" className="w-10 h-10 rounded-lg object-cover bg-slate-800" />) : (<div className={`w-10 h-10 rounded bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center`}><span className={`text-xl font-black ${theme.accent}`}>P</span></div>)}
                <div><h1 className="text-lg font-bold tracking-tighter leading-none italic">{config.name}</h1><p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Manager</p></div>
             </div>
             <p className="text-xs text-slate-500 mt-4 px-1 flex items-center gap-1"><span className={`w-2 h-2 rounded-full ${theme.primary}`}></span> {role}</p>
          </div>
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-3">
              {menuItems.filter(item => item.roles.includes(role)).map((item) => (
                <li key={item.id}>
                  <button onClick={() => { onChangeView(item.id); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeView === item.id ? `bg-gradient-to-r ${theme.primary} to-transparent ${theme.textOnPrimary} shadow-lg border border-white/10` : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                    <item.icon size={20} /> <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <div className="p-4 border-t border-white/10">
            <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"><LogOut size={20} /><span>Cerrar Sesión</span></button>
          </div>
        </aside>

        {/* MAIN: Corrección de overflow horizontal y márgenes */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-8 relative min-w-0">
            <div className="max-w-7xl mx-auto">
                {children}
            </div>
        </main>
      </div>
    </div>
  );
};
