import React, { useState, useMemo } from 'react';
import { Booking, ActivityLogEntry, Expense } from '../types';
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

    // 1. CALCULAR INGRESOS TOTALES
    // Usamos 'activities' para calcular el flujo de caja real (ventas + cobros de reservas)
    const totalIncome = useMemo(() => {
        return activities.reduce((acc, curr) => {
            // Sumamos solo si es un ingreso (Venta, Cobro de Reserva o Apertura de Caja si se considera)
            // Generalmente SHIFT es movimiento interno, pero SALE y BOOKING son ingresos genuinos.
            if ((curr.type === 'SALE' || curr.type === 'BOOKING') && curr.amount) {
                return acc + curr.amount;
            }
            return acc;
        }, 0);
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
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in pb-24 px-2 sm:px-4">
            
            {/* --- HEADER KPI (Tarjetas de Resumen) --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Ingresos */}
                <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl flex items-center justify-between min-w-0">
                    <div className="min-w-0">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider truncate">Ingresos</p>
                        <h3 className="text-2xl sm:text-3xl font-black text-green-400 mt-1 truncate">{formatMoney(totalIncome)}</h3>
                    </div>
                    <div className="bg-green-500/10 p-3 rounded-xl text-green-400 shadow-inner flex-shrink-0">
                        <TrendingUp size={28}/>
                    </div>
                </div>

                {/* Gastos */}
                <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl flex items-center justify-between min-w-0">
                    <div className="min-w-0">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider truncate">Gastos</p>
                        <h3 className="text-2xl sm:text-3xl font-black text-red-400 mt-1 truncate">{formatMoney(totalExpenses)}</h3>
                    </div>
                    <div className="bg-red-500/10 p-3 rounded-xl text-red-400 shadow-inner flex-shrink-0">
                        <TrendingDown size={28}/>
                    </div>
                </div>

                {/* Neto */}
                <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl flex items-center justify-between min-w-0">
                    <div className="min-w-0">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider truncate">Resultado</p>
                        <h3 className={`text-2xl sm:text-3xl font-black mt-1 truncate ${netIncome >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
                            {formatMoney(netIncome)}
                        </h3>
                    </div>
                    <div className="bg-blue-500/10 p-3 rounded-xl text-blue-400 shadow-inner flex-shrink-0">
                        <Wallet size={28}/>
                    </div>
                </div>
            </div>

            {/* --- CONTENIDO PRINCIPAL --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* 1. FORMULARIO DE GASTOS (Columna Izquierda) */}
                <div className="lg:col-span-1 h-fit space-y-6">
                    <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl">
                        <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2 border-b border-white/5 pb-4">
                            <DollarSign size={20} className="text-red-400"/> Registrar Gasto
                        </h3>
                        <form onSubmit={handleAdd} className="space-y-5">
                            <div>
                                <label className="text-xs text-slate-400 font-bold uppercase block mb-1.5 ml-1">Fecha</label>
                                <input 
                                    type="date" 
                                    required 
                                    value={newExpense.date} 
                                    onChange={e => setNewExpense({...newExpense, date: e.target.value})} 
                                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-red-500/50 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 font-bold uppercase block mb-1.5 ml-1">Categoría</label>
                                <div className="relative">
                                    <select 
                                        value={newExpense.category} 
                                        onChange={e => setNewExpense({...newExpense, category: e.target.value as any})} 
                                        className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3 text-white appearance-none focus:ring-2 focus:ring-red-500/50 outline-none transition-all"
                                    >
                                        <option>Varios</option>
                                        <option>Sueldos</option>
                                        <option>Servicios</option>
                                        <option>Alquiler</option>
                                        <option>Mantenimiento</option>
                                        <option>Proveedores</option>
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                        <FileText size={16}/>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 font-bold uppercase block mb-1.5 ml-1">Descripción</label>
                                <input 
                                    type="text" 
                                    required 
                                    placeholder="Ej: Pago de Luz Enero" 
                                    value={newExpense.description} 
                                    onChange={e => setNewExpense({...newExpense, description: e.target.value})} 
                                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-red-500/50 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 font-bold uppercase block mb-1.5 ml-1">Monto ($)</label>
                                <input 
                                    type="number" 
                                    required 
                                    min="0" 
                                    value={newExpense.amount || ''} 
                                    onChange={e => setNewExpense({...newExpense, amount: parseFloat(e.target.value)})} 
                                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3 text-white font-mono font-bold text-lg focus:ring-2 focus:ring-red-500/50 outline-none transition-all"
                                    placeholder="0.00"
                                />
                            </div>
                            <button 
                                type="submit" 
                                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-red-900/20 mt-2"
                            >
                                <Plus size={20} strokeWidth={2.5}/> Cargar Gasto
                            </button>
                        </form>
                    </div>
                </div>

                {/* 2. DATOS Y TABLAS (Columna Derecha) */}
                <div className="lg:col-span-2 space-y-8 min-w-0">
                    
                    {/* Gráfico de Balance */}
                    <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl">
                        <h3 className="text-white font-bold text-lg mb-6">Balance Financiero</h3>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                                    <XAxis type="number" stroke="#94a3b8" tickFormatter={(val) => `$${val/1000}k`} />
                                    <YAxis type="category" dataKey="name" stroke="#94a3b8" width={80} hide />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }} 
                                        itemStyle={{ color: '#fff', fontWeight: 'bold' }} 
                                        formatter={(val: number) => formatMoney(val)}
                                        cursor={{fill: '#ffffff05'}}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    <Bar dataKey="Ingresos" fill="#4ade80" radius={[0, 6, 6, 0]} barSize={40} name="Ingresos Totales" />
                                    <Bar dataKey="Gastos" fill="#f87171" radius={[0, 6, 6, 0]} barSize={40} name="Gastos Totales" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Tabla de Gastos */}
                    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl overflow-hidden">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center">
                            <h3 className="text-white font-bold text-lg">Historial de Gastos</h3>
                            <span className="text-xs text-slate-500 bg-slate-800 px-3 py-1 rounded-full border border-white/5">
                                {expenses.length} registros
                            </span>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-300">
                                <thead className="bg-slate-950/50 text-xs uppercase font-bold text-slate-400 tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Fecha</th>
                                        <th className="px-6 py-4">Categoría</th>
                                        <th className="px-6 py-4">Descripción</th>
                                        <th className="px-6 py-4 text-right">Monto</th>
                                        <th className="px-6 py-4 text-center">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {expenses.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic flex flex-col items-center gap-2">
                                                <div className="bg-white/5 p-3 rounded-full mb-2"><FileText size={24} className="opacity-50"/></div>
                                                No hay gastos registrados aún.
                                            </td>
                                        </tr>
                                    ) : (
                                        expenses.map(exp => (
                                            <tr key={exp.id} className="hover:bg-white/5 transition-colors group">
                                                <td className="px-6 py-4 font-mono text-slate-400">{exp.date}</td>
                                                <td className="px-6 py-4">
                                                    <span className="bg-red-500/10 text-red-300 px-2.5 py-1 rounded-md text-xs font-bold border border-red-500/20 whitespace-nowrap">
                                                        {exp.category}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-white font-medium">{exp.description}</td>
                                                <td className="px-6 py-4 text-right font-mono font-bold text-red-400 whitespace-nowrap">
                                                    - {formatMoney(exp.amount)}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button 
                                                        onClick={() => onDeleteExpense(exp.id)} 
                                                        className="p-2 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
                                                        title="Eliminar Gasto"
                                                    >
                                                        <Trash2 size={16}/>
                                                    </button>
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
