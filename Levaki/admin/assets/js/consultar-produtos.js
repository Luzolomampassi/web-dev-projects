// CONSULTANDO PRODUTOS
const formSearch = document.querySelector("#formSearch")
const barSearch = document.querySelector("#product-search")
const alerta = document.querySelector("#alert")
function dispararAlert(){
    alerta.classList.add("ativo")
    setTimeout(() => {
        alerta.classList.remove("ativo");
    }, 2000);
}



formSearch.addEventListener("submit", async (event) =>{
    event.preventDefault()
    const searchContent = document.querySelector("#product-search").value.trim()
    const categoriaProdutos = document.querySelector("#categoria-produtos").value.trim()
    const restauranteProdutos= document.querySelector("#restaurante-produtos").value.trim()
    const disponibilidade = document.querySelector("#disponibilidade").value.trim()
    // const precoFiltro = document.querySelector("#preco-filtro").value.trim()
    const ordem = document.querySelector("#ordem").value.trim()

    const dadosConsulta = new FormData(formSearch)

    const respostaConsulta = await fetch("consultar-produtos.php", {
        method:"POST",
        body:dadosConsulta
    })

    const resultadoConsulta = await respostaConsulta.json()
    const mensagem = resultadoConsulta.mensagem
    adicionarProduto(resultadoConsulta.produtos)
    
})



function adicionarProduto(resultado) {
    resultado.forEach((element) => {
        const id = element.id;
        const nome = element.nome;
        const preco = element.preco;
        const categoria_id = Number(element.categoria_id);
        const restaurante_id = Number(element.restaurante_id);
        const disponivel = Number(element.disponivel);
        const criado_em = element.criado_em;
        const descricao = element.descricao ?? "";
        const imagem = element.imagem ?? "";

        const row = document.createElement("tr");
        row.classList.add("order-row");

        row.dataset.id = id;
        row.dataset.nome = nome;
        row.dataset.preco = preco;
        row.dataset.categoriaId = categoria_id;
        row.dataset.restauranteId = restaurante_id;
        row.dataset.descricao = descricao;
        row.dataset.imagem = imagem;
        row.dataset.disponibilidade = disponivel === 1
            ? "available"
            : "unavailable";

        // Produto
        const cellProduto = document.createElement("td");
        const produto = document.createElement("span");
        const produtoThumbnail = document.createElement("span");
        const produtoName = document.createElement("span");

        produto.classList.add("product-name-cell");
        produtoName.textContent = nome;

        if (imagem) {
            const img = document.createElement("img");
            img.classList.add("product-thumbnail");
            img.src = imagem;
            img.alt = `Imagem de ${nome}`;
            img.loading = "lazy";
            produtoThumbnail.appendChild(img);
        } else {
            produtoThumbnail.classList.add(
                "product-thumbnail",
                "product-thumbnail-empty"
            );

            produtoThumbnail.setAttribute("aria-hidden", "true");

            const icon = document.createElement("i");
            icon.classList.add("fa-regular", "fa-image");
            produtoThumbnail.appendChild(icon);
        }

        produto.append(produtoThumbnail, produtoName);
        cellProduto.appendChild(produto);

        // Categoria
        const cellCategoria = document.createElement("td");

        const categorias = {
            1: "Entradas",
            2: "Pratos principais",
            3: "Sobremesas",
            4: "Bebidas"
        };

        cellCategoria.textContent = categorias[categoria_id] ?? "—";

        // Restaurante
        const cellRestaurante = document.createElement("td");

        const restaurantes = {
            1: "Levaki Grill",
            2: "Bella Pasta",
            3: "Sabor da Casa",
            4: "Bottega Verde"
        };

        cellRestaurante.textContent = restaurantes[restaurante_id] ?? "—";

        // Preço
        const cellPreço = document.createElement("td");
        cellPreço.textContent = `${preco} Kz`;

        // Data de criação
        const cellCriado_em = document.createElement("td");
        cellCriado_em.textContent = criado_em ?? "—";

        // Disponibilidade
        const cellDisponibilidade = document.createElement("td");
        const badge = document.createElement("span");
        const badgeDot = document.createElement("span");

        badge.classList.add(
            "badge",
            "order-status",
            disponivel === 1 ? "active" : "inactive"
        );

        badgeDot.classList.add("badge-dot");
        badgeDot.setAttribute("aria-hidden", "true");

        badge.appendChild(badgeDot);
        badge.append(
            document.createTextNode(
                disponivel === 1 ? "Disponível" : "Indisponível"
            )
        );

        cellDisponibilidade.appendChild(badge);

        // Ações
        const cellActions = document.createElement("td");
        cellActions.classList.add("product-actions");

        const buttonEdit = document.createElement("button");
        buttonEdit.type = "button";
        buttonEdit.classList.add("btn-edit-product");
        buttonEdit.title = `Editar ${nome}`;
        buttonEdit.setAttribute("aria-label", `Editar produto ${nome}`);

        const editIcon = document.createElement("i");
        editIcon.classList.add("fa-solid", "fa-pen-to-square");
        editIcon.setAttribute("aria-hidden", "true");
        buttonEdit.appendChild(editIcon);

        const buttonDelet = document.createElement("button");
        buttonDelet.type = "button";
        buttonDelet.classList.add("btn-delete-product");
        buttonDelet.title = `Eliminar ${nome}`;
        buttonDelet.setAttribute("aria-label", `Eliminar produto ${nome}`);

        const deleteIcon = document.createElement("i");
        deleteIcon.classList.add("fa-solid", "fa-trash");
        deleteIcon.setAttribute("aria-hidden", "true");
        buttonDelet.appendChild(deleteIcon);

        cellActions.append(buttonEdit, buttonDelet);

        // Montar a linha
        row.append(
            cellProduto,
            cellCategoria,
            cellRestaurante,
            cellPreço,
            cellCriado_em,
            cellDisponibilidade,
            cellActions
        );

        table.appendChild(row);
    });
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

document.querySelector("#btn-close-modal-top").addEventListener("click", () => {
    modal.close();
});

document.querySelector("#btn-cancel-edit").addEventListener("click", () => {
    modal.close();
});

modal.addEventListener("click", (event) => {
    if (event.target === modal) {
        modal.close();
    }
});