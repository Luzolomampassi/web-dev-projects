
import {
    obterTarefas,
    salvarTarefas
} from "./data.js";

// ============================================================
// ELEMENTOS DO DOM
// ============================================================

const elementoCalendario = document.querySelector("#calendario");

const modalTarefa = document.querySelector("#modal");
const formularioTarefa = document.querySelector("#form-task");

const campoTitulo = document.querySelector("#tarefa");
const campoDescricao = document.querySelector("#descricao");
const campoCategoria = document.querySelector("#categoria");
const campoVencimento = document.querySelector("#data");
const campoHorario = document.querySelector("#time");
const campoPrioridade = document.querySelector("#prioridade");

const tituloModal = modalTarefa.querySelector("h2");
const botaoSubmeter = formularioTarefa.querySelector(
    'button[type="submit"]'
);

const botoesCancelar = modalTarefa.querySelectorAll(".btn-cancel");

const botaoNovaTarefa = document.querySelector("#btn-nova-tarefa");

const botaoHoje = document.querySelector("#btn-hoje");
const botaoMesAnterior = document.querySelector("#btn-mes-anterior");
const botaoMesProximo = document.querySelector("#btn-mes-proximo");

const botaoMes = document.querySelector("#btn-mes");
const botaoSemana = document.querySelector("#btn-semana");
const botaoDia = document.querySelector("#btn-dia");

const tituloMes = document.querySelector("#mes-atual");

const filtroCategoria = document.querySelector("#filtro-categoria");
const listaProximasTarefas = document.querySelector("#lista-proximas-tarefas");
const listaTarefasDia = document.querySelector("#lista-tarefas-dia");

// ============================================================
// ESTADO
// ============================================================

let idTarefaEmEdicao = null;

let dataSelecionada = obterDataLocal(new Date());

// ============================================================
// DATAS
// ============================================================

// Formatar a data local sem depender de UTC.
function obterDataLocal(data) {
    const ano = data.getFullYear();

    const mes = String(
        data.getMonth() + 1
    ).padStart(2, "0");

    const dia = String(
        data.getDate()
    ).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
}

// ============================================================
// CONVERSÃO DE TAREFAS PARA EVENTOS
// ============================================================

function converterTarefaParaEvento(tarefa) {
    const evento = {
        id: tarefa.id,
        title: tarefa.titulo,

        start: tarefa.horario
            ? `${tarefa.vencimento}T${tarefa.horario}:00`
            : tarefa.vencimento,

        allDay: !tarefa.horario,

        extendedProps: {
            descricao: tarefa.descricao,
            categoria: tarefa.categoria,
            prioridade: tarefa.prioridade,
            status: tarefa.status
        }
    };

    return evento;
}

// ============================================================
// CARREGAR TAREFAS
// ============================================================

function obterEventos() {
    const tarefas = obterTarefas();

    const categoriaSelecionada = filtroCategoria.value;

    return tarefas
        .filter(tarefa => {
            if (categoriaSelecionada === "todas") {
                return true;
            }

            return tarefa.categoria === categoriaSelecionada;
        })
        .filter(tarefa => Boolean(tarefa.vencimento))
        .map(converterTarefaParaEvento);
}

// ============================================================
// CALENDÁRIO
// ============================================================

const calendario = new FullCalendar.Calendar(
    elementoCalendario,
    {
        initialView: "dayGridMonth",

        locale: "pt-br",

        height: "auto",

        headerToolbar: false,

        selectable: true,

        editable: true,

        dayMaxEvents: 3,

        events(fetchInfo, successCallback) {
            successCallback(obterEventos());
        },

        // Clicar numa tarefa existente.
        eventClick(info) {
            abrirModalEdicao(info.event.id);
        },

        // Mover uma tarefa para outra data.
        eventDrop(info) {
            atualizarDataTarefa(info);
        },

        // Atualizar o título do mês.
        datesSet(info) {
            atualizarTituloCalendario(info.view);
        },

        // Selecionar um dia vazio.
        dateClick(info) {
            dataSelecionada = info.dateStr.slice(0, 10);

            atualizarBotaoDiaSelecionado(info.dayEl);
            atualizarResumoDia(dataSelecionada);
            renderizarTarefasDoDia(dataSelecionada);

            abrirModalCriacao(dataSelecionada);
        }
    }
);

calendario.render();

// ============================================================
// NAVEGAÇÃO
// ============================================================

botaoHoje.addEventListener("click", () => {
    calendario.today();

    dataSelecionada = obterDataLocal(new Date());

    atualizarResumoDia(dataSelecionada);
    renderizarTarefasDoDia(dataSelecionada);
});

botaoMesAnterior.addEventListener("click", () => {
    calendario.prev();
});

botaoMesProximo.addEventListener("click", () => {
    calendario.next();
});

botaoMes.addEventListener("click", () => {
    calendario.changeView("dayGridMonth");

    atualizarBotaoVista(botaoMes);
});

botaoSemana.addEventListener("click", () => {
    calendario.changeView("timeGridWeek");

    atualizarBotaoVista(botaoSemana);
});

botaoDia.addEventListener("click", () => {
    calendario.changeView("timeGridDay");

    atualizarBotaoVista(botaoDia);
});

function atualizarBotaoVista(botaoAtivo) {
    document.querySelectorAll(".calendar-view .btn-filter")
        .forEach(botao => {
            botao.classList.remove("is-active");
        });

    botaoAtivo.classList.add("is-active");
}

function atualizarTituloCalendario(view) {
    const formatador = new Intl.DateTimeFormat(
        "pt-PT",
        {
            month: "long",
            year: "numeric"
        }
    );

    tituloMes.textContent = formatador.format(view.currentStart);
}

// ============================================================
// FILTRO POR CATEGORIA
// ============================================================

filtroCategoria.addEventListener("change", () => {
    calendario.refetchEvents();
    atualizarResumoDia(dataSelecionada);
    renderizarTarefasDoDia(dataSelecionada);
    renderizarProximasTarefas();
});

// ============================================================
// ABRIR MODAL
// ============================================================

botaoNovaTarefa.addEventListener("click", () => {
    abrirModalCriacao(dataSelecionada);
});

function abrirModalCriacao(data) {
    idTarefaEmEdicao = null;

    formularioTarefa.reset();

    campoVencimento.value = data;

    tituloModal.textContent = "Nova Tarefa";

    botaoSubmeter.textContent = "Adicionar Tarefa";

    modalTarefa.showModal();
}

function abrirModalEdicao(id) {
    const tarefas = obterTarefas();

    const tarefa = tarefas.find(
        tarefa => tarefa.id === id
    );

    if (!tarefa) {
        return;
    }

    idTarefaEmEdicao = tarefa.id;

    campoTitulo.value = tarefa.titulo;
    campoDescricao.value = tarefa.descricao;
    campoCategoria.value = tarefa.categoria;
    campoVencimento.value = tarefa.vencimento;
    campoHorario.value = tarefa.horario;
    campoPrioridade.value = tarefa.prioridade;

    tituloModal.textContent = "Editar Tarefa";

    botaoSubmeter.textContent = "Guardar Alterações";

    modalTarefa.showModal();
}

// ============================================================
// FECHAR MODAL
// ============================================================

botoesCancelar.forEach(botao => {
    botao.addEventListener("click", () => {
        modalTarefa.close();
    });
});

modalTarefa.addEventListener("click", event => {
    if (event.target === modalTarefa) {
        modalTarefa.close();
    }
});

modalTarefa.addEventListener("close", () => {
    idTarefaEmEdicao = null;

    formularioTarefa.reset();
});

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
// SUBMETER FORMULÁRIO
// ============================================================

formularioTarefa.addEventListener("submit", event => {
    event.preventDefault();

    if (!formularioTarefa.reportValidity()) {
        return;
    }

    const dadosFormulario = obterDadosFormulario();

    const tarefas = obterTarefas();

    if (idTarefaEmEdicao !== null) {
        const indice = tarefas.findIndex(
            tarefa => tarefa.id === idTarefaEmEdicao
        );

        if (indice === -1) {
            return;
        }

        tarefas[indice] = {
            ...tarefas[indice],
            ...dadosFormulario
        };

    } else {
        const novaTarefa = {
            id: crypto.randomUUID(),

            ...dadosFormulario,

            status: false
        };

        tarefas.push(novaTarefa);
    }

    salvarTarefas(tarefas);

    atualizarCalendario();

    modalTarefa.close();
});

// ============================================================
// ATUALIZAR DATA DE UMA TAREFA
// ============================================================

function atualizarDataTarefa(info) {
    const tarefas = obterTarefas();

    const tarefa = tarefas.find(
        tarefa => tarefa.id === info.event.id
    );

    if (!tarefa) {
        info.revert();

        return;
    }

    tarefa.vencimento = obterDataLocal(info.event.start);

    if (info.event.allDay) {
        tarefa.horario = "";

    } else {
        const horas = String(
            info.event.start.getHours()
        ).padStart(2, "0");

        const minutos = String(
            info.event.start.getMinutes()
        ).padStart(2, "0");

        tarefa.horario = `${horas}:${minutos}`;
    }

    try {
        salvarTarefas(tarefas);

        atualizarCalendario();

    } catch (erro) {
        console.error("Erro ao atualizar tarefa:", erro);

        info.revert();
    }
}

// ============================================================
// RESUMO DO DIA
// ============================================================

function atualizarResumoDia(data) {
    const tarefasDoDia = obterTarefasFiltradas().filter(
        tarefa => normalizarData(tarefa.vencimento) === data
    );

    const concluidas = tarefasDoDia.filter(
        tarefa => tarefa.status === true
    ).length;

    const altaPrioridade = tarefasDoDia.filter(
        tarefa => tarefa.prioridade === "alta"
    ).length;

    const dataFormatada = formatarData(data);
    document.querySelector("#data-resumo").textContent = dataFormatada;
    document.querySelector("#data-tarefas-dia").textContent = `Tarefas de ${dataFormatada}`;

    document.querySelector("#total-tarefas-dia").textContent =
        tarefasDoDia.length;

    document.querySelector("#tarefas-concluidas-dia").textContent =
        concluidas;

    document.querySelector("#tarefas-pendentes-dia").textContent =
        tarefasDoDia.length - concluidas;

    document.querySelector("#tarefas-prioridade-alta").textContent =
        altaPrioridade;

    renderizarTarefasDoDia(data);
    renderizarProximasTarefas();
}

// ============================================================
// LISTAS DE TAREFAS
// ============================================================

function obterTarefasFiltradas() {
    const tarefas = obterTarefas();

    if (filtroCategoria.value === "todas") {
        return tarefas;
    }

    return tarefas.filter(
        tarefa => tarefa.categoria === filtroCategoria.value
    );
}

function renderizarTarefasDoDia(data) {
    const tarefasDoDia = obterTarefasFiltradas()
        .filter(tarefa => normalizarData(tarefa.vencimento) === data)
        .sort(compararTarefas);

    listaTarefasDia.replaceChildren();

    if (tarefasDoDia.length === 0) {
        listaTarefasDia.appendChild(criarEstadoVazio("Não há tarefas para este dia."));
        return;
    }

    tarefasDoDia.forEach(tarefa => {
        listaTarefasDia.appendChild(criarCartaoTarefa(tarefa, true));
    });
}

function renderizarProximasTarefas() {
    const hoje = obterDataLocal(new Date());
    const tarefas = obterTarefasFiltradas()
        .filter(tarefa =>
            tarefa.status !== true &&
            normalizarData(tarefa.vencimento) >= hoje
        )
        .sort(compararTarefas)
        .slice(0, 5);

    listaProximasTarefas.replaceChildren();

    if (tarefas.length === 0) {
        listaProximasTarefas.appendChild(criarEstadoVazio("Não há próximas tarefas."));
        return;
    }

    tarefas.forEach(tarefa => {
        listaProximasTarefas.appendChild(criarCartaoTarefa(tarefa, false));
    });
}

function criarCartaoTarefa(tarefa, mostrarAcoes) {
    const cartao = document.createElement("article");
    cartao.classList.add("task-item");
    if (tarefa.status) cartao.classList.add("is-complete");
    cartao.dataset.id = tarefa.id;

    const informacao = document.createElement("div");
    informacao.classList.add("task-info");

    const titulo = document.createElement("h3");
    titulo.textContent = tarefa.titulo;

    const detalhe = document.createElement("p");
    detalhe.textContent = `${formatarData(normalizarData(tarefa.vencimento))}${tarefa.horario ? ` · ${tarefa.horario}` : " · Dia inteiro"} · ${tarefa.categoria}`;

    informacao.append(titulo, detalhe);

    const prioridade = document.createElement("span");
    prioridade.classList.add("task-status", `priority-${tarefa.prioridade}`);
    prioridade.textContent = tarefa.prioridade === "media"
        ? "Média"
        : tarefa.prioridade.charAt(0).toUpperCase() + tarefa.prioridade.slice(1);

    cartao.append(informacao, prioridade);

    if (mostrarAcoes) {
        const acoes = document.createElement("div");
        acoes.classList.add("task-actions");

        const botaoConcluir = document.createElement("button");
        botaoConcluir.type = "button";
        botaoConcluir.classList.add("btn-task-action", "btn-complete");
        botaoConcluir.dataset.action = "toggle";
        botaoConcluir.setAttribute("aria-label", tarefa.status ? "Reabrir tarefa" : "Concluir tarefa");
        botaoConcluir.innerHTML = '<i class="fa-solid fa-check"></i>';

        const botaoEliminar = document.createElement("button");
        botaoEliminar.type = "button";
        botaoEliminar.classList.add("btn-task-action", "btn-delete");
        botaoEliminar.dataset.action = "delete";
        botaoEliminar.setAttribute("aria-label", "Eliminar tarefa");
        botaoEliminar.innerHTML = '<i class="fa-solid fa-trash"></i>';

        acoes.append(botaoConcluir, botaoEliminar);
        cartao.appendChild(acoes);
    }

    return cartao;
}

function criarEstadoVazio(mensagem) {
    const estado = document.createElement("p");
    estado.classList.add("empty-state");
    estado.textContent = mensagem;
    return estado;
}

function compararTarefas(primeira, segunda) {
    const inicioPrimeira = `${normalizarData(primeira.vencimento)}T${primeira.horario || "00:00"}`;
    const inicioSegunda = `${normalizarData(segunda.vencimento)}T${segunda.horario || "00:00"}`;
    return inicioPrimeira.localeCompare(inicioSegunda);
}

function formatarData(data) {
    if (!data) return "Sem data";
    const [ano, mes, dia] = data.split("-").map(Number);
    return new Intl.DateTimeFormat("pt-PT").format(new Date(ano, mes - 1, dia));
}

function normalizarData(data) {
    if (!data) return "";
    if (data.includes("/")) {
        const [dia, mes, ano] = data.split("/");
        return `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
    }
    return data.slice(0, 10);
}

function atualizarCalendario() {
    calendario.refetchEvents();
    atualizarResumoDia(dataSelecionada);
}

function atualizarBotaoDiaSelecionado(elementoDia) {
    document.querySelectorAll(".fc-day-selected").forEach(elemento => {
        elemento.classList.remove("fc-day-selected");
    });
    elementoDia.classList.add("fc-day-selected");
}

listaTarefasDia.addEventListener("click", event => {
    const botao = event.target.closest("[data-action]");
    if (!botao) return;

    const cartao = botao.closest("[data-id]");
    const tarefas = obterTarefas();
    const indice = tarefas.findIndex(tarefa => tarefa.id === cartao.dataset.id);
    if (indice === -1) return;

    if (botao.dataset.action === "toggle") {
        tarefas[indice].status = !tarefas[indice].status;
    } else if (botao.dataset.action === "delete") {
        tarefas.splice(indice, 1);
    }

    salvarTarefas(tarefas);
    atualizarCalendario();
});

window.addEventListener("storage", event => {
    if (event.key === "tarefas") atualizarCalendario();
});

// ============================================================
// INICIALIZAÇÃO
// ============================================================

atualizarResumoDia(dataSelecionada);
