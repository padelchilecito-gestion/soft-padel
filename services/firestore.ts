import { db } from '../firebaseConfig';
import { collection, doc, setDoc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, getDocs } from 'firebase/firestore';
import { Booking, Product, Court, User, ActivityLogEntry, ClubConfig, BookingStatus } from '../types';
import { MOCK_USERS, MOCK_COURTS, INITIAL_CONFIG } from '../constants';

// --- COLLECTIONS ---
const BOOKINGS_COL = 'bookings';
const PRODUCTS_COL = 'products';
const COURTS_COL = 'courts';
const USERS_COL = 'users';
const ACTIVITY_COL = 'activity_logs';
const CONFIG_COL = 'club_config';
const CONFIG_DOC_ID = 'main_config';

// --- HELPERS DE SANITIZACIÓN ---
const sanitize = (data: any): any => {
    if (!data || typeof data !== 'object') return data;
    if (data instanceof Date) return data.toISOString();
    const cleanData = Array.isArray(data) ? [...data] : { ...data };
    Object.keys(cleanData).forEach(key => {
        if (cleanData[key] === undefined) cleanData[key] = null;
        else if (typeof cleanData[key] === 'object' && cleanData[key] !== null) cleanData[key] = sanitize(cleanData[key]);
    });
    return cleanData;
};

const serializeConfig = (config: ClubConfig) => {
    const safeConfig: any = sanitize(config);
    if (safeConfig.schedule && Array.isArray(safeConfig.schedule)) {
        const scheduleMap: any = {};
        safeConfig.schedule.forEach((dayHours: boolean[], index: number) => {
            scheduleMap[`day${index}`] = dayHours;
        });
        safeConfig.schedule = scheduleMap;
    }
    return safeConfig;
};

const deserializeConfig = (data: any): ClubConfig => {
    const config = { ...data } as ClubConfig;
    if (config.schedule && !Array.isArray(config.schedule)) {
        const scheduleArray: boolean[][] = [];
        const scheduleObj = config.schedule as any;
        for (let i = 0; i < 7; i++) {
            scheduleArray.push(scheduleObj[`day${i}`] || []);
        }
        config.schedule = scheduleArray;
    }
    return config;
};

// --- BOOKINGS (MODIFICADO PARA DETECTAR NUEVAS) ---
export const subscribeBookings = (
    callback: (data: Booking[]) => void, 
    onNewBooking?: (booking: Booking) => void
) => {
    const q = query(collection(db, BOOKINGS_COL));
    let isFirstLoad = true;

    return onSnapshot(q, (snapshot) => {
        const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
        callback(bookings);

        // Detectar cambios (nuevas reservas) después de la carga inicial
        if (!isFirstLoad && onNewBooking) {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    onNewBooking({ id: change.doc.id, ...change.doc.data() } as Booking);
                }
            });
        }
        isFirstLoad = false;
    });
};

export const addBooking = async (booking: Booking) => {
    const data = sanitize(booking);
    if (booking.id && !booking.id.startsWith('temp') && !booking.id.startsWith('web')) {
        await setDoc(doc(db, BOOKINGS_COL, booking.id), data);
    } else {
        const { id, ...rest } = data;
        await addDoc(collection(db, BOOKINGS_COL), rest);
    }
};

export const updateBooking = async (b: Booking) => updateDoc(doc(db, BOOKINGS_COL, b.id), sanitize(b));
export const updateBookingStatus = async (id: string, status: BookingStatus) => updateDoc(doc(db, BOOKINGS_COL, id), { status });
export const toggleBookingRecurring = async (id: string, v: boolean) => updateDoc(doc(db, BOOKINGS_COL, id), { isRecurring: !v });

// --- OTROS SERVICIOS (Sin cambios mayores) ---
export const subscribeProducts = (cb: (d: Product[]) => void) => onSnapshot(query(collection(db, PRODUCTS_COL), orderBy('name')), (s) => cb(s.docs.map(d => ({ id: d.id, ...d.data() } as Product))));
export const addProduct = async (p: Product) => { const { id, ...r } = sanitize(p); await addDoc(collection(db, PRODUCTS_COL), r); };
export const updateProduct = async (p: Product) => updateDoc(doc(db, PRODUCTS_COL, p.id), sanitize(p));
export const deleteProduct = async (id: string) => deleteDoc(doc(db, PRODUCTS_COL, id));
export const updateStock = async (id: string, n: number) => updateDoc(doc(db, PRODUCTS_COL, id), { stock: n });

export const subscribeCourts = (cb: (d: Court[]) => void) => onSnapshot(query(collection(db, COURTS_COL), orderBy('name')), (s) => cb(s.docs.map(d => ({ id: d.id, ...d.data() } as Court))));
export const updateCourtsList = async (courts: Court[]) => { for (const c of courts) await setDoc(doc(db, COURTS_COL, c.id), sanitize(c)); };

export const subscribeUsers = (cb: (d: User[]) => void) => onSnapshot(collection(db, USERS_COL), (s) => cb(s.docs.map(d => ({ id: d.id, ...d.data() } as User))));
export const updateUserList = async (users: User[]) => { for (const u of users) await setDoc(doc(db, USERS_COL, u.id), sanitize(u)); };
export const deleteUser = async (id: string) => deleteDoc(doc(db, USERS_COL, id));

export const subscribeConfig = (callback: (data: ClubConfig) => void) => {
    return onSnapshot(doc(db, CONFIG_COL, CONFIG_DOC_ID), (docSnap) => {
        if (docSnap.exists()) {
            callback(deserializeConfig(docSnap.data()));
        } else {
            const initial = serializeConfig(INITIAL_CONFIG);
            setDoc(doc(db, CONFIG_COL, CONFIG_DOC_ID), initial);
            callback(INITIAL_CONFIG);
        }
    });
};

export const updateConfig = async (config: ClubConfig) => setDoc(doc(db, CONFIG_COL, CONFIG_DOC_ID), serializeConfig(config));

export const subscribeActivity = (cb: (d: ActivityLogEntry[]) => void) => onSnapshot(query(collection(db, ACTIVITY_COL), orderBy('timestamp', 'desc')), (s) => cb(s.docs.map(d => ({ id: d.id, ...d.data() } as ActivityLogEntry))));
export const logActivity = async (entry: ActivityLogEntry) => { const { id, ...r } = sanitize(entry); await addDoc(collection(db, ACTIVITY_COL), r); };

export const seedDatabase = async () => {
    try {
        const uSnap = await getDocs(collection(db, USERS_COL));
        if (uSnap.empty) for (const u of MOCK_USERS) await setDoc(doc(db, USERS_COL, u.id), sanitize(u));
        const cSnap = await getDocs(collection(db, COURTS_COL));
        if (cSnap.empty) for (const c of MOCK_COURTS) await setDoc(doc(db, COURTS_COL, c.id), sanitize(c));
    } catch (e) { console.error("Error seeding", e); }
};
