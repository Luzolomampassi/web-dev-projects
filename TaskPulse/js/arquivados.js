import { obterArquivadas, obterTarefas } from "./data.js";

const tarefasAtivas = obterTarefas();
const tarefasArquivadas = obterArquivadas().filter(tarefa => tarefa.arquivada === true);

const listaTarefas = document.querySelector(".list-tasks");
const campoPesquisa = document.querySelector("#bar-search");
const filtroCategoria = document.querySelector("#select-categorias");
const filtroEstado = document.querySelector("#select-estados");
const filtroOrdem = document.querySelector("#breve");
const estadoVazio = document.querySelector("#void-section");
const mensagemVazia = estadoVazio.querySelector("h1");
const descricaoVazia = estadoVazio.querySelector("p");
const botaoEstadoVazio = estadoVazio.querySelector(".btn-add");
const paginacao = document.querySelector(".tasks-pagination");
const paginaAnterior = document.querySelector("#tasks-page-previous");
const paginaSeguinte = document.querySelector("#tasks-page-next");
const paginaAtual = document.querySelector("#tasks-current-page");
const modal = document.querySelector("#modal");
const formulario = document.querySelector("#form-task");
const tituloModal = modal.querySelector(".modal-top h2");
const textoModal = modal.querySelector(".modal-top p");
const botaoGuardar = document.querySelector("#btn-new-task");
const campoTitulo = document.querySelector("#tarefa");
const campoDescricao = document.querySelector("#descricao");
const campoCategoria = document.querySelector("#categoria");
const campoPrioridade = document.querySelector("#prioridade");
const campoVencimento = document.querySelector("#data");
const campoHorario = document.querySelector("#time");
const tamanhoPagina = 10;
let pagina = 1;
let idEmEdicao = null;

function persistirArquivadas() {
    localStorage.setItem("tarefasArquivadas", JSON.stringify(tarefasArquivadas));
}

function persistirAtivas() {
    localStorage.setItem("tarefas", JSON.stringify(tarefasAtivas));
}

function normalizar(valor) {
    return String(valor ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLocaleLowerCase("pt-AO");
}

function preencherCategorias() {
    const selecionada = filtroCategoria.value;
    const categorias = [...new Set(tarefasArquivadas.map(tarefa => tarefa.categoria).filter(Boolean))]
        .sort((a, b) => String(a).localeCompare(String(b), "pt-AO"));

    filtroCategoria.replaceChildren(new Option("Todas as categorias", ""));
    categorias.forEach(categoria => filtroCategoria.add(new Option(categoria, normalizar(categoria))));
    filtroCategoria.value = categorias.some(categoria => normalizar(categoria) === selecionada)
        ? selecionada
        : "";
}

function atualizarResumos() {
    document.querySelector('[data-resumo="total-arquivadas"]').textContent = tarefasArquivadas.length;
    document.querySelector('[data-resumo="concluidas"]').textContent = tarefasArquivadas.filter(tarefa => tarefa.status === true).length;
    document.querySelector('[data-resumo="sem-conclusao"]').textContent = tarefasArquivadas.filter(tarefa => tarefa.status !== true).length;
}

function obterTarefasFiltradas() {
    const pesquisa = normalizar(campoPesquisa.value);
    const categoria = filtroCategoria.value;
    const estado = filtroEstado.value;

    const filtradas = tarefasArquivadas
        .filter(tarefa => {
            const texto = normalizar(`${tarefa.titulo} ${tarefa.descricao}`);
            const correspondeCategoria = !categoria || normalizar(tarefa.categoria) === categoria;
            const correspondeEstado = !estado || (estado === "concluidas" ? tarefa.status === true : tarefa.status !== true);
            return texto.includes(pesquisa) && correspondeCategoria && correspondeEstado;
        });

    // O projeto não guarda a data de arquivo; a posição no array reflete a ordem de arquivo.
    return filtroOrdem.value === "antigas" ? filtradas : filtradas.reverse();
}

function criarBotaoAcao(classe, icone, rotulo) {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = classe;
    botao.setAttribute("aria-label", rotulo);
    botao.title = rotulo;
    const elementoIcone = document.createElement("i");
    elementoIcone.className = icone;
    elementoIcone.setAttribute("aria-hidden", "true");
    botao.appendChild(elementoIcone);
    return botao;
}

function criarTarefa(tarefa) {
    const elemento = document.createElement("article");
    elemento.className = "task";
    elemento.dataset.id = tarefa.id;
    elemento.dataset.estado = tarefa.status === true ? "concluidas" : "pendentes";
    elemento.dataset.prioridade = normalizar(tarefa.prioridade);
    elemento.dataset.categoria = normalizar(tarefa.categoria);

    const rotulo = document.createElement("label");
    rotulo.className = "task-completion";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "check";
    checkbox.checked = tarefa.status === true;
    checkbox.setAttribute("aria-label", `Marcar ${tarefa.titulo} como concluída`);
    rotulo.appendChild(checkbox);

    const conteudo = document.createElement("div");
    conteudo.className = "task-info";
    const titulo = document.createElement("h3");
    titulo.textContent = tarefa.titulo || "Sem título";
    const descricao = document.createElement("p");
    descricao.textContent = tarefa.descricao || "Sem descrição";
    const badges = document.createElement("div");
    badges.className = "badges";
    [tarefa.categoria, tarefa.vencimento, tarefa.prioridade].filter(Boolean).forEach(valor => {
        const badge = document.createElement("span");
        badge.className = "badge";
        badge.textContent = valor;
        if (valor === tarefa.categoria) {
            const classeCategoria = {
                estudo: "badge-categoria-estudo",
                projeto: "badge-categoria-projeto",
                saude: "badge-categoria-saude",
                carreira: "badge-categoria-carreira"
            }[normalizar(valor)];
            if (classeCategoria) badge.classList.add(classeCategoria);
        }
        if (normalizar(valor) === "alta") badge.classList.add("alta");
        if (normalizar(valor) === "media") badge.classList.add("media");
        if (normalizar(valor) === "baixa") badge.classList.add("baixa");
        badges.appendChild(badge);
    });
    conteudo.append(titulo, descricao, badges);

    const acoes = document.createElement("div");
    acoes.className = "task-actions";
    const menu = document.createElement("button");
    menu.type = "button";
    menu.className = "button-list";
    menu.setAttribute("aria-label", `Ações para ${tarefa.titulo}`);
    menu.setAttribute("aria-expanded", "false");
    menu.innerHTML = '<i class="fa-solid fa-ellipsis-vertical" aria-hidden="true"></i>';
    const opcoes = document.createElement("div");
    opcoes.className = "task-actions-list";
    opcoes.append(
        criarBotaoAcao("btn-restore", "fa-solid fa-box-open", "Restaurar tarefa"),
        criarBotaoAcao("btn-edit", "fa-regular fa-pen-to-square", "Editar tarefa"),
        criarBotaoAcao("btn-delete", "fa-regular fa-trash-can", "Eliminar tarefa")
    );
    acoes.append(menu, opcoes);
    elemento.append(rotulo, conteudo, acoes);
    return elemento;
}

function atualizarEstadoVazio(quantidadeFiltrada) {
    const semArquivadas = tarefasArquivadas.length === 0;
    const semCorrespondencias = !semArquivadas && quantidadeFiltrada === 0;
    estadoVazio.classList.toggle("is-active", semArquivadas || semCorrespondencias);
    listaTarefas.hidden = semArquivadas || semCorrespondencias;
    paginacao.hidden = semArquivadas || semCorrespondencias;

    if (semArquivadas) {
        mensagemVazia.textContent = "Ainda não há tarefas arquivadas";
        descricaoVazia.textContent = "Quando arquivares uma tarefa, ela ficará disponível aqui para consulta ou restauro.";
        botaoEstadoVazio.textContent = "Ver tarefas";
        botaoEstadoVazio.dataset.acaoVazia = "tarefas";
    } else if (semCorrespondencias) {
        mensagemVazia.textContent = "Nenhuma tarefa corresponde aos filtros";
        descricaoVazia.textContent = "Altera a pesquisa ou limpa os filtros para voltares a ver as tarefas arquivadas.";
        botaoEstadoVazio.textContent = "Limpar filtros";
        botaoEstadoVazio.dataset.acaoVazia = "limpar";
    }
}

function renderizar() {
    const filtradas = obterTarefasFiltradas();
    const totalPaginas = Math.ceil(filtradas.length / tamanhoPagina);
    pagina = Math.min(Math.max(pagina, 1), Math.max(totalPaginas, 1));
    const inicio = (pagina - 1) * tamanhoPagina;
    listaTarefas.replaceChildren(...filtradas.slice(inicio, inicio + tamanhoPagina).map(criarTarefa));
    paginaAtual.textContent = String(pagina);
    paginaAnterior.disabled = pagina <= 1 || totalPaginas === 0;
    paginaSeguinte.disabled = pagina >= totalPaginas;
    atualizarEstadoVazio(filtradas.length);
    atualizarResumos();
}

function fecharMenus(exceto = null) {
    listaTarefas.querySelectorAll(".task-actions-list.show").forEach(menu => {
        if (menu !== exceto) {
            menu.classList.remove("show");
            menu.previousElementSibling.setAttribute("aria-expanded", "false");
        }
    });
}

function abrirEdicao(tarefa) {
    idEmEdicao = tarefa.id;
    formulario.reset();
    tituloModal.textContent = "Editar tarefa arquivada";
    textoModal.textContent = "Atualize os dados desta tarefa";
    botaoGuardar.textContent = "Guardar alterações";
    campoTitulo.value = tarefa.titulo || "";
    campoDescricao.value = tarefa.descricao || "";
    campoVencimento.value = tarefa.vencimento || "";
    campoHorario.value = tarefa.horario || "";
    campoPrioridade.value = normalizar(tarefa.prioridade) || "media";
    const categoria = tarefa.categoria || "estudo";
    if (![...campoCategoria.options].some(opcao => opcao.value === categoria)) {
        campoCategoria.add(new Option(categoria, categoria));
    }
    campoCategoria.value = categoria;
    modal.showModal();
}

listaTarefas.addEventListener("click", event => {
    const botaoMenu = event.target.closest(".button-list");
    if (botaoMenu) {
        const menu = botaoMenu.nextElementSibling;
        const vaiAbrir = !menu.classList.contains("show");
        fecharMenus(menu);
        menu.classList.toggle("show", vaiAbrir);
        botaoMenu.setAttribute("aria-expanded", String(vaiAbrir));
        return;
    }

    const botao = event.target.closest(".task-actions-list button");
    if (!botao) return;
    const elemento = botao.closest(".task");
    const indice = tarefasArquivadas.findIndex(tarefa => String(tarefa.id) === elemento.dataset.id);
    if (indice < 0) return;

    if (botao.matches(".btn-restore")) {
        const [tarefa] = tarefasArquivadas.splice(indice, 1);
        tarefa.arquivada = false;
        tarefasAtivas.push(tarefa);
        persistirArquivadas();
        persistirAtivas();
        preencherCategorias();
        renderizar();
    } else if (botao.matches(".btn-delete")) {
        if (!window.confirm("Queres eliminar esta tarefa arquivada permanentemente?")) return;
        tarefasArquivadas.splice(indice, 1);
        persistirArquivadas();
        preencherCategorias();
        renderizar();
    } else if (botao.matches(".btn-edit")) {
        abrirEdicao(tarefasArquivadas[indice]);
    }
});

listaTarefas.addEventListener("change", event => {
    if (!event.target.matches(".check")) return;
    const elemento = event.target.closest(".task");
    const tarefa = tarefasArquivadas.find(item => String(item.id) === elemento.dataset.id);
    if (!tarefa) return;
    tarefa.status = event.target.checked;
    persistirArquivadas();
    renderizar();
});

document.addEventListener("click", event => {
    if (!event.target.closest(".task-actions")) fecharMenus();
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") fecharMenus();
});

campoPesquisa.addEventListener("input", () => { pagina = 1; renderizar(); });
filtroCategoria.addEventListener("change", () => { pagina = 1; renderizar(); });
filtroEstado.addEventListener("change", () => { pagina = 1; renderizar(); });
filtroOrdem.addEventListener("change", () => { pagina = 1; renderizar(); });
paginaAnterior.addEventListener("click", () => { pagina -= 1; renderizar(); });
paginaSeguinte.addEventListener("click", () => { pagina += 1; renderizar(); });

botaoEstadoVazio.addEventListener("click", () => {
    if (botaoEstadoVazio.dataset.acaoVazia === "tarefas") {
        window.location.href = "task.html";
        return;
    }
    campoPesquisa.value = "";
    filtroCategoria.value = "";
    filtroEstado.value = "";
    filtroOrdem.value = "recentes";
    pagina = 1;
    renderizar();
});

formulario.addEventListener("submit", event => {
    event.preventDefault();
    if (!formulario.reportValidity() || idEmEdicao === null) return;
    const tarefa = tarefasArquivadas.find(item => String(item.id) === String(idEmEdicao));
    if (!tarefa) return;
    Object.assign(tarefa, {
        titulo: campoTitulo.value.trim(),
        descricao: campoDescricao.value.trim(),
        categoria: campoCategoria.value,
        prioridade: campoPrioridade.value,
        vencimento: campoVencimento.value,
        horario: campoHorario.value
    });
    persistirArquivadas();
    modal.close();
    preencherCategorias();
    renderizar();
});

document.querySelectorAll(".btn-cancel").forEach(botao => botao.addEventListener("click", () => modal.close()));
modal.addEventListener("click", event => { if (event.target === modal) modal.close(); });
modal.addEventListener("close", () => {
    idEmEdicao = null;
    formulario.reset();
    tituloModal.textContent = "Nova Tarefa";
    textoModal.textContent = "Preencha os dados da tarefa abaixo";
    botaoGuardar.textContent = "Adicionar Tarefa";
});

preencherCategorias();
renderizar();
