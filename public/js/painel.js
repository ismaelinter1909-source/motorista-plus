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
    await calcularMediaConsumo(user);
    await carregarTotalEntregas(user);
    await carregarTotalAbastecimentos(user);
    await carregarTotalManutencoes(user);
    await carregarTotalDiarias(user);
    

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

        return totalKm;

}
async function carregarTotalEntregas(user) {

    const snap = await getDocs(
        collection(db, "usuarios", user.uid, "entregas")
    );

    document.getElementById("totalEntregas").textContent = snap.size;

}
async function carregarTotalAbastecimentos(user) {
    try {
        const snapshot = await getDocs(
            collection(db, "usuarios", user.uid, "abastecimentos")
        );

        document.getElementById("totalAbastecimentos").textContent = snapshot.size;
    } catch (erro) {
        console.error("Erro ao carregar abastecimentos:", erro);
        document.getElementById("totalAbastecimentos").textContent = "0";
    }
} 
async function carregarTotalManutencoes(user) {
    try {
        const snapshot = await getDocs(
            collection(db, "usuarios", user.uid, "manutencoes")
        );

        document.getElementById("totalManutencoes").textContent = snapshot.size;
    } catch (erro) {
        console.error("Erro ao carregar manutenções:", erro);
        document.getElementById("totalManutencoes").textContent = "0";
    }
}
async function carregarTotalDiarias(user) {
    try {
        const snapshot = await getDocs(
            collection(db, "usuarios", user.uid, "diarias")
        );

        let totalDiarias = 0;

        snapshot.forEach((doc) => {
            const dados = doc.data();
            totalDiarias += Number(dados.qtd || 0);
        });

        document.getElementById("totalDiarias").textContent = totalDiarias;

    } catch (erro) {
        console.error("Erro ao carregar diárias:", erro);
        document.getElementById("totalDiarias").textContent = "0";
    }
}
async function calcularMediaConsumo(user) {

    try {

        const kmRodados = await calcularKmRodados(user);

        const snap = await getDocs(
            collection(db, "usuarios", user.uid, "abastecimentos")
        );

        let totalLitros = 0;

        snap.forEach(doc => {

            const abastecimento = doc.data();

            totalLitros += Number(abastecimento.litros || 0);

        });

        let media = 0;

        if (totalLitros > 0) {

            media = kmRodados / totalLitros;

        }

        document.getElementById("mediaConsumo").textContent =
            media.toFixed(2).replace(".", ",") + " km/L";

    } catch (erro) {

        console.error("Erro ao calcular média:", erro);

        document.getElementById("mediaConsumo").textContent = "0,00 km/L";

    }

}