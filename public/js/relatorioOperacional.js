import { db } from "./firebase.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

export async function gerarRelatorioOperacional(uid) {

    console.log("Gerando relatório operacional...");

    const motoristaSnap = await getDoc(
        doc(db, "usuarios", uid)
    );

    if (!motoristaSnap.exists()) {
        alert("Motorista não encontrado.");
        return;
    }

    const perfil = motoristaSnap.data();

    // ===== Cria o PDF =====

    const { jsPDF } = window.jspdf;

    const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
    });

    // ======================================
// CABEÇALHO
// ======================================

pdf.setFillColor(243,146,32);
pdf.rect(0,0,210,18,"F");

pdf.setFont("helvetica","bold");
pdf.setFontSize(24);

pdf.setTextColor(255);
pdf.setFont("helvetica","bold");

pdf.text("Motorista",12,12);

pdf.setTextColor(243,146,32);
pdf.text("Plus",53,12);

pdf.setFontSize(18);

pdf.setTextColor(255);

pdf.text("RELATÓRIO DE",135,8);
pdf.text("FECHAMENTO DE VIAGEM",112,16);

pdf.setTextColor(0);

pdf.setFontSize(11);


pdf.setDrawColor(243,146,32);
    // Data
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(11);

    pdf.text(
        `Gerado em: ${new Date().toLocaleString("pt-BR")}`,
        12,
        28
    );
    pdf.setDrawColor(243,146,32);

pdf.setLineWidth(0.5);

pdf.line(
    10,
    33,
    200,
    33
);


// ======================================
// DADOS DO MOTORISTA
// ======================================

pdf.setFillColor(243,146,32);
pdf.rect(10,38,190,8,"F");

pdf.setFontSize(12);
pdf.setTextColor(255);
pdf.text(
    "1. DADOS DO MOTORISTA",
    14,
    44
);

pdf.setTextColor(0);

pdf.text("1. DADOS DO MOTORISTA",14,44);

pdf.setTextColor(0);

pdf.setDrawColor(220);
pdf.rect(10,46,190,32);
pdf.setFontSize(10);

pdf.setTextColor(0);
// Coluna esquerda

pdf.setFont("helvetica","bold");
pdf.text("Motorista:",15,56);

pdf.setFont("helvetica","normal");
pdf.text(perfil.nome || "-",42,56);

pdf.setFont("helvetica","bold");
pdf.text("Telefone:",15,64);

pdf.setFont("helvetica","normal");
pdf.text(perfil.telefone || "-",42,64);

pdf.setFont("helvetica","bold");
pdf.text("E-mail:",15,72);

pdf.setFont("helvetica","normal");
pdf.text(perfil.email || "-",42,72);
pdf.setFont("helvetica","bold");
pdf.text("Cavalo:",110,56);

pdf.setFont("helvetica","normal");
pdf.text(perfil.placaCavalo || "-",136,56);

pdf.setFont("helvetica","bold");
pdf.text("Reboque:",110,64);

pdf.setFont("helvetica","normal");
pdf.text(perfil.placaReboque || "-",136,64);

pdf.setFontSize(11);

pdf.setTextColor(0);

    // Salvar
    pdf.save("Relatorio.pdf");

}