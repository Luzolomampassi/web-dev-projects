const btnCriaConta = document.querySelector("#openSignup")
const btnLogin = document.querySelector("#openLogin")

const login = document.querySelector("#loginPanel")
const sign = document.querySelector("#signupPanel")


btnCriaConta.addEventListener("click", () => {

    login.classList.remove("ativo")
    sign.classList.add("ativo")

})


btnLogin.addEventListener("click", () => {

    sign.classList.remove("ativo")
    login.classList.add("ativo")

})