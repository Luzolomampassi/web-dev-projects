import { calcularDados } from "./data.js";

const dados = calcularDados();

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
