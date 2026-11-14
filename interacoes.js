
const botao_menu = document.getElementById("menu-btn");
const menu = document.getElementById("menu");

// Menu mobile
if (botao_menu && menu) {
    botao_menu.addEventListener("click", () => {
        const menuAberto = menu.classList.toggle("ativo");
        botao_menu.setAttribute("aria-expanded", String(menuAberto));
        botao_menu.setAttribute("aria-label", menuAberto ? "Fechar menu" : "Abrir menu");
    });
}

// Tema de cores do portfólio
const botoesTema = document.querySelectorAll("[data-theme-choice]");
const temasPermitidos = ["lime", "blue", "violet"];
let temaSalvo = null;

try {
    temaSalvo = localStorage.getItem("portfolio-theme");
} catch (erro) {
    // O tema continua funcional durante a sessão se o navegador bloquear storage.
}

function aplicarTema(tema) {
    if (!temasPermitidos.includes(tema)) return;

    document.body.dataset.theme = tema;
    botoesTema.forEach((botao) => {
        botao.setAttribute("aria-pressed", String(botao.dataset.themeChoice === tema));
    });
}

aplicarTema(temasPermitidos.includes(temaSalvo) ? temaSalvo : "lime");

botoesTema.forEach((botao) => {
    botao.addEventListener("click", () => {
        const tema = botao.dataset.themeChoice;
        aplicarTema(tema);
        try {
            localStorage.setItem("portfolio-theme", tema);
        } catch (erro) {
            // Mantém a escolha aplicada até a página ser fechada.
        }
    });
});
