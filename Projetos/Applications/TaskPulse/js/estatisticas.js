
import { calcularDados, obterTarefas } from "./data.js";

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
    dados.quantidadeAbertasNoPrazo,
    dados.percentualAbertasNoPrazo
);

atualizarIndicador(
    distribuicao.atrasadas,
    dados.quantidadeAtrasadas,
    dados.percentualAtrasadas
);

// ==================== PRODUTIVIDADE SEMANAL ====================

const canvasTarefas = document.querySelector("#tasksChart");

if (canvasTarefas && typeof Chart !== "undefined") {
    const tarefas = obterTarefas();
    const normalizarData = data => {
        if (!data) return "";

        if (data.includes("/")) {
            const [dia, mes, ano] = data.split("/");
            return `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
        }

        return data.slice(0, 10);
    };

    const datas = Array.from({ length: 7 }, (_, indice) => {
        const data = new Date();
        data.setHours(0, 0, 0, 0);
        data.setDate(data.getDate() - (6 - indice));
        return data;
    });

    const datasISO = datas.map(data => {
        const ano = data.getFullYear();
        const mes = String(data.getMonth() + 1).padStart(2, "0");
        const dia = String(data.getDate()).padStart(2, "0");
        return `${ano}-${mes}-${dia}`;
    });

    const formatadorDia = new Intl.DateTimeFormat("pt-PT", {
        weekday: "short",
        day: "2-digit"
    });

    const cores = getComputedStyle(document.documentElement);
    const corPrimaria = cores.getPropertyValue("--color-primary").trim();
    const corSucesso = cores.getPropertyValue("--color-success").trim();
    const corTexto = cores.getPropertyValue("--color-text-secondary").trim();
    const corGrelha = cores.getPropertyValue("--color-border").trim();

    new Chart(canvasTarefas, {
        type: "bar",
        data: {
            labels: datas.map(data => formatadorDia.format(data)),
            datasets: [
                {
                    label: "Com vencimento",
                    data: datasISO.map(data => tarefas.filter(
                        tarefa => normalizarData(tarefa.vencimento) === data
                    ).length),
                    backgroundColor: corPrimaria,
                    borderRadius: 6
                },
                {
                    label: "Concluídas",
                    data: datasISO.map(data => tarefas.filter(
                        tarefa => tarefa.status === true &&
                            normalizarData(tarefa.vencimento) === data
                    ).length),
                    backgroundColor: corSucesso,
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: corTexto }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: corTexto,
                        precision: 0
                    },
                    grid: { color: corGrelha }
                }
            },
            plugins: {
                legend: {
                    labels: { color: corTexto }
                }
            }
        }
    });
}
