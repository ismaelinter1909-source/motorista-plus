 
 const { jsPDF } = window.jspdf;

export async function gerarRelatorioGastosPessoais(dados) {

    const pdf = new jsPDF("p","mm","a4");

    desenharCabecalho(pdf);

    desenharIdentificacao(pdf,dados);

    desenharResumo(pdf,dados);

    const yTabela =
        desenharTabelaGastos(pdf,dados);

    const yResumo =
        desenharResumoCategorias(
            pdf,
            dados,
            yTabela
        );
        desenharRodape(
            pdf,
            yResumo + 15
        );

    pdf.save("Relatorio_Gastos_Pessoais.pdf");

}
//=====================================================
// IDENTIFICAÇÃO
//=====================================================

function desenharIdentificacao(pdf, dados) {

    pdf.setFillColor(248, 248, 248);
    pdf.setDrawColor(220);

    pdf.roundedRect(
        10,
        35,
        190,
        38,
        2,
        2,
        "FD"
    );

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(40);

    pdf.text(
        "DADOS DO MOTORISTA",
        15,
        43
    );

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);

    pdf.text(
        `Motorista: ${dados.perfil.nome || "-"}`,
        15,
        50
    );

    pdf.text(
        `Telefone: ${dados.perfil.telefone || "-"}`,
        15,
        56
    );

    pdf.text(
        `Cavalo: ${dados.perfil.placaCavalo || "-"}`,
        15,
        62
    );

    pdf.text(
        `Reboque: ${dados.perfil.placaReboque || "-"}`,
        105,
        62
    );

    const inicio = dados.viagem.inicio
    ? dados.viagem.inicio.split("-").reverse().join("/")
    : "-";

    const fim = dados.viagem.fim
        ? dados.viagem.fim.split("-").reverse().join("/")
        : "-";

    pdf.text(
        `Período: ${inicio} até ${fim}`,
        15,
        68
    );
}
//=====================================================
// RESUMO
//=====================================================

function desenharResumo(pdf, dados) {

    const gastos = dados.gastos || [];

    const total = gastos.reduce(
        (soma, g) => soma + Number(g.valor || 0),
        0
    );

    const quantidade = gastos.length;

    const media =
        quantidade > 0
            ? total / quantidade
            : 0;

    const maior =
        quantidade > 0
            ? Math.max(...gastos.map(g => Number(g.valor || 0)))
            : 0;

    desenharCardResumo(
        pdf,
        10,
        82,
        "Total Gasto",
        moeda(total)
    );

    desenharCardResumo(
        pdf,
        108,
        82,
        "Quantidade",
        quantidade
    );

    desenharCardResumo(
        pdf,
        10,
        108,
        "Valor Médio",
        moeda(media)
    );

    desenharCardResumo(
        pdf,
        108,
        108,
        "Maior Gasto",
        moeda(maior)
    );
}
//=====================================================
// CARD
//=====================================================

function desenharCardResumo(
    pdf,
    x,
    y,
    titulo,
    valor
) {

    pdf.setFillColor(248, 248, 248);

    pdf.setDrawColor(220);

    pdf.roundedRect(
        x,
        y,
        92,
        20,
        2,
        2,
        "FD"
    );

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);

    pdf.setTextColor(243, 146, 32);

    pdf.text(
        titulo,
        x + 5,
        y + 7
    );

    pdf.setFontSize(13);

    pdf.setTextColor(40);

    pdf.text(
        String(valor),
        x + 5,
        y + 16
    );

}

//=====================================================
// CABEÇALHO
//=====================================================

function desenharCabecalho(pdf) {

    const cabecalho = new Image();
    cabecalho.src = "./img/cabecalho-gastospessoais.png";

    // Cabeçalho
    pdf.addImage(
        cabecalho,
        "PNG",
        0,
        0,
        210,
        35
    );

    

    // Linha laranja
    pdf.setDrawColor(243,146,32);

    pdf.setLineWidth(1);

    pdf.line(
        10,
        30,
        200,
        30
    );

}
//=====================================================
// CABEÇALHO TABELA
//=====================================================

function desenharCabecalhoTabela(pdf, y) {

    pdf.setFillColor(243, 146, 32);

    pdf.rect(10, y, 190, 8, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(255);

    pdf.text("DATA", 15, y + 5);
    pdf.text("CATEGORIA", 40, y + 5);
    pdf.text("LOCAL", 88, y + 5);
    pdf.text("DESCRIÇÃO", 135, y + 5);
    pdf.text("VALOR", 188, y + 5, {
        align: "right"
    });

}
//=====================================================
// LINHA GASTO
//=====================================================

function desenharLinhaGasto(
    pdf,
    gasto,
    y,
    index
) {

    pdf.setFillColor(
        index % 2 === 0 ? 248 : 255,
        index % 2 === 0 ? 248 : 255,
        index % 2 === 0 ? 248 : 255
    );

    pdf.rect(
        10,
        y,
        190,
        8,
        "F"
    );

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(40);

    pdf.text(
        gasto.date.split("-").reverse().join("/"),
        15,
        y + 5
    );

   const categoriaTexto = (gasto.categoria || "")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .trim();

pdf.text(
    categoriaTexto,
    40,
    y + 5,
    {
        maxWidth: 42
    }
);
    pdf.text(
        gasto.local,
        88,
        y + 5,
        {
            maxWidth: 42
        }
    );

    pdf.text(
        gasto.descricao || "-",
        135,
        y + 5,
        {
            maxWidth: 40
        }
    );

    pdf.text(
        moeda(gasto.valor),
        188,
        y + 5,
        {
            align: "right"
        }
    );

}
//=====================================================
// TABELA
//=====================================================

function desenharTabelaGastos(pdf, dados) {

    let y = 138;

    desenharCabecalhoTabela(
        pdf,
        y
    );

    y += 10;

    dados.gastos.forEach((gasto, index) => {

        desenharLinhaGasto(
            pdf,
            gasto,
            y,
            index
        );

        y += 8;

    });

    return y;

}
//=====================================================
// RESUMO POR CATEGORIA
//=====================================================

function desenharResumoCategorias(pdf, dados, y) {

    y += 8;

    const categorias = {};

    dados.gastos.forEach(gasto => {

        categorias[gasto.categoria] =
            (categorias[gasto.categoria] || 0) +
            Number(gasto.valor || 0);

    });

    // Cabeçalho
    pdf.setFillColor(243, 146, 32);

    pdf.rect(10, y, 190, 8, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(255);

    pdf.text(
        "RESUMO POR CATEGORIA",
        105,
        y + 5,
        { align: "center" }
    );

    y += 12;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(40);

   Object.entries(categorias).forEach(([categoria, valor]) => {

    const categoriaTexto = categoria
        .replace(/[^\p{L}\p{N}\s]/gu, "")
        .trim();

    pdf.text(categoriaTexto, 15, y);

    pdf.text(
        moeda(valor),
        190,
        y,
        { align: "right" }
    );

    // Linha separadora
    pdf.setDrawColor(230);
    pdf.line(15, y + 2, 190, y + 2);

    y += 8;

});

    return y;

}
function moeda(valor) {

    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });

}
function desenharRodape(pdf, y) {

    pdf.setDrawColor(220);
    pdf.line(10, y, 200, y);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(120);

    const agora = new Date();

    pdf.text(
        `Gerado automaticamente em ${agora.toLocaleDateString("pt-BR")} às ${agora.toLocaleTimeString("pt-BR")}`,
        105,
        y + 6,
        { align: "center" }
    );

}