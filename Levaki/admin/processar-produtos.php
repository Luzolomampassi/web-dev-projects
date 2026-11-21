<?php 
require __DIR__ . '/includes/bootstrap.php';

if($_SERVER['REQUEST_METHOD'] !== "POST"){
    exit;
}
// ==================== Adicionar produtos ====================
$nome_produto =trim( $_POST['nome-produto'] ?? '');
$preco_produto =trim( $_POST['preco-produto'] ?? '');
$categoria_produto =trim( $_POST['categoria_id'] ?? '');
$restaurante_produto =trim( $_POST['restaurante_id'] ?? '');
$descricao_produto =trim( $_POST['descricao-produto'] ?? '');
$produto_disponivel =trim( $_POST['produto-disponivel'] ?? '1');
$produto_disponivel =trim( $_POST['produto-disponivel'] ?? '1');
$mensagem = '';
if($nome_produto === ''){
    exit;
}
if (mb_strlen($nome_produto) > 100) {
    exit('O nome não pode ultrapassar 100 caracteres.');
}
// if(!filter_var($preco_produto , FILTER_VALIDATE_FLOAT)){
//     exit;
// }
if($preco_produto < 0){
    $mensagem = 'O preço não pode ser negativo';
    exit;
}
if(!filter_var($categoria_produto , FILTER_VALIDATE_FLOAT)){
    $mensagem .= '/ A categoria do produto selecionado é inválido';
    error_log("A categoria do produto selecionado é inválido");
    exit;
}
if($restaurante_produto === ''){
    error_log("O restaurante do produto selecionado é inválido");
    exit;
}

if($produto_disponivel !== '1' && $produto_disponivel !== '0'){
    $mensagem .= '/ A disponibilidade do produto é inválida';
    error_log("A disponibilidade do produto é inválida");
    exit;
}



try{
    $dados = "INSERT INTO produtos (nome,preco,descricao,categoria_id,restaurante_id,disponivel)
    VALUES (:nome,:preco,:descricao,:categoria_id,:restaurante_id,:disponivel)
    ";
    $parametros = [
        'nome' => $nome_produto,
        'preco' => $preco_produto,
        'descricao' => $descricao_produto,
        'categoria_id' => $categoria_produto,
        'restaurante_id' => $restaurante_produto,
        'disponivel' => $produto_disponivel,
    ];

    $stmt = $pdo->prepare($dados);
    $stmt->execute($parametros);

    $mensagem = 'Produto adicionado com sucesso';
    $produtos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $id = $pdo->lastInsertId();
    echo json_encode([
        "sucesso" => true ,
        "id" => $id,
        "mensagem" => $mensagem,
        "produtos" => $produtos
    ]);


}catch(PDOException $erro){
    error_log("Falha" . $erro);
    echo json_encode([
        "sucesso" => false ,
        "mensagem" => $erro,
    ]);
    exit;
}










