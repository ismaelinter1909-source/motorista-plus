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

async function carregarDadosRelatorio(uid) {
    const perfilSnap = await getDoc(
        doc(db, "usuarios", uid)
    );

    if (!perfilSnap.exists()) {
        return null;
    }

    const viagemSnap = await getDoc(
        doc(db, "usuarios", uid, "viagemAtual", "dados")
    );
    const viagem = viagemSnap.data();
    console.log("Dados da viagem:", viagem);
    //========================================================
    // ENTREGAS
    //========================================================

    const entregasSnap = await getDocs(
        collection(db, "usuarios", uid, "entregas")
    );

    const entregas = entregasSnap.docs
        .map(doc => doc.data())
        .filter(e => e.idViagem === viagem.idViagem);

    //========================================================
    // ABASTECIMENTOS
    //========================================================

    const abastecimentosSnap = await getDocs(
        collection(db, "usuarios", uid, "abastecimentos")
    );

    const abastecimentos = abastecimentosSnap.docs
        .map(doc => doc.data())
        .filter(a => a.idViagem === viagem.idViagem);
    //========================================================
    // MANUTENÇÕES
    //========================================================

    const manutencoesSnap = await getDocs(
        collection(db, "usuarios", uid, "manutencoes")
    );

    const manutencoes = manutencoesSnap.docs
        .map(doc => doc.data())
        .filter(m => m.idViagem === viagem.idViagem);
    //========================================================
    // DIÁRIAS
    //========================================================

    const diariasSnap = await getDocs(
        collection(db, "usuarios", uid, "diarias")
    );

    const diarias = diariasSnap.docs
        .map(doc => doc.data())
        .filter(d => d.idViagem === viagem.idViagem);

    const totalDiarias = diarias.reduce((total, diaria) => {
        return total + Number(diaria.qtd || 0);
    }, 0);
    //========================================================
    // VALES
    //========================================================

    const valesSnap = await getDocs(
        collection(db, "usuarios", uid, "vales")
    );

    const vales = valesSnap.docs
        .map(doc => doc.data())
        .filter(v => v.idViagem === viagem.idViagem);
    //========================================================
    // TOTAL DE VALES
    //========================================================

    const totalVales = vales.reduce((total, vale) => {
        return total + Number(vale.valor || 0);
    }, 0);
    //========================================================
    // GASTOS DA EMPRESA
    //========================================================

    const gastosSnap = await getDocs(
        collection(db, "usuarios", uid, "gastos")
    );

    const gastosEmpresa = gastosSnap.docs
        .map(doc => doc.data())
        .filter(g => g.idViagem === viagem.idViagem);
    //======================================================
    // TOTAL GASTOS DA EMPRESA
    //========================================================

    const totalGastosEmpresa = gastosEmpresa.reduce((total, gasto) => {
        return total + Number(gasto.valor || 0);
    }, 0);

    //========================================================
    // VALOR TOTAL DAS DIÁRIAS
    //========================================================

    const valorTotalDiarias =
        totalDiarias * Number(viagem.valorDiaria || 0);
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
        saldo,
        totalDiarias,
        valorTotalDiarias

    };

}

//========================================================
// FUNÇÃO PRINCIPAL
//========================================================
export async function gerarRelatorioOperacional(uid) {

    const dados = await carregarDadosRelatorio(uid);

    if (!dados) {
        alert("Motorista não encontrado.");
        return;
    }

    const { jsPDF } = window.jspdf;

    const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
    });

    desenharCabecalho(pdf, dados);

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
    desenharResumoFinanceiro(
        pdf,
        dados
    );
    desenharObservacoes(
        pdf,
        dados
    );

    desenharAssinatura(
        pdf
    );
    pdf.addPage();

    desenharCabecalhoEntregas(pdf, dados);

    desenharTabelaEntregas(pdf, dados);

    pdf.addPage();

    desenharCabecalhoAbastecimentos(pdf, dados);

    desenharTabelaAbastecimentos(pdf, dados);

    pdf.addPage();

    desenharCabecalhoGastosVales(pdf, dados);

    desenharTabelaGastosVales(pdf, dados);

    //========================================================
    // GERAR ARQUIVO
    //========================================================

    pdf.save("Relatorio_Operacional.pdf");
}
/*========função data=====*/
function formatarData(data) {

    if (!data) return "-";

    const [ano, mes, dia] = data.split("-");

    return `${dia}/${mes}/${ano}`;

}
//========================================================
// CABEÇALHO DO RELATÓRIO
//========================================================

function desenharCabecalho(pdf, dados) {
    const cabecalho = new Image();
    cabecalho.src = "./img/cabecalho-relatorio.png";

    // Cabeçalho
    pdf.addImage(
        cabecalho,
        "PNG",
        0,
        0,
        210,
        35
    );

    // Número do relatório
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(255);

    pdf.text(
        `Nº ${dados.viagem.numeroRelatorio || "000001"}`,
        176,
        21
    );

    // Data de emissão
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(60);

    const agora = new Date();

    pdf.text(
        `DATA DE EMISSÃO: ${agora.toLocaleDateString("pt-BR")} ${agora.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit"
        })}`,
        12,
        36
    );

    // Versão do relatório
    pdf.text(
        `VERSÃO: ${dados.viagem.versaoRelatorio || "2.0"}`,
        176,
        36
    );

    // Linha separadora
    pdf.setDrawColor(220);

    pdf.line(
        0,
        40,
        210,
        40
    );

}
//========================================================
// FAIXA DE IDENTIFICAÇÃO DA VIAGEM
//========================================================

function desenharFaixaInformacoes(pdf, perfil, viagem) {

    const kmRodado =
        Number(viagem.kmFim || 0) -
        Number(viagem.kmInicio || 0);

    pdf.setFillColor(248, 248, 248);
    pdf.roundedRect(10, 32, 190, 22, 2, 2, "F");

    pdf.setDrawColor(220);
    pdf.roundedRect(10, 32, 190, 22, 2, 2);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);

    pdf.text("PERÍODO", 14, 39);
    pdf.text("MOTORISTA", 58, 39);
    pdf.text("CAVALO", 118, 39);
    pdf.text("CARRETA", 148, 39);
    pdf.text("KM", 182, 39);

    pdf.setFont("helvetica", "normal");

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
function desenharResumoViagem(pdf, viagem) {


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

        const parseISO = (iso) => {
            const [y, m, d] = iso.split("-").map(Number);
            return new Date(y, m - 1, d);
        };

        const dataInicio = parseISO(viagem.inicio);
        const dataFim = parseISO(viagem.fim);

        diasViajados =
            Math.floor((dataFim - dataInicio) / 86400000) + 1;

        folgas = Math.ceil(diasViajados / 7);

        const dataRetorno = new Date(dataFim);

        dataRetorno.setDate(
            dataRetorno.getDate() + folgas + 1
        );
        console.log({
            diasViajados,
            folgas,
            retorno: dataRetorno
        });
        retorno = dataRetorno.toLocaleDateString("pt-BR");
    }


    // Cabeçalho do bloco
    pdf.setFillColor(243, 146, 32);
    pdf.rect(10, 60, 190, 8, "F");

    pdf.setFont("helvetica", "bold");
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

function desenharCard(pdf, x, y, largura, altura, titulo, valor) {

    // Fundo
    pdf.setFillColor(242, 242, 242);
    pdf.roundedRect(x, y, largura, altura, 2, 2, "F");

    // Borda
    pdf.setDrawColor(220);
    pdf.roundedRect(x, y, largura, altura, 2, 2);

    // Título
    pdf.setFont("helvetica", "bold");
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
    pdf.setFont("helvetica", "bold");

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

function desenharMovimentacaoViagem(pdf, dados) {
    // Cabeçalho
    pdf.setFillColor(243, 146, 32);
    pdf.rect(10, 125, 190, 8, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(255);

    pdf.text(
        "MOVIMENTAÇÃO DA VIAGEM",
        105,
        131,
        { align: "center" }
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
        dados.totalDiarias
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
//========================================================
// RESUMO FINANCEIRO
//========================================================

function desenharResumoFinanceiro(pdf, dados) {

    // Cabeçalho
    pdf.setFillColor(243, 146, 32);
    pdf.rect(15, 186, 180, 8, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(255);

    pdf.text(
        "RESUMO FINANCEIRO",
        105,
        192,
        { align: "center" }
    );

    // Caixa
    pdf.setDrawColor(220);
    pdf.setFillColor(250);

    pdf.roundedRect(
        15,
        197,
        180,
        42,
        2,
        2,
        "FD"
    );

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(60);

    // Valor das diárias
    pdf.text("Valor das Diárias", 22, 208);

    // Linha pontilhada
    for (let x = 60; x < 170; x += 2) {
        pdf.line(x, 208, x + 1, 208);
    }

    pdf.text(
        dados.valorTotalDiarias.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        }),
        185,
        208,
        { align: "right" }
    );

    // Total de vales
    pdf.text("Total de Vales", 22, 218);

    for (let x = 55; x < 170; x += 2) {
        pdf.line(x, 218, x + 1, 218);
    }

    pdf.text(
        dados.totalVales.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        }),
        185,
        218,
        { align: "right" }
    );
    // Gastos
    pdf.text("Gastos da Empresa", 22, 228);

    for (let x = 75; x < 170; x += 2) {
        pdf.line(x, 228, x + 1, 228);
    }

    pdf.text(
        dados.totalGastosEmpresa.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        }),
        185,
        228,
        { align: "right" }
    );

    // Barra do saldo
    pdf.setFillColor(30, 35, 48);

    pdf.roundedRect(
        15,
        242,
        180,
        12,
        2,
        2,
        "F"
    );

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(255);

    pdf.text(
        "SALDO DA VIAGEM",
        22,
        250
    );

    pdf.setTextColor(243, 146, 32);

    pdf.text(
        dados.saldo.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        }),
        185,
        250,
        { align: "right" }
    );
    if (dados.saldo > 0) {
        pdf.setTextColor(40, 167, 69); // verde
    } else if (dados.saldo < 0) {
        pdf.setTextColor(220, 53, 69); // vermelho
    } else {
        pdf.setTextColor(255); // branco
    }

}
//========================================================
// OBSERVAÇÕES
//========================================================

function desenharObservacoes(pdf, dados) {

    // Cabeçalho
    pdf.setFillColor(243, 146, 32);
    pdf.rect(15, 258, 180, 8, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(255);

    pdf.text(
        "OBSERVAÇÕES",
        105,
        264,
        { align: "center" }
    );

    // Caixa
    pdf.setFillColor(250);
    pdf.setDrawColor(220);

    pdf.roundedRect(
        15,
        268,
        180,
        18,
        2,
        2,
        "FD"
    );

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(60);

    const observacoes =
        dados.viagem.observacoes || "Sem observações.";

    pdf.text(
        observacoes,
        20,
        275,
        {
            maxWidth: 170
        }
    );

}
//========================================================
// ASSINATURA
//========================================================

function desenharAssinatura(pdf) {

    pdf.setDrawColor(120);

    pdf.line(
        65,
        292,
        145,
        292
    );

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(80);

    pdf.text(
        "Motorista Responsável",
        105,
        296,
        {
            align: "center"
        }
    );

}
//========================================================
// CABEÇALHO DAS ENTREGAS
//========================================================

function desenharCabecalhoEntregas(pdf, dados) {

    const cabecalho = new Image();

    cabecalho.src = "./img/cabecalho-entregas.png";

    pdf.addImage(
        cabecalho,
        "PNG",
        0,
        0,
        210,
        35
    );

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(70);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(70);

    // Primeira linha
    pdf.text(
        `Motorista: ${dados.perfil.nome || "-"}`,
        12,
        39
    );

    pdf.text(
        `Período: ${formatarData(dados.viagem.inicio)} até ${formatarData(dados.viagem.fim)}`,
        120,
        39
    );

    // Segunda linha
    pdf.text(
        `Cavalo: ${dados.perfil.placaCavalo || "-"}`,
        12,
        45
    );

    pdf.text(
        `Carreta: ${dados.perfil.placaReboque || "-"}`,
        120,
        45
    );

}
//========================================================
// TABELA DE ENTREGAS
//========================================================

function desenharTabelaEntregas(pdf, dados) {


    let y = 54;

    desenharCabecalhoTabelaEntregas(pdf, y);

    y += 8;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(40);

    dados.entregas.forEach((entrega, index) => {
        console.log(entrega);

        // Quebra automática
        if (y > 280) {

            pdf.addPage();

            desenharCabecalhoEntregas(pdf, dados);

            y = 48;

            desenharCabecalhoTabelaEntregas(pdf, y);

            y += 8;

        }

        // Linha zebrada
        pdf.setFillColor(
            index % 2 === 0 ? 248 : 255,
            index % 2 === 0 ? 248 : 255,
            index % 2 === 0 ? 248 : 255
        );

        pdf.rect(10, y, 190, 8, "F");
        pdf.setDrawColor(225);

        pdf.line(
            10,
            y + 8,
            200,
            y + 8
        );

        pdf.text(
            formatarData(entrega.date) || "-",
            13,
            y + 5
        );

        pdf.text(
            (entrega.client || "-").substring(0, 18),
            30,
            y + 5
        );

        pdf.text(
            (entrega.origin || "-").substring(0, 15),
            70,
            y + 5
        );

        pdf.text(
            (entrega.destination || "-").substring(0, 15),
            105,
            y + 5
        );

        pdf.text(
            (entrega.product || "-").substring(0, 12),
            140,
            y + 5
        );

        pdf.text(
            Number(entrega.weight || 0)
                .toLocaleString("pt-BR"),
            174,
            y + 5,
            { align: "right" }
        );

        pdf.text(
            Number(entrega.kmPercorrido || 0)
                .toLocaleString("pt-BR"),
            194,
            y + 5,
            { align: "right" }
        );

        y += 8;

    });
    y += 10;

    y = desenharObservacoesEntregas(
        pdf,
        dados,
        y
    );

    desenharAssinaturaEntregas(
        pdf,
        y
    );


}

//========================================================
// CABEÇALHO DA TABELA
//========================================================

function desenharCabecalhoTabelaEntregas(pdf, y) {

    pdf.setFillColor(243, 146, 32);
    pdf.rect(10, y, 190, 8, "F");
    pdf.setDrawColor(235);

    pdf.line(
        10,
        y + 8,
        200,
        y + 8
    );

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(255);

    pdf.text("DATA", 13, y + 5);
    pdf.text("CLIENTE", 30, y + 5);
    pdf.text("ORIGEM", 70, y + 5);
    pdf.text("DESTINO", 105, y + 5);
    pdf.text("PRODUTO", 140, y + 5);
    pdf.text("PESO", 168, y + 5);
    pdf.text("KM", 186, y + 5);

}
//========================================================
// OBSERVAÇÕES DAS ENTREGAS
//========================================================

function desenharObservacoesEntregas(pdf, dados, y) {

    pdf.setFillColor(243, 146, 32);
    pdf.rect(10, y, 190, 8, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(255);

    pdf.text(
        "OBSERVAÇÕES",
        105,
        y + 5,
        { align: "center" }
    );

    y += 10;

    pdf.setFillColor(250);
    pdf.setDrawColor(220);

    pdf.roundedRect(
        10,
        y,
        190,
        22,
        2,
        2,
        "FD"
    );

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(50);

    pdf.text(
        dados.viagem.observacoes || "Sem observações.",
        15,
        y + 8,
        {
            maxWidth: 180
        }
    );

    return y + 22;

}
//========================================================
// ASSINATURA DAS ENTREGAS
//========================================================

function desenharAssinaturaEntregas(pdf, y) {

    y += 18;

    pdf.setDrawColor(120);

    pdf.line(
        65,
        y,
        145,
        y
    );

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(80);

    pdf.text(
        "Motorista Responsável",
        105,
        y + 5,
        {
            align: "center"
        }
    );

}

//========================================================
// CABEÇALHO ABASTECIMENTOS
//========================================================

function desenharCabecalhoAbastecimentos(pdf, dados) {

    const cabecalho = new Image();

    cabecalho.src = "./img/cabecalho-abastecimento.png";

    pdf.addImage(
        cabecalho,
        "PNG",
        0,
        0,
        210,
        35
    );

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(70);

    pdf.text(
        `Motorista: ${dados.perfil.nome || "-"}`,
        12,
        39
    );

    pdf.text(
        `Período: ${formatarData(dados.viagem.inicio)} até ${formatarData(dados.viagem.fim)}`,
        120,
        39
    );

    pdf.text(
        `Cavalo: ${dados.perfil.placaCavalo || "-"}`,
        12,
        45
    );

    pdf.text(
        `Carreta: ${dados.perfil.placaReboque || "-"}`,
        120,
        45
    );

}
//========================================================
// CABEÇALHO TABELA ABASTECIMENTOS
//========================================================

function desenharCabecalhoTabelaAbastecimentos(pdf, y) {

    pdf.setFillColor(243, 146, 32);
    pdf.rect(10, y, 190, 8, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(255);

    pdf.text("DATA", 15, y + 5);
    pdf.text("KM", 45, y + 5);
    pdf.text("LITROS", 70, y + 5);
    pdf.text("VALOR (R$)", 100, y + 5);
    pdf.text("COMB.", 145, y + 5);
    pdf.text("PAGAMENTO", 180, y + 5, {
        align: "center"
    });

}
//========================================================
// LINHA DA TABELA ABASTECIMENTOS
//========================================================

function desenharLinhaAbastecimento(pdf, abastecimento, y, index) {

    // Fundo zebrado
    pdf.setFillColor(
        index % 2 === 0 ? 248 : 255,
        index % 2 === 0 ? 248 : 255,
        index % 2 === 0 ? 248 : 255
    );

    pdf.rect(10, y, 190, 8, "F");

    // Linha inferior
    pdf.setDrawColor(225);
    pdf.line(10, y + 8, 200, y + 8);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(40);

    pdf.text(
        formatarData(abastecimento.data),
        15,
        y + 5
    );

    pdf.text(
        Number(abastecimento.quilometragem || 0)
            .toLocaleString("pt-BR"),
        55,
        y + 5,
        { align: "right" }
    );
    pdf.text(
        Number(abastecimento.litros || 0)
            .toLocaleString("pt-BR"),
        85,
        y + 5,
        { align: "right" }
    );



    pdf.text(
        Number(abastecimento.valor || 0)
            .toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL"
            }),
        120,
        y + 5,
        { align: "right" }
    );
    pdf.text(
        abastecimento.tipo || "-",
        150,
        y + 5,
        { align: "center" }
    );

    pdf.text(
        abastecimento.pagamento || "-",
        183,
        y + 5,
        { align: "center" }
    );

}
//========================================================
// TABELA ABASTECIMENTOS
//========================================================

function desenharTabelaAbastecimentos(pdf, dados) {

    let y = 54;

    desenharCabecalhoTabelaAbastecimentos(pdf, y);

    y += 8;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(40);

    dados.abastecimentos.forEach((abastecimento, index) => {

        // Quebra automática de página
        if (y > 280) {

            pdf.addPage();

            desenharCabecalhoAbastecimentos(pdf, dados);

            y = 54;

            desenharCabecalhoTabelaAbastecimentos(pdf, y);

            y += 8;

        }

        desenharLinhaAbastecimento(
            pdf,
            abastecimento,
            y,
            index
        );

        y += 8;

    });

    //===========================
    // TOTAIS
    //===========================

    const totalLitros = dados.abastecimentos.reduce(
        (t, a) => t + Number(a.litros || 0),
        0
    );

    const totalValor = dados.abastecimentos.reduce(
        (t, a) => t + Number(a.valor || 0),
        0
    );

    y += 4;

    desenharTotaisAbastecimentos(
        pdf,
        y,
        dados.abastecimentos.length,
        totalLitros,
        totalValor
    );
    // Espaço após os totais
    y += 18;

    // Se faltar espaço, cria nova página
    if (y > 240) {

        pdf.addPage();

        desenharCabecalhoAbastecimentos(pdf, dados);

        y = 54;

    }

    // Observações
    y = desenharObservacoesAbastecimentos(
        pdf,
        dados,
        y
    );

    // Assinatura
    desenharAssinaturaAbastecimentos(
        pdf,
        y
    );


}
//========================================================
// TOTAIS ABASTECIMENTOS
//========================================================

function desenharTotaisAbastecimentos(pdf, y, quantidade, litros, valor) {

    pdf.setFillColor(235, 245, 235);
    pdf.rect(10, y, 190, 10, "F");

    pdf.setDrawColor(220);
    pdf.rect(10, y, 190, 10);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(20, 90, 40);

    pdf.text("TOTAIS", 15, y + 6);

    // Quantidade de abastecimentos
    pdf.text(
        quantidade.toString(),
        55,
        y + 6,
        { align: "right" }
    );

    // Total de litros
    pdf.text(
        litros.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }),
        85,
        y + 6,
        { align: "right" }
    );

    // Valor total
    pdf.text(
        valor.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        }),
        120,
        y + 6,
        { align: "right" }
    );

}

//========================================================
// OBSERVAÇÕES ABASTECIMENTOS
//========================================================

function desenharObservacoesAbastecimentos(pdf, dados, y) {

    pdf.setFillColor(243, 146, 32);
    pdf.rect(10, y, 190, 8, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(255);

    pdf.text(
        "OBSERVAÇÕES",
        105,
        y + 5,
        { align: "center" }
    );

    y += 10;

    pdf.setFillColor(250);
    pdf.setDrawColor(220);

    pdf.roundedRect(
        10,
        y,
        190,
        22,
        2,
        2,
        "FD"
    );

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(50);

    pdf.text(
        dados.viagem.observacoes || "Sem observações.",
        15,
        y + 8,
        {
            maxWidth: 180
        }
    );

    return y + 22;

}
//========================================================
// ASSINATURA ABASTECIMENTOS
//========================================================

function desenharAssinaturaAbastecimentos(pdf, y) {

    y += 10;

    pdf.setDrawColor(120);

    pdf.line(
        65,
        y,
        145,
        y
    );

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(80);

    pdf.text(
        "Motorista Responsável",
        105,
        y + 5,
        {
            align: "center"
        }
    );

}
//========================================================
// CABEÇALHO GASTOS E VALES
//========================================================

function desenharCabecalhoGastosVales(pdf, dados) {

    const cabecalho = new Image();

    cabecalho.src = "./img/cabecalho-gastos.png";

    pdf.addImage(
        cabecalho,
        "PNG",
        0,
        0,
        210,
        35
    );

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(70);

    pdf.text(
        `Motorista: ${dados.perfil.nome || "-"}`,
        12,
        39
    );

    pdf.text(
        `Período: ${formatarData(dados.viagem.inicio)} até ${formatarData(dados.viagem.fim)}`,
        120,
        39
    );

    pdf.text(
        `Cavalo: ${dados.perfil.placaCavalo || "-"}`,
        12,
        45
    );

    pdf.text(
        `Carreta: ${dados.perfil.placaReboque || "-"}`,
        120,
        45
    );

}
//========================================================
// TABELA GASTOS E VALES
//========================================================

function desenharTabelaGastosVales(pdf, dados) {

    let y = 54;

    //=========================
    // VALES
    //=========================

    y = desenharTabelaVales(
        pdf,
        dados,
        y
    );

    y += 12;

    //=========================
    // GASTOS
    //=========================

    y = desenharTabelaGastos(
        pdf,
        dados,
        y
    );

    y += 15;

    desenharResumoFinanceiroGastos(
        pdf,
        dados,
        y
    );
    y += 32;

// Verifica se há espaço suficiente
if(y > 240){

    pdf.addPage();

    desenharCabecalhoGastosVales(pdf,dados);

    y = 54;

}

y = desenharObservacoesGastosVales(
    pdf,
    dados,
    y
);

desenharAssinaturaGastosVales(
    pdf,
    y
);

}
//========================================================
// RESUMO FINANCEIRO GASTOS E VALES
//========================================================

function desenharResumoFinanceiroGastos(pdf, dados, y){

    pdf.setFillColor(235,245,235);
    pdf.rect(10, y, 190, 24, "F");

    pdf.setDrawColor(220);
    pdf.rect(10, y, 190, 24);

    pdf.setFont("helvetica","bold");
    pdf.setFontSize(10);
    pdf.setTextColor(20,90,40);

    pdf.text("RESUMO FINANCEIRO", 15, y + 6);

    pdf.setFont("helvetica","normal");
    pdf.setFontSize(9);

    pdf.text(
        `Total de Vales: ${dados.totalVales.toLocaleString("pt-BR",{
            style:"currency",
            currency:"BRL"
        })}`,
        15,
        y + 13
    );

    pdf.text(
        `Total de Gastos: ${dados.totalGastosEmpresa.toLocaleString("pt-BR",{
            style:"currency",
            currency:"BRL"
        })}`,
        15,
        y + 18
    );

    pdf.setFont("helvetica","bold");

    pdf.text(
        `Saldo: ${dados.saldo.toLocaleString("pt-BR",{
            style:"currency",
            currency:"BRL"
        })}`,
        120,
        y + 18
    );

}
//========================================================
// TABELA VALES
//========================================================

function desenharTabelaVales(pdf, dados, y) {

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);

    pdf.text("VALES RECEBIDOS", 10, y);

    y += 6;

    desenharCabecalhoTabelaVales(pdf, y);

    y += 8;

    dados.vales.forEach((vale, index) => {

    desenharLinhaVale(
        pdf,
        vale,
        y,
        index
    );

    y += 8;

});

// Total de Vales

pdf.setFillColor(235,245,235);
pdf.rect(10,y,190,10,"F");

pdf.setDrawColor(220);
pdf.rect(10,y,190,10);

pdf.setFont("helvetica","bold");
pdf.setFontSize(8);
pdf.setTextColor(20,90,40);

pdf.text("TOTAL DE VALES",15,y+6);

pdf.text(
    dados.totalVales.toLocaleString("pt-BR",{
        style:"currency",
        currency:"BRL"
    }),
    190,
    y+6,
    {
        align:"right"
    }
);

return y + 10;

}
//========================================================
// TABELA GASTOS
//========================================================

function desenharTabelaGastos(pdf, dados, y) {

    pdf.setFont("helvetica","bold");
    pdf.setFontSize(9);

    pdf.text("GASTOS DA EMPRESA",10,y);

    y += 6;

    desenharCabecalhoTabelaGastos(pdf,y);

    y += 8;

    dados.gastosEmpresa.forEach((gasto,index)=>{

    desenharLinhaGasto(
        pdf,
        gasto,
        y,
        index
    );

    y += 8;

});

// Total Gastos

pdf.setFillColor(235,245,235);
pdf.rect(10,y,190,10,"F");

pdf.setDrawColor(220);
pdf.rect(10,y,190,10);

pdf.setFont("helvetica","bold");
pdf.setFontSize(8);
pdf.setTextColor(20,90,40);

pdf.text("TOTAL GASTOS",15,y+6);

pdf.text(
    dados.totalGastosEmpresa.toLocaleString("pt-BR",{
        style:"currency",
        currency:"BRL"
    }),
    190,
    y+6,
    {
        align:"right"
    }
);

return y + 10;

}
//========================================================
// RESUMO FINANCEIRO
//========================================================


function desenharCabecalhoTabelaVales(pdf, y){

    pdf.setFillColor(243,146,32);
    pdf.rect(10,y,190,8,"F");

    pdf.setFont("helvetica","bold");
    pdf.setFontSize(8);
    pdf.setTextColor(255);

    pdf.text("DATA",15,y+5);
    pdf.text("MOTIVO",60,y+5);

    pdf.text(
        "VALOR",
        190,
        y+5,
        {align:"right"}
    );

}
function desenharLinhaVale(pdf, vale, y, index){

    pdf.setFillColor(
        index % 2 === 0 ? 248 : 255,
        index % 2 === 0 ? 248 : 255,
        index % 2 === 0 ? 248 : 255
    );

    pdf.rect(10,y,190,8,"F");

    pdf.setDrawColor(225);
    pdf.line(10,y+8,200,y+8);

    pdf.setFont("helvetica","normal");
    pdf.setFontSize(8);
    pdf.setTextColor(40);

    pdf.text(
        formatarData(vale.date),
        15,
        y+5
    );

    pdf.text(
        vale.motivo || "-",
        60,
        y+5
    );

    pdf.text(
        Number(vale.valor || 0).toLocaleString("pt-BR",{
            style:"currency",
            currency:"BRL"
        }),
        190,
        y+5,
        {align:"right"}
    );

}
function desenharCabecalhoTabelaGastos(pdf,y){

    pdf.setFillColor(243,146,32);
    pdf.rect(10,y,190,8,"F");

    pdf.setFont("helvetica","bold");
    pdf.setFontSize(8);
    pdf.setTextColor(255);

    pdf.text("DATA",15,y+5);
    pdf.text("MOTIVO",50,y+5);
    pdf.text("LOCAL",105,y+5);

    pdf.text(
        "VALOR",
        190,
        y+5,
        {align:"right"}
    );

}
function desenharLinhaGasto(pdf, gasto, y, index){

    pdf.setFillColor(
        index % 2 === 0 ? 248 : 255,
        index % 2 === 0 ? 248 : 255,
        index % 2 === 0 ? 248 : 255
    );

    pdf.rect(10,y,190,8,"F");

    pdf.setDrawColor(225);
    pdf.line(10,y+8,200,y+8);

    pdf.setFont("helvetica","normal");
    pdf.setFontSize(8);
    pdf.setTextColor(40);

    pdf.text(
        formatarData(gasto.date),
        15,
        y+5
    );

    pdf.text(
        gasto.motivo || "-",
        50,
        y+5
    );

    pdf.text(
        (gasto.local || "-").substring(0,25),
        105,
        y+5
    );

    pdf.text(
        Number(gasto.valor || 0).toLocaleString("pt-BR",{
            style:"currency",
            currency:"BRL"
        }),
        190,
        y+5,
        {align:"right"}
    );

}
//========================================================
// OBSERVAÇÕES GASTOS E VALES
//========================================================

function desenharObservacoesGastosVales(pdf, dados, y){

    pdf.setFillColor(243,146,32);
    pdf.rect(10,y,190,8,"F");

    pdf.setFont("helvetica","bold");
    pdf.setFontSize(11);
    pdf.setTextColor(255);

    pdf.text(
        "OBSERVAÇÕES",
        105,
        y+5,
        {align:"center"}
    );

    y += 10;

    pdf.setFillColor(250);
    pdf.setDrawColor(220);

    pdf.roundedRect(
        10,
        y,
        190,
        30,
        2,
        2,
        "FD"
    );

    pdf.setFont("helvetica","normal");
    pdf.setFontSize(9);
    pdf.setTextColor(50);

    pdf.text(
        dados.viagem.observacoes || "Sem observações.",
        15,
        y+8,
        {
            maxWidth:180
        }
    );

    return y + 30;

}
//========================================================
// ASSINATURA GASTOS E VALES
//========================================================

function desenharAssinaturaGastosVales(pdf, y){

    y += 15;

    pdf.setDrawColor(120);

    pdf.line(
        65,
        y,
        145,
        y
    );

    pdf.setFont("helvetica","normal");
    pdf.setFontSize(9);
    pdf.setTextColor(80);

    pdf.text(
        "Motorista Responsável",
        105,
        y+5,
        {
            align:"center"
        }
    );

}