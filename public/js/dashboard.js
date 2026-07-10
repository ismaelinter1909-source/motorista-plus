import { db } from "./firebase.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

export async function carregarDashboard(user){

    await carregarKm(user);
    await carregarGastos(user);
    await carregarEntregas(user);

}
async function carregarKm(user){

    let maiorKm = 0;

    const ref = collection(
        db,
        "usuarios",
        user.uid,
        "abastecimentos"
    );

    const snap = await getDocs(ref);

    snap.forEach((doc)=>{

        const dados = doc.data();

        if(Number(dados.quilometragem) > maiorKm){

            maiorKm = Number(dados.quilometragem);

        }

    });

    const campo = document.getElementById("kmRodados");

    if(campo){

        campo.textContent =
            maiorKm.toLocaleString("pt-BR") + " km";

    }

}
async function carregarGastos(user){

    let total = 0;

    const ref = collection(
        db,
        "usuarios",
        user.uid,
        "gastos"
    );

    const snap = await getDocs(ref);

    snap.forEach((doc)=>{

        const dados = doc.data();

        total += Number(dados.valor || 0);

    });

    const campo = document.getElementById("gastosMes");

    if(campo){

        campo.textContent =
            total.toLocaleString("pt-BR",{

                style:"currency",

                currency:"BRL"

            });

    }

}
async function carregarEntregas(user){

    const ref = collection(
        db,
        "usuarios",
        user.uid,
        "entregas"
    );

    const snap = await getDocs(ref);

    const campo =
        document.getElementById("entregasMes");

    if(campo){

        campo.textContent = snap.size;

    }

}