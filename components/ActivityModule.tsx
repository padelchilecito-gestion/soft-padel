import React, { useState } from 'react';
import { ActivityLogEntry, ActivityType, ClubConfig } from '../types';
import { ClipboardList, Filter, Search, Calendar, ShoppingCart, DollarSign, User, Package, Monitor, Power, Lock, Unlock } from 'lucide-react';
import { COLOR_THEMES } from '../constants';

interface ActivityModuleProps {
    activities: ActivityLogEntry[];
    config: ClubConfig;
}

export const ActivityModule: React.FC<ActivityModuleProps> = ({ activities, config }) => {
    const [filterType, setFilterType] = useState<string>('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const theme = COLOR_THEMES[config.courtColorTheme];

    const getIcon = (type: ActivityType) => {
        switch (type) {
            case 'BOOKING': return <Calendar size={18} className="text-blue-400"/>;
            case 'SALE': return <ShoppingCart size={18} className="text-green-400"/>;
            case 'SHIFT': return <DollarSign size={18} className="text-yellow-400"/>;
            case 'SYSTEM': return <Power size={18} className="text-purple-400"/>;
            case 'STOCK': return <Package size={18} className="text-orange-400"/>;
            default: return <ClipboardList size={18} className="text-slate-400"/>;
        }
    };

    const getTypeLabel = (type: ActivityType) => {
        switch (type) {
            case 'BOOKING': return 'Reserva';
            case 'SALE': return 'Venta';
            case 'SHIFT': return 'Caja';
            case 'SYSTEM': return 'Sistema';
            case 'STOCK': return 'Stock';
            default: return type;
        }
    };

    const filteredActivities = activities.filter(act => {
        const matchesType = filterType === 'ALL' || act.type === filterType;
        const matchesSearch = act.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              act.user.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesType && matchesSearch;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 pb-20">
            {/* Header */}
            <div className="bg-slate-900/60 p-4 rounded-xl border border-white/10 backdrop-blur-md shadow-xl flex flex-col md:flex-row gap-4 justify-between items-center sticky top-0 z-20">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="bg-purple-500/20 p-2 rounded-lg text-purple-400">
                        <ClipboardList size={24}/> 
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white leading-none">Registro de Actividad</h2>
                        <p className="text-xs text-slate-400 mt-1">Historial completo del sistema</p>
                    </div>
                </div>
                
                <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2">
                    <div className="relative flex-1">
                        <input 
                            type="text" 
                            placeholder="Buscar por usuario o descripción..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-800 border border-white/10 rounded-lg py-2.5 pl-9 text-sm text-white focus:ring-2 focus:ring-purple-500"
                        />
                        <Search className="absolute left-3 top-3 text-slate-500 h-4 w-4"/>
                    </div>
                    
                    <div className="flex gap-2 overflow-x-auto">
                        {['ALL', 'BOOKING', 'SALE', 'SHIFT', 'SYSTEM'].map((type) => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap
                                    ${filterType === type 
                                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' 
                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}
                                `}
                            >
                                {type === 'ALL' ? 'Todos' : getTypeLabel(type as ActivityType)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Timeline View */}
            <div className="relative pl-4 border-l border-white/10 space-y-8">
                {filteredActivities.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 italic">No se encontraron registros de actividad.</div>
                ) : (
                    filteredActivities.map((act) => (
                        <div key={act.id} className="relative group">
                            {/* Dot on timeline */}
                            <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-slate-800 border-2 border-slate-600 group-hover:border-purple-400 group-hover:bg-purple-500 transition-colors"></div>
                            
                            <div className="bg-slate-900/40 backdrop-blur-sm p-4 rounded-xl border border-white/5 hover:bg-white/5 transition-all hover:border-white/10">
                                <div className="flex flex-col md:flex-row justify-between md:items-center gap-2 mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 rounded bg-slate-800 border border-white/5">
                                            {getIcon(act.type)}
                                        </div>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                                            act.type === 'BOOKING' ? 'bg-blue-500/10 border-blue-500/20 text-blue-300' :
                                            act.type === 'SALE' ? 'bg-green-500/10 border-green-500/20 text-green-300' :
                                            act.type === 'SHIFT' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300' :
                                            'bg-purple-500/10 border-purple-500/20 text-purple-300'
                                        }`}>
                                            {getTypeLabel(act.type)}
                                        </span>
                                        <span className="text-xs text-slate-500 flex items-center gap-1">
                                            <User size={12}/> {act.user}
                                        </span>
                                    </div>
                                    <span className="text-xs font-mono text-slate-500">
                                        {new Date(act.timestamp).toLocaleString()}
                                    </span>
                                </div>
                                
                                <div className="flex justify-between items-start">
                                    <p className="text-sm text-slate-200">{act.description}</p>
                                    {act.amount !== undefined && (
                                        <span className="font-mono font-bold text-white bg-white/5 px-2 py-1 rounded">
                                            ${act.amount.toLocaleString()}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};