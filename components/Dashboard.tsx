import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from 'recharts';
import { TrendingUp, Users, AlertCircle, CalendarClock } from 'lucide-react';
import { Booking, Product, ClubConfig } from '../types';
import { COLOR_THEMES } from '../constants';

interface DashboardProps {
  bookings: Booking[];
  products: Product[];
  config: ClubConfig;
}

export const Dashboard: React.FC<DashboardProps> = ({ bookings, products, config }) => {
  const theme = COLOR_THEMES[config.courtColorTheme];
  const lowStockProducts = products.filter(p => p.stock <= p.minStockAlert);
  const totalRevenue = bookings.reduce((acc, curr) => acc + (curr.status === 'Confirmado' ? curr.price : 0), 0);

  const data = [
    { name: 'Lun', ventas: 40000, reservas: 24 },
    { name: 'Mar', ventas: 30000, reservas: 18 },
    { name: 'Mie', ventas: 50000, reservas: 30 },
    { name: 'Jue', ventas: 27800, reservas: 20 },
    { name: 'Vie', ventas: 68900, reservas: 45 },
    { name: 'Sab', ventas: 83900, reservas: 50 },
    { name: 'Dom', ventas: 54900, reservas: 35 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-bold text-white mb-2">Panel de Control</h2>
        <p className="text-slate-400">Resumen operativo del día en tiempo real.</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard 
          title="Ingresos del Día" 
          value={`$${totalRevenue.toLocaleString()}`} 
          icon={<TrendingUp className="text-green-400" />} 
          change="+12%"
          theme={theme}
        />
        <StatCard 
          title="Reservas Activas" 
          value={bookings.filter(b => b.status === 'Confirmado').length.toString()} 
          icon={<CalendarClock className={theme.accent} />} 
          change="+4"
          theme={theme}
        />
        <StatCard 
          title="Alertas Stock" 
          value={lowStockProducts.length.toString()} 
          icon={<AlertCircle className="text-red-400" />} 
          isAlert={lowStockProducts.length > 0}
          theme={theme}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl">
          <h3 className="text-lg font-semibold mb-4 text-white">Ingresos Semanales</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme.courtFill} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={theme.courtFill} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="ventas" stroke={theme.courtFill} fillOpacity={1} fill="url(#colorVentas)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Occupancy Chart */}
        <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl">
          <h3 className="text-lg font-semibold mb-4 text-white">Ocupación de Canchas</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  cursor={{fill: '#ffffff10'}}
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="reservas" fill="#facc15" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Actions / Recent */}
      <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl">
        <h3 className="text-lg font-semibold mb-4 text-white">Próximos Turnos</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-white/5 text-slate-400">
              <tr>
                <th className="px-4 py-3 rounded-l-lg">Hora</th>
                <th className="px-4 py-3">Cancha</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 rounded-r-lg">Monto</th>
              </tr>
            </thead>
            <tbody>
              {bookings.slice(0, 5).map(booking => (
                <tr key={booking.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-medium text-white">{booking.time}</td>
                  <td className="px-4 py-3">Cancha {booking.courtId}</td>
                  <td className="px-4 py-3">{booking.customerName}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold
                      ${booking.status === 'Confirmado' ? 'bg-green-500/20 text-green-400' : 
                        booking.status === 'Pendiente' ? 'bg-yellow-500/20 text-yellow-400' : 
                        'bg-red-500/20 text-red-400'}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">${booking.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, change, isAlert, theme }: any) => (
  <div className={`p-6 rounded-2xl border ${isAlert ? 'border-red-500/50 bg-red-500/10' : 'border-white/10 bg-slate-900/60'} backdrop-blur-md shadow-lg`}>
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-sm font-medium text-slate-400">{title}</p>
        <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
      </div>
      <div className={`p-2 rounded-lg bg-white/5 ${isAlert ? 'text-red-400' : theme.accent}`}>
        {icon}
      </div>
    </div>
    {change && (
      <span className="text-xs font-medium text-green-400 bg-green-400/10 px-2 py-1 rounded-full">
        {change} vs ayer
      </span>
    )}
    {isAlert && (
      <span className="text-xs font-medium text-red-400 bg-red-400/10 px-2 py-1 rounded-full animate-pulse">
        Acción Requerida
      </span>
    )}
  </div>
);