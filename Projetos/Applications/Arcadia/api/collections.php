<?php
declare(strict_types=1);
require dirname(__DIR__) . '/includes/bootstrap.php';
try {
    $pdo=db(); $user=require_login(); $uid=(int)$user['id']; require_csrf();
    $action=$_POST['action']??'create';
    if ($action==='create') {
        $name=clean_text($_POST['name']??'',80);
        if ($name==='') json_response(['error'=>'Dá um nome à coleção.'],422);
        $stmt=$pdo->prepare('INSERT INTO collections (name,user_id) VALUES (?,?)'); $stmt->execute([$name,$uid]);
        json_response(['ok'=>true,'id'=>(int)$pdo->lastInsertId(),'name'=>$name]);
    }
    if ($action==='delete') {
        $id=filter_var($_POST['id']??null,FILTER_VALIDATE_INT);
        if (!$id) json_response(['error'=>'Coleção inválida.'],422);
        $pdo->prepare('DELETE FROM collections WHERE id=? AND user_id=?')->execute([$id,$uid]); json_response(['ok'=>true]);
    }
    if ($action==='assign') {
        $cid=filter_var($_POST['collection_id']??null,FILTER_VALIDATE_INT); $gid=filter_var($_POST['game_id']??null,FILTER_VALIDATE_INT);
        if (!$cid||!$gid) json_response(['error'=>'Seleciona uma coleção e um jogo.'],422);
        $q=$pdo->prepare('SELECT 1 FROM collections WHERE id=? AND user_id=?');$q->execute([$cid,$uid]);
        $g=$pdo->prepare('SELECT 1 FROM games WHERE id=? AND user_id=?');$g->execute([$gid,$uid]);
        if(!$q->fetchColumn()||!$g->fetchColumn())json_response(['error'=>'Essa coleção ou jogo não pertence à tua conta.'],404);
        $pdo->prepare('INSERT IGNORE INTO game_collections (collection_id,game_id) VALUES (?,?)')->execute([$cid,$gid]); json_response(['ok'=>true]);
    }
    if ($action==='unassign') {
        $cid=filter_var($_POST['collection_id']??null,FILTER_VALIDATE_INT); $gid=filter_var($_POST['game_id']??null,FILTER_VALIDATE_INT);
        $pdo->prepare('DELETE gc FROM game_collections gc JOIN collections c ON c.id=gc.collection_id WHERE gc.collection_id=? AND gc.game_id=? AND c.user_id=?')->execute([$cid,$gid,$uid]); json_response(['ok'=>true]);
    }
    json_response(['error'=>'Ação desconhecida.'],422);
} catch (PDOException $e) { json_response(['error'=>'Não foi possível atualizar as coleções. Confirma a base de dados.'],503); }
catch (Throwable $e) { json_response(['error'=>$e->getMessage()],422); }
