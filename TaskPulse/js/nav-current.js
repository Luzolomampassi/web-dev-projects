const paginaAtual = window.location.pathname.split("/").pop() || "index.html";

document.querySelectorAll("#menu a[href]").forEach(link => {
    if (link.getAttribute("href") === paginaAtual) {
        link.setAttribute("aria-current", "page");
    }
});
