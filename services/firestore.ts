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

// --- HELPER PARA EVITAR ERROR "UNDEFINED" ---
const sanitize = (data: any) => {
    const cleanData = { ...data };
    Object.keys(cleanData).forEach(key => {
        if (cleanData[key] === undefined) cleanData[key] = null;
    });
    return cleanData;
};

// --- BOOKINGS ---
export const subscribeBookings = (callback: (data: Booking[]) => void) => {
    const q = query(collection(db, BOOKINGS_COL));
    return onSnapshot(q, (snapshot) => {
        const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
        callback(bookings);
    });
};

export const addBooking = async (booking: Booking) => {
    const dataToSave = sanitize(booking);
    if (booking.id && !booking.id.startsWith('temp')) {
        await setDoc(doc(db, BOOKINGS_COL, booking.id), dataToSave);
    } else {
        const { id, ...rest } = dataToSave;
        await addDoc(collection(db, BOOKINGS_COL), rest);
    }
};

export const updateBooking = async (booking: Booking) => {
    const ref = doc(db, BOOKINGS_COL, booking.id);
    await updateDoc(ref, sanitize(booking));
};

export const updateBookingStatus = async (id: string, status: BookingStatus) => {
    const ref = doc(db, BOOKINGS_COL, id);
    await updateDoc(ref, { status });
};

export const toggleBookingRecurring = async (id: string, currentVal: boolean) => {
    const ref = doc(db, BOOKINGS_COL, id);
    await updateDoc(ref, { isRecurring: !currentVal });
};

// --- PRODUCTS ---
export const subscribeProducts = (callback: (data: Product[]) => void) => {
    const q = query(collection(db, PRODUCTS_COL), orderBy('name'));
    return onSnapshot(q, (snapshot) => {
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        callback(products);
    });
};

export const addProduct = async (product: Product) => {
    const { id, ...rest } = sanitize(product);
    await addDoc(collection(db, PRODUCTS_COL), rest);
};

export const updateProduct = async (product: Product) => {
    const ref = doc(db, PRODUCTS_COL, product.id);
    await updateDoc(ref, sanitize(product));
};

export const deleteProduct = async (id: string) => {
    await deleteDoc(doc(db, PRODUCTS_COL, id));
};

export const updateStock = async (id: string, newStock: number) => {
    const ref = doc(db, PRODUCTS_COL, id);
    await updateDoc(ref, { stock: newStock });
};

// --- COURTS ---
export const subscribeCourts = (callback: (data: Court[]) => void) => {
    const q = query(collection(db, COURTS_COL), orderBy('name'));
    return onSnapshot(q, (snapshot) => {
        const courts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Court));
        callback(courts);
    });
};

export const updateCourtsList = async (courts: Court[]) => {
    for (const c of courts) {
        const ref = doc(db, COURTS_COL, c.id);
        await setDoc(ref, sanitize(c));
    }
};

// --- USERS ---
export const subscribeUsers = (callback: (data: User[]) => void) => {
    return onSnapshot(collection(db, USERS_COL), (snapshot) => {
        const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        callback(users);
    });
};

export const updateUserList = async (users: User[]) => {
    for (const u of users) {
        const ref = doc(db, USERS_COL, u.id);
        await setDoc(ref, sanitize(u));
    }
};

export const deleteUser = async (id: string) => {
    await deleteDoc(doc(db, USERS_COL, id));
};

// --- CONFIG ---
export const subscribeConfig = (callback: (data: ClubConfig) => void) => {
    return onSnapshot(doc(db, CONFIG_COL, CONFIG_DOC_ID), (docSnap) => {
        if (docSnap.exists()) {
            callback(docSnap.data() as ClubConfig);
        } else {
            // Seeding inicial sanitizado
            setDoc(doc(db, CONFIG_COL, CONFIG_DOC_ID), sanitize(INITIAL_CONFIG));
            callback(INITIAL_CONFIG);
        }
    });
};

export const updateConfig = async (config: ClubConfig) => {
    await setDoc(doc(db, CONFIG_COL, CONFIG_DOC_ID), sanitize(config));
};

// --- ACTIVITY ---
export const subscribeActivity = (callback: (data: ActivityLogEntry[]) => void) => {
    const q = query(collection(db, ACTIVITY_COL), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLogEntry));
        callback(logs);
    });
};

export const logActivity = async (entry: ActivityLogEntry) => {
    const { id, ...rest } = sanitize(entry);
    await addDoc(collection(db, ACTIVITY_COL), rest);
};

// --- SEED HELPER ---
export const seedDatabase = async () => {
    const usersSnap = await getDocs(collection(db, USERS_COL));
    if (usersSnap.empty) {
        console.log("Seeding Users...");
        for (const u of MOCK_USERS) await setDoc(doc(db, USERS_COL, u.id), sanitize(u));
    }

    const courtsSnap = await getDocs(collection(db, COURTS_COL));
    if (courtsSnap.empty) {
        console.log("Seeding Courts...");
        for (const c of MOCK_COURTS) await setDoc(doc(db, COURTS_COL, c.id), sanitize(c));
    }
};
