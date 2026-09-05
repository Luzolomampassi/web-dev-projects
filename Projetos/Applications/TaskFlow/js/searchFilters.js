const inputText = document.querySelector("#tarefa")
const textarea = document.querySelector("#descricao")
const select = document.querySelector("#categoria")
const data = document.querySelector("#data")
const selectPrioridade = document.querySelector("#prioridade")
const listaTarefas = document.querySelector(".list-tasks")
const btnNewTask = document.querySelector("#btn-new-task")

btnNewTask.addEventListener('click', ()=>{
    notNull()
    if(notNull === false){
        return
    }
    const tarefa = conversao()
    criaTarefa(tarefa)
})

function notNull(){
    if(inputText.value === ""){
        return false
    }
    else if(textarea.value === ""){
        return false
    }
    else if(select.value === ""){
        return false
    }else{
        return true
    }
}
function conversao(){
   const tarefa = {
    titulo: inputText.value.trim(),
    descricao: textarea.value.trim(),
    categoria: select.value,
    vencimento: data.value,
    prioridade: selectPrioridade.value
}
return tarefa
}
function criaTarefa(dados){
    const tarefa = document.createElement("div")
    tarefa.dataset.categoria = "pendentes"
    tarefa.classList.add = "task"
       
    
    // caixa 
    function criaCheck(){
        const label = document.createElement("label")
        const checkbox = document.createElement("input[type='check']")
        checkbox.classList.add("check")
        label.appendChild(checkbox)
        return label
    } 
    // Texto 
    function criaTexto(){
        const texto = document.createElement("div") 
        const titulo = document.createElement("h2")
        titulo.textContent(dados.titulo)
        const descricao = document.createElement("p")
        descricao.textContent = `${dados.descricao}`
        texto.appendChild(titulo)
        texto.appendChild(descricao)
        return titulo
    }

    // Buttons
    function criaButtons(){
        const buttons = document.createElement("div")
        buttons.classList.add("task-actions")
        const buttonedit = document.createElement("button")
        const buttondelet = document.createElement("button")
        buttonedit.innerHTML = `<i class="fa-regular fa-pen-to-square"></i>`
        buttonedit.classList.add=("btn-edit")
        buttondelet.innerHTML = `<i class="fa-regular fa-trash-can"></i>`
        buttondelet.classList.add=("btn-delet")
        buttons.appendChild(buttonedit)
        buttons.appendChild(buttondelet)
        return buttons
    }

    
    const check = criaCheck()
    const buttons = criaButtons()
    const texto = criaTexto()

    tarefa.appendChild(check)
    tarefa.appendChild(texto)
    tarefa.appendChild(buttons)

    listaTarefas.appendChild(tarefa)
}

