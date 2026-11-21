<?php
declare(strict_types=1);
require dirname(__DIR__) . '/includes/bootstrap.php';

function require_friend(PDO $pdo,int $uid,int $other): void
{
    if($other<1||$other===$uid)json_response(['error'=>'Amigo inválido.'],422);
    $q=$pdo->prepare("SELECT 1 FROM friendships WHERE user_one=LEAST(?,?) AND user_two=GREATEST(?,?) AND status='accepted'");$q->execute([$uid,$other,$uid,$other]);
    if(!$q->fetchColumn())json_response(['error'=>'Só podes conversar com amigos aceites.'],403);
}

try{
    $pdo=db();$user=require_login();$uid=(int)$user['id'];$method=$_SERVER['REQUEST_METHOD']??'GET';
    if($method==='GET'){
        $with=filter_var($_GET['with']??null,FILTER_VALIDATE_INT);
        if(!$with){
            $q=$pdo->prepare("SELECT u.id,u.username,u.bio FROM friendships f JOIN users u ON u.id=IF(f.requester_id=?,f.recipient_id,f.requester_id) WHERE (f.user_one=? OR f.user_two=?) AND f.status='accepted' ORDER BY u.username");$q->execute([$uid,$uid,$uid]);$friends=$q->fetchAll();
            foreach($friends as &$friend){$id=(int)$friend['id'];$q=$pdo->prepare('SELECT body,created_at,sender_id FROM chat_messages WHERE (sender_id=? AND recipient_id=?) OR (sender_id=? AND recipient_id=?) ORDER BY id DESC LIMIT 1');$q->execute([$uid,$id,$id,$uid]);$friend['last_message']=$q->fetch()?:null;$q=$pdo->prepare('SELECT COUNT(*) FROM chat_messages WHERE sender_id=? AND recipient_id=? AND read_at IS NULL');$q->execute([$id,$uid]);$friend['unread']=(int)$q->fetchColumn();}unset($friend);
            json_response(['friends'=>$friends]);
        }
        require_friend($pdo,$uid,(int)$with);
        $pdo->prepare('UPDATE chat_messages SET read_at=NOW() WHERE sender_id=? AND recipient_id=? AND read_at IS NULL')->execute([(int)$with,$uid]);
        $pdo->prepare("UPDATE notifications SET is_read=1 WHERE user_id=? AND actor_id=? AND type='message'")->execute([$uid,(int)$with]);
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = max(1, min(100, (int)($_GET['limit'] ?? 50)));
        $offset = ($page - 1) * $limit;
        $after=max(0,(int)($_GET['after']??0));
        if($after){$q=$pdo->prepare('SELECT id,sender_id,recipient_id,body,created_at,read_at FROM chat_messages WHERE ((sender_id=? AND recipient_id=?) OR (sender_id=? AND recipient_id=?)) AND id>? ORDER BY id ASC LIMIT 100');$q->execute([$uid,(int)$with,(int)$with,$uid,$after]);$messages=$q->fetchAll();}
        else{$q=$pdo->prepare('SELECT id,sender_id,recipient_id,body,created_at,read_at FROM chat_messages WHERE (sender_id=? AND recipient_id=?) OR (sender_id=? AND recipient_id=?) ORDER BY id DESC LIMIT ? OFFSET ?');$q->execute([$uid,(int)$with,(int)$with,$uid, $limit, $offset]);$messages=array_reverse($q->fetchAll());}
        $q=$pdo->prepare('SELECT COUNT(*) AS total FROM chat_messages WHERE (sender_id=? AND recipient_id=?) OR (sender_id=? AND recipient_id=?)');$q->execute([$uid,(int)$with,(int)$with,$uid]);$total=(int)$q->fetchColumn();
        $q=$pdo->prepare('SELECT id,username FROM users WHERE id=?');$q->execute([(int)$with]);
        json_response(['friend'=>$q->fetch(),'messages'=>$messages, 'pagination' => ['page' => $page, 'limit' => $limit, 'total' => $total, 'pages' => (int)ceil($total / $limit)]]);
    }
    if($method!=='POST')json_response(['error'=>'Método não suportado.'],405);
    require_csrf();
    $recipient=filter_var($_POST['recipient_id']??null,FILTER_VALIDATE_INT);
    $groupId=filter_var($_POST['group_id']??null,FILTER_VALIDATE_INT);
    $body=clean_text($_POST['body']??'',2000);if($body==='')json_response(['error'=>'Escreve uma mensagem antes de enviar.'],422);

    if ($groupId) {
        $q=$pdo->prepare('SELECT 1 FROM chat_group_members WHERE group_id=? AND user_id=?');$q->execute([$groupId,$uid]);
        if(!$q->fetchColumn())json_response(['error' => 'Não és membro deste grupo.'],403);
        $q=$pdo->prepare('SELECT COUNT(*) FROM chat_messages WHERE group_id=? AND sender_id=? AND created_at>DATE_SUB(NOW(),INTERVAL 1 MINUTE)');$q->execute([$groupId,$uid]);if((int)$q->fetchColumn()>=30)json_response(['error'=>'Atingiste o limite de mensagens por minuto. Tenta novamente daqui a pouco.'],429);
        $pdo->beginTransaction();
        $pdo->prepare('INSERT INTO chat_messages (sender_id,recipient_id,body,group_id) VALUES (?,?,?,?)')->execute([$uid,0,$body,$groupId]);$messageId=(int)$pdo->lastInsertId();
        $q=$pdo->prepare('SELECT user_id FROM chat_group_members WHERE group_id=? AND user_id<>?');$q->execute([$groupId,$uid]);
        $notif=$pdo->prepare("INSERT INTO notifications (user_id,actor_id,type,reference_id,body) VALUES (?,?,'message',?,?)");
        while($m=$q->fetch()) {
            $notif->execute([(int)$m['user_id'],$uid,$messageId,$user['username'].' enviou uma mensagem no grupo.']);
        }
        $pdo->commit();
        $q=$pdo->prepare('SELECT id,sender_id,recipient_id,body,created_at,read_at,group_id FROM chat_messages WHERE id=?');$q->execute([$messageId]);json_response(['ok'=>true,'message'=>$q->fetch(),'group_id'=>$groupId]);
    }

    if (!$recipient || $recipient === $uid) json_response(['error' => 'Destinatário inválido.'], 422);
    require_friend($pdo,$uid,(int)$recipient);
    $q=$pdo->prepare('SELECT COUNT(*) FROM chat_messages WHERE sender_id=? AND recipient_id=? AND created_at>DATE_SUB(NOW(),INTERVAL 1 MINUTE)');$q->execute([$uid,(int)$recipient]);if((int)$q->fetchColumn()>=30)json_response(['error'=>'Atingiste o limite de mensagens por minuto. Tenta novamente daqui a pouco.'],429);
    $pdo->beginTransaction();$pdo->prepare('INSERT INTO chat_messages (sender_id,recipient_id,body) VALUES (?,?,?)')->execute([$uid,(int)$recipient,$body]);$messageId=(int)$pdo->lastInsertId();
    $pdo->prepare("INSERT INTO notifications (user_id,actor_id,type,reference_id,body) VALUES (?,?,'message',?,?)")->execute([(int)$recipient,$uid,$messageId,$user['username'].' enviou-te uma mensagem.']);
    $pdo->commit();$q=$pdo->prepare('SELECT id,sender_id,recipient_id,body,created_at,read_at,group_id FROM chat_messages WHERE id=?');$q->execute([$messageId]);json_response(['ok'=>true,'message'=>$q->fetch()]);
}catch(PDOException $e){if(isset($pdo)&&$pdo->inTransaction())$pdo->rollBack();json_response(['error'=>'Não foi possível ligar à base de dados.'],503);}catch(InvalidArgumentException $e){if(isset($pdo)&&$pdo->inTransaction())$pdo->rollBack();json_response(['error'=>$e->getMessage()],422);}catch(Throwable $e){if(isset($pdo)&&$pdo->inTransaction())$pdo->rollBack();json_response(['error'=>'Não foi possível concluir a operação.'],500);}
