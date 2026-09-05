const inputText = document.querySelector("#tarefa")
const textarea = document.querySelector("#descricao")
const select = document.querySelector("#categoria")
const data = document.querySelector("#data")
const selectPrioridade = document.querySelector("#prioridade")
const btnNewTask = document.querySelector("#btn-new-task")
const form = document.querySelector("#modal")

const alertPersonalizado = document.querySelector("#alert")
const btnAlert = document.querySelector("#btn-alert")

form.addEventListener("submit", (event) => {
    event.preventDefault()

    if (notNull() === false) {
        dispararAlert()
        return
    }

    const tarefa = conversao()
    criaTarefa(tarefa)
})

function dispararAlert() {
    alertPersonalizado.classList.add("ativo")
}

btnAlert.addEventListener("click", () => {
    alertPersonalizado.classList.remove("ativo")
})

function notNull() {
    if (inputText.value === "") {
        return false
    }
    else if (textarea.value === "") {
        return false
    }
    else if (select.value === "") {
        return false
    }
    else if (data.value === "") {
        const hoje = new Date()
        const ano = hoje.getFullYear()
        const mes = String(hoje.getMonth() + 1).padStart(2, "0")
        const dia = String(hoje.getDate()).padStart(2, "0")

        data.value = `${ano}-${mes}-${dia}`

        return true
    }
    else {
        return true
    }
}

function conversao() {
    const tarefa = {
        titulo: inputText.value.trim(),
        descricao: textarea.value.trim(),
        categoria: select.value,
        vencimento: data.value,
        prioridade: selectPrioridade.value
    }

    return tarefa
}

function criaTarefa(dados) {
    const tarefa = document.createElement("div")
    tarefa.classList.add("task")
    tarefa.dataset.categoria = "pendentes"

    // Caixa
    const label = document.createElement("label")
    const checkbox = document.createElement("input")

    checkbox.type = "checkbox"
    checkbox.classList.add("check")

    label.appendChild(checkbox)

    // Texto
    const texto = document.createElement("div")

    const titulo = document.createElement("h3")
    titulo.textContent = dados.titulo

    const descricao = document.createElement("p")
    descricao.textContent = dados.descricao

    // Badges
    const badges = document.createElement("div")
    const badgeCategoria = document.createElement("div")
    const badgeData = document.createElement("div")
    const badgePrioridade = document.createElement("div")

    badges.classList.add("badges")

    badgeCategoria.classList.add("badge")
    badgeData.classList.add("badge")
    badgePrioridade.classList.add("badge")

    badgeCategoria.textContent = dados.categoria
    badgeData.textContent = dados.vencimento
    badgePrioridade.textContent = dados.prioridade

    const prioridade = badgePrioridade.textContent.toLowerCase()

    if (prioridade === "alta") {
        badgePrioridade.classList.add("alta")
    }
    else if (prioridade === "media") {
        badgePrioridade.classList.add("media")
    }
    else {
        badgePrioridade.classList.add("baixa")
    }

    badges.appendChild(badgeCategoria)
    badges.appendChild(badgeData)
    badges.appendChild(badgePrioridade)

    texto.appendChild(titulo)
    texto.appendChild(descricao)
    texto.appendChild(badges)

    // Botões
    const buttons = document.createElement("div")

    const iconeEdit = document.createElement("i")
    const buttonEdit = document.createElement("button")

    const iconeDelet = document.createElement("i")
    const buttonDelet = document.createElement("button")

    buttons.classList.add("task-actions")

    iconeEdit.classList.add("fa-regular", "fa-pen-to-square")
    buttonEdit.classList.add("btn-edit")
    buttonEdit.setAttribute("aria-label", "Editar a tarefa")
    buttonEdit.appendChild(iconeEdit)

    iconeDelet.classList.add("fa-regular", "fa-trash-can")
    buttonDelet.classList.add("btn-delet")
    buttonDelet.setAttribute("aria-label", "Deletar a tarefa")
    buttonDelet.appendChild(iconeDelet)

    buttons.appendChild(buttonEdit)
    buttons.appendChild(buttonDelet)

    // Montagem da tarefa
    tarefa.appendChild(label)
    tarefa.appendChild(texto)
    tarefa.appendChild(buttons)

    listaTarefas.appendChild(tarefa)
}