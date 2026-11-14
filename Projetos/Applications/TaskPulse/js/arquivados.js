import {obterArquivadas ,obterTarefas} from "./data.js"

const tarefas = obterTarefas()
const tarefasArquivadas = obterArquivadas()

const listaTarefas = document.querySelector(".list-tasks")

tarefasArquivadas.forEach((tarefa) =>{
    listaTarefas.appendChild(criarTarefa(tarefa))
})

function criarTarefa(dadosTarefa) {
    // Elemento principal
    const elementoTarefa = document.createElement("div");

    elementoTarefa.classList.add("task");
    elementoTarefa.dataset.estado = dadosTarefa.status ? "concluidas" : "pendentes";
    elementoTarefa.dataset.status = String(dadosTarefa.status);
    elementoTarefa.dataset.id = dadosTarefa.id;
    elementoTarefa.dataset.categoria = "";
    elementoTarefa.dataset.arquivada = true;

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
    elementoTarefa.dataset.categoria = dadosTarefa.categoria;
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

    // Lista de botões
    const list = document.createElement("div")
    list.classList.add("task-actions")

    const Botaolist = document.createElement("button")
    Botaolist.classList.add("button-list")
    const iconList = document.createElement("i");
    iconList.setAttribute("aria-hidden", "true");

    const svgNS = "http://www.w3.org/2000/svg";

    // Criar o SVG
    const ellipsisSVG = document.createElementNS(svgNS, "svg");

    ellipsisSVG.setAttribute("viewBox", "0 0 24 24");
    ellipsisSVG.setAttribute("width", "20");
    ellipsisSVG.setAttribute("height", "20");
    ellipsisSVG.setAttribute("fill", "currentColor");

    // Criar os três pontos
    for (const cy of [5, 12, 19]) {
        const circle = document.createElementNS(svgNS, "circle");

        circle.setAttribute("cx", "12");
        circle.setAttribute("cy", cy);
        circle.setAttribute("r", "1.5");

        ellipsisSVG.appendChild(circle);
    }

    // Montar o elemento
    iconList.appendChild(ellipsisSVG);

    Botaolist.appendChild(iconList)
   

    // Botões de ação
    const taskActionsContainer = document.createElement("div");
    taskActionsContainer.classList.add("task-actions-list");

     // Botão editar
    const botaoArquivar = document.createElement("button");
    botaoArquivar.classList.add("btn-archive");
    botaoArquivar.setAttribute("aria-label", "Arquiva a tarefa");
    botaoArquivar.setAttribute("title", "Arquivar tarefa");

    const iconeArquivar = document.createElement("i");
    iconeArquivar.classList.add(
        "fa-solid",
        "fa-box-archive"
    );
    botaoArquivar.appendChild(iconeArquivar);

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
    taskActionsContainer.appendChild(botaoArquivar);
    taskActionsContainer.appendChild(botaoEditar);
    taskActionsContainer.appendChild(botaoDeletar);
    list.appendChild(Botaolist)
    list.appendChild(taskActionsContainer)

    // Montagem final
    elementoTarefa.appendChild(rotuloCheckbox);
    elementoTarefa.appendChild(conteudoTarefa);
    elementoTarefa.appendChild(list);

    // Mostra lista
   // Abre ou fecha o menu ao clicar no botão
    Botaolist.addEventListener("click", () => {
        taskActionsContainer.classList.toggle("show");
    });

    // Fecha o menu ao clicar fora
    document.addEventListener("click", (event) => {
        const clicouNoBotao = Botaolist.contains(event.target);
        const clicouNoMenu = taskActionsContainer.contains(event.target);
        if (!clicouNoBotao && !clicouNoMenu) {
            taskActionsContainer.classList.remove("show");
        }
    });

    // Eliminar tarefa
    function eliminar(objetoProcurado, elementoTarefa) {
        const indice = tarefasArquivadas.findIndex(
            (tarefa) => tarefa.id === objetoProcurado.id
        );

        if (indice === -1) {
            return;
        }

        tarefasArquivadas.splice(indice, 1);
        elementoTarefa.remove();
        salvarArquivadas()
    }

    botaoDeletar.addEventListener("click", () => {
        eliminar(dadosTarefa, elementoTarefa);
    });
    // Arquivar
    botaoArquivar.addEventListener("click", () =>{

        const elemento = botaoArquivar.closest(".task")
        elemento.dataset.arquivada = false

        const objeto = tarefasArquivadas.find((tarefa) => tarefa.id === elemento?.dataset.id);
        if(objeto === ""){
            return
        }
        objeto.arquivada = false 
        tarefas.push(objeto)
        salvarArquivadas()
        salvarTarefas()
        eliminar(objeto, elemento)
       
        resumos();
        
    })

    // Devolver o elemento para ser inserido ou substituir o antigo.
    return elementoTarefa;
}
const btnPrevious = document.querySelector("#tasks-page-previous")
const btnNext = document.querySelector("#tasks-page-next")
const tasksPageCurrent = document.querySelector("#tasks-current-page")
let currentPage = 1
let startIndex = 0
let endIndex = 10
const pageSize = 10

btnPrevious.addEventListener("click", () =>{
    if(currentPage <=  1){
        return
    }
    currentPage -= 1
    startIndex -= 10
    endIndex -= 10
    tasksPageCurrent.textContent =  currentPage
    renderizarTarefas()
})

btnNext.addEventListener("click", () =>{
    let limite = Math.ceil(tarefas.length / pageSize)
    if(currentPage >=  limite){  
        return
    }
    currentPage += 1
    startIndex += 10
    endIndex += 10
    tasksPageCurrent.textContent =  currentPage
    renderizarTarefas()
})


function renderizarTarefas() {
    listaTarefas.replaceChildren();

    const inicio = Math.max(0, Math.trunc(startIndex));

    const fim = Math.min(endIndex,inicio + 9,tarefas.length - 1
    );

    for (let i = inicio; i <= fim; i++) {
        listaTarefas.appendChild(criarTarefa(tarefas[i]));
    }
}
renderizarTarefas()

function salvarArquivadas() {
    localStorage.setItem("tarefasArquivadas", JSON.stringify(tarefasArquivadas));
}
function salvarTarefas() {
    localStorage.setItem("tarefas", JSON.stringify(tarefas));
}