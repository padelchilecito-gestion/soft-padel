import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";

// ------------------------------------------------------------------
// IMPORTANTE: REEMPLAZA ESTOS VALORES CON LOS DE TU PROYECTO FIREBASE
// ------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyB81_ulG1QtW18GKEmunnxsLKlD3lBx4wU",
  authDomain: "soft-padel-manager-517d0.firebaseapp.com",
  projectId: "soft-padel-manager-517d0",
  storageBucket: "soft-padel-manager-517d0.firebasestorage.app",
  messagingSenderId: "956376117698",
  appId: "1:956376117698:web:e5aea9b0b026345ff3e65b",
  measurementId: "G-NWMM1E918C"
};

if (firebaseConfig.apiKey === "AIzaSyB81_ulG1QtW18GKEmunnxsLKlD3lBx4wU") {
  console.error("⚠️ FIREBASE NO CONFIGURADO: Debes actualizar el archivo firebaseConfig.ts con tus credenciales. La app puede fallar al intentar conectar.");
}

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
