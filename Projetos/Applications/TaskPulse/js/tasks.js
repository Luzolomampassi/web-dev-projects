import { calcularDados, obterTarefas } from "./data.js";

const tarefas = obterTarefas();
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
const botoesAbrirModal = document.querySelectorAll(".btn-add");
const botoesCancelar = document.querySelectorAll(".btn-cancel");

// Lista de tarefas
const listaTarefas = document.querySelector(".list-tasks");

// Pesquisa
const barSearch = document.querySelector("#bar-search");

// Filtros
const botoesFiltros = document.querySelectorAll(".btn-filters");

// Alerta personalizado
const alertaPersonalizado = document.querySelector("#alert");
const botaoAlerta = document.querySelector("#btn-alert");

// Estado vazio
const estadoVazio = document.querySelector("#void-section");

// ============================================================
// ESTADO DA EDIÇÃO
// ============================================================

// null significa que o formulário está no modo de criação.
// Um ID significa que estamos a editar uma tarefa existente.
let idTarefaEmEdicao = null;

// ============================================================
// INICIALIZAÇÃO
// ============================================================

// Renderizar tarefas que já existam no array
tarefas.forEach((tarefa) => {
    listaTarefas.appendChild(criarTarefa(tarefa));
});

atualizarEstadoVazio();
resumos();

// ============================================================
// EVENTO DO FORMULÁRIO
// ============================================================

formularioTarefa.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!validarFormulario()) {
        dispararAlerta();
        return;
    }

    // MODO DE EDIÇÃO
    if (idTarefaEmEdicao !== null) {
        const indiceTarefa = tarefas.findIndex(
            (tarefa) => tarefa.id === idTarefaEmEdicao
        );

        if (indiceTarefa === -1) {
            dispararAlerta();
            return;
        }

        const tarefaAtualizada = {
            ...tarefas[indiceTarefa],
            ...obterDadosFormulario()
        };

        tarefas[indiceTarefa] = tarefaAtualizada;

        // Encontrar o cartão antigo.
        const elementoAntigo = Array.from(
            listaTarefas.querySelectorAll(".task")
        ).find(
            (elemento) => elemento.dataset.id === idTarefaEmEdicao
        );

        // Criar o cartão atualizado.
        const novoElemento = criarTarefa(tarefaAtualizada);

        if (elementoAntigo) {
            elementoAntigo.replaceWith(novoElemento);
        } else {
            listaTarefas.appendChild(novoElemento);
        }

    } else {
        // MODO DE CRIAÇÃO
        const dadosTarefa = converterDados();

        tarefas.push(dadosTarefa);

        listaTarefas.appendChild(criarTarefa(dadosTarefa));
    }

    // Finalizar a operação
    idTarefaEmEdicao = null;

    formularioTarefa.reset();

    atualizarEstadoVazio();
    resumos();
    salvarTarefas();

    modalTarefa.close();
});

// ============================================================
// ABRIR MODAL PARA CRIAR TAREFA
// ============================================================

botoesAbrirModal.forEach((botao) => {
    botao.addEventListener("click", () => {
        // Garantir que não estamos a editar outra tarefa.
        idTarefaEmEdicao = null;

        formularioTarefa.reset();

        modalTarefa.showModal();
    });
});

// ============================================================
// FECHAR MODAL
// ============================================================

// Clicar fora do conteúdo do modal
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

// Limpar o modo de edição quando o modal for fechado,
// incluindo quando o utilizador pressionar Escape.
modalTarefa.addEventListener("close", () => {
    idTarefaEmEdicao = null;
    formularioTarefa.reset();
});

// ============================================================
// ALERTA PERSONALIZADO
// ============================================================

botaoAlerta.addEventListener("click", () => {
    alertaPersonalizado.classList.remove("ativo");
});

function dispararAlerta() {
    alertaPersonalizado.classList.add("ativo");
}

// ============================================================
// ESTADO VAZIO
// ============================================================

function atualizarEstadoVazio() {
    if (tarefas.length === 0) {
        estadoVazio.classList.add("is-active");
    } else {
        estadoVazio.classList.remove("is-active");
    }
}

// ============================================================
// VALIDAÇÃO DO FORMULÁRIO
// ============================================================

function validarFormulario() {

    if (campoTitulo.value.trim() === "") {
        return false;
    }

    if (campoCategoria.value === "") {
        return false;
    }

    // Definir a data atual caso não tenha sido indicada.
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
// OBTER DADOS DO FORMULÁRIO
// ============================================================

function obterDadosFormulario() {
    return {
        titulo: campoTitulo.value.trim(),
        descricao: campoDescricao.value.trim(),
        categoria: campoCategoria.value,
        vencimento: campoVencimento.value,
        horario: campoHorario.value,
        prioridade: campoPrioridade.value
    };
}

// ============================================================
// CONVERTER DADOS PARA UMA NOVA TAREFA
// ============================================================

function converterDados() {
    return {
        id: crypto.randomUUID(),
        ...obterDadosFormulario(),
        status: false
    };
}

// ============================================================
// CRIAR ELEMENTO DA TAREFA
// ============================================================

function criarTarefa(dadosTarefa) {
    // Elemento principal
    const elementoTarefa = document.createElement("div");

    elementoTarefa.classList.add("task");
    elementoTarefa.dataset.categoria = dadosTarefa.status ? "concluidas" : "pendentes";
    elementoTarefa.dataset.status = String(dadosTarefa.status);
    elementoTarefa.dataset.id = dadosTarefa.id;
    elementoTarefa.dataset.arquivada = false;

    // Checkbox
    const rotuloCheckbox = document.createElement("label");

    const checkboxConclusao = document.createElement("input");

    checkboxConclusao.type = "checkbox";
    checkboxConclusao.classList.add("check");
    checkboxConclusao.checked = dadosTarefa.status === true;

    checkboxConclusao.addEventListener("change", () => {
        dadosTarefa.status = checkboxConclusao.checked;
        elementoTarefa.dataset.status = String(dadosTarefa.status);
        elementoTarefa.dataset.categoria = dadosTarefa.status ? "concluidas" : "pendentes";
        salvarTarefas();
        resumos();
    });

    rotuloCheckbox.appendChild(checkboxConclusao);

    // Conteúdo
    const conteudoTarefa = document.createElement("div");

    const tituloTarefa = document.createElement("h3");
    tituloTarefa.textContent = dadosTarefa.titulo;

    const descricaoTarefa = document.createElement("p");
    descricaoTarefa.textContent = dadosTarefa.descricao;

    // Badges
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

    // Classe da prioridade
    const prioridadeTarefa = dadosTarefa.prioridade.toLowerCase();

    elementoTarefa.dataset.prioridade = prioridadeTarefa;

    if (prioridadeTarefa === "alta") {
        badgePrioridade.classList.add("alta");
    } else if (prioridadeTarefa === "media") {
        badgePrioridade.classList.add("media");
    } else {
        badgePrioridade.classList.add("baixa");
    }

    // Montagem dos badges
    containerBadges.appendChild(badgeCategoria);
    containerBadges.appendChild(badgeVencimento);
    containerBadges.appendChild(badgePrioridade);

    // Montagem do conteúdo
    conteudoTarefa.appendChild(tituloTarefa);
    conteudoTarefa.appendChild(descricaoTarefa);
    conteudoTarefa.appendChild(containerBadges);

    // Botões de ação
    const containerAcoes = document.createElement("div");
    containerAcoes.classList.add("task-actions");

    // Botão editar
    const botaoEditar = document.createElement("button");

    botaoEditar.classList.add("btn-edit");
    botaoEditar.setAttribute("aria-label", "Editar a tarefa");
    botaoEditar.setAttribute("title", "Editar tarefa");

    const iconeEditar = document.createElement("i");

    iconeEditar.classList.add(
        "fa-regular",
        "fa-pen-to-square"
    );

    botaoEditar.appendChild(iconeEditar);

    // Botão eliminar
    const botaoDeletar = document.createElement("button");

    botaoDeletar.classList.add("btn-delet");
    botaoDeletar.setAttribute("aria-label", "Eliminar a tarefa");
    botaoDeletar.setAttribute("title", "Eliminar tarefa");

    const iconeDeletar = document.createElement("i");

    iconeDeletar.classList.add(
        "fa-regular",
        "fa-trash-can"
    );

    botaoDeletar.appendChild(iconeDeletar);

    // Montagem dos botões
    containerAcoes.appendChild(botaoEditar);
    containerAcoes.appendChild(botaoDeletar);

    // Montagem final
    elementoTarefa.appendChild(rotuloCheckbox);
    elementoTarefa.appendChild(conteudoTarefa);
    elementoTarefa.appendChild(containerAcoes);

    // Eliminar tarefa
    botaoDeletar.addEventListener("click", () => {
        const indice = tarefas.findIndex(
            (tarefa) => tarefa.id === dadosTarefa.id
        );
        if (indice === -1) {
            return;
        }

        tarefas.splice(indice, 1);
        elementoTarefa.remove();
        salvarTarefas();
        atualizarEstadoVazio();
        resumos();
    });

    // Devolver o elemento para ser inserido ou substituir o antigo.
    return elementoTarefa;
}

function salvarTarefas() {
    localStorage.setItem("tarefas", JSON.stringify(tarefas));
}

// ============================================================
// EDITAR TAREFA — DELEGAÇÃO DE EVENTOS
// ============================================================

listaTarefas.addEventListener("click", (event) => {
    const botaoEditar = event.target.closest(".btn-edit");

    if (!botaoEditar) {
        return;
    }

    const elementoTarefa = botaoEditar.closest(".task");

    if (!elementoTarefa) {
        return;
    }

    const idTarefa = elementoTarefa.dataset.id;

    const objetoTarefaEncontrado = tarefas.find(
        (tarefa) => tarefa.id === idTarefa
    );

    if (!objetoTarefaEncontrado) {
        return;
    }

    // Guardar o ID para que o submit saiba qual tarefa atualizar.
    idTarefaEmEdicao = idTarefa;

    // Preencher o formulário com os dados existentes.
    campoTitulo.value = objetoTarefaEncontrado.titulo;
    campoDescricao.value = objetoTarefaEncontrado.descricao;
    campoCategoria.value = objetoTarefaEncontrado.categoria;
    campoVencimento.value = objetoTarefaEncontrado.vencimento;
    campoHorario.value = objetoTarefaEncontrado.horario;
    campoPrioridade.value = objetoTarefaEncontrado.prioridade;

    modalTarefa.showModal();
});

// ============================================================
// PESQUISA DE TAREFAS
// ============================================================

barSearch.addEventListener("input", (event) => {
    const textoPesquisa = barSearch.value.trim().toLowerCase();
    const elementosTarefas = document.querySelectorAll(".task");

    elementosTarefas.forEach((elementoTarefa) => {
        const nomeTarefa = elementoTarefa
            .querySelector("h3")
            .textContent.trim()
            .toLowerCase();

        elementoTarefa.style.display = nomeTarefa.includes(textoPesquisa)
            ? "grid"
            : "none";
    });
});

// ============================================================
// FILTROS
// ============================================================

botoesFiltros.forEach((botaoFiltro) => {
    botaoFiltro.addEventListener("click", () => {
        const categoriaFiltro = botaoFiltro.dataset.categoria;
        const elementosTarefas = document.querySelectorAll(".task");

        elementosTarefas.forEach((elementoTarefa) => {
            if (categoriaFiltro === "todos") {
                elementoTarefa.style.display = "grid";
            } else if (categoriaFiltro === "importantes") {
                elementoTarefa.style.display =
                    elementoTarefa.dataset.prioridade === "alta"
                        ? "grid"
                        : "none";
            } else if (
                categoriaFiltro === elementoTarefa.dataset.categoria
            ) {
                elementoTarefa.style.display = "grid";
            } else {
                elementoTarefa.style.display = "none";
            }
        });
    });
});

const botoesOrder = document.querySelectorAll(".btn-order")

botoesOrder.forEach(botao => {
    botao.addEventListener("click", () =>{
        if(botao.dataset.ordem === "grid"){
            listaTarefas.classList.add("grid")
        }
        else{
            listaTarefas.classList.remove("grid")
        }
    })
});

// ============================================================
// RESUMOS
// ============================================================

function resumos() {
    const dados = calcularDados(tarefas);

    document.querySelectorAll("[data-resumo]").forEach((resumo) => {
        const contador = resumo.matches("h3") ? resumo : resumo.querySelector("h3");

        if (!contador) {
            return;
        }

        const valores = {
            totais: dados.totalTarefas,
            concluidas: dados.quantidadeConcluidas,
            pendentes: dados.quantidadePendentes,
            importantes: dados.quantidadeImportantes
        };

        if (Object.hasOwn(valores, resumo.dataset.resumo)) {
            contador.textContent = valores[resumo.dataset.resumo];
        }
    });
}
