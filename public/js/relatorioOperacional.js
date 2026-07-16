import { db } from "./firebase.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

export async function gerarRelatorioOperacional(uid) {

    console.log("Gerando relatório operacional...");

    // Busca o perfil do motorista
    const snap = await getDoc(doc(db, "usuarios", uid));

    if (!snap.exists()) {
        alert("Motorista não encontrado.");
        return;
    }

    const perfil = snap.data();

    // Busca os dados da viagem atual
    const viagemSnap = await getDoc(
        doc(db, "usuarios", uid, "viagemAtual", "dados")
    );

    const viagem = viagemSnap.exists()
        ? viagemSnap.data()
        : {};

    // Cria o PDF
    const { jsPDF } = window.jspdf;

    const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
    });

    // Desenha as partes do relatório
    desenharCabecalho(pdf);

    desenharDadosMotorista(pdf, perfil);

    desenharResumoViagem(pdf, viagem);

    // Salva o PDF
    pdf.save("Relatorio_Operacional.pdf");

}

// ======================================================
// CABEÇALHO
// ======================================================

function desenharCabecalho(pdf){

    pdf.setFillColor(243,146,32);
    pdf.rect(0,0,210,18,"F");

    pdf.setFont("helvetica","bold");
    pdf.setFontSize(24);

    pdf.setTextColor(255);
    pdf.text("Motorista",12,12);

    pdf.setTextColor(243,146,32);
    pdf.text("Plus",53,12);

    pdf.setTextColor(255);
    pdf.setFontSize(18);

    pdf.text("RELATÓRIO DE",132,8);
    pdf.text("FECHAMENTO DE VIAGEM",108,16);

    pdf.setTextColor(0);

    pdf.setFontSize(11);

    pdf.text(
        `Gerado em: ${new Date().toLocaleString("pt-BR")}`,
        12,
        28
    );

    pdf.setDrawColor(243,146,32);
    pdf.setLineWidth(.5);
    pdf.line(10,33,200,33);

}

// ======================================================
// DADOS DO MOTORISTA
// ======================================================

function desenharDadosMotorista(pdf, perfil){

    pdf.setFillColor(243,146,32);
    pdf.rect(10,38,190,8,"F");

    pdf.setTextColor(255);
    pdf.setFontSize(12);

    pdf.text("1. DADOS DO MOTORISTA",14,44);

    pdf.setDrawColor(220);
    pdf.rect(10,46,190,32);

    pdf.setTextColor(0);
    pdf.setFontSize(10);

    // Esquerda

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

    // Direita

    pdf.setFont("helvetica","bold");
    pdf.text("Cavalo:",110,56);

    pdf.setFont("helvetica","normal");
    pdf.text(perfil.placaCavalo || "-",136,56);

    pdf.setFont("helvetica","bold");
    pdf.text("Reboque:",110,64);

    pdf.setFont("helvetica","normal");
    pdf.text(perfil.placaReboque || "-",136,64);

}

// ======================================================
// RESUMO DA VIAGEM
// ======================================================

function desenharResumoViagem(pdf, viagem){

    pdf.setFillColor(243,146,32);
    pdf.rect(10,85,190,8,"F");

    pdf.setFont("helvetica","bold");
    pdf.setFontSize(12);
    pdf.setTextColor(255);

    pdf.text("2. RESUMO DA VIAGEM",14,91);

    pdf.setDrawColor(220);
    pdf.rect(10,93,190,35);

    pdf.setTextColor(0);
    pdf.setFontSize(10);

    const kmRodado =
        (viagem.kmFim || 0) -
        (viagem.kmInicio || 0);

    let dias = "-";
    let folgas = "-";
    let retorno = "-";

    if(viagem.inicio && viagem.fim){

        const inicio = new Date(viagem.inicio);
        const fim = new Date(viagem.fim);

        dias =
            Math.floor((fim-inicio)/86400000)+1;

        folgas = Math.ceil(dias/7);

        const retornoData = new Date(fim);

        retornoData.setDate(
            retornoData.getDate()+folgas+1
        );

        retorno =
            retornoData.toLocaleDateString("pt-BR");
    }

    pdf.text("Período",18,102);
    pdf.text("KM Inicial",75,102);
    pdf.text("KM Final",118,102);
    pdf.text("KM Rodado",160,102);

    pdf.text(
        `${viagem.inicio || "-"} até ${viagem.fim || "-"}`,
        18,
        110
    );

    pdf.text(String(viagem.kmInicio ?? "-"),82,110);

    pdf.text(String(viagem.kmFim ?? "-"),123,110);

    pdf.text(String(kmRodado),168,110);

    pdf.text("Dias",18,123);
    pdf.text("Folgas",82,123);
    pdf.text("Retorno",145,123);

    pdf.text(String(dias),18,131);

    pdf.text(String(folgas),82,131);

    pdf.text(retorno,145,131);

}