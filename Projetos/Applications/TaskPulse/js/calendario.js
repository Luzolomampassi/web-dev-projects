
const filter = document.querySelectorAll(".btn-filter")

filter.forEach( filtroSelecionado =>{
    filtroSelecionado.addEventListener("click", () =>{
       filter.forEach(filtro =>{
            filtro.classList.remove("is-active")
       })
        filtroSelecionado.classList.add("is-active")
    })
})
 //<button type="button" id="btn-mes" class="btn-filter is-active" >Mês</button>
// <button type="button" id="btn-semana" class="btn-filter" >Semana</button>
// <button type="button" id="btn-dia" class="btn-filter" >Dia</button>