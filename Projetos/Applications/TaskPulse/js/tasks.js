// ============================================================
// ELEMENTOS DO DOM
// ============================================================

// Formulário
const form = document.querySelector("#form-task");
const inputText = document.querySelector("#tarefa");
const textarea = document.querySelector("#descricao");
const select = document.querySelector("#categoria");
const data = document.querySelector("#data");
const time = document.querySelector("#time");
const selectPrioridade = document.querySelector("#prioridade");

// Modal
const modal = document.querySelector("#modal");
const btnAbrirModal = document.querySelector(".btn-add");
const btnCancelar = document.querySelectorAll(".btn-cancel");

// Lista de tarefas
const listaTarefas = document.querySelector(".list-tasks");

// Pesquisa
const barSearch = document.querySelector("#bar-search");

// Filtros
const filtros = document.querySelectorAll(".btn-filters");

// Alerta personalizado
const alertPersonalizado = document.querySelector("#alert");
const btnAlert = document.querySelector("#btn-alert");


// ============================================================
// EVENTOS DO FORMULÁRIO
// ============================================================

form.addEventListener("submit", (event) => {

    event.preventDefault();

    if (!validarFormulario()) {
        dispararAlert();
        return;
    }

    const dados = converterDados();

    criarTarefa(dados);

    modal.close();
});


// ============================================================
// MODAL
// ============================================================

// Abrir modal
btnAbrirModal.addEventListener("click", () => {

    form.reset();

    modal.showModal();
});


// Fechar modal ao clicar fora
modal.addEventListener("click", (event) => {

    if (event.target === modal) {
        modal.close();
    }
});


// Botões de cancelar
btnCancelar.forEach((btn) => {

    btn.addEventListener("click", () => {
        modal.close();
    });

});


// ============================================================
// ALERTA PERSONALIZADO
// ============================================================

// Fechar alerta
btnAlert.addEventListener("click", () => {

    alertPersonalizado.classList.remove("ativo");

});


// Exibir alerta
function dispararAlert() {

    alertPersonalizado.classList.add("ativo");

}


// ============================================================
// VALIDAÇÃO DO FORMULÁRIO
// ============================================================

function validarFormulario() {

    // Verifica título
    if (inputText.value.trim() === "") {
        return false;
    }

    // Verifica categoria
    if (select.value === "") {
        return false;
    }

    // Define a data atual caso o usuário não informe uma
    if (data.value === "") {

        const hoje = new Date();

        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, "0");
        const dia = String(hoje.getDate()).padStart(2, "0");

        data.value = `${ano}-${mes}-${dia}`;
    }

    return true;
}


// ============================================================
// CONVERSÃO DOS DADOS
// ============================================================

function converterDados() {

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


// ============================================================
// CRIAÇÃO DA TAREFA
// ============================================================

function criarTarefa(dados) {

    // --------------------------------------------------------
    // Elemento principal
    // --------------------------------------------------------

    const tarefa = document.createElement("div");

    tarefa.classList.add("task");

    tarefa.dataset.categoria = "pendentes";


    // --------------------------------------------------------
    // Checkbox
    // --------------------------------------------------------

    const label = document.createElement("label");

    const checkbox = document.createElement("input");

    checkbox.type = "checkbox";
    checkbox.classList.add("check");

    label.appendChild(checkbox);


    // --------------------------------------------------------
    // Conteúdo
    // --------------------------------------------------------

    const texto = document.createElement("div");

    const titulo = document.createElement("h3");

    titulo.textContent = dados.titulo;


    const descricao = document.createElement("p");

    descricao.textContent = dados.descricao;


    // --------------------------------------------------------
    // Badges
    // --------------------------------------------------------

    const badges = document.createElement("div");

    badges.classList.add("badges");


    const badgeCategoria = document.createElement("div");

    badgeCategoria.classList.add("badge");

    badgeCategoria.textContent = dados.categoria;


    const badgeData = document.createElement("div");

    badgeData.classList.add("badge");

    badgeData.textContent = dados.vencimento;


    const badgePrioridade = document.createElement("div");

    badgePrioridade.classList.add("badge");

    badgePrioridade.textContent = dados.prioridade;


    // --------------------------------------------------------
    // Classe da prioridade
    // --------------------------------------------------------

    const prioridade = dados.prioridade.toLowerCase();

    if (prioridade === "alta") {

        badgePrioridade.classList.add("alta");

    } else if (prioridade === "media") {

        badgePrioridade.classList.add("media");

    } else {

        badgePrioridade.classList.add("baixa");

    }


    // --------------------------------------------------------
    // Montagem dos badges
    // --------------------------------------------------------

    badges.appendChild(badgeCategoria);
    badges.appendChild(badgeData);
    badges.appendChild(badgePrioridade);


    // --------------------------------------------------------
    // Montagem do conteúdo
    // --------------------------------------------------------

    texto.appendChild(titulo);
    texto.appendChild(descricao);
    texto.appendChild(badges);


    // --------------------------------------------------------
    // Botões de ação
    // --------------------------------------------------------

    const buttons = document.createElement("div");

    buttons.classList.add("task-actions");


    // Botão editar
    const buttonEdit = document.createElement("button");

    buttonEdit.classList.add("btn-edit");

    buttonEdit.setAttribute(
        "aria-label",
        "Editar a tarefa"
    );


    const iconeEdit = document.createElement("i");

    iconeEdit.classList.add(
        "fa-regular",
        "fa-pen-to-square"
    );

    buttonEdit.appendChild(iconeEdit);


    // Botão deletar
    const buttonDelet = document.createElement("button");

    buttonDelet.classList.add("btn-delet");

    buttonDelet.setAttribute(
        "aria-label",
        "Deletar a tarefa"
    );


    const iconeDelet = document.createElement("i");

    iconeDelet.classList.add(
        "fa-regular",
        "fa-trash-can"
    );

    buttonDelet.appendChild(iconeDelet);


    // --------------------------------------------------------
    // Montagem dos botões
    // --------------------------------------------------------

    buttons.appendChild(buttonEdit);
    buttons.appendChild(buttonDelet);


    // --------------------------------------------------------
    // Montagem final da tarefa
    // --------------------------------------------------------

    tarefa.appendChild(label);

    tarefa.appendChild(texto);

    tarefa.appendChild(buttons);

    listaTarefas.appendChild(tarefa);


    // --------------------------------------------------------
    // Evento de exclusão
    // --------------------------------------------------------

    buttonDelet.addEventListener("click", () => {

        tarefa.remove();

    });
}


// ============================================================
// CHECKBOX — CONCLUIR TAREFA
// ============================================================

listaTarefas.addEventListener("change", (event) => {

    if (!event.target.classList.contains("check")) {
        return;
    }

    const checkbox = event.target;

    const tarefa = checkbox.closest(".task");

    const titulo = tarefa.querySelector("h3");


    if (checkbox.checked) {

        tarefa.dataset.categoria = "concluidas";

        titulo.style.textDecoration = "line-through";

    } else {

        tarefa.dataset.categoria = "pendentes";

        titulo.style.textDecoration = "none";

    }

});


// ============================================================
// PESQUISA DE TAREFAS
// ============================================================

barSearch.addEventListener("input", () => {

    const textoPesquisa = barSearch.value
        .trim()
        .toLowerCase();

    const tarefas = document.querySelectorAll(".task");


    tarefas.forEach((tarefa) => {

        const nomeTarefa = tarefa
            .querySelector("h3")
            .textContent
            .trim()
            .toLowerCase();


        if (nomeTarefa.includes(textoPesquisa)) {

            tarefa.style.display = "grid";

        } else {

            tarefa.style.display = "none";

        }

    });

});


// ============================================================
// FILTROS
// ============================================================

filtros.forEach((filtro) => {

    filtro.addEventListener("click", () => {

        const categoriaFiltro = filtro.dataset.categoria;

        const tarefas = document.querySelectorAll(".task");


        tarefas.forEach((tarefa) => {

            // Mostrar todas
            if (categoriaFiltro === "todos") {

                tarefa.style.display = "grid";

                return;
            }


            // Mostrar apenas a categoria selecionada
            if (categoriaFiltro === tarefa.dataset.categoria) {

                tarefa.style.display = "grid";

            } else {

                tarefa.style.display = "none";

            }

        });

    });

});