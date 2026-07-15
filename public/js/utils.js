// =====================================================
// Motorista Plus 2.0
// Arquivo de Funções Globais
// =====================================================

export const $ = (id) => document.getElementById(id);

// ===========================
// Formatar Data
// ===========================
export function formatarDataBR(data) {

    if (!data) return "";

    const d = new Date(data);

    return d.toLocaleDateString("pt-BR");

}

// ===========================
// Abrir Modal
// ===========================
export function abrirModal(id) {

    const modal = $(id);

    if (modal) {

        modal.style.display = "flex";

    }

}

// ===========================
// Fechar Modal
// ===========================
export function fecharModal(id) {

    const modal = $(id);

    if (modal) {

        modal.style.display = "none";

    }

}

// ===========================
// Limpar Formulário
// ===========================
export function limparFormulario(ids) {

    ids.forEach(id => {

        const campo = $(id);

        if (!campo) return;

        if (
            campo.type === "text" ||
            campo.type === "number" ||
            campo.type === "date" ||
            campo.tagName === "TEXTAREA"
        ) {

            campo.value = "";

        }

    });

}

// ===========================
// Formatar Moeda
// ===========================
export function moeda(valor) {

    return Number(valor || 0).toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );

}