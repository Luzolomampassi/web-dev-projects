

// ELEMENTOS DO FORMULÁRIO

const nome = document.querySelector("#nome");
const descricaoTxt = document.querySelector("#descricao");
const form = document.querySelector("#form");
const alerta = document.querySelector("#alert");


// ELEMENTOS DA PRÉ-VISUALIZAÇÃO

const tituloPrev = document.querySelector("#titulo-prev");
const descricaoPrev = document.querySelector("#descricao-prev");
const iconView = document.querySelector("#icon-view");


// ELEMENTOS DAS CATEGORIAS

const categoryItem = document.querySelectorAll(".item");
const categoryGrid = document.querySelector("#categorias-grid");
const btnCria = document.querySelector(".btn-criar");


// ÍCONES

const iconeCategory = document.querySelectorAll(".category-icon");

const icones = {
    estudos: "📚",
    trabalho: "💼",
    saude: "🏃",
    compras: "🛒",
    metas: "🎯",
    natureza: "🌿",
    ideias: "💡",
    criatividade: "🎨",
    ciencia: "🔬",
    viagens: "✈️",
    casa: "🏠",
    musica: "🎵"
};

let iconeSelecionado = "📚";


// CORES

const iconesCor = document.querySelectorAll(".icon-color");

let corSelecionada = "#2563EB";

const cores = {
    azul: "#2563EB",
    roxo: "#7C3AED",
    verde: "#16A34A",
    "azul-marinho": "#0891B2",
    vermelha: "#DC2626",
    laranja: "#D97706",
    rosa: "#DB2777",
};


// ATUALIZAÇÃO DO TÍTULO

nome.addEventListener("input", () => {
    tituloPrev.textContent = nome.value;
});


// ATUALIZAÇÃO DA DESCRIÇÃO

descricaoTxt.addEventListener("input", () => {
    descricaoPrev.textContent = descricaoTxt.value;
});


// SELEÇÃO DE CORES

iconesCor.forEach((cor) => {

    cor.addEventListener("click", () => {

        const nomeDaCor = cor.dataset.color;

        corSelecionada = cores[nomeDaCor];

        iconView.style.backgroundColor = corSelecionada;
    });

});


// SELEÇÃO DE ÍCONES

iconeCategory.forEach((icone) => {

    icone.addEventListener("click", () => {

        iconeSelecionado = icone.dataset.icon;

        iconView.textContent = iconeSelecionado;
    });

});


// VALIDAÇÃO

function notNull() {

    if (nome.value.trim() === "") {
        return false;
    }

    return true;
}


// SUBMISSÃO DO FORMULÁRIO

form.addEventListener("submit", (event) => {

    event.preventDefault();

    if (notNull() === false) {

        alerta.classList.add("aviso");

        return;
    }

    const categoria = {

        titulo: nome.value,
        descricao: descricaoTxt.value,
        icone: iconeSelecionado,
        iconeColor: corSelecionada,

    };

    addCategory(categoria);

});


// CRIAR CATEGORIA

function addCategory(dados) {

    const lista = document.querySelector(".categorias-grid");

    const item = document.createElement("article");
    item.classList.add("item");


    // -------------------------------
    // PARTE SUPERIOR
    // -------------------------------

    const itemBrand = document.createElement("div");
    itemBrand.classList.add("item-brand");

    const itemBrandInfo = document.createElement("div");
    itemBrandInfo.classList.add("item-brand-info");


    // -------------------------------
    // ÍCONE
    // -------------------------------

    const icon = document.createElement("span");

    icon.classList.add("icon");

    icon.textContent = dados.icone;

    icon.style.backgroundColor = dados.iconeColor;


    // -------------------------------
    // TEXTO
    // -------------------------------

    const itemText = document.createElement("div");
    itemText.classList.add("item-text");

    const titulo = document.createElement("h3");
    titulo.textContent = dados.titulo;

    const descricao = document.createElement("p");
    descricao.textContent = dados.descricao;


    // -------------------------------
    // MENU DE OPÇÕES
    // -------------------------------

    const menuOptions = document.createElement("div");
    menuOptions.classList.add("menu-options");

    const btnEdit = document.createElement("button");

    btnEdit.classList.add("btn-edit");

    btnEdit.type = "button";

    btnEdit.setAttribute(
        "aria-label",
        `Opções da categoria ${dados.titulo}`
    );


    const iconEdit = document.createElement("i");

    iconEdit.classList.add(
        "fa-solid",
        "fa-ellipsis-vertical"
    );


    // -------------------------------
    // OPÇÕES
    // -------------------------------

    const option = document.createElement("div");

    option.classList.add("option");


    // -------------------------------
    // BOTÃO EDITAR
    // -------------------------------

    const btnEditar = document.createElement("button");

    btnEditar.classList.add(
        "btn-option",
        "btn-editar"
    );

    btnEditar.type = "button";

    btnEditar.setAttribute(
        "aria-label",
        `Editar categoria ${dados.titulo}`
    );


    const iconEditar = document.createElement("i");

    iconEditar.classList.add(
        "fa-solid",
        "fa-pen"
    );


    const spanEditar = document.createElement("span");

    spanEditar.textContent = "Editar";


    // -------------------------------
    // BOTÃO ELIMINAR
    // -------------------------------

    const btnEliminar = document.createElement("button");

    btnEliminar.classList.add(
        "btn-option",
        "btn-eliminar"
    );

    btnEliminar.type = "button";

    btnEliminar.setAttribute(
        "aria-label",
        `Eliminar categoria ${dados.titulo}`
    );


    const iconEliminar = document.createElement("i");

    iconEliminar.classList.add(
        "fa-regular",
        "fa-trash-can"
    );

    const spanEliminar = document.createElement("span");

    spanEliminar.textContent = "Eliminar";


    // -------------------------------
    // STATUS
    // -------------------------------

    const status = document.createElement("div");

    status.classList.add("status");


    const tarefasConcluidas = document.createElement("span");

    tarefasConcluidas.textContent = "0";


    const tarefasPendentes = document.createElement("span");

    tarefasPendentes.classList.add(
        "task-pendentes"
    );

    tarefasPendentes.textContent = "0";


    // -------------------------------
    // PROGRESSO
    // -------------------------------

    const progressContainer = document.createElement("div");

    progressContainer.classList.add(
        "progress-container"
    );


    const barInfo = document.createElement("div");

    barInfo.classList.add("bar-info");


    const totalTarefas = document.createElement("span");

    totalTarefas.textContent = "0";


    const porcentagem = document.createElement("span");

    porcentagem.textContent = "0%";


    const bar = document.createElement("div");

    bar.classList.add("bar");


    const progress = document.createElement("progress");

    progress.value = 0;

    progress.max = 100;

    progress.style.accentColor = corSelecionada;


    // -------------------------------
    // PARTE INFERIOR
    // -------------------------------

    const itemBottom = document.createElement("div");

    itemBottom.classList.add("item-bottom");


    const badge = document.createElement("span");

    badge.classList.add("badge");

    badge.textContent = dados.titulo;


    
    // MONTAGEM DO ELEMENTO
    

    item.appendChild(itemBrand);


    itemBrand.appendChild(itemBrandInfo);

    itemBrand.appendChild(menuOptions);


    itemBrandInfo.appendChild(icon);

    itemBrandInfo.appendChild(itemText);


    itemText.appendChild(titulo);

    itemText.appendChild(descricao);


    // -------------------------------
    // MENU
    // -------------------------------

    menuOptions.appendChild(btnEdit);

    menuOptions.appendChild(option);


    btnEdit.appendChild(iconEdit);


    option.appendChild(btnEditar);

    option.appendChild(btnEliminar);


    btnEditar.appendChild(iconEditar);

    btnEditar.appendChild(spanEditar);


    btnEliminar.appendChild(iconEliminar);

    btnEliminar.appendChild(spanEliminar);


    // -------------------------------
    // STATUS
    // -------------------------------

    item.appendChild(status);


    status.appendChild(tarefasConcluidas);

    status.appendChild(tarefasPendentes);


    // -------------------------------
    // PROGRESSO
    // -------------------------------

    item.appendChild(progressContainer);


    progressContainer.appendChild(barInfo);

    progressContainer.appendChild(bar);

    progressContainer.appendChild(itemBottom);


    barInfo.appendChild(totalTarefas);

    barInfo.appendChild(porcentagem);


    bar.appendChild(progress);


    itemBottom.appendChild(badge);


    // -------------------------------
    // ADICIONAR AO GRID
    // -------------------------------

    lista.appendChild(item);


    
    // EVENTOS DO MENU
    

    btnEdit.addEventListener("click", () => {
        option.classList.toggle("editar");

    });


    
    // ELIMINAR CATEGORIA
    

    btnEliminar.addEventListener("click", () => {
        item.remove();
    });

}

