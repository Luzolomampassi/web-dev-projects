<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/bootstrap.php';
header('Content-Type: application/json; charset=utf-8');

function responder(int $status, bool $sucesso, string $mensagem): never
{
    http_response_code($status);
    echo json_encode(['sucesso' => $sucesso, 'mensagem' => $mensagem], JSON_UNESCAPED_UNICODE);
    exit;
}

function guardarImagemProduto(): ?string
{
    $imagem = $_FILES['imagem-produto'] ?? null;
    if (!$imagem || $imagem['error'] === UPLOAD_ERR_NO_FILE) {
        return null;
    }
    if ($imagem['error'] !== UPLOAD_ERR_OK || $imagem['size'] > 5 * 1024 * 1024) {
        responder(422, false, 'A imagem deve ter até 5 MB.');
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($imagem['tmp_name']);
    $extensoes = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
    if (!isset($extensoes[$mime]) || @getimagesize($imagem['tmp_name']) === false) {
        responder(422, false, 'Escolha uma imagem JPG, PNG ou WebP válida.');
    }

    $diretorio = __DIR__ . '/uploads/produtos';
    if (!is_dir($diretorio) && !mkdir($diretorio, 0755, true) && !is_dir($diretorio)) {
        responder(500, false, 'Não foi possível preparar o armazenamento das imagens.');
    }

    $nome = bin2hex(random_bytes(16)) . '.' . $extensoes[$mime];
    if (!move_uploaded_file($imagem['tmp_name'], $diretorio . '/' . $nome)) {
        responder(500, false, 'Não foi possível guardar a imagem enviada.');
    }
    return 'uploads/produtos/' . $nome;
}

function eliminarImagemProduto(?string $caminho): void
{
    if (!$caminho || !preg_match('#^uploads/produtos/[a-f0-9]{32}\.(jpg|png|webp)$#', $caminho)) {
        return;
    }
    $arquivo = __DIR__ . '/' . $caminho;
    if (is_file($arquivo)) {
        unlink($arquivo);
    }
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responder(405, false, 'Método não permitido.');
}

$acao = $_POST['acao'] ?? 'guardar';
$id = filter_var($_POST['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);

try {
    if ($acao === 'eliminar') {
        if (!$id) {
            responder(422, false, 'Identificador do produto inválido.');
        }
        $buscar = $pdo->prepare('SELECT imagem FROM produtos WHERE id = :id');
        $buscar->execute(['id' => $id]);
        $imagemAntiga = $buscar->fetchColumn();
        if ($imagemAntiga === false) {
            responder(404, false, 'Produto não encontrado.');
        }
        $stmt = $pdo->prepare('DELETE FROM produtos WHERE id = :id');
        $stmt->execute(['id' => $id]);
        eliminarImagemProduto($imagemAntiga ?: null);
        responder(200, true, 'Produto eliminado com sucesso.');
    }

    $nome = trim((string) ($_POST['nome-produto'] ?? ''));
    $preco = filter_var($_POST['preco-produto'] ?? null, FILTER_VALIDATE_FLOAT);
    $categoria = filter_var($_POST['categoria_id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    $restaurante = filter_var($_POST['restaurante_id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    $descricao = trim((string) ($_POST['descricao-produto'] ?? ''));
    $disponivel = isset($_POST['produto-disponivel']) ? 1 : 0;

    if ($nome === '' || mb_strlen($nome) > 150) {
        responder(422, false, 'Informe um nome válido para o produto.');
    }
    if ($preco === false || $preco < 0) {
        responder(422, false, 'Informe um preço válido.');
    }
    if (!$categoria || !$restaurante) {
        responder(422, false, 'Selecione uma categoria e um restaurante válidos.');
    }
    if (mb_strlen($descricao) > 2000) {
        responder(422, false, 'A descrição não pode ultrapassar 2000 caracteres.');
    }

    $imagemNova = guardarImagemProduto();
    $imagemAntiga = null;
    if ($id) {
        $buscar = $pdo->prepare('SELECT imagem FROM produtos WHERE id = :id');
        $buscar->execute(['id' => $id]);
        $imagemAntiga = $buscar->fetchColumn();
        if ($imagemAntiga === false) {
            eliminarImagemProduto($imagemNova);
            responder(404, false, 'Produto não encontrado.');
        }

        $sqlImagem = $imagemNova !== null ? ', imagem = :imagem' : '';
        $stmt = $pdo->prepare('UPDATE produtos SET nome = :nome, descricao = :descricao, preco = :preco, categoria_id = :categoria_id, restaurante_id = :restaurante_id, disponivel = :disponivel' . $sqlImagem . ' WHERE id = :id');
        $dados = ['nome' => $nome, 'descricao' => $descricao, 'preco' => $preco, 'categoria_id' => $categoria, 'restaurante_id' => $restaurante, 'disponivel' => $disponivel, 'id' => $id];
        if ($imagemNova !== null) {
            $dados['imagem'] = $imagemNova;
        }
        $stmt->execute($dados);
        if (!$stmt->rowCount()) {
            $check = $pdo->prepare('SELECT 1 FROM produtos WHERE id = :id');
            $check->execute(['id' => $id]);
            if (!$check->fetchColumn()) {
                responder(404, false, 'Produto não encontrado.');
            }
        }
        if ($imagemNova !== null) {
            eliminarImagemProduto($imagemAntiga ?: null);
        }
        responder(200, true, 'Produto atualizado com sucesso.');
    }

    $stmt = $pdo->prepare('INSERT INTO produtos (nome, descricao, preco, categoria_id, restaurante_id, disponivel, imagem) VALUES (:nome, :descricao, :preco, :categoria_id, :restaurante_id, :disponivel, :imagem)');
    $stmt->execute(['nome' => $nome, 'descricao' => $descricao, 'preco' => $preco, 'categoria_id' => $categoria, 'restaurante_id' => $restaurante, 'disponivel' => $disponivel, 'imagem' => $imagemNova]);
    responder(201, true, 'Produto guardado com sucesso.');
} catch (PDOException $error) {
    eliminarImagemProduto($imagemNova ?? null);
    error_log($error->getMessage());
    responder(500, false, 'Não foi possível guardar as alterações do produto.');
} catch (Throwable $error) {
    error_log($error->getMessage());
    responder(500, false, 'Ocorreu um erro ao processar o produto.');
}
