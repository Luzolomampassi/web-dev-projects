<?php 
require __DIR__ . '/includes/bootstrap.php';

if($_SERVER['REQUEST_METHOD'] !== "POST"){
    exit;
}
$nome_produto = trim( $_POST['product-search'] ?? '');
$categoria_id = trim( $_POST['categoria-produtos'] ?? '');
$restaurante_id = trim( $_POST['restaurante-produtos'] ?? '');
$disponibilidade = trim( $_POST['disponibilidade'] ?? '1');
$ordem = trim( $_POST['ordem'] ?? 'recent');

$mensagem = '';
if($nome_produto === ''){
    $mensagem .= "\n Escreva o nome do produto";
    exit("Escreva o nome do produto");
}
if (mb_strlen($nome_produto) > 100) {
    $mensagem = "\n O nome não pode ultrapassar 100 caracteres.";
    exit('O nome não pode ultrapassar 100 caracteres.');
}

if($disponibilidade !== 1 && $disponibilidade !== 0){
    $mensagem = "\n A disponibilidade é inválida";
    // exit("A disponibilidade é inválida");
}

if($ordem === ''){
    $mensagem = "\n valor da ordem é inválido.";  
    exit("valor da ordem é inválido");
}

$ordem_permitidas = [
    'recent' => 'criado_em',
    'name-asc' => 'name asc',
    'name-desc' => 'name desc',
    'price-asc' => 'price asc',
    'price-desc' => 'price desc',
];
$coluna_ordem = $ordem_permitidas[$ordem];

try{
    $dadosConsulta = "SELECT id ,nome ,categoria_id, restaurante_id , preco , criado_em , disponivel
    FROM produtos WHERE nome LIKE :nome
    ";
    $parametros = [
        'nome' => "%$nome_produto%",
    ];

    if($disponibilidade !== ''){
        $dadosConsulta .=" AND disponivel = :disponivel";
        $parametros['disponivel'] = $disponibilidade;
    }
    if($categoria_id !== ''){
        $dadosConsulta .=" AND categoria_id = :categoria_id";
        $parametros['categoria_id'] = $categoria_id;
    }
    if($restaurante_id !== ''){
        $dadosConsulta .=" AND restaurante_id = :restaurante_id";
        $parametros['restaurante_id'] = $restaurante_id;
    }

    $dadosConsulta .= " ORDER BY $coluna_ordem";

    $stmt = $pdo->prepare($dadosConsulta);
    $stmt->execute($parametros);

    $produtos = $stmt->fetchAll(PDO::FETCH_ASSOC);

   
        
    if(in_array($nome_produto , $produtos)){
            echo json_encode([
                "sucesso" => true,
                "mensagem" => "Produto nao encontrado",
        ]);
        exit;
    }   

    echo json_encode([
        "sucesso" => true ,
        "mensagem" => "Produto encontrado",
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










