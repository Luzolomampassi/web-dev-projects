// calendario.js
import { obterTarefas, calcularResumoDia } from "./data.js";
const filter = document.querySelectorAll(".btn-filter")

filter.forEach( filtroSelecionado =>{
    filtroSelecionado.addEventListener("click", () =>{
       filter.forEach(filtro =>{
            filtro.classList.remove("is-active")
       })
        filtroSelecionado.classList.add("is-active")
    })
})


const resumo = calcularResumoDia();

console.log(resumo.total);
console.log(resumo.concluidas);
console.log(resumo.pendentes);
console.log(resumo.altaPrioridade);

const summary= {
    totalTarefas_dia: document.querySelector("#total-tarefas-dia"),
    tarefasConcluida_dia: document.querySelector("#tarefas-concluidas-dia"),
    tarefasPendentes_dia: document.querySelector("#tarefas-pendentes-dia"),
    tarefasPrioridade_alta: document.querySelector("#tarefas-prioridade-alta"),
}
