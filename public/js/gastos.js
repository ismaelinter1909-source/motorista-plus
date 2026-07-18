/* ===== Firebase CORRIGIDO ===== */
import { auth, db } from "./firebase.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

import {

  $,
  abrirModal,
  fecharModal,
  limparFormulario,
  formatarDataBR,
  moeda

} from "./utils.js";
// ============================
// Variáveis Globais
// ============================
let uid = null;
let perfil = null;
let entregas = [];
let editId = null;
let viagem = null;
let gastos = [];

let vales = [];

let editGastoId = null;

let editValeId = null;

let historicoGastosAberto = false;
let historicoValesAberto = false;



/* ===========================
   Elementos da tela
=========================== */
const modalGasto = $("modalGasto");
const modalVale = $("modalVale");

const btnNovoGasto = $("btnNovoGasto");
const btnNovoVale = $("btnNovoVale");

const btnCancelarGasto = $("cancelarGasto");
const btnCancelarVale = $("cancelarVale");

const btnHistoricoGastos = $("btnHistoricoGastos");
const btnHistoricoVales = $("btnHistoricoVales");

// ============================
// Utilidades
// ============================
const asDateOnly = v => !v ? "" : new Date(v).toISOString().slice(0, 10);
// ============================
// Perfil
// ============================
async function carregarPerfil() {
  const snap = await getDoc(doc(db, "usuarios", uid));
  if (!snap.exists()) return;

  perfil = snap.data();
  $('dadosUsuarioCard').innerHTML = `
    <div class="item motorista">
        <span class="titulo">👤 Motorista</span>
        <span class="valor">${perfil.nome}</span>
    </div>

    <div class="item">
        <span class="titulo">📞 Telefone</span>
        <span class="valor">${perfil.telefone}</span>
    </div>

    <div class="item">
        <span class="titulo">🚛 Cavalo</span>
        <span class="valor">${perfil.placaCavalo}</span>
    </div>

    <div class="item reboque">
    <span class="titulo">🚚 Reboque</span>
    <span class="valor">${perfil.placaReboque}</span>
</div>

    <div class="item email">
        <span class="titulo">✉️ E-mail</span>
        <span class="valor">${perfil.email}</span>
    </div>
`;
}

/* =====================================================
   Viagem Atual
===================================================== */

async function carregarViagemAtual(){

    const snap = await getDoc(

        doc(
            db,
            "usuarios",
            uid,
            "viagemAtual",
            "dados"
        )

    );

    if(snap.exists()){

        viagem = snap.data();

    }

}
/* =====================================================
   Streams
===================================================== */

function iniciarStreams(){

    const qGastos = query(

        collection(
            db,
            "usuarios",
            uid,
            "gastos"
        ),

        orderBy(
            "criadoEm",
            "desc"
        )

    );

    onSnapshot(qGastos,snap=>{

        gastos = snap.docs

            .map(doc=>({

                id:doc.id,

                ...doc.data()

            }))

            .filter(g=>g.idViagem===viagem?.idViagem);

        renderGastos();

    });




    const qVales = query(

        collection(
            db,
            "usuarios",
            uid,
            "vales"
        ),

        orderBy(
            "criadoEm",
            "desc"
        )

    );

    onSnapshot(qVales,snap=>{

        vales = snap.docs

            .map(doc=>({

                id:doc.id,

                ...doc.data()

            }))

            .filter(v=>v.idViagem===viagem?.idViagem);

        renderVales();

    });

}
/* =====================================================
   Modal de Gastos
===================================================== */

function limparFormularioGasto(){

    $("gastoDate").value = "";
    $("gastoMotivo").value = "";
    $("gastoLocal").value = "";
    $("gastoValor").value = "";
    $("gastoAut").selectedIndex = 0;

}

btnNovoGasto.onclick = ()=>{

    editGastoId = null;

    limparFormularioGasto();

    $("tituloModalGasto").textContent =
        "💰 Novo Gasto";

    modalGasto.style.display = "flex";

};

btnCancelarGasto.onclick = ()=>{

    editGastoId = null;

    limparFormularioGasto();

    modalGasto.style.display = "none";

};

function limparFormularioVale(){

    $("valeDate").value = "";
    $("valeMotivo").value = "";
    $("valeValor").value = "";

}

btnNovoVale.onclick = ()=>{

    editValeId = null;

    limparFormularioVale();

    $("tituloModalVale").textContent =
        "💵 Novo Vale";

    modalVale.style.display = "flex";

};

btnCancelarVale.onclick = ()=>{

    editValeId = null;

    limparFormularioVale();

    modalVale.style.display = "none";

};
/* =====================================================
   Salvar Gasto
===================================================== */

$("salvarGasto").onclick = async ()=>{

    const registro = {

        idViagem: viagem?.idViagem || null,

        date: $("gastoDate").value,

        motivo: $("gastoMotivo").value.trim(),

        local: $("gastoLocal").value.trim(),

        valor: Number($("gastoValor").value),

        aut: $("gastoAut").value,

        criadoEm: serverTimestamp()

    };

    if(

        !registro.date ||

        !registro.motivo ||

        !registro.local ||

        !registro.valor

    ){

        alert("Preencha todos os campos.");

        return;

    }

    if(editGastoId){

        await updateDoc(

            doc(
                db,
                "usuarios",
                uid,
                "gastos",
                editGastoId
            ),

            registro

        );

    }else{

        await addDoc(

            collection(
                db,
                "usuarios",
                uid,
                "gastos"
            ),

            registro

        );

    }
console.log(registro);
    editGastoId = null;

    limparFormularioGasto();

    modalGasto.style.display = "none";

};
function renderGastos(){

    const lista = $("listaGastos");

    if(gastos.length===0){

        lista.innerHTML =
            "<li>Nenhum gasto registrado.</li>";

        return;

    }

    lista.innerHTML = gastos.map(g=>`

        <li>

            <div style="flex:1">

                <strong>${g.date.split("-").reverse().join("/")}</strong><br>

                📍 ${g.local}<br>

                📝 ${g.motivo}<br>

                💰 R$ ${Number(g.valor).toFixed(2).replace(".",",")}<br>

                👤 ${g.aut}

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
                    data-act="del">

                    Remover

                </button>

            </div>

        </li>

    `).join("");

    lista.querySelectorAll("button").forEach(btn=>{

        btn.onclick = async()=>{

            const id = btn.dataset.id;

            const acao = btn.dataset.act;

            const gasto =
                gastos.find(g=>g.id===id);

            if(acao==="edit"){

                editGastoId = id;

                $("tituloModalGasto").textContent =
                    "✏️ Editar Gasto";

                $("gastoDate").value = gasto.date;
                $("gastoMotivo").value = gasto.motivo;
                $("gastoLocal").value = gasto.local;
                $("gastoValor").value = gasto.valor;
                $("gastoAut").value = gasto.aut;

                modalGasto.style.display="flex";

            }

            if(acao==="del"){

                if(!confirm("Excluir este gasto?"))
                    return;

                await deleteDoc(

                    doc(
                        db,
                        "usuarios",
                        uid,
                        "gastos",
                        id
                    )

                );

            }

        };

    });

}
function renderVales(){

    const lista = $("listaVales");

    if(vales.length===0){

        lista.innerHTML =
            "<li>Nenhum vale registrado.</li>";

        return;

    }

    lista.innerHTML = vales.map(v=>`

        <li>

            <div style="flex:1">

                <strong>${v.date.split("-").reverse().join("/")}</strong><br>

                📝 ${v.motivo || "-"}<br>

                💵 R$ ${Number(v.valor).toFixed(2).replace(".",",")}

            </div>

            <div class="row-actions">

                <button
                    class="btn"
                    data-id="${v.id}"
                    data-act="edit">

                    Editar

                </button>

                <button
                    class="btn-red"
                    data-id="${v.id}"
                    data-act="del">

                    Remover

                </button>

            </div>

        </li>

    `).join("");

    lista.querySelectorAll("button").forEach(btn=>{

        btn.onclick = async()=>{

            const id = btn.dataset.id;

            const acao = btn.dataset.act;

            const vale = vales.find(v=>v.id===id);

            if(acao==="edit"){

                editValeId = id;

                $("tituloModalVale").textContent =
                    "✏️ Editar Vale";

                $("valeDate").value = vale.date;
                $("valeMotivo").value = vale.motivo;
                $("valeValor").value = vale.valor;

                modalVale.style.display = "flex";

            }

            if(acao==="del"){

                if(!confirm("Excluir este vale?"))
                    return;

                await deleteDoc(
                    doc(
                        db,
                        "usuarios",
                        uid,
                        "vales",
                        id
                    )
                );

            }

        };

    });

}
$("salvarVale").onclick = async()=>{

    const registro={

        idViagem: viagem?.idViagem || null,

        date:$("valeDate").value,

        motivo:$("valeMotivo").value.trim(),

        valor:Number($("valeValor").value),

        criadoEm:serverTimestamp()

    };

    if(!registro.date || !registro.valor){

        alert("Preencha todos os campos.");

        return;

    }

    if(editValeId){

        await updateDoc(

            doc(db,
                "usuarios",
                uid,
                "vales",
                editValeId),

            registro

        );

    }else{

        await addDoc(

            collection(
                db,
                "usuarios",
                uid,
                "vales"),

            registro

        );

    }

    editValeId = null;

    limparFormularioVale();

    modalVale.style.display="none";

};

btnHistoricoGastos.onclick = () => {

    historicoGastosAberto = !historicoGastosAberto;

    $("listaGastos").style.display =
        historicoGastosAberto ? "block" : "none";

    btnHistoricoGastos.textContent =
        historicoGastosAberto
        ? "📂 Ocultar Histórico"
        : "📋 Mostrar Histórico";

};

btnHistoricoVales.onclick = () => {

    historicoValesAberto = !historicoValesAberto;

    $("listaVales").style.display =
        historicoValesAberto ? "block" : "none";

    btnHistoricoVales.textContent =
        historicoValesAberto
        ? "📂 Ocultar Histórico"
        : "📋 Mostrar Histórico";

};

onAuthStateChanged(auth, async user => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    uid = user.uid;

    await carregarPerfil();

    await carregarViagemAtual();

    iniciarStreams();

});