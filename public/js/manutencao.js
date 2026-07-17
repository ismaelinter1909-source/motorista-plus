/* =====================================================
   MOTORISTA PLUS
   Página: Manutenções
===================================================== */

/* ===========================
   Firebase
=========================== */

import { auth, db } from "./firebase.js";

import { onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

import {

  doc,
  getDoc,

  addDoc,
  updateDoc,
  deleteDoc,

  collection,

  query,
  orderBy,

  onSnapshot,

  serverTimestamp

} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

import { $ } from "./utils.js";

/* ===========================
   Variáveis Globais
=========================== */

let uid = null;

let perfil = null;

let viagem = null;

let manutencoes = [];

let editId = null;

let fotosBase64 = [];
/* ===========================
   Elementos
=========================== */

const modal = $("modalManutencao");

const btnNova = $("btnNovaManutencao");

const btnCancelar = $("cancelarManutencao");

const btnHistorico = $("btnHistorico");

/* ===========================
   Perfil
=========================== */

async function carregarPerfil() {

  const snap = await getDoc(
    doc(db, "usuarios", uid)
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
            <span class="valor">${perfil.telefone}</span>
        </div>

        <div class="item">
            <span class="titulo">🚛 Cavalo</span>
            <span class="valor">${perfil.placaCavalo}</span>
        </div>

        <div class="item">
            <span class="titulo">🚚 Reboque</span>
            <span class="valor">${perfil.placaReboque}</span>
        </div>

        <div class="item email">
            <span class="titulo">✉️ Email</span>
            <span class="valor">${perfil.email}</span>
        </div>

    `;

}

/* ===========================
   Viagem Atual
=========================== */

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
/* ===========================
   Modal
=========================== */
function limparFormulario(){

    $("dataManutencao").value = "";

    $("descCavalo").value = "";

    $("descReboque").value = "";

    $("fotoManutencao").value = "";

    $("previewFotos").innerHTML = "";

    fotosBase64 = [];

}

btnNova.onclick = () => {

  editId = null;

  limparFormulario();

  $("tituloModal").textContent =
    "🔧 Nova Manutenção";

  modal.style.display = "flex";

};

btnCancelar.onclick = () => {

  editId = null;

  limparFormulario();

  modal.style.display = "none";

};
/* ===========================
   Histórico
=========================== */

let historicoAberto = false;

btnHistorico.onclick = () => {

  historicoAberto = !historicoAberto;

  $("lista").style.display =

    historicoAberto

      ? "block"

      : "none";

  btnHistorico.textContent =

    historicoAberto

      ? "📂 Ocultar Histórico"

      : "📋 Mostrar Histórico";

};
/* ===========================
   Renderizar Lista
=========================== */

function renderLista() {

  const lista = $("lista");

  if (!manutencoes.length) {

    lista.innerHTML =
      "<li>Nenhuma manutenção registrada.</li>";

    return;

  }

  lista.innerHTML = manutencoes.map(m => `

<li>

    <div style="flex:1">

        <strong>${(m.data || "").split("-").reverse().join("/")}</strong>

        <br>

        🚛 <b>Cavalo</b><br>

        ${m.descCavalo || "-"}

        <br><br>

        🚚 <b>Reboque</b><br>

        ${m.descReboque || "-"}

        ${m.fotos && m.fotos.length
      ?
      `<div class="miniaturas">

                ${m.fotos.map(f => `
                    <img
                        src="${f}"
                        class="miniatura">
                `).join("")}

            </div>`
      :
      ""
    }

    </div>

    <div class="row-actions">

        <button
            class="btn"
            data-id="${m.id}"
            data-act="edit">

            Editar

        </button>

        <button
            class="btn-red"
            data-id="${m.id}"
            data-act="del">

            Remover

        </button>

    </div>

</li>

`).join("");



  lista.querySelectorAll("button").forEach(btn => {

    btn.onclick = async () => {

      const id = btn.dataset.id;

      const acao = btn.dataset.act;

      const manutencao = manutencoes.find(

        m => m.id === id

      );



      if (acao === "edit") {

        editId = id;

       $("tituloModal").textContent =
    "✏️ Editar Manutenção";

      $("dataManutencao").value = manutencao.data || "";

      $("descCavalo").value = manutencao.descCavalo || "";

      $("descReboque").value = manutencao.descReboque || "";

      fotosBase64 = [...(manutencao.fotos || [])];

      const preview = $("previewFotos");

      preview.innerHTML = "";
      fotosBase64.forEach(f=>{

      preview.innerHTML += `
        <img
            src="${f}"
            class="preview-img">
    `;

});
modal.style.display = "flex";
}


      if (acao === "del") {

        if (!confirm("Deseja remover esta manutenção?"))
          return;

        await deleteDoc(

          doc(
            db,
            "usuarios",
            uid,
            "manutencoes",
            id
          )

        );

      }

    };

  });

}
/* ===========================
   Stream
=========================== */

function iniciarStream() {

  const q = query(

    collection(
      db,
      "usuarios",
      uid,
      "manutencoes"
    ),

    orderBy("criadoEm", "desc")

  );

  onSnapshot(q, (snap) => {

    manutencoes = snap.docs

      .map(doc => ({

        id: doc.id,

        ...doc.data()

      }))

      .filter(m =>

        m.idViagem === viagem?.idViagem

      );

    renderLista();

  });

}
/* ===========================
   Salvar
=========================== */

$("salvarManutencao").onclick = async () => {


  const registro = {

    idViagem: viagem?.idViagem || null,

    data: $("dataManutencao").value,

    descCavalo: $("descCavalo").value,

    descReboque: $("descReboque").value,

    fotos: fotosBase64,

    criadoEm: serverTimestamp()

  };

  if (!registro.data) {

    alert("Informe a data.");

    return;

  }

  if (editId) {

    await updateDoc(

      doc(
        db,
        "usuarios",
        uid,
        "manutencoes",
        editId
      ),

      registro

    );
    

  } else {

    await addDoc(

      collection(
        db,
        "usuarios",
        uid,
        "manutencoes"
      ),

      registro
    );

  }

  editId = null;

  limparFormulario();

  modal.style.display = "none";

  renderLista();


};

/* =================================
          foto Preview 
====================================*/
$("fotoManutencao").onchange = async (e) => {

  const preview = $("previewFotos");

  preview.innerHTML = "";

  fotosBase64 = [];

  for (const file of e.target.files) {

    const reader = new FileReader();

    await new Promise(resolve => {

      reader.onload = () => {

        fotosBase64.push(reader.result);

        const img = document.createElement("img");

        img.src = reader.result;

        img.className = "preview-img";

        preview.appendChild(img);

        resolve();

      };

      reader.readAsDataURL(file);

    });

  }

};
/*============================
      Autenticação 
==============================*/
onAuthStateChanged(auth, async (user) => {

  if (!user) {

    location.href = "login.html";

    return;

  }

  uid = user.uid;

  await carregarPerfil();

  await carregarViagemAtual();

  iniciarStream();

});