import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from 'recharts';
import { TrendingUp, Users, AlertCircle, CalendarClock } from 'lucide-react';
import { Booking, Product, ClubConfig, BookingStatus } from '../types';
import { COLOR_THEMES } from '../constants';

interface DashboardProps {
  bookings: Booking[];
  products: Product[];
  config: ClubConfig;
}

const getTodayStr = () => {
    return new Date().toLocaleDateString('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires',
        year: 'numeric', month: '2-digit', day: '2-digit'
    }).split('/').reverse().join('-');
};

const formatMoney = (amount?: number | null) => (amount || 0).toLocaleString();

export const Dashboard: React.FC<DashboardProps> = ({ bookings, products, config }) => {
  const theme = COLOR_THEMES[config.courtColorTheme];
  const todayStr = getTodayStr();

  const lowStockProducts = products.filter(p => (p.stock || 0) <= (p.minStockAlert || 0));
  const todayBookings = bookings.filter(b => b.date === todayStr && b.status !== BookingStatus.CANCELLED);
  
  const dailyRevenue = todayBookings.reduce((acc, curr) => {
      const isPaidOrConfirmed = curr.status === BookingStatus.CONFIRMED || (curr.paymentMethod !== undefined && curr.paymentMethod !== null);
      return acc + (isPaidOrConfirmed ? (curr.price || 0) : 0);
  }, 0);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const yesterdayRevenue = bookings
    .filter(b => b.date === yesterdayStr && (b.status === BookingStatus.CONFIRMED || (b.paymentMethod !== undefined && b.paymentMethod !== null)))
    .reduce((acc, curr) => acc + (curr.price || 0), 0);

  const revenueChange = yesterdayRevenue > 0 ? Math.round(((dailyRevenue - yesterdayRevenue) / yesterdayRevenue) * 100) : 0;
  const revenueSign = revenueChange >= 0 ? '+' : '';

  const chartData = useMemo(() => {
      const days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
      const data = [];
      for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dStr = d.toISOString().split('T')[0];
          const dailyBookings = bookings.filter(b => b.date === dStr && b.status !== BookingStatus.CANCELLED);
          const dailyTotal = dailyBookings.reduce((acc, curr) => acc + (curr.status === BookingStatus.CONFIRMED || (curr.paymentMethod !== undefined && curr.paymentMethod !== null) ? (curr.price || 0) : 0), 0);
          data.push({ name: days[d.getDay()], fullDate: dStr, ventas: dailyTotal, reservas: dailyBookings.length });
      }
      return data;
  }, [bookings]);

  const upcomingBookings = useMemo(() => {
      return bookings
        .filter(b => b.status !== BookingStatus.CANCELLED && b.date >= todayStr)
        .sort((a, b) => a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date))
        .slice(0, 5);
  }, [bookings, todayStr]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <header>
        <h2 className="text-3xl font-bold text-white mb-2">Panel de Control</h2>
        <p className="text-slate-400">Resumen operativo del día ({todayStr}) en tiempo real.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Ingresos del Día" value={`$${formatMoney(dailyRevenue)}`} icon={<TrendingUp className="text-green-400" />} change={`${revenueSign}${revenueChange}% vs ayer`} theme={theme} />
        <StatCard title="Turnos Hoy" value={todayBookings.length.toString()} icon={<CalendarClock className={theme.accent} />} change="Reservados para hoy" theme={theme} />
        <StatCard title="Alertas Stock" value={lowStockProducts.length.toString()} icon={<AlertCircle className="text-red-400" />} isAlert={lowStockProducts.length > 0} change={lowStockProducts.length > 0 ? "Reponer urgente" : "Stock saludable"} theme={theme} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl flex flex-col h-[400px] min-w-0">
          <h3 className="text-lg font-semibold mb-4 text-white">Ingresos (Últimos 7 días)</h3>
          <div className="flex-1 min-h-0 w-full" style={{ minHeight: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs><linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={theme.courtFill} stopOpacity={0.8}/><stop offset="95%" stopColor={theme.courtFill} stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} formatter={(value: number) => [`$${formatMoney(value)}`, 'Ventas']} />
                <Area type="monotone" dataKey="ventas" stroke={theme.courtFill} fillOpacity={1} fill="url(#colorVentas)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex flex-col h-[400px] min-w-0">
          <h3 className="text-lg font-semibold mb-4 text-white">Ocupación (Turnos por día)</h3>
          <div className="flex-1 min-h-0 w-full" style={{ minHeight: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" allowDecimals={false} />
                <Tooltip cursor={{fill: '#ffffff10'}} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} formatter={(value: number) => [value, 'Turnos']} />
                <Bar dataKey="reservas" fill="#facc15" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl overflow-hidden">
        <h3 className="text-lg font-semibold mb-4 text-white">Próximos Turnos (Agenda)</h3>
        <div className="overflow-x-auto">
          {upcomingBookings.length === 0 ? <p className="text-slate-500 text-sm italic">No hay turnos futuros registrados.</p> : (
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="text-xs uppercase bg-white/5 text-slate-400"><tr><th className="px-4 py-3 rounded-l-lg">Fecha/Hora</th><th className="px-4 py-3">Cancha</th><th className="px-4 py-3">Cliente</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3 rounded-r-lg">Monto</th></tr></thead>
                <tbody>
                  {upcomingBookings.map(booking => (
                    <tr key={booking.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 font-medium text-white"><div className="flex flex-col"><span>{booking.time}</span><span className="text-[10px] text-slate-500">{booking.date}</span></div></td>
                      <td className="px-4 py-3">Cancha {booking.courtId}</td>
                      <td className="px-4 py-3 font-bold">{booking.customerName || 'Sin Nombre'}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold border ${booking.status === BookingStatus.CONFIRMED ? 'bg-green-500/10 border-green-500/20 text-green-400' : booking.status === BookingStatus.PENDING ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>{booking.status}</span></td>
                      <td className="px-4 py-3 font-mono text-white">${formatMoney(booking.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, change, isAlert, theme }: any) => (
  <div className={`p-6 rounded-2xl border backdrop-blur-md shadow-lg transition-all hover:scale-[1.02] ${isAlert ? 'border-red-500/50 bg-red-500/10' : 'glass-panel'}`}>
    <div className="flex justify-between items-start mb-4">
      <div><p className="text-sm font-medium text-slate-400">{title}</p><h3 className="text-2xl font-bold text-white mt-1">{value}</h3></div>
      <div className={`p-2 rounded-lg bg-white/5 ${isAlert ? 'text-red-400' : theme.accent}`}>{icon}</div>
    </div>
    {change && <span className={`text-xs font-medium px-2 py-1 rounded-full ${isAlert ? 'text-red-400 bg-red-400/10' : 'text-slate-400 bg-white/5'}`}>{change}</span>}
  </div>
);
