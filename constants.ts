import { Booking, BookingStatus, ClubConfig, Court, Product, User, ActivityLogEntry } from './types';

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Administrador', username: 'admin', password: '123', role: 'ADMIN' },
  { id: 'u2', name: 'Operador Mañana', username: 'operador', password: '123', role: 'OPERATOR' },
];

export const MOCK_COURTS: Court[] = [
  { 
    id: 'c1', 
    name: 'Cancha Central (WPT)', 
    type: 'Indoor', 
    surfaceColor: 'blue', 
    status: 'AVAILABLE',
    basePrice: 20000,
    isOffer1Active: false,
    offer1Price: 15000,
    offer1Label: 'Promo Mañana',
    isOffer2Active: false,
    offer2Price: 18000,
    offer2Label: 'Socio',
  },
  { 
    id: 'c2', 
    name: 'Cancha 2', 
    type: 'Indoor', 
    surfaceColor: 'blue', 
    status: 'AVAILABLE',
    basePrice: 18000,
    isOffer1Active: false,
    offer1Price: 14000,
    offer1Label: 'Promo Mañana',
    isOffer2Active: false,
    offer2Price: 16000,
    offer2Label: 'Socio',
  },
  { 
    id: 'c3', 
    name: 'Cancha 3', 
    type: 'Outdoor', 
    surfaceColor: 'blue', 
    status: 'AVAILABLE',
    basePrice: 15000,
    isOffer1Active: false,
    offer1Price: 12000,
    offer1Label: 'Promo Mañana',
    isOffer2Active: false,
    offer2Price: 14000,
    offer2Label: 'Socio',
  },
];

export const MOCK_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Pelotas Bullpadel (Tubo x3)', category: 'Accesorios', price: 12000, stock: 50, minStockAlert: 10, imageUrl: 'https://picsum.photos/200/200?random=1' },
  { id: 'p2', name: 'Gatorade 500ml', category: 'Bebidas', price: 2500, stock: 24, minStockAlert: 12, imageUrl: 'https://picsum.photos/200/200?random=2' },
  { id: 'p3', name: 'Alquiler Paleta', category: 'Servicios', price: 3000, stock: 10, minStockAlert: 0, imageUrl: 'https://picsum.photos/200/200?random=3' },
  { id: 'p4', name: 'Agua Mineral', category: 'Bebidas', price: 1500, stock: 100, minStockAlert: 20, imageUrl: 'https://picsum.photos/200/200?random=4' },
];

export const MOCK_ACTIVITY: ActivityLogEntry[] = [
  { id: 'a1', type: 'SYSTEM', description: 'Inicio de sistema', timestamp: new Date(Date.now() - 10000000).toISOString(), user: 'Sistema' },
  { id: 'a2', type: 'SHIFT', description: 'Apertura de Caja', timestamp: new Date(Date.now() - 9000000).toISOString(), user: 'admin', amount: 5000 },
  { id: 'a3', type: 'BOOKING', description: 'Nueva Reserva: Juan Pérez (Cancha 1)', timestamp: new Date(Date.now() - 7200000).toISOString(), user: 'admin', amount: 20000 },
  { id: 'a4', type: 'SALE', description: 'Venta POS: 2x Gatorade', timestamp: new Date(Date.now() - 3600000).toISOString(), user: 'operador', amount: 5000 },
];

// Helper to create default schedule (Mon-Sun, 08:00 to 23:00 open)
const createDefaultSchedule = () => {
  const schedule: boolean[][] = [];
  for (let d = 0; d < 7; d++) {
    const dayHours: boolean[] = [];
    for (let h = 0; h < 24; h++) {
      // Open from 9 (09:00) to 23 (23:00)
      dayHours.push(h >= 9 && h <= 23);
    }
    schedule.push(dayHours);
  }
  return schedule;
};

export const INITIAL_CONFIG: ClubConfig = {
  name: 'World Padel Center',
  logoUrl: undefined,
  schedule: createDefaultSchedule(),
  slotDuration: 30,
  courtColorTheme: 'blue',
  ownerPhone: '5491100000000',
  bookingBackgroundImage: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=2670&auto=format&fit=crop',
  ads: [
    {
        id: 'ad1',
        imageUrl: 'https://images.unsplash.com/photo-1626245165977-2e635703b0c2?q=80&w=1000&auto=format&fit=crop',
        linkUrl: 'https://google.com',
        isActive: true
    }
  ],
  adRotationInterval: 5,
  promoActive: false,
  promoText: '¡Gaseosa de Regalo!',
  promoPrice: 20000,
  mpAlias: 'ALIAS.PADEL.MP' // <--- VALOR INICIAL
};

export const generateMockBookings = (): Booking[] => {
  const today = new Date().toISOString().split('T')[0];
  return [
    {
      id: 'b1',
      courtId: 'c1',
      date: today,
      time: '18:00',
      duration: 90,
      customerName: 'Juan Pérez',
      customerPhone: '1122334455',
      status: BookingStatus.CONFIRMED,
      price: 20000,
      isRecurring: false,
    },
    {
      id: 'b2',
      courtId: 'c2',
      date: today,
      time: '20:00',
      duration: 90,
      customerName: 'Torneo Local',
      customerPhone: '1199887766',
      status: BookingStatus.PENDING,
      price: 18000,
      isRecurring: true,
    },
  ];
};

export const COLOR_THEMES = {
  blue: {
    primary: 'bg-blue-600',
    secondary: 'bg-yellow-400',
    accent: 'text-blue-400',
    border: 'border-blue-500/30',
    gradient: 'from-slate-900 to-blue-900/40',
    courtFill: '#3b82f6',
    textOnPrimary: 'text-white',
  },
  green: {
    primary: 'bg-green-600',
    secondary: 'bg-yellow-400',
    accent: 'text-green-400',
    border: 'border-green-500/30',
    gradient: 'from-slate-900 to-green-900/40',
    courtFill: '#22c55e',
    textOnPrimary: 'text-white',
  },
  red: {
    primary: 'bg-red-600',
    secondary: 'bg-yellow-400',
    accent: 'text-red-400',
    border: 'border-red-500/30',
    gradient: 'from-slate-900 to-red-900/40',
    courtFill: '#ef4444',
    textOnPrimary: 'text-white',
  },
  yellow: {
    primary: 'bg-yellow-400',
    secondary: 'bg-black',
    accent: 'text-yellow-400',
    border: 'border-yellow-500/30',
    gradient: 'from-slate-900 to-yellow-900/40',
    courtFill: '#eab308',
    textOnPrimary: 'text-black',
  },
};
