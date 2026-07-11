import { verificarLogin } from "./auth.js";
import { db, auth } from "./firebase.js";
import { iniciarMenu } from "./menu.js";

import {
    doc,
    getDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";


import {
    updatePassword,
    updateEmail,
    EmailAuthProvider,
    reauthenticateWithCredential
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";


    verificarLogin(async(user)=>{

    iniciarMenu();

    await carregarConfiguracoes(user);

    document
        .getElementById("btnSalvarConfiguracoes")
        .addEventListener("click",()=>{

            salvarConfiguracoes(user);

        });
        const modalSenha = document.getElementById("modalSenha");

document
.getElementById("btnAlterarSenha")
.onclick = ()=>{

    modalSenha.classList.add("active");

};

document
.getElementById("cancelarSenha")
.onclick = ()=>{

    modalSenha.classList.remove("active");

};
document
.getElementById("salvarSenha")
.onclick = async () => {

    const senhaAtual =
        document.getElementById("senhaAtual").value;

    const novaSenha =
        document.getElementById("novaSenha").value;

    const confirmarSenha =
        document.getElementById("confirmarSenha").value;

    if(!senhaAtual || !novaSenha || !confirmarSenha){

        alert("Preencha todos os campos.");

        return;

    }

    if(novaSenha.length < 6){

        alert("A nova senha deve possuir no mínimo 6 caracteres.");

        return;

    }

    if(novaSenha !== confirmarSenha){

        alert("As senhas não conferem.");

        return;

    }

    try{

        const credential = EmailAuthProvider.credential(
            auth.currentUser.email,
            senhaAtual
        );

        await reauthenticateWithCredential(
            auth.currentUser,
            credential
        );

        await updatePassword(
            auth.currentUser,
            novaSenha
        );

        alert("Senha alterada com sucesso!");

        document.getElementById("modalSenha")
            .classList.remove("active");

        document.getElementById("senhaAtual").value = "";
        document.getElementById("novaSenha").value = "";
        document.getElementById("confirmarSenha").value = "";

    }catch(err){

        alert("Senha atual incorreta.");

    }

};

const modalEmail = document.getElementById("modalEmail");

document
.getElementById("btnAlterarEmail")
.onclick = ()=>{

    modalEmail.classList.add("active");

};

document
.getElementById("cancelarEmail")
.onclick = ()=>{

    modalEmail.classList.remove("active");

};
document
.getElementById("salvarEmail")
.onclick = async ()=>{

    const novoEmail =
        document.getElementById("novoEmail").value.trim();

    const senha =
        document.getElementById("senhaEmail").value;

    if(!novoEmail || !senha){

        alert("Preencha todos os campos.");

        return;

    }

    try{

        const credential =
            EmailAuthProvider.credential(
                auth.currentUser.email,
                senha
            );

        await reauthenticateWithCredential(
            auth.currentUser,
            credential
        );

        await updateEmail(
            auth.currentUser,
            novoEmail
        );

        await updateDoc(
            doc(db,"usuarios",auth.currentUser.uid),
            {
                email: novoEmail
            }
        );

        alert("E-mail alterado com sucesso!");

        modalEmail.classList.remove("active");

        document.getElementById("novoEmail").value="";
        document.getElementById("senhaEmail").value="";

    }catch(err){

        alert(err.message);

    }

};

});

async function carregarConfiguracoes(user){

    const snap=await getDoc(
        doc(db,"usuarios",user.uid)
    );

    if(!snap.exists()) return;

    const u=snap.data();

    document.getElementById("alertaCNH").checked =
        u.alertaCNH ?? true;

    document.getElementById("alertaTox").checked =
        u.alertaTox ?? true;

    document.getElementById("alertaMopp").checked=
        u.alertaMopp ?? true;

    document.getElementById("alertaManutencao").checked=
        u.alertaManutencao ?? true;

    document.getElementById("temaEscuro").checked=
        u.temaEscuro ?? true;

}

async function salvarConfiguracoes(user){

    await updateDoc(
        doc(db,"usuarios",user.uid),
        {

            alertaCNH:
            document.getElementById("alertaCNH").checked,

            alertaTox:
            document.getElementById("alertaTox").checked,

            alertaMopp:
            document.getElementById("alertaMopp").checked,

            alertaManutencao:
            document.getElementById("alertaManutencao").checked,

            temaEscuro:
            document.getElementById("temaEscuro").checked

        }
    );

    alert("Configurações salvas.");

}
        