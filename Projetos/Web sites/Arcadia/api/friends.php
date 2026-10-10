<?php
declare(strict_types=1);
require dirname(__DIR__) . '/includes/bootstrap.php';

try {
    $pdo = db();
    $user = require_login();
    $uid = (int)$user['id'];
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($method === 'GET') {
        $query = trim((string)($_GET['q'] ?? ''));
        $profileId = filter_var($_GET['profile'] ?? null, FILTER_VALIDATE_INT);
        if ($profileId) {
            $lo = min($uid, $profileId); $hi = max($uid, $profileId);
            $q = $pdo->prepare("SELECT 1 FROM friendships WHERE user_one=? AND user_two=? AND status='accepted'");
            $q->execute([$lo,$hi]);
            if (!$q->fetchColumn()) json_response(['error'=>'Só podes ver os detalhes de amigos aceites.'],403);
            $q = $pdo->prepare('SELECT id,public_id,username,bio,created_at FROM users WHERE id=?'); $q->execute([$profileId]); $profile = $q->fetch();
            if (!$profile) json_response(['error'=>'Jogador não encontrado.'],404);
            $q = $pdo->prepare("SELECT id,title,platform,genre,status FROM games WHERE user_id=? AND is_wishlist=0 ORDER BY CASE status WHEN 'playing' THEN 0 WHEN 'completed' THEN 1 ELSE 2 END, updated_at DESC");
            $q->execute([$profileId]); $games = $q->fetchAll();
            $q = $pdo->prepare('SELECT c.id,c.name,COUNT(g.id) AS game_count FROM collections c LEFT JOIN game_collections gc ON gc.collection_id=c.id LEFT JOIN games g ON g.id=gc.game_id AND g.user_id=c.user_id WHERE c.user_id=? GROUP BY c.id ORDER BY c.name');
            $q->execute([$profileId]);
            json_response(['profile'=>$profile,'games'=>$games,'collections'=>$q->fetchAll()]);
        }

        if (!empty($_GET['suggested'])) {
            $q = $pdo->prepare("SELECT u.id,u.public_id,u.username,u.bio FROM users u WHERE u.id<>? AND NOT EXISTS (SELECT 1 FROM friendships f WHERE f.user_one=LEAST(u.id,?) AND f.user_two=GREATEST(u.id,?)) ORDER BY RAND() LIMIT 8");
            $q->execute([$uid,$uid,$uid]); json_response(['results'=>$q->fetchAll()]);
        }
        if ($query !== '') {
            if (mb_strlen($query) < 2) json_response(['results'=>[]]);
            $like = '%' . str_replace(['\\','%','_'], ['\\\\','\\%','\\_'], $query) . '%';
            $publicId = strtoupper(preg_replace('/[^a-zA-Z0-9-]/', '', $query));
            $q = $pdo->prepare("SELECT u.id,u.public_id,u.username,u.bio, f.status AS friendship_status,f.requester_id,f.recipient_id FROM users u LEFT JOIN friendships f ON f.user_one=LEAST(u.id,?) AND f.user_two=GREATEST(u.id,?) WHERE u.id<>? AND (u.username LIKE ? OR u.public_id=?) ORDER BY (u.public_id=?) DESC,u.username LIMIT 25");
            $q->execute([$uid,$uid,$uid,$like,$publicId,$publicId]);
            json_response(['results'=>$q->fetchAll()]);
        }

        $q = $pdo->prepare("SELECT u.id,u.public_id,u.username,u.bio,f.created_at FROM friendships f JOIN users u ON u.id=IF(f.requester_id=?,f.recipient_id,f.requester_id) WHERE (f.user_one=? OR f.user_two=?) AND f.status='accepted' ORDER BY u.username");
        $q->execute([$uid,$uid,$uid]); $friends = $q->fetchAll();
        $q = $pdo->prepare("SELECT f.requester_id AS id,u.public_id,u.username,f.created_at FROM friendships f JOIN users u ON u.id=f.requester_id WHERE f.recipient_id=? AND f.status='pending' ORDER BY f.created_at DESC");
        $q->execute([$uid]); $incoming = $q->fetchAll();
        $q = $pdo->prepare("SELECT f.recipient_id AS id,u.public_id,u.username,f.created_at FROM friendships f JOIN users u ON u.id=f.recipient_id WHERE f.requester_id=? AND f.status='pending' ORDER BY f.created_at DESC");
        $q->execute([$uid]); $outgoing = $q->fetchAll();
        json_response(['friends'=>$friends,'incoming'=>$incoming,'outgoing'=>$outgoing]);
    }

    if ($method !== 'POST') json_response(['error'=>'Método não suportado.'],405);
    require_csrf();
    $action = (string)($_POST['action'] ?? '');
    $otherId = filter_var($_POST['user_id'] ?? null,FILTER_VALIDATE_INT);
    if (!$otherId || $otherId === $uid) json_response(['error'=>'Jogador inválido.'],422);
    $lo=min($uid,$otherId); $hi=max($uid,$otherId);

    if ($action === 'send') {
        $q=$pdo->prepare('SELECT id FROM users WHERE id=?');$q->execute([$otherId]);if(!$q->fetchColumn())json_response(['error'=>'Jogador não encontrado.'],404);
        $q=$pdo->prepare('SELECT requester_id,recipient_id,status FROM friendships WHERE user_one=? AND user_two=?');$q->execute([$lo,$hi]);$relation=$q->fetch();
        if($relation){
            if($relation['status']==='accepted')json_response(['error'=>'Já são amigos.'],409);
            if((int)$relation['requester_id']===$otherId && (int)$relation['recipient_id']===$uid){$pdo->beginTransaction();$pdo->prepare("UPDATE friendships SET status='accepted' WHERE user_one=? AND user_two=?")->execute([$lo,$hi]);$pdo->prepare("UPDATE notifications SET is_read=1 WHERE user_id=? AND actor_id=? AND type='friend_request'")->execute([$uid,$otherId]);$pdo->prepare("INSERT INTO notifications (user_id,actor_id,type,reference_id,body) VALUES (?,?,'friend_accepted',?,?)")->execute([$otherId,$uid,$uid,$user['username'].' aceitou o teu pedido de amizade.']);$pdo->commit();json_response(['ok'=>true,'message'=>'Pedido aceite.']);}
            json_response(['error'=>'Já enviaste um pedido a este jogador.'],409);
        }
        $pdo->beginTransaction();$pdo->prepare("INSERT INTO friendships (user_one,user_two,requester_id,recipient_id,status) VALUES (?,?,?,?,'pending')")->execute([$lo,$hi,$uid,$otherId]);
        $pdo->prepare("INSERT INTO notifications (user_id,actor_id,type,reference_id,body) VALUES (?,?,'friend_request',?,?)")->execute([$otherId,$uid,$uid,$user['username'].' enviou-te um pedido de amizade.']);
        $pdo->commit();
        json_response(['ok'=>true]);
    }
    if ($action === 'accept') {
        $q=$pdo->prepare("SELECT requester_id FROM friendships WHERE user_one=? AND user_two=? AND recipient_id=? AND status='pending'");$q->execute([$lo,$hi,$uid]);$requester=(int)$q->fetchColumn();
        if(!$requester)json_response(['error'=>'O pedido já não está disponível.'],404);
        $pdo->beginTransaction();$pdo->prepare("UPDATE friendships SET status='accepted' WHERE user_one=? AND user_two=? AND recipient_id=? AND status='pending'")->execute([$lo,$hi,$uid]);
        $pdo->prepare("UPDATE notifications SET is_read=1 WHERE user_id=? AND actor_id=? AND type='friend_request'")->execute([$uid,$requester]);
        $pdo->prepare("INSERT INTO notifications (user_id,actor_id,type,reference_id,body) VALUES (?,?,'friend_accepted',?,?)")->execute([$requester,$uid,$uid,$user['username'].' aceitou o teu pedido de amizade.']);
        $pdo->commit();
        json_response(['ok'=>true]);
    }
    if ($action === 'decline' || $action === 'cancel' || $action === 'remove') {
        if($action==='decline')$q=$pdo->prepare("DELETE FROM friendships WHERE user_one=? AND user_two=? AND recipient_id=? AND status='pending'");
        elseif($action==='cancel')$q=$pdo->prepare("DELETE FROM friendships WHERE user_one=? AND user_two=? AND requester_id=? AND status='pending'");
        else $q=$pdo->prepare("DELETE FROM friendships WHERE user_one=? AND user_two=? AND status='accepted'");
        $pdo->beginTransaction();$q->execute([$lo,$hi,$uid]);
        if($q->rowCount() && $action==='decline')$pdo->prepare("UPDATE notifications SET is_read=1 WHERE user_id=? AND actor_id=? AND type='friend_request'")->execute([$uid,$otherId]);
        if($q->rowCount() && $action==='cancel')$pdo->prepare("UPDATE notifications SET is_read=1 WHERE user_id=? AND actor_id=? AND type='friend_request'")->execute([$otherId,$uid]);
        if(!$q->rowCount()){$pdo->rollBack();json_response(['error'=>'A relação já não está disponível.'],404);}$pdo->commit();json_response(['ok'=>true]);
    }
    json_response(['error'=>'Ação desconhecida.'],422);
} catch (PDOException $e) {
    if(isset($pdo)&&$pdo->inTransaction())$pdo->rollBack();
    json_response(['error'=>'Não foi possível concluir a operação. Confirma a ligação à base de dados.'],503);
} catch (Throwable $e) {
    if(isset($pdo)&&$pdo->inTransaction())$pdo->rollBack();
    json_response(['error'=>'Não foi possível concluir a operação.'],500);
}
