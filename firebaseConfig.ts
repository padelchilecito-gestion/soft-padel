import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// ------------------------------------------------------------------
// IMPORTANTE: REEMPLAZA ESTOS VALORES CON LOS DE TU PROYECTO FIREBASE
// ------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "TU_API_KEY_AQUI",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

if (firebaseConfig.apiKey === "TU_API_KEY_AQUI") {
  console.error("⚠️ FIREBASE NO CONFIGURADO: Debes actualizar el archivo firebaseConfig.ts con tus credenciales. La app puede fallar al intentar conectar.");
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);