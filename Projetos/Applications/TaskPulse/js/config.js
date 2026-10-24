// ========================== Foto de perfil ==========================

const fotoPerfil = document.querySelector("#foto-perfil");
const secaoFotoPerfil = document.querySelector(".foto");
const inputFoto = document.querySelector("#input-foto");
const abrirMenuFoto = document.querySelector("#photo-menu-trigger");
const menuFoto = document.querySelector("#profile-actions");
const adicionarFoto = document.querySelector("#upload-photo");
const mudarFoto = document.querySelector("#change-photo");
const removerFoto = document.querySelector("#remove-photo");
const verFoto = document.querySelector("#view-photo");
const previewFoto = document.querySelector("#photo-preview");
const imagemPreview = document.querySelector("#photo-preview-image");
const fecharPreviewFoto = document.querySelector("#photo-preview-close");
const chaveFotoPerfil = "fotoPerfil";

function atualizarFotoPerfil(foto) {
    if (foto) {
        fotoPerfil.src = foto;
        fotoPerfil.alt = "Foto de perfil";
        secaoFotoPerfil.classList.add("has-photo");
    } else {
        fotoPerfil.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 180 180'%3E%3Ccircle cx='90' cy='90' r='90' fill='%23434348'/%3E%3Ccircle cx='90' cy='68' r='32' fill='%23d6d6d6'/%3E%3Cpath d='M35 157c8-27 31-43 55-43s47 16 55 43a90 90 0 0 1-110 0' fill='%23d6d6d6'/%3E%3C/svg%3E";
        fotoPerfil.alt = "Avatar padrão do perfil";
        secaoFotoPerfil.classList.remove("has-photo");
    }
}

atualizarFotoPerfil(localStorage.getItem(chaveFotoPerfil));

abrirMenuFoto.addEventListener("click", () => {
    const estaAberto = menuFoto.classList.toggle("is-open");
    abrirMenuFoto.setAttribute("aria-expanded", String(estaAberto));
});

function fecharMenuFoto() {
    menuFoto.classList.remove("is-open");
    abrirMenuFoto.setAttribute("aria-expanded", "false");
}

adicionarFoto.addEventListener("click", () => {
    fecharMenuFoto();
    inputFoto.click();
    setTimeout(() =>{
        dispararNotificacao("Foto de perfil adicionada com sucesso")
    },2000)
});


mudarFoto.addEventListener("click", () => {
    fecharMenuFoto();
    inputFoto.click();
});

inputFoto.addEventListener("change", () => {
    const ficheiro = inputFoto.files?.[0];
    if (!ficheiro) return;

    if (!ficheiro.type.startsWith("image/")) {
        inputFoto.value = "";
        return;
    }

    const leitor = new FileReader();
    leitor.addEventListener("load", () => {
        if (typeof leitor.result !== "string") return;

        try {
            localStorage.setItem(chaveFotoPerfil, leitor.result);
            atualizarFotoPerfil(leitor.result);
        } catch (erro) {
            console.error("Não foi possível guardar a foto de perfil:", erro);
        }

        inputFoto.value = "";
    });
    leitor.readAsDataURL(ficheiro);
});

removerFoto.addEventListener("click", () => {
    localStorage.removeItem(chaveFotoPerfil);
    atualizarFotoPerfil(null);
    fecharMenuFoto();
    setTimeout(() =>{
        dispararNotificacao("Foto de perfil removida com sucesso")
    },0)
});

verFoto.addEventListener("click", () => {
    const fotoGuardada = localStorage.getItem(chaveFotoPerfil);
    if (!fotoGuardada) return;

    imagemPreview.src = fotoGuardada;
    previewFoto.showModal();
    fecharMenuFoto();
});

fecharPreviewFoto.addEventListener("click", () => previewFoto.close());

previewFoto.addEventListener("click", (event) => {
    if (event.target === previewFoto) previewFoto.close();
});

document.addEventListener("click", (event) => {
    if (!secaoFotoPerfil.contains(event.target)) fecharMenuFoto();
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") fecharMenuFoto();
});

// ========================== Elementos principais ==========================

const body = document.body
const cardsTheme = document.querySelectorAll(".card")
const textThme = document.querySelector("#theme-text")
const mediaSistema = window.matchMedia(
    "(prefers-color-scheme: dark)"
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

const temaGuardado = localStorage.getItem("theme") ?? "light"
const temaCartao = {
    light: "claro",
    dark: "escuro",
    system: "sistema"
}[temaGuardado] ?? "claro"

cardsTheme.forEach(card => {
    card.classList.toggle("ativo", card.dataset.theme === temaCartao)
})

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
    check.classList.toggle("on", check.checked)
    check.classList.toggle("off", !check.checked)

    check.addEventListener("change", () => {
        check.classList.toggle("on", check.checked)
        check.classList.toggle("off", !check.checked)
    })
})


// ========================== Eliminação e exportação de dados ==========================

const container = document.querySelector(".warning")
const btnDeletData = document.querySelector("#btn-delete")
const btnCancelar = document.querySelector("#btn-cancelar")

let confirmando = false

function reporEstado() {
    confirmando = false
    btnDeletData.innerHTML = '<i class="fa-regular fa-trash-can"></i> Limpar todos os dados'
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
        localStorage.removeItem("settings")
        localStorage.removeItem("fotoPerfil")
        localStorage.removeItem("theme")
        localStorage.removeItem("categorias")
        localStorage.removeItem("categoria")

        dispararNotificacao("Dados do TaskPulse eliminados")

        reporEstado()
        setTimeout(() => window.location.reload(), 800)
    }
})

btnCancelar.addEventListener("click", () => {
    reporEstado()
    btnDeletData.innerHTML = '<i class="fa-regular fa-trash-can"></i> Limpar todos os dados'
    container.classList.remove("confirmando")
})


// ========================== Última atualização ==========================

// const btnSave = document.querySelector("#btn-save")
// const lastUpdate = document.querySelector(".last-update")

// btnSave.addEventListener("click", () => {
//     const today = new Date()
//     const year = today.getFullYear()

//     const hours = today.toLocaleString("pt-AO", {
//         hour: "2-digit",
//         minute: "2-digit",
//         second: "2-digit"
//     })

//     const month = today.toLocaleString("pt-BR", {
//         month: "long"
//     })

//     const day = String(today.getDate()).padStart(2, "0")

//     lastUpdate.innerHTML = `Última atualização:${day} de ${month} de ${year}, ${hours}`
// })



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





