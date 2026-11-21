const botaoMenu = document.querySelector("#btn-menu");
const menu = document.querySelector("#menu");

botaoMenu.addEventListener("click", () => {
    const aberto = menu.classList.toggle("ativo");
    botaoMenu.setAttribute("aria-expanded", String(aberto));
});
