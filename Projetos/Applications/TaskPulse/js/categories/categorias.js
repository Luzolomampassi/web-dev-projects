const btnMenu = document.querySelector("#btn-menu");
const menu = document.querySelector("#menu");
const iconMenu = btnMenu.querySelector("i");


btnMenu.addEventListener("click", () => {
    menu.classList.toggle("ativo");
    iconMenu.classList.toggle("fa-bars");
    iconMenu.classList.toggle("fa-xmark");
});

const modal = document.querySelector("#modal")
const btnAddCategoria = document.querySelector("#btn-add-categoria")
const btnItemADD = document.querySelector("#item-add")
const btnCancelar = document.querySelector(".btn-cancelar")
btnItemADD.addEventListener('click', () =>{
    modal.showModal()
    modal.classList.add('ativo')
   
})
btnAddCategoria.addEventListener('click', () =>{
    modal.showModal()
    modal.classList.add('ativo')
   
})

modal.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.close()
        modal.classList.remove('ativo')
    }
})
btnCancelar.addEventListener("click", () =>{
    modal.classList.remove('ativo')
    modal.close()
})

const btnEdit = document.querySelectorAll(".btn-edit")
btnEdit.forEach(element => {
    element.addEventListener('click', () =>{
        element.classList.add('editar')
    })
});