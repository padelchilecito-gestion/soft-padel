import React, { useState, useMemo, useEffect } from 'react';
import { Booking, ActivityLogEntry, Expense, MonthlySummary } from '../types';
import { DollarSign, TrendingDown, TrendingUp, Wallet, Plus, Trash2, Archive, RefreshCw, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { subscribeSummaries, runMaintenance } from '../services/firestore';

interface ReportsModuleProps {
    bookings: Booking[];
    activities: ActivityLogEntry[];
    expenses: Expense[];
    onAddExpense: (e: Expense) => void;
    onDeleteExpense: (id: string) => void;
}

const formatMoney = (val: number) => val.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

export const ReportsModule: React.FC<ReportsModuleProps> = ({ bookings, activities, expenses, onAddExpense, onDeleteExpense }) => {
    const [newExpense, setNewExpense] = useState<Partial<Expense>>({ date: new Date().toISOString().split('T')[0], category: 'Varios', description: '', amount: 0 });
    const [summaries, setSummaries] = useState<MonthlySummary[]>([]);
    const [isMaintenanceRunning, setIsMaintenanceRunning] = useState(false);

    useEffect(() => { const unsub = subscribeSummaries(setSummaries); return () => unsub(); }, []);

    const handleRunMaintenance = async () => {
        if (confirm("Esta acción compactará registros antiguos. ¿Deseas continuar?")) {
            setIsMaintenanceRunning(true);
            await runMaintenance();
            setIsMaintenanceRunning(false);
            alert("Mantenimiento finalizado exitosamente.");
        }
    };

    const currentIncome = useMemo(() => activities.reduce((acc, curr) => ((curr.type === 'SALE' || curr.type === 'BOOKING') && curr.amount) ? acc + curr.amount : acc, 0), [activities]);
    const currentExpenses = useMemo(() => expenses.reduce((acc, curr) => acc + curr.amount, 0), [expenses]);
    const historicalIncome = summaries.reduce((acc, s) => acc + s.totalIncome, 0);
    const historicalExpenses = 0; 
    const totalGlobalIncome = currentIncome + historicalIncome;
    const totalGlobalExpenses = currentExpenses + historicalExpenses;
    const netIncome = totalGlobalIncome - totalGlobalExpenses;

    const chartData = [
        { name: 'Actual (15d)', Ingresos: currentIncome, Gastos: currentExpenses },
        { name: 'Histórico', Ingresos: historicalIncome, Gastos: historicalExpenses },
        { name: 'Total', Ingresos: totalGlobalIncome, Gastos: totalGlobalExpenses }
    ];

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newExpense.amount || !newExpense.description) return;
        onAddExpense({ id: Date.now().toString(), date: newExpense.date!, category: newExpense.category as any, description: newExpense.description!, amount: parseFloat(newExpense.amount!.toString()) });
        setNewExpense({ ...newExpense, description: '', amount: 0 });
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in pb-24 px-2 sm:px-4 min-w-0">
            {/* KPI Cards Glass */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 rounded-2xl flex items-center justify-between min-w-0">
                    <div className="min-w-0"><p className="text-slate-400 text-xs font-bold uppercase tracking-wider truncate">Ingresos (Global)</p><h3 className="text-2xl sm:text-3xl font-black text-green-400 mt-1 truncate">{formatMoney(totalGlobalIncome)}</h3><p className="text-[10px] text-slate-500">Histórico + Actual</p></div>
                    <div className="bg-green-500/10 p-3 rounded-xl text-green-400 shadow-inner flex-shrink-0"><TrendingUp size={28}/></div>
                </div>
                <div className="glass-panel p-6 rounded-2xl flex items-center justify-between min-w-0">
                    <div className="min-w-0"><p className="text-slate-400 text-xs font-bold uppercase tracking-wider truncate">Gastos (Global)</p><h3 className="text-2xl sm:text-3xl font-black text-red-400 mt-1 truncate">{formatMoney(totalGlobalExpenses)}</h3></div>
                    <div className="bg-red-500/10 p-3 rounded-xl text-red-400 shadow-inner flex-shrink-0"><TrendingDown size={28}/></div>
                </div>
                <div className="glass-panel p-6 rounded-2xl flex items-center justify-between min-w-0">
                    <div className="min-w-0"><p className="text-slate-400 text-xs font-bold uppercase tracking-wider truncate">Resultado Neto</p><h3 className={`text-2xl sm:text-3xl font-black mt-1 truncate ${netIncome >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>{formatMoney(netIncome)}</h3></div>
                    <div className="bg-blue-500/10 p-3 rounded-xl text-blue-400 shadow-inner flex-shrink-0"><Wallet size={28}/></div>
                </div>
            </div>

            {/* Mantenimiento */}
            <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-md">
                <div className="flex items-center gap-3"><div className="bg-blue-500/20 p-2 rounded-lg text-blue-400"><Archive size={24}/></div><div><h4 className="text-white font-bold text-sm">Optimización de Base de Datos</h4><p className="text-slate-400 text-xs">Compacta registros antiguos (+15 días) para ahorrar espacio.</p></div></div>
                <button onClick={handleRunMaintenance} disabled={isMaintenanceRunning} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors disabled:opacity-50"><RefreshCw size={16} className={isMaintenanceRunning ? "animate-spin" : ""}/>{isMaintenanceRunning ? "Procesando..." : "Ejecutar Limpieza"}</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Formulario Glass */}
                <div className="lg:col-span-1 h-fit space-y-6">
                    <div className="glass-panel p-6 rounded-2xl">
                        <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2 border-b border-white/5 pb-4"><DollarSign size={20} className="text-red-400"/> Registrar Gasto</h3>
                        <form onSubmit={handleAdd} className="space-y-5">
                            <div><label className="text-xs text-slate-400 font-bold uppercase block mb-1.5 ml-1">Fecha</label><input type="date" required value={newExpense.date} onChange={e => setNewExpense({...newExpense, date: e.target.value})} className="glass-input w-full rounded-xl p-3"/></div>
                            <div><label className="text-xs text-slate-400 font-bold uppercase block mb-1.5 ml-1">Categoría</label><div className="relative"><select value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value as any})} className="glass-input w-full rounded-xl p-3 appearance-none"><option className="bg-slate-900">Varios</option><option className="bg-slate-900">Sueldos</option><option className="bg-slate-900">Servicios</option><option className="bg-slate-900">Alquiler</option><option className="bg-slate-900">Mantenimiento</option><option className="bg-slate-900">Proveedores</option></select><div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"><FileText size={16}/></div></div></div>
                            <div><label className="text-xs text-slate-400 font-bold uppercase block mb-1.5 ml-1">Descripción</label><input type="text" required placeholder="Ej: Pago de Luz" value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} className="glass-input w-full rounded-xl p-3"/></div>
                            <div><label className="text-xs text-slate-400 font-bold uppercase block mb-1.5 ml-1">Monto ($)</label><input type="number" required min="0" value={newExpense.amount || ''} onChange={e => setNewExpense({...newExpense, amount: parseFloat(e.target.value)})} className="glass-input w-full rounded-xl p-3 font-mono font-bold text-lg" placeholder="0.00"/></div>
                            <button type="submit" className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg mt-2"><Plus size={20} strokeWidth={2.5}/> Cargar Gasto</button>
                        </form>
                    </div>
                </div>

                {/* Tablas y Gráficos Glass */}
                <div className="lg:col-span-2 space-y-8 min-w-0">
                    <div className="glass-panel p-6 rounded-2xl h-80 min-w-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                                <XAxis type="number" stroke="#94a3b8" tickFormatter={(val) => `$${val/1000}k`} />
                                <YAxis type="category" dataKey="name" stroke="#94a3b8" width={80} tick={{fill: 'white', fontSize: 12}} />
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }} itemStyle={{ color: '#fff' }} formatter={(val: number) => formatMoney(val)} cursor={{fill: '#ffffff05'}} />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Bar dataKey="Ingresos" fill="#4ade80" radius={[0, 6, 6, 0]} barSize={20} name="Ingresos" />
                                <Bar dataKey="Gastos" fill="#f87171" radius={[0, 6, 6, 0]} barSize={20} name="Gastos" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="glass-panel rounded-2xl overflow-hidden">
                        <div className="p-6 border-b border-white/5 bg-white/5"><h3 className="text-white font-bold text-lg flex items-center gap-2"><FileText size={20} className="text-slate-400"/> Gastos Recientes (Detalle)</h3></div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-300 min-w-[600px]">
                                <thead className="bg-white/5 text-xs uppercase font-bold text-slate-400 tracking-wider">
                                    <tr><th className="px-6 py-4">Fecha</th><th className="px-6 py-4">Categoría</th><th className="px-6 py-4">Descripción</th><th className="px-6 py-4 text-right">Monto</th><th className="px-6 py-4 text-center">Acción</th></tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {expenses.length === 0 ? (<tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">No hay gastos recientes.</td></tr>) : (
                                        expenses.map(exp => (
                                            <tr key={exp.id} className="hover:bg-white/5 transition-colors group">
                                                <td className="px-6 py-4 font-mono text-slate-400">{exp.date}</td>
                                                <td className="px-6 py-4"><span className="bg-red-500/10 text-red-300 px-2.5 py-1 rounded-md text-xs font-bold border border-red-500/20 whitespace-nowrap">{exp.category}</span></td>
                                                <td className="px-6 py-4 text-white font-medium">{exp.description}</td>
                                                <td className="px-6 py-4 text-right font-mono font-bold text-red-400 whitespace-nowrap">- {formatMoney(exp.amount)}</td>
                                                <td className="px-6 py-4 text-center"><button onClick={() => onDeleteExpense(exp.id)} className="p-2 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-lg transition-colors"><Trash2 size={16}/></button></td>
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
