
// Botões de adicionar tarefa e cancelar
const modal = document.querySelector(".modal")
const btnAdd = document.querySelectorAll(".btn-add")
const btnCancel = document.querySelectorAll(".btn-cancel")
const overlay = document.querySelector(".overlay")
const btnNewTask = document.querySelector("#btn-new-task")
btnCancel.forEach( btnCancel =>{
    btnCancel.addEventListener('click', ()=>{
        modal.style.display = 'none'
        overlay.classList.remove("ativo")
    })
})
btnAdd.forEach(btnAdd =>{
        btnAdd.addEventListener('click', () =>{
         modal.style.display = 'flex'
        overlay.classList.toggle("ativo")
        overlay.addEventListener('click', () =>{
            modal.style.display = 'none'
            overlay.classList.remove("ativo")
        })
    })
})
// =============================================================


// Contando o número de tarefas
const tarefas = document.querySelectorAll(".task");
const filtros = document.querySelectorAll(".btn-filters")



tarefas.forEach(tarefa => {
    const check = tarefa.querySelector(".check")
    tarefa.dataset.categoria = 'pendentes'
    check.addEventListener('change', () => {
        if (check.checked){
            tarefa.dataset.categoria = 'concluidas'
            tarefa.querySelector("h3").style.textDecoration = "line-through";
            tot += 1
          
        }else{
            tarefa.dataset.categoria = 'pendentes'
        }
    })
})


filtros.forEach(filtroSelecionado => {
    filtroSelecionado.addEventListener('click', () => {
        
        tarefas.forEach(tarefa => {
            
            if (filtroSelecionado.dataset.categoria == 'todos') {
                tarefa.style.display = 'grid'

            }else if(filtroSelecionado.dataset.categoria === tarefa.dataset.categoria) {
                tarefa.style.display = 'grid'

            } else {
                tarefa.style.display = 'none'
            }

        })
    })
})  


