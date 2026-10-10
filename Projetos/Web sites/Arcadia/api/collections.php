<?php
declare(strict_types=1);
require dirname(__DIR__) . '/includes/bootstrap.php';
try {
    $pdo=db(); require_csrf();
    $action=$_POST['action']??'create';
    if ($action==='create') {
        $name=clean_text($_POST['name']??'',80);
        if ($name==='') json_response(['error'=>'Dá um nome à coleção.'],422);
        $stmt=$pdo->prepare('INSERT INTO collections (name) VALUES (?)'); $stmt->execute([$name]);
        json_response(['ok'=>true,'id'=>(int)$pdo->lastInsertId(),'name'=>$name]);
    }
    if ($action==='delete') {
        $id=filter_var($_POST['id']??null,FILTER_VALIDATE_INT);
        if (!$id) json_response(['error'=>'Coleção inválida.'],422);
        $pdo->prepare('DELETE FROM collections WHERE id=?')->execute([$id]); json_response(['ok'=>true]);
    }
    if ($action==='assign') {
        $cid=filter_var($_POST['collection_id']??null,FILTER_VALIDATE_INT); $gid=filter_var($_POST['game_id']??null,FILTER_VALIDATE_INT);
        if (!$cid||!$gid) json_response(['error'=>'Seleciona uma coleção e um jogo.'],422);
        $pdo->prepare('INSERT IGNORE INTO game_collections (collection_id,game_id) VALUES (?,?)')->execute([$cid,$gid]); json_response(['ok'=>true]);
    }
    if ($action==='unassign') {
        $cid=filter_var($_POST['collection_id']??null,FILTER_VALIDATE_INT); $gid=filter_var($_POST['game_id']??null,FILTER_VALIDATE_INT);
        $pdo->prepare('DELETE FROM game_collections WHERE collection_id=? AND game_id=?')->execute([$cid,$gid]); json_response(['ok'=>true]);
    }
    json_response(['error'=>'Ação desconhecida.'],422);
} catch (PDOException $e) { json_response(['error'=>'Não foi possível atualizar as coleções. Confirma a base de dados.'],503); }
catch (Throwable $e) { json_response(['error'=>$e->getMessage()],422); }
