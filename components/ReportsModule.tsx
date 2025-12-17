import React, { useState, useMemo } from 'react';
import { Booking, ActivityLogEntry, Expense, BookingStatus, PaymentMethod } from '../types';
import { DollarSign, TrendingDown, TrendingUp, Wallet, Plus, Trash2, Calendar, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

interface ReportsModuleProps {
    bookings: Booking[];
    activities: ActivityLogEntry[];
    expenses: Expense[];
    onAddExpense: (e: Expense) => void;
    onDeleteExpense: (id: string) => void;
}

const formatMoney = (val: number) => val.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

export const ReportsModule: React.FC<ReportsModuleProps> = ({ bookings, activities, expenses, onAddExpense, onDeleteExpense }) => {
    // Estado para formulario de gastos
    const [newExpense, setNewExpense] = useState<Partial<Expense>>({
        date: new Date().toISOString().split('T')[0],
        category: 'Varios',
        description: '',
        amount: 0
    });

    // 1. CALCULAR INGRESOS TOTALES (Históricos o filtrables, por ahora totales)
    // Usamos 'activities' para ventas de POS y 'bookings' confirmadas para turnos
    // Ojo: 'activities' ya loguea BOOKING y SALE con monto. Es mejor usar activities para el flujo de caja real.
    const totalIncome = useMemo(() => {
        return activities.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    }, [activities]);

    const totalExpenses = useMemo(() => {
        return expenses.reduce((acc, curr) => acc + curr.amount, 0);
    }, [expenses]);

    const netIncome = totalIncome - totalExpenses;

    // Datos para el gráfico (Comparativa Ingresos vs Gastos)
    const chartData = [
        { name: 'Balance', Ingresos: totalIncome, Gastos: totalExpenses }
    ];

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newExpense.amount || !newExpense.description) return;
        
        onAddExpense({
            id: Date.now().toString(),
            date: newExpense.date!,
            category: newExpense.category as any,
            description: newExpense.description!,
            amount: parseFloat(newExpense.amount!.toString())
        });
        
        setNewExpense({ ...newExpense, description: '', amount: 0 });
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in pb-20">
            {/* HEADER KPI */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-lg flex items-center justify-between">
                    <div>
                        <p className="text-slate-400 text-sm font-medium uppercase">Ingresos Totales</p>
                        <h3 className="text-3xl font-bold text-green-400 mt-1">{formatMoney(totalIncome)}</h3>
                    </div>
                    <div className="bg-green-500/10 p-3 rounded-full text-green-400"><TrendingUp size={24}/></div>
                </div>
                <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-lg flex items-center justify-between">
                    <div>
                        <p className="text-slate-400 text-sm font-medium uppercase">Gastos Totales</p>
                        <h3 className="text-3xl font-bold text-red-400 mt-1">{formatMoney(totalExpenses)}</h3>
                    </div>
                    <div className="bg-red-500/10 p-3 rounded-full text-red-400"><TrendingDown size={24}/></div>
                </div>
                <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-lg flex items-center justify-between">
                    <div>
                        <p className="text-slate-400 text-sm font-medium uppercase">Resultado Neto</p>
                        <h3 className={`text-3xl font-bold mt-1 ${netIncome >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>{formatMoney(netIncome)}</h3>
                    </div>
                    <div className="bg-blue-500/10 p-3 rounded-full text-blue-400"><Wallet size={24}/></div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* FORMULARIO DE GASTOS */}
                <div className="lg:col-span-1 bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-white/10 h-fit">
                    <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2"><DollarSign size={20}/> Registrar Gasto</h3>
                    <form onSubmit={handleAdd} className="space-y-4">
                        <div>
                            <label className="text-xs text-slate-400 block mb-1">Fecha</label>
                            <input type="date" required value={newExpense.date} onChange={e => setNewExpense({...newExpense, date: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-lg p-2.5 text-white"/>
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 block mb-1">Categoría</label>
                            <select value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value as any})} className="w-full bg-slate-800 border border-white/10 rounded-lg p-2.5 text-white">
                                <option>Varios</option>
                                <option>Sueldos</option>
                                <option>Servicios</option>
                                <option>Alquiler</option>
                                <option>Mantenimiento</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 block mb-1">Descripción</label>
                            <input type="text" required placeholder="Ej: Pago de Luz" value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-lg p-2.5 text-white"/>
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 block mb-1">Monto ($)</label>
                            <input type="number" required min="0" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: parseFloat(e.target.value)})} className="w-full bg-slate-800 border border-white/10 rounded-lg p-2.5 text-white font-mono font-bold"/>
                        </div>
                        <button type="submit" className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-red-600/20">
                            <Plus size={18}/> Cargar Gasto
                        </button>
                    </form>
                </div>

                {/* LISTADO Y GRÁFICO */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Gráfico */}
                    <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-white/10 h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                <XAxis type="number" stroke="#94a3b8" />
                                <YAxis type="category" dataKey="name" stroke="#94a3b8" width={80} />
                                <Tooltip contentStyle={{backgroundColor: '#1e293b', border: 'none'}} itemStyle={{color: '#fff'}} formatter={(val: number) => formatMoney(val)}/>
                                <Legend />
                                <Bar dataKey="Ingresos" fill="#4ade80" radius={[0, 4, 4, 0]} />
                                <Bar dataKey="Gastos" fill="#f87171" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Tabla de Gastos Recientes */}
                    <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-white/10">
                        <h3 className="text-white font-bold text-lg mb-4">Últimos Gastos</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-300">
                                <thead className="text-xs uppercase bg-white/5 text-slate-400">
                                    <tr>
                                        <th className="px-4 py-3 rounded-l-lg">Fecha</th>
                                        <th className="px-4 py-3">Categoría</th>
                                        <th className="px-4 py-3">Descripción</th>
                                        <th className="px-4 py-3 text-right">Monto</th>
                                        <th className="px-4 py-3 rounded-r-lg text-center">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {expenses.length === 0 ? (
                                        <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500 italic">No hay gastos registrados.</td></tr>
                                    ) : (
                                        expenses.map(exp => (
                                            <tr key={exp.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-4 py-3">{exp.date}</td>
                                                <td className="px-4 py-3"><span className="bg-red-500/10 text-red-300 px-2 py-1 rounded text-xs border border-red-500/20">{exp.category}</span></td>
                                                <td className="px-4 py-3 text-white">{exp.description}</td>
                                                <td className="px-4 py-3 text-right font-mono font-bold text-red-400">-{formatMoney(exp.amount)}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <button onClick={() => onDeleteExpense(exp.id)} className="p-2 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-lg transition-colors"><Trash2 size={16}/></button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
