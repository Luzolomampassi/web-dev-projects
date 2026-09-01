const btnFiltros = document.querySelectorAll(".btn-filtros")
const projetos = document.querySelectorAll(".item")


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