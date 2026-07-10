import { db } from "./firebase.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

export async function carregarPerfil(user){

    const refUser = doc(db,"usuarios",user.uid);

    const snap = await getDoc(refUser);

    if(!snap.exists()){

        alert("Usuário não encontrado.");
        return null;

    }

    const perfil = snap.data();
    

    document.getElementById("menuNome").textContent =
        perfil.nome || "Motorista";

    document.getElementById("menuEmail").textContent =
        perfil.email || "";

    const boasVindas = document.getElementById("BoasVindas");

    if(boasVindas){

        boasVindas.textContent =
            `Bem-vindo(a), ${perfil.nome}`;

    }


    
    
    // Avatar


const avatarCircleMenu = document.getElementById("avatarCircleMenu");
const userFotoMenu = document.getElementById("userFotoMenu");

const partes = (perfil.nome || "Motorista").trim().split(" ");

const iniciais =
    (partes[0]?.[0] || "") +
    (partes[1]?.[0] || "");

if (perfil.fotoUrl && perfil.fotoUrl.trim() !== "") {

    userFotoMenu.src = perfil.fotoUrl;
    userFotoMenu.style.display = "block";
    avatarCircleMenu.style.display = "none";

} else {

    avatarCircleMenu.textContent = iniciais.toUpperCase();
    avatarCircleMenu.style.display = "flex";
    userFotoMenu.style.display = "none";

}

return perfil;
}
