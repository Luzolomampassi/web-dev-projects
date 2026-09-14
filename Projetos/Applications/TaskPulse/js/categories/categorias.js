const btnMenu = document.querySelector("#btn-menu");
const menu = document.querySelector("#menu");
const iconMenu = btnMenu.querySelector("i");


btnMenu.addEventListener("click", () => {
    menu.classList.toggle("ativo");
    iconMenu.classList.toggle("fa-bars");
    iconMenu.classList.toggle("fa-xmark");

    overlay.classList.toggle("ativo", menu.classList.contains("ativo"));
});

const modal = document.querySelector("#modal")
const btnAddCategoria = document.querySelector("#btn-add-categoria")

btnAddCategoria.addEventListener('click', () =>{
    modal.showModal()
  
})