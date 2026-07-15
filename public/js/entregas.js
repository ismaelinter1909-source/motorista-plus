
/* ===== Firebase CORRIGIDO ===== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, addDoc, getDocs, onSnapshot, orderBy, query, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const app = initializeApp({
  apiKey: "AIzaSyCnlpnTTJvJPZxuZdmpKQWbbHtvH72nMUU",
  authDomain: "motorista-plus-c53f4.firebaseapp.com",
  projectId: "motorista-plus-c53f4",
  storageBucket: "motorista-plus-c53f4.appspot.com"
});

const auth = getAuth(app);
const db = getFirestore(app);

const $ = (id) => document.getElementById(id);

let uid = null;
let perfil = null;
let entregas = [];
let editId = null;


function fmtBR(d) {
  const x = new Date(d);
  return isNaN(x) ? "" :
    `${String(x.getDate()).padStart(2, "0")}/${String(x.getMonth() + 1).padStart(2, "0")}/${x.getFullYear()}`;
}
const asDateOnly = v => !v ? "" : new Date(v).toISOString().slice(0, 10);

async function carregarPerfil() {
  const snap = await getDoc(doc(db, "usuarios", uid));
  if (!snap.exists()) return;

  perfil = snap.data();
  $('dadosUsuarioCard').innerHTML = `
        <div class="item"><strong>Motorista</strong>${perfil.nome}</div>
        <div class="item"><strong>Telefone</strong>${perfil.telefone}</div>
        <div class="item"><strong>Cavalo</strong>${perfil.placaCavalo}</div>
        <div class="item"><strong>Reboque</strong>${perfil.placaReboque}</div>
        <div class="item"><strong>Email</strong>${perfil.email}</div>
      `;
}

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
            <div style="font-weight:700">${fmtBR(e.date)} — ${e.client}</div>
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

        $("modalEntrega").style.display = "flex";

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
  limparFormularioEntrega();
  editId = null;
  $("modalEntrega").style.display = "none";
};



const btnNova = $("btnNovaEntrega");
const modal = $("modalEntrega");
const btnCancelar = $("cancelarEntrega");

if (btnNova && modal && btnCancelar) {

  btnNova.onclick = () => {
    modal.style.display = "flex";
  };

  btnCancelar.onclick = () => {
    modal.style.display = "none";
  };

}

function limparFormularioEntrega() {

  $("deliveryDate").value = "";
  $("clientName").value = "";
  $("origin").value = "";
  $("destination").value = "";
  $("initialKm").value = "";
  $("finalKm").value = "";
  $("product").value = "";
  $("weight").value = "";

}

function construirLinhasPDF(arr) {
  return arr.map(e => [
    fmtBR(e.date), e.client, e.origin, e.destination,
    e.kmStart, e.kmEnd, e.kmPercorrido, `${e.placaCavalo} / ${e.placaReboque}`,
    e.product, e.weight
  ]);
}

async function gerarPDF(lista, titulo = "") {
  const { jsPDF } = window.jspdf;
  const docpdf = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });

  docpdf.setFontSize(16);
  docpdf.text(`Relatório de Entregas — Motorista Plus ${titulo}`, 32, 34);

  docpdf.setFontSize(10);
  docpdf.text(`Motorista: ${perfil?.nome || ""}`, 32, 50);
  docpdf.text(`Placas: ${perfil?.placaCavalo || ""} / ${perfil?.placaReboque || ""}`, 260, 50);

  docpdf.autoTable({
    startY: 70,
    head: [["Data", "Cliente", "Origem", "Destino", "KM Inicial", "KM Final", "KM Percorrido", "Placa", "Produto", "Peso"]],
    body: construirLinhasPDF(lista),
    headStyles: { fillColor: [243, 146, 32] },
    margin: { left: 32, right: 32 }
  });

  docpdf.save("entregas.pdf");
}




onAuthStateChanged(auth, async user => {
  if (!user) return window.location.href = "login.html";
  uid = user.uid;
  await carregarPerfil();
  iniciarStream();
});

