
    import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
    import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
    import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
    import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

    /* ✅ motorista-plus-c53f4 */
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
    const storage = getStorage(app);

    const menu = document.getElementById("menuLateral");
    const abrirMenuBtn = document.getElementById("abrirMenu");
    const avatarCircle = document.getElementById("avatarCircle");
    const userFoto = document.getElementById("userFoto");
    const inputFoto = document.getElementById("inputFoto");
    const avatarCircleMenu = document.getElementById("avatarCircleMenu");
    const userFotoMenu = document.getElementById("userFotoMenu");

    abrirMenuBtn.onclick = () => menu.classList.toggle("active");

    onAuthStateChanged(auth, async (user) => {
      if (!user) { window.location.href = "login.html"; return; }

      

      const refUser = doc(db, "usuarios", user.uid);
      const snap = await getDoc(refUser);

      if (!snap.exists()) { alert("Erro ao carregar perfil."); return; }
      const u = snap.data();
      const partes = (u.nome || "Motorista").trim().split(" ");

      const iniciais =
      (partes[0]?.[0] || "") +
      (partes[1]?.[0] || "");
        // ===== MENU =====

document.getElementById("menuNome").textContent =
u.nome || "Motorista";

document.getElementById("menuEmail").textContent =
u.email || "";

if(u.fotoUrl){

    document.getElementById("userFotoMenu").src =
    u.fotoUrl;

    document.getElementById("userFotoMenu").style.display =
    "block";

    document.getElementById("avatarCircleMenu").style.display =
    "none";

}else{

    const partes = (u.nome || "Motorista").split(" ");

    const iniciais =
        (partes[0][0] || "") +
        (partes[1]?.[0] || "");

    document.getElementById("avatarCircleMenu").textContent =
        iniciais.toUpperCase();

}

      // Texto de boas-vindas e informações
      boasVindas.textContent = "Bem-vindo(a), " + (u.nome || "");
      userNome.textContent = "Nome: " + (u.nome || "—");
      userTelefone.textContent = "Telefone: " + (u.telefone || "—");
      userPlacaCavalo.textContent = "Placa Cavalo: " + (u.placaCavalo || "—");
      userPlacaReboque.textContent = "Placa Reboque: " + (u.placaReboque || "—");
      userEmail.textContent = "Email: " + (u.email || "—");

      // Preencher campos de edição
      editarNome.value = u.nome || "";
      editarTelefone.value = u.telefone || "";
      editarPlacaCavalo.value = u.placaCavalo || "";
      editarPlacaReboque.value = u.placaReboque || "";
      editarEmail.value = u.email || "";

      // FOTO DE PERFIL
     if (u.fotoUrl) {

    userFoto.src = u.fotoUrl;
    userFoto.style.display = "block";
    avatarCircle.style.display = "none";

    userFotoMenu.src = u.fotoUrl;
    userFotoMenu.style.display = "block";
    avatarCircleMenu.style.display = "none";

} else {

    avatarCircle.textContent = iniciais.toUpperCase();
    avatarCircle.style.display = "flex";
    userFoto.style.display = "none";

    avatarCircleMenu.textContent = iniciais.toUpperCase();
    avatarCircleMenu.style.display = "flex";
    userFotoMenu.style.display = "none";

}
      

      // Card principal
      avatarCircle.textContent = iniciais.toUpperCase() || "MP";
      avatarCircle.style.display = "flex";
      userFoto.style.display = "none";

      // Menu lateral
      avatarCircleMenu.textContent = iniciais.toUpperCase() || "MP";
      avatarCircleMenu.style.display = "flex";
      userFotoMenu.style.display = "none";

      // Clique na foto ou no círculo abre o seletor de arquivo
     const abrirUpload = () => inputFoto.click();

        // Card principal
        avatarCircle.onclick = abrirUpload;
        userFoto.onclick = abrirUpload;

        // Menu lateral

      avatarCircleMenu.onclick = abrirUpload;
      userFotoMenu.onclick = abrirUpload;
     
      // Upload da nova foto
      inputFoto.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
          const caminho = `usuarios/${user.uid}/perfil/foto_${Date.now()}`;
          const fotoRef = storageRef(storage, caminho);

          // Envia arquivo pro Storage
          await uploadBytes(fotoRef, file);

          // Pega URL pública
          const url = await getDownloadURL(fotoRef);

          // Salva URL no Firestore
          await updateDoc(refUser, { fotoUrl: url });

          // Card principal
          userFoto.src = url;
          userFoto.style.display = "block";
          avatarCircle.style.display = "none";

          // Menu lateral
          userFotoMenu.src = url;
          userFotoMenu.style.display = "block";
          avatarCircleMenu.style.display = "none";

          alert("Foto atualizada com sucesso!");
        } catch (err) {
          console.error("Erro ao enviar foto:", err);
          alert("Erro ao enviar foto. Tente novamente.");
        } finally {
          inputFoto.value = ""; // limpa input
        }
      });

      // Salvar perfil (texto)
      salvarPerfil.onclick = async () => {
        await updateDoc(refUser, {
          nome: editarNome.value,
          telefone: editarTelefone.value,
          placaCavalo: editarPlacaCavalo.value,
          placaReboque: editarPlacaReboque.value,
          email: editarEmail.value
        });
        alert("Perfil atualizado!");
        location.reload();
      };
    });

    document.getElementById("logoutBtnMenu").onclick = async ()=>{

    await signOut(auth);

    location.href="login.html";

};
  