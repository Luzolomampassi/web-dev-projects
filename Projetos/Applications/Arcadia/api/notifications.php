<?php
declare(strict_types=1);
require dirname(__DIR__) . '/includes/bootstrap.php';

try {
    $pdo=db();$user=require_login();$uid=(int)$user['id'];$method=$_SERVER['REQUEST_METHOD']??'GET';
    if($method==='GET'){
        $q=$pdo->prepare('SELECT n.id,n.type,n.reference_id,n.body,n.is_read,n.created_at,n.actor_id,u.username AS actor_name FROM notifications n LEFT JOIN users u ON u.id=n.actor_id WHERE n.user_id=? ORDER BY n.id DESC LIMIT 100');$q->execute([$uid]);$items=$q->fetchAll();
        $q=$pdo->prepare('SELECT COUNT(*) FROM notifications WHERE user_id=? AND is_read=0');$q->execute([$uid]);
        json_response(['notifications'=>$items,'unread'=>(int)$q->fetchColumn()]);
    }
    if($method!=='POST')json_response(['error'=>'Método não suportado.'],405);
    require_csrf();$action=(string)($_POST['action']??'');
    if($action==='read-all'){$pdo->prepare('UPDATE notifications SET is_read=1 WHERE user_id=? AND is_read=0')->execute([$uid]);json_response(['ok'=>true,'unread'=>0]);}
    if($action==='read'){$id=filter_var($_POST['id']??null,FILTER_VALIDATE_INT);if(!$id)json_response(['error'=>'Notificação inválida.'],422);$pdo->prepare('UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?')->execute([$id,$uid]);$q=$pdo->prepare('SELECT COUNT(*) FROM notifications WHERE user_id=? AND is_read=0');$q->execute([$uid]);json_response(['ok'=>true,'unread'=>(int)$q->fetchColumn()]);}
    json_response(['error'=>'Ação desconhecida.'],422);
}catch(PDOException $e){json_response(['error'=>'Não foi possível carregar as notificações.'],503);}catch(Throwable $e){json_response(['error'=>'Não foi possível concluir a operação.'],500);}
