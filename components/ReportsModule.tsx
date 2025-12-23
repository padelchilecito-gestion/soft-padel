import React, { useState, useMemo, useEffect } from 'react';
import { Booking, ActivityLogEntry, Expense, MonthlySummary } from '../types';
import { DollarSign, TrendingDown, TrendingUp, Wallet, Plus, Trash2, Calendar, FileText, Archive, RefreshCw, Download, FileSpreadsheet } from 'lucide-react';
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
    // Estado para formulario de gastos
    const [newExpense, setNewExpense] = useState<Partial<Expense>>({
        date: new Date().toISOString().split('T')[0],
        category: 'Varios',
        description: '',
        amount: 0
    });
    
    // Estado para los resúmenes históricos (bóveda mensual)
    const [summaries, setSummaries] = useState<MonthlySummary[]>([]);
    const [isMaintenanceRunning, setIsMaintenanceRunning] = useState(false);

    // Suscribirse a los resúmenes históricos al cargar
    useEffect(() => {
        const unsub = subscribeSummaries(setSummaries);
        return () => unsub();
    }, []);

    // Ejecutar limpieza manual
    const handleRunMaintenance = async () => {
        if (confirm("Esta acción compactará los registros de actividad de más de 15 días en un resumen mensual para ahorrar espacio en la base de datos. Los detalles individuales antiguos se borrarán, pero el total se mantendrá. ¿Deseas continuar?")) {
            setIsMaintenanceRunning(true);
            await runMaintenance();
            setIsMaintenanceRunning(false);
            alert("Mantenimiento finalizado exitosamente.");
        }
    };

    // --- NUEVA FUNCIÓN: EXPORTAR A CSV ---
    const handleExportCSV = () => {
        if (bookings.length === 0) return alert("No hay reservas para exportar.");

        const headers = ['ID Reserva', 'Fecha', 'Hora', 'Cancha', 'Cliente', 'Telefono', 'Precio', 'Estado', 'Metodo Pago', 'Fijo'];
        
        const csvRows = [
            headers.join(','), // Encabezado
            ...bookings.map(b => [
                b.id,
                b.date,
                b.time,
                b.courtId,
                `"${b.customerName}"`, // Comillas para evitar errores si el nombre tiene comas
                b.customerPhone || 'N/A',
                b.price,
                b.status,
                b.paymentMethod || 'Sin Pago',
                b.isRecurring ? 'Si' : 'No'
            ].join(','))
        ];

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `reservas_club_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // 1. CALCULAR INGRESOS ACTUALES (Mes en curso / Datos vivos en ActivityLog)
    const currentIncome = useMemo(() => {
        return activities.reduce((acc, curr) => {
            if ((curr.type === 'SALE' || curr.type === 'BOOKING') && curr.amount) {
                return acc + curr.amount;
            }
            return acc;
        }, 0);
    }, [activities]);

    const currentExpenses = useMemo(() => {
        return expenses.reduce((acc, curr) => acc + curr.amount, 0);
    }, [expenses]);

    // 2. CALCULAR HISTÓRICO Y TOTALES
    const historicalIncome = summaries.reduce((acc, s) => acc + s.totalIncome, 0);
    // Nota: Si implementaras compactación de gastos en el futuro, sumarías s.totalExpenses aquí.
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
            
            {/* --- HEADER KPI --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Ingresos Globales */}
                <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl flex items-center justify-between min-w-0">
                    <div className="min-w-0">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider truncate">Ingresos (Global)</p>
                        <h3 className="text-2xl sm:text-3xl font-black text-green-400 mt-1 truncate">{formatMoney(totalGlobalIncome)}</h3>
                        <p className="text-[10px] text-slate-500">Histórico + Actual</p>
                    </div>
                    <div className="bg-green-500/10 p-3 rounded-xl text-green-400 shadow-inner flex-shrink-0">
                        <TrendingUp size={28}/>
                    </div>
                </div>

                {/* Gastos Globales */}
                <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl flex items-center justify-between min-w-0">
                    <div className="min-w-0">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider truncate">Gastos (Global)</p>
                        <h3 className="text-2xl sm:text-3xl font-black text-red-400 mt-1 truncate">{formatMoney(totalGlobalExpenses)}</h3>
                    </div>
                    <div className="bg-red-500/10 p-3 rounded-xl text-red-400 shadow-inner flex-shrink-0">
                        <TrendingDown size={28}/>
                    </div>
                </div>

                {/* Resultado Neto */}
                <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl flex items-center justify-between min-w-0">
                    <div className="min-w-0">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider truncate">Resultado Neto</p>
                        <h3 className={`text-2xl sm:text-3xl font-black mt-1 truncate ${netIncome >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
                            {formatMoney(netIncome)}
                        </h3>
                    </div>
                    <div className="bg-blue-500/10 p-3 rounded-xl text-blue-400 shadow-inner flex-shrink-0">
                        <Wallet size={28}/>
                    </div>
                </div>
            </div>

            {/* --- BARRA DE HERRAMIENTAS (MANTENIMIENTO Y EXPORTACIÓN) --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Exportar */}
                <div className="bg-green-900/20 border border-green-500/30 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-500/20 p-2 rounded-lg text-green-400"><FileSpreadsheet size={24}/></div>
                        <div>
                            <h4 className="text-white font-bold text-sm">Reporte de Reservas</h4>
                            <p className="text-slate-400 text-xs">Descarga todas las reservas históricas en formato CSV (Excel).</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleExportCSV}
                        className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors active:scale-95 whitespace-nowrap"
                    >
                        <Download size={16}/> Descargar CSV
                    </button>
                </div>

                {/* Mantenimiento */}
                <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400"><Archive size={24}/></div>
                        <div>
                            <h4 className="text-white font-bold text-sm">Optimización DB</h4>
                            <p className="text-slate-400 text-xs">Compacta registros viejos (+15 días) para mejorar velocidad.</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleRunMaintenance}
                        disabled={isMaintenanceRunning}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors disabled:opacity-50 active:scale-95 whitespace-nowrap"
                    >
                        <RefreshCw size={16} className={isMaintenanceRunning ? "animate-spin" : ""}/>
                        {isMaintenanceRunning ? "Procesando..." : "Limpiar"}
                    </button>
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
                    <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                                <XAxis type="number" stroke="#94a3b8" tickFormatter={(val) => `$${val/1000}k`} />
                                <YAxis type="category" dataKey="name" stroke="#94a3b8" width={80} tick={{fill: 'white', fontSize: 12}} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }} 
                                    itemStyle={{ color: '#fff', fontWeight: 'bold' }} 
                                    formatter={(val: number) => formatMoney(val)}
                                    cursor={{fill: '#ffffff05'}}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Bar dataKey="Ingresos" fill="#4ade80" radius={[0, 6, 6, 0]} barSize={20} name="Ingresos" />
                                <Bar dataKey="Gastos" fill="#f87171" radius={[0, 6, 6, 0]} barSize={20} name="Gastos" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Tabla de Resúmenes Históricos (Archivo Mensual) */}
                    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl overflow-hidden">
                        <div className="p-6 border-b border-white/5 bg-slate-800/30">
                            <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                <Archive size={20} className="text-blue-400"/> Archivo Mensual (Datos Compactados)
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-300">
                                <thead className="bg-slate-950/50 text-xs uppercase font-bold text-slate-400 tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Mes</th>
                                        <th className="px-6 py-4 text-center">Operaciones</th>
                                        <th className="px-6 py-4 text-right">Ingresos Archivados</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {summaries.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-8 text-center text-slate-500 italic">
                                                No hay meses archivados aún. Ejecuta la limpieza.
                                            </td>
                                        </tr>
                                    ) : (
                                        summaries.map(s => (
                                            <tr key={s.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4 font-bold text-white">{s.monthLabel}</td>
                                                <td className="px-6 py-4 text-center font-mono bg-white/5 rounded mx-2">{s.operationCount}</td>
                                                <td className="px-6 py-4 text-right font-mono text-green-400">{formatMoney(s.totalIncome)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Tabla de Gastos Recientes */}
                    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl overflow-hidden">
                        <div className="p-6 border-b border-white/5 bg-slate-800/30">
                            <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                <FileText size={20} className="text-slate-400"/> Gastos Recientes (Detalle)
                            </h3>
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
                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">
                                                No hay gastos recientes.
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
