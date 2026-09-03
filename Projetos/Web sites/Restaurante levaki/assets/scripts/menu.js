const btnAdd = document.getElementsByClassName("btn-add")
const pratos = document.querySelectorAll(".dish-card")
const btnFiltros = document.querySelectorAll(".btn-filtros")
const search = document.querySelector("#search")



search.addEventListener("input", () => {
    pratos.forEach(prato => {
    const nomePrato = prato.querySelector("h2").textContent.toLowerCase().trim()

    if(nomePrato.includes(search.value.toLowerCase().trim())){
        prato.style.display = "block"
    }else{
        prato.style.display = 'none'
    }
})
})
// =========================== Filtros =========================== 
btnFiltros.forEach(filtroSelecionado =>{
    filtroSelecionado.addEventListener('click',()=>{
        
            pratos.forEach(pratoAtual => {

                if(filtroSelecionado.dataset.categoria === "todos"){
                    pratoAtual.style.display = "block"
                }
                else if(pratoAtual.dataset.categoria === filtroSelecionado.dataset.categoria){
                    pratoAtual.style.display = "block";
                }
                else{
                    pratoAtual.style.display = "none";
                }
               
               
             })
        
    })
})
// =========================== Barra de pesquisa =========================== 



