import { calcularDados , obterTarefas } from "./data.js";

const dados = calcularDados();
const tarefas = obterTarefas()

// Elementos do resumo
const totalTarefasElemento = document.querySelector("#total-task-count");
const tarefasConcluidasElemento = document.querySelector("#completed-task-count");
const tarefasPendentesElemento = document.querySelector("#pending-task-count");
const tarefasImportantesElemento = document.querySelector("#important-task-count");

// Elementos do progresso
const circuloProgressoElemento = document.querySelector("#task-progress-circle");
const percentualConclusaoElemento = document.querySelector("#task-completion-percentage");

const progressoConcluidasElemento = document.querySelector("#progress-completed-count");
const progressoPendentesElemento = document.querySelector("#progress-pending-count");
const progressoImportantesElemento = document.querySelector("#progress-important-count");

// Atualizar resumo
totalTarefasElemento.textContent = dados.totalTarefas;
tarefasConcluidasElemento.textContent = dados.quantidadeConcluidas;
tarefasPendentesElemento.textContent = dados.quantidadePendentes;
tarefasImportantesElemento.textContent = dados.quantidadeImportantes;

// Atualizar progresso
percentualConclusaoElemento.textContent = `${dados.percentualConclusao}%`;

circuloProgressoElemento.setAttribute(
    "aria-valuenow",
    dados.percentualConclusao
);

progressoConcluidasElemento.textContent = dados.quantidadeConcluidas;
progressoPendentesElemento.textContent = dados.quantidadePendentes;
progressoImportantesElemento.textContent = dados.quantidadeImportantes;

const agenda = document.querySelector("#upcoming-task-list")

const emptyState = agenda.querySelector(".empty-state");
if (tarefas.length > 0) {
    emptyState?.remove();

    tarefas.forEach(tarefa => {
        agenda.append(criarCartaoTarefa(tarefa, true));
    });
}

function criarCartaoTarefa(tarefa, mostrarAcoes) {
    const cartao = document.createElement("article");
    cartao.classList.add("task-item");
    if (tarefa.status) cartao.classList.add("is-complete");
    cartao.dataset.id = tarefa.id;

    const informacao = document.createElement("div");
    informacao.classList.add("task-info");

    const titulo = document.createElement("h3");
    titulo.textContent = tarefa.titulo;

    const detalhe = document.createElement("p");
    detalhe.textContent = `${formatarData(normalizarData(tarefa.vencimento))}${tarefa.horario ? ` · ${tarefa.horario}` : " · Dia inteiro"} · ${tarefa.categoria}`;

    informacao.append(titulo, detalhe);

    const prioridade = document.createElement("span");
    prioridade.classList.add("task-status", `priority-${tarefa.prioridade}`);
    prioridade.textContent = tarefa.prioridade === "media"
        ? "Média"
        : tarefa.prioridade.charAt(0).toUpperCase() + tarefa.prioridade.slice(1);

    cartao.append(informacao, prioridade);

    if (mostrarAcoes) {
        const acoes = document.createElement("div");
        acoes.classList.add("task-actions");

        const botaoConcluir = document.createElement("button");
        botaoConcluir.type = "button";
        botaoConcluir.classList.add("btn-task-action", "btn-complete");
        botaoConcluir.dataset.action = "toggle";
        botaoConcluir.setAttribute("aria-label", tarefa.status ? "Reabrir tarefa" : "Concluir tarefa");
        botaoConcluir.innerHTML = '<i class="fa-solid fa-check"></i>';

        const botaoEliminar = document.createElement("button");
        botaoEliminar.type = "button";
        botaoEliminar.classList.add("btn-task-action", "btn-delete");
        botaoEliminar.dataset.action = "delete";
        botaoEliminar.setAttribute("aria-label", "Eliminar tarefa");
        botaoEliminar.innerHTML = '<i class="fa-solid fa-trash"></i>';

        acoes.append(botaoConcluir, botaoEliminar);
        cartao.appendChild(acoes);
    }
    return cartao
}
function formatarData(data) {
    if (!data) return "Sem data";
    const [ano, mes, dia] = data.split("-").map(Number);
    return new Intl.DateTimeFormat("pt-PT").format(new Date(ano, mes - 1, dia));
}
function normalizarData(data) {
    if (!data) return "";
    if (data.includes("/")) {
        const [dia, mes, ano] = data.split("/");
        return `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
    }
    return data.slice(0, 10);
}



const taskTodayList = document.querySelector("#today-task-list")
const hoje = new Date();
const dataHoje = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
const tarefasDeHoje = tarefas.filter(
    tarefa => normalizarData(tarefa.vencimento) === dataHoje
);

if (tarefasDeHoje.length > 0) {
    taskTodayList.querySelector(".empty-state")?.remove();

    tarefasDeHoje.forEach(tarefa => {
        taskTodayList.append(criarCartaoTarefa(tarefa, true));
    });
}






