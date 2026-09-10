// ==============================
// ELEMENTOS DO DOM
// ==============================

const inputText = document.querySelector("#tarefa");
const textarea = document.querySelector("#descricao");
const select = document.querySelector("#categoria");
const data = document.querySelector("#data");
const time = document.querySelector("#time");
const selectPrioridade = document.querySelector("#prioridade");

const btnAbrirModal = document.querySelector(".btn-add");

const form = document.querySelector("#modal");

const alertPersonalizado = document.querySelector("#alert");
const btnAlert = document.querySelector("#btn-alert");


// ==============================
// EVENTOS
// ==============================

form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (notNull() === false) {
        dispararAlert();
        return;
    }

    const dados = conversao();

    criaTarefa(dados);
});

btnAbrirModal.addEventListener("click", () => {
    form.reset();
});

btnAlert.addEventListener("click", () => {
    alertPersonalizado.classList.remove("ativo");
});


// ==============================
// ALERTA PERSONALIZADO
// ==============================

function dispararAlert() {
    alertPersonalizado.classList.add("ativo");
}


// ==============================
// VALIDAÇÃO DO FORMULÁRIO
// ==============================

function notNull() {
    if (inputText.value === "") {
        return false;
    }

    if (select.value === "") {
        return false;
    }

    if (data.value === "") {
        const hoje = new Date();

        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, "0");
        const dia = String(hoje.getDate()).padStart(2, "0");

        data.value = `${ano}-${mes}-${dia}`;
    }

    return true;
}


// ==============================
// CONVERSÃO DOS DADOS
// ==============================

function conversao() {
    const tarefa = {
        titulo: inputText.value.trim(),
        descricao: textarea.value.trim(),
        categoria: select.value,
        vencimento: data.value,
        horario: time.value,
        prioridade: selectPrioridade.value
    };

    return tarefa;
}


// ==============================
// CRIAÇÃO DA TAREFA
// ==============================

function criaTarefa(dados) {
    const tarefa = document.createElement("div");

    tarefa.classList.add("task");
    tarefa.dataset.categoria = "pendentes";


    // ------------------------------
    // Checkbox
    // ------------------------------

    const label = document.createElement("label");
    const checkbox = document.createElement("input");

    checkbox.type = "checkbox";
    checkbox.classList.add("check");

    label.appendChild(checkbox);


    // ------------------------------
    // Conteúdo da tarefa
    // ------------------------------

    const texto = document.createElement("div");

    const titulo = document.createElement("h3");
    titulo.textContent = dados.titulo;

    const descricao = document.createElement("p");
    descricao.textContent = dados.descricao;


    // ------------------------------
    // Badges
    // ------------------------------

    const badges = document.createElement("div");

    const badgeCategoria = document.createElement("div");
    const badgeData = document.createElement("div");
    const badgePrioridade = document.createElement("div");

    badges.classList.add("badges");

    badgeCategoria.classList.add("badge");
    badgeData.classList.add("badge");
    badgePrioridade.classList.add("badge");

    badgeCategoria.textContent = dados.categoria;
    badgeData.textContent = dados.vencimento;
    badgePrioridade.textContent = dados.prioridade;


    // ------------------------------
    // Classe da prioridade
    // ------------------------------

    const prioridade = dados.prioridade.toLowerCase();

    if (prioridade === "alta") {
        badgePrioridade.classList.add("alta");
    } else if (prioridade === "media") {
        badgePrioridade.classList.add("media");
    } else {
        badgePrioridade.classList.add("baixa");
    }


    // ------------------------------
    // Montagem dos badges
    // ------------------------------

    badges.appendChild(badgeCategoria);
    badges.appendChild(badgeData);
    badges.appendChild(badgePrioridade);


    // ------------------------------
    // Montagem do texto
    // ------------------------------

    texto.appendChild(titulo);
    texto.appendChild(descricao);
    texto.appendChild(badges);


    // ------------------------------
    // Botões de ação
    // ------------------------------

    const buttons = document.createElement("div");

    const buttonEdit = document.createElement("button");
    const iconeEdit = document.createElement("i");

    const buttonDelet = document.createElement("button");
    const iconeDelet = document.createElement("i");

    buttons.classList.add("task-actions");


    // Botão editar
    iconeEdit.classList.add("fa-regular", "fa-pen-to-square");

    buttonEdit.classList.add("btn-edit");
    buttonEdit.setAttribute("aria-label", "Editar a tarefa");
    buttonEdit.appendChild(iconeEdit);


    // Botão deletar
    iconeDelet.classList.add("fa-regular", "fa-trash-can");

    buttonDelet.classList.add("btn-delet");
    buttonDelet.setAttribute("aria-label", "Deletar a tarefa");
    buttonDelet.appendChild(iconeDelet);


    // Montagem dos botões
    buttons.appendChild(buttonEdit);
    buttons.appendChild(buttonDelet);


    // ------------------------------
    // Montagem final da tarefa
    // ------------------------------

    tarefa.appendChild(label);
    tarefa.appendChild(texto);
    tarefa.appendChild(buttons);

    listaTarefas.appendChild(tarefa);
}