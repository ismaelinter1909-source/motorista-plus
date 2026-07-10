
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

/* CONFIG DO SEU PROJETO */
const app = initializeApp({
  apiKey:"AIzaSyCnlpnTTJvJPZxuZdmpKQWbbHtvH72nMUU",
  authDomain:"motorista-plus-c53f4.firebaseapp.com",
  projectId:"motorista-plus-c53f4"
});

const auth = getAuth(app);
const db = getFirestore(app);

document.getElementById("entrar").onclick = async () =>{
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;
  const msg = document.getElementById("msg");
  msg.textContent = "Validando...";

  try{
    const cred = await signInWithEmailAndPassword(auth,email,senha);
    const uid = cred.user.uid;

    // Verifica se o gestor existe na coleção admins
    const adminDoc = await getDoc(doc(db,"admins",uid));
    if(!adminDoc.exists()){
      msg.textContent = "Usuário não autorizado!";
      return;
    }

    msg.textContent = "Acesso liberado ✓";
    setTimeout(()=>{
      window.location.href = "admin.html";
    },500);

  }catch(e){
    msg.textContent = "Email ou senha inválidos";
  }
};
