import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Usamos import.meta.env para acceder a las variables en Vite
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Validación simple para avisar si falta configuración
if (!firebaseConfig.apiKey) {
  console.error("⚠️ FIREBASE NO CONFIGURADO: Faltan las variables de entorno.");
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
