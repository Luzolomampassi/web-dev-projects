// calendario.js
import { tarefas } from "./data.js";
const filter = document.querySelectorAll(".btn-filter")

filter.forEach( filtroSelecionado =>{
    filtroSelecionado.addEventListener("click", () =>{
       filter.forEach(filtro =>{
            filtro.classList.remove("is-active")
       })
        filtroSelecionado.classList.add("is-active")
    })
})
