
  /* ✅ Firebase v11 — PROJETO motoristaa-plus-c53f4 */
  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
  import {
    getAuth,
    createUserWithEmailAndPassword
  } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
  import {
    getFirestore,
    doc,
    setDoc
  } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

  const firebaseConfig = {
    apiKey: "AIzaSyCnlpnTTJvJPZxuZdmpKQWbbHtvH72nMUU",
    authDomain: "motorista-plus-c53f4.firebaseapp.com",
    projectId: "motorista-plus-c53f4",
    storageBucket: "motorista-plus-c53f4.appspot.com",
    messagingSenderId: "766097061342",
    appId: "1:766097061342:web:36d999bec6d9fe8c46994f"
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  document.getElementById("btnCadastrar").addEventListener("click", async ()=>{

    const nomeValor = nome.value.trim();
    const telefoneValor = telefone.value.trim();
    const emailValor = email.value.trim();
    const senhaValor = senha.value.trim();
    const cavaloValor = placaCavalo.value.trim();
    const reboqueValor = placaReboque.value.trim();

    if(!nomeValor || !telefoneValor || !emailValor || !senhaValor){
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    try{
      const cred = await createUserWithEmailAndPassword(auth, emailValor, senhaValor);

      // ✅ Salvar os dados no Firestore
      await setDoc(doc(db, "usuarios", cred.user.uid), {
        nome: nomeValor,
        telefone: telefoneValor,
        email: emailValor,
        placaCavalo: cavaloValor || "",
        placaReboque: reboqueValor || "",
        foto: "" // reservado para upload no painel
      });

      alert("Cadastro realizado com sucesso!");
      window.location.href = "login.html";

    }catch(e){
      switch(e.code){
        case "auth/email-already-in-use":
          alert("Email já está em uso.");
          break;

        case "auth/invalid-email":
          alert("Email inválido.");
          break;

        case "auth/weak-password":
          alert("A senha deve ter pelo menos 6 caracteres.");
          break;

        default:
          alert("Erro ao cadastrar: " + e.message);
      }
    }

  });

