const btnFiltros = document.querySelectorAll(".btn-filtros")
const projetos = document.querySelectorAll(".item")
const search = document.querySelector("#search")

search.addEventListener('input', () =>{
    projetos.forEach(projeto =>{
        const nomeProjeto = projeto.querySelector("h3").textContent.toLocaleLowerCase()
        if(nomeProjeto.includes(search.value.toLocaleLowerCase())){
            projeto.style.display = 'grid'
        }else{
            projeto.style.display = 'none'
        }
    })
})
btnFiltros.forEach(btnSelecionado => {
    btnSelecionado.addEventListener('click', () =>{

        projetos.forEach(projetoSelecionado =>{
            if(btnSelecionado.dataset.categoria == 'todos'){
                projetoSelecionado.style.display = 'grid'
            }
            else if(btnSelecionado.dataset.categoria === projetoSelecionado.dataset.categoria){
                projetoSelecionado.style.display = 'grid'
            }else{
                projetoSelecionado.style.display = 'none'
            }
        })
    })
})