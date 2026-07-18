/* =====================================================
   GASTOS PESSOAIS - Motorista Plus
   ===================================================== */

import { auth, db } from "./firebase.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

import {
    doc,
    getDoc,
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

import {
    $,
    moeda
} from "./utils.js";


/* =====================================================
   Variáveis Globais
===================================================== */

let uid = null;
let perfil = null;
let viagem = null;

let gastos = [];

let editGastoId = null;

let historicoAberto = false;


/* =====================================================
   Elementos da Tela
===================================================== */

const modalGasto = $("modalGasto");

const btnNovoGasto = $("btnNovoGasto");

const btnCancelarGasto = $("cancelarGasto");

const btnHistorico = $("btnHistoricoGastos");


/* =====================================================
   Carregar Perfil
===================================================== */

async function carregarPerfil() {

    const snap = await getDoc(

        doc(
            db,
            "usuarios",
            uid
        )

    );

    if (!snap.exists()) return;

    perfil = snap.data();

    $("dadosUsuarioCard").innerHTML = `

        <div class="item motorista">

            <span class="titulo">👤 Motorista</span>

            <span class="valor">${perfil.nome}</span>

        </div>

        <div class="item">

            <span class="titulo">📞 Telefone</span>

            <span class="valor">${perfil.telefone || "-"}</span>

        </div>

        <div class="item">

            <span class="titulo">🚛 Cavalo</span>

            <span class="valor">${perfil.placaCavalo || "-"}</span>

        </div>

        <div class="item">

            <span class="titulo">🚚 Reboque</span>

            <span class="valor">${perfil.placaReboque || "-"}</span>

        </div>

        <div class="item email">

            <span class="titulo">✉️ E-mail</span>

            <span class="valor">${perfil.email}</span>

        </div>

    `;

}


/* =====================================================
   Carregar Viagem Atual
===================================================== */

async function carregarViagemAtual() {

    const snap = await getDoc(

        doc(
            db,
            "usuarios",
            uid,
            "viagemAtual",
            "dados"
        )

    );

    if (snap.exists()) {

        viagem = snap.data();

    }

}
/* =====================================================
   Stream dos Gastos Pessoais
===================================================== */

function iniciarStreamGastos() {

    const q = query(

        collection(
            db,
            "usuarios",
            uid,
            "gastosPessoais"
        ),

        orderBy(
            "criadoEm",
            "desc"
        )

    );

    onSnapshot(q, (snapshot) => {

        gastos = snapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
            .filter(g => g.idViagem === viagem?.idViagem);

        renderGastos();

    });

}


/* =====================================================
   Renderizar Histórico
===================================================== */

function renderGastos() {

    const lista = $("listaGastos");

    if (!gastos.length) {

        lista.innerHTML = `
            <li class="empty">
                Nenhum gasto pessoal registrado.
            </li>
        `;

        return;

    }

    lista.innerHTML = gastos.map(g => `

        <li>

            <div style="flex:1">

                <strong>${g.date.split("-").reverse().join("/")}</strong><br>

                🍔 ${g.categoria}<br>

                📍 ${g.local}<br>

                📝 ${g.descricao || "-"}<br>

                💰 ${moeda(g.valor)}

            </div>

            <div class="row-actions">

                <button
                    class="btn"
                    data-id="${g.id}"
                    data-act="edit">

                    Editar

                </button>

                <button
                    class="btn-red"
                    data-id="${g.id}"
                    data-act="delete">

                    Excluir

                </button>

            </div>

        </li>

    `).join("");

    adicionarEventosHistorico();

}


/* =====================================================
   Mostrar / Ocultar Histórico
===================================================== */

btnHistorico.onclick = () => {

    historicoAberto = !historicoAberto;

    $("listaGastos").style.display =
        historicoAberto ? "block" : "none";

    btnHistorico.textContent =
        historicoAberto
            ? "📂 Ocultar Histórico"
            : "📋 Mostrar Histórico";

};
/* =====================================================
   Modal
===================================================== */

function limparFormulario() {

    $("gastoDate").value = "";
    $("gastoCategoria").selectedIndex = 0;
    $("gastoLocal").value = "";
    $("gastoDescricao").value = "";
    $("gastoValor").value = "";

}

btnNovoGasto.onclick = () => {

    editGastoId = null;

    limparFormulario();

    $("tituloModalGasto").textContent =
        "💰 Novo Gasto Pessoal";

    modalGasto.style.display = "flex";

};

btnCancelarGasto.onclick = () => {

    editGastoId = null;

    limparFormulario();

    modalGasto.style.display = "none";

};


/* =====================================================
   Salvar
===================================================== */

$("salvarGasto").onclick = async () => {

    const registro = {

        idViagem: viagem?.idViagem || null,

        date: $("gastoDate").value,

        categoria: $("gastoCategoria").value,

        local: $("gastoLocal").value.trim(),

        descricao: $("gastoDescricao").value.trim(),

        valor: Number($("gastoValor").value),

        criadoEm: serverTimestamp()

    };

    if (
        !registro.date ||
        !registro.categoria ||
        !registro.local ||
        !registro.valor
    ) {

        alert("Preencha todos os campos obrigatórios.");

        return;

    }

    if (editGastoId) {

        await updateDoc(

            doc(
                db,
                "usuarios",
                uid,
                "gastosPessoais",
                editGastoId
            ),

            registro

        );

    } else {

        await addDoc(

            collection(
                db,
                "usuarios",
                uid,
                "gastosPessoais"
            ),

            registro

        );

    }

    editGastoId = null;

    limparFormulario();

    modalGasto.style.display = "none";

};


/* =====================================================
   Eventos Editar / Excluir
===================================================== */

function adicionarEventosHistorico() {

    document
        .querySelectorAll("#listaGastos button")
        .forEach(btn => {

            btn.onclick = async () => {

                const id = btn.dataset.id;

                const acao = btn.dataset.act;

                const gasto = gastos.find(g => g.id === id);

                if (!gasto) return;

                if (acao === "edit") {

                    editGastoId = id;

                    $("tituloModalGasto").textContent =
                        "✏️ Editar Gasto Pessoal";

                    $("gastoDate").value = gasto.date;

                    $("gastoCategoria").value = gasto.categoria;

                    $("gastoLocal").value = gasto.local;

                    $("gastoDescricao").value =
                        gasto.descricao || "";

                    $("gastoValor").value = gasto.valor;

                    modalGasto.style.display = "flex";

                }

                if (acao === "delete") {

                    if (!confirm("Deseja excluir este gasto?"))
                        return;

                    await deleteDoc(

                        doc(
                            db,
                            "usuarios",
                            uid,
                            "gastosPessoais",
                            id
                        )

                    );

                }

            };

        });

}


onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    uid = user.uid;

    await carregarPerfil();

    await carregarViagemAtual();

    iniciarStreamGastos();

});