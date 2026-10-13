<?php
declare(strict_types=1);
require dirname(__DIR__) . '/includes/bootstrap.php';

try {
    $pdo = db();
    $user = require_login();
    $uid = (int)$user['id'];
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($method === 'GET') {
        $q = $pdo->prepare('SELECT * FROM games WHERE user_id=? ORDER BY id');
        $q->execute([$uid]);
        $games = array_map('game_payload', $q->fetchAll());
        $q = $pdo->prepare('SELECT id,name,created_at FROM collections WHERE user_id=? ORDER BY id');
        $q->execute([$uid]);
        $collections = $q->fetchAll();
        $q = $pdo->prepare('SELECT gc.game_id,gc.collection_id FROM game_collections gc JOIN collections c ON c.id=gc.collection_id WHERE c.user_id=?');
        $q->execute([$uid]);
        header('Content-Type: application/json; charset=utf-8');
        header('Content-Disposition: attachment; filename="arcadia-backup-' . date('Y-m-d') . '.json"');
        header('Cache-Control: no-store');
        echo json_encode(['format'=>'arcadia-backup','version'=>1,'exported_at'=>date(DATE_ATOM),'games'=>$games,'collections'=>$collections,'memberships'=>$q->fetchAll()], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    if ($method !== 'POST') json_response(['error'=>'Método não suportado.'],405);
    require_csrf();
    $raw = (string)($_POST['backup'] ?? '');
    if ($raw === '' || strlen($raw) > 20 * 1024 * 1024) json_response(['error'=>'O ficheiro está vazio ou excede 20 MB.'],422);
    $backup = json_decode($raw, true);
    if (!is_array($backup) || ($backup['format'] ?? '') !== 'arcadia-backup' || ($backup['version'] ?? null) !== 1 || !is_array($backup['games'] ?? null) || !is_array($backup['collections'] ?? null) || !is_array($backup['memberships'] ?? null)) {
        json_response(['error'=>'Este ficheiro não é uma cópia válida do Arcadia.'],422);
    }
    if (count($backup['games']) > 10000 || count($backup['collections']) > 1000) json_response(['error'=>'A cópia excede o limite de jogos ou coleções.'],422);

    $statuses = ['backlog','playing','completed','paused','abandoned'];
    foreach ($backup['games'] as $game) {
        if (!is_array($game) || trim((string)($game['title'] ?? '')) === '' || strlen((string)$game['title']) > 160 || !in_array($game['status'] ?? 'backlog',$statuses,true)) json_response(['error'=>'A cópia contém um jogo inválido.'],422);
        if (!is_numeric($game['hours'] ?? 0) || (float)$game['hours'] < 0 || !is_numeric($game['rating'] ?? 0) || (float)$game['rating'] < 0 || (float)$game['rating'] > 10) json_response(['error'=>'A cópia contém horas ou avaliação inválidas.'],422);
    }
    foreach ($backup['collections'] as $collection) {
        if (!is_array($collection) || trim((string)($collection['name'] ?? '')) === '' || mb_strlen((string)$collection['name']) > 80) json_response(['error'=>'A cópia contém uma coleção inválida.'],422);
    }

    $pdo->beginTransaction();
    $pdo->prepare('DELETE FROM collections WHERE user_id=?')->execute([$uid]);
    $pdo->prepare('DELETE FROM games WHERE user_id=?')->execute([$uid]);
    $gameIds = [];
    $insertGame = $pdo->prepare('INSERT INTO games (title,platform,genre,status,hours,rating,release_date,description,notes,favorite,is_wishlist,cover_path,steam_app_id,user_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
    foreach ($backup['games'] as $game) {
        $steamId=$game['steam_app_id']??null;
        if($steamId!==null&&(!filter_var($steamId,FILTER_VALIDATE_INT)||$steamId<1))json_response(['error'=>'A cópia contém um identificador Steam inválido.'],422);
        $insertGame->execute([clean_text($game['title'],160),clean_text($game['platform']??'',80),clean_text($game['genre']??'',80),$game['status']??'backlog',(float)($game['hours']??0),(float)($game['rating']??0),$game['release_date']??null,clean_text($game['description']??'',2000),clean_text($game['notes']??'',3000),!empty($game['favorite'])?1:0,!empty($game['is_wishlist'])?1:0,null,$steamId,$uid]);
        $gameIds[(string)($game['id']??'')] = (int)$pdo->lastInsertId();
    }
    $collectionIds = [];
    $insertCollection = $pdo->prepare('INSERT INTO collections (name,user_id) VALUES (?,?)');
    foreach ($backup['collections'] as $collection) {
        $insertCollection->execute([clean_text($collection['name'],80),$uid]);
        $collectionIds[(string)($collection['id']??'')] = (int)$pdo->lastInsertId();
    }
    $insertMember = $pdo->prepare('INSERT IGNORE INTO game_collections (collection_id,game_id) VALUES (?,?)');
    foreach ($backup['memberships'] as $membership) {
        if (!is_array($membership)) continue;
        $gid = $gameIds[(string)($membership['game_id']??'')] ?? null;
        $cid = $collectionIds[(string)($membership['collection_id']??'')] ?? null;
        if ($gid && $cid) $insertMember->execute([$cid,$gid]);
    }
    $pdo->commit();
    json_response(['ok'=>true]);
} catch (InvalidArgumentException $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    json_response(['error'=>$e->getMessage()],422);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    json_response(['error'=>'Não foi possível exportar ou importar os dados.'],500);
}
