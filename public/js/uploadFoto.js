import { db, storage } from "./firebase.js";

import {
    doc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

import {
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";
console.log("Upload iniciado");

export function iniciarUploadFoto(user){

    const inputFoto = document.getElementById("inputFoto");

    const avatarCircle = document.getElementById("avatarCircle");
    const userFoto = document.getElementById("userFoto");

    const avatarCircleMenu = document.getElementById("avatarCircleMenu");
    const userFotoMenu = document.getElementById("userFotoMenu");

    if(!inputFoto) return;

    function abrirUpload(){

        inputFoto.click();

    }

    avatarCircle?.addEventListener("click", abrirUpload);
    userFoto?.addEventListener("click", abrirUpload);

    avatarCircleMenu?.addEventListener("click", abrirUpload);
    userFotoMenu?.addEventListener("click", abrirUpload);

    inputFoto.addEventListener("change", async (e)=>{

        const file = e.target.files[0];

        if(!file) return;

        try{

            const fotoRef = ref(
                storage,
                `usuarios/${user.uid}/perfil.jpg`
            );

            await uploadBytes(fotoRef,file);

            const url = await getDownloadURL(fotoRef);

            await updateDoc(
                doc(db,"usuarios",user.uid),
                {
                    fotoUrl:url
                }
            );

            userFoto.src = url;
            userFoto.style.display="block";
            avatarCircle.style.display="none";

            userFotoMenu.src = url;
            userFotoMenu.style.display="block";
            avatarCircleMenu.style.display="none";

            alert("Foto atualizada com sucesso!");

        }catch(err){

            console.error(err);

            alert("Erro ao enviar a foto.");

        }

    });

}