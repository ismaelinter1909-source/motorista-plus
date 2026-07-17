
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
      $("placaCavalo").textContent = perfil.placaCavalo;
      $("placaReboque").textContent = perfil.placaReboque;
}
async function carregarViagemAtual() {

    const snap = await getDoc(
        doc(db, "usuarios", uid, "viagemAtual", "dados")
    );

    if (snap.exists()) {
        viagem = snap.data();
    }

}

// ============================
// Lista de Entregas
// ============================
function iniciarStream() {
  const qRef = query(
    collection(db, "usuarios", uid, "entregas"),
    orderBy("criadoEm", "desc")
  );
  onSnapshot(qRef, snap => {
    entregas = snap.docs.map(d => {
      const x = d.data();
      return {
        id: d.id,
        date: asDateOnly(x.date),
        client: x.client,
        origin: x.origin,
        destination: x.destination,
        kmStart: Number(x.kmStart || 0),
        kmEnd: Number(x.kmEnd || 0),
        kmPercorrido: Number(x.kmPercorrido || (x.kmEnd - x.kmStart)),
        placaCavalo: x.placaCavalo,
        placaReboque: x.placaReboque,
        product: x.product,
        weight: Number(x.weight || 0)
      };
    });
    renderLista();
  });
}

function renderLista() {
  const ul = $('listaEntregas');
  if (!entregas.length) {
    ul.innerHTML = '<li>Nenhuma entrega registrada.</li>';
    return;
  }

  ul.innerHTML = entregas.map(e => `
        <li>
          <div style="flex:1;min-width:260px">
            <div style="font-weight:700">${formatarDataBR(e.date)} — ${e.client}</div>
            <div class="tag">Origem: ${e.origin} • Destino: ${e.destination}</div>
            <div class="tag">KM: ${e.kmStart} → ${e.kmEnd} (${e.kmPercorrido})</div>
            <div class="tag">🚛 Cavalo: ${e.placaCavalo} <br> 🚚 Reboque: ${e.placaReboque}
          </div>
          <div class="row-actions">
            <button class="btn" data-id="${e.id}" data-act="edit">Editar</button>
            <button class="btn-red" data-id="${e.id}" data-act="del">Remover</button>
          </div>
        </li>
      `).join("");

  ul.querySelectorAll("button").forEach(btn => {
    btn.onclick = async () => {
      const id = btn.dataset.id;
      const act = btn.dataset.act;

      if (act === "edit") {
        const e = entregas.find(x => x.id === id);
        $('deliveryDate').value = e.date;
        $('clientName').value = e.client;
        $('origin').value = e.origin;
        $('destination').value = e.destination;
        $('initialKm').value = e.kmStart;
        $('finalKm').value = e.kmEnd;

        $('product').value = e.product;
        $('weight').value = e.weight;
        editId = id;

        abrirModal("modalEntrega");

      } else if (act === "del") {
        if (confirm("Excluir esta entrega?")) {
          await deleteDoc(doc(db, "usuarios", uid, "entregas", id));
        }
      }
    };
  });
}

$('salvarEntrega').onclick = async () => {
  const date = $('deliveryDate').value;
  const client = $('clientName').value;
  const origin = $('origin').value;
  const destination = $('destination').value;
  const initialKm = Number($('initialKm').value);
  const finalKm = Number($('finalKm').value);

  const product = $('product').value;
  const weight = Number($('weight').value);

  if (!date || !client || !origin || !destination) {
    alert("Preencha todos os campos.");
    return;
  }

  const registro = {

    idViagem: viagem?.idViagem || null,

    date,
    client,
    origin,
    destination,

    kmStart: initialKm,
    kmEnd: finalKm,

    kmPercorrido: finalKm - initialKm,

    placaCavalo: perfil.placaCavalo,
    placaReboque: perfil.placaReboque,

    product,
    weight,

    criadoEm: serverTimestamp()

};

  if (editId) {
    await updateDoc(doc(db, "usuarios", uid, "entregas", editId), registro);

  } else {
    await addDoc(collection(db, "usuarios", uid, "entregas"), registro);

  }
  limparFormulario([
    "deliveryDate",
    "clientName",
    "origin",
    "destination",
    "initialKm",
    "finalKm",
    "product",
    "weight"
  ]);

  editId = null;

fecharModal("modalEntrega");
};



const btnNova = $("btnNovaEntrega");
const modal = $("modalEntrega");
const btnCancelar = $("cancelarEntrega");

const btnHistorico = $("btnHistorico");
const listaEntregas = $("listaEntregas");

let historicoAberto = false;

if (btnHistorico && listaEntregas) {

    btnHistorico.onclick = () => {

        historicoAberto = !historicoAberto;

        if (historicoAberto) {

            listaEntregas.style.display = "block";

            btnHistorico.textContent = "📂 Ocultar Histórico";

        } else {

            listaEntregas.style.display = "none";

            btnHistorico.textContent = "📋 Mostrar Histórico";

        }

    };

}

if (btnNova && modal && btnCancelar) {

  btnNova.onclick = () => {

    editId = null;

    limparFormulario([
      "deliveryDate",
      "clientName",
      "origin",
      "destination",
      "initialKm",
      "finalKm",
      "product",
      "weight"
    ]);

    abrirModal("modalEntrega");

  };

 btnCancelar.onclick = () => {

    editId = null;

    limparFormulario([
        "deliveryDate",
        "clientName",
        "origin",
        "destination",
        "initialKm",
        "finalKm",
        "product",
        "weight"
    ]);

    fecharModal("modalEntrega");

};

}

// ============================
// Inicialização
// ============================

onAuthStateChanged(auth, async user => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    uid = user.uid;

    await carregarPerfil();

    await carregarViagemAtual();

    iniciarStream();

});
