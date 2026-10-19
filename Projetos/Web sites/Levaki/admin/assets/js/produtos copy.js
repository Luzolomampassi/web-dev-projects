(() => {
    const form = document.querySelector("#product-form");
    const list = document.querySelector(".orders-list");
    const modal = document.querySelector("#modal-product");
    const idInput = document.querySelector("#produto-id");
    const title = modal.querySelector(".product-modal-title h2");
    const submitLabel = document.querySelector("#btn-save-product span");
    const rows = Array.from(list.querySelectorAll(".order-row"));
    const pagination = document.querySelector(".pagination-buttons");
    const summary = document.querySelector(".pagination-summary");
    const perPage = 6;
    let currentPage = 1;

    function renderPage() {
        const pageCount = Math.max(1, Math.ceil(rows.length / perPage));
        currentPage = Math.min(currentPage, pageCount);
        rows.forEach((row, index) => {
            row.hidden = index < (currentPage - 1) * perPage || index >= currentPage * perPage;
        });

        const start = rows.length ? (currentPage - 1) * perPage + 1 : 0;
        const end = Math.min(currentPage * perPage, rows.length);
        summary.textContent = `Mostrando ${start}–${end} de ${rows.length} produtos`;
        pagination.replaceChildren();

        for (let page = 1; page <= pageCount; page += 1) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "btn-section";
            button.textContent = String(page);
            button.setAttribute("aria-label", `Página ${page}`);
            button.setAttribute("aria-current", page === currentPage ? "page" : "false");
            button.addEventListener("click", () => {
                currentPage = page;
                renderPage();
            });
            pagination.append(button);
        }
    }

    function resetForm() {
        form.reset();
        idInput.value = "";
        document.querySelector("#produto-disponivel").checked = true;
        title.textContent = "Adicionar produto";
        submitLabel.textContent = "Guardar produto";
    }

    document.querySelector("#btn-add-product").addEventListener("click", () => {
        resetForm();
        modal.showModal();
    });

    list.addEventListener("click", async (event) => {
        const button = event.target.closest("button");
        const row = button?.closest(".order-row");
        if (!button || !row) return;

        if (button.matches(".btn-edit-product")) {
            idInput.value = row.dataset.dishId;
            document.querySelector("#nome-produto").value = row.dataset.prato;
            document.querySelector("#preco-produto").value = row.dataset.preco;
            document.querySelector("#categoria-produto").value = row.dataset.categoria;
            document.querySelector("#restaurante-produto").value = row.dataset.restaurante;
            document.querySelector("#descricao-produto").value = row.dataset.descricao;
            document.querySelector("#imagem-produto").value = "";
            document.querySelector("#produto-disponivel").checked = row.dataset.disponibilidade === "available";
            title.textContent = "Editar produto";
            submitLabel.textContent = "Guardar alterações";
            modal.showModal();
            return;
        }

        if (button.matches(".btn-delete-product")) {
            if (!window.confirm(`Eliminar o produto “${row.dataset.prato}”?`)) return;
            const data = new FormData();
            data.set("acao", "eliminar");
            data.set("id", row.dataset.dishId);
            try {
                await enviarFormulario(data, row);
            } catch {
                window.alert("Não foi possível contactar o servidor. Tenta novamente.");
            }
        }
    });

    document.querySelector("#btn-close-modal-top").addEventListener("click", () => modal.close());
    document.querySelector("#btn-cancel-edit").addEventListener("click", () => modal.close());
    modal.addEventListener("click", (event) => {
        if (event.target === modal) modal.close();
    });

    document.querySelector("#imagem-produto").addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (!file) return;
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
            window.alert("Seleciona uma imagem JPG, PNG ou WebP com até 5 MB.");
            event.target.value = "";
        }
    });

    async function enviarFormulario(data, row = null) {
        const response = await fetch("processar-produtos.php", { method: "POST", body: data });
        const result = await response.json();
        if (!response.ok || !result.sucesso) {
            window.alert(result.mensagem || "Não foi possível processar o produto.");
            return;
        }
        if (row) {
            row.remove();
            rows.splice(rows.indexOf(row), 1);
            renderPage();
        } else {
            modal.close();
            window.location.reload();
        }
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const data = new FormData(form);
        try {
            await enviarFormulario(data);
        } catch {
            window.alert("Não foi possível contactar o servidor. Tenta novamente.");
        }
    });

    renderPage();
})();
