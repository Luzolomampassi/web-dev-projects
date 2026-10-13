<?php
declare(strict_types=1);
require dirname(__DIR__) . '/includes/bootstrap.php';

try {
    $pdo = db(); $user = require_login(); $uid=(int)$user['id'];
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if ($method === 'GET') {
        $stmt=$pdo->prepare('SELECT * FROM games WHERE user_id=? ORDER BY created_at DESC, id DESC'); $stmt->execute([$uid]); $games=$stmt->fetchAll();
        $stmt=$pdo->prepare('SELECT c.id, c.name, c.created_at, COUNT(gc.game_id) AS game_count FROM collections c LEFT JOIN game_collections gc ON gc.collection_id = c.id WHERE c.user_id=? GROUP BY c.id ORDER BY c.name'); $stmt->execute([$uid]); $collections=$stmt->fetchAll();
        $stmt=$pdo->prepare('SELECT gc.game_id, gc.collection_id FROM game_collections gc JOIN collections c ON c.id=gc.collection_id WHERE c.user_id=?');$stmt->execute([$uid]);$members=$stmt->fetchAll();
        json_response(['games' => array_map('game_payload', $games), 'collections' => $collections, 'memberships' => $members]);
    }
    if ($method === 'POST') {
        require_csrf();
        $action = $_POST['action'] ?? 'save';
        if ($action === 'delete') {
            $id = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT);
            if (!$id) json_response(['error' => 'Jogo inválido.'], 422);
            $stmt = $pdo->prepare('SELECT cover_path FROM games WHERE id=? AND user_id=?'); $stmt->execute([$id,$uid]); $old = $stmt->fetchColumn();
            if($old===false) json_response(['error'=>'Jogo não encontrado.'],404);
            $pdo->prepare('DELETE FROM games WHERE id=? AND user_id=?')->execute([$id,$uid]);
            if ($old && is_file(UPLOAD_DIR . '/' . basename((string)$old))) @unlink(UPLOAD_DIR . '/' . basename((string)$old));
            json_response(['ok' => true]);
        }
        if ($action === 'toggle-favorite') {
            $id = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT);
            if (!$id) json_response(['error' => 'Jogo inválido.'], 422);
            $pdo->prepare('UPDATE games SET favorite = NOT favorite WHERE id=? AND user_id=?')->execute([$id,$uid]);
            json_response(['ok' => true]);
        }
        $id = (int)($_POST['id'] ?? 0);
        $title = clean_text($_POST['title'] ?? '', 160);
        if ($title === '') json_response(['error' => 'O título é obrigatório.'], 422);
        $status = (string)($_POST['status'] ?? 'backlog');
        $allowed = ['backlog','playing','completed','paused','abandoned'];
        if (!in_array($status, $allowed, true)) json_response(['error' => 'Estado inválido.'], 422);
        $hoursRaw = trim((string)($_POST['hours'] ?? '0'));
        $hours = $hoursRaw === '' ? 0 : filter_var($hoursRaw, FILTER_VALIDATE_FLOAT);
        $ratingRaw = trim((string)($_POST['rating'] ?? ''));
        $rating = $ratingRaw === '' ? 0 : filter_var($ratingRaw, FILTER_VALIDATE_FLOAT);
        if ($hours === false || $hours < 0 || $rating === false || $rating < 0 || $rating > 10) json_response(['error' => 'Verifica as horas e a avaliação (0 a 10).'], 422);
        $release = trim((string)($_POST['release_date'] ?? '')) ?: null;
        if ($release !== null && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $release)) json_response(['error' => 'Data de lançamento inválida.'], 422);
        $cover = null;
        if (!empty($_FILES['cover']['name'])) {
            if ($_FILES['cover']['error'] !== UPLOAD_ERR_OK || $_FILES['cover']['size'] > 5 * 1024 * 1024) json_response(['error' => 'A capa não foi carregada. Confirma que tem menos de 5 MB.'], 422);
            $mime = (new finfo(FILEINFO_MIME_TYPE))->file($_FILES['cover']['tmp_name']);
            $extensions = ['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp','image/gif'=>'gif'];
            if (!isset($extensions[$mime])) json_response(['error' => 'Formato de imagem não suportado. Usa JPG, PNG, WebP ou GIF.'], 422);
            if (!is_dir(UPLOAD_DIR) && !mkdir(UPLOAD_DIR, 0755, true)) throw new RuntimeException('Não foi possível preparar a pasta de capas.');
            $filename = bin2hex(random_bytes(18)) . '.' . $extensions[$mime];
            if (!move_uploaded_file($_FILES['cover']['tmp_name'], UPLOAD_DIR . '/' . $filename)) throw new RuntimeException('Não foi possível guardar a capa.');
            $cover = $filename;
        }
        $favorite = isset($_POST['favorite']) ? 1 : 0;
        $wishlist = isset($_POST['is_wishlist']) ? 1 : 0;
        $data = [$title,clean_text($_POST['platform'] ?? '',80),clean_text($_POST['genre'] ?? '',80),$status,$hours,$rating,$release,clean_text($_POST['description'] ?? '',2000),clean_text($_POST['notes'] ?? '',3000),$favorite,$wishlist];
        if ($id) {
            $q=$pdo->prepare('SELECT cover_path FROM games WHERE id=? AND user_id=?'); $q->execute([$id,$uid]); $old=$q->fetchColumn();
            if($old===false) json_response(['error'=>'Jogo não encontrado.'],404);
            if ($cover) {
                $sql='UPDATE games SET title=?,platform=?,genre=?,status=?,hours=?,rating=?,release_date=?,description=?,notes=?,favorite=?,is_wishlist=?,cover_path=?,updated_at=NOW() WHERE id=?';
                $pdo->prepare($sql.' AND user_id=?')->execute([...$data,$cover,$id,$uid]);
                if ($old) @unlink(UPLOAD_DIR . '/' . basename((string)$old));
            } else {
                $sql='UPDATE games SET title=?,platform=?,genre=?,status=?,hours=?,rating=?,release_date=?,description=?,notes=?,favorite=?,is_wishlist=?,updated_at=NOW() WHERE id=?';
                $pdo->prepare($sql.' AND user_id=?')->execute([...$data,$id,$uid]);
            }
            $gameId=$id;
        } else {
            $pdo->prepare('INSERT INTO games (title,platform,genre,status,hours,rating,release_date,description,notes,favorite,is_wishlist,cover_path,user_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)')->execute([...$data,$cover,$uid]);
            $gameId=(int)$pdo->lastInsertId();
        }
        $stmt=$pdo->prepare('SELECT * FROM games WHERE id=?'); $stmt->execute([$gameId]);
        json_response(['ok'=>true,'game'=>game_payload($stmt->fetch())]);
    }
    json_response(['error'=>'Método não suportado.'], 405);
} catch (InvalidArgumentException $e) { json_response(['error'=>$e->getMessage()],422); }
catch (PDOException $e) { json_response(['error'=>'Não foi possível aceder à base de dados. Confirma a configuração e importa o esquema SQL.'],503); }
catch (RuntimeException $e) { json_response(['error'=>$e->getMessage()],502); }
catch (Throwable $e) { json_response(['error'=>$e->getMessage()],500); }
