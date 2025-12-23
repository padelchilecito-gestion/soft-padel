import React, { useState, useMemo } from 'react';
import { ClubConfig, ActivityLogEntry, ActivityType, PaymentMethod, Expense } from '../types';
import { DollarSign, Lock, Unlock, TrendingUp, Calendar, CreditCard, Banknote, QrCode, ArrowDownCircle, ArrowUpCircle, FileText, Download } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { COLOR_THEMES } from '../constants';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CashboxModuleProps {
    config: ClubConfig;
    role: string;
    activities: ActivityLogEntry[];
    expenses: Expense[];
    onLogActivity: (type: ActivityType, description: string, amount?: number) => void;
}

const formatMoney = (val: number) => val.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

export const CashboxModule: React.FC<CashboxModuleProps> = ({ config, role, activities = [], expenses = [], onLogActivity }) => {
    const [status, setStatus] = useState<'OPEN' | 'CLOSED'>('CLOSED');
    const [amount, setAmount] = useState<string>('');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const theme = COLOR_THEMES[config.courtColorTheme];

    const today = new Date().toISOString().split('T')[0];

    // 1. Filtrar INGRESO (Actividades de hoy)
    const todaysIncomeEvents = useMemo(() => {
        if (!activities) return [];
        return activities.filter(act => 
            act.timestamp.startsWith(today) && 
            (act.type === 'SALE' || act.type === 'BOOKING' || act.type === 'SHIFT')
        );
    }, [activities, today]);

    // 2. Filtrar EGRESOS (Gastos de hoy)
    const todaysExpenses = useMemo(() => {
        if (role !== 'ADMIN' || !expenses) return [];
        return expenses.filter(e => e.date === today);
    }, [expenses, today, role]);

    // 3. Combinar todo en una línea de tiempo única
    const timeline = useMemo(() => {
        const events = [
            ...todaysIncomeEvents.map(e => ({
                id: e.id,
                time: e.timestamp,
                type: 'INCOME',
                category: e.type,
                description: e.description,
                amount: e.amount || 0,
                method: e.method,
                user: e.user
            })),
            ...todaysExpenses.map(e => ({
                id: e.id,
                time: `${e.date}T12:00:00`, // Hora ficticia para gastos sin hora
                type: 'EXPENSE',
                category: e.category,
                description: e.description,
                amount: e.amount,
                method: null,
                user: 'Admin'
            }))
        ];
        return events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    }, [todaysIncomeEvents, todaysExpenses]);

    // Calcular totales por método
    const incomeByMethod = useMemo(() => {
        const data = [
            { name: 'Efectivo', value: 0, color: '#22c55e', icon: Banknote },
            { name: 'QR MP', value: 0, color: '#3b82f6', icon: QrCode },
            { name: 'Transferencia', value: 0, color: '#a855f7', icon: CreditCard },
        ];
        todaysIncomeEvents.forEach(act => {
            if ((act.type === 'SALE' || act.type === 'BOOKING') && act.amount && act.method) {
                const idx = data.findIndex(d => 
                    (act.method === PaymentMethod.CASH && d.name === 'Efectivo') ||
                    (act.method === PaymentMethod.QR && d.name === 'QR MP') ||
                    (act.method === PaymentMethod.TRANSFER && d.name === 'Transferencia')
                );
                if (idx !== -1) data[idx].value += act.amount;
            }
        });
        return data; // Devolvemos todos para el reporte, aunque sean 0
    }, [todaysIncomeEvents]);

    const totalIncome = incomeByMethod.reduce((acc, curr) => acc + curr.value, 0);
    const totalExpensesAmount = todaysExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    const finalBalance = totalIncome - totalExpensesAmount;

    // --- LÓGICA DE EXPORTACIÓN A PDF ---
    const handleExportPDF = () => {
        const doc = new jsPDF();
        const dateStr = new Date().toLocaleDateString('es-AR');
        
        // 1. Encabezado
        doc.setFillColor(15, 23, 42); // Slate 900
        doc.rect(0, 0, 210, 40, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text(config.name, 14, 20);
        
        doc.setFontSize(12);
        doc.setTextColor(148, 163, 184); // Slate 400
        doc.text(`Reporte de Cierre de Caja - ${dateStr}`, 14, 30);

        // 2. Resumen Financiero
        let yPos = 50;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.text("Resumen Financiero", 14, yPos);
        
        yPos += 10;
        const summaryData = [
            ['Total Ingresos', `$ ${totalIncome.toLocaleString('es-AR')}`],
            ['Total Gastos', `$ ${totalExpensesAmount.toLocaleString('es-AR')}`],
            ['BALANCE NETO', `$ ${finalBalance.toLocaleString('es-AR')}`]
        ];

        autoTable(doc, {
            startY: yPos,
            head: [['Concepto', 'Monto']],
            body: summaryData,
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246] }, // Blue 500
            columnStyles: { 
                0: { fontStyle: 'bold' },
                1: { halign: 'right', fontStyle: 'bold' } 
            }
        });

        // 3. Desglose por Método de Pago
        // @ts-ignore
        yPos = doc.lastAutoTable.finalY + 15;
        doc.text("Desglose por Método de Pago (Ingresos)", 14, yPos);
        
        yPos += 5;
        const methodData = incomeByMethod.map(m => [m.name, `$ ${m.value.toLocaleString('es-AR')}`]);
        
        autoTable(doc, {
            startY: yPos,
            head: [['Método', 'Total']],
            body: methodData,
            theme: 'grid',
            headStyles: { fillColor: [71, 85, 105] }, // Slate 600
            columnStyles: { 1: { halign: 'right' } }
        });

        // 4. Detalle de Movimientos
        // @ts-ignore
        yPos = doc.lastAutoTable.finalY + 15;
        doc.text("Detalle de Movimientos", 14, yPos);
        
        yPos += 5;
        const rows = timeline.map(t => [
            new Date(t.time).toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit'}),
            t.type === 'INCOME' ? (t.category === 'SHIFT' ? 'CAJA' : t.category) : 'GASTO',
            t.description,
            t.method || '-',
            t.type === 'EXPENSE' ? `-$ ${t.amount.toLocaleString()}` : `$ ${t.amount.toLocaleString()}`
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [['Hora', 'Tipo', 'Descripción', 'Método', 'Monto']],
            body: rows,
            theme: 'striped',
            headStyles: { fillColor: [15, 23, 42] },
            styles: { fontSize: 8 },
            columnStyles: { 
                4: { halign: 'right', fontStyle: 'bold' } 
            },
            didParseCell: (data) => {
                // Color rojo para gastos en la columna de monto
                if (data.section === 'body' && data.column.index === 4 && data.cell.raw.toString().startsWith('-')) {
                    data.cell.styles.textColor = [239, 68, 68]; // Red 500
                }
            }
        });

        // Guardar PDF
        doc.save(`Cierre_Caja_${dateStr.replace(/\//g, '-')}.pdf`);
    };

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
                
                {/* Control Caja */}
                <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl flex flex-col items-center justify-center text-center">
                     <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-lg border-4 transition-colors duration-500
                        ${status === 'OPEN' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                        {status === 'OPEN' ? <Unlock size={40} /> : <Lock size={40} />}
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-1">{status === 'OPEN' ? 'Caja Abierta' : 'Caja Cerrada'}</h2>
                    <div className="w-full max-w-xs space-y-3 mt-4">
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
                        <button onClick={handleAction} disabled={!amount} className={`w-full py-2.5 rounded-xl font-bold text-white transition-all active:scale-95 ${status === 'CLOSED' ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'}`}>
                            {status === 'CLOSED' ? 'ABRIR TURN' : 'CERRAR TURN'}
                        </button>
                    </div>
                </div>

                {/* Gráfico de Ingresos */}
                <div className="lg:col-span-2 bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2"><TrendingUp size={20} className="text-blue-400"/> Ventas del Turno</h3>
                        </div>
                        <div className="text-right">
                            <span className="text-xs text-slate-400 uppercase font-bold">Ingresos</span>
                            <div className="text-2xl font-mono font-bold text-green-400">{formatMoney(totalIncome)}</div>
                            {role === 'ADMIN' && totalExpensesAmount > 0 && (
                                <div className="text-xs text-red-400 font-mono mt-1">
                                    - {formatMoney(totalExpensesAmount)} (Gastos)
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 min-h-[200px] flex items-center" style={{ minHeight: '300px' }}>
                        {incomeByMethod.filter(d => d.value > 0).length > 0 ? (
                            <div className="w-full h-full flex flex-col sm:flex-row items-center">
                                <div className="h-[200px] w-full sm:w-1/2">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={incomeByMethod.filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                                {incomeByMethod.filter(d => d.value > 0).map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} stroke="none"/>))}
                                            </Pie>
                                            <Tooltip contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px'}} itemStyle={{color: '#fff'}} formatter={(val: number) => formatMoney(val)}/>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="w-full sm:w-1/2 space-y-3 pl-4">
                                    {incomeByMethod.map((item) => (
                                        <div key={item.name} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
                                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{backgroundColor: item.color}}></div><span className="text-sm text-slate-300">{item.name}</span></div>
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

            {/* --- LISTADO DE MOVIMIENTOS --- */}
            <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-lg">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                        <Calendar size={20}/> Detalle de Movimientos {role === 'ADMIN' ? '(Completo)' : '(Ventas)'}
                    </h3>
                    <button 
                        onClick={handleExportPDF}
                        disabled={timeline.length === 0}
                        className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors disabled:opacity-50 shadow-lg shadow-red-900/20 active:scale-95"
                    >
                        <FileText size={16}/> Descargar Reporte PDF
                    </button>
                </div>

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
                            {timeline.map((act) => (
                                <tr key={act.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-3 font-mono text-slate-500 text-xs">
                                        {new Date(act.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </td>
                                    
                                    <td className="px-4 py-3">
                                        {act.type === 'EXPENSE' ? (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-red-500/10 text-red-400 border-red-500/20 flex w-fit items-center gap-1">
                                                <ArrowDownCircle size={10}/> GASTO
                                            </span>
                                        ) : (
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border flex w-fit items-center gap-1 ${
                                                act.category === 'SALE' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                act.category === 'BOOKING' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                            }`}>
                                                <ArrowUpCircle size={10}/> {act.category === 'SHIFT' ? 'CAJA' : act.category}
                                            </span>
                                        )}
                                    </td>

                                    <td className="px-4 py-3 text-white">
                                        {act.description}
                                        {act.type === 'EXPENSE' && <span className="text-xs text-slate-500 ml-2">({act.category})</span>}
                                    </td>
                                    
                                    <td className="px-4 py-3 text-xs">
                                        {act.method ? (
                                            <span className="flex items-center gap-1">
                                                {act.method === PaymentMethod.CASH && <Banknote size={12}/>}
                                                {act.method === PaymentMethod.QR && <QrCode size={12}/>}
                                                {act.method === PaymentMethod.TRANSFER && <CreditCard size={12}/>}
                                                {act.method}
                                            </span>
                                        ) : (
                                            <span className="text-slate-600">-</span>
                                        )}
                                    </td>
                                    
                                    <td className={`px-4 py-3 text-right font-mono font-bold ${act.type === 'EXPENSE' ? 'text-red-400' : 'text-white'}`}>
                                        {act.type === 'EXPENSE' ? '-' : ''}{act.amount ? formatMoney(act.amount) : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {timeline.length === 0 && <p className="text-center text-slate-500 py-8 italic">No hay movimientos hoy.</p>}
                </div>
            </div>
        </div>
    );
};
