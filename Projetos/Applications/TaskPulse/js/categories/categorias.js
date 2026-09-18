const btnMenu = document.querySelector("#btn-menu");
const menu = document.querySelector("#menu");
const iconMenu = btnMenu.querySelector("i");

btnMenu.addEventListener("click", () => {
    menu.classList.toggle("ativo");
});

const btnAddCategoria = document.querySelector("#btn-add-categoria")
const btnItemADD = document.querySelector("#item-add")
const btnCancelar = document.querySelector(".btn-cancelar")
btnItemADD.addEventListener('click', () =>{
    modal.showModal()
    modal.classList.add('ativo')
   
})
btnAddCategoria.addEventListener('click', () =>{
    modal.showModal()
})

modal.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.close()
    }
})
btnCancelar.addEventListener("click", () =>{
    modal.close()
})

const btnEdit = document.querySelectorAll(".btn-edit")
btnEdit.forEach(element => {
    element.addEventListener('click', () =>{
        element.classList.add('editar')
    })
});





