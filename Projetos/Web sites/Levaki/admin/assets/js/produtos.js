const form = document.querySelector("#product-form");
const modal = document.querySelector("#modal-product");
const idInput = document.querySelector("#produto-id");
const title = modal.querySelector(".product-modal-title h2");
const submitLabel = document.querySelector("#btn-save-product span");
const table = document.querySelector(".orders-list")

// ADICIONANDO PRODUTOS

form.addEventListener("submit", async (event) =>{
    event.preventDefault()
    const nome_produto =  document.querySelector("#nome-produto").value.trim()
    const preco_produto =  document.querySelector("#preco-produto").value.trim()
    const categoria_produto =  document.querySelector("#categoria_id").value.trim()
    const restaurante_produto = document.querySelector("#restaurante_id").value.trim()
    const descricao_produto = document.querySelector("#descricao-produto").value.trim()
    const produto_disponivel = document.querySelector("#produto-disponivel").value.trim()

    if(!notNull()){
        return
    }

    const dados = new FormData(form)

    try{
        const resposta = await fetch("processar-produtos.php",{
            method:"POST",
            body:dados
        })

        if(!resposta.ok){
            throw new Error("Falha na comunicação com o servidor")
        }

        const resultado  = await resposta.json()

        if(!resultado.sucesso){
            throw new Error("Falha na buscar de dados no servidor")
        }
    }catch(error){
        console.error(error)
    }
})

function notNull(){
    if(nome_produto === ''){
        return false;
    }
    if(preco_produto === ''){
        return false;
    }
    if(preco_produto < 0){
        return false;
    }
    if(categoria_produto === ''){
        return false;
    }
    return true
   
}

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
    const id = resultadoConsulta.produtos.id
    
    console.log(resultadoConsulta)
    adicionarProduto(resultadoConsulta.produtos,id)
    
})


function adicionarProduto(resultado,id){
   
    
    resultado.forEach(element => {
    const row = document.createElement("tr")
    row.dataset.id = id
    const cellProduto = document.createElement("td")
    const cellCategoria = document.createElement("td")
    const cellRestaurante = document.createElement("td")
    const cellPreço = document.createElement("td")
    const cellCriado_em = document.createElement("td")
    const cellDisponibilidade = document.createElement("td")
    const cellActions = document.createElement("td")
    const buttonEdit = document.createElement("button")
    const buttonDelet = document.createElement("button")

    cellProduto.textContent = resultado.nome
    if(resultado.categoria_id === 1){
        cellCategoria.textContent = "Entradas"
    }
    else if(resultado.categoria_id === 2){
        cellCategoria.textContent = "Pratas principais"
    }
    else if(resultado.categoria_id === 3){
        cellCategoria.textContent = "Sobremesas"
    }
    else if(resultado.categoria_id === 4){
        cellCategoria.textContent = "Bebidas"
    }
    if(resultado.categoria_id === 1){
        cellRestaurante.textContent = "Levaki Grill"
    }
    else if(resultado.categoria_id === 2){
        cellRestaurante.textContent = "Bella Pasta"
    }
    else if(resultado.categoria_id === 3){
        cellRestaurante.textContent = "Sabor da casa"
    }
    else if(resultado.categoria_id === 4){
        cellRestaurante.textContent = "Bottega Verde"
    }
    cellPreço.textContent = resultado.preco
    cellCriado_em.textContent = resultado.criado_em
    cellDisponibilidade.textContent = resultado.disponivel

    row.appendChild(cellProduto)
    row.appendChild(cellCategoria)
    row.appendChild(cellRestaurante)
    row.appendChild(cellPreço)
    row.appendChild(cellCriado_em)
    row.appendChild(cellDisponibilidade)
    row.appendChild(cellActions)
    table.appendChild(row)
        
        
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