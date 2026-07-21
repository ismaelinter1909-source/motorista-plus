//========================================================
// PDF OPERACIONAL
// Motorista Plus
//========================================================

//========================================================
// IMPORTAÇÕES
//====
import { db } from "./firebase.js";
import {
    doc,
    getDoc,
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

//========================================================
// CARREGAR DADOS DA VIAGEM
//========================================================

async function carregarDadosRelatorio(uid){
       const perfilSnap = await getDoc(
        doc(db,"usuarios",uid)
    );

    if(!perfilSnap.exists()){
        return null;
    }

    const viagemSnap = await getDoc(
        doc(db,"usuarios",uid,"viagemAtual","dados")
    );
//========================================================
// ENTREGAS
//========================================================

const entregasSnap = await getDocs(
    collection(db, "usuarios", uid, "entregas")
);

const entregas = [];

entregasSnap.forEach(doc => {
    entregas.push(doc.data());
});
    
//========================================================
// ABASTECIMENTOS
//========================================================

const abastecimentosSnap = await getDocs(
    collection(db, "usuarios", uid, "abastecimentos")
);

const abastecimentos = [];

abastecimentosSnap.forEach(doc => {
    abastecimentos.push(doc.data());
});
//========================================================
// MANUTENÇÕES
//========================================================

const manutencoesSnap = await getDocs(
    collection(db, "usuarios", uid, "manutencoes")
);

const manutencoes = [];

manutencoesSnap.forEach(doc => {
    manutencoes.push(doc.data());
});
//========================================================
// DIÁRIAS
//========================================================

const diariasSnap = await getDocs(
    collection(db, "usuarios", uid, "diarias")
);

const diarias = [];

diariasSnap.forEach(doc => {
    diarias.push(doc.data());
});

//========================================================
// VALES
//========================================================

const valesSnap = await getDocs(
    collection(db, "usuarios", uid, "vales")
);

const vales = [];

valesSnap.forEach(doc => {
    vales.push(doc.data());
});
//========================================================
// TOTAL DE VALES
//========================================================

const totalVales = vales.reduce((total, vale) => {
    return total + Number(vale.valor || 0);
}, 0);
//========================================================
// GASTOS DA EMPRESA
//========================================================

const gastosEmpresaSnap = await getDocs(
    collection(db, "usuarios", uid, "gastosEmpresa")
);

const gastosEmpresa = [];

gastosEmpresaSnap.forEach(doc => {
    gastosEmpresa.push(doc.data());
});
//========================================================
// TOTAL GASTOS DA EMPRESA
//========================================================

const totalGastosEmpresa = gastosEmpresa.reduce((total, gasto) => {
    return total + Number(gasto.valor || 0);
}, 0);
//========================================================
// SALDO DA VIAGEM
//========================================================

const saldo = totalVales - totalGastosEmpresa;
return {

    perfil: perfilSnap.data(),

    viagem: viagemSnap.exists()
        ? viagemSnap.data()
        : {},

    entregas,
    abastecimentos,
    manutencoes,
    diarias,
    vales,
    gastosEmpresa,
    totalVales,
    totalGastosEmpresa,
    saldo

};

}

//========================================================
// FUNÇÃO PRINCIPAL
//========================================================
export async function gerarRelatorioOperacional(uid){

    const dados = await carregarDadosRelatorio(uid);

    if(!dados){
        alert("Motorista não encontrado.");
        return;
    }

    const { jsPDF } = window.jspdf;

    const pdf = new jsPDF({
        orientation:"portrait",
        unit:"mm",
        format:"a4"
    });

    desenharCabecalho(pdf);

    desenharFaixaInformacoes(
        pdf,
        dados.perfil,
        dados.viagem
    );

    desenharResumoViagem(
        pdf,
        dados.viagem
    );

    desenharMovimentacaoViagem(
        pdf,
        dados
    );

//========================================================
// GERAR ARQUIVO
//========================================================

    pdf.save("Relatorio_Operacional.pdf");
}
//========================================================
// CABEÇALHO DO RELATÓRIO
//========================================================

function desenharCabecalho(pdf){

    // Fundo laranja
    pdf.setFillColor(243,146,32);
    pdf.rect(0,0,210,22,"F");

    // Nome do sistema
    pdf.setFont("helvetica","bold");
    pdf.setFontSize(24);
    pdf.setTextColor(255);

    pdf.text("MOTORISTA",12,10);

    pdf.setTextColor(0);
    pdf.text("PLUS",58,10);

    // Título

    pdf.setFontSize(18);
    pdf.setTextColor(255);

   pdf.text(
    "RELATÓRIO OPERACIONAL",
    105,
    14,
    { align: "center" }
);

    // Linha inferior

    pdf.setDrawColor(230);

    pdf.line(
        10,
        28,
        200,
        28
    );

}
//========================================================
// FAIXA DE IDENTIFICAÇÃO DA VIAGEM
//========================================================

function desenharFaixaInformacoes(pdf, perfil, viagem){

    const kmRodado =
        Number(viagem.kmFim || 0) -
        Number(viagem.kmInicio || 0);

    pdf.setFillColor(248,248,248);
    pdf.roundedRect(10,32,190,22,2,2,"F");

    pdf.setDrawColor(220);
    pdf.roundedRect(10,32,190,22,2,2);

    pdf.setFont("helvetica","bold");
    pdf.setFontSize(8);

    pdf.text("PERÍODO",14,39);
    pdf.text("MOTORISTA",58,39);
    pdf.text("CAVALO",118,39);
    pdf.text("CARRETA",148,39);
    pdf.text("KM",182,39);

    pdf.setFont("helvetica","normal");

    pdf.text(
        `${viagem.inicio || "-"}  até  ${viagem.fim || "-"}`,
        14,
        47
    );

    pdf.text(
        perfil.nome || "-",
        58,
        47
    );

    pdf.text(
        perfil.placaCavalo || "-",
        118,
        47
    );

    pdf.text(
        perfil.placaReboque || "-",
        148,
        47
    );

    pdf.text(
        `${kmRodado} km`,
        182,
        47
    );

}
//========================================================
// RESUMO DA VIAGEM
//========================================================
function desenharResumoViagem(pdf, viagem){


    //===========================
    // CÁLCULOS DA VIAGEM
    //===========================

    const kmInicial = Number(viagem.kmInicio || 0);
    const kmFinal = Number(viagem.kmFim || 0);
    const kmRodados = kmFinal - kmInicial;

    let diasViajados = "-";
    let folgas = "-";
    let retorno = "-";

    if (viagem.inicio && viagem.fim) {

        const dataInicio = new Date(viagem.inicio);
        const dataFim = new Date(viagem.fim);

        diasViajados =
            Math.floor((dataFim - dataInicio) / 86400000) + 1;

        folgas = Math.ceil(diasViajados / 7);

        const dataRetorno = new Date(dataFim);

        dataRetorno.setDate(
            dataRetorno.getDate() + folgas + 1
        );

        retorno = dataRetorno.toLocaleDateString("pt-BR");
    }


    // Cabeçalho do bloco
    pdf.setFillColor(243,146,32);
    pdf.rect(10,60,190,8,"F");

    pdf.setFont("helvetica","bold");
    pdf.setFontSize(12);
    pdf.setTextColor(255);

   pdf.text(
    "RESUMO DA VIAGEM",
    105,
    66,
    { align: "center" }
);
    //========================================================
    // CARDS DO RESUMO DA VIAGEM
    //========================================================

    // Primeira linha
    desenharCard(pdf, 15, 75, 42, 18, "INÍCIO", viagem.inicio || "-");
    desenharCard(pdf, 61, 75, 42, 18, "FIM", viagem.fim || "-");
    desenharCard(pdf, 107, 75, 42, 18, "DIAS", diasViajados);
    desenharCard(pdf, 153, 75, 42, 18, "FOLGAS", folgas);

    // Segunda linha
    desenharCard(pdf, 15, 98, 42, 18, "RETORNO", retorno);
    desenharCard(pdf, 61, 98, 42, 18, "KM INICIAL", kmInicial.toLocaleString("pt-BR"));
    desenharCard(pdf, 107, 98, 42, 18, "KM FINAL", kmFinal.toLocaleString("pt-BR"));
    desenharCard(pdf, 153, 98, 42, 18, "KM RODADOS", kmRodados.toLocaleString("pt-BR"));

    }
//========================================================
// CARD DE INFORMAÇÃO
//========================================================

function desenharCard(pdf, x, y, largura, altura, titulo, valor){

    // Fundo
    pdf.setFillColor(242,242,242);
    pdf.roundedRect(x, y, largura, altura, 2, 2, "F");

    // Borda
    pdf.setDrawColor(220);
    pdf.roundedRect(x, y, largura, altura, 2, 2);

    // Título
    pdf.setFont("helvetica","bold");
    pdf.setFontSize(7);
    pdf.setTextColor(120);

   pdf.text(
    titulo,
    x + (largura / 2),
    y + 6,
    {
        align: "center"
    }
    );

    // Valor
    pdf.setFont("helvetica","bold");

    if (String(valor).startsWith("R$")) {
        pdf.setFontSize(9);
    } else {
        pdf.setFontSize(12);
    }

    pdf.setTextColor(0);

    pdf.text(
    String(valor),
    x + (largura / 2),
    y + 15,
    {
        align: "center"
    }
    );
            
    }
//========================================================
// MOVIMENTAÇÃO DA VIAGEM
//========================================================

function desenharMovimentacaoViagem(pdf, dados){
     // Cabeçalho
    pdf.setFillColor(243,146,32);
    pdf.rect(10,125,190,8,"F");

    pdf.setFont("helvetica","bold");
    pdf.setFontSize(12);
    pdf.setTextColor(255);

    pdf.text(
        "MOVIMENTAÇÃO DA VIAGEM",
        105,
        131,
        { align:"center" }
    );
    
// Primeira linha
desenharCard(
    pdf,
    15,
    140,
    42,
    18,
    "ENTREGAS",
    dados.entregas.length
);

desenharCard(
    pdf,
    61,
    140,
    42,
    18,
    "ABAST.",
    dados.abastecimentos.length
);

desenharCard(
    pdf,
    107,
    140,
    42,
    18,
    "MANUT.",
    dados.manutencoes.length
);


desenharCard(
    pdf,
    153,
    140,
    42,
    18,
    "DIÁRIAS",
    dados.diarias.length
);
// Segunda linha
desenharCard(
    pdf,
    15,
    163,
    42,
    18,
    "VALES",
    dados.totalVales.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    })
);

desenharCard(
    pdf,
    61,
    163,
    42,
    18,
    "GASTOS",
    dados.totalGastosEmpresa.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    })
);

desenharCard(
    pdf,
    107,
    163,
    42,
    18,
    "SALDO",
    dados.saldo.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    })
);

}
    