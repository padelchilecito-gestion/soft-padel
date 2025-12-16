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

// --- IMPORTANTE: Conexión a Firebase ---
import { 
  subscribeBookings, subscribeCourts, subscribeProducts, subscribeConfig, subscribeUsers, subscribeActivity,
  addBooking, updateBooking, updateBookingStatus, toggleBookingRecurring,
  addProduct, updateProduct, deleteProduct, updateStock,
  updateConfig, updateCourtsList, updateUserList,
  logActivity as logActivityService, seedDatabase
} from './services/firestore';

// --- SONIDO DE NOTIFICACIÓN ---
const NOTIFICATION_SOUND = "data:audio/mp3;base64,SUQzBAAAAAABAFRYWFgAAAASAAADbWFqb3JfYnJhbmQAZGFzaABUWFhYAAAAEQAAA21pbm9yX3ZlcnNpb24AMABUWFhYAAAAHAAAA2NvbXBhdGlibGVfYnJhbmRzAGlzbzZtcDQxAFRTU0UAAAAPAAADTGF2ZjU5LjI3LjEwMAAAAAAAAAAAAAAA//uQZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWgAAAA0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AAAAA//uQZAAABO0vX/sMQAJPwvX/sMQAJOg2f/wgwAkoDZ//CDAAAGwAAAAAMAAAAAAAAAAAAAABJAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAFAAAAZgAALi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uAAAAADExLjEwMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQZAABAAABAAAAAAAABAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAAAAA//uQZAAABO0vX/sMQAJPwvX/sMQAJOg2f/wgwAkoDZ//CDAAAGwAAAAAMAAAAAAAAAAAAAABJAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAFAAAAZgAALi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uAAAAADExLjEwMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQZAAAAAAA0gAAABAAAA0gAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQZAAAAAAA0gAAABAAAA0gAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQZAAAAAAA0gAAABAAAA0gAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQZAAAAAAA0gAAABAAAA0gAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQZAAADAAABAAAAAAABAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

// --- COMPONENTES AUXILIARES ---

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

const ClockIconStub = () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;

// --- VISTA DE CAJA ---
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

// --- VISTA DE CONFIGURACIÓN (SETTINGS) COMPLETA ---
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
            updatedAds = config.ads.map(ad => ad.id === editingAd.id ? { ...ad, ...adForm } as Advertisement : ad);
        } else {
            const newAd: Advertisement = {
                id: `ad-${Date.now()}`,
                imageUrl: adForm.imageUrl!,
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
                        { id: 'ads', label: 'Publicidad', icon: Megaphone },
                        { id: 'promos', label: 'Promociones', icon: Flame }
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
                
                {activeTab === 'promos' && (
                    <div className="space-y-8 animate-in fade-in">
                        <div className="max-w-2xl mx-auto space-y-6">
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl shadow-orange-500/20">
                                    <Flame size={32} className="text-white animate-pulse" />
                                </div>
                                <h3 className="text-2xl font-bold text-white">Promo 2 Horas</h3>
                                <p className="text-slate-400 mt-2">Configura la promoción especial para reservas de larga duración.</p>
                            </div>

                            <div className="bg-slate-800/50 p-6 rounded-2xl border border-white/5 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-white font-bold text-lg">Habilitar Promoción</h4>
                                        <p className="text-xs text-slate-400">Si activas esto, se detectarán automáticamente reservas de 2hs.</p>
                                    </div>
                                    <button 
                                        onClick={() => onUpdateConfig({...config, promoActive: !config.promoActive})}
                                        className={`w-14 h-8 rounded-full transition-colors relative ${config.promoActive ? 'bg-green-500' : 'bg-slate-700'}`}
                                    >
                                        <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-transform shadow-md ${config.promoActive ? 'left-7' : 'left-1'}`}></div>
                                    </button>
                                </div>

                                <div className={`space-y-4 transition-opacity duration-300 ${config.promoActive ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                                    <div>
                                        <label className="block text-slate-400 text-xs font-bold uppercase mb-2">Precio Fijo Promo ($)</label>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                value={config.promoPrice || 0} 
                                                onChange={(e) => onUpdateConfig({...config, promoPrice: parseFloat(e.target.value)})}
                                                className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 pl-10 text-white font-mono font-bold focus:ring-2 focus:ring-orange-500"
                                                placeholder="Ej: 20000"
                                            />
                                            <DollarSign className="absolute left-3 top-3.5 text-slate-500" size={18}/>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-slate-400 text-xs font-bold uppercase mb-2">Texto del Beneficio (Regalo)</label>
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                value={config.promoText} 
                                                onChange={(e) => onUpdateConfig({...config, promoText: e.target.value})}
                                                className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 pl-10 text-white focus:ring-2 focus:ring-orange-500"
                                                placeholder="Ej: Jugá 2 horas y llevate una gaseosa..."
                                            />
                                            <Gift className="absolute left-3 top-3.5 text-slate-500" size={18}/>
                                        </div>
                                        <p className="text-[10px] text-slate-500 mt-2 ml-1">* Este texto se mostrará resaltado en la vista de reserva.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {activeTab === 'courts' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="flex gap-2 mb-6">
                            <input 
                                type="text" 
                                value={newCourtName}
                                onChange={(e) => setNewCourtName(e.target.value)}
                                placeholder="Nombre de nueva cancha..."
                                className="flex-1 bg-slate-800 border border-white/10 rounded-lg px-4 text-white focus:ring-2 focus:ring-blue-500"
                            />
                            <button onClick={handleAddCourt} disabled={!newCourtName} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2">
                                <Plus size={18}/> Agregar
                            </button>
                        </div>
                        <div className="grid gap-4">
                            {courts.map(court => (
                                <div key={court.id} className="bg-slate-800/50 p-4 rounded-xl border border-white/5 flex flex-col md:flex-row items-center gap-4 hover:border-white/20 transition-all">
                                    <div className={`w-2 h-full min-h-[50px] rounded-full ${court.status === 'AVAILABLE' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                    <div className="flex-1 w-full text-center md:text-left">
                                        <h4 className="font-bold text-white text-lg">{court.name}</h4>
                                        <div className="flex flex-wrap gap-2 justify-center md:justify-start mt-1 text-xs">
                                            <span className="bg-white/10 px-2 py-0.5 rounded text-slate-300">{court.type}</span>
                                            <span className="text-green-400 font-mono border border-green-500/30 px-2 py-0.5 rounded bg-green-500/10">${court.basePrice}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => toggleCourtStatus(court.id)} className={`px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${court.status === 'AVAILABLE' ? 'border-green-500/30 text-green-400 hover:bg-green-500/10' : 'border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10'}`}>
                                            {court.status === 'AVAILABLE' ? 'ACTIVA' : 'MANTENIMIENTO'}
                                        </button>
                                        <button onClick={() => setEditingCourt(court)} className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20"><Edit2 size={18}/></button>
                                        <button onClick={() => deleteCourt(court.id)} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20"><Trash2 size={18}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'ads' && (
                    <div className="space-y-6 animate-in fade-in grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1 bg-slate-800/50 p-6 rounded-xl border border-white/5 space-y-4 h-fit">
                            <h3 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
                                {editingAd ? <Edit2 size={18}/> : <Plus size={18}/>}
                                {editingAd ? 'Editar Banner' : 'Nuevo Banner'}
                            </h3>
                            <div>
                                <label className="block text-slate-400 text-xs font-bold uppercase mb-1">Enlace URL (Opcional)</label>
                                <input 
                                    type="text" 
                                    placeholder="https://..."
                                    value={adForm.linkUrl || ''}
                                    onChange={e => setAdForm({...adForm, linkUrl: e.target.value})}
                                    className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-400 text-xs font-bold uppercase mb-1">Imagen Banner</label>
                                <div className="w-full h-32 bg-slate-900 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center relative overflow-hidden group hover:border-blue-500 transition-colors">
                                     {adForm.imageUrl ? (
                                         <img src={adForm.imageUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100" />
                                     ) : (
                                         <div className="text-center p-4">
                                             <ImageIcon className="mx-auto text-slate-500 mb-2"/>
                                             <span className="text-xs text-slate-500">Click para subir</span>
                                         </div>
                                     )}
                                     <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleAdImageUpload}/>
                                </div>
                            </div>
                            
                            <div className="pt-2 flex gap-2">
                                {editingAd && (
                                    <button 
                                        onClick={() => { setEditingAd(null); setAdForm({linkUrl: '', imageUrl: '', isActive: true}); }}
                                        className="bg-slate-700 text-white px-4 py-3 rounded-xl font-bold hover:bg-slate-600"
                                    >
                                        Cancelar
                                    </button>
                                )}
                                <button 
                                    onClick={handleSaveAd}
                                    disabled={!adForm.imageUrl}
                                    className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-blue-500 flex justify-center items-center gap-2 disabled:opacity-50"
                                >
                                    <Save size={18}/> {editingAd ? 'Guardar Cambios' : 'Crear Banner'}
                                </button>
                            </div>
                        </div>

                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-slate-800/30 p-4 rounded-xl border border-white/5 flex justify-between items-center">
                                <div>
                                    <h4 className="text-white font-bold">Rotación de Publicidad</h4>
                                    <p className="text-xs text-slate-400">Tiempo en segundos entre cada banner.</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="number" 
                                        min="2"
                                        value={config.adRotationInterval || 5}
                                        onChange={(e) => onUpdateConfig({...config, adRotationInterval: parseInt(e.target.value)})}
                                        className="w-20 bg-slate-900 border border-white/10 rounded-lg p-2 text-center text-white font-bold"
                                    />
                                    <span className="text-sm text-slate-300">seg</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {config.ads.length === 0 && <div className="text-slate-500 text-center py-10 bg-white/5 rounded-xl border border-dashed border-white/10">No hay banners cargados.</div>}
                                {config.ads.map((ad, index) => (
                                    <div key={ad.id} className="bg-slate-800/50 p-4 rounded-xl border border-white/5 flex items-center gap-4 hover:bg-slate-800 transition-colors">
                                        <div className="w-24 h-16 bg-slate-900 rounded-lg overflow-hidden flex-shrink-0">
                                            <img src={ad.imageUrl} className="w-full h-full object-cover"/>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-white font-bold truncate">Banner {index + 1}</h4>
                                            <p className="text-xs text-blue-400 truncate">{ad.linkUrl || 'Sin enlace'}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => toggleAdStatus(ad.id)} className={`p-2 rounded-lg transition-colors ${ad.isActive ? 'text-green-400 bg-green-500/10 hover:bg-green-500/20' : 'text-slate-500 bg-slate-700/50 hover:bg-slate-700'}`}>
                                                {ad.isActive ? <Eye size={18}/> : <EyeOff size={18}/>}
                                            </button>
                                            <button onClick={() => handleEditAd(ad)} className="p-2 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg">
                                                <Edit2 size={18}/>
                                            </button>
                                            <button type="button" onClick={() => handleDeleteAd(ad.id)} className="p-2 text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg">
                                                <Trash2 size={18}/>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'schedule' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="bg-slate-800/50 p-6 rounded-xl border border-white/5">
                            <h3 className="text-white font-bold text-lg mb-4">Grilla de Disponibilidad (24 Horas)</h3>
                            <div className="overflow-x-auto pb-2">
                                <div className="min-w-[1200px]">
                                    <div className="flex mb-2">
                                        <div className="w-20"></div>
                                        {Array.from({length: 24}, (_, i) => i).map(h => (
                                            <div key={h} className="flex-1 text-center text-xs text-slate-500 font-mono">
                                                {h.toString().padStart(2, '0')}:00
                                            </div>
                                        ))}
                                    </div>
                                    {['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'].map((day, dIndex) => (
                                        <div key={day} className="flex items-center mb-2 gap-1">
                                            <div className="w-20 text-sm font-bold text-slate-300">{day}</div>
                                            {Array.from({length: 24}, (_, i) => i).map(h => {
                                                const isOpen = config.schedule?.[dIndex]?.[h];
                                                return (
                                                    <button
                                                        key={h}
                                                        onClick={() => {
                                                            const newSchedule = [...config.schedule];
                                                            if (!newSchedule[dIndex]) newSchedule[dIndex] = [];
                                                            for(let k=0; k<24; k++) {
                                                                if(newSchedule[dIndex][k] === undefined) newSchedule[dIndex][k] = false;
                                                            }
                                                            newSchedule[dIndex][h] = !newSchedule[dIndex][h];
                                                            onUpdateConfig({...config, schedule: newSchedule});
                                                        }}
                                                        className={`flex-1 h-10 rounded-sm transition-all border border-white/5 
                                                            ${isOpen 
                                                                ? 'bg-blue-600 hover:bg-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.3)]' 
                                                                : 'bg-slate-800 hover:bg-slate-700 opacity-50'}
                                                        `}
                                                        title={`${day} ${h}:00 - ${isOpen ? 'Abierto' : 'Cerrado'}`}
                                                    />
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-white font-bold text-lg">Gestión de Usuarios</h3>
                            <button 
                                onClick={() => handleOpenUserModal(null)} 
                                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm shadow-lg shadow-blue-600/20"
                            >
                                <Plus size={16}/> Nuevo Usuario
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {users.map(user => (
                                <div key={user.id} className="bg-slate-800/50 p-4 rounded-xl border border-white/5 flex flex-col gap-3 group hover:bg-slate-800 transition-colors shadow-lg">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-inner
                                                ${user.role === 'ADMIN' ? 'bg-gradient-to-br from-purple-600 to-purple-800' : 'bg-gradient-to-br from-blue-600 to-blue-800'}
                                            `}>
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white text-lg leading-tight">{user.name}</h4>
                                                <p className="text-xs text-slate-400 font-mono mt-0.5">@{user.username}</p>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase border tracking-wider
                                            ${user.role === 'ADMIN' ? 'border-purple-500/30 text-purple-300 bg-purple-500/10' : 'border-blue-500/30 text-blue-300 bg-blue-500/10'}
                                        `}>
                                            {user.role === 'ADMIN' ? 'Admin' : 'Operador'}
                                        </span>
                                    </div>
                                    <div className="flex gap-2 mt-auto pt-3 border-t border-white/5">
                                         <button onClick={() => handleOpenUserModal(user)} className="flex-1 py-2 rounded-lg bg-slate-700/50 hover:bg-blue-600/20 text-xs font-bold text-slate-300 hover:text-blue-300 transition-colors flex items-center justify-center gap-1">
                                            <Edit2 size={14}/> Editar
                                        </button>
                                         <button onClick={() => handleDeleteUser(user.id)} className="flex-1 py-2 rounded-lg bg-slate-700/50 hover:bg-red-500/20 text-xs font-bold text-slate-300 hover:text-red-400 transition-colors flex items-center justify-center gap-1">
                                            <Trash2 size={14}/> Eliminar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Courts */}
            {editingCourt && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-white mb-4">Editar {editingCourt.name}</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">Nombre</label>
                                    <input type="text" value={editingCourt.name} onChange={e => setEditingCourt({...editingCourt, name: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white"/>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">Tipo</label>
                                    <select value={editingCourt.type} onChange={e => setEditingCourt({...editingCourt, type: e.target.value as any})} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white">
                                        <option value="Indoor">Indoor</option>
                                        <option value="Outdoor">Outdoor</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 block mb-1">Precio Base</label>
                                <input type="number" value={editingCourt.basePrice} onChange={e => setEditingCourt({...editingCourt, basePrice: parseFloat(e.target.value)})} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white font-mono font-bold"/>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button onClick={() => setEditingCourt(null)} className="flex-1 bg-slate-800 text-white font-bold py-3 rounded-xl">Cancelar</button>
                                <button onClick={() => handleUpdateCourt(editingCourt)} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl">Guardar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Users */}
            {userForm.id && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
                        <button onClick={() => setUserForm({ ...userForm, id: '' })} className="absolute right-4 top-4 text-slate-400 hover:text-white"><X size={20}/></button>
                        <h3 className="text-xl font-bold text-white mb-6">{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
                        <form onSubmit={handleSaveUser} className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-400 block mb-1">Nombre Completo</label>
                                <input required type="text" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white"/>
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 block mb-1">Usuario</label>
                                <input required type="text" value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white"/>
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 block mb-1">Contraseña</label>
                                <input required type="text" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white"/>
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 block mb-1">Rol</label>
                                <select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value as any})} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white">
                                    <option value="OPERATOR">Operador</option>
                                    <option value="ADMIN">Administrador</option>
                                </select>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setUserForm({ ...userForm, id: '' })} className="flex-1 bg-slate-800 text-slate-300 font-bold py-3 rounded-xl hover:bg-slate-700">Cancelar</button>
                                <button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-500 shadow-lg shadow-blue-500/20">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- MAIN APP COMPONENT ---
const App = () => {
  // State
  const [user, setUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [showLogin, setShowLogin] = useState(false); // New state to toggle login
  
  // Data State (inicializado vacio para esperar a firebase)
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [config, setConfig] = useState<ClubConfig>(INITIAL_CONFIG);
  const [users, setUsers] = useState<User[]>([]);
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);

  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Toast
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const playNotificationSound = () => {
    try {
        const audio = new Audio(NOTIFICATION_SOUND);
        audio.volume = 0.5;
        // Importante: El navegador puede bloquear esto si no hubo interacción previa
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log("Audio autoplay prevented. User interaction needed.", error);
            });
        }
    } catch (error) {
        console.error("Error playing sound", error);
    }
  };

  const handleNewBookingIncoming = (newBooking: Booking) => {
      // Esta función se ejecuta cuando la BD detecta una nueva reserva
      playNotificationSound();
      showToast(`Nueva Reserva: ${newBooking.customerName}`);
  };

  // --- FIREBASE SUSCRIPTIONS ---
  useEffect(() => {
    seedDatabase();
    // Pasamos el callback de sonido al suscriptor
    const unsubBookings = subscribeBookings(setBookings, handleNewBookingIncoming);
    const unsubCourts = subscribeCourts(setCourts);
    const unsubProducts = subscribeProducts(setProducts);
    const unsubConfig = subscribeConfig(setConfig);
    const unsubUsers = subscribeUsers(setUsers);
    const unsubActivity = subscribeActivity(setActivities);

    return () => {
        unsubBookings();
        unsubCourts();
        unsubProducts();
        unsubConfig();
        unsubUsers();
        unsubActivity();
    };
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const foundUser = users.find(u => u.username === username && u.password === password);
    if (foundUser) {
        setUser(foundUser);
        setLoginError('');
        handleLogActivity('SYSTEM', `Inicio de sesión: ${foundUser.username}`);
        // Reproducir sonido para "desbloquear" el audio del navegador
        playNotificationSound();
    } else {
        setLoginError('Credenciales incorrectas');
    }
  };

  const handleLogout = () => {
      handleLogActivity('SYSTEM', `Cierre de sesión: ${user?.username}`);
      setUser(null);
      setUsername('');
      setPassword('');
      setActiveView('dashboard');
      setShowLogin(false); // Reset to public view
  };

  const handleLogActivity = (type: ActivityType, description: string, amount?: number) => {
      const newLog: ActivityLogEntry = {
          id: Date.now().toString(),
          type,
          description,
          timestamp: new Date().toISOString(),
          user: user?.username || 'Sistema',
          amount
      };
      // Guardar en Firebase
      logActivityService(newLog);
      // Ya NO reproducimos sonido aquí para evitar dobles sonidos con el listener
      if (type !== 'SYSTEM') showToast(description);
  };

  // Handlers para la UI (Llaman a Firestore)
  const handleUpdateStatus = (id: string, s: BookingStatus) => { updateBookingStatus(id, s); handleLogActivity('BOOKING', `Estado actualizado: ${s}`); };
  const handleToggleRecurring = (id: string) => { const b = bookings.find(b => b.id === id); if (b) toggleBookingRecurring(id, b.isRecurring); };
  const handleUpdateBooking = (b: Booking) => { updateBooking(b); handleLogActivity('BOOKING', `Reserva modificada: ${b.customerName}`); };
  const handleAddBooking = (b: Booking) => { addBooking(b); handleLogActivity('BOOKING', `Reserva manual: ${b.customerName}`, b.price); };
  const handleProcessSale = (items: CartItem[], total: number, method: PaymentMethod) => { 
      items.forEach(i => { 
          const p = products.find(prod => prod.id === i.id); 
          if (p) updateStock(p.id, p.stock - i.quantity); 
      }); 
      handleLogActivity('SALE', `Venta POS (${items.length} items) - ${method}`, total); 
  };
  const handleAddProduct = (p: Product) => { addProduct(p); handleLogActivity('STOCK', `Producto agregado: ${p.name}`); };
  const handleUpdateProduct = (p: Product) => { updateProduct(p); handleLogActivity('STOCK', `Producto actualizado: ${p.name}`); };
  const handleDeleteProduct = (id: string) => { deleteProduct(id); handleLogActivity('STOCK', `Producto eliminado`); };
  const handleUpdateConfig = (c: ClubConfig) => updateConfig(c);
  const handleUpdateCourts = (c: Court[]) => updateCourtsList(c);
  const handleUpdateUsers = (u: User[]) => updateUserList(u);

  // If NOT authenticated
  if (!user) {
    const theme = COLOR_THEMES[config.courtColorTheme];
    
    // Check if we should show Login form or Public View (Default)
    if (showLogin) {
        return (
            <div className={`min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-50`}></div>
                <div className="bg-slate-900 border border-white/10 p-8 rounded-2xl w-full max-w-md shadow-2xl relative z-10 backdrop-blur-xl animate-in fade-in zoom-in-95">
                    <button 
                        onClick={() => setShowLogin(false)} 
                        className="absolute top-4 left-4 text-slate-400 hover:text-white flex items-center gap-1 text-xs font-bold"
                    >
                        <ArrowLeft size={16}/> Volver al sitio
                    </button>

                    <div className="text-center mb-8 mt-4">
                        <div className={`w-16 h-16 ${theme.primary} rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20`}>
                            {config.logoUrl ? <img src={config.logoUrl} className="w-full h-full object-cover rounded-2xl"/> : <LayoutGrid className="text-white h-8 w-8" />}
                        </div>
                        <h1 className="text-2xl font-bold text-white">{config.name}</h1>
                        <p className="text-slate-400">Acceso Administrativo</p>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Usuario</label>
                            <input 
                                type="text" 
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="Ingrese su usuario"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Contraseña</label>
                            <input 
                                type="password" 
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="Ingrese su contraseña"
                            />
                        </div>
                        {loginError && <p className="text-red-400 text-sm text-center">{loginError}</p>}
                        <button type="submit" className={`w-full ${theme.primary} text-white font-bold py-3 rounded-xl shadow-lg hover:opacity-90 transition-all active:scale-95`}>
                            Ingresar
                        </button>
                    </form>
                    <div className="mt-6 text-center">
                    <p className="text-xs text-slate-600">Usuarios por defecto creados al inicio.</p>
                    </div>
                </div>
            </div>
        );
    }

    // Default: Public View
    return (
        <div className="relative h-screen w-full">
            <PublicBookingView 
                config={config} 
                courts={courts} 
                bookings={bookings} 
                onAddBooking={handleAddBooking} 
            />
            {/* Hidden/Subtle Admin Login Trigger */}
            <button 
                onClick={() => setShowLogin(true)}
                className="absolute top-4 right-4 z-50 p-2 text-white/10 hover:text-white/50 transition-colors rounded-full"
                title="Acceso Admin"
            >
                <Lock size={16}/>
            </button>
        </div>
    );
  }

  return (
    <>
        <NotificationToast message={toast} onClose={() => setToast(null)} />
        <Layout 
            activeView={activeView} 
            onChangeView={setActiveView} 
            config={config} 
            role={user.role} 
            onLogout={handleLogout}
        >
            {activeView === 'dashboard' && <Dashboard bookings={bookings} products={products} config={config} />}
            {activeView === 'bookings' && (
                <BookingModule 
                    bookings={bookings} 
                    courts={courts} 
                    config={config}
                    onUpdateStatus={handleUpdateStatus}
                    onToggleRecurring={handleToggleRecurring}
                    onUpdateBooking={handleUpdateBooking}
                    onAddBooking={handleAddBooking}
                />
            )}
            {activeView === 'pos' && (
                <POSModule 
                    products={products} 
                    config={config} 
                    onProcessSale={handleProcessSale}
                />
            )}
            {activeView === 'inventory' && (
                <InventoryModule 
                    products={products}
                    config={config}
                    onAddProduct={handleAddProduct}
                    onUpdateProduct={handleUpdateProduct}
                    onDeleteProduct={handleDeleteProduct}
                />
            )}
            {activeView === 'activity' && <ActivityModule activities={activities} config={config} />}
            {activeView === 'cashbox' && <CashboxView config={config} role={user.role} onLogActivity={handleLogActivity} />}
            {activeView === 'settings' && (
                <SettingsView 
                    config={config} 
                    courts={courts} 
                    users={users}
                    onUpdateConfig={handleUpdateConfig} 
                    onUpdateCourts={handleUpdateCourts}
                    onUpdateUsers={handleUpdateUsers}
                />
            )}
            {activeView === 'public' && (
                 <PublicBookingView 
                    config={config} 
                    courts={courts} 
                    bookings={bookings} 
                    onAddBooking={handleAddBooking} 
                 />
            )}
        </Layout>
    </>
  );
};

export default App;
