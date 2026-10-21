// const tarefas = [];

// function obterResumoTarefas() {

//     const concluidas = tarefas.filter(
//         item => item.status === true
//     ).length;

//     const pendentes = tarefas.filter(
//         item => item.status === false
//     ).length;

//     const importantes = tarefas.filter(
//         item => item.prioridade === "alta"
//     ).length

//     return {
//         concluidas,
//         pendentes,
//         importantes
//     };
// }

// export default tarefas;
// export { obterResumoTarefas };


export function obterTarefas() {
    const tarefasSalvas = JSON.parse(localStorage.getItem("tarefas") ?? "[]");
    return Array.isArray(tarefasSalvas) ? tarefasSalvas : [];
}

export function calcularDados(tarefasSalvas = obterTarefas()) {

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const tarefasConcluidas = tarefasSalvas.filter(
        tarefa => tarefa.status === true
    );

    const tarefasAbertas = tarefasSalvas.filter(
        tarefa => tarefa.status === false
    );

    const tarefasAtrasadas = tarefasAbertas.filter(tarefa => {
        if (!tarefa.vencimento) return false;

        const [ano, mes, dia] = tarefa.vencimento.split("-").map(Number);
        const dataVencimento = new Date(ano, mes - 1, dia);

        return dataVencimento < hoje;
    });

    const tarefasPendentes = tarefasAbertas.filter(
        tarefa => !tarefasAtrasadas.includes(tarefa)
    );

    const totalTarefas = tarefasSalvas.length;
    const quantidadeConcluidas = tarefasConcluidas.length;
    const quantidadePendentes = tarefasPendentes.length;
    const quantidadeAtrasadas = tarefasAtrasadas.length;

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
        quantidadeAtrasadas,
        quantidadeImportantes,
        // quantidadeEmAndamento: 0,
        percentualConclusao: percentual(quantidadeConcluidas),
        percentualPendentes: percentual(quantidadePendentes),
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
        tarefa => tarefa.concluida === true
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
