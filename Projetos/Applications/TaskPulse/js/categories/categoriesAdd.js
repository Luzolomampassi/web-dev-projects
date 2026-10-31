let categorias = obterCategorias()

import {calcularDados } from "../data.js";

const nome = document.querySelector("#nome");
const descricaoTxt = document.querySelector("#descricao");
const formularioCategoria = document.querySelector("#form");
const alerta = document.querySelector("#alert");

// ============================================================
// ELEMENTOS DA PRÉ-VISUALIZAÇÃO
// ============================================================

const tituloPrev = document.querySelector("#titulo-prev");
const descricaoPrev = document.querySelector("#descricao-prev");
const iconView = document.querySelector(".icon-view");


// ============================================================
// ELEMENTOS DAS CATEGORIAS
// ============================================================

const modal = document.querySelector("#modal");
const categoryGrid = document.querySelector("#categorias-grid");


// ============================================================
// ÍCONES
// ============================================================

const iconCategory = document.querySelectorAll(".category-icon");

let iconSelecionado = "📚";


// ============================================================
// CORES
// ============================================================

const iconsCor = document.querySelectorAll(".icon-color");

let corSelecionada = "#2563EB";

const cores = {
    azul: "#2563EB",
    roxo: "#7C3AED",
    verde: "#16A34A",
    "azul-marinho": "#0891B2",
    vermelha: "#DC2626",
    laranja: "#D97706",
    rosa: "#DB2777"
};


// ============================================================
// ATUALIZAÇÃO DO TÍTULO
// ============================================================

nome.addEventListener("input", () => {
    tituloPrev.textContent = nome.value;
});


// ============================================================
// ATUALIZAÇÃO DA DESCRIÇÃO
// ============================================================

descricaoTxt.addEventListener("input", () => {

    descricaoPrev.textContent = descricaoTxt.value;

});


// ============================================================
// SELEÇÃO DE CORES
// ============================================================

iconsCor.forEach((cor) => {

    cor.addEventListener("click", () => {

        const nomeDaCor = cor.dataset.color;

        corSelecionada = cores[nomeDaCor];

        iconView.style.backgroundColor = corSelecionada;

    });

});
// ============================================================
// SELEÇÃO DE ÍCONES
// ============================================================
iconCategory.forEach((icon) => {

    icon.addEventListener("click", () => {

        iconSelecionado = icon.dataset.icon;

        iconView.textContent = iconSelecionado;

    });

});
// ============================================================
// VALIDAÇÃO
// ============================================================
function notNull() {

    if (nome.value.trim() === "") {
        return false;
    }

    return true;

}
// ============================================================
// SUBMISSÃO DO FORMULÁRIO
// ============================================================

let categoriaEmEdicaoId = null;

formularioCategoria.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!notNull()) {
        alerta.classList.add("aviso");
        return;
    }

    const dadosCategoria = {
        titulo: nome.value.trim(),
        descricao: descricaoTxt.value.trim(),
        icon: iconSelecionado,
        iconColor: corSelecionada
    };

    // MODO DE EDIÇÃO
    if (categoriaEmEdicaoId !== null) {
        const index = categorias.findIndex(
            categoria => categoria.id === categoriaEmEdicaoId
        );

        if (index === -1) {
            return;
        }

        const categoriaAtualizada = {
            ...categorias[index],
            ...dadosCategoria
        };

        categorias[index] = categoriaAtualizada;

        atualizarCategoriaVisual(categoriaAtualizada);

    } else {
        // MODO DE CRIAÇÃO
        const novaCategoria = {
            id: crypto.randomUUID(),
            ...dadosCategoria
        };

        categorias.push(novaCategoria);
        addCategory(novaCategoria);
    }

    guardarCategoria();
    totalCategory();

    categoriaEmEdicaoId = null;

    formularioCategoria.reset();
    modal.close();
});






// ============================================================
// CRIAR CATEGORIA
// ============================================================
const {quantidadeConcluidas,quantidadePendentes,totalTarefas} = calcularDados()

function addCategory(dados) {
    const item = document.createElement("article");
    item.classList.add("item");
    item.dataset.id = dados.id;

    // ========================================================
    // PARTE SUPERIOR
    // ========================================================

    const itemBrand = document.createElement("div");
    itemBrand.classList.add("item-brand");

    const itemBrandInfo = document.createElement("div");
    itemBrandInfo.classList.add("item-brand-info");

    // ========================================================
    // ÍCONE
    // ========================================================

    const icon = document.createElement("span");
    icon.classList.add("icon");
    icon.textContent = dados.icon;
    icon.style.backgroundColor = dados.iconColor;

    // ========================================================
    // TEXTO
    // ========================================================

    const itemText = document.createElement("div");
    itemText.classList.add("item-text");

    const titulo = document.createElement("h3");
    titulo.textContent = dados.titulo;

    const descricao = document.createElement("p");
    descricao.textContent = dados.descricao;

    // ========================================================
    // MENU DE OPÇÕES
    // ========================================================

    const menuOptions = document.createElement("div");
    menuOptions.classList.add("menu-options");

    const btnOpcoes = document.createElement("button");
    btnOpcoes.classList.add("btn-opcoes");
    btnOpcoes.type = "button";

    btnOpcoes.setAttribute(
        "aria-label",
        `Opções da categoria ${dados.titulo}`
    );

    btnOpcoes.setAttribute("aria-expanded", "false");

    const icondit = document.createElement("i");
    icondit.classList.add(
        "fa-solid",
        "fa-ellipsis-vertical"
    );
    icondit.setAttribute("aria-hidden", "true");

    // ========================================================
    // OPÇÕES
    // ========================================================

    const option = document.createElement("div");
    option.classList.add("option");
    option.id = `opcoes-${dados.id}`;

    btnOpcoes.setAttribute("aria-controls", option.id);

    // ========================================================
    // BOTÃO EDITAR
    // ========================================================

    const btnEditar = document.createElement("button");
    btnEditar.classList.add("btn-option", "btn-editar");
    btnEditar.type = "button";

    btnEditar.setAttribute(
        "aria-label",
        `Editar categoria ${dados.titulo}`
    );

    const iconditar = document.createElement("i");
    iconditar.classList.add("fa-solid", "fa-pen");
    iconditar.setAttribute("aria-hidden", "true");

    const spanEditar = document.createElement("span");
    spanEditar.textContent = "Editar";

    // ========================================================
    // BOTÃO ELIMINAR
    // ========================================================

    const btnEliminar = document.createElement("button");
    btnEliminar.classList.add("btn-option", "btn-eliminar");
    btnEliminar.type = "button";

    btnEliminar.setAttribute(
        "aria-label",
        `Eliminar categoria ${dados.titulo}`
    );

    const iconliminar = document.createElement("i");
    iconliminar.classList.add(
        "fa-regular",
        "fa-trash-can"
    );
    iconliminar.setAttribute("aria-hidden", "true");

    const spanEliminar = document.createElement("span");
    spanEliminar.textContent = "Eliminar";

    // ========================================================
    // STATUS
    // ========================================================

    const status = document.createElement("div");
    status.classList.add("status");

    const tarefasConcluidas = document.createElement("span");
    tarefasConcluidas.classList.add("tasks-concluidas")
    tarefasConcluidas.textContent = "0";

    const tarefasPendentes = document.createElement("span");
    tarefasPendentes.classList.add("tasks-pendentes");
    tarefasPendentes.textContent = "0";

    // ========================================================
    // PROGRESSO
    // ========================================================

    const progressContainer = document.createElement("div");
    progressContainer.classList.add("progress-container");

    const barInfo = document.createElement("div");
    barInfo.classList.add("bar-info");

    const totalTarefas = document.createElement("span");
    totalTarefas.textContent = "0";
    totalTarefas.classList.add("totalTarefas")

    const porcentagem = document.createElement("span");
    porcentagem.textContent = "0%";
    porcentagem.classList.add("percentagem")

    const bar = document.createElement("div");
    bar.classList.add("bar");

    const progress = document.createElement("progress");
    progress.value = 0;
    progress.max = 100;
    progress.style.accentColor = dados.iconColor;

    // ========================================================
    // PARTE INFERIOR
    // ========================================================

    const itemBottom = document.createElement("div");
    itemBottom.classList.add("item-bottom");

    const badge = document.createElement("span");
    badge.classList.add("badge");
    badge.textContent = dados.titulo;

    // ========================================================
    // MONTAGEM DO ELEMENTO
    // ========================================================

    item.appendChild(itemBrand);

    itemBrand.appendChild(itemBrandInfo);
    itemBrand.appendChild(menuOptions);

    itemBrandInfo.appendChild(icon);
    itemBrandInfo.appendChild(itemText);

    itemText.appendChild(titulo);
    itemText.appendChild(descricao);

    menuOptions.appendChild(btnOpcoes);
    menuOptions.appendChild(option);

    btnOpcoes.appendChild(icondit);

    option.appendChild(btnEditar);
    option.appendChild(btnEliminar);

    btnEditar.appendChild(iconditar);
    btnEditar.appendChild(spanEditar);

    btnEliminar.appendChild(iconliminar);
    btnEliminar.appendChild(spanEliminar);

    item.appendChild(status);

    status.appendChild(tarefasConcluidas);
    status.appendChild(tarefasPendentes);

    item.appendChild(progressContainer);

    progressContainer.appendChild(barInfo);
    progressContainer.appendChild(bar);
    progressContainer.appendChild(itemBottom);

    barInfo.appendChild(totalTarefas);
    barInfo.appendChild(porcentagem);

    bar.appendChild(progress);
    itemBottom.appendChild(badge);

    // ========================================================
    // ADICIONAR AO GRID
    // ========================================================

    categoryGrid.appendChild(item);

    // ========================================================
    // ABRIR / FECHAR MENU DE OPÇÕES
    // ========================================================

    btnOpcoes.addEventListener("click", () => {
        const abrir = !option.classList.contains("is-open");

        // Fechar todos os menus abertos
        categoryGrid
            .querySelectorAll(".option.is-open")
            .forEach(menu => {
                menu.classList.remove("is-open");

                menu.previousElementSibling?.setAttribute(
                    "aria-expanded",
                    "false"
                );
            });

        // Abrir o menu atual, se estava fechado
        if (abrir) {
            option.classList.add("is-open");

            btnOpcoes.setAttribute("aria-expanded", "true");
        }
    });

    // ========================================================
    // EDITAR CATEGORIA — FUNCIONALIDADE INCOMPLETA
    // ========================================================

    
    btnEditar.addEventListener("click", () => {
        const elemento = btnEditar.closest(".item");

        if (!elemento) {
            return;
        }

        const id = elemento.dataset.id;

        const categoria = categorias.find(
            categoria => categoria.id === id
        );

        if (!categoria) {
            return;
        }

        // Guardar o ID da categoria que será editada
        categoriaEmEdicaoId = categoria.id;

        // Preencher os campos com os dados existentes
        nome.value = categoria.titulo;
        descricaoTxt.value = categoria.descricao;

        // Atualizar a pré-visualização
        tituloPrev.textContent = categoria.titulo;
        descricaoPrev.textContent = categoria.descricao;

        // Carregar o ícone
        iconSelecionado = categoria.icon;
        iconView.textContent = categoria.icon;

        // Carregar a cor
        corSelecionada = categoria.iconColor;
        iconView.style.backgroundColor = categoria.iconColor;

        modal.showModal();
    });

    // ========================================================
    // ELIMINAR CATEGORIA
    // ========================================================

    btnEliminar.addEventListener("click", () => {
        const elemento = btnEliminar.closest(".item");
        const elementoId = elemento.dataset.id;

        const index = categorias.findIndex(
            categoria => categoria.id === elementoId
        );

        if (index === -1) {
            return;
        }

        categorias.splice(index, 1);
        elemento.remove();

        totalCategory();
        guardarCategoria();
    });
}

function obterCategorias(){
    try{
        const dadosJSON = localStorage.getItem("categorias") ?? "[]"

        const categorias = JSON.parse(dadosJSON)

        return Array.isArray(categorias) ? categorias : []
                  
    }
    
    catch(erro){
        console.error("Não foi possível carregar as categorias:", erro);
        return []
    }
}

function guardarCategoria(){
    localStorage.setItem("categorias", JSON.stringify(categorias))
}

function totalCategory() {

    const{quantidadeConcluidas, quantidadePendentes,totalTarefas}= calcularDados();
    
    const totalCategoriaElemento = document.querySelector("#total-categorias");
    const totalTarefasElemento = document.querySelector("#total-tarefas");
    const totalConcluidasElemento = document.querySelector("#total-concluidas");
    const totalPendentesElemento = document.querySelector("#total-pendentes");

    totalCategoriaElemento.textContent = categorias.length;
    totalTarefasElemento.textContent = totalTarefas
    totalConcluidasElemento.textContent = quantidadeConcluidas;
    totalPendentesElemento.textContent = quantidadePendentes;
}

function atualizarCategoriaVisual(dados) {
    const elemento = [...categoryGrid.querySelectorAll(".item")]
        .find(item => item.dataset.id === dados.id);

    if (!elemento) {
        return;
    }

    const icon = elemento.querySelector(".icon");

    icon.textContent = dados.icon;
    icon.style.backgroundColor = dados.iconColor;

    elemento.querySelector("h3").textContent = dados.titulo;
    elemento.querySelector("p").textContent = dados.descricao;

    elemento.querySelector("progress").style.accentColor =
        dados.iconColor;

    elemento.querySelector(".badge").textContent = dados.titulo;

    elemento.querySelector(".btn-opcoes").setAttribute(
        "aria-label",
        `Opções da categoria ${dados.titulo}`
    );

    elemento.querySelector(".btn-editar").setAttribute(
        "aria-label",
        `Editar categoria ${dados.titulo}`
    );

    elemento.querySelector(".btn-eliminar").setAttribute(
        "aria-label",
        `Eliminar categoria ${dados.titulo}`
    );
}


categorias.forEach(categoria => {
    addCategory(categoria);
});


totalCategory();



