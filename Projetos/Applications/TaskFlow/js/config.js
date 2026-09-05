const body = document.body
const cardsTheme = document.querySelectorAll(".card")
const textThme = document.querySelector("#theme-text")
cardsTheme.forEach(theme => {
    theme.addEventListener("click",() => {
        if(theme.dataset.theme === 'escuro'){
            body.classList.add("dark")
            textThme.innerHTML = "Interface escura ativada para ambientes com pouca luz."
        }else{
            textThme.innerHTML = "Interface clara padrão para melhor legibilidade."
            body.classList.remove("dark")
        }
       
    })
});