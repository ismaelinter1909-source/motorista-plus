import { db } from "./firebase.js";
import { verificarLogin } from "./auth.js";
import { iniciarMenu } from "./menu.js";
import {
    doc,
    getDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

export async function carregarPerfil(user){

    const refUser = doc(db,"usuarios",user.uid);

    const snap = await getDoc(refUser);

    if(!snap.exists()){

        alert("Usuário não encontrado.");
        return null;

    }

    const perfil = snap.data();
    

    const menuNome = document.getElementById("menuNome");

if(menuNome){

    menuNome.textContent = perfil.nome || "Motorista";

}

    const menuEmail = document.getElementById("menuEmail");

if(menuEmail){

    menuEmail.textContent = perfil.email || "";

}

    const boasVindas = document.getElementById("BoasVindas");

if(boasVindas){

    boasVindas.textContent =
        `Bem-vindo(a), ${perfil.nome}`;

}

    
    
    // Avatar


const avatarCircleMenu = document.getElementById("avatarCircleMenu");
const userFotoMenu = document.getElementById("userFotoMenu");

if (avatarCircleMenu && userFotoMenu) {

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

}

return perfil;
}
async function carregarPerfilCompleto(user){

    const ref = doc(db,"usuarios",user.uid);

    const snap = await getDoc(ref);

    if(!snap.exists()) return;

    const perfil = snap.data();
    const nome = document.getElementById("nome");

if (nome) {
    nome.value = perfil.nome || "";
}
    const email = document.getElementById("email");

if (email) {
    email.value = perfil.email || "";
}
    const cpf = document.getElementById("cpf");

if (cpf) {
    cpf.value = perfil.cpf || "";
}
    const telefone = document.getElementById("telefone");

if (telefone) {
    telefone.value = perfil.telefone || "";
}
    const dataNascimento = document.getElementById("dataNascimento");

if (dataNascimento) {
    dataNascimento.value = perfil.datanascimento || "";
}
    const cidade = document.getElementById("cidade");

if (cidade) {
    cidade.value = perfil.cidade || "";
}
    const estado = document.getElementById("estado");

if (estado) {
    estado.value = perfil.estado || "";
}

    const categoriaCNH = document.getElementById("categoriaCNH");

if (categoriaCNH) {
    categoriaCNH.value = perfil.categoriaCNH || "";
}

    const validadeCNH = document.getElementById("validadeCNH");

if (validadeCNH) {
    validadeCNH.value = perfil.validadeCNH || "";
}

    const empresa = document.getElementById("empresa");

if (empresa) {
    empresa.value = perfil.empresa || "";
}

    const campoTox = document.getElementById("toxicologico");

if(campoTox){

    campoTox.addEventListener("change", atualizarValidadeToxico);

}
    atualizarValidadeToxico();

}
async function salvarPerfilCompleto(user){

    try{

        await updateDoc(doc(db,"usuarios",user.uid),{

            telefone: document.getElementById("telefone").value,
            datanascimento: document.getElementById("dataNascimento").value,
            cidade: document.getElementById("cidade").value,
            estado: document.getElementById("estado").value,
            categoriaCNH: document.getElementById("categoriaCNH").value,
            validadeCNH: document.getElementById("validadeCNH").value,
            toxicologico: document.getElementById("toxicologico").value,
            mopp: document.getElementById("mopp").value,
            empresa: document.getElementById("empresa").value,
            trocaOleo: document.getElementById("trocaOleo").value

        });

        console.log("Atualizado com sucesso");

        alert("Perfil atualizado!");

    }catch(e){

        console.error(e);

        alert(e.message);

    }

}


function atualizarValidadeToxico(){

    const campo = document.getElementById("toxicologico");
    const validade = document.getElementById("validadeTox");

    if(!campo || !validade) return;

    if(!campo.value){

        validade.textContent = "-";
        return;

    }

    const data = new Date(campo.value);

    data.setMonth(data.getMonth() + 30);

    validade.textContent =
        data.toLocaleDateString("pt-BR");

}

verificarLogin(async (user) => {

    iniciarMenu();

    await carregarPerfil(user);

    await carregarPerfilCompleto(user);

    const btnSalvar = document.getElementById("btnSalvarPerfil");

if (btnSalvar) {

    btnSalvar.addEventListener("click", () => {
        salvarPerfilCompleto(user);
    });

}
});
