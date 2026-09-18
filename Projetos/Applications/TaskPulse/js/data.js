const tarefas = [];

function obterResumoTarefas() {

    const concluidas = tarefas.filter(
        item => item.status === true
    ).length;

    const pendentes = tarefas.filter(
        item => item.status === false
    ).length;

    const importantes = tarefas.filter(
        item => item.prioridade === "alta"
    ).length

    return {
        concluidas,
        pendentes,
        importantes
    };
}

export default tarefas;
export { obterResumoTarefas };