
/* =============== Firebase Setup =============== */
import { gerarRelatorioOperacional } from "./relatorioOperacional.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

import { auth, db } from "./firebase.js";


/* ========= Helpers ========= */
const $ = id => document.getElementById(id);
let uid = null;
let perfil = null;
let diarias = [];
let viagemAtiva = false;
let acaoModal = "";

/* ========= Datas ========= */
const toISO = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parseISO = iso => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d); };
const fmtBR = iso => iso ? iso.split("-").reverse().join("/") : "";

/* ========= Folgas ========= */
function calcularFolgas(dias) {
  if (dias <= 7) return 1;
  if (dias <= 15) return 2;
  if (dias <= 21) return 3;
  if (dias <= 30) return 4;
  if (dias <= 37) return 5;
  if (dias <= 45) return 6;
  if (dias <= 52) return 7;
  if (dias <= 60) return 8;
  return Math.ceil(dias / 7, 5);
}

function calcularRetorno(iniISO, fimISO) {
  const ini = parseISO(iniISO);
  const fim = parseISO(fimISO);

  const dias = Math.floor((fim - ini) / 86400000) + 1;
  const folgas = calcularFolgas(dias);

  const primeiro = new Date(fim); primeiro.setDate(primeiro.getDate() + 1);
  const ultimo = new Date(fim); ultimo.setDate(ultimo.getDate() + folgas);
  const retorno = new Date(fim); retorno.setDate(retorno.getDate() + folgas + 1);

  return {
    dias, folgas,
    primeiroFolgaISO: toISO(primeiro),
    ultimoFolgaISO: toISO(ultimo),
    retornoISO: toISO(retorno)
  };
}
async function gerarResumoViagem(viagem) {

  const info = calcularRetorno(
    viagem.inicio,
    viagem.fim
  );

  // ===== ENTREGAS =====
  const entregasSnap = await getDocs(
    collection(db, "usuarios", uid, "entregas")
  );

  const totaEntregas = entregasSnap.docs
    .map(doc => doc.data())
    .filter(m => m.idViagem === viagem.idViagem)
    .length;
  // ===== ABASTECIMENTOS =====
  const abastecimentosSnap = await getDocs(
    collection(db, "usuarios", uid, "abastecimentos")
  );

  const totalAbastecimentos = abastecimentosSnap.docs
    .map(doc => doc.data())
    .filter(a => a.idViagem === viagem.idViagem)
    .length;

  // ===== MANUTENÇÕES =====
  const manutencoesSnap = await getDocs(
    collection(db, "usuarios", uid, "manutencoes")
  );

  const totalManutencoes = manutencoesSnap.docs
    .map(doc => doc.data())
    .filter(m => m.idViagem === viagem.idViagem)
    .length;

  // ===== GASTOS EMPRESA =====
  const gastosSnap = await getDocs(
    collection(db, "usuarios", uid, "gastos")
  );

  const gastos = gastosSnap.docs
    .map(d => d.data())
    .filter(g => g.idViagem === viagem.idViagem);

  const totalGastosEmpresa =
    gastos.reduce(
      (s, g) => s + Number(g.valor || 0),
      0
    );

  // ===== VALES =====
  const valesSnap = await getDocs(
    collection(db, "usuarios", uid, "vales")
  );

  const vales = valesSnap.docs
    .map(d => d.data())
    .filter(v => v.idViagem === viagem.idViagem);

  const totalVales =
    vales.reduce(
      (s, v) => s + Number(v.valor || 0),
      0
    );

  // ===== DIÁRIAS =====
  const diariasSnap = await getDocs(
    collection(db, "usuarios", uid, "diarias")
  );

  const diarias = diariasSnap.docs
    .map(doc => doc.data())
    .filter(d => d.idViagem === viagem.idViagem);

  const qtdDiarias =
    diarias.reduce(
      (s, d) => s + Number(d.qtd || 0),
      0
    );
  const valorTotalDiarias =
    qtdDiarias * Number($("valorDiaria").value || 100);

  return {

    motorista: perfil.nome,

    cavalo: perfil.placaCavalo,

    carreta: perfil.placaReboque,

    inicio: viagem.inicio,

    fim: viagem.fim,

    kmInicial: viagem.kmInicio,

    kmFinal: viagem.kmFim,

    kmRodados:
      viagem.kmFim - viagem.kmInicio,

    diasViajados: info.dias,

    folgas: info.folgas,

    retorno: info.retornoISO,

    entregas: totaEntregas,

    abastecimentos: totalAbastecimentos,

    manutencoes: totalManutencoes,

    qtdDiarias,

    valorTotalDiarias,

    totalVales,

    totalGastosEmpresa,

    saldo:
      totalVales - totalGastosEmpresa

  };

}
/* ========= UI Viagem ========= */
function preencherDerivadosUI() {
  const ini = $('viagemInicio').value;
  const fim = $('viagemFim').value;

  if (!ini || !fim) { $('resumoViagem').textContent = "Resumo: —"; return; }

  const info = calcularRetorno(ini, fim);

  $('diasViajados').value = info.dias;
  $('diasFolga').value = info.folgas;
  $('retornoFolga').value = fmtBR(info.retornoISO);

  const kmI = Number($('kmInicio').value || 0);
  const kmF = Number($('kmFim').value || 0);
  $('kmRodados').value = kmI && kmF ? kmF - kmI : "";

  $('resumoViagem').textContent =
    `Dias viajados: ${info.dias} | Folgas: ${info.folgas} | Retorno: ${fmtBR(info.retornoISO)}`;
}

["viagemInicio", "viagemFim", "kmInicio", "kmFim"].forEach(id => {
  $(id).addEventListener("change", preencherDerivadosUI);
});

/* ========= Firestore caminhos ========= */
const viagemRef = () => doc(db, "usuarios", uid, "viagemAtual", "dados");

function gerarIdViagem() {

  return `MP-${Date.now()}`;

}

/* ========= Carregar Perfil ========= */
async function carregarPerfil() {
  const snap = await getDoc(doc(db, "usuarios", uid));
  if (!snap.exists()) return;



  perfil = snap.data();
  $('dadosUsuarioCard').innerHTML = `
    <div><strong>Motorista:</strong> ${perfil.nome}</div>
    <div><strong>Telefone:</strong> ${perfil.telefone}</div>
    <div><strong>Cavalo:</strong> ${perfil.placaCavalo}</div>
    <div><strong>Reboque:</strong> ${perfil.placaReboque}</div>
  `;
}



/* ========= Carregar Viagem ========= */
async function carregarViagem() {

  const snap = await getDoc(viagemRef());

  if (!snap.exists()) return;

  const d = snap.data();

  // Dados da viagem
  $("viagemInicio").value = d.inicio || "";
  $("viagemFim").value = d.fim || "";
  $("kmInicio").value = d.kmInicio ?? "";
  $("kmFim").value = d.kmFim ?? "";

  // Resumo de diárias
  $("empresaDevia").value = d.empresaDevia ?? 0;
  $("motoristaDevia").value = d.motoristaDevia ?? 0;
  $("diariasRecebidas").value = d.diariasRecebidas ?? 0;
  $("valorDiaria").value = d.valorDiaria ?? 100;

  // Se existir uma viagem ativa
  if (d.status === "ativa") {

    preencherDerivadosUI();
    recalcularResumo();

  }
  // Se a viagem estiver encerrada
  else {

    $("diasViajados").value = "";
    $("diasFolga").value = "";
    $("retornoFolga").value = "";
    $("kmRodados").value = "";

    $("resumoViagem").textContent = "Resumo: —";

  }

}
/* ========= Salvar viagem ========= */
$('salvarViagemBtn').onclick = async () => {
  await setDoc(viagemRef(), {
    inicio: $('viagemInicio').value,
    fim: $('viagemFim').value,
    kmInicio: Number($('kmInicio').value || 0),
    kmFim: Number($('kmFim').value || 0),
    atualizadoEm: serverTimestamp()
  }, { merge: true });
  alert("Viagem salva!");
};

/* ========= Limpar Viagem ========= */
$('limparViagemBtn').onclick = async () => {
  if (!confirm("Limpar?")) return;
  await setDoc(viagemRef(), {
    inicio: "", fim: "", kmInicio: null, kmFim: null
  });
  location.reload();
};

async function atualizarStatusViagem() {

  const snap = await getDoc(viagemRef());

  if (!snap.exists()) {

    mostrarSemViagem();
    return;

  }

  const viagem = snap.data();

  if (viagem.status === "ativa") {

    viagemAtiva = true;

    $("resumoFinal").style.display = "none";

    $("statusViagem").innerHTML = `
            <strong>🟢 Viagem em andamento</strong><br>
            Início: ${fmtBR(viagem.inicio)}
        `;

    $("btnIniciarViagem").style.display = "none";
    $("btnEncerrarViagem").style.display = "block";

    $("cardViagem").style.display = "block";
    $("cardResumoDiarias").style.display = "block";
    $("cardDiarias").style.display = "block";
    $("btnEncerrarViagem").style.display = "block";


  }
  else if (viagem.status === "encerrada") {

    mostrarResumoFinal(viagem);

  }
  else {

    mostrarSemViagem();

  }

}
function mostrarSemViagem() {

  viagemAtiva = false;

  $("statusViagem").innerHTML =
    "Nenhuma viagem em andamento.";

  $("btnIniciarViagem").style.display = "block";
  $("btnEncerrarViagem").style.display = "none";

  $("resumoFinal").style.display = "none";

  $("cardViagem").style.display = "none";
  $("cardResumoDiarias").style.display = "none";
  $("cardDiarias").style.display = "none";
}

$("btnIniciarViagem").onclick = () => {

  abrirModal("iniciar");

};


async function mostrarResumoFinal(viagem) {
  const resumo = await gerarResumoViagem(viagem);

  viagemAtiva = false;

  $("btnIniciarViagem").style.display = "block";
  $("btnEncerrarViagem").style.display = "none";

  $("statusViagem").innerHTML =
    "✅ Última viagem encerrada.";

  $("resumoFinal").style.display = "block";
  $("cardViagem").style.display = "none";
  $("cardResumoDiarias").style.display = "none";
  $("cardDiarias").style.display = "none";



  $("resumoFinalConteudo").innerHTML = `

<div class="resumo-grid">

    <div class="item">
        <span>📅 Período</span>
        <strong>${fmtBR(viagem.inicio)} até ${fmtBR(viagem.fim)}</strong>
    </div>

    <div class="item">
        <span>🚛 KM Inicial</span>
        <strong>${viagem.kmInicio}</strong>
    </div>

    <div class="item">
        <span>🏁 KM Final</span>
        <strong>${viagem.kmFim}</strong>
    </div>

    <div class="item">
        <span>📍 KM Rodados</span>
        <strong>${resumo.kmRodados}</strong>
    </div>

    <div class="item">
        <span>📆 Dias Viajados</span>
        <strong>${resumo.diasViajados}</strong>
    </div>

    <div class="item">
        <span>😴 Folgas</span>
        <strong>${resumo.folgas}</strong>
    </div>

    <div class="item">
        <span>↩ Retorno</span>
        <strong>${fmtBR(resumo.retorno)}</strong>
    </div>

    <div class="item">
        <span>💰 Valor Diárias</span>
        <strong>R$ ${resumo.valorTotalDiarias.toFixed(2)}</strong>
    </div>

    <div class="item">
        <span>📦 Entregas</span>
        <strong>${resumo.entregas}</strong>
    </div>

    <div class="item">
        <span>⛽ Abastecimentos</span>
        <strong>${resumo.abastecimentos}</strong>
    </div>

    <div class="item">
        <span>🔧 Manutenções</span>
        <strong>${resumo.manutencoes}</strong>
    </div>

    <div class="item">
        <span>💵 Vales</span>
        <strong>R$ ${resumo.totalVales.toFixed(2)}</strong>
    </div>

    <div class="item">
        <span>🏢 Gastos Empresa</span>
        <strong>R$ ${resumo.totalGastosEmpresa.toFixed(2)}</strong>
    </div>

    <div class="item saldo">
        <span>💲 Saldo</span>
        <strong>R$ ${resumo.saldo.toFixed(2)}</strong>
    </div>

</div>

`;
}
function abrirModal(tipo) {

  acaoModal = tipo;

  const hoje = toISO(new Date());

  $("modalData").value = hoje;
  $("modalKm").value = "";
  $("modalObs").value = "";

  if (tipo === "iniciar") {

    $("tituloModal").textContent = "🚛 Nova Viagem";
    $("labelKm").textContent = "KM Inicial";

  } else {

    $("tituloModal").textContent = "🛑 Encerrar Viagem";
    $("labelKm").textContent = "KM Final";

  }

  $("modalViagem").style.display = "flex";

}
$("btnConfirmarModal").onclick = async () => {

  const km = Number($("modalKm").value);

  if (!km) {
    alert("Informe o KM.");
    return;
  }

  const data = $("modalData").value;
  console.log("Data escolhida no modal:", data);

  if (acaoModal === "iniciar") {

    const snapDiarias = await getDocs(
      collection(db, "usuarios", uid, "diarias")
    );

    for (const docSnap of snapDiarias.docs) {
      await deleteDoc(docSnap.ref);
    }

    diarias = [];
    renderDiarias();

    $("empresaDevia").value = 0;
    $("motoristaDevia").value = 0;
    $("diariasRecebidas").value = 0;
    $("valorDiaria").value = 100;

    $("resumoDiariasUI").textContent = "Sem pendências.";
    const idViagem = gerarIdViagem();
    await setDoc(viagemRef(), {
      idViagem,
      status: "ativa",
      inicio: data,
      fim: "",
      kmInicio: km,
      kmFim: null,

      empresaDevia: 0,
      motoristaDevia: 0,
      diariasRecebidas: 0,
      valorDiaria: 100,

      resumoDiarias: {},

      relatorioGerado: false,

      atualizadoEm: serverTimestamp()

    }, { merge: true });

  } else {

    const snap = await getDoc(viagemRef());

    if (!snap.exists()) return;

    const viagem = snap.data();

    await setDoc(viagemRef(), {
      status: "encerrada",
      inicio: viagem.inicio,
      fim: data,
      kmInicio: viagem.kmInicio,
      kmFim: km,
      relatorioGerado: false,
      atualizadoEm: serverTimestamp()
    }, { merge: true });

  }

  fecharModal();

  await carregarViagem();

  await atualizarStatusViagem();

};

function fecharModal() {

  $("modalViagem").style.display = "none";

}
$("btnEncerrarViagem").onclick = () => {

  abrirModal("encerrar");

};
$("btnCancelarModal").onclick = () => {

  fecharModal();

};

/* ========= SOMAR AUTOMATICAMENTE TODAS AS DIÁRIAS ========= */
async function carregarDiarias() {
  const q = query(collection(db, "usuarios", uid, "diarias"), orderBy("data", "asc"));
  const snap = await getDocs(q);

  diarias = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  renderDiarias();

  // SOMA AUTOMÁTICA DAS DIÁRIAS
  const totalRecebidas = diarias.reduce((s, d) => s + Number(d.qtd || 0), 0);
  $('diariasRecebidas').value = totalRecebidas;

  // recalcular resumo automaticamente
  recalcularResumo();

  // salvar automaticamente no servidor
  await setDoc(viagemRef(), {
    diariasRecebidas: totalRecebidas,
    atualizadoResumoEm: serverTimestamp()
  }, { merge: true });
}

async function atualizarEstruturaViagem() {

  const snap = await getDoc(viagemRef());

  if (!snap.exists()) return;

  const viagem = snap.data();

  const atualizacao = {};

  if (viagem.relatorioGerado === undefined)
    atualizacao.relatorioGerado = false;

  if (viagem.versaoRelatorio === undefined)
    atualizacao.versaoRelatorio = "2.0";

  if (viagem.numeroRelatorio === undefined)
    atualizacao.numeroRelatorio = "";

  if (Object.keys(atualizacao).length > 0) {
    await setDoc(viagemRef(), atualizacao, { merge: true });
  }

}

/* ========= Render tabela ========= */
function renderDiarias() {
  const tbody = $('tbodyDiarias');
  tbody.innerHTML = "";

  if (!diarias.length) {
    tbody.innerHTML = `<tr><td colspan="4">Nenhuma diária</td></tr>`;
    return;
  }

  diarias.forEach(d => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${fmtBR(d.data)}</td>
      <td>${d.qtd}</td>
      <td>R$ ${(d.qtd * Number($('valorDiaria').value)).toFixed(2)}</td>
      <td><button data-id="${d.id}" class="btn-red btn">Excluir</button></td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll("button").forEach(btn => {
    btn.onclick = async () => {
      await deleteDoc(doc(db, "usuarios", uid, "diarias", btn.dataset.id));
      carregarDiarias();
    };
  });
}

/* ========= Adicionar diária ========= */
$('addDiariaBtn').onclick = async () => {
  const data = $('diariaData').value;
  const qtd = Number($('diariaQtd').value);

  if (!data) { alert("Escolha a data."); return; }
  const viagemSnap = await getDoc(viagemRef());

  const viagem = viagemSnap.data();

  await addDoc(
    collection(db, "usuarios", uid, "diarias"),
     {  
      idViagem: viagem.idViagem,
      data, 
      qtd, 
      createdAt: serverTimestamp()
  });

  $('diariaData').value = "";
  $('diariaQtd').value = 1;

  carregarDiarias();
};

/* ========= Resumo de Diárias ========= */
function recalcularResumo() {
  const anteriorEmpresa = Number($('empresaDevia').value || 0);
  const anteriorMotorista = Number($('motoristaDevia').value || 0);
  const recebidas = Number($('diariasRecebidas').value || 0);

  const ini = $('viagemInicio').value;
  const fim = $('viagemFim').value;

  let viajados = 0;
  if (ini && fim) {
    viajados = Math.floor((parseISO(fim) - parseISO(ini)) / 86400000) + 1;
  }

  const prevNet = anteriorEmpresa - anteriorMotorista;
  const travelNet = viajados - recebidas;
  const totalNet = prevNet + travelNet;

  const empresaFinal = totalNet > 0 ? totalNet : 0;
  const motoristaFinal = totalNet < 0 ? Math.abs(totalNet) : 0;

  let texto = "";
  if (empresaFinal > 0) texto = `A empresa deve ${empresaFinal} diárias.`;
  else if (motoristaFinal > 0) texto = `O motorista deve ${motoristaFinal} diárias.`;
  else texto = "Sem pendências.";

  $('resumoDiariasUI').textContent = texto;

  return { empresaFinal, motoristaFinal, viajados, recebidas };
}

/* ========= Salvar resumo ========= */
$('salvarResumoBtn').onclick = async () => {
  await setDoc(viagemRef(), {
    empresaDevia: Number($('empresaDevia').value || 0),
    motoristaDevia: Number($('motoristaDevia').value || 0),
    diariasRecebidas: Number($('diariasRecebidas').value || 0),
    valorDiaria: Number($('valorDiaria').value || 100),
    resumoDiarias: recalcularResumo(),
    atualizadoEm: serverTimestamp()
  }, { merge: true });
  alert("Resumo salvo!");
};

/* ========= Limpar resumo ========= */
$('limparResumoBtn').onclick = async () => {
  if (!confirm("Limpar resumo?")) return;
  $('empresaDevia').value = 0;
  $('motoristaDevia').value = 0;
  $('diariasRecebidas').value = 0;
  $('valorDiaria').value = 100;
  $('resumoDiariasUI').textContent = "—";
  await setDoc(viagemRef(), {
    empresaDevia: 0, motoristaDevia: 0, diariasRecebidas: 0
  }, { merge: true });
};

/* ========= PDF ========= */
$('gerarPDFBtn').onclick = async () => {

    await gerarRelatorioOperacional(uid);

    await setDoc(
        viagemRef(),
        {
            relatorioGerado: true
        },
        { merge: true }
    );

    await atualizarStatusViagem();

    alert("Relatório Operacional gerado com sucesso!");

};


/* ========= Início ========= */
onAuthStateChanged(auth, async user => {
  if (!user) { location.href = "login.html"; return; }
  uid = user.uid;

  await atualizarEstruturaViagem();

  await carregarPerfil();
  await carregarViagem();
  await carregarDiarias();
  await atualizarStatusViagem();
  
});
