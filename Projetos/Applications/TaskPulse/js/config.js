// ========================== Theme ==========================
const body = document.body
const cardsTheme = document.querySelectorAll(".card")
const textThme = document.querySelector("#theme-text")
cardsTheme.forEach(theme => {
    theme.addEventListener("click",() => {

        cardsTheme.forEach(card => {
            card.classList.remove("ativo")
        })

        theme.classList.add("ativo")

        if(theme.dataset.theme === 'escuro'){
            body.classList.add("dark")
            textThme.innerHTML = "Interface escura ativada para ambientes com pouca luz."
        }
        else if(theme.dataset.theme === 'sistema'){
            textThme.innerHTML = "O tema é ajustado automaticamente com as preferências do seu sistema operacional."
        }
        else{
            textThme.innerHTML = "Interface clara padrão para melhor legibilidade."
            body.classList.remove("dark")
        }
       
    })
});






// ========================== Switch ==========================

const checkbox = document.querySelectorAll(".checkbox")

checkbox.forEach( check =>{
    check.addEventListener('change', () =>{
        if(check.checked){
            check.classList.add("on")
        }else{
            check.classList.remove("off")
        }
    })
})
// =========== Deletação e Exportação de dados =========
const container = document.querySelector(".warning")
const btnDeletData = document.querySelector("#btn-delete")
const btnCancelar = document.querySelector("#btn-cancelar")

btnDeletData.addEventListener("click", () => {
    btnDeletData.innerHTML = "Sim, limpar dados"
    container.classList.add("confirmando")
})

btnCancelar.addEventListener("click", () => {
    btnDeletData.innerHTML = '<i class="fa-regular fa-trash-can"></i> Limpar todos os dados'
    container.classList.remove("confirmando")
})


// ============ ultima atualização===========
const btnSave = document.querySelector("#btn-save")
const lastUpdate = document.querySelector(".last-update")

btnSave.addEventListener("click", () =>{
    
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
