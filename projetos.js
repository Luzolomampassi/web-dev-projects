const btnFiltros = document.querySelectorAll(".btn-filtros")
const projetos = document.querySelectorAll(".item")
const search = document.querySelector("#search")

search.addEventListener('input', () =>{
    projetos.forEach(projeto =>{
        const nomeProjeto = projeto.querySelector("h3").textContent.toLocaleLowerCase()
        if(nomeProjeto.includes(search.value.toLocaleLowerCase())){
            projeto.style.display = 'grid'
        }else{
            document.body.querySelector(".noitem").textContent = 'Nenhum projeto encontrado'
            projeto.style.display = 'none'
        }
    })
})
btnFiltros.forEach(btnSelecionado => {
    btnSelecionado.addEventListener('click', () =>{

        projetos.forEach(projetoSelecionado =>{
            if(btnSelecionado.dataset.categoria.includes('todos') ){
                projetoSelecionado.style.display = 'grid'
            }
            else if(btnSelecionado.dataset.categoria.includes(projetoSelecionado.dataset.categoria)){
                projetoSelecionado.style.display = 'grid'
            }else{
                projetoSelecionado.style.display = 'none'
            }
        })
    })
})

const projetoCompleto = document.querySelector(".projetos-completos")
projetoCompleto.textContent = projetos.length
