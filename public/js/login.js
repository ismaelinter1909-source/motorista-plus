
  /*  ✅ Firebase v11 — Projeto CORRETO: motorista-plus-c53f4  */
  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
  import { 
    getAuth, 
    signInWithEmailAndPassword,
    sendPasswordResetEmail
  } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

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


  /* ✅ LOGIN */
  btnLogin.addEventListener("click", async ()=>{

    const emailValor = email.value.trim();
    const senhaValor = senha.value.trim();

    if(!emailValor || !senhaValor){
      alert("Preencha todos os campos.");
      return;
    }

    try{
      await signInWithEmailAndPassword(auth, emailValor, senhaValor);
      window.location.href = "painel.html";

    }catch(e){
      switch(e.code){
        case "auth/user-not-found":
          alert("Usuário não cadastrado. Crie uma conta.");
          break;

        case "auth/wrong-password":
          alert("Senha incorreta.");
          break;

        case "auth/invalid-email":
          alert("Digite um email válido.");
          break;

        case "auth/too-many-requests":
          alert("Muitas tentativas. Aguarde alguns minutos.");
          break;

        default:
          alert("Erro ao entrar: " + e.message);
      }
    }
  });


  /* ✅ RECUPERAR SENHA */
  resetSenha.addEventListener("click", async ()=>{

    const emailValor = email.value.trim();

    if(!emailValor){
      alert("Digite seu email para recuperar a senha.");
      return;
    }

    try{
      await sendPasswordResetEmail(auth, emailValor);
      alert("Enviamos um link de recuperação ao seu email.");

    }catch(e){
      alert("Erro: " + e.message);
    }
  });

