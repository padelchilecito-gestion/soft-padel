import React, { useState, useMemo } from 'react';
import { ClubConfig, ActivityLogEntry, ActivityType, PaymentMethod } from '../types';
import { DollarSign, Lock, Unlock, TrendingUp, Calendar, CreditCard, Banknote, QrCode } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { COLOR_THEMES } from '../constants';

interface CashboxModuleProps {
    config: ClubConfig;
    role: string;
    activities: ActivityLogEntry[];
    onLogActivity: (type: ActivityType, description: string, amount?: number) => void;
}

const formatMoney = (val: number) => val.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

export const CashboxModule: React.FC<CashboxModuleProps> = ({ config, role, activities, onLogActivity }) => {
    const [status, setStatus] = useState<'OPEN' | 'CLOSED'>('CLOSED');
    const [amount, setAmount] = useState<string>('');
    const theme = COLOR_THEMES[config.courtColorTheme];

    // Filtrar actividades de HOY
    const today = new Date().toISOString().split('T')[0];
    const todaysActivities = activities.filter(act => act.timestamp.startsWith(today));

    // Calcular totales por método de pago para el gráfico
    const incomeByMethod = useMemo(() => {
        const data = [
            { name: 'Efectivo', value: 0, color: '#22c55e', icon: Banknote },
            { name: 'QR MP', value: 0, color: '#3b82f6', icon: QrCode },
            { name: 'Transferencia', value: 0, color: '#a855f7', icon: CreditCard },
        ];

        todaysActivities.forEach(act => {
            if ((act.type === 'SALE' || act.type === 'BOOKING') && act.amount && act.method) {
                const idx = data.findIndex(d => 
                    (act.method === PaymentMethod.CASH && d.name === 'Efectivo') ||
                    (act.method === PaymentMethod.QR && d.name === 'QR MP') ||
                    (act.method === PaymentMethod.TRANSFER && d.name === 'Transferencia')
                );
                if (idx !== -1) data[idx].value += act.amount;
            }
        });
        return data.filter(d => d.value > 0);
    }, [todaysActivities]);

    const totalIncome = incomeByMethod.reduce((acc, curr) => acc + curr.value, 0);

    const handleAction = () => {
        if (!amount) return;
        const val = parseFloat(amount);
        const actionName = status === 'CLOSED' ? 'Apertura de Caja' : 'Cierre de Caja';
        setStatus(status === 'CLOSED' ? 'OPEN' : 'CLOSED');
        onLogActivity('SHIFT', `${actionName}. Monto: $${val}`, val);
        setAmount('');
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in pb-20">
            {/* --- PANEL DE CONTROL DE CAJA --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. Control de Apertura/Cierre */}
                <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl flex flex-col items-center justify-center text-center">
                     <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-lg border-4 transition-colors duration-500
                        ${status === 'OPEN' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                        {status === 'OPEN' ? <Unlock size={40} /> : <Lock size={40} />}
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-1">{status === 'OPEN' ? 'Caja Abierta' : 'Caja Cerrada'}</h2>
                    <p className="text-slate-400 text-sm mb-6 max-w-xs">
                        {status === 'OPEN' ? 'Registrando operaciones...' : 'Inicia el turno para operar.'}
                    </p>
                    <div className="w-full max-w-xs space-y-3">
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-3 text-slate-400" size={18}/>
                            <input 
                                type="number" 
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder={status === 'CLOSED' ? "Monto Inicial" : "Monto Final"}
                                className="w-full bg-slate-800 border border-white/10 rounded-xl py-2.5 pl-10 text-white font-mono"
                            />
                        </div>
                        <button 
                            onClick={handleAction}
                            disabled={!amount}
                            className={`w-full py-2.5 rounded-xl font-bold text-white transition-all active:scale-95 ${status === 'CLOSED' ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'}`}
                        >
                            {status === 'CLOSED' ? 'ABRIR TURN' : 'CERRAR TURN'}
                        </button>
                    </div>
                </div>

                {/* 2. Gráfico de Ingresos del Día */}
                <div className="lg:col-span-2 bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2"><TrendingUp size={20} className="text-blue-400"/> Ingresos del Día</h3>
                            <p className="text-xs text-slate-400">Desglose por método de pago</p>
                        </div>
                        <div className="text-right">
                            <span className="text-xs text-slate-400 uppercase font-bold">Total Recaudado</span>
                            <div className="text-2xl font-mono font-bold text-green-400">{formatMoney(totalIncome)}</div>
                        </div>
                    </div>

                    <div className="flex-1 min-h-[200px] flex items-center">
                        {incomeByMethod.length > 0 ? (
                            <div className="w-full h-full flex flex-col sm:flex-row items-center">
                                <div className="h-[200px] w-full sm:w-1/2">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={incomeByMethod} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                                {incomeByMethod.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none"/>
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px'}} itemStyle={{color: '#fff'}} formatter={(val: number) => formatMoney(val)}/>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="w-full sm:w-1/2 space-y-3 pl-4">
                                    {incomeByMethod.map((item) => (
                                        <div key={item.name} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full" style={{backgroundColor: item.color}}></div>
                                                <span className="text-sm text-slate-300">{item.name}</span>
                                            </div>
                                            <span className="font-mono font-bold text-white">{formatMoney(item.value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="w-full text-center text-slate-500 py-10">Sin ventas registradas hoy.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* 3. Listado de Movimientos */}
            <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-lg">
                <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                    <Calendar size={20}/> Movimientos del Turno (Hoy)
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                        <thead className="bg-white/5 text-xs uppercase font-bold text-slate-400">
                            <tr>
                                <th className="px-4 py-3 rounded-l-lg">Hora</th>
                                <th className="px-4 py-3">Tipo</th>
                                <th className="px-4 py-3">Descripción</th>
                                <th className="px-4 py-3">Método</th>
                                <th className="px-4 py-3 rounded-r-lg text-right">Monto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {todaysActivities.map((act) => (
                                <tr key={act.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-3 font-mono text-slate-400">{new Date(act.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                            act.type === 'SALE' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                            act.type === 'BOOKING' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                            'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                        }`}>{act.type}</span>
                                    </td>
                                    <td className="px-4 py-3 text-white">{act.description}</td>
                                    <td className="px-4 py-3 text-xs">
                                        {act.method ? (
                                            <span className="flex items-center gap-1">
                                                {act.method === PaymentMethod.CASH && <Banknote size={12}/>}
                                                {act.method === PaymentMethod.QR && <QrCode size={12}/>}
                                                {act.method === PaymentMethod.TRANSFER && <CreditCard size={12}/>}
                                                {act.method}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono font-bold text-white">
                                        {act.amount ? formatMoney(act.amount) : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {todaysActivities.length === 0 && <p className="text-center text-slate-500 py-8 italic">No hay movimientos hoy.</p>}
                </div>
            </div>
        </div>
    );
};
