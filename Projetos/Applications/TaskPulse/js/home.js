import tarefas from "./data.js";
import {obterResumoTarefas} from "./data.js";

const {concluidas , pendentes} = obterResumoTarefas()
const overviewCards=document.querySelectorAll(".overview-card")
const completed = document.querySelectorAll(".completed-tasks")
const pending = document.querySelectorAll(".tasks-pending")
const important = document.querySelector("#important-tasks")
const total = document.querySelector("#total-tarefas")

total.textContent = tarefas.length


completed.forEach(completa =>{
    completed.textContent = concluidas
})
pending.forEach(completa =>{
    pending.textContent = pendentes
})
