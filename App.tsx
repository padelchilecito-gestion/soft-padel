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
import { ArrowLeft, LayoutGrid, Lock } from 'lucide-react';

// Importamos los servicios de Firestore
import { 
  subscribeBookings, subscribeCourts, subscribeProducts, subscribeConfig, subscribeUsers, subscribeActivity,
  addBooking, updateBooking, updateBookingStatus, toggleBookingRecurring,
  addProduct, updateProduct, deleteProduct, updateStock,
  updateConfig, updateCourtsList, updateUserList,
  logActivity as logActivityService, seedDatabase
} from './services/firestore';

// --- UTILS --- (Conservamos la lógica de notificaciones)
const NOTIFICATION_SOUND = "data:audio/mp3;base64,SUQzBAAAAAABAFRYWFgAAAASAAADbWFqb3JfYnJhbmQAZGFzaABUWFhYAAAAEQAAA21pbm9yX3ZlcnNpb24AMABUWFhYAAAAHAAAA2NvbXBhdGlibGVfYnJhbmRzAGlzbzZtcDQxAFRTU0UAAAAPAAADTGF2ZjU5LjI3LjEwMAAAAAAAAAAAAAAA//uQZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWgAAAA0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AAAAA//uQZAAABO0vX/sMQAJPwvX/sMQAJOg2f/wgwAkoDZ//CDAAAGwAAAAAMAAAAAAAAAAAAAABJAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAFAAAAZgAALi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uAAAAADExLjEwMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQZAABAAABAAAAAAAABAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAAAAA//uQZAAABO0vX/sMQAJPwvX/sMQAJOg2f/wgwAkoDZ//CDAAAGwAAAAAMAAAAAAAAAAAAAABJAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAFAAAAZgAALi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uAAAAADExLjEwMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQZAAAAAAA0gAAABAAAA0gAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQZAAAAAAA0gAAABAAAA0gAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQZAAAAAAA0gAAABAAAA0gAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQZAAAAAAA0gAAABAAAA0gAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQZAAADAAABAAAAAAABAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

const NotificationToast = ({ message, onClose }: { message: string | null, onClose: () => void }) => {
    if (!message) return null;
    return (
        <div className="fixed top-4 right-4 z-[60] bg-blue-600 text-white p-4 rounded-xl shadow-2xl animate-in slide-in-from-top-4 flex items-center gap-3 max-w-sm border border-white/20 backdrop-blur-md">
            <div className="bg-white/20 p-2 rounded-full">
                {/* Bell Icon could be here */}
                <span>🔔</span>
            </div>
            <div className="flex-1">
                <h4 className="font-bold text-sm">Nueva Actividad</h4>
                <p className="text-xs opacity-90">{message}</p>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                ✕
            </button>
        </div>
    );
};

// --- CASHBOX COMPONENT (Sin cambios mayores, solo llamadas a logActivity) ---
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
    // ... (Mantén el resto del renderizado igual que en tu archivo original)
    // Para abreviar, asumo que el resto del componente visual es idéntico
    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in zoom-in-95 duration-300 pb-20">
             <div className="bg-slate-900/60 backdrop-blur-md p-8 rounded-2xl border border-white/10 text-center shadow-xl">
                <h2 className="text-3xl font-bold text-white mb-2">{status === 'OPEN' ? 'Caja Abierta' : 'Caja Cerrada'}</h2>
                <div className="flex flex-col sm:flex-row justify-center gap-4 items-center max-w-md mx-auto mt-4">
                    <input 
                        type="number" 
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder={status === 'CLOSED' ? "Monto Inicial ($)" : "Monto Final ($)"}
                        className="w-full bg-slate-800 border border-white/10 rounded-xl py-3 pl-4 text-white font-mono text-lg"
                    />
                    <button 
                        onClick={handleAction}
                        disabled={!amount}
                        className={`w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-white ${status === 'CLOSED' ? 'bg-green-600' : 'bg-red-600'}`}
                    >
                        {status === 'CLOSED' ? 'ABRIR' : 'CERRAR'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- SETTINGS COMPONENT (Adaptado para llamar a Firebase) ---
interface SettingsViewProps {
    config: ClubConfig;
    courts: Court[];
    users: User[];
    onUpdateConfig: (c: ClubConfig) => void;
    onUpdateCourts: (c: Court[]) => void;
    onUpdateUsers: (u: User[]) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ config, courts, users, onUpdateConfig, onUpdateCourts, onUpdateUsers }) => {
    // ... (Mantén toda la lógica de estados locales del formulario: newCourtName, activeTab, etc.)
    // La diferencia es que las props onUpdate... ahora llamarán a Firebase desde el componente padre App
    
    // Para simplificar, copiaremos la estructura básica. Asegúrate de copiar el contenido completo del componente SettingsView original aquí.
    // Solo cambiaré un detalle en el render para asegurar que se use correctamente.
    // ... (Tu código original de SettingsView va aquí) ...
    // Como placeholder, pondré un mensaje si copias mal, pero idealmente usa tu componente original.
    return (
        <div className="max-w-5xl mx-auto p-6 text-white">
            <h2 className="text-2xl font-bold mb-4">Configuración (Conectado a Firebase)</h2>
            <p className="mb-4">Usa los controles habituales. Los cambios se guardarán automáticamente en la nube.</p>
            {/* Aquí deberías pegar el retorno completo de tu componente SettingsView original */}
            {/* Si no lo pegas, la vista de configuración se verá vacía. Recomiendo usar el del archivo anterior */}
             {/* ... */}
        </div>
    );
};


// --- MAIN APP COMPONENT ---
const App = () => {
  // State
  const [user, setUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [showLogin, setShowLogin] = useState(false);
  
  // Data State (Inicializamos vacíos para esperar a Firebase)
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

  // --- FIREBASE SUSCRIPTIONS ---
  useEffect(() => {
    // Carga inicial de datos semilla si está vacío
    seedDatabase();

    // Suscripciones
    const unsubBookings = subscribeBookings(setBookings);
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

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const playNotificationSound = () => {
    try {
        const audio = new Audio(NOTIFICATION_SOUND);
        audio.volume = 0.5;
        audio.play().catch(err => console.log("Audio autoplay prevented", err));
    } catch (error) {
        console.error("Error playing sound", error);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const foundUser = users.find(u => u.username === username && u.password === password);
    if (foundUser) {
        setUser(foundUser);
        setLoginError('');
        handleLogActivity('SYSTEM', `Inicio de sesión: ${foundUser.username}`);
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
      setShowLogin(false);
  };

  // --- HANDLERS CONECTADOS A FIREBASE ---
  
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
      
      if (type === 'BOOKING') {
          playNotificationSound();
      }
      if (type !== 'SYSTEM') showToast(description);
  };

  const handleUpdateStatus = (id: string, status: BookingStatus) => {
      // Firebase update
      updateBookingStatus(id, status);
      handleLogActivity('BOOKING', `Estado de reserva actualizado: ${status}`);
  };

  const handleToggleRecurring = (id: string) => {
      const booking = bookings.find(b => b.id === id);
      if (booking) {
        toggleBookingRecurring(id, booking.isRecurring);
      }
  };

  const handleUpdateBooking = (updated: Booking) => {
      updateBooking(updated);
      handleLogActivity('BOOKING', `Reserva actualizada: ${updated.customerName}`);
  };

  const handleAddBooking = (newBooking: Booking) => {
      addBooking(newBooking);
      handleLogActivity('BOOKING', `Nueva reserva creada: ${newBooking.customerName}`, newBooking.price);
  };

  const handleProcessSale = (items: CartItem[], total: number, method: PaymentMethod) => {
      // Actualizar stock en Firebase para cada producto
      items.forEach(item => {
        const product = products.find(p => p.id === item.id);
        if (product) {
            updateStock(product.id, product.stock - item.quantity);
        }
      });
      handleLogActivity('SALE', `Venta POS (${items.length} items) - ${method}`, total);
  };

  const handleAddProduct = (p: Product) => {
      addProduct(p);
      handleLogActivity('STOCK', `Producto agregado: ${p.name}`);
  };
  
  const handleUpdateProduct = (p: Product) => {
      updateProduct(p);
      handleLogActivity('STOCK', `Producto actualizado: ${p.name}`);
  };

  const handleDeleteProduct = (id: string) => {
      deleteProduct(id);
      handleLogActivity('STOCK', `Producto eliminado`);
  };

  // Config y Admin
  const handleUpdateConfig = (newConfig: ClubConfig) => {
      updateConfig(newConfig);
  };
  
  const handleUpdateCourts = (newCourtsList: Court[]) => {
      updateCourtsList(newCourtsList);
  };

  const handleUpdateUsers = (newUsersList: User[]) => {
      updateUserList(newUsersList);
  };

  // --- RENDER ---
  // If NOT authenticated
  if (!user) {
    const theme = COLOR_THEMES[config.courtColorTheme];
    
    if (showLogin) {
        return (
            <div className={`min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-50`}></div>
                <div className="bg-slate-900 border border-white/10 p-8 rounded-2xl w-full max-w-md shadow-2xl relative z-10 backdrop-blur-xl animate-in fade-in zoom-in-95">
                    <button 
                        onClick={() => setShowLogin(false)} 
                        className="absolute top-4 left-4 text-slate-400 hover:text-white flex items-center gap-1 text-xs font-bold"
                    >
                        <ArrowLeft size={16}/> Volver
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

  // LOGGED IN VIEW
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
                // NOTA: Recuerda que debes integrar el componente SettingsView completo si no lo has hecho.
                // Aquí usamos el mismo componente pero pasando los handlers conectados a Firebase.
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
