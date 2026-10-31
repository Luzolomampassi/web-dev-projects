export function obterTarefas() {
    try {
        const tarefasSalvas = JSON.parse(
            localStorage.getItem("tarefas") ?? "[]"
        );

        return Array.isArray(tarefasSalvas)
            ? tarefasSalvas
            : [];

    } catch (erro) {
        console.error("Erro ao carregar tarefas:", erro);
        return [];
    }
}

export function salvarTarefas(tarefas) {
    if (!Array.isArray(tarefas)) {
        throw new TypeError("As tarefas devem ser um array.");
    }

    localStorage.setItem(
        "tarefas",
        JSON.stringify(tarefas)
    );
}


export function calcularDados(tarefasSalvas = obterTarefas()) {

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const tarefasConcluidas = tarefasSalvas.filter(
        tarefa => tarefa.status === true
    );

    const tarefasArquivadas = tarefasSalvas.filter(
        tarefa => tarefa.arquivada === true
    );

    const tarefasAbertas = tarefasSalvas.filter(
        tarefa => tarefa.status !== true
    );

    const tarefasAtrasadas = tarefasAbertas.filter(tarefa => {
        if (!tarefa.vencimento) return false;

        const [ano, mes, dia] = normalizarData(tarefa.vencimento)
            .split("-")
            .map(Number);
        const dataVencimento = new Date(ano, mes - 1, dia);

        return dataVencimento < hoje;
    });

    const tarefasAbertasNoPrazo = tarefasAbertas.filter(
        tarefa => !tarefasAtrasadas.includes(tarefa)
    );

    const totalTarefas = tarefasSalvas.length;
    const quantidadeConcluidas = tarefasConcluidas.length;
    const quantidadePendentes = tarefasAbertas.length;
    const quantidadeAbertasNoPrazo = tarefasAbertasNoPrazo.length;
    const quantidadeAtrasadas = tarefasAtrasadas.length;
    const quantidadeArquivadas = tarefasArquivadas.length;

    const quantidadeImportantes = tarefasSalvas.filter(
        tarefa => tarefa.prioridade === "alta"
    ).length;

    const percentual = quantidade =>
        totalTarefas > 0
            ? Math.round((quantidade / totalTarefas) * 100)
            : 0;

    return {
        totalTarefas,
        quantidadeConcluidas,
        quantidadePendentes,
        quantidadeAbertasNoPrazo,
        quantidadeAtrasadas,
        quantidadeImportantes,
        quantidadeArquivadas,
        percentualConclusao: percentual(quantidadeConcluidas),
        percentualPendentes: percentual(quantidadePendentes),
        percentualAbertasNoPrazo: percentual(quantidadeAbertasNoPrazo),
        percentualAtrasadas: percentual(quantidadeAtrasadas),
        percentualEmAndamento: 0
    };
}



export function calcularResumoDia(tarefas, dataSelecionada) {
    const dataAlvo = normalizarData(dataSelecionada);

    const tarefasDoDia = tarefas.filter(tarefa => {
        return normalizarData(tarefa.vencimento) === dataAlvo;
    });

    const concluidas = tarefasDoDia.filter(
        tarefa => tarefa.status === true
    ).length;

    const altaPrioridade = tarefasDoDia.filter(
        tarefa => tarefa.prioridade === "alta"
    ).length;

    return {
        total: tarefasDoDia.length,
        concluidas,
        pendentes: tarefasDoDia.length - concluidas,
        altaPrioridade
    };
}

function normalizarData(data) {
    if (!data) return "";

    // Aceita YYYY-MM-DD ou DD/MM/YYYY
    const partes = data.split("/");

    if (partes.length === 3) {
        return `${partes[2]}-${partes[1]}-${partes[0]}`;
    }

    return data.slice(0, 10);
}
function obterCategorias(){
    try{
        const dadosJson = localStorage.getItem("categorias") ?? "[]"

        const categorias = JSON.parse(dadosJson)

        return Array.isArray(categorias) ? categorias : []
    }
    catch(erro){
        console.error("Houve um erro na buscar por categorias" + erro)
        return []
    }
}
export function dadosCategoria() {
    const categorias = obterCategorias();
    const tarefas = obterTarefas();

    const resumoCategorias = categorias.map(categoria => {

        const tarefasDaCategoria = tarefas.filter(tarefa => {
            return tarefa.categoria === categoria.titulo
        });

        
        const quantidadeConcluida = tarefasDaCategoria.filter(tarefa => {
          return  tarefa.status === true
        }).length;

        const quantidadePendente = tarefasDaCategoria.filter(tarefa => {
           return tarefa.status === false
        }).length;

       
        return {
            id: categoria.id,
            titulo: categoria.titulo,
            total: tarefasDaCategoria.length,
            quantidadeConcluida,
            quantidadePendente
        };
    });

    return resumoCategorias;
}


