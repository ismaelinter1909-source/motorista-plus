import { verificarLogin } from "./auth.js";
import { iniciarMenu } from "./menu.js";
import { db } from "./firebase.js";

import {
    collection,
    addDoc,
    getDocs
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

verificarLogin(async (user) => {

    iniciarMenu();

    carregarVeiculos(user);

    const modal = document.getElementById("modalVeiculo");

    document.getElementById("btnNovoVeiculo").onclick = () => {

        modal.classList.add("active");

    };

    document.getElementById("cancelarVeiculo").onclick = () => {

        modal.classList.remove("active");
        document.getElementById("nomeVeiculo").value = "";
        document.getElementById("marcaVeiculo").value = "";
        document.getElementById("modeloVeiculo").value = "";
        document.getElementById("anoVeiculo").value = "";
        document.getElementById("tipoVeiculo").value = "";
        document.getElementById("placaVeiculo").value = "";
        document.getElementById("combustivel").value = "Gasolina";
        document.getElementById("tanque").value = "";
        document.getElementById("consumo").value = "";

    };

    document.getElementById("salvarVeiculo").onclick = async () => {
        const nome = document.getElementById("nomeVeiculo").value.trim();

if (nome === "") {

    alert("Informe o nome do veículo.");

    return;

}

        await addDoc(
            collection(db, "usuarios", user.uid, "veiculos"),
            {
                criadoEm: new Date(),

                nome: nome,

                marca: document.getElementById("marcaVeiculo").value,

                modelo: document.getElementById("modeloVeiculo").value,

                ano: document.getElementById("anoVeiculo").value,

                tipo: document.getElementById("tipoVeiculo").value,

                placa: document.getElementById("placaVeiculo").value,

                combustivel: document.getElementById("combustivel").value,

                tanque: Number(document.getElementById("tanque").value),

                consumo: Number(document.getElementById("consumo").value),

                principal: false

            }

        );

        modal.classList.remove("active");

        carregarVeiculos(user);

    };

});
async function carregarVeiculos(user){

    const lista = document.getElementById("listaVeiculos");

    lista.innerHTML = "";

    const snap = await getDocs(
        collection(db, "usuarios", user.uid, "veiculos")
    );

    snap.forEach(doc => {

        const v = doc.data();

        lista.innerHTML += `

        <div class="cardVeiculo">

            <h2>${v.nome}</h2>

            <p><strong>Marca:</strong> ${v.marca}</p>

            <p><strong>Modelo:</strong> ${v.modelo}</p>

            <p><strong>Placa:</strong> ${v.placa}</p>

            <p><strong>Tipo:</strong> ${v.tipo}</p>

        </div>

        `;

    });

}