
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

// Modo light
const botaoTemaClaro = document.querySelector("#btn_light");

if (botaoTemaClaro) {
    botaoTemaClaro.addEventListener("click", () => {
        document.body.classList.toggle("light-theme");
    });
}
