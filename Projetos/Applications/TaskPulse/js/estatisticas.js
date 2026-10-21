
import { calcularDados } from "./data.js";

const dados = calcularDados();

// ==================== CARDS ====================

const valoresCards = {
    total: document.querySelector(".total-tarefas"),
    concluidas: document.querySelector(".tarefas-concluidas"),
    pendentes: document.querySelector(".tarefas-pendentes"),
    atrasadas: document.querySelector(".tarefas-atrasadas"),
    taxaConclusao: document.querySelector(".taxa-conclusao")
};

valoresCards.total.textContent = dados.totalTarefas;
valoresCards.concluidas.textContent = dados.quantidadeConcluidas;
valoresCards.pendentes.textContent = dados.quantidadePendentes;
valoresCards.atrasadas.textContent = dados.quantidadeAtrasadas;
valoresCards.taxaConclusao.textContent = `${dados.percentualConclusao}%`;

// ==================== DISTRIBUIÇÃO ====================

const distribuicao = {
    total: document.querySelector(".grafico-centro"),

    concluidas: {
        quantidade: document.querySelector(".statusConcluidoElemento"),
        percentagem: document.querySelector(".statusConcluidoElemento + p")
    },

    pendentes: {
        quantidade: document.querySelector(".statusPendenteElemento"),
        percentagem: document.querySelector(".statusPendenteElemento + p")
    },

    atrasadas: {
        quantidade: document.querySelector(".statusAtrasadaElemento"),
        percentagem: document.querySelector(".statusAtrasadaElemento + p")
    },

    andamento: {
        quantidade: document.querySelector(".statusAndamentoElemento"),
        percentagem: document.querySelector(".statusAndamentoElemento + p")
    }
};

distribuicao.total.firstChild.textContent = dados.totalTarefas;

function atualizarIndicador(elementos, quantidade, percentagem) {
    elementos.quantidade.textContent = quantidade;
    elementos.percentagem.textContent = `${percentagem}%`;
}

atualizarIndicador(
    distribuicao.concluidas,
    dados.quantidadeConcluidas,
    dados.percentualConclusao
);

atualizarIndicador(
    distribuicao.pendentes,
    dados.quantidadePendentes,
    dados.percentualPendentes
);

atualizarIndicador(
    distribuicao.atrasadas,
    dados.quantidadeAtrasadas,
    dados.percentualAtrasadas
);

// atualizarIndicador(
//     distribuicao.andamento,
//     dados.quantidadeEmAndamento,
//     dados.percentualEmAndamento
// );
