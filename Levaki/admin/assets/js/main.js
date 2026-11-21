// ============================================================
// NAVEGAÇÃO
// ============================================================

const navItemList = document.querySelectorAll(".nav-item");

const paginaAtual = new URL(window.location.href).pathname;

navItemList.forEach((navItem) => {
    const href = navItem.getAttribute("href");

    if (!href) {
        return;
    }

    const urlDoItem = new URL(href, window.location.href);

    if (urlDoItem.pathname === paginaAtual) {
        navItem.classList.add("selected");

        const marcaExistente = navItem.querySelector(".nav-selected-mark");

        if (!marcaExistente) {
            const marca = document.createElement("span");
            marca.classList.add("nav-selected-mark");

            navItem.append(marca);
        }
    }
});


// ============================================================
// PESQUISA DE PEDIDOS
// ============================================================

const searchBar = document.querySelector("#search");
const nomeRestaurante = document.querySelectorAll(".restaurant-name");
const registros = document.querySelectorAll(".order-row");

if (searchBar) {

    searchBar.addEventListener("input", () => {

        const pesquisa = searchBar.value.trim().toLowerCase();

        registros.forEach((registro) => {

            const textoRegistro = registro.textContent.toLowerCase();

            registro.hidden = !textoRegistro.includes(pesquisa);

        });

    });

}


// ============================================================
// MODAL DE PEDIDO
// ============================================================

const linksStrong = document.querySelectorAll(".link-strong");

const actionButtons = document.querySelectorAll(
    ".btn-action-table"
);

const modal = document.querySelector("#order-modal");

const formulario = document.querySelector("#formulario");

const btnModalClose = document.querySelector(".modal-close");


// ============================================================
// ABRIR MODAL
// ============================================================

if (modal) {

    linksStrong.forEach((element) => {

        element.addEventListener("click", () => {
            modal.showModal();
        });

    });


    actionButtons.forEach((element) => {

        element.addEventListener("click", () => {
            modal.showModal();
        });

    });


    // ========================================================
    // FECHAR MODAL
    // ========================================================

    if (btnModalClose) {

        btnModalClose.addEventListener("click", () => {
            modal.close();
        });

    }


    // ========================================================
    // CONCLUIR FORMULÁRIO
    // ========================================================

    if (formulario) {

        formulario.addEventListener("submit", (event) => {

            event.preventDefault();

            modal.close();

        });

    }


    // ========================================================
    // FECHAR CLICANDO NO BACKDROP
    // ========================================================

    modal.addEventListener("click", (event) => {

        if (event.target === modal) {
            modal.close();
        }

    });

}