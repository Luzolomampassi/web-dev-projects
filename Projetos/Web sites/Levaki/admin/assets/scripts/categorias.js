
const categoryModal = document.querySelector("#category-edit-modal");
const modalCreateCategory = document.querySelector("#category-create-modal");

const btnAddCategory = document.querySelector("#btn-add-category");
const btnCreateCategory = document.querySelector("#btn-create-category");
const btnSaveCategory = document.querySelector("#btn-save-category");

const tableBody = document.querySelector(".orders-list");
const categorySearch = document.querySelector("#category-search");

const createName = document.querySelector("#nome-category-create");
const createDescription = document.querySelector("#category-description-create");
const createStatus = document.querySelector("#check-create");

const editName = document.querySelector("#nome-category-edit");
const editDescription = document.querySelector("#category-description-edit");
const editStatus = categoryModal.querySelector(".check");

const closeCreate = document.querySelector("#btn-close-create-modal");
const closeEdit = document.querySelector("#btn-close-restaurant-modal");

const cancelButtons = document.querySelectorAll("#btn-cancel-category");

const categoryCount = document.querySelector(".dashboard-orders-head p");

let selectedRow = null;




btnAddCategory.addEventListener("click", () => {
    modalCreateCategory.showModal();
});


btnCreateCategory.addEventListener("click", () => {
    const nome = createName.value.trim();
    const descricao = createDescription.value.trim();

    if (!nome) {
        createName.focus();
        return;
    }

    const duplicate = [...tableBody.querySelectorAll(".order-row")]
        .some(row =>
            normalizeCategory(getCategoryName(row)) === normalizeCategory(nome)
        );

    if (duplicate) {
        alert("Já existe uma categoria com esse nome.");
        createName.focus();
        return;
    }

    const data = {
        nome,
        descricao,
        estado: createStatus.checked ? "active" : "inactive"
    };

    addCategory(data);

    modalCreateCategory.close();

    createName.value = "";
    createDescription.value = "";
    createStatus.checked = true;

    applyCategorySearch();
});


closeCreate.addEventListener("click", () => {
    modalCreateCategory.close();
});

closeEdit.addEventListener("click", () => {
    categoryModal.close();
});

cancelButtons.forEach(button => {
    button.addEventListener("click", () => {
        const dialog = button.closest("dialog");

        if (dialog) {
            dialog.close();
        }
    });
});


[categoryModal, modalCreateCategory].forEach(dialog => {
    dialog.addEventListener("click", event => {
        if (event.target === dialog) {
            dialog.close();
        }
    });
});

updateCategoryCount();