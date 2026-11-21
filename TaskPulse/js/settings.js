


export function obterConfiguracoes() {

    try{
        const settingsSalvas =  JSON.parse(localStorage.getItem("settings") ?? "{}")

        if(settingsSalvas === null || typeof settingsSalvas !== "object" || Array.isArray(settingsSalvas)){
            return {};
        }



        return settingsSalvas

    }catch(erro){
        console.error("Erro a carregar as configurações." + erro)
        return "Erro a carregar as configurações.",{}
    }
    
}






export function aplicarConfiguracoes(settingsSalvas) {

    const { interface: configuracoesInterface, notificacoes, preferencias_pessoais } = settingsSalvas


    const modoGridAtivo = settingsSalvas?.interface?.modo_grid === true;
    const listaTarefas = document.querySelector("#lista-tarefas");
    if (!listaTarefas) return;
    listaTarefas.classList.toggle("grid", modoGridAtivo);

    
}