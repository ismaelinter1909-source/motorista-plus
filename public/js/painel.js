import {
    collection,
    getDocs,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

import { verificarLogin } from "./auth.js";
import { db } from "./firebase.js";
import { iniciarMenu } from "./menu.js";
import { carregarPerfil } from "./perfil.js";
import { iniciarUploadFoto } from "./uploadFoto.js";
import { carregarDashboard } from "./dashboard.js";


verificarLogin(async (user) => {

    iniciarMenu();

    await carregarPerfil(user);

    iniciarUploadFoto(user);

    await carregarDashboard(user);

    await calcularKmRodados(user);

});
  async function calcularKmRodados(user){

    const snap = await getDocs(
        collection(db, "usuarios", user.uid, "viagemAtual")
    );
     console.log("Quantidade de viagens:", snap.size);

    let totalKm = 0;

    snap.forEach(doc => {

        const viagem = doc.data();

        const inicio = Number(viagem.kmInicio || 0);
        const fim = Number(viagem.kmFim || 0);

         console.log("Início:", inicio, "Fim:", fim);

        if (fim > inicio) {

            totalKm += (fim - inicio);

        }

    });
     console.log("Total KM:", totalKm);

    document.getElementById("kmRodados").textContent =
        totalKm.toLocaleString("pt-BR") + " km";

}

    