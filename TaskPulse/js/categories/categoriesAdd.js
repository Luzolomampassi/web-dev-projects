import { obterCategorias, obterTarefas, obterArquivadas } from "../data.js";

const categorias = obterCategorias();
const tarefas = obterTarefas();
const tarefasArquivadas = obterArquivadas();
const nome = document.querySelector("#nome");
const descricao = document.querySelector("#descricao");
const formulario = document.querySelector("#form");
const alerta = document.querySelector("#alert");
const modal = document.querySelector("#modal");
const grade = document.querySelector("#categorias-grid");
const botaoAdicionarVazio = document.querySelector("#item-add");
const botaoLimparFiltros = document.querySelector("#limpar-filtros-categorias");
const botaoAdicionarTopo = document.querySelector("#btn-add-categoria");
const botaoGuardar = formulario.querySelector('[type="submit"]');
const botaoCancelar = formulario.querySelector(".btn-cancelar");
const campoPesquisa = document.querySelector("#search");
const filtroQuantidade = document.querySelector("#task");
const ordemCategorias = document.querySelector("#order");
const icones = [...document.querySelectorAll(".category-icon")];
const coresUI = [...document.querySelectorAll(".icon-color")];
const seletorCor = document.querySelector("#color");
const iconePreview = document.querySelector(".icon-view");
const tituloPreview = document.querySelector("#titulo-prev");
const descricaoPreview = document.querySelector("#descricao-prev");
const cores = {
    azul: "#2563EB",
    roxo: "#7C3AED",
    verde: "#16A34A",
    "azul-marinho": "#0891B2",
    vermelha: "#DC2626",
    laranja: "#D97706",
    rosa: "#DB2777"
};
let categoriaEmEdicao = null;
let iconeSelecionado = "📚";
let corSelecionada = cores.azul;

function normalizar(valor) {
    return String(valor ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLocaleLowerCase("pt-AO");
}

function persistirCategorias() {
    localStorage.setItem("categorias", JSON.stringify(categorias));
}

function persistirTarefas() {
    localStorage.setItem("tarefas", JSON.stringify(tarefas));
    localStorage.setItem("tarefasArquivadas", JSON.stringify(tarefasArquivadas));
}

function todasTarefas() {
    return [...tarefas, ...tarefasArquivadas];
}

function resumoCategoria(categoria) {
    const tarefasDaCategoria = todasTarefas().filter(
        tarefa => normalizar(tarefa.categoria) === normalizar(categoria.titulo)
    );
    const concluidas = tarefasDaCategoria.filter(tarefa => tarefa.status === true).length;
    return {
        total: tarefasDaCategoria.length,
        concluidas,
        pendentes: tarefasDaCategoria.length - concluidas,
        progresso: tarefasDaCategoria.length ? Math.round((concluidas / tarefasDaCategoria.length) * 100) : 0
    };
}

function atualizarResumoGeral() {
    const todos = todasTarefas();
    document.querySelector("#total-categorias").textContent = categorias.length;
    document.querySelector("#total-tarefas").textContent = todos.length;
    document.querySelector("#total-concluidas").textContent = todos.filter(tarefa => tarefa.status === true).length;
    document.querySelector("#total-pendentes").textContent = todos.filter(tarefa => tarefa.status !== true).length;
}

function atualizarCartao(elemento, categoria) {
    const resumo = resumoCategoria(categoria);
    elemento.querySelector(".icon").textContent = categoria.icon || "📚";
    elemento.querySelector(".icon").style.backgroundColor = categoria.iconColor || cores.azul;
    elemento.querySelector("h3").textContent = categoria.titulo;
    elemento.querySelector(".item-text p").textContent = categoria.descricao || "Sem descrição";
    elemento.querySelector(".badge").textContent = categoria.titulo;
    elemento.querySelector(".btn-opcoes").setAttribute("aria-label", `Opções da categoria ${categoria.titulo}`);
    elemento.querySelector(".btn-editar").setAttribute("aria-label", `Editar categoria ${categoria.titulo}`);
    elemento.querySelector(".btn-eliminar").setAttribute("aria-label", `Eliminar categoria ${categoria.titulo}`);
    elemento.querySelector(".tasks-concluidas").textContent = resumo.concluidas;
    elemento.querySelector(".tasks-pendentes").textContent = resumo.pendentes;
    elemento.querySelector(".totalTarefas").textContent = resumo.total;
    elemento.querySelector(".percentagem").textContent = `${resumo.progresso}%`;
    const progresso = elemento.querySelector("progress");
    progresso.value = resumo.progresso;
    progresso.style.accentColor = categoria.iconColor || cores.azul;
}

function atualizarLista() {
    const termo = normalizar(campoPesquisa.value);
    const limite = filtroQuantidade.value;
    const ordem = ordemCategorias.value;
    const elementos = [...grade.querySelectorAll(".item")].map(elemento => {
        const categoria = categorias.find(item => String(item.id) === elemento.dataset.id);
        if (!categoria) return null;
        atualizarCartao(elemento, categoria);
        return { elemento, categoria, resumo: resumoCategoria(categoria) };
    }).filter(Boolean);

    const visiveis = elementos.filter(({ categoria, resumo }) => {
        const correspondePesquisa = normalizar(`${categoria.titulo} ${categoria.descricao}`).includes(termo);
        const correspondeQuantidade = limite === "todas"
            || (limite === "muitas" && resumo.total > 10)
            || (limite === "pouca" && resumo.total <= 10);
        return correspondePesquisa && correspondeQuantidade;
    });

    visiveis.sort((a, b) => {
        if (ordem === "muitas") return b.resumo.total - a.resumo.total || a.categoria.titulo.localeCompare(b.categoria.titulo, "pt-AO");
        if (ordem === "pouca") return b.resumo.progresso - a.resumo.progresso || a.categoria.titulo.localeCompare(b.categoria.titulo, "pt-AO");
        return a.categoria.titulo.localeCompare(b.categoria.titulo, "pt-AO");
    });

    elementos.forEach(({ elemento }) => { elemento.hidden = true; });
    visiveis.forEach(({ elemento }) => {
        elemento.hidden = false;
        grade.insertBefore(elemento, botaoAdicionarVazio);
    });
    const estadoVazio = document.querySelector("#categorias-vazio");
    estadoVazio.hidden = visiveis.length > 0;
    estadoVazio.querySelector("h2").textContent = categorias.length
        ? "Nenhuma categoria corresponde aos filtros"
        : "Ainda não há categorias";
    estadoVazio.querySelector("p").textContent = categorias.length
        ? "Altera a pesquisa ou os filtros para voltares a ver categorias."
        : "Cria uma categoria para começares a organizar as tuas tarefas.";
    botaoAdicionarVazio.hidden = categorias.length > 0;
    botaoLimparFiltros.hidden = categorias.length === 0;
    atualizarResumoGeral();
}

function selecionarIcone(icone) {
    iconeSelecionado = icone;
    iconePreview.textContent = icone;
    icones.forEach(botao => {
        const selecionado = botao.dataset.icon === icone;
        botao.classList.toggle("is-selected", selecionado);
        botao.setAttribute("aria-pressed", String(selecionado));
    });
}

function selecionarCor(cor, botaoSelecionado = null) {
    corSelecionada = cor;
    iconePreview.style.backgroundColor = cor;
    coresUI.forEach(botao => {
        const selecionado = botao === botaoSelecionado;
        botao.classList.toggle("is-selected", selecionado);
        botao.setAttribute("aria-pressed", String(selecionado));
    });
    seletorCor.value = cor;
}

function resetarFormulario() {
    formulario.reset();
    categoriaEmEdicao = null;
    alerta.classList.remove("aviso");
    alerta.textContent = "Insira o nome da categoria";
    tituloPreview.textContent = "Nome da categoria";
    descricaoPreview.textContent = "Descrição da categoria";
    botaoGuardar.textContent = "Criar categoria";
    selecionarIcone("📚");
    selecionarCor(cores.azul, coresUI.find(botao => botao.dataset.color === "azul"));
}

function abrirModal(categoria = null) {
    resetarFormulario();
    if (categoria) {
        categoriaEmEdicao = categoria.id;
        nome.value = categoria.titulo;
        descricao.value = categoria.descricao || "";
        tituloPreview.textContent = categoria.titulo;
        descricaoPreview.textContent = categoria.descricao || "Descrição da categoria";
        botaoGuardar.textContent = "Guardar alterações";
        selecionarIcone(categoria.icon || "📚");
        selecionarCor(categoria.iconColor || cores.azul, coresUI.find(botao => cores[botao.dataset.color] === categoria.iconColor));
        if (!Object.values(cores).includes(categoria.iconColor)) seletorCor.value = categoria.iconColor || cores.azul;
    }
    modal.showModal();
    nome.focus();
}

function criarCartao(categoria) {
    const item = document.createElement("article");
    item.className = "item";
    item.dataset.id = categoria.id;
    item.innerHTML = `
        <div class="item-brand">
            <div class="item-brand-info">
                <span class="icon" aria-hidden="true"></span>
                <div class="item-text"><h3></h3><p></p></div>
            </div>
            <div class="menu-options">
                <button class="btn-opcoes" type="button" aria-expanded="false"><i class="fa-solid fa-ellipsis-vertical" aria-hidden="true"></i></button>
                <div class="option">
                    <button class="btn-option btn-editar" type="button"><i class="fa-solid fa-pen" aria-hidden="true"></i><span>Editar</span></button>
                    <button class="btn-option btn-eliminar" type="button"><i class="fa-regular fa-trash-can" aria-hidden="true"></i><span>Eliminar</span></button>
                </div>
            </div>
        </div>
        <div class="status"><span class="tasks-concluidas"></span><span class="tasks-pendentes"></span></div>
        <div class="progress-container">
            <div class="bar-info"><span class="totalTarefas"></span><span class="percentagem"></span></div>
            <div class="bar"><progress value="0" max="100"></progress></div>
            <div class="item-bottom"><span class="badge"></span></div>
        </div>`;
    item.querySelector(".option").id = `opcoes-${categoria.id}`;
    const botaoOpcoes = item.querySelector(".btn-opcoes");
    botaoOpcoes.setAttribute("aria-controls", `opcoes-${categoria.id}`);
    botaoOpcoes.setAttribute("aria-label", `Opções da categoria ${categoria.titulo}`);
    atualizarCartao(item, categoria);
    return item;
}

function fecharMenus() {
    grade.querySelectorAll(".option.is-open").forEach(menu => {
        menu.classList.remove("is-open");
        menu.previousElementSibling?.setAttribute("aria-expanded", "false");
    });
}

botaoAdicionarTopo.addEventListener("click", () => abrirModal());
botaoAdicionarVazio.addEventListener("click", () => abrirModal());
botaoLimparFiltros.addEventListener("click", () => {
    campoPesquisa.value = "";
    filtroQuantidade.value = "todas";
    atualizarLista();
});
botaoCancelar.addEventListener("click", () => modal.close());
modal.addEventListener("click", event => { if (event.target === modal) modal.close(); });
modal.addEventListener("close", resetarFormulario);

nome.addEventListener("input", () => {
    tituloPreview.textContent = nome.value.trim() || "Nome da categoria";
    alerta.classList.remove("aviso");
});
descricao.addEventListener("input", () => {
    descricaoPreview.textContent = descricao.value.trim() || "Descrição da categoria";
});
icones.forEach(botao => botao.addEventListener("click", () => selecionarIcone(botao.dataset.icon)));
coresUI.forEach(botao => botao.addEventListener("click", () => selecionarCor(cores[botao.dataset.color], botao)));
seletorCor.addEventListener("input", () => selecionarCor(seletorCor.value));

formulario.addEventListener("submit", event => {
    event.preventDefault();
    const titulo = nome.value.trim();
    if (!titulo) {
        alerta.textContent = "Insira o nome da categoria";
        alerta.classList.add("aviso");
        nome.focus();
        return;
    }
    const duplicada = categorias.some(categoria =>
        normalizar(categoria.titulo) === normalizar(titulo)
        && String(categoria.id) !== String(categoriaEmEdicao)
    );
    if (duplicada) {
        alerta.textContent = "Já existe uma categoria com esse nome";
        alerta.classList.add("aviso");
        nome.focus();
        return;
    }

    if (categoriaEmEdicao !== null) {
        const categoria = categorias.find(item => String(item.id) === String(categoriaEmEdicao));
        if (!categoria) return;
        const tituloAntigo = categoria.titulo;
        Object.assign(categoria, { titulo, descricao: descricao.value.trim(), icon: iconeSelecionado, iconColor: corSelecionada });
        if (normalizar(tituloAntigo) !== normalizar(titulo)) {
            [...tarefas, ...tarefasArquivadas].forEach(tarefa => {
                if (normalizar(tarefa.categoria) === normalizar(tituloAntigo)) tarefa.categoria = titulo;
            });
            persistirTarefas();
        }
    } else {
        categorias.push({
            id: crypto.randomUUID(),
            titulo,
            descricao: descricao.value.trim(),
            icon: iconeSelecionado,
            iconColor: corSelecionada
        });
    }

    persistirCategorias();
    renderizarCartoes();
    modal.close();
});

function renderizarCartoes() {
    grade.querySelectorAll(".item").forEach(item => item.remove());
    categorias.forEach(categoria => grade.insertBefore(criarCartao(categoria), botaoAdicionarVazio));
    atualizarLista();
}

grade.addEventListener("click", event => {
    const cartao = event.target.closest(".item");
    if (!cartao) return;
    const categoria = categorias.find(item => String(item.id) === cartao.dataset.id);
    if (!categoria) return;

    if (event.target.closest(".btn-opcoes")) {
        const menuAtual = cartao.querySelector(".option");
        const abrir = !menuAtual.classList.contains("is-open");
        grade.querySelectorAll(".option.is-open").forEach(menu => {
            menu.classList.remove("is-open");
            menu.previousElementSibling.setAttribute("aria-expanded", "false");
        });
        menuAtual.classList.toggle("is-open", abrir);
        cartao.querySelector(".btn-opcoes").setAttribute("aria-expanded", String(abrir));
    } else if (event.target.closest(".btn-editar")) {
        fecharMenus();
        abrirModal(categoria);
    } else if (event.target.closest(".btn-eliminar")) {
        fecharMenus();
        const usos = todasTarefas().filter(tarefa => normalizar(tarefa.categoria) === normalizar(categoria.titulo)).length;
        const mensagem = usos
            ? `Esta categoria está associada a ${usos} tarefa(s). Se a eliminares, essas tarefas ficarão como “Sem categoria”. Continuar?`
            : `Eliminar a categoria “${categoria.titulo}”?`;
        if (!window.confirm(mensagem)) return;
        tarefas.concat(tarefasArquivadas).forEach(tarefa => {
            if (normalizar(tarefa.categoria) === normalizar(categoria.titulo)) tarefa.categoria = "Sem categoria";
        });
        if (usos) persistirTarefas();
        categorias.splice(categorias.findIndex(item => String(item.id) === String(categoria.id)), 1);
        persistirCategorias();
        renderizarCartoes();
    }
});
document.addEventListener("click", event => {
    if (!event.target.closest(".menu-options")) fecharMenus();
});
document.addEventListener("keydown", event => {
    if (event.key === "Escape") fecharMenus();
});

campoPesquisa.addEventListener("input", atualizarLista);
filtroQuantidade.addEventListener("change", atualizarLista);
ordemCategorias.addEventListener("change", atualizarLista);
renderizarCartoes();
