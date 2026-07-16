/* Firebase */
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  getFirestore, 
  doc, 
  getDoc, 
  addDoc, 
  deleteDoc,
  updateDoc,
  collection, 
  getDocs, 
  query, 
  orderBy, 
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const app = initializeApp({
  apiKey: "AIzaSyCnlpnTTJvJPZxuZdmpKQWbbHtvH72nMUU",
  authDomain: "motorista-plus-c53f4.firebaseapp.com",
  projectId: "motorista-plus-c53f4",
  storageBucket: "motorista-plus-c53f4.firebasestorage.app",
  messagingSenderId: "766097061342",
  appId: "1:766097061342:web:36d999bec6d9fe8c46994f"
});

const auth = getAuth(app);
const db = getFirestore(app);
const $ = id => document.getElementById(id);

let uid = null;
let perfil = null;
let abastecimentos = [];
let viagem = null;
let editId = null;

/* Converte valores br → número */
function parseValor(v){
  if(!v) return 0;
  return Number(
    v.replace(/\./g,"")
     .replace(",",".")
  );
}

/* PERFIL */
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

/* CARREGAR */
async function carregarAbastecimentos(){
  const q = query(collection(db,"usuarios",uid,"abastecimentos"), orderBy("data","asc"));
  const snap = await getDocs(q);

  abastecimentos = snap.docs.map(d=>({
    id: d.id,
    data: d.data().data,
    quilometragem: Number(d.data().quilometragem),
    litros: Number(d.data().litros),
    valor: Number(d.data().valor),
    tipo: d.data().tipo,
    pagamento: d.data().pagamento
  }));

  renderLista();

}


/* SALVAR — aceita valores altos e 0 */

$("salvarAbastecimento").onclick = async ()=>{

    const data = $("data").value;

    const km = Number($("km").value);

    const litros = parseValor($("litros").value);

    const valor = parseValor($("valor").value);

    const tipo = $("tipoCombustivel").value;

    const pagamento = $("pagamento").value;

    if(!data){

        alert("Informe a data.");

        return;

    }

    const registro = {

        idViagem: viagem?.idViagem || null,

        data,

        quilometragem: km,

        litros,

        valor,

        tipo,

        pagamento,

        criadoEm: serverTimestamp()

    };

    if(editId){

        await updateDoc(

            doc(db,"usuarios",uid,"abastecimentos",editId),

            registro

        );

    }else{

        await addDoc(

            collection(db,"usuarios",uid,"abastecimentos"),

            registro

        );

    }

    editId = null;

    limparFormulario();

    modal.style.display = "none";

    carregarAbastecimentos();

};

/* REMOVER */
window.remover = async(id)=>{
  if(!confirm("Excluir registro?")) return;
  await deleteDoc(doc(db,"usuarios",uid,"abastecimentos",id));
  carregarAbastecimentos();
};

/* LISTA */
function renderLista() {

    const ul = $("listaAbastecimentos");

    if (!abastecimentos.length) {

        ul.innerHTML = "<li>Nenhum abastecimento registrado.</li>";

        return;

    }

    ul.innerHTML = abastecimentos.map(r => `

        <li>

            <div style="flex:1">

                <div style="font-weight:700">

                    ${r.data}

                </div>

                <div class="tag">

                    ⛽ ${r.tipo}

                </div>

                <div class="tag">

                    📍 KM ${r.quilometragem}

                </div>

                <div class="tag">

                    🛢 ${r.litros.toFixed(2)} litros

                </div>

                <div class="tag">

                    💰 R$ ${r.valor.toFixed(2).replace(".", ",")}

                </div>

                <div class="tag">

                    💳 ${r.pagamento}

                </div>

            </div>

            <div class="row-actions">

                <button
                    class="btn"
                    data-id="${r.id}"
                    data-act="edit">

                    Editar

                </button>

                <button
                    class="btn-red"
                    data-id="${r.id}"
                    data-act="del">

                    Remover

                </button>

            </div>

        </li>

    `).join("");

    ul.querySelectorAll("button").forEach(btn => {

    btn.onclick = async () => {

        const id = btn.dataset.id;
        const acao = btn.dataset.act;

        const abastecimento = abastecimentos.find(a => a.id === id);

        if (acao === "edit") {

            $("data").value = abastecimento.data;
            $("km").value = abastecimento.quilometragem;
            $("litros").value = abastecimento.litros;
            $("valor").value = abastecimento.valor;
            $("tipoCombustivel").value = abastecimento.tipo;
            $("pagamento").value = abastecimento.pagamento;

            editId = id;

            $("tituloModalAbastecimento").textContent = "✏️ Editar Abastecimento";

            modal.style.display = "flex";

        }

        if (acao === "del") {

            if (!confirm("Deseja remover este abastecimento?")) return;

            await deleteDoc(
                doc(db, "usuarios", uid, "abastecimentos", id)
            );

            carregarAbastecimentos();

        }

    };

});

}
const btnNovo = $("btnNovoAbastecimento");
const modal = $("modalAbastecimento");
const btnCancelar = $("cancelarAbastecimento");

if (btnNovo && modal && btnCancelar) {

    btnNovo.onclick = () => {

        editId = null;

        limparFormulario();

        modal.style.display = "flex";

    };

    btnCancelar.onclick = () => {

        modal.style.display = "none";

    };

}

const btnHistorico = $("btnHistorico");
const lista = $("listaAbastecimentos");

let historicoAberto = false;

btnHistorico.onclick = () => {

    historicoAberto = !historicoAberto;

    if(historicoAberto){

        lista.style.display = "block";

        btnHistorico.textContent = "📂 Ocultar Histórico";

    }else{

        lista.style.display = "none";

        btnHistorico.textContent = "📋 Mostrar Histórico";

    }

};
function limparFormulario(){

    $("data").value = "";
    $("km").value = "";
    $("litros").value = "";
    $("valor").value = "";

    $("tipoCombustivel").selectedIndex = 0;
    $("pagamento").selectedIndex = 0;
}
/* AUTENTICAÇÃO */
onAuthStateChanged(auth, async user=>{
  if(!user) return location.href="login.html";
  uid = user.uid;
  await carregarPerfil();
  await carregarViagemAtual();
  await carregarAbastecimentos();
});