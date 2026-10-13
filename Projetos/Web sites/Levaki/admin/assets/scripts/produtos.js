// =====================================================
// ELEMENTOS
// =====================================================

const barSearch = document.querySelector("#product-search");
const categoryFilter = document.querySelector("#categoria-filtro");
const restaurantFilter = document.querySelector("#restaurante-filtro");
const availabilityFilter = document.querySelector("#disponibilidade");
const priceFilter = document.querySelector("#preco-filtro");
const order = document.querySelector("#ordem");

const btnAddProduct = document.querySelector("#btn-add-product");
const btnViewProduct = document.querySelectorAll(".btn-view-product");
const btnEditProduct = document.querySelectorAll(".btn-edit-product");

const btnCloseEditModalTop = document.querySelector("#btn-close-edit-modal-top");
const btnCloseViewModalTop = document.querySelector("#btn-close-view-modal");
const btnCloseViewModalBottom = document.querySelector("#btn-close-view-modal-bottom");

const btnOpenEditModal = document.querySelector("#btn-open-edit-modal");
const btnCancelEdit = document.querySelector("#btn-cancel-edit");
const btnSaveProduct = document.querySelector("#btn-save-product");

const modalViewProduct = document.querySelector("#view-modal");
const modalEditProduct = document.querySelector("#edit-modal");

const productList = document.querySelector(".orders-list");

const productName = document.querySelector("#nome-produto");
const productPrice = document.querySelector("#preco-produto");
const productCategory = document.querySelector("#categoria-produto");
const productRestaurant = document.querySelector("#restaurante-produto");
const productDescription = modalEditProduct.querySelector("#descricao-produto");
const productImage = document.querySelector("#imagem-produto");
const productAvailable = document.querySelector("#produto-disponivel");

const editModalTitle = modalEditProduct.querySelector(".product-modal-title h2");
const saveButtonText = btnSaveProduct.querySelector("span");

let selectedProduct = null;
let editingProduct = false;


// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

function getProductRow(button) {
    return button.closest(".order-row");
}

function getProductName(row) {
    return row.dataset.prato;
}

function formatPrice(price) {
    return Number(price).toLocaleString("pt-AO") + " Kz";
}

function getCategoryName(value) {
    const categories = {
        entradas: "Entradas",
        "pratos-principais": "Pratos principais",
        sobremesas: "Sobremesas",
        bebidas: "Bebidas"
    };

    return categories[value] || value;
}

function getRestaurantName(value) {
    const restaurants = {
        "casa-oliva": "Casa Oliva",
        "nori-co": "Nori & Co",
        "trattoria-vero": "Trattoria Vero",
        "bottega-verde": "Bottega Verde"
    };

    return restaurants[value] || value;
}

function getRestaurantValue(name) {
    const restaurants = {
        "Casa Oliva": "casa-oliva",
        "Nori & Co": "nori-co",
        "Trattoria Vero": "trattoria-vero",
        "Bottega Verde": "bottega-verde"
    };

    return restaurants[name] || "";
}

function updateProductCount() {
    const total = productList.querySelectorAll(".order-row").length;

    const description = document.querySelector(".dashboard-orders-head p");

    if (description) {
        description.textContent =
            `${total} ${total === 1 ? "produto encontrado" : "produtos encontrados"}`;
    }
}

function updateAvailability(row, available) {
    const status = row.querySelector(".order-status");
    const toggleButton = row.querySelector(".btn-toggle-product");
    const productName = getProductName(row);

    row.dataset.disponibilidade = available ? "available" : "unavailable";

    status.classList.toggle("available", available);
    status.classList.toggle("unavailable", !available);

    status.dataset.orderStatus = available ? "available" : "unavailable";

    status.lastChild.textContent = available
        ? " Disponível"
        : " Indisponível";

    toggleButton.title = available ? "Desativar" : "Ativar";
    toggleButton.setAttribute(
        "aria-label",
        `${available ? "Desativar" : "Ativar"} ${productName}`
    );

    toggleButton.innerHTML = available
        ? '<i class="fa-solid fa-x"></i>'
        : '<i class="fa-solid fa-check"></i>';
}

function updateRow(row, data) {
    row.dataset.prato = data.name;
    row.dataset.categoria = data.category;
    row.dataset.restaurante = data.restaurant;
    row.dataset.preco = data.price;

    row.querySelector("td:nth-child(1) span").innerHTML =
        `${data.name}<small>#${row.dataset.dishId}</small>`;

    row.querySelector("td:nth-child(2)").textContent =
        getCategoryName(data.category);

    row.querySelector(".restaurant-name").textContent =
        getRestaurantName(data.restaurant);

    row.querySelector(".order-value").textContent =
        formatPrice(data.price);

    row.querySelectorAll(".btn-view-product, .btn-edit-product, .btn-toggle-product, .btn-delete-product")
        .forEach(button => {
            const action = button.classList.contains("btn-view-product")
                ? "Visualizar"
                : button.classList.contains("btn-edit-product")
                ? "Editar"
                : button.classList.contains("btn-toggle-product")
                ? (data.available ? "Desativar" : "Ativar")
                : "Excluir";

            button.setAttribute("aria-label", `${action} ${data.name}`);
        });

    updateAvailability(row, data.available);
}

function populateEditModal(row) {
    productName.value = getProductName(row);
    productPrice.value = row.dataset.preco;
    productCategory.value = row.dataset.categoria;

    productRestaurant.value = getRestaurantValue(
        row.dataset.restaurante
    );

    productAvailable.checked =
        row.dataset.disponibilidade === "available";

    editingProduct = true;
    selectedProduct = row;

    editModalTitle.textContent = "Editar produto";
    saveButtonText.textContent = "Guardar alterações";
}

function resetEditModal() {
    modalEditProduct.querySelector("form")?.reset();

    productName.value = "";
    productPrice.value = "";
    productCategory.value = "";
    productRestaurant.value = "";
    productDescription.value = "";
    productImage.value = "";
    productAvailable.checked = true;

    selectedProduct = null;
    editingProduct = false;

    editModalTitle.textContent = "Adicionar produto";
    saveButtonText.textContent = "Guardar produto";
}

function openEditModal(row = null) {
    if (row) {
        populateEditModal(row);
    } else {
        resetEditModal();
    }

    if (modalViewProduct.open) {
        modalViewProduct.close();
    }

    modalEditProduct.showModal();
}

function populateViewModal(row) {
    modalViewProduct.querySelector("#edit-product").value =
        getProductName(row);

    modalViewProduct.querySelector("#product-price").value =
        row.dataset.preco;

    modalViewProduct.querySelector("#categoria-filtro").value =
        row.dataset.categoria;

    modalViewProduct.querySelector("#restaurante-filtro").value =
        getRestaurantValue(row.dataset.restaurante);

    selectedProduct = row;
}


// =====================================================
// VISUALIZAR PRODUTO
// =====================================================

btnViewProduct.forEach(button => {
    button.addEventListener("click", () => {
        const row = getProductRow(button);

        selectedProduct = row;
        populateViewModal(row);

        modalViewProduct.showModal();
    });
});


// =====================================================
// EDITAR PRODUTO
// =====================================================

btnEditProduct.forEach(button => {
    button.addEventListener("click", () => {
        openEditModal(getProductRow(button));
    });
});

btnOpenEditModal.addEventListener("click", () => {
    if (selectedProduct) {
        openEditModal(selectedProduct);
    }
});


// =====================================================
// ADICIONAR PRODUTO
// =====================================================

btnAddProduct.addEventListener("click", () => {
    openEditModal();
});


// =====================================================
// FECHAR MODAIS
// =====================================================

btnCloseViewModalTop.addEventListener("click", () => {
    modalViewProduct.close();
});

btnCloseViewModalBottom.addEventListener("click", () => {
    modalViewProduct.close();
});

btnCloseEditModalTop.addEventListener("click", () => {
    modalEditProduct.close();
});

btnCancelEdit.addEventListener("click", () => {
    modalEditProduct.close();
});

[modalViewProduct, modalEditProduct].forEach(modal => {
    modal.addEventListener("click", event => {
        if (event.target === modal) {
            modal.close();
        }
    });
});


// =====================================================
// GUARDAR PRODUTO
// =====================================================

btnSaveProduct.addEventListener("click", () => {
    const name = productName.value.trim();
    const price = Number(productPrice.value);
    const category = productCategory.value;
    const restaurant = productRestaurant.value;

    if (!name || !productPrice.value || !category || !restaurant) {
        alert("Preencha o nome, o preço, a categoria e o restaurante.");
        return;
    }

    if (!Number.isFinite(price) || price < 0) {
        alert("Introduza um preço válido.");
        return;
    }

    const data = {
        name,
        price,
        category,
        restaurant: getRestaurantName(restaurant),
        available: productAvailable.checked
    };

    if (editingProduct && selectedProduct) {
        updateRow(selectedProduct, data);
    } else {
        const existingIds = [...productList.querySelectorAll(".order-row")]
            .map(row => Number(row.dataset.dishId) || 0);

        const nextId = String(Math.max(0, ...existingIds) + 1)
            .padStart(4, "0");

        const row = document.createElement("tr");

        row.className = "order-row";
        row.dataset.dishId = nextId;
        row.innerHTML = `
            <td>
                <img src="" alt="">
                <span>${escapeHTML(name)}<small>#${nextId}</small></span>
            </td>
            <td>${escapeHTML(getCategoryName(category))}</td>
            <td class="restaurant-name">${escapeHTML(data.restaurant)}</td>
            <td class="order-value">${formatPrice(price)}</td>
            <td>
                <span class="date-cell">
                    ${new Date().toLocaleDateString("pt-AO")}
                    <small>${new Date().toLocaleTimeString("pt-AO", {
                        hour: "2-digit",
                        minute: "2-digit"
                    })}</small>
                </span>
            </td>
            <td>
                <span class="badge order-status">
                    <span class="badge-dot"></span>
                    ${data.available ? "Disponível" : "Indisponível"}
                </span>
            </td>
            <td>
                <button type="button" class="btn-view-product" title="Visualizar">
                    <i class="fa-regular fa-eye"></i>
                </button>
                <button type="button" class="btn-edit-product" title="Editar">
                    <i class="fa-regular fa-pen-to-square"></i>
                </button>
                <button type="button" class="btn-toggle-product" title="Alterar disponibilidade">
                    <i class="fa-solid fa-x"></i>
                </button>
                <button type="button" class="btn-delete-product" title="Excluir">
                    <i class="fa-regular fa-trash-can"></i>
                </button>
            </td>
        `;

        productList.prepend(row);
        updateRow(row, data);
    }

    updateProductCount();
    modalEditProduct.close();
});

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}


// =====================================================
// AÇÕES DOS PRODUTOS DA TABELA
// Inclui também as linhas criadas dinamicamente.
// =====================================================

productList.addEventListener("click", event => {
    const button = event.target.closest("button");

    if (!button) return;

    const row = getProductRow(button);

    if (!row) return;

    if (button.classList.contains("btn-view-product")) {
        selectedProduct = row;
        populateViewModal(row);
        modalViewProduct.showModal();
        return;
    }

    if (button.classList.contains("btn-edit-product")) {
        openEditModal(row);
        return;
    }

    if (button.classList.contains("btn-toggle-product")) {
        const available = row.dataset.disponibilidade !== "available";
        updateAvailability(row, available);
        return;
    }

    if (button.classList.contains("btn-delete-product")) {
        const confirmed = confirm(
            `Tens a certeza de que pretendes excluir "${getProductName(row)}"?`
        );

        if (!confirmed) return;

        if (selectedProduct === row) {
            selectedProduct = null;
        }

        row.remove();
        updateProductCount();
    }
});


// =====================================================
// VALIDAR IMAGEM
// =====================================================

productImage.addEventListener("change", () => {
    const file = productImage.files[0];

    if (!file) return;

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
        alert("Seleciona uma imagem JPG, PNG ou WebP.");
        productImage.value = "";
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        alert("A imagem não pode ultrapassar 5 MB.");
        productImage.value = "";
        return;
    }
});


// =====================================================
// FILTROS E PESQUISA
// =====================================================

function filterProducts() {
    const search = barSearch.value.trim().toLowerCase();

    productList.querySelectorAll(".order-row").forEach(row => {
        const matchesSearch = [
            row.dataset.prato,
            row.dataset.categoria,
            row.dataset.restaurante
        ].some(value => value.toLowerCase().includes(search));

        const matchesCategory =
            !categoryFilter.value ||
            row.dataset.categoria === categoryFilter.value;

        const matchesRestaurant =
            !restaurantFilter.value ||
            getRestaurantValue(row.dataset.restaurante) === restaurantFilter.value;

        const matchesAvailability =
            !availabilityFilter.value ||
            row.dataset.disponibilidade === availabilityFilter.value;

        const price = Number(row.dataset.preco);
        let matchesPrice = true;

        if (priceFilter.value === "0-9000") {
            matchesPrice = price <= 9000;
        } else if (priceFilter.value === "9000-18000") {
            matchesPrice = price >= 9000 && price <= 18000;
        } else if (priceFilter.value === "18000+") {
            matchesPrice = price > 18000;
        }

        row.hidden = !(
            matchesSearch &&
            matchesCategory &&
            matchesRestaurant &&
            matchesAvailability &&
            matchesPrice
        );
    });
}

[barSearch, categoryFilter, restaurantFilter, availabilityFilter, priceFilter]
    .forEach(element => {
        element.addEventListener("input", filterProducts);
        element.addEventListener("change", filterProducts);
    });


// =====================================================
// ORDENAÇÃO
// =====================================================

order.addEventListener("change", () => {
    const rows = [...productList.querySelectorAll(".order-row")];

    rows.sort((a, b) => {
        switch (order.value) {
            case "name-asc":
                return getProductName(a).localeCompare(getProductName(b));

            case "price-asc":
                return Number(a.dataset.preco) - Number(b.dataset.preco);

            case "price-desc":
                return Number(b.dataset.preco) - Number(a.dataset.preco);

            case "recent":
            default:
                return Number(b.dataset.dishId) - Number(a.dataset.dishId);
        }
    });

    rows.forEach(row => productList.appendChild(row));
});

