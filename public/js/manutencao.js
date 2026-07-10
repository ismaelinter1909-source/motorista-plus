
/* ========================= Firebase ========================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  getFirestore, doc, getDoc, addDoc, updateDoc, deleteDoc,
  collection, getDocs, query, orderBy, onSnapshot, serverTimestamp, setDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import {
  getStorage, ref as storageRef, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

const app = initializeApp({
  apiKey: "AIzaSyCnlpnTTJvJPZxuZdmpKQWbbHtvH72nMUU",
  authDomain: "motorista-plus-c53f4.firebaseapp.com",
  projectId: "motorista-plus-c53f4",
  storageBucket: "motorista-plus-c53f4.firebasestorage.app",
  messagingSenderId: "766097061342",
  appId: "1:766097061342:web:36d999bec6d9fe8c46994f",
  measurementId: "G-CBT2D0CXPN"
});

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const $ = id => document.getElementById(id);

let uid = null;
let manutencoes = [];
let editId = null;
let fotosParaUpload = [];
let fotosPreviewUrls = [];

/* ========================= Helpers ========================= */

const parseISO = iso => {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const toISO = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const fmtBR = iso => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

function calcularFolgasPelasFaixas(dias) {
  if (dias <= 7) return 1;
  if (dias <= 14) return 2;
  if (dias <= 21) return 3;
  if (dias <= 30) return 4;
  if (dias <= 37) return 5;
  if (dias <= 44) return 6;
  if (dias <= 52) return 7;
  if (dias <= 60) return 8;
  return Math.ceil(dias / 7);
}

function calcularRetornoFolga(iniISO, fimISO) {
  const ini = parseISO(iniISO);
  const fim = parseISO(fimISO);

  const dias = Math.round((fim - ini) / 86400000) + 1;
  const folgas = calcularFolgasPelasFaixas(dias);

  const primeiro = new Date(fim);
  primeiro.setDate(primeiro.getDate() + 1);

  const ultimo = new Date(fim);
  ultimo.setDate(ultimo.getDate() + folgas);

  const retorno = new Date(fim);
  retorno.setDate(retorno.getDate() + folgas + 1);

  return {
    dias,
    folgas,
    primeiroFolgaISO: toISO(primeiro),
    ultimoFolgaISO: toISO(ultimo),
    retornoISO: toISO(retorno)
  };
}

/* ========================= Fotos (Preview + Input) ========================= */

const inputFotos = $('fotoManutencao');
const previewDiv = $('previewFotos');

if (inputFotos) {
  /* ========= Preview & file handling (PNG → JPEG) ========= */
inputFotos.addEventListener('change', async (e) => {
  fotosParaUpload = Array.from(e.target.files || []);
  fotosPreviewUrls = [];
  previewDiv.innerHTML = "";

  for (const f of fotosParaUpload) {
    // CONVERTER PNG PARA JPEG SEMPRE
    const reader = new FileReader();

    const dataURL = await new Promise(resolve => {
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(f);
    });

    // Criar imagem temporária
    const img = new Image();
    await new Promise(resolve => {
      img.onload = resolve;
      img.src = dataURL;
    });

    // Converter tudo para JPEG menor
    const canvas = document.createElement("canvas");
    const MAX_WIDTH = 1200;
    const ratio = img.width / img.height;

    canvas.width = Math.min(MAX_WIDTH, img.width);
    canvas.height = canvas.width / ratio;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // SEMPRE salvar como JPEG (mesmo se original for PNG)
    const jpegURL = canvas.toDataURL("image/jpeg", 0.8);

    fotosPreviewUrls.push(jpegURL);

    const imgPrev = document.createElement("img");
    imgPrev.src = jpegURL;
    previewDiv.appendChild(imgPrev);
  }
});
}

/* ========================= Perfil ========================= */

async function carregarPerfil() {
  const snap = await getDoc(doc(db, "usuarios", uid));
  if (!snap.exists()) return;

  const p = snap.data();

  $('dadosUsuarioCard').innerHTML = `
    <div class="item"><strong>Motorista</strong>${p.nome}</div>
    <div class="item"><strong>Telefone</strong>${p.telefone}</div>
    <div class="item"><strong>Cavalo</strong>${p.placaCavalo}</div>
    <div class="item"><strong>Reboque</strong>${p.placaReboque}</div>
    <div class="item"><strong>Email</strong>${p.email}</div>
  `;
}

/* ========================= FOLGA (Salvar + Carregar) ========================= */

async function carregarFolga() {
  const snap = await getDoc(doc(db, "usuarios", uid, "folga", "dados"));
  if (!snap.exists()) return;

  const f = snap.data();

  $('inicioFolga').value = f.inicio || "";
  $('fimFolga').value = f.fim || "";
  $('diasFolga').value = f.folgas || "";
  $('retornoFolga').value = fmtBR(f.retorno);
}

async function salvarFolgaFirestore(info, ini, fim) {
  await setDoc(doc(db, "usuarios", uid, "folga", "dados"), {
    inicio: ini,
    fim: fim,
    folgas: info.folgas,
    retorno: info.retornoISO,
    atualizado: serverTimestamp()
  });
}

/* ========================= Botão Calcular Folga ========================= */

$('calcFolga').onclick = async () => {

  const ini = $('inicioFolga').value;
  const fim = $('fimFolga').value;

  if (!ini || !fim) {
    alert("Selecione as datas.");
    return;
  }

  const info = calcularRetornoFolga(ini, fim);

  $('diasFolga').value = info.folgas;
  $('retornoFolga').value = fmtBR(info.retornoISO);

  await salvarFolgaFirestore(info, ini, fim);

  alert("Folga salva com sucesso!");
};

/* ========================= Stream Manutenções ========================= */

function iniciarStream() {
  const refq = query(collection(db, "usuarios", uid, "manutencoes"), orderBy("criadoEm", "desc"));

  onSnapshot(refq, snap => {
    manutencoes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderLista();
  });
}

/* ========================= Render Lista ========================= */

function renderLista() {

  if (!manutencoes.length) {
    $('lista').innerHTML = `<li>(nenhuma manutenção)</li>`;
    return;
  }

  $('lista').innerHTML = manutencoes.map(m => `
    <li>
      <div style="flex:1">
        <div style="font-weight:700">Manutenção — ${fmtBR(m.data)}</div>
        <div style="opacity:.7">Cavalo: ${m.cavalo || "—"} — Reboque: ${m.reboque || "—"}</div>
        ${m.fotos?.length ?
          `<div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">
            ${m.fotos.map(f => `<img src="${f}" style="width:60px;height:auto;border-radius:4px">`).join("")}
          </div>` : ""
        }
      </div>

      <div style="display:flex;gap:8px">
        <button class="btn" data-id="${m.id}" data-act="edit">Editar</button>
        <button class="btn-red" data-id="${m.id}" data-act="del">Excluir</button>
      </div>
    </li>
  `).join("");

  document.querySelectorAll("button[data-act]").forEach(btn => {
    btn.onclick = async () => {

      const id = btn.dataset.id;
      const act = btn.dataset.act;

      if (act === "del") {
        if (confirm("Excluir esta manutenção?")) {
          await deleteDoc(doc(db, "usuarios", uid, "manutencoes", id));
        }
      }

      if (act === "edit") {
        const m = manutencoes.find(x => x.id === id);

        $('dataManutencao').value = m.data;
        $('descCavalo').value = m.cavalo || "";
        $('descReboque').value = m.reboque || "";

        previewDiv.innerHTML = "";
        fotosParaUpload = [];
        fotosPreviewUrls = [];

        if (m.fotos?.length) {
          m.fotos.forEach(url => {
            const img = document.createElement("img");
            img.src = url;
            img.style.width = "80px";
            img.style.borderRadius = "8px";
            previewDiv.appendChild(img);
          });
        }

        editId = id;
        $('cancelarEdicao').style.display = "block";
      }
    }
  });
}

/* ========================= Redimensionar Imagens ========================= */

async function resizeFile(file, maxWidth = 1200, quality = 0.85) {
  return new Promise((resolve) => {

    const img = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      img.onload = () => {

        const ratio = img.width / img.height;

        const w = Math.min(maxWidth, img.width);
        const h = Math.round(w / ratio);

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);

        canvas.toBlob(blob => {
          const newFile = new File([blob], file.name, { type: "image/jpeg" });
          resolve(newFile);
        }, "image/jpeg", quality);
      };

      img.src = reader.result;
    };

    reader.readAsDataURL(file);
  });
}

/* ========================= Upload Fotos ========================= */
async function uploadFilesAndGetUrls(filesArray){
  if(!filesArray.length) return [];

  const urls = [];

  for (let i = 0; i < fotosPreviewUrls.length; i++) {

    const base64 = fotosPreviewUrls[i];

    // Converte Base64 → Blob JPEG
    const blob = await (await fetch(base64)).blob();

    const filename = `foto_${Date.now()}_${i}.jpg`;
    const path = `manutencoes/${uid}/${filename}`;

    const r = storageRef(storage, path);

    const snap = await uploadBytes(r, blob);
    const url = await getDownloadURL(snap.ref);

    urls.push(url);
  }

  return urls;
}

/* ========================= Salvar Manutenção ========================= */

$('salvar').onclick = async () => {

  const data = $('dataManutencao').value;
  const cavalo = $('descCavalo').value.trim();
  const reboque = $('descReboque').value.trim();

  if (!data || (!cavalo && !reboque)) {
    alert("Preencha a data e pelo menos um campo.");
    return;
  }

  $('status').style.color = "#ccc";
  $('status').textContent = "Salvando...";

  let fotosURLs = [];

  try {
    fotosURLs = await uploadFilesAndGetUrls(fotosParaUpload);
  } catch (err) {
    $('status').style.color = "red";
    $('status').textContent = "Erro ao enviar foto.";
    return;
  }

  const registro = {
    data,
    cavalo,
    reboque,
    fotos: fotosURLs,
    criadoEm: serverTimestamp()
  };

  try {

    if (editId) {
      await updateDoc(doc(db, "usuarios", uid, "manutencoes", editId), registro);

      $('status').textContent = "Atualizado!";
      editId = null;
      $('cancelarEdicao').style.display = "none";

    } else {
      await addDoc(collection(db, "usuarios", uid, "manutencoes"), registro);
      $('status').textContent = "Salvo!";
    }

  } catch (err) {
    $('status').style.color = "red";
    $('status').textContent = "Erro ao salvar manutenção.";
    return;
  }

  $('dataManutencao').value = "";
  $('descCavalo').value = "";
  $('descReboque').value = "";
  fotosParaUpload = [];
  fotosPreviewUrls = [];
  previewDiv.innerHTML = "";
};

/* ========================= Cancelar Edição ========================= */

$('cancelarEdicao').onclick = () => {
  editId = null;
  $('cancelarEdicao').style.display = "none";
  $('dataManutencao').value = "";
  $('descCavalo').value = "";
  $('descReboque').value = "";
  previewDiv.innerHTML = "";
  fotosParaUpload = [];
  fotosPreviewUrls = [];
};

/* ========================= Apagar Todos ========================= */

$('apagarTodos').onclick = async () => {

  if (!confirm("Deseja apagar TODOS os registros?")) return;

  const snap = await getDocs(collection(db, "usuarios", uid, "manutencoes"));
  const jobs = snap.docs.map(d => deleteDoc(d.ref));

  await Promise.all(jobs);

  alert("Tudo apagado!");
};

/* ========================= PDF COMPLETO ========================= */

$('pdfCompleto').onclick = async () => {

  await carregarFolga();

  const { jsPDF } = window.jspdf;
  const docPDF = new jsPDF({ unit: 'pt', format: 'a4' });

  let y = 40;
  const left = 40;
  const pageWidth = docPDF.internal.pageSize.getWidth();

  /* Cabeçalho */
  docPDF.setFontSize(18).setFont(undefined, "bold");
  docPDF.text("Relatório Completo — Motorista Plus", left, y);
  y += 30;

  /* Perfil */
  docPDF.setFontSize(12).setFont(undefined, "bold");
  docPDF.text("Dados do Motorista:", left, y);
  y += 18;

  const itens = document.querySelectorAll("#dadosUsuarioCard .item");
  itens.forEach(i => {
    docPDF.setFontSize(11);
    docPDF.text(i.innerText.replace(/\n/g, " - "), left, y);
    y += 16;
  });

  y += 20;

  /* Folga */
  const snap = await getDoc(doc(db, "usuarios", uid, "folga", "dados"));
  const folga = snap.exists() ? snap.data() : null;

  docPDF.setFontSize(12).setFont(undefined, "bold");
  docPDF.text("Folga:", left, y);
  y += 18;

  docPDF.setFontSize(11);
  docPDF.text(`Início: ${folga ? fmtBR(folga.inicio) : "—"}`, left, y); y += 16;
  docPDF.text(`Fim: ${folga ? fmtBR(folga.fim) : "—"}`, left, y); y += 16;
  docPDF.text(`Dias de folga: ${folga ? folga.folgas : "—"}`, left, y); y += 16;
  docPDF.text(`Retorno: ${folga ? fmtBR(folga.retorno) : "—"}`, left, y); y += 26;

  /* Tabela Manutenções */
  docPDF.autoTable({
    startY: y,
    head: [["Data", "Cavalo", "Reboque", "Fotos"]],
    body: manutencoes.map(m => [
      fmtBR(m.data),
      m.cavalo || "—",
      m.reboque || "—",
      `${(m.fotos?.length || 0)} foto(s)`
    ]),
    margin: { left, right: left },
    headStyles: { fillColor: [243, 146, 32] },
    styles: { fontSize: 10 }
  });

  y = docPDF.autoTable.previous.finalY + 30;

  /* Fotos das manutenções */
  const size = 180;

  /* =========================
      FOTOS NO PDF (CORRIGIDO)
   ========================= */

for (const m of manutencoes) {

  if (!m.fotos || m.fotos.length === 0) continue;

  docPDF.addPage();
  y = 40;

  docPDF.setFontSize(14).setFont(undefined, "bold");
  docPDF.text(`Manutenção — ${fmtBR(m.data)}`, left, y);
  y += 20;

  for (const url of m.fotos) {

    try {
      // baixar imagem
      const response = await fetch(url, { mode: "cors" });
      const blob = await response.blob();

      // converter em base64
      const reader = new FileReader();
      const base64 = await new Promise(resolve => {
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });

      // verificar tamanho máximo na página
      const imgW = 250; 
      const imgH = 250;

      if (y + imgH > 750) {
        docPDF.addPage();
        y = 40;
      }

      docPDF.addImage(base64, "JPEG", left, y, imgW, imgH);
      y += imgH + 20;

    } catch (err) {
      console.error("Erro ao inserir foto no PDF:", err);

      docPDF.setFontSize(10).setFont(undefined, "normal");
      docPDF.text("Erro ao carregar imagem", left, y);
      y += 20;
    }
  }
}


  /* Assinatura */
  docPDF.line(pageWidth / 2 - 120, y, pageWidth / 2 + 120, y);
  docPDF.text("Assinatura do Motorista", pageWidth / 2, y + 16, { align: "center" });

  docPDF.save("manutencoes.pdf");
};

/* ========================= AUTH ========================= */

onAuthStateChanged(auth, async user => {
  if (!user) {
    location.href = "login.html";
    return;
  }

  uid = user.uid;

  await carregarPerfil();
  await carregarFolga();
  iniciarStream();
});
