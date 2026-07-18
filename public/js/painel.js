import {
    collection,
    getDocs,
    getDoc,
    doc
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
    await carregarDiasEFolgas(user);
    await carregarGastoValor(user);
    await carregarTotalVales(user);
    await carregarSaldoViagem(user);
    await carregarGastosPessoais(user);

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
//==============Abastecimento==============//

async function calcularMediaConsumo(user) {

    try {

        const kmRodados = await calcularKmRodados(user);

        const snap = await getDocs(
            collection(db, "usuarios", user.uid, "abastecimentos")
        );

        let totalLitrosDiesel = 0;

        snap.forEach(doc => {

            const abastecimento = doc.data();

            // Soma apenas abastecimentos de Diesel
            if (
                abastecimento.tipo === "Diesel" ||
                abastecimento.tipo === "Diesel S10" ||
                abastecimento.tipo === "Diesel S500"
            ) {

                totalLitrosDiesel += Number(abastecimento.litros || 0);

            }

        });

        const media =
            totalLitrosDiesel > 0
                ? kmRodados / totalLitrosDiesel
                : 0;

        document.getElementById("mediaConsumo").textContent =
            media.toFixed(2).replace(".", ",") + " km/L";

    } catch (erro) {

        console.error("Erro ao calcular média:", erro);

        document.getElementById("mediaConsumo").textContent = "0,00 km/L";

    }

}
/* ========= Dias Viajados e Folgas ========= */
async function carregarDiasEFolgas(user) {

    const snap = await getDoc(
        doc(db, "usuarios",user.uid, "viagemAtual", "dados")
    );

    if (!snap.exists()) return;

    const viagem = snap.data();

    if (viagem.status !== "ativa") {

        document.getElementById("totaldias").textContent = "0";
        document.getElementById("totalfolgas").textContent = "0";
        return;

    }

    // Se a viagem ainda não foi encerrada,
    // utiliza a data de hoje para calcular os dias.
    const hoje = toISO(new Date());

    const info = calcularRetorno(
        viagem.inicio,
        viagem.fim || hoje
    );

  document.getElementById("totaldias").textContent = info.dias;
  document.getElementById("totalfolgas").textContent = info.folgas;

}

function parseISO(data) {
    const [ano, mes, dia] = data.split("-").map(Number);
    return new Date(ano, mes - 1, dia);
}

function toISO(data) {
    return data.toISOString().split("T")[0];
}
function calcularFolgas(dias){

    if (dias <= 7) return 1;
    if (dias <= 15) return 2;
    if (dias <= 21) return 3;
    if (dias <= 30) return 4;
    if (dias <= 37) return 5;
    if (dias <= 45) return 6;
    if (dias <= 52) return 7;
    if (dias <= 60) return 8;
    if (dias <= 67) return 9;
    if (dias <= 75) return 10;

    return 10 + Math.ceil((dias - 75) / 7);

}
function calcularRetorno(inicio, fim) {

    const ini = parseISO(inicio);
    const final = parseISO(fim);

    const dias =
        Math.floor((final - ini) / 86400000) + 1;

    return {
        dias,
        folgas: calcularFolgas(dias)
    };
}
//=============Gastos e vales ==========//


async function carregarGastoValor(user) {

    try {

        const viagemSnap = await getDoc(
            doc(db, "usuarios", user.uid, "viagemAtual", "dados")
        );

        if (!viagemSnap.exists()) {

            document.getElementById("gastosEmpresa").textContent = "R$ 0,00";
            return 0;

        }

        const viagem = viagemSnap.data();

        const snapshot = await getDocs(
            collection(db, "usuarios", user.uid, "gastos")
        );

        let total = 0;

        snapshot.forEach((doc) => {

            const gasto = doc.data();

            if (gasto.idViagem === viagem.idViagem) {

                total += Number(gasto.valor || 0);

            }

        });

        document.getElementById("gastosEmpresa").textContent =
            total.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL"
            });

        return total;

    } catch (erro) {

        console.error("Erro ao carregar gastos:", erro);

        document.getElementById("gastosEmpresa").textContent = "R$ 0,00";

        return 0;

    }

}
async function carregarTotalVales(user) {

    try {

        const viagemSnap = await getDoc(
            doc(db, "usuarios", user.uid, "viagemAtual", "dados")
        );

        if (!viagemSnap.exists()) {

            document.getElementById("totalVales").textContent = "R$ 0,00";
            return 0;

        }

        const viagem = viagemSnap.data();

        const snapshot = await getDocs(
            collection(db, "usuarios", user.uid, "vales")
        );

        let total = 0;

        snapshot.forEach((doc) => {

            const vale = doc.data();

            if (vale.idViagem === viagem.idViagem) {

                total += Number(vale.valor || 0);

            }

        });

        document.getElementById("totalVales").textContent =
            total.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL"
            });

        return total;

    } catch (erro) {

        console.error("Erro ao carregar vales:", erro);

        document.getElementById("totalVales").textContent = "R$ 0,00";

        return 0;

    }

}
async function carregarSaldoViagem(user) {

    try {

        const totalGastos = await carregarGastoValor(user);
        const totalVales = await carregarTotalVales(user);

        const saldo = totalVales - totalGastos;

        const elemento = document.getElementById("saldoViagem");

        elemento.textContent = saldo.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });

        if (saldo >= 0) {
            elemento.style.color = "#16a34a"; // verde
        } else {
            elemento.style.color = "#dc2626"; // vermelho
        }

    } catch (erro) {

        console.error("Erro ao calcular saldo:", erro);

        document.getElementById("saldoViagem").textContent = "R$ 0,00";

    }

}
async function carregarGastosPessoais(user) {

    const viagemSnap = await getDoc(
        doc(
            db,
            "usuarios",
            user.uid,
            "viagemAtual",
            "dados"
        )
    );

    if (!viagemSnap.exists()) {
        document.getElementById("gastosPessoais").textContent = "R$ 0,00";
        return 0;
    }

    const viagem = viagemSnap.data();

    const gastosSnap = await getDocs(
        collection(
            db,
            "usuarios",
            user.uid,
            "gastosPessoais"
        )
    );

    let total = 0;

    gastosSnap.forEach(doc => {

        const gasto = doc.data();

        if (gasto.idViagem === viagem.idViagem) {
            total += Number(gasto.valor || 0);
        }

    });

    document.getElementById("gastosPessoais").textContent =
        total.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });

    return total;
}
