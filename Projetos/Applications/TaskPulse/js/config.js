// ========================== Elementos principais ==========================

const body = document.body
const cardsTheme = document.querySelectorAll(".card")
const textThme = document.querySelector("#theme-text")
const preferencia = localStorage.getItem("theme") ?? "light"

const mediaSistema = window.matchMedia(
    "(prefers-color-scheme: light)"
)


// ========================== Notificações ==========================

function dispararNotificacao(mensagem) {
    const notification = document.querySelector(".notification")

    notification.textContent = mensagem
    notification.classList.add("show")

    setTimeout(() => {
        notification.classList.remove("show")
    }, 3000)
}


// ========================== Tema ==========================

function mudarTema(tema) {
    body.classList.remove("light", "dark")
    body.classList.add(tema)
    document.documentElement.classList.remove("light", "dark")
    document.documentElement.classList.add(tema)
}

function aplicarPreferencia() {
    const temaGuardado = localStorage.getItem("theme") ?? "light"

    const temaFinal = temaGuardado === "system"
        ? (mediaSistema.matches ? "dark" : "light")
        : temaGuardado

    mudarTema(temaFinal)
}

aplicarPreferencia()

mediaSistema.addEventListener("change", () => {
    if (localStorage.getItem("theme") === "system") {
        aplicarPreferencia()
    }
})

cardsTheme.forEach(theme => {
    theme.addEventListener("click", () => {
        cardsTheme.forEach(card => {
            card.classList.remove("ativo")
        })

        theme.classList.add("ativo")

        const modo = theme.dataset.theme

        if (modo === "escuro") {
            localStorage.setItem("theme", "dark")
            textThme.textContent = "Interface escura ativada para ambientes com pouca luz."

        } else if (modo === "sistema") {
            localStorage.setItem("theme", "system")
            textThme.textContent = "O tema é ajustado automaticamente com as preferências do seu sistema operacional."

        } else {
            localStorage.setItem("theme", "light")
            textThme.textContent = "Interface clara padrão para melhor legibilidade."
        }

        aplicarPreferencia()
    })
})


// ========================== Switch ==========================

const checkbox = document.querySelectorAll(".checkbox")

checkbox.forEach(check => {
    check.addEventListener("change", () => {
        if (check.checked) {
            check.classList.add("on")
        } else {
            check.classList.remove("off")
        }
    })
})


// ========================== Eliminação e exportação de dados ==========================

const container = document.querySelector(".warning")
const btnDeletData = document.querySelector("#btn-delete")
const btnCancelar = document.querySelector("#btn-cancelar")

let confirmando = false

function reporEstado() {
    confirmando = false
    btnDeletData.innerHTML = "Limpar dados"
    btnDeletData.classList.remove("deleting")
    container.classList.remove("confirmando")
}

btnDeletData.addEventListener("click", () => {
    if (!confirmando) {
        confirmando = true
        btnDeletData.innerHTML = "Sim, limpar dados"
        btnDeletData.classList.add("deleting")
        container.classList.add("confirmando")

    } else {
        localStorage.removeItem("tarefas")

        dispararNotificacao("Dados eliminados com sucesso")

        reporEstado()
    }
})

btnCancelar.addEventListener("click", () => {
    reporEstado()
    btnDeletData.innerHTML = '<i class="fa-regular fa-trash-can"></i> Limpar todos os dados'
    container.classList.remove("confirmando")
})


// ========================== Última atualização ==========================

const btnSave = document.querySelector("#btn-save")
const lastUpdate = document.querySelector(".last-update")

btnSave.addEventListener("click", () => {
    const today = new Date()
    const year = today.getFullYear()

    const hours = today.toLocaleString("pt-AO", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    })

    const month = today.toLocaleString("pt-BR", {
        month: "long"
    })

    const day = String(today.getDate()).padStart(2, "0")

    lastUpdate.innerHTML = `Última atualização:${day} de ${month} de ${year}, ${hours}`
})


// ========================== Edição do perfil ==========================

const btnEditProfile = document.querySelector("#btn-editar-perfil")
const btnSaveProfile = document.querySelector("#btn-save-perfil")
const caixas = document.querySelectorAll(".form-group > input")

btnEditProfile.addEventListener("click", () => {
    btnSaveProfile.style.display = "flex"
    btnEditProfile.classList.add("active")

    caixas.forEach(caixa => {
        caixa.classList.add("editavel")
    })
})

btnSaveProfile.addEventListener("click", () => {
    btnSaveProfile.style.display = "none"
    btnEditProfile.classList.remove("active")

    caixas.forEach(caixa => {
        caixa.classList.remove("editavel")
    })
})


// ========================== Foto e formulário de perfil ==========================

const btnExportarJSON = document.querySelector("#btn-exportar-json")
const btnExportarCSV = document.querySelector("#btn-exportar-csv")



btnExportarJSON.addEventListener("click", () => {
    const dados = JSON.parse(
        localStorage.getItem("tarefas") ?? "[]"
    );

    if (!Array.isArray(dados) || dados.length === 0) {
        return;
    }

    const dadosJSON = JSON.stringify(dados, null, 2);

    const ficheiro = new Blob(
        [dadosJSON],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(ficheiro);

    const link = document.createElement("a");
    link.href = url;
    link.download = "tarefas.json";

    link.click();

    URL.revokeObjectURL(url);
});



btnExportarCSV.addEventListener("click", () => {
    const dados = JSON.parse(
        localStorage.getItem("tarefas") ?? "[]"
    );

    if (!Array.isArray(dados) || dados.length === 0) {
        return;
    }

    const colunas = Object.keys(dados[0]);

    const linhas = dados.map(tarefa =>
        colunas.map(coluna => {
            const valor = String(tarefa[coluna] ?? "");
            return `"${valor.replace(/"/g, '""')}"`;
        }).join(",")
    );

    const dadosCSV = [
        colunas.join(","),
        ...linhas
    ].join("\n");

    const ficheiro = new Blob(
        ["\uFEFF", dadosCSV],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(ficheiro);

    const link = document.createElement("a");
    link.href = url;
    link.download = "tarefas.csv";

    link.click();

    URL.revokeObjectURL(url);
});


const checkboxes = document.querySelectorAll(".checkbox")
const selects = document.querySelectorAll(".selects")

const settings = {
    preferencias_pessoais: {
        prioridade_padrao: "baixa",
        categoria_padrao: "pessoal",
        prazo_padrao: "nenhum",

        arquivar_tarefas_concluidas: false,
        confirmar_exclusao_de_tarefas: false,
        adicao_rapida_de_tarefas: false,
    },

    notificacoes: {
        lembretes_de_tarefas: false,
        tarefas_concluidas: false,
        resumo_diario: false
    },

    interface: {
        modo_compacto: false,
        exibir_tarefas_concluidas: false,
        animacoes_de_interface: false,
        cabecalho_fixo: false
    }
};

function guardarSettings() {
    localStorage.setItem("settings", JSON.stringify(settings));
}

function aplicarSettings() {
    let settingsGuardadas

    try {
        const dados = localStorage.getItem("settings");

        if (dados === null) {
            return;
        }

        settingsGuardadas = JSON.parse(dados);

    } catch (erro) {
        console.error("Erro ao carregar as configurações:", erro);
        return;
    }

    checkboxes.forEach(check => {
        const setting = check.dataset.setting;
        const section = check.closest("section");
        const settingList = section?.dataset.settinglist;

        const valor = settingsGuardadas?.[settingList]?.[setting];

        if (typeof valor === "boolean" && settings[settingList]) {
            settings[settingList][setting] = valor;

            check.checked = valor;
            check.dataset.ativo = String(valor);
        }
    });

    selects.forEach(select => {
        const setting = select.dataset.setting;
        const section = select.closest("section");
        const settingList = section?.dataset.settinglist;

        const valor = settingsGuardadas?.[settingList]?.[setting];

        if (typeof valor === "string" && settings[settingList]) {
            settings[settingList][setting] = valor;
            select.value = valor;
        }
    });
}

checkboxes.forEach(check => {
    check.addEventListener("change", () => {
        const setting = check.dataset.setting;
        const section = check.closest("section");
        const settingList = section?.dataset.settinglist;

        if (!settings[settingList] || !setting) {
            return;
        }

        settings[settingList][setting] = check.checked;
        check.dataset.ativo = String(check.checked);

        guardarSettings();
    });
});

selects.forEach(select => {
    select.addEventListener("change", () => {
        const setting = select.dataset.setting;
        const section = select.closest("section");
        const settingList = section?.dataset.settinglist;

        if (!settings[settingList] || !setting) {
            return;
        }

        settings[settingList][setting] = select.value;

        guardarSettings();
    });
});

aplicarSettings();





