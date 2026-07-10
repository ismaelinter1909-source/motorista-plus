// Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

import { getStorage } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

// Configuração do projeto
 const firebaseConfig = {
      apiKey: "AIzaSyCnlpnTTJvJPZxuZdmpKQWbbHtvH72nMUU",
      authDomain: "motorista-plus-c53f4.firebaseapp.com",
      projectId: "motorista-plus-c53f4",
      storageBucket: "motorista-plus-c53f4.appspot.com",
      messagingSenderId: "766097061342",
      appId: "1:766097061342:web:36d999bec6d9fe8c46994f"
    };

// Inicializa apenas uma vez
const app = initializeApp(firebaseConfig);

// Exporta para o restante do projeto
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;