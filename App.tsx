import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { BookingModule } from './components/BookingModule';
import { POSModule } from './components/POSModule';
import { InventoryModule } from './components/InventoryModule';
import { ActivityModule } from './components/ActivityModule';
import { PublicBookingView } from './components/PublicBookingView';
import { INITIAL_CONFIG, COLOR_THEMES } from './constants';
import { User, Booking, Product, ClubConfig, Court, ActivityLogEntry, BookingStatus, PaymentMethod, CartItem, ActivityType, Advertisement } from './types';
import { LogIn, User as UserIcon, Users, Lock, ChevronRight, ArrowLeft, Settings, LayoutGrid, MessageCircle, Upload, Image as ImageIcon, Plus, Shield, DollarSign, Edit2, Trash2, Activity, Wrench, Calendar, AlertTriangle, CheckCircle, Tag, Percent, Sun, Moon, ArrowRight, CreditCard, Phone, Check, Unlock, Megaphone, Link as LinkIcon, ExternalLink, Bell, X, Globe, Clock, MapPin, Eye, EyeOff, Save, Flame, Gift, Info } from 'lucide-react';

import { 
  subscribeBookings, subscribeCourts, subscribeProducts, subscribeConfig, subscribeUsers, subscribeActivity,
  addBooking, updateBooking, updateBookingStatus, toggleBookingRecurring,
  addProduct, updateProduct, deleteProduct, updateStock,
  updateConfig, updateCourtsList, updateUserList,
  logActivity as logActivityService, seedDatabase
} from './services/firestore';

// SONIDO CORTO Y VÁLIDO (URL)
const NOTIFICATION_SOUND = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"; 

const NotificationToast = ({ message, onClose }: { message: string | null, onClose: () => void }) => {
    if (!message) return null;
    return (
        <div className="fixed top-4 right-4 z-[60] bg-blue-600 text-white p-4 rounded-xl shadow-2xl animate-in slide-in-from-top-4 flex items-center gap-3 max-w-sm border border-white/20 backdrop-blur-md">
            <div className="bg-white/20 p-2 rounded-full"><Bell size={20} className="animate-pulse"/></div>
            <div className="flex-1">
                <h4 className="font-bold text-sm">Nueva Actividad</h4>
                <p className="text-xs opacity-90">{message}</p>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors"><X size={16}/></button>
        </div>
    );
};

const ClockIconStub = () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;

const CashboxView = ({ config, role, onLogActivity }: { config: ClubConfig, role: string, onLogActivity: (t: ActivityType, d: string, a?: number) => void }) => {
    const [status, setStatus] = useState<'OPEN' | 'CLOSED'>('CLOSED');
    const [amount, setAmount] = useState<string>('');
    const [history, setHistory] = useState<any[]>([]);

    const handleAction = () => {
        if (!amount) return;
        const val = parseFloat(amount);
        const actionName = status === 'CLOSED' ? 'Apertura de Caja' : 'Cierre de Caja';
        const newRecord = { id: Date.now(), action: status === 'CLOSED' ? 'Apertura' : 'Cierre', amount: val, time: new Date().toLocaleTimeString(), user: role };
        setHistory([newRecord, ...history]);
        setStatus(status === 'CLOSED' ? 'OPEN' : 'CLOSED');
        onLogActivity('SHIFT', `${actionName}. Monto: $${val}`, val);
        setAmount('');
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in zoom-in-95 duration-300 pb-20">
            <div className="bg-slate-900/60 backdrop-blur-md p-8 rounded-2xl border border-white/10 text-center shadow-xl">
                <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 shadow-lg border-4 transition-colors duration-500 ${status === 'OPEN' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                    {status === 'OPEN' ? <Unlock size={48} /> : <Lock size={48} />}
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">{status === 'OPEN' ? 'Caja Abierta' : 'Caja Cerrada'}</h2>
                <div className="flex flex-col sm:flex-row justify-center gap-4 items-center max-w-md mx-auto mt-4">
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={status === 'CLOSED' ? "Monto Inicial ($)" : "Monto Final ($)"} className="w-full bg-slate-800 border border-white/10 rounded-xl py-3 pl-4 text-white font-mono text-lg" />
                    <button onClick={handleAction} disabled={!amount} className={`w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-white ${status === 'CLOSED' ? 'bg-green-600' : 'bg-red-600'}`}>{status === 'CLOSED' ? 'ABRIR' : 'CERRAR'}</button>
                </div>
            </div>
            <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-lg">
                <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2"><Activity size={20}/> Auditoría de Sesión</h3>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {history.map((h: any) => (
                        <div key={h.id} className="flex justify-between items-center p-4 bg-slate-800/50 rounded-xl border border-white/5 hover:bg-slate-800 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-lg ${h.action === 'Apertura' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{h.action === 'Apertura' ? <Unlock size={18}/> : <Lock size={18}/>}</div>
                                <div><p className="text-white font-medium">{h.action}</p><p className="text-slate-500 text-xs flex items-center gap-1"><ClockIconStub /> {h.time} • <UserIcon size={10}/> {h.user}</p></div>
                            </div>
                            <span className={`font-mono font-bold text-lg ${h.action === 'Apertura' ? 'text-green-400' : 'text-white'}`}>${h.amount.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- SETTINGS VIEW (TOTALMENTE REORGANIZADA) ---
interface SettingsViewProps {
    config: ClubConfig;
    courts: Court[];
    users: User[];
    onUpdateConfig: (c: ClubConfig) => void;
    onUpdateCourts: (c: Court[]) => void;
    onUpdateUsers: (u: User[]) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ config, courts, users, onUpdateConfig, onUpdateCourts, onUpdateUsers }) => {
    const [newCourtName, setNewCourtName] = useState('');
    const [activeTab, setActiveTab] = useState<'general' | 'courts' | 'schedule' | 'users' | 'ads' | 'promos'>('general');
    
    const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
    const [adForm, setAdForm] = useState<Partial<Advertisement>>({ linkUrl: '', imageUrl: '', isActive: true });
    
    const [editingCourt, setEditingCourt] = useState<Court | null>(null);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [userForm, setUserForm] = useState<User>({ id: '', name: '', username: '', password: '', role: 'OPERATOR' });

    // --- HANDLERS ---
    const handleAdImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) { const reader = new FileReader(); reader.onloadend = () => setAdForm(prev => ({ ...prev, imageUrl: reader.result as string })); reader.readAsDataURL(file); }
    };
    
    const handleSaveAd = () => {
        if (!adForm.imageUrl) return alert("Imagen requerida");
        let updatedAds;
        if (editingAd) updatedAds = config.ads.map(ad => ad.id === editingAd.id ? { ...ad, ...adForm } as Advertisement : ad);
        else updatedAds = [...config.ads, { id: `ad-${Date.now()}`, imageUrl: adForm.imageUrl!, linkUrl: adForm.linkUrl, isActive: true }];
        onUpdateConfig({ ...config, ads: updatedAds });
        setEditingAd(null); setAdForm({ linkUrl: '', imageUrl: '', isActive: true });
    };

    const handleAddCourt = () => { if (!newCourtName.trim()) return; onUpdateCourts([...courts, { id: `c${Date.now()}`, name: newCourtName, type: 'Indoor', surfaceColor: config.courtColorTheme as any, status: 'AVAILABLE', basePrice: 0, isOffer1Active: false, offer1Price: 0, isOffer2Active: false, offer2Price: 0 }]); setNewCourtName(''); };
    const handleUpdateCourt = (c: Court) => { onUpdateCourts(courts.map(x => x.id === c.id ? c : x)); setEditingCourt(null); };
    const toggleCourtStatus = (id: string) => onUpdateCourts(courts.map(c => c.id === id ? { ...c, status: c.status === 'AVAILABLE' ? 'MAINTENANCE' : 'AVAILABLE' } as Court : c));
    const deleteCourt = (id: string) => { if (confirm('¿Eliminar?')) onUpdateCourts(courts.filter(c => c.id !== id)); };
    const handleSaveUser = (e: React.FormEvent) => { e.preventDefault(); if (editingUser) onUpdateUsers(users.map(u => u.id === editingUser.id ? userForm : u)); else onUpdateUsers([...users, { ...userForm, id: `u${Date.now()}` }]); setEditingUser(null); setUserForm({ id: '', name: '', username: '', password: '', role: 'OPERATOR' }); };
    const handleDeleteUser = (id: string) => { if (users.length <= 1) return alert("Debe haber 1 usuario"); if (confirm('¿Eliminar?')) onUpdateUsers(users.filter(u => u.id !== id)); };
    
    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => onUpdateConfig({...config, logoUrl: reader.result as string}); reader.readAsDataURL(file); }};
    const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => onUpdateConfig({...config, bookingBackgroundImage: reader.result as string}); reader.readAsDataURL(file); }};

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-24 animate-in fade-in">
            {/* Header de Pestañas */}
            <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Settings className="text-blue-400" /> Configuración
                    </h2>
                </div>
                <div className="flex bg-slate-800/50 p-1 rounded-lg border border-white/5 overflow-x-auto max-w-full no-scrollbar">
                    {[
                        { id: 'general', label: 'General', icon: LayoutGrid },
                        { id: 'courts', label: 'Canchas', icon: Activity },
                        { id: 'schedule', label: 'Horarios', icon: Calendar },
                        { id: 'users', label: 'Usuarios', icon: Users },
                        { id: 'ads', label: 'Publicidad', icon: Megaphone },
                        { id: 'promos', label: 'Promos', icon: Flame }
                    ].map(tab => (
                        <button 
                            key={tab.id} 
                            onClick={() => setActiveTab(tab.id as any)} 
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap
                                ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <tab.icon size={16}/> {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-slate-900/60 backdrop-blur-md p-8 rounded-2xl border border-white/10 min-h-[500px]">
                
                {/* --- PESTAÑA 1: GENERAL --- */}
                {activeTab === 'general' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in">
                        <div className="space-y-6">
                            <h3 className="text-white font-bold text-lg border-b border-white/10 pb-2 flex items-center gap-2"><Info size={18}/> Datos del Club</h3>
                            <div>
                                <label className="block text-slate-400 text-xs font-bold uppercase mb-2">Nombre</label>
                                <input type="text" value={config.name} onChange={e => onUpdateConfig({...config, name: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white"/>
                            </div>
                            <div>
                                <label className="block text-slate-400 text-xs font-bold uppercase mb-2">WhatsApp Admin</label>
                                <input type="tel" value={config.ownerPhone} onChange={e => onUpdateConfig({...config, ownerPhone: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white"/>
                            </div>
                            <div>
                                <label className="block text-slate-400 text-xs font-bold uppercase mb-2">Alias Mercado Pago</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400"><CreditCard size={18}/></div>
                                    <input type="text" value={config.mpAlias || ''} onChange={e => onUpdateConfig({...config, mpAlias: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-lg py-3 pl-10 text-white uppercase placeholder-slate-600 focus:ring-2 focus:ring-purple-500" placeholder="ALIAS.MP"/>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-white font-bold text-lg border-b border-white/10 pb-2 flex items-center gap-2"><ImageIcon size={18}/> Personalización Visual</h3>
                            
                            {/* Logo Upload */}
                            <div className="bg-slate-800/30 p-4 rounded-xl border border-white/5 flex items-center gap-4">
                                <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center overflow-hidden border border-white/10">
                                    {config.logoUrl ? <img src={config.logoUrl} className="w-full h-full object-cover"/> : <ImageIcon className="text-slate-600"/>}
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-bold text-white mb-1">Logo del Club</div>
                                    <label className="inline-block bg-blue-600/20 text-blue-400 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer hover:bg-blue-600/30 transition-colors">
                                        Subir Imagen <input type="file" className="hidden" onChange={handleLogoUpload}/>
                                    </label>
                                </div>
                            </div>

                            {/* Background Upload */}
                            <div className="bg-slate-800/30 p-4 rounded-xl border border-white/5 flex items-center gap-4">
                                <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center overflow-hidden border border-white/10">
                                    {config.bookingBackgroundImage ? <img src={config.bookingBackgroundImage} className="w-full h-full object-cover"/> : <ImageIcon className="text-slate-600"/>}
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-bold text-white mb-1">Fondo de Reservas</div>
                                    <label className="inline-block bg-blue-600/20 text-blue-400 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer hover:bg-blue-600/30 transition-colors">
                                        Subir Imagen <input type="file" className="hidden" onChange={handleBgUpload}/>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-400 text-xs font-bold uppercase mb-2">Tema de Color</label>
                                <div className="grid grid-cols-4 gap-3">
                                    {(['blue','green','red','yellow'] as const).map((color) => (
                                        <button key={color} onClick={() => onUpdateConfig({...config, courtColorTheme: color})} className={`h-12 rounded-lg border-2 flex items-center justify-center transition-all ${config.courtColorTheme === color ? 'border-white ring-2 ring-white/20' : 'border-transparent opacity-60 hover:opacity-100'} bg-${color === 'yellow' ? 'yellow-500' : color + '-600'}`}>
                                            {config.courtColorTheme === color && <CheckCircle className="text-white drop-shadow-md" size={20}/>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- PESTAÑA 2: CANCHAS (COURTS) --- */}
                {activeTab === 'courts' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="flex gap-2">
                            <input type="text" value={newCourtName} onChange={e => setNewCourtName(e.target.value)} placeholder="Nombre nueva cancha..." className="flex-1 bg-slate-800 border border-white/10 rounded-xl px-4 text-white focus:ring-2 focus:ring-blue-500"/>
                            <button onClick={handleAddCourt} disabled={!newCourtName} className="bg-blue-600 hover:bg-blue-500 text-white px-6 rounded-xl font-bold flex items-center gap-2"><Plus size={18}/> Crear</button>
                        </div>
                        <div className="grid gap-4">
                            {courts.map(court => (
                                <div key={court.id} className="bg-slate-800/50 p-4 rounded-xl border border-white/5 flex flex-col md:flex-row items-center gap-4 hover:border-white/20 transition-all">
                                    <div className={`w-2 h-full min-h-[50px] rounded-full ${court.status === 'AVAILABLE' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                    <div className="flex-1 w-full text-center md:text-left">
                                        <h4 className="font-bold text-white text-lg">{court.name}</h4>
                                        <div className="flex flex-wrap gap-2 justify-center md:justify-start mt-1 text-xs">
                                            <span className="bg-white/10 px-2 py-0.5 rounded text-slate-300">
                                                {court.type === 'Indoor' ? 'Techada' : 'Descubierta'}
                                            </span>
                                            <span className="text-green-400 font-mono border border-green-500/30 px-2 py-0.5 rounded bg-green-500/10">${court.basePrice}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => toggleCourtStatus(court.id)} className={`px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${court.status === 'AVAILABLE' ? 'border-green-500/30 text-green-400 hover:bg-green-500/10' : 'border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10'}`}>
                                            {court.status === 'AVAILABLE' ? 'DISPONIBLE' : 'MANTENIMIENTO'}
                                        </button>
                                        <button onClick={() => setEditingCourt(court)} className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20"><Edit2 size={18}/></button>
                                        <button onClick={() => deleteCourt(court.id)} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20"><Trash2 size={18}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- PESTAÑA 3: HORARIOS (SCHEDULE) --- */}
                {activeTab === 'schedule' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="bg-slate-800/50 p-6 rounded-xl border border-white/5">
                            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2"><Calendar size={20}/> Grilla de Disponibilidad</h3>
                            <p className="text-sm text-slate-400 mb-6">Marca las casillas en <span className="text-blue-400 font-bold">AZUL</span> para los horarios en los que el club está ABIERTO.</p>
                            
                            <div className="overflow-x-auto pb-4">
                                <div className="min-w-[1000px]">
                                    {/* Header Horas */}
                                    <div className="flex mb-2">
                                        <div className="w-24 shrink-0"></div>
                                        {Array.from({length: 24}, (_, i) => i).map(h => (
                                            <div key={h} className="flex-1 text-center text-[10px] text-slate-500 font-mono font-bold">
                                                {h.toString().padStart(2, '0')}:00
                                            </div>
                                        ))}
                                    </div>
                                    {/* Filas Días */}
                                    {['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'].map((day, dIndex) => {
                                        // Protección contra array vacío
                                        const daySchedule = config.schedule && config.schedule[dIndex] ? config.schedule[dIndex] : Array(24).fill(false);
                                        
                                        return (
                                            <div key={day} className="flex items-center mb-1 gap-1">
                                                <div className="w-24 shrink-0 text-sm font-bold text-slate-300 uppercase tracking-wider">{day}</div>
                                                {Array.from({length: 24}, (_, i) => i).map(h => {
                                                    const isOpen = daySchedule[h];
                                                    return (
                                                        <button
                                                            key={h}
                                                            onClick={() => {
                                                                // Copia segura del schedule
                                                                const newSchedule = config.schedule ? [...config.schedule] : Array(7).fill(null).map(() => Array(24).fill(false));
                                                                if (!newSchedule[dIndex]) newSchedule[dIndex] = Array(24).fill(false);
                                                                
                                                                newSchedule[dIndex][h] = !newSchedule[dIndex][h];
                                                                onUpdateConfig({...config, schedule: newSchedule});
                                                            }}
                                                            className={`flex-1 h-8 rounded-sm transition-all border border-white/5 
                                                                ${isOpen 
                                                                    ? 'bg-blue-600 hover:bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.4)]' 
                                                                    : 'bg-slate-800/50 hover:bg-slate-700'}`}
                                                            title={`${day} ${h}:00`}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- PESTAÑA 4: USUARIOS (USERS) --- */}
                {activeTab === 'users' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-white font-bold text-lg">Personal Autorizado</h3>
                            <button onClick={() => { setEditingUser(null); setUserForm({ id: `u${Date.now()}`, name: '', username: '', password: '', role: 'OPERATOR' }); }} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm shadow-lg shadow-blue-600/20"><Plus size={16}/> Crear Usuario</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {users.map(u => (
                                <div key={u.id} className="bg-slate-800/50 p-4 rounded-xl border border-white/5 flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-inner ${u.role === 'ADMIN' ? 'bg-purple-600' : 'bg-blue-600'}`}>
                                                {u.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white leading-tight">{u.name}</h4>
                                                <p className="text-xs text-slate-400">@{u.username}</p>
                                            </div>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded border ${u.role === 'ADMIN' ? 'border-purple-500/30 text-purple-300' : 'border-blue-500/30 text-blue-300'}`}>{u.role === 'ADMIN' ? 'Admin' : 'Operador'}</span>
                                    </div>
                                    <div className="flex gap-2 mt-2 pt-3 border-t border-white/5">
                                        <button onClick={() => { setEditingUser(u); setUserForm(u); }} className="flex-1 py-1.5 text-xs font-bold text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 rounded">Editar</button>
                                        <button onClick={() => handleDeleteUser(u.id)} className="flex-1 py-1.5 text-xs font-bold text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded">Eliminar</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- PESTAÑA 5: PUBLICIDAD (ADS) --- */}
                {activeTab === 'ads' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
                        <div className="lg:col-span-1 bg-slate-800/50 p-6 rounded-xl border border-white/5 space-y-4 h-fit">
                            <h3 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
                                {editingAd ? <Edit2 size={18}/> : <Plus size={18}/>}
                                {editingAd ? 'Editar Banner' : 'Nuevo Banner'}
                            </h3>
                            <div>
                                <label className="block text-slate-400 text-xs font-bold uppercase mb-1">Enlace URL (Opcional)</label>
                                <input type="text" placeholder="https://..." value={adForm.linkUrl || ''} onChange={e => setAdForm({...adForm, linkUrl: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-white"/>
                            </div>
                            <div>
                                <label className="block text-slate-400 text-xs font-bold uppercase mb-1">Imagen</label>
                                <div className="w-full h-32 bg-slate-900 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center relative overflow-hidden group hover:border-blue-500 transition-colors">
                                     {adForm.imageUrl ? (
                                         <img src={adForm.imageUrl} className="w-full h-full object-cover opacity-80" />
                                     ) : (
                                         <div className="text-center p-4"><ImageIcon className="mx-auto text-slate-500 mb-2"/><span className="text-xs text-slate-500">Click para subir</span></div>
                                     )}
                                     <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleAdImageUpload}/>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {editingAd && <button onClick={() => { setEditingAd(null); setAdForm({linkUrl: '', imageUrl: '', isActive: true}); }} className="flex-1 bg-slate-700 text-white p-2 rounded-lg font-bold">Cancelar</button>}
                                <button onClick={handleSaveAd} disabled={!adForm.imageUrl} className="flex-1 bg-blue-600 text-white p-2 rounded-lg font-bold disabled:opacity-50">Guardar</button>
                            </div>
                        </div>

                        <div className="lg:col-span-2 space-y-4">
                            <div className="bg-slate-800/30 p-4 rounded-xl border border-white/5 flex justify-between items-center">
                                <span className="text-white font-bold">Intervalo de Rotación</span>
                                <div className="flex items-center gap-2"><input type="number" min="2" value={config.adRotationInterval || 5} onChange={(e) => onUpdateConfig({...config, adRotationInterval: parseInt(e.target.value)})} className="w-16 bg-slate-900 border border-white/10 rounded p-2 text-center text-white"/><span className="text-slate-400 text-sm">segundos</span></div>
                            </div>
                            
                            <div className="space-y-3">
                                {config.ads.length === 0 && (
                                    <div className="text-center py-10 border border-dashed border-white/10 rounded-xl">
                                        <Megaphone className="mx-auto text-slate-600 mb-2" size={32}/>
                                        <p className="text-slate-500">No hay publicidad activa.</p>
                                    </div>
                                )}
                                {config.ads.map((ad, i) => (
                                    <div key={ad.id} className="bg-slate-800/50 p-3 rounded-xl flex items-center gap-4">
                                        <div className="w-20 h-12 bg-slate-900 rounded overflow-hidden"><img src={ad.imageUrl} className="w-full h-full object-cover"/></div>
                                        <div className="flex-1"><p className="text-white font-bold text-sm">Banner {i+1}</p><p className="text-xs text-blue-400 truncate">{ad.linkUrl || 'Sin enlace'}</p></div>
                                        <div className="flex gap-2">
                                            <button onClick={() => toggleAdStatus(ad.id)} className={`p-2 rounded ${ad.isActive ? 'text-green-400 bg-green-500/10' : 'text-slate-500 bg-slate-700/50'}`}>{ad.isActive ? <Eye size={16}/> : <EyeOff size={16}/>}</button>
                                            <button onClick={() => handleDeleteAd(ad.id)} className="p-2 text-red-400 bg-red-500/10 rounded"><Trash2 size={16}/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                
                 {/* --- PESTAÑA 6: PROMOS --- */}
                 {activeTab === 'promos' && (
                    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in">
                        <div className="bg-slate-800/50 p-6 rounded-2xl border border-white/5 space-y-6">
                            <div className="flex items-center justify-between">
                                <div><h4 className="text-white font-bold text-lg">Promo "Turno Largo" (2hs)</h4><p className="text-xs text-slate-400">Descuento automático al reservar 4 bloques (2 horas).</p></div>
                                <button onClick={() => onUpdateConfig({...config, promoActive: !config.promoActive})} className={`w-12 h-6 rounded-full transition-colors relative ${config.promoActive ? 'bg-green-500' : 'bg-slate-700'}`}><div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${config.promoActive ? 'left-7' : 'left-1'}`}></div></button>
                            </div>
                            {config.promoActive && (
                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <div><label className="text-xs text-slate-400 font-bold block mb-1">Precio Fijo Promo</label><input type="number" value={config.promoPrice} onChange={e => onUpdateConfig({...config, promoPrice: parseFloat(e.target.value)})} className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-white font-bold text-lg"/></div>
                                    <div><label className="text-xs text-slate-400 font-bold block mb-1">Texto del Beneficio</label><input type="text" value={config.promoText} onChange={e => onUpdateConfig({...config, promoText: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-white" placeholder="Ej: ¡Gaseosa Gratis!"/></div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* --- MODAL EDITAR CANCHA --- */}
            {editingCourt && (
                 <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl p-6">
                        <h3 className="text-xl font-bold text-white mb-4">Editar {editingCourt.name}</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs text-slate-400 block mb-1">Nombre</label><input type="text" value={editingCourt.name} onChange={e => setEditingCourt({...editingCourt, name: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white"/></div>
                                <div><label className="text-xs text-slate-400 block mb-1">Tipo</label><select value={editingCourt.type} onChange={e => setEditingCourt({...editingCourt, type: e.target.value as any})} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white"><option value="Indoor">Techada</option><option value="Outdoor">Descubierta</option></select></div>
                            </div>
                            <div><label className="text-xs text-slate-400 block mb-1">Precio Base</label><input type="number" value={editingCourt.basePrice} onChange={e => setEditingCourt({...editingCourt, basePrice: parseFloat(e.target.value)})} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white font-mono font-bold"/></div>
                            <div className="flex gap-3 pt-4">
                                <button onClick={() => setEditingCourt(null)} className="flex-1 bg-slate-800 text-white font-bold py-3 rounded-xl">Cancelar</button>
                                <button onClick={() => handleUpdateCourt(editingCourt)} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl">Guardar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL USUARIOS --- */}
            {userForm.id && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
                        <button onClick={() => setUserForm({ ...userForm, id: '' })} className="absolute right-4 top-4 text-slate-400 hover:text-white"><X size={20}/></button>
                        <h3 className="text-xl font-bold text-white mb-6">{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
                        <form onSubmit={handleSaveUser} className="space-y-4">
                            <div><label className="text-xs text-slate-400 block mb-1">Nombre</label><input required type="text" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white"/></div>
                            <div><label className="text-xs text-slate-400 block mb-1">Usuario (Login)</label><input required type="text" value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white"/></div>
                            <div><label className="text-xs text-slate-400 block mb-1">Contraseña</label><input required type="text" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white"/></div>
                            <div><label className="text-xs text-slate-400 block mb-1">Rol</label><select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value as any})} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white"><option value="OPERATOR">Operador</option><option value="ADMIN">Administrador</option></select></div>
                            <div className="pt-4 flex gap-3"><button type="button" onClick={() => setUserForm({ ...userForm, id: '' })} className="flex-1 bg-slate-800 text-slate-300 font-bold py-3 rounded-xl">Cancelar</button><button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl">Guardar</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- MAIN APP ---
const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [showLogin, setShowLogin] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [config, setConfig] = useState<ClubConfig>(INITIAL_CONFIG);
  const [users, setUsers] = useState<User[]>([]);
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    seedDatabase();
    const unsubBookings = subscribeBookings(setBookings, handleNewBookingIncoming);
    const unsubCourts = subscribeCourts(setCourts);
    const unsubProducts = subscribeProducts(setProducts);
    const unsubConfig = subscribeConfig(setConfig);
    const unsubUsers = subscribeUsers(setUsers);
    const unsubActivity = subscribeActivity(setActivities);
    return () => { unsubBookings(); unsubCourts(); unsubProducts(); unsubConfig(); unsubUsers(); unsubActivity(); };
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };
  const playNotificationSound = () => { try { const audio = new Audio(NOTIFICATION_SOUND); audio.volume = 0.5; const p = audio.play(); if(p !== undefined) p.catch(() => {}); } catch(e) {} };
  const handleNewBookingIncoming = (nb: Booking) => { playNotificationSound(); showToast(`Nueva Reserva: ${nb.customerName}`); };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const foundUser = users.find(u => u.username === username && u.password === password);
    if (foundUser) { setUser(foundUser); setLoginError(''); handleLogActivity('SYSTEM', `Inicio de sesión: ${foundUser.username}`); playNotificationSound(); } 
    else { setLoginError('Credenciales incorrectas'); }
  };
  const handleLogout = () => { handleLogActivity('SYSTEM', `Cierre de sesión: ${user?.username}`); setUser(null); setUsername(''); setPassword(''); setActiveView('dashboard'); setShowLogin(false); };
  
  const handleLogActivity = (type: ActivityType, desc: string, amt?: number) => { const l: ActivityLogEntry = { id: Date.now().toString(), type, description: desc, timestamp: new Date().toISOString(), user: user?.username || 'Sistema', amount: amt }; logActivityService(l); if (type !== 'SYSTEM') showToast(desc); };
  
  const handleUpdateStatus = (id: string, s: BookingStatus) => { updateBookingStatus(id, s); handleLogActivity('BOOKING', `Estado: ${s}`); };
  const handleToggleRecurring = (id: string) => { const b = bookings.find(b => b.id === id); if(b) toggleBookingRecurring(id, b.isRecurring); };
  const handleUpdateBooking = (b: Booking) => { updateBooking(b); handleLogActivity('BOOKING', `Reserva modificada: ${b.customerName}`); };
  const handleAddBooking = (b: Booking) => { addBooking(b); handleLogActivity('BOOKING', `Reserva manual: ${b.customerName}`, b.price); };
  const handleProcessSale = (items: CartItem[], total: number, method: PaymentMethod) => { items.forEach(i => { const p = products.find(pr => pr.id === i.id); if(p) updateStock(p.id, p.stock - i.quantity); }); handleLogActivity('SALE', `Venta POS (${items.length} items) - ${method}`, total); };
  const handleAddProduct = (p: Product) => { addProduct(p); handleLogActivity('STOCK', `Producto agregado: ${p.name}`); };
  const handleUpdateProduct = (p: Product) => { updateProduct(p); handleLogActivity('STOCK', `Producto actualizado: ${p.name}`); };
  const handleDeleteProduct = (id: string) => { deleteProduct(id); handleLogActivity('STOCK', `Producto eliminado`); };
  const handleUpdateConfig = (c: ClubConfig) => updateConfig(c);
  const handleUpdateCourts = (c: Court[]) => updateCourtsList(c);
  const handleUpdateUsers = (u: User[]) => updateUserList(u);

  if (!user) {
    const theme = COLOR_THEMES[config.courtColorTheme];
    if (showLogin) {
        return (
            <div className={`min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-50`}></div>
                <div className="bg-slate-900 border border-white/10 p-8 rounded-2xl w-full max-w-md shadow-2xl relative z-10 backdrop-blur-xl animate-in fade-in zoom-in-95">
                    <button onClick={() => setShowLogin(false)} className="absolute top-4 left-4 text-slate-400 hover:text-white flex items-center gap-1 text-xs font-bold"><ArrowLeft size={16}/> Volver</button>
                    <div className="text-center mb-8 mt-4"><div className={`w-16 h-16 ${theme.primary} rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20`}>{config.logoUrl ? <img src={config.logoUrl} className="w-full h-full object-cover rounded-2xl"/> : <LayoutGrid className="text-white h-8 w-8" />}</div><h1 className="text-2xl font-bold text-white">{config.name}</h1><p className="text-slate-400">Acceso Administrativo</p></div>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Usuario</label><input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Ingrese su usuario"/></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Contraseña</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Ingrese su contraseña"/></div>
                        {loginError && <p className="text-red-400 text-sm text-center">{loginError}</p>}
                        <button type="submit" className={`w-full ${theme.primary} text-white font-bold py-3 rounded-xl shadow-lg hover:opacity-90 transition-all active:scale-95`}>Ingresar</button>
                    </form>
                </div>
            </div>
        );
    }
    return <div className="relative h-screen w-full"><PublicBookingView config={config} courts={courts} bookings={bookings} onAddBooking={handleAddBooking} /><button onClick={() => setShowLogin(true)} className="absolute top-4 right-4 z-50 p-2 text-white/10 hover:text-white/50 transition-colors rounded-full" title="Acceso Admin"><Lock size={16}/></button></div>;
  }

  return (
    <>
        <NotificationToast message={toast} onClose={() => setToast(null)} />
        <Layout activeView={activeView} onChangeView={setActiveView} config={config} role={user.role} onLogout={handleLogout}>
            {activeView === 'dashboard' && <Dashboard bookings={bookings} products={products} config={config} />}
            {activeView === 'bookings' && <BookingModule bookings={bookings} courts={courts} config={config} onUpdateStatus={handleUpdateStatus} onToggleRecurring={handleToggleRecurring} onUpdateBooking={handleUpdateBooking} onAddBooking={handleAddBooking} />}
            {activeView === 'pos' && <POSModule products={products} config={config} onProcessSale={handleProcessSale} />}
            {activeView === 'inventory' && <InventoryModule products={products} config={config} onAddProduct={handleAddProduct} onUpdateProduct={handleUpdateProduct} onDeleteProduct={handleDeleteProduct} />}
            {activeView === 'activity' && <ActivityModule activities={activities} config={config} />}
            {activeView === 'cashbox' && <CashboxView config={config} role={user.role} onLogActivity={handleLogActivity} />}
            {activeView === 'settings' && <SettingsView config={config} courts={courts} users={users} onUpdateConfig={handleUpdateConfig} onUpdateCourts={handleUpdateCourts} onUpdateUsers={handleUpdateUsers} />}
            {activeView === 'public' && <PublicBookingView config={config} courts={courts} bookings={bookings} onAddBooking={handleAddBooking} />}
        </Layout>
    </>
  );
};

export default App;
