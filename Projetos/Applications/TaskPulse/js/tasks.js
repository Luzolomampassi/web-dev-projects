// ============================================================
// ESTADO DA APLICAÇÃO
// ============================================================

import tarefas from "./data.js";

// ============================================================
// ELEMENTOS DO DOM
// ============================================================

// Formulário
const formularioTarefa = document.querySelector("#form-task");
const campoTitulo = document.querySelector("#tarefa");
const campoDescricao = document.querySelector("#descricao");
const campoCategoria = document.querySelector("#categoria");
const campoVencimento = document.querySelector("#data");
const campoHorario = document.querySelector("#time");
const campoPrioridade = document.querySelector("#prioridade");

// Modal
const modalTarefa = document.querySelector("#modal");
const botaoAbrirModal = document.querySelectorAll(".btn-add");
const botoesCancelar = document.querySelectorAll(".btn-cancel");

// Lista de tarefas
const listaTarefas = document.querySelector(".list-tasks");

// Pesquisa
const barraPesquisa = document.querySelector("#bar-search");

// Filtros
const botoesFiltros = document.querySelectorAll(".btn-filters");

// Alerta personalizado
const alertaPersonalizado = document.querySelector("#alert");
const botaoAlerta = document.querySelector("#btn-alert");


// ============================================================
// EVENTOS DO FORMULÁRIO
// ============================================================

formularioTarefa.addEventListener("submit", (event) => {
    event.preventDefault();
   
    if (!validarFormulario()) {
        dispararAlerta();
        return  ;
    }

    const dadosTarefa = converterDados();

    tarefas.push(dadosTarefa);
    
    criarTarefa(dadosTarefa);
    resumos()
    modalTarefa.close();
    
});


// ============================================================
// MODAL
// ============================================================

// Abrir modal
botaoAbrirModal.forEach(botao => {
    botao.addEventListener("click", () => {

    formularioTarefa.reset();

    modalTarefa.showModal();
});

})



// Fechar modal ao clicar fora
modalTarefa.addEventListener("click", (event) => {

    if (event.target === modalTarefa) {
        modalTarefa.close();
    }
});


// Botões de cancelar
botoesCancelar.forEach((botao) => {

    botao.addEventListener("click", () => {
        modalTarefa.close();
    });

});


// ============================================================
// ALERTA PERSONALIZADO
// ============================================================

// Fechar alerta
botaoAlerta.addEventListener("click", () => {

    alertaPersonalizado.classList.remove("ativo");

});


// Exibir alerta
function dispararAlerta() {

    alertaPersonalizado.classList.add("ativo");

}


// ============================================================
// VALIDAÇÃO DO FORMULÁRIO
// ============================================================

function validarFormulario() {

    // Verifica título
    if (campoTitulo.value.trim() === "") {
        return false;
    }

    // Verifica categoria
    if (campoCategoria.value === "") {
        return false;
    }

    // Define a data atual caso o usuário não informe uma
    if (campoVencimento.value === "") {

        const hoje = new Date();

        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, "0");
        const dia = String(hoje.getDate()).padStart(2, "0");

        campoVencimento.value = `${ano}-${mes}-${dia}`;
    }

    return true;
}


// ============================================================
// CONVERSÃO DOS DADOS
// ============================================================

function converterDados() {
    const objetoTarefa = {

        id: crypto.randomUUID(),

        titulo: campoTitulo.value.trim(),

        descricao: campoDescricao.value.trim(),

        categoria: campoCategoria.value,

        vencimento: campoVencimento.value,

        horario: campoHorario.value,

        prioridade: campoPrioridade.value,

        status: false

    };

    return objetoTarefa;
}


// ============================================================
// CRIAÇÃO DA TAREFA
// ============================================================

function criarTarefa(dadosTarefa) {

    // --------------------------------------------------------
    // Elemento principal
    // --------------------------------------------------------

    const elementoTarefa = document.createElement("div");

    elementoTarefa.classList.add("task");
    elementoTarefa.dataset.categoria = "pendentes";
    elementoTarefa.dataset.status = false;
    elementoTarefa.dataset.id = dadosTarefa.id;


    // --------------------------------------------------------
    // Checkbox
    // --------------------------------------------------------

    const rotuloCheckbox = document.createElement("label");

    const checkboxConclusao = document.createElement("input");

    checkboxConclusao.type = "checkbox";
    checkboxConclusao.classList.add("check");

    rotuloCheckbox.appendChild(checkboxConclusao);


    // --------------------------------------------------------
    // Conteúdo
    // --------------------------------------------------------

    const conteudoTarefa = document.createElement("div");

    const tituloTarefa = document.createElement("h3");

    tituloTarefa.textContent = dadosTarefa.titulo;


    const descricaoTarefa = document.createElement("p");

    descricaoTarefa.textContent = dadosTarefa.descricao;


    // --------------------------------------------------------
    // Badges
    // --------------------------------------------------------

    const containerBadges = document.createElement("div");

    containerBadges.classList.add("badges");


    const badgeCategoria = document.createElement("div");

    badgeCategoria.classList.add("badge");

    badgeCategoria.textContent = dadosTarefa.categoria;


    const badgeVencimento = document.createElement("div");

    badgeVencimento.classList.add("badge");

    badgeVencimento.textContent = dadosTarefa.vencimento;


    const badgePrioridade = document.createElement("div");

    badgePrioridade.classList.add("badge");

    badgePrioridade.textContent = dadosTarefa.prioridade;


    // --------------------------------------------------------
    // Classe da prioridade
    // --------------------------------------------------------

    const prioridadeTarefa = dadosTarefa.prioridade.toLowerCase();
    elementoTarefa.dataset.prioridade = prioridadeTarefa;
    

    if (prioridadeTarefa === "alta") {
        badgePrioridade.classList.add("alta");

    } else if (prioridadeTarefa === "media") {
        badgePrioridade.classList.add("media");

    } else {
        badgePrioridade.classList.add("baixa");

    }


    // --------------------------------------------------------
    // Montagem dos badges
    // --------------------------------------------------------

    containerBadges.appendChild(badgeCategoria);
    containerBadges.appendChild(badgeVencimento);
    containerBadges.appendChild(badgePrioridade);


    // --------------------------------------------------------
    // Montagem do conteúdo
    // --------------------------------------------------------

    conteudoTarefa.appendChild(tituloTarefa);
    conteudoTarefa.appendChild(descricaoTarefa);
    conteudoTarefa.appendChild(containerBadges);


    // --------------------------------------------------------
    // Botões de ação
    // --------------------------------------------------------

    const containerAcoes = document.createElement("div");

    containerAcoes.classList.add("task-actions");


    // Botão editar
    const botaoEditar = document.createElement("button");

    botaoEditar.classList.add("btn-edit");

    botaoEditar.setAttribute(
        "aria-label",
        "Editar a tarefa"
    );


    const iconeEditar = document.createElement("i");

    iconeEditar.classList.add(
        "fa-regular",
        "fa-pen-to-square"
    );

    botaoEditar.appendChild(iconeEditar);


    // Botão deletar
    const botaoDeletar = document.createElement("button");

    botaoDeletar.classList.add("btn-delet");

    botaoDeletar.setAttribute(
        "aria-label",
        "Deletar a tarefa"
    );


    const iconeDeletar = document.createElement("i");

    iconeDeletar.classList.add(
        "fa-regular",
        "fa-trash-can"
    );

    botaoDeletar.appendChild(iconeDeletar);


    // --------------------------------------------------------
    // Montagem dos botões
    // --------------------------------------------------------

    containerAcoes.appendChild(botaoEditar);
    containerAcoes.appendChild(botaoDeletar);


    // --------------------------------------------------------
    // Montagem final da tarefa
    // --------------------------------------------------------

    elementoTarefa.appendChild(rotuloCheckbox);

    elementoTarefa.appendChild(conteudoTarefa);

    elementoTarefa.appendChild(containerAcoes);

    listaTarefas.appendChild(elementoTarefa);


    // --------------------------------------------------------
    // Evento de edição
    // --------------------------------------------------------

    botaoEditar.addEventListener("click", () => {

        modalTarefa.showModal();

        const idTarefa = elementoTarefa.dataset.id;

        const objetoTarefaEncontrado = tarefas.find(
            item => item.id === idTarefa
        );

        
    });


    // --------------------------------------------------------
    // Evento de exclusão
    // --------------------------------------------------------

    botaoDeletar.addEventListener("click", () => {

        elementoTarefa.remove();

        const id = dadosTarefa.id;

        const indice = tarefas.findIndex(item => item.id === id);

        if (indice !== -1) {
            tarefas.splice(indice, 1);
        }
        resumos();

});

}


// ============================================================
// CHECKBOX — CONCLUIR TAREFA
// ============================================================

listaTarefas.addEventListener("change", (event) => {

    if (!event.target.classList.contains("check")) {
        return;
    }

    const checkboxSelecionado = event.target;

    const elementoTarefa = checkboxSelecionado.closest(".task");

    const tituloTarefa = elementoTarefa.querySelector("h3");
    
    const idTarefa = elementoTarefa.dataset.id;

    const objetoTarefaEncontrado = tarefas.find(
        item => item.id === idTarefa
    );


    if (checkboxSelecionado.checked) {

        elementoTarefa.dataset.categoria = "concluidas";
        elementoTarefa.dataset.status = true;
        objetoTarefaEncontrado.status = true
        tituloTarefa.style.textDecoration = "line-through";
        resumos()

    } else {

        elementoTarefa.dataset.categoria = "pendentes";
        elementoTarefa.dataset.status = false;
        objetoTarefaEncontrado.status = false
        tituloTarefa.style.textDecoration = "none";
        resumos()

    }

});


// ============================================================
// PESQUISA DE TAREFAS
// ============================================================

barraPesquisa.addEventListener("input", () => {

    const textoPesquisa = barraPesquisa.value.trim().toLowerCase();
    const elementosTarefas = document.querySelectorAll(".task");

    elementosTarefas.forEach((elementoTarefa) => {

        const nomeTarefa = elementoTarefa.querySelector("h3").textContent.trim().toLowerCase();

        if (nomeTarefa.includes(textoPesquisa)) {

            elementoTarefa.style.display = "grid";

        } else {

            elementoTarefa.style.display = "none";

        }

    });

});


// ============================================================
// FILTROS
botoesFiltros.forEach((botaoFiltro) => {

    botaoFiltro.addEventListener("click", () => {

        const categoriaFiltro = botaoFiltro.dataset.categoria;
        const elementosTarefas = document.querySelectorAll(".task");

        elementosTarefas.forEach((elementoTarefa) => {

            // Mostrar todas

            if (categoriaFiltro === "todos") {
            elementoTarefa.style.display = "grid";
        }
            else if (categoriaFiltro === "importantes") {
                elementoTarefa.style.display =
                    elementoTarefa.dataset.prioridade === "alta" ? "grid" : "none";
            }
            else if (categoriaFiltro === elementoTarefa.dataset.categoria) {
                elementoTarefa.style.display = "grid";
            }
            else {
                elementoTarefa.style.display = "none";
            }

        });

    });

});


// 
function resumos(){
    const cardsResumos = document.querySelectorAll(".card")
    cardsResumos.forEach(card =>{
    const totais = tarefas.length
    const concluidas = tarefas.filter(item => item.status === true).length
    const pendentes = tarefas.filter(item => item.status === false).length
    const importantes = tarefas.filter(item => item.prioridade === 'alta').length
    

    let numCard = card.querySelector("h3")

    if(numCard.dataset.resumo === "totais"){
        numCard.innerHTML = totais
    }
    else if(numCard.dataset.resumo === "concluidas"){
        numCard.innerHTML = concluidas
    }
    else if(numCard.dataset.resumo === "pendentes"){
        numCard.innerHTML = pendentes
    }
    else if(numCard.dataset.resumo === "importantes"){
        numCard.innerHTML = importantes
    }

})

}







