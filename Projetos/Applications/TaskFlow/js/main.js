const modal = document.querySelector(".modal")
const btnAdd = document.querySelectorAll(".btn-add")
const barSearch = document.querySelector("#bar-search")
const btnCancel = document.querySelectorAll(".btn-cancel")
const overlay = document.querySelector(".overlay")
const listaTarefas = document.querySelector(".list-tasks")
const filtros = document.querySelectorAll(".btn-filters")


// ==================== MODAL ====================

btnCancel.forEach(btnCancel => {
    btnCancel.addEventListener("click", () => {
        modal.style.display = "none"
        overlay.classList.remove("ativo")
    })
})

btnAdd.forEach(btnAdd => {
    btnAdd.addEventListener("click", () => {
        modal.style.display = "flex"
        overlay.classList.add("ativo")
    })
})

overlay.addEventListener("click", () => {
    modal.style.display = "none"
    overlay.classList.remove("ativo")
})


// ==================== PESQUISA ====================

barSearch.addEventListener("input", () => {

    const tarefas = document.querySelectorAll(".task")

    tarefas.forEach(tarefa => {

        const nomeTarefa = tarefa
            .querySelector("h3")
            .textContent
            .trim()
            .toLowerCase()

        const textoPesquisa = barSearch.value
            .trim()
            .toLowerCase()

        if (nomeTarefa.includes(textoPesquisa)) {
            tarefa.style.display = "grid"
        } else {
            tarefa.style.display = "none"
        }
    })
})


// ==================== CHECKBOX ====================

listaTarefas.addEventListener("change", (event) => {

    if (event.target.classList.contains("check")) {

        const check = event.target
        const tarefa = check.closest(".task")
        const titulo = tarefa.querySelector("h3")

        if (check.checked) {

            tarefa.dataset.categoria = "concluidas"
            titulo.style.textDecoration = "line-through"

        } else {

            tarefa.dataset.categoria = "pendentes"
            titulo.style.textDecoration = "none"
        }
    }
})


// ==================== FILTROS ====================

filtros.forEach(filtroSelecionado => {

    filtroSelecionado.addEventListener("click", () => {

        const tarefas = document.querySelectorAll(".task")

        tarefas.forEach(tarefa => {

            if (filtroSelecionado.dataset.categoria === "todos") {

                tarefa.style.display = "grid"

            } 
            else if (
                filtroSelecionado.dataset.categoria === tarefa.dataset.categoria
            ) {

                tarefa.style.display = "grid"

            } 
            else {

                tarefa.style.display = "none"
            }
        })
    })
})

// ==================== Alerta ====================
