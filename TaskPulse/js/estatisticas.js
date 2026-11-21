import { obterTarefas } from "./data.js";

const botoesPeriodo = document.querySelectorAll(".btn-filtro");
const painelPeriodo = document.querySelector("#periodo-personalizado");
const campoInicio = document.querySelector("#periodo-inicio");
const campoFim = document.querySelector("#periodo-fim");
const botaoAplicarPeriodo = document.querySelector("#aplicar-periodo");
const botaoPeriodoPersonalizado = document.querySelector(
    '.btn-filtro[data-categoria="personalizados"]'
);
const erroPeriodo = document.querySelector("#periodo-erro");
const descricaoPeriodo = document.querySelector("#periodo-descricao");
const listaAtividade = document.querySelector("#lista-atividade");
const canvasTarefas = document.querySelector("#tasksChart");

const valoresCards = {
    total: document.querySelector(".total-tarefas"),
    concluidas: document.querySelector(".tarefas-concluidas"),
    pendentes: document.querySelector(".tarefas-pendentes"),
    atrasadas: document.querySelector(".tarefas-atrasadas"),
    taxaConclusao: document.querySelector(".taxa-conclusao")
};

const distribuicao = {
    total: document.querySelector(".grafico-centro-total"),
    grafico: document.querySelector(".grafico-distribuicao"),
    concluidas: {
        quantidade: document.querySelector(".statusConcluidoElemento"),
        percentagem: document.querySelector(".statusConcluidoElemento + p")
    },
    noPrazo: {
        quantidade: document.querySelector(".statusPendenteElemento"),
        percentagem: document.querySelector(".statusPendenteElemento + p")
    },
    atrasadas: {
        quantidade: document.querySelector(".statusAtrasadaElemento"),
        percentagem: document.querySelector(".statusAtrasadaElemento + p")
    }
};

const estatisticasAdicionais = {
    mediaDiaria: document.querySelector('[data-stat="media-diaria"]'),
    diasComConclusao: document.querySelector('[data-stat="dias-com-conclusao"]'),
    melhorDiaTotal: document.querySelector('[data-stat="melhor-dia-total"]'),
    melhorDiaData: document.querySelector('[data-stat="melhor-dia-data"]')
};

const hoje = obterDataHoje();
const intervaloInicial = {
    inicio: adicionarDias(hoje, -29),
    fim: hoje,
    tipo: "mensal"
};

let intervaloAtual = intervaloInicial;
let graficoProdutividade = null;

campoInicio.value = intervaloInicial.inicio;
campoFim.value = intervaloInicial.fim;

botoesPeriodo.forEach(botao => {
    botao.addEventListener("click", () => {
        const periodo = botao.dataset.categoria;

        if (periodo === "personalizados") {
            campoInicio.value = intervaloAtual.inicio;
            campoFim.value = intervaloAtual.fim;
            painelPeriodo.hidden = false;
            erroPeriodo.hidden = true;
            definirIntervalo(
                intervaloAtual.inicio,
                intervaloAtual.fim,
                "personalizados",
                botaoPeriodoPersonalizado
            );
            return;
        }

        painelPeriodo.hidden = true;
        erroPeriodo.hidden = true;

        if (periodo === "hoje") {
            definirIntervalo(hoje, hoje, periodo, botao);
        } else if (periodo === "semanal") {
            definirIntervalo(adicionarDias(hoje, -6), hoje, periodo, botao);
        } else if (periodo === "mensal") {
            definirIntervalo(adicionarDias(hoje, -29), hoje, periodo, botao);
        }
    });
});

botaoAplicarPeriodo.addEventListener("click", () => {
    const inicio = normalizarData(campoInicio.value);
    const fim = normalizarData(campoFim.value);

    if (!inicio || !fim || inicio > fim) {
        erroPeriodo.textContent = "Indique um intervalo válido: a data inicial deve ser anterior ou igual à final.";
        erroPeriodo.hidden = false;
        return;
    }

    erroPeriodo.hidden = true;
    definirIntervalo(inicio, fim, "personalizados", botaoPeriodoPersonalizado);
});

function definirIntervalo(inicio, fim, tipo, botaoAtivo) {
    intervaloAtual = { inicio, fim, tipo };

    botoesPeriodo.forEach(botao => {
        const ativo = botao === botaoAtivo;
        botao.classList.toggle("active", ativo);
        botao.setAttribute("aria-pressed", String(ativo));
    });

    atualizarEstatisticas();
}

function atualizarEstatisticas() {
    const tarefasPeriodo = obterTarefas()
        .filter(tarefa => tarefa && typeof tarefa === "object" && !Array.isArray(tarefa))
        .map(tarefa => ({
            ...tarefa,
            dataVencimento: normalizarData(tarefa.vencimento)
        }))
        .filter(tarefa =>
            tarefa.dataVencimento &&
            tarefa.dataVencimento >= intervaloAtual.inicio &&
            tarefa.dataVencimento <= intervaloAtual.fim
        );

    const concluidas = tarefasPeriodo.filter(tarefa => tarefa.status === true);
    const pendentes = tarefasPeriodo.filter(tarefa => tarefa.status !== true);
    const atrasadas = pendentes.filter(tarefa => tarefa.dataVencimento < hoje);
    const noPrazo = pendentes.length - atrasadas.length;
    const total = tarefasPeriodo.length;
    const taxaConclusao = calcularPercentagem(concluidas.length, total);

    valoresCards.total.textContent = total;
    valoresCards.concluidas.textContent = concluidas.length;
    valoresCards.pendentes.textContent = pendentes.length;
    valoresCards.atrasadas.textContent = atrasadas.length;
    valoresCards.taxaConclusao.textContent = `${taxaConclusao}%`;

    distribuicao.total.textContent = total;
    atualizarIndicador(distribuicao.concluidas, concluidas.length, total);
    atualizarIndicador(distribuicao.noPrazo, noPrazo, total);
    atualizarIndicador(distribuicao.atrasadas, atrasadas.length, total);
    atualizarGraficoDistribuicao(total, concluidas.length, noPrazo, atrasadas.length);
    atualizarEstatisticasAdicionais(tarefasPeriodo, concluidas);
    atualizarListaAtividade(tarefasPeriodo);
    atualizarGraficoProdutividade(tarefasPeriodo);
    atualizarDescricaoPeriodo();
}

function atualizarIndicador(elementos, quantidade, total) {
    elementos.quantidade.textContent = quantidade;
    elementos.percentagem.textContent = `${calcularPercentagem(quantidade, total)}%`;
}

function atualizarGraficoDistribuicao(total, concluidas, noPrazo, atrasadas) {
    const estilos = getComputedStyle(document.documentElement);
    const corConcluidas = estilos.getPropertyValue("--color-success").trim();
    const corNoPrazo = estilos.getPropertyValue("--color-primary").trim();
    const corAtrasadas = estilos.getPropertyValue("--color-danger").trim();
    const corVazia = estilos.getPropertyValue("--color-border").trim();

    if (total === 0) {
        distribuicao.grafico.style.background = corVazia;
        return;
    }

    const fimConcluidas = calcularPercentagemDecimal(concluidas, total);
    const fimNoPrazo = fimConcluidas + calcularPercentagemDecimal(noPrazo, total);

    distribuicao.grafico.style.background =
        `conic-gradient(${corConcluidas} 0% ${fimConcluidas}%, ` +
        `${corNoPrazo} ${fimConcluidas}% ${fimNoPrazo}%, ` +
        `${corAtrasadas} ${fimNoPrazo}% 100%)`;
}

function atualizarEstatisticasAdicionais(tarefasPeriodo, concluidas) {
    const quantidadeDias = calcularDiasInclusivos(
        intervaloAtual.inicio,
        intervaloAtual.fim
    );
    const mediaDiaria = tarefasPeriodo.length / quantidadeDias;
    const contagemPorDia = new Map();

    concluidas.forEach(tarefa => {
        const data = tarefa.dataVencimento;
        contagemPorDia.set(data, (contagemPorDia.get(data) ?? 0) + 1);
    });

    const diasComConclusao = contagemPorDia.size;
    const melhorDia = [...contagemPorDia.entries()]
        .sort((primeiro, segundo) =>
            segundo[1] - primeiro[1] || primeiro[0].localeCompare(segundo[0])
        )[0];

    estatisticasAdicionais.mediaDiaria.textContent = mediaDiaria.toLocaleString(
        "pt-AO",
        { maximumFractionDigits: 1 }
    );
    estatisticasAdicionais.diasComConclusao.textContent = diasComConclusao;
    estatisticasAdicionais.melhorDiaTotal.textContent = melhorDia?.[1] ?? 0;
    estatisticasAdicionais.melhorDiaData.textContent = melhorDia
        ? formatarDataCurta(melhorDia[0])
        : "Sem conclusões";
}

function atualizarListaAtividade(tarefasPeriodo) {
    listaAtividade.replaceChildren();

    const tarefasOrdenadas = [...tarefasPeriodo]
        .sort((primeira, segunda) =>
            segunda.dataVencimento.localeCompare(primeira.dataVencimento)
        )
        .slice(0, 5);

    if (tarefasOrdenadas.length === 0) {
        const estadoVazio = document.createElement("p");
        estadoVazio.classList.add("atividade-vazia");
        estadoVazio.textContent = "Não há tarefas com vencimento neste período.";
        listaAtividade.appendChild(estadoVazio);
        return;
    }

    tarefasOrdenadas.forEach(tarefa => {
        const linha = document.createElement("div");
        linha.classList.add("atividade-item", "atividade-tarefa");

        const informacao = document.createElement("div");
        const titulo = document.createElement("p");
        titulo.classList.add("atividade-titulo");
        titulo.textContent = tarefa.titulo || "Tarefa sem título";

        const detalhe = document.createElement("p");
        detalhe.classList.add("atividade-detalhe");
        detalhe.textContent = `${tarefa.categoria || "Sem categoria"} · Vence ${formatarDataCurta(tarefa.dataVencimento)}`;

        const estado = document.createElement("span");
        estado.classList.add("badge");

        if (tarefa.status === true) {
            estado.classList.add("concluido");
            estado.textContent = "Concluída";
        } else if (tarefa.dataVencimento < hoje) {
            estado.classList.add("atrasada");
            estado.textContent = "Atrasada";
        } else {
            estado.classList.add("pendente");
            estado.textContent = "Pendente";
        }

        informacao.append(titulo, detalhe);
        linha.append(informacao, estado);
        listaAtividade.appendChild(linha);
    });
}

function atualizarGraficoProdutividade(tarefasPeriodo) {
    if (!canvasTarefas || typeof Chart === "undefined") {
        return;
    }

    const quantidadeDias = calcularDiasInclusivos(
        intervaloAtual.inicio,
        intervaloAtual.fim
    );
    const diasPorIntervalo = Math.max(1, Math.ceil(quantidadeDias / 31));
    const intervalos = [];

    for (let deslocamento = 0; deslocamento < quantidadeDias; deslocamento += diasPorIntervalo) {
        const inicio = adicionarDias(intervaloAtual.inicio, deslocamento);
        const fim = adicionarDias(
            inicio,
            Math.min(diasPorIntervalo, quantidadeDias - deslocamento) - 1
        );
        const tarefasDoIntervalo = tarefasPeriodo.filter(tarefa =>
            tarefa.dataVencimento >= inicio && tarefa.dataVencimento <= fim
        );

        intervalos.push({
            rotulo: inicio === fim
                ? formatarDataCurta(inicio)
                : `${formatarDataCurta(inicio)} – ${formatarDataCurta(fim)}`,
            total: tarefasDoIntervalo.length,
            concluidas: tarefasDoIntervalo.filter(tarefa => tarefa.status === true).length
        });
    }

    const estilos = getComputedStyle(document.documentElement);
    const corPrimaria = estilos.getPropertyValue("--color-primary").trim();
    const corSucesso = estilos.getPropertyValue("--color-success").trim();
    const corTexto = estilos.getPropertyValue("--color-text-secondary").trim();
    const corGrelha = estilos.getPropertyValue("--color-border").trim();

    if (graficoProdutividade) {
        graficoProdutividade.data.labels = intervalos.map(intervalo => intervalo.rotulo);
        graficoProdutividade.data.datasets[0].data = intervalos.map(intervalo => intervalo.total);
        graficoProdutividade.data.datasets[1].data = intervalos.map(intervalo => intervalo.concluidas);
        graficoProdutividade.update();
        return;
    }

    graficoProdutividade = new Chart(canvasTarefas, {
        type: "bar",
        data: {
            labels: intervalos.map(intervalo => intervalo.rotulo),
            datasets: [
                {
                    label: "Com vencimento",
                    data: intervalos.map(intervalo => intervalo.total),
                    backgroundColor: corPrimaria,
                    borderRadius: 6
                },
                {
                    label: "Concluídas por vencimento",
                    data: intervalos.map(intervalo => intervalo.concluidas),
                    backgroundColor: corSucesso,
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: corTexto }
                },
                y: {
                    beginAtZero: true,
                    ticks: { color: corTexto, precision: 0 },
                    grid: { color: corGrelha }
                }
            },
            plugins: {
                legend: {
                    labels: { color: corTexto }
                }
            }
        }
    });
}

function atualizarDescricaoPeriodo() {
    const inicio = formatarDataCurta(intervaloAtual.inicio);
    const fim = formatarDataCurta(intervaloAtual.fim);

    if (intervaloAtual.inicio === intervaloAtual.fim) {
        descricaoPeriodo.textContent = `A mostrar tarefas com vencimento em ${inicio}. A data em que foram concluídas não é registada.`;
    } else {
        descricaoPeriodo.textContent = `A mostrar tarefas com vencimento entre ${inicio} e ${fim}. A data em que foram concluídas não é registada.`;
    }
}

function obterDataHoje() {
    const data = new Date();

    return [
        data.getFullYear(),
        String(data.getMonth() + 1).padStart(2, "0"),
        String(data.getDate()).padStart(2, "0")
    ].join("-");
}

function normalizarData(data) {
    if (typeof data !== "string" || data.trim() === "") {
        return "";
    }

    const valor = data.trim();
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(valor)) {
        const [dia, mes, ano] = valor.split("/").map(Number);
        return validarData(ano, mes, dia);
    }

    const correspondencia = valor.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!correspondencia) return "";

    const ano = Number(correspondencia[1]);
    const mes = Number(correspondencia[2]);
    const dia = Number(correspondencia[3]);

    return validarData(ano, mes, dia);
}

function validarData(ano, mes, dia) {
    const dataValidada = new Date(ano, mes - 1, dia);
    if (
        dataValidada.getFullYear() !== ano ||
        dataValidada.getMonth() !== mes - 1 ||
        dataValidada.getDate() !== dia
    ) {
        return "";
    }

    return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

function adicionarDias(data, quantidade) {
    const [ano, mes, dia] = data.split("-").map(Number);
    const resultado = new Date(ano, mes - 1, dia + quantidade);

    return [
        resultado.getFullYear(),
        String(resultado.getMonth() + 1).padStart(2, "0"),
        String(resultado.getDate()).padStart(2, "0")
    ].join("-");
}

function calcularDiasInclusivos(inicio, fim) {
    const [anoInicio, mesInicio, diaInicio] = inicio.split("-").map(Number);
    const [anoFim, mesFim, diaFim] = fim.split("-").map(Number);
    const inicioUTC = Date.UTC(anoInicio, mesInicio - 1, diaInicio);
    const fimUTC = Date.UTC(anoFim, mesFim - 1, diaFim);

    return Math.max(1, Math.floor((fimUTC - inicioUTC) / 86400000) + 1);
}

function formatarDataCurta(data) {
    const [ano, mes, dia] = data.split("-").map(Number);

    return new Intl.DateTimeFormat("pt-AO", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    }).format(new Date(ano, mes - 1, dia));
}

function calcularPercentagem(quantidade, total) {
    return total > 0 ? Math.round((quantidade / total) * 100) : 0;
}

function calcularPercentagemDecimal(quantidade, total) {
    return total > 0 ? quantidade / total * 100 : 0;
}

window.addEventListener("storage", evento => {
    if (evento.key === "tarefas" || evento.key === null) {
        atualizarEstatisticas();
    }
});

atualizarEstatisticas();
