import React from 'react';
import { LayoutDashboard, Calendar, ShoppingCart, DollarSign, Settings, Users, Menu, LogOut, Sun, Package, ClipboardList } from 'lucide-react';
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
    { id: 'settings', icon: Settings, label: 'Configuración', roles: ['ADMIN'] },
    { id: 'public', icon: Users, label: 'Vista Pública (Demo)', roles: ['ADMIN', 'OPERATOR'] },
  ];

  return (
    <div className={`min-h-screen bg-slate-950 text-white font-sans selection:bg-yellow-400 selection:text-black`}>
      {/* Background Ambience */}
      <div className={`fixed inset-0 bg-gradient-to-br ${theme.gradient} opacity-50 pointer-events-none`} />
      
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-slate-900/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <h1 className="text-xl font-bold tracking-tight italic flex items-center gap-2">
           {config.logoUrl ? (
                <img src={config.logoUrl} alt="Logo" className="w-8 h-8 rounded object-cover"/>
           ) : (
                <span className={`${theme.primary} w-3 h-3 rounded-full inline-block animate-pulse`}></span>
           )}
          {config.name}
        </h1>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-300">
          <Menu />
        </button>
      </div>

      <div className="flex h-screen overflow-hidden relative z-10">
        {/* Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          bg-slate-900/90 backdrop-blur-xl border-r border-white/10 flex flex-col
        `}>
          <div className="p-6 border-b border-white/10">
             <div className="flex items-center gap-3">
                {config.logoUrl ? (
                    <img src={config.logoUrl} alt="Club Logo" className="w-10 h-10 rounded-lg object-cover bg-slate-800" />
                ) : (
                    <div className={`w-10 h-10 rounded bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center`}>
                        <span className={`text-xl font-black ${theme.accent}`}>P</span>
                    </div>
                )}
                <div>
                     <h1 className="text-lg font-bold tracking-tighter leading-none italic">{config.name}</h1>
                     <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Manager</p>
                </div>
             </div>
             <p className="text-xs text-slate-500 mt-4 px-1 flex items-center gap-1"><span className={`w-2 h-2 rounded-full ${theme.primary}`}></span> {role}</p>
          </div>

          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-3">
              {menuItems.filter(item => item.roles.includes(role)).map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => { onChangeView(item.id); setIsSidebarOpen(false); }}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                      ${activeView === item.id 
                        ? `bg-gradient-to-r ${theme.primary} to-slate-800 ${theme.textOnPrimary} shadow-lg border border-white/10` 
                        : 'text-slate-400 hover:text-white hover:bg-white/5'}
                    `}
                  >
                    <item.icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="p-4 border-t border-white/10">
            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
            >
              <LogOut size={20} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 relative">
          {children}
        </main>
      </div>
    </div>
  );
};