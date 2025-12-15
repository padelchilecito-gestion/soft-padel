import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { BookingModule } from './components/BookingModule';
import { POSModule } from './components/POSModule';
import { InventoryModule } from './components/InventoryModule';
import { ActivityModule } from './components/ActivityModule';
import { MOCK_USERS, MOCK_COURTS, MOCK_PRODUCTS, INITIAL_CONFIG, MOCK_ACTIVITY, generateMockBookings, COLOR_THEMES } from './constants';
import { User, Booking, Product, ClubConfig, Court, ActivityLogEntry, BookingStatus, PaymentMethod, CartItem, ActivityType, Advertisement } from './types';
import { LogIn, User as UserIcon, Users, Lock, ChevronRight, ArrowLeft, Settings, LayoutGrid, MessageCircle, Upload, Image as ImageIcon, Plus, Shield, DollarSign, Edit2, Trash2, Activity, Wrench, Calendar, AlertTriangle, CheckCircle, Tag, Percent, Sun, Moon, ArrowRight, CreditCard, Phone, Check, Unlock, Megaphone, Link as LinkIcon, ExternalLink, Bell, X, Globe, Clock, MapPin, Eye, EyeOff, Save } from 'lucide-react';

// --- UTILS ---
const getArgentinaDate = () => {
    return new Date(new Date().toLocaleString("en-US", {timeZone: "America/Argentina/Buenos_Aires"}));
};

const isPastInArgentina = (dateStr: string, timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    const [year, month, day] = dateStr.split('-').map(Number);
    const slotDate = new Date(year, month - 1, day, h, m);
    const nowArg = getArgentinaDate();
    // Comparar con el momento actual + buffer de 15 mins para no reservar sobre la hora
    const nowArgClean = new Date(nowArg.getTime() + 15 * 60000); 
    return slotDate < nowArgClean;
};

// Generar intervalos de 30 minutos
const generateTimeSlots = () => {
    const slots = [];
    for (let h = 8; h < 23; h++) {
        slots.push(`${h.toString().padStart(2, '0')}:00`);
        slots.push(`${h.toString().padStart(2, '0')}:30`);
    }
    return slots;
};

// --- NOTIFICATION TOAST ---
const NotificationToast = ({ message, onClose }: { message: string | null, onClose: () => void }) => {
    if (!message) return null;
    return (
        <div className="fixed top-4 right-4 z-[60] bg-blue-600 text-white p-4 rounded-xl shadow-2xl animate-in slide-in-from-top-4 flex items-center gap-3 max-w-sm border border-white/20 backdrop-blur-md">
            <div className="bg-white/20 p-2 rounded-full">
                <Bell size={20} className="animate-pulse"/>
            </div>
            <div className="flex-1">
                <h4 className="font-bold text-sm">Nueva Actividad</h4>
                <p className="text-xs opacity-90">{message}</p>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                <X size={16}/>
            </button>
        </div>
    );
};

// --- CASHBOX COMPONENT ---
const CashboxView = ({ config, role, onLogActivity }: { config: ClubConfig, role: string, onLogActivity: (t: ActivityType, d: string, a?: number) => void }) => {
    const [status, setStatus] = useState<'OPEN' | 'CLOSED'>('CLOSED');
    const [amount, setAmount] = useState<string>('');
    const [history, setHistory] = useState<any[]>([]);

    const handleAction = () => {
        if (!amount) return;
        const val = parseFloat(amount);
        const actionName = status === 'CLOSED' ? 'Apertura de Caja' : 'Cierre de Caja';
        
        const newRecord = {
            id: Date.now(),
            action: status === 'CLOSED' ? 'Apertura' : 'Cierre',
            amount: val,
            time: new Date().toLocaleTimeString(),
            user: role
        };
        setHistory([newRecord, ...history]);
        setStatus(status === 'CLOSED' ? 'OPEN' : 'CLOSED');
        
        onLogActivity('SHIFT', `${actionName}. Monto: $${val}`, val);
        setAmount('');
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in zoom-in-95 duration-300 pb-20">
            {/* Main Action Card */}
            <div className="bg-slate-900/60 backdrop-blur-md p-8 rounded-2xl border border-white/10 text-center shadow-xl">
                <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 shadow-lg border-4 transition-colors duration-500
                    ${status === 'OPEN' 
                        ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                        : 'bg-red-500/20 text-red-400 border-red-500/30'}`
                }>
                    {status === 'OPEN' ? <Unlock size={48} /> : <Lock size={48} />}
                </div>
                
                <h2 className="text-3xl font-bold text-white mb-2">{status === 'OPEN' ? 'Caja Abierta' : 'Caja Cerrada'}</h2>
                <p className="text-slate-400 mb-8 max-w-md mx-auto">
                    {status === 'OPEN' 
                        ? 'El sistema está habilitado para registrar cobros. Cierra la caja al finalizar el turno.' 
                        : 'Para comenzar a operar y registrar ventas, debes realizar la apertura de caja.'}
                </p>
                
                <div className="flex flex-col sm:flex-row justify-center gap-4 items-center max-w-md mx-auto">
                    <div className="relative w-full">
                        <DollarSign className="absolute left-3 top-3.5 text-slate-400 h-5 w-5" />
                        <input 
                            type="number" 
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder={status === 'CLOSED' ? "Monto Inicial ($)" : "Monto Final ($)"}
                            className="w-full bg-slate-800 border border-white/10 rounded-xl py-3 pl-10 text-white focus:ring-2 focus:ring-blue-500 font-mono text-lg"
                        />
                    </div>
                    <button 
                        onClick={handleAction}
                        disabled={!amount}
                        className={`w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-white transition-all transform active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed
                            ${status === 'CLOSED' 
                                ? 'bg-green-600 hover:bg-green-500 shadow-green-500/30' 
                                : 'bg-red-600 hover:bg-red-500 shadow-red-500/30'}`}
                    >
                        {status === 'CLOSED' ? 'ABRIR TURN' : 'CERRAR TURN'}
                    </button>
                </div>
            </div>

            {/* History Card */}
            <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-lg">
                <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2"><Activity size={20}/> Auditoría de Sesión</h3>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {history.length === 0 && (
                        <div className="text-center py-8 text-slate-500 bg-white/5 rounded-xl border border-white/5 border-dashed">
                            Sin movimientos en este turno.
                        </div>
                    )}
                    {history.map((h: any) => (
                        <div key={h.id} className="flex justify-between items-center p-4 bg-slate-800/50 rounded-xl border border-white/5 hover:bg-slate-800 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-lg ${h.action === 'Apertura' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                    {h.action === 'Apertura' ? <Unlock size={18}/> : <Lock size={18}/>}
                                </div>
                                <div>
                                    <p className="text-white font-medium">{h.action}</p>
                                    <p className="text-slate-500 text-xs flex items-center gap-1">
                                        <ClockIconStub /> {h.time} • <UserIcon size={10}/> {h.user}
                                    </p>
                                </div>
                            </div>
                            <span className={`font-mono font-bold text-lg ${h.action === 'Apertura' ? 'text-green-400' : 'text-white'}`}>
                                ${h.amount.toLocaleString()}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const ClockIconStub = () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;


// --- SETTINGS COMPONENT ---
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
    const [activeTab, setActiveTab] = useState<'general' | 'courts' | 'schedule' | 'users' | 'ads'>('general');
    
    // Ads State
    const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
    const [adForm, setAdForm] = useState<Partial<Advertisement>>({ linkUrl: '', imageUrl: '', isActive: true });

    const [editingCourt, setEditingCourt] = useState<Court | null>(null);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [userForm, setUserForm] = useState<User>({ id: '', name: '', username: '', password: '', role: 'OPERATOR' });

    // --- ADS LOGIC ---
    const handleAdImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setAdForm(prev => ({ ...prev, imageUrl: reader.result as string }));
            reader.readAsDataURL(file);
        }
    };
    
    const handleSaveAd = () => {
        if (!adForm.imageUrl) return alert("Imagen requerida");
        
        let updatedAds;
        if (editingAd) {
            // Update existing
            updatedAds = config.ads.map(ad => ad.id === editingAd.id ? { ...ad, ...adForm } as Advertisement : ad);
        } else {
            // Create new
            const newAd: Advertisement = {
                id: `ad-${Date.now()}`,
                imageUrl: adForm.imageUrl,
                linkUrl: adForm.linkUrl,
                isActive: true
            };
            updatedAds = [...config.ads, newAd];
        }
        
        onUpdateConfig({ ...config, ads: updatedAds });
        setEditingAd(null);
        setAdForm({ linkUrl: '', imageUrl: '', isActive: true });
    };

    const handleEditAd = (ad: Advertisement) => {
        setEditingAd(ad);
        setAdForm(ad);
    };

    const handleDeleteAd = (id: string) => {
        if(window.confirm('¿Eliminar publicidad?')) {
            const newAds = config.ads.filter(a => a.id !== id);
            onUpdateConfig({ ...config, ads: newAds });
            
            // Si estamos editando la publicidad que borramos, limpiamos el form
            if (editingAd && editingAd.id === id) {
                setEditingAd(null);
                setAdForm({ linkUrl: '', imageUrl: '', isActive: true });
            }
        }
    };

    const toggleAdStatus = (id: string) => {
        onUpdateConfig({ 
            ...config, 
            ads: config.ads.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a) 
        });
    };

    // --- COURTS LOGIC ---
    const handleAddCourt = () => {
        if (!newCourtName.trim()) return;
        const newCourt: Court = {
            id: `c${Date.now()}`,
            name: newCourtName,
            type: 'Indoor',
            surfaceColor: config.courtColorTheme as any,
            status: 'AVAILABLE',
            basePrice: 0,
            isOffer1Active: false,
            offer1Price: 0,
            isOffer2Active: false,
            offer2Price: 0
        };
        onUpdateCourts([...courts, newCourt]);
        setNewCourtName('');
        setEditingCourt(newCourt);
    };

    const handleUpdateCourt = (court: Court) => {
        onUpdateCourts(courts.map(c => c.id === court.id ? court : c));
        setEditingCourt(null);
    };

    const toggleCourtStatus = (courtId: string) => {
        const updatedCourts = courts.map(c => 
            c.id === courtId ? { ...c, status: c.status === 'AVAILABLE' ? 'MAINTENANCE' : 'AVAILABLE' } as Court : c
        );
        onUpdateCourts(updatedCourts);
    };

    const deleteCourt = (courtId: string) => {
        if (confirm('¿Eliminar cancha? Se perderán las referencias en reservas pasadas.')) {
            onUpdateCourts(courts.filter(c => c.id !== courtId));
        }
    };

    // --- USERS LOGIC ---
    const handleOpenUserModal = (user: User | null) => {
        setEditingUser(user);
        setUserForm(user || { id: `u${Date.now()}`, name: '', username: '', password: '', role: 'OPERATOR' });
    };

    const handleSaveUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingUser) {
            onUpdateUsers(users.map(u => u.id === editingUser.id ? userForm : u));
        } else {
            onUpdateUsers([...users, { ...userForm, id: `u${Date.now()}` }]);
        }
        setEditingUser(null);
        setUserForm({ id: '', name: '', username: '', password: '', role: 'OPERATOR' });
    };

    const handleDeleteUser = (userId: string) => {
        if (users.length <= 1) return alert("Debe haber al menos un usuario.");
        if (confirm('¿Eliminar usuario?')) {
            onUpdateUsers(users.filter(u => u.id !== userId));
        }
    };

    // --- CONFIG HANDLERS ---
    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => onUpdateConfig({...config, logoUrl: reader.result as string});
            reader.readAsDataURL(file);
        }
    };
    const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => onUpdateConfig({...config, bookingBackgroundImage: reader.result as string});
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Settings className="text-blue-400" /> Configuración
                    </h2>
                    <p className="text-slate-400 text-sm">Administra todos los aspectos de tu club.</p>
                </div>
                <div className="flex bg-slate-800/50 p-1 rounded-lg border border-white/5 overflow-x-auto max-w-full">
                    {[
                        { id: 'general', label: 'General', icon: LayoutGrid },
                        { id: 'courts', label: 'Canchas', icon: Activity },
                        { id: 'schedule', label: 'Horarios', icon: Calendar },
                        { id: 'users', label: 'Usuarios', icon: Users },
                        { id: 'ads', label: 'Publicidad', icon: Megaphone }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <tab.icon size={16} /> <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-slate-900/60 backdrop-blur-md p-8 rounded-2xl border border-white/10 min-h-[500px]">
                {activeTab === 'general' && (
                    <div className="space-y-8 animate-in fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h3 className="text-white font-bold text-lg border-b border-white/10 pb-2">Identidad</h3>
                                <div>
                                    <label className="block text-slate-400 text-xs font-bold uppercase mb-2">Nombre del Club</label>
                                    <input type="text" value={config.name} onChange={(e) => onUpdateConfig({...config, name: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white font-bold"/>
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-xs font-bold uppercase mb-2">WhatsApp Contacto</label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 border-r border-white/10 pr-2">
                                            <img src="https://flagcdn.com/w40/ar.png" alt="AR" className="w-5 h-auto rounded-[2px] opacity-80"/>
                                            <span className="text-slate-400 text-sm font-mono">+54 9</span>
                                        </div>
                                        <input 
                                            type="tel" 
                                            value={config.ownerPhone.replace(/^549/, '')} 
                                            onChange={(e) => {
                                                const cleanNumber = e.target.value.replace(/\D/g, '');
                                                onUpdateConfig({...config, ownerPhone: `549${cleanNumber}`});
                                            }}
                                            className="w-full bg-slate-800 border border-white/10 rounded-lg py-3 pl-24 text-white font-mono placeholder-slate-600 focus:ring-2 focus:ring-blue-500"
                                            placeholder="11 1234 5678"
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-1 ml-1">Ingresa el código de área (sin 0) y el número (sin 15).</p>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <h3 className="text-white font-bold text-lg border-b border-white/10 pb-2">Visuales</h3>
                                <div className="flex gap-4 items-center bg-slate-800/30 p-3 rounded-xl border border-white/5">
                                    <div className="w-12 h-12 bg-slate-700 rounded-lg overflow-hidden flex items-center justify-center">
                                        {config.logoUrl ? <img src={config.logoUrl} className="w-full h-full object-cover"/> : <ImageIcon className="text-slate-500"/>}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-bold text-slate-300">Logo del Club</div>
                                        <label className="text-xs text-blue-400 cursor-pointer hover:underline">Cambiar imagen <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload}/></label>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-center bg-slate-800/30 p-3 rounded-xl border border-white/5">
                                    <div className="w-12 h-12 bg-slate-700 rounded-lg overflow-hidden flex items-center justify-center">
                                        {config.bookingBackgroundImage ? <img src={config.bookingBackgroundImage} className="w-full h-full object-cover"/> : <ImageIcon className="text-slate-500"/>}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-bold text-slate-300">Fondo Reservas</div>
                                        <label className="text-xs text-blue-400 cursor-pointer hover:underline">Cambiar imagen <input type="file" className="hidden" accept="image/*" onChange={handleBgUpload}/></label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-white font-bold text-lg border-b border-white/10 pb-4 mb-4">Tema de Color</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {(['blue', 'green', 'red', 'yellow'] as const).map((color) => (
                                    <button 
                                        key={color} 
                                        onClick={() => onUpdateConfig({...config, courtColorTheme: color})} 
                                        className={`h-16 rounded-xl border-2 transition-all flex items-center justify-center relative overflow-hidden group
                                            ${config.courtColorTheme === color ? 'border-white ring-2 ring-white/20' : 'border-transparent opacity-70 hover:opacity-100'} 
                                            ${color === 'blue' ? 'bg-blue-600' : color === 'green' ? 'bg-green-600' : color === 'red' ? 'bg-red-600' : 'bg-yellow-500'}
                                        `}
                                    >
                                        {config.courtColorTheme === color && <CheckCircle className="text-white drop-shadow-md" size={24}/>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                
                {activeTab === 'courts' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="flex gap-2 mb-6">
