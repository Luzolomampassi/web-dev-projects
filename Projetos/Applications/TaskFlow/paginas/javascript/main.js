const modal = document.querySelector(".modal")
const btnCancel = document.querySelectorAll(".btn-cancel")
const overlay = document.querySelector(".overlay")
// ==================== Overlay ====================
overlay.addEventListener("click", () => {
    modal.style.display = "none"
    overlay.classList.remove("ativo")
})
// ==================== Fundo ====================


